-- ============================================================================
-- CMMDIGITAL — SUPABASE AUTH + STRICT TENANT RLS
-- ============================================================================
-- Jalankan file ini SETELAH supabase-release-hardening.sql.
--
-- Tujuan:
--   1. Menghubungkan setiap baris public.users ke akun Supabase Auth.
--   2. Menghapus RLS permisif untuk anon.
--   3. Menerapkan isolasi tenant berbasis JWT (auth.uid()).
--   4. Menyediakan RPC aman untuk:
--      - form komplain publik (tanpa login),
--      - pelacakan tiket publik,
--      - pembuatan / edit / hapus / reset PIN anggota oleh Admin Super,
--      - ganti PIN milik sendiri.
--   5. Membuat akun Admin Super awal untuk NRP 10001.
--
-- Catatan penting:
--   - File ini membuat akun auth.users langsung lewat SQL karena project ini
--     hanya memakai anon key (tanpa service-role key). Password di-hash dengan
--     bcrypt (pgcrypto) dan email sintetis <nrp>@cmmdigital.app.
--   - Semua akun baru WAJIB mengganti PIN saat login pertama.
--   - Aman dijalankan berulang (idempotent), kecuali pembuatan akun Admin
--     yang hanya dilakukan bila belum terhubung.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ────────────────────────────────────────────────────────────────────────────
-- 1. KOLOM AUTENTIKASI PADA public.users
-- ────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS auth_user_id UUID;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS pin_updated_at TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_auth_user_id
  ON public.users(auth_user_id)
  WHERE auth_user_id IS NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_users_auth_user'
      AND conrelid = 'public.users'::regclass
  ) THEN
    ALTER TABLE public.users
      ADD CONSTRAINT fk_users_auth_user
      FOREIGN KEY (auth_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Tiket komplain harus unik agar pelacakan publik tidak ambigu.
CREATE UNIQUE INDEX IF NOT EXISTS idx_complaints_ticket_unique
  ON public.complaints(ticket_id)
  WHERE ticket_id IS NOT NULL;

-- ────────────────────────────────────────────────────────────────────────────
-- 2. HELPER FUNCTIONS (SECURITY DEFINER, BUKAN UNTUK ANON)
-- ────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.current_app_user()
RETURNS public.users
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT u.*
  FROM public.users u
  WHERE u.auth_user_id = auth.uid()
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.current_tenant_id()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT u.tenant_id
  FROM public.users u
  WHERE u.auth_user_id = auth.uid()
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.users u
    WHERE u.auth_user_id = auth.uid()
      AND u.jabatan = 'Admin Super'
  );
$$;

REVOKE ALL ON FUNCTION public.current_app_user() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.current_tenant_id() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_super_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_app_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_tenant_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated;

-- ────────────────────────────────────────────────────────────────────────────
-- 3. RLS: HAPUS SEMUA POLICY LAMA, PASANG POLICY KETAT
-- ────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.tenants           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patrol_reports    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.findings          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_logs   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mutasi_logs       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaints        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.areas             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pos_list          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.found_items       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rosters           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.config            ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  p RECORD;
BEGIN
  FOR p IN
    SELECT policyname, tablename
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN (
        'tenants','users','patrol_reports','findings','attendance_logs',
        'mutasi_logs','complaints','areas','pos_list','found_items',
        'rosters','config'
      )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', p.policyname, p.tablename);
  END LOOP;
END $$;

-- Tenants: semua anggota hanya bisa melihat tenant-nya sendiri.
-- Admin Super boleh melihat & mengelola semua tenant.
CREATE POLICY tenants_select_member ON public.tenants
  FOR SELECT TO authenticated
  USING (public.is_super_admin() OR id = public.current_tenant_id());

CREATE POLICY tenants_insert_super ON public.tenants
  FOR INSERT TO authenticated
  WITH CHECK (public.is_super_admin());

CREATE POLICY tenants_update_super ON public.tenants
  FOR UPDATE TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

CREATE POLICY tenants_delete_super ON public.tenants
  FOR DELETE TO authenticated
  USING (public.is_super_admin());

-- Users: baca anggota satu tenant; Admin Super boleh membaca semua.
-- Tidak ada policy INSERT/UPDATE/DELETE langsung — semua mutasi lewat RPC.
CREATE POLICY users_select_tenant ON public.users
  FOR SELECT TO authenticated
  USING (
    auth_user_id = auth.uid()
    OR public.is_super_admin()
    OR tenant_id = public.current_tenant_id()
  );

-- Tabel operasional: CRUD hanya untuk anggota tenant sendiri.
-- Admin Super boleh mengakses semua tenant (aplikasi tetap memfilter tenant
-- yang sedang dipilih di UI).
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'patrol_reports','findings','attendance_logs','mutasi_logs',
    'complaints','areas','pos_list','found_items','rosters','config'
  ]
  LOOP
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (public.is_super_admin() OR tenant_id = public.current_tenant_id())',
      t || '_select_tenant', t
    );
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR INSERT TO authenticated WITH CHECK (public.is_super_admin() OR tenant_id = public.current_tenant_id())',
      t || '_insert_tenant', t
    );
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated USING (public.is_super_admin() OR tenant_id = public.current_tenant_id()) WITH CHECK (public.is_super_admin() OR tenant_id = public.current_tenant_id())',
      t || '_update_tenant', t
    );
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR DELETE TO authenticated USING (public.is_super_admin() OR tenant_id = public.current_tenant_id())',
      t || '_delete_tenant', t
    );
  END LOOP;
END $$;

-- ────────────────────────────────────────────────────────────────────────────
-- 4. RPC PUBLIK (ANON): DAFTAR TENANT, KIRIM KOMPLAIN, LACAK TIKET
-- ────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.list_public_tenants()
RETURNS TABLE (id TEXT, nama TEXT, kode TEXT, slug TEXT, alamat TEXT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT t.id, t.nama, t.kode, t.slug, t.alamat
  FROM public.tenants t
  ORDER BY t.nama;
$$;

CREATE OR REPLACE FUNCTION public.submit_complaint(payload JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_id TEXT := NULLIF(btrim(payload->>'tenant_id'), '');
  v_ticket_id TEXT := UPPER(btrim(COALESCE(payload->>'ticket_id', payload->>'ticketId', '')));
  v_id TEXT := NULLIF(btrim(payload->>'id'), '');
  v_name TEXT := btrim(COALESCE(payload->>'name', ''));
  v_category TEXT := btrim(COALESCE(payload->>'category', ''));
  v_description TEXT := btrim(COALESCE(payload->>'description', ''));
  v_photos JSONB := COALESCE(payload->'photos', '[]'::jsonb);
  v_history JSONB;
  v_now TEXT := to_char(now() AT TIME ZONE 'utc', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');
  v_row public.complaints;
BEGIN
  IF v_tenant_id IS NULL OR NOT EXISTS (SELECT 1 FROM public.tenants t WHERE t.id = v_tenant_id) THEN
    RAISE EXCEPTION 'tenant_invalid' USING HINT = 'Lokasi/gedung tidak valid.';
  END IF;

  IF v_ticket_id !~ '^CMP-[0-9]{8}-[A-Z0-9]{4,12}$' THEN
    RAISE EXCEPTION 'ticket_invalid' USING HINT = 'Format nomor tiket tidak valid.';
  END IF;

  IF v_name = '' OR v_category = '' OR v_description = '' THEN
    RAISE EXCEPTION 'required_fields' USING HINT = 'Nama, kategori, dan deskripsi wajib diisi.';
  END IF;

  IF jsonb_typeof(v_photos) <> 'array' THEN
    v_photos := '[]'::jsonb;
  END IF;
  IF jsonb_array_length(v_photos) > 3 THEN
    RAISE EXCEPTION 'photos_too_many' USING HINT = 'Maksimal 3 foto.';
  END IF;

  v_id := COALESCE(
    v_id,
    'cmp-' || extract(epoch FROM clock_timestamp())::bigint || '-' || substr(md5(random()::text), 1, 6)
  );
  v_history := jsonb_build_array(jsonb_build_object(
    'status', 'Baru',
    'timestamp', v_now,
    'note', 'Komplain dibuat'
  ));

  INSERT INTO public.complaints (
    id, ticket_id, name, phone, tenant, floor, location, category,
    description, department, status, remarks, wa_status, photos, history,
    created_at, firebase_saved_at, updated_at, tenant_id
  ) VALUES (
    v_id,
    v_ticket_id,
    left(v_name, 120),
    left(btrim(COALESCE(payload->>'phone', '')), 40),
    left(btrim(COALESCE(payload->>'tenant', '')), 200),
    left(btrim(COALESCE(payload->>'floor', '')), 80),
    left(btrim(COALESCE(payload->>'location', '')), 200),
    left(v_category, 120),
    left(v_description, 5000),
    '',
    'Baru',
    '',
    'Belum Dikirim',
    v_photos,
    v_history,
    v_now,
    v_now,
    v_now,
    v_tenant_id
  )
  RETURNING * INTO v_row;

  RETURN jsonb_build_object(
    'supabase_id', v_row.supabase_id,
    'ticket_id', v_row.ticket_id
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.track_complaint(p_ticket_id TEXT)
RETURNS TABLE (
  ticket_id TEXT,
  name TEXT,
  status TEXT,
  category TEXT,
  description TEXT,
  floor TEXT,
  location TEXT,
  tenant TEXT,
  department TEXT,
  history JSONB,
  photos JSONB,
  created_at TEXT,
  updated_at TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    c.ticket_id,
    CASE
      WHEN c.name IS NULL OR c.name = '' THEN ''
      ELSE left(c.name, 1) || repeat('*', greatest(length(c.name) - 1, 0))
    END AS name,
    c.status,
    c.category,
    c.description,
    c.floor,
    c.location,
    c.tenant,
    c.department,
    c.history,
    c.photos,
    c.created_at,
    c.updated_at
  FROM public.complaints c
  WHERE upper(btrim(c.ticket_id)) = upper(btrim(p_ticket_id))
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.list_public_tenants() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.submit_complaint(JSONB) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.track_complaint(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_public_tenants() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_complaint(JSONB) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.track_complaint(TEXT) TO anon, authenticated;

-- ────────────────────────────────────────────────────────────────────────────
-- 5. RPC INTERNAL: BUAT AKUN AUTH (HANYA DIPANGGIL FUNCTION LAIN)
-- ────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.create_auth_user_internal(
  p_email TEXT,
  p_password TEXT,
  p_name TEXT,
  p_nrp TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
  v_id UUID := gen_random_uuid();
  v_email TEXT := lower(btrim(p_email));
  v_password TEXT := p_password;
BEGIN
  IF v_email = '' OR v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' THEN
    RAISE EXCEPTION 'email_invalid';
  END IF;
  IF v_password IS NULL OR length(v_password) < 4 THEN
    RAISE EXCEPTION 'pin_too_short' USING HINT = 'PIN minimal 4 karakter.';
  END IF;

  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, invited_at,
    confirmation_token, confirmation_sent_at,
    recovery_token, recovery_sent_at,
    email_change_token_new, email_change, email_change_sent_at,
    last_sign_in_at, raw_app_meta_data, raw_user_meta_data,
    is_super_admin, created_at, updated_at,
    phone, phone_confirmed_at, phone_change, phone_change_token,
    phone_change_sent_at, email_change_token_current,
    email_change_confirm_status, banned_until, reauthentication_token,
    reauthentication_sent_at, is_sso_user, deleted_at, is_anonymous
  ) VALUES (
    '00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated',
    v_email, crypt(v_password, gen_salt('bf', 10)),
    now(), NULL,
    '', NULL,
    '', NULL,
    '', '', NULL,
    NULL, jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email')),
    jsonb_build_object('name', p_name, 'nrp', p_nrp),
    false, now(), now(),
    NULL, NULL, '', '',
    NULL, '', 
    0, NULL, '',
    NULL, false, NULL, false
  );

  INSERT INTO auth.identities (
    id, provider_id, user_id, identity_data, provider,
    last_sign_in_at, created_at, updated_at
  ) VALUES (
    v_id, v_id::text, v_id,
    jsonb_build_object(
      'sub', v_id::text,
      'email', v_email,
      'email_verified', true,
      'phone_verified', false
    ),
    'email', now(), now(), now()
  );

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_auth_user_internal(TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;

-- ────────────────────────────────────────────────────────────────────────────
-- 6. RPC ADMIN SUPER: KELOLA ANGGOTA
-- ────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.admin_create_member(
  p_nrp TEXT,
  p_nama TEXT,
  p_jabatan TEXT DEFAULT 'Anggota',
  p_regu TEXT DEFAULT '',
  p_nomor_hp TEXT DEFAULT '',
  p_tenant_id TEXT DEFAULT NULL,
  p_temp_pin TEXT DEFAULT NULL
)
RETURNS public.users
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_nrp TEXT := btrim(p_nrp);
  v_nama TEXT := btrim(p_nama);
  v_role TEXT := COALESCE(NULLIF(btrim(p_jabatan), ''), 'Anggota');
  v_tenant TEXT := COALESCE(NULLIF(btrim(p_tenant_id), ''), public.current_tenant_id());
  v_pin TEXT := COALESCE(NULLIF(p_temp_pin, ''), v_nrp);
  v_email TEXT;
  v_auth_id UUID;
  v_row public.users;
  v_now TEXT := to_char(now() AT TIME ZONE 'utc', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');
BEGIN
  IF NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'forbidden' USING HINT = 'Hanya Admin Super yang dapat menambah anggota.';
  END IF;

  IF v_nrp = '' OR v_nrp !~ '^[A-Za-z0-9._-]{3,32}$' THEN
    RAISE EXCEPTION 'nrp_invalid' USING HINT = 'NRP minimal 3 karakter (huruf/angka/titik/strip).';
  END IF;
  IF v_nama = '' THEN
    RAISE EXCEPTION 'nama_required' USING HINT = 'Nama wajib diisi.';
  END IF;
  IF v_role NOT IN (
    'Admin Super','Manajemen','SPV','Danru','Wadanru',
    'Middle 1','Middle 2','Anggota','BKO','KH (Khusus)','Guest Viewer'
  ) THEN
    RAISE EXCEPTION 'role_invalid';
  END IF;
  IF v_tenant IS NULL OR NOT EXISTS (SELECT 1 FROM public.tenants t WHERE t.id = v_tenant) THEN
    RAISE EXCEPTION 'tenant_invalid';
  END IF;

  IF EXISTS (SELECT 1 FROM public.users u WHERE lower(u.nrp) = lower(v_nrp)) THEN
    RAISE EXCEPTION 'nrp_duplicate' USING HINT = 'NRP sudah terdaftar.';
  END IF;

  v_email := lower(regexp_replace(v_nrp, '[^A-Za-z0-9._-]', '', 'g')) || '@cmmdigital.app';
  IF EXISTS (SELECT 1 FROM auth.users au WHERE lower(au.email) = v_email) THEN
    RAISE EXCEPTION 'email_duplicate' USING HINT = 'Email akun sudah dipakai.';
  END IF;

  v_auth_id := public.create_auth_user_internal(v_email, v_pin, v_nama, v_nrp);

  INSERT INTO public.users (
    supabase_id, id, nrp, nama, jabatan, regu, avatar, status, email,
    nomor_hp, last_active, created_at, updated_at, tenant_id,
    auth_user_id, must_change_password
  ) VALUES (
    v_auth_id, v_nrp, v_nrp, v_nama, v_role, btrim(COALESCE(p_regu, '')),
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&auto=format&fit=crop&q=60',
    'Aktif', '', btrim(COALESCE(p_nomor_hp, '')), '',
    v_now, v_now, v_tenant, v_auth_id, true
  )
  RETURNING * INTO v_row;

  RETURN v_row;
EXCEPTION
  WHEN unique_violation THEN
    RAISE EXCEPTION 'member_duplicate' USING HINT = 'NRP atau akun sudah terdaftar.';
END;
$$;

REVOKE ALL ON FUNCTION public.admin_create_member(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_create_member(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;

-- Update profil sendiri atau anggota (Admin Super).
CREATE OR REPLACE FUNCTION public.update_member(
  p_supabase_id UUID,
  p_updates JSONB
)
RETURNS public.users
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_actor public.users := public.current_app_user();
  v_target public.users;
  v_is_self BOOLEAN;
  v_is_admin BOOLEAN;
  v_sql TEXT := '';
  v_key TEXT;
  v_value JSONB;
  v_allowed_self TEXT[] := ARRAY['nama','avatar','nomor_hp','email','last_active'];
  v_allowed_admin TEXT[] := ARRAY['nama','avatar','nomor_hp','email','last_active','jabatan','regu','status','tenant_id'];
  v_now TEXT := to_char(now() AT TIME ZONE 'utc', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');
BEGIN
  IF v_actor.supabase_id IS NULL THEN
    RAISE EXCEPTION 'unauthenticated';
  END IF;

  SELECT * INTO v_target FROM public.users u WHERE u.supabase_id = p_supabase_id;
  IF v_target.supabase_id IS NULL THEN
    RAISE EXCEPTION 'member_not_found';
  END IF;

  v_is_self := (v_target.auth_user_id = auth.uid());
  v_is_admin := (v_actor.jabatan = 'Admin Super');

  IF NOT v_is_self AND NOT v_is_admin THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  FOR v_key IN SELECT jsonb_object_keys(p_updates)
  LOOP
    IF NOT (v_key = ANY (CASE WHEN v_is_admin THEN v_allowed_admin ELSE v_allowed_self END)) THEN
      RAISE EXCEPTION 'field_forbidden' USING HINT = format('Field %s tidak boleh diubah.', v_key);
    END IF;
  END LOOP;

  IF v_is_self AND v_target.jabatan = 'Admin Super'
     AND p_updates ? 'jabatan'
     AND COALESCE(p_updates->>'jabatan', '') <> 'Admin Super' THEN
    RAISE EXCEPTION 'self_demote_forbidden' USING HINT = 'Admin Super tidak dapat menurunkan role dirinya sendiri.';
  END IF;

  IF p_updates ? 'jabatan'
     AND COALESCE(p_updates->>'jabatan', '') NOT IN (
       'Admin Super','Manajemen','SPV','Danru','Wadanru',
       'Middle 1','Middle 2','Anggota','BKO','KH (Khusus)','Guest Viewer'
     ) THEN
    RAISE EXCEPTION 'role_invalid';
  END IF;

  IF p_updates ? 'tenant_id'
     AND NOT EXISTS (SELECT 1 FROM public.tenants t WHERE t.id = p_updates->>'tenant_id') THEN
    RAISE EXCEPTION 'tenant_invalid';
  END IF;

  FOR v_key, v_value IN SELECT * FROM jsonb_each(p_updates)
  LOOP
    IF v_key = ANY (ARRAY['nama','avatar','nomor_hp','email','last_active','jabatan','regu','status','tenant_id']) THEN
      v_sql := v_sql || format('%I = %L, ', v_key, COALESCE(v_value #>> '{}', ''));
    END IF;
  END LOOP;

  IF v_sql = '' THEN
    RETURN v_target;
  END IF;

  v_sql := v_sql || format('updated_at = %L', v_now);
  EXECUTE format('UPDATE public.users SET %s WHERE supabase_id = %L RETURNING *', v_sql, p_supabase_id)
    INTO v_target;

  RETURN v_target;
END;
$$;

REVOKE ALL ON FUNCTION public.update_member(UUID, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_member(UUID, JSONB) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_delete_member(p_supabase_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_target public.users;
  v_super_count INTEGER;
BEGIN
  IF NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  SELECT * INTO v_target FROM public.users u WHERE u.supabase_id = p_supabase_id;
  IF v_target.supabase_id IS NULL THEN
    RAISE EXCEPTION 'member_not_found';
  END IF;

  IF v_target.auth_user_id = auth.uid() THEN
    RAISE EXCEPTION 'self_delete_forbidden';
  END IF;

  IF v_target.jabatan = 'Admin Super' THEN
    SELECT count(*) INTO v_super_count
    FROM public.users u
    WHERE u.jabatan = 'Admin Super' AND u.status = 'Aktif';
    IF v_super_count <= 1 THEN
      RAISE EXCEPTION 'last_super_admin';
    END IF;
  END IF;

  IF v_target.auth_user_id IS NOT NULL THEN
    DELETE FROM auth.users au WHERE au.id = v_target.auth_user_id;
    -- FK auth_user_id ON DELETE CASCADE sudah menghapus public.users.
  ELSE
    DELETE FROM public.users u WHERE u.supabase_id = v_target.supabase_id;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_delete_member(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_delete_member(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_reset_member_pin(
  p_supabase_id UUID,
  p_temp_pin TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
  v_target public.users;
  v_pin TEXT := p_temp_pin;
  v_now TEXT := to_char(now() AT TIME ZONE 'utc', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');
BEGIN
  IF NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  IF v_pin IS NULL OR length(v_pin) < 4 OR length(v_pin) > 72 THEN
    RAISE EXCEPTION 'pin_invalid' USING HINT = 'PIN sementara minimal 4 karakter.';
  END IF;

  SELECT * INTO v_target FROM public.users u WHERE u.supabase_id = p_supabase_id;
  IF v_target.supabase_id IS NULL OR v_target.auth_user_id IS NULL THEN
    RAISE EXCEPTION 'member_not_found';
  END IF;

  UPDATE auth.users
  SET encrypted_password = crypt(v_pin, gen_salt('bf', 10)),
      email_confirmed_at = COALESCE(email_confirmed_at, now()),
      updated_at = now()
  WHERE id = v_target.auth_user_id;

  UPDATE public.users
  SET must_change_password = true,
      pin_updated_at = now(),
      updated_at = v_now
  WHERE supabase_id = p_supabase_id;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_reset_member_pin(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_reset_member_pin(UUID, TEXT) TO authenticated;

-- ────────────────────────────────────────────────────────────────────────────
-- 7. RPC: GANTI PIN SENDIRI (WAJIB SAAT LOGIN PERTAMA)
-- ────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.change_my_pin(
  p_current_pin TEXT,
  p_new_pin TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_user public.users;
  v_encrypted TEXT;
  v_now TEXT := to_char(now() AT TIME ZONE 'utc', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'unauthenticated';
  END IF;

  SELECT * INTO v_user FROM public.users u WHERE u.auth_user_id = v_uid;
  IF v_user.supabase_id IS NULL OR v_user.auth_user_id IS NULL THEN
    RAISE EXCEPTION 'profile_not_found';
  END IF;

  IF p_current_pin IS NULL OR p_new_pin IS NULL THEN
    RAISE EXCEPTION 'pin_required';
  END IF;
  IF length(p_new_pin) < 6 OR length(p_new_pin) > 72 THEN
    RAISE EXCEPTION 'pin_weak' USING HINT = 'PIN baru minimal 6 karakter.';
  END IF;
  IF p_new_pin = p_current_pin THEN
    RAISE EXCEPTION 'pin_same' USING HINT = 'PIN baru harus berbeda dari PIN lama.';
  END IF;
  IF lower(p_new_pin) = lower(v_user.nrp) THEN
    RAISE EXCEPTION 'pin_weak' USING HINT = 'PIN tidak boleh sama dengan NRP.';
  END IF;

  SELECT au.encrypted_password INTO v_encrypted
  FROM auth.users au WHERE au.id = v_uid;

  IF v_encrypted IS NULL OR crypt(p_current_pin, v_encrypted) <> v_encrypted THEN
    RAISE EXCEPTION 'current_pin_invalid' USING HINT = 'PIN saat ini salah.';
  END IF;

  UPDATE auth.users
  SET encrypted_password = crypt(p_new_pin, gen_salt('bf', 10)),
      updated_at = now()
  WHERE id = v_uid;

  UPDATE public.users
  SET must_change_password = false,
      pin_updated_at = now(),
      updated_at = v_now
  WHERE supabase_id = v_user.supabase_id;
END;
$$;

REVOKE ALL ON FUNCTION public.change_my_pin(TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.change_my_pin(TEXT, TEXT) TO authenticated;

-- ────────────────────────────────────────────────────────────────────────────
-- 8. CABUT AKSES ANON KE TABEL, BERI AKSES AUTHENTICATED (DIBATASI RLS)
-- ────────────────────────────────────────────────────────────────────────────
REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public FROM anon;
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ────────────────────────────────────────────────────────────────────────────
-- 9. BOOTSTRAP AKUN ADMIN SUPER (NRP 10001)
--    Password awal: 10001 — wajib diganti pada login pertama.
--    Blok ini tidak mengubah akun yang sudah terhubung.
-- ────────────────────────────────────────────────────────────────────────────
DO $$
DECLARE
  v_admin public.users;
  v_auth_id UUID;
  v_email TEXT := '10001@cmmdigital.app';
BEGIN
  SELECT * INTO v_admin
  FROM public.users u
  WHERE u.nrp = '10001'
  ORDER BY u.created_at
  LIMIT 1;

  IF v_admin.supabase_id IS NULL THEN
    RAISE NOTICE 'Admin NRP 10001 tidak ditemukan; bootstrap dilewati.';
    RETURN;
  END IF;

  IF v_admin.auth_user_id IS NOT NULL THEN
    RETURN;
  END IF;

  SELECT au.id INTO v_auth_id
  FROM auth.users au
  WHERE lower(au.email) = v_email
  LIMIT 1;

  IF v_auth_id IS NULL THEN
    v_auth_id := public.create_auth_user_internal(v_email, '10001', v_admin.nama, v_admin.nrp);
  END IF;

  UPDATE public.users
  SET auth_user_id = v_auth_id,
      must_change_password = true,
      updated_at = to_char(now() AT TIME ZONE 'utc', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
  WHERE supabase_id = v_admin.supabase_id;
END $$;

NOTIFY pgrst, 'reload schema';

-- ────────────────────────────────────────────────────────────────────────────
-- VERIFIKASI
-- ────────────────────────────────────────────────────────────────────────────
-- SELECT nrp, nama, jabatan, tenant_id, auth_user_id, must_change_password FROM public.users;
-- SELECT tablename, policyname, cmd, roles FROM pg_policies WHERE schemaname='public' ORDER BY tablename, policyname;
-- SELECT has_table_privilege('anon', 'public.users', 'SELECT'); -- harus false
-- SELECT has_function_privilege('anon', 'public.submit_complaint(jsonb)', 'EXECUTE'); -- harus true
-- ============================================================================
