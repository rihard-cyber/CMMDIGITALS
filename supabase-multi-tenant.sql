-- ============================================================================
-- SMPJDC / CMMDIGITAL MULTI-TENANT MIGRATION
-- Jalankan SQL ini di Supabase SQL Editor (Project BARU untuk multi-tenant)
-- URUTAN: Jalankan supabase-schema.sql DULU, baru jalankan file ini.
-- ============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 0. AKTIFKAN EXTENSION (butuh untuk gen_random_uuid())
-- ─────────────────────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. TABEL TENANT (Pusat / Cabang / Gedung)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tenants (
  supabase_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  id TEXT UNIQUE NOT NULL,
  nama TEXT NOT NULL,
  kode TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  alamat TEXT,
  firebase_saved_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tenants_id ON tenants(id);
CREATE INDEX IF NOT EXISTS idx_tenants_slug ON tenants(slug);

-- Data contoh untuk PT. CMM dan lokasi tender-nya
INSERT INTO tenants (id, nama, kode, slug, alamat) VALUES
  ('tnt_pt_cmm', 'PT. CMM (Pusat)', 'PT_CMM', 'pt-cmm', 'Pusat PT. CMM'),
  ('tnt_kemendag', 'Kementerian Perdagangan - Pusat', 'KEMENDAG', 'kemendag', 'Jakarta'),
  ('tnt_kemendag_jateng', 'Kementerian Perdagangan - Cabang Jawa Tengah', 'KEMENDAG_JATENG', 'kemendag-jateng', 'Semarang'),
  ('tnt_wisma_jateng', 'Gedung Wisma Jawa Tengah', 'WISMA_JATENG', 'wisma-jateng', 'Semarang'),
  ('tnt_astra', 'Gedung Astra', 'ASTRA', 'astra', 'Jakarta')
ON CONFLICT (slug) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. TAMBAHKAN KOLOM tenant_id KE SEMUA TABEL EXISTING
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE users            ADD COLUMN IF NOT EXISTS tenant_id TEXT;
ALTER TABLE patrol_reports   ADD COLUMN IF NOT EXISTS tenant_id TEXT;
ALTER TABLE findings         ADD COLUMN IF NOT EXISTS tenant_id TEXT;
ALTER TABLE attendance_logs  ADD COLUMN IF NOT EXISTS tenant_id TEXT;
ALTER TABLE mutasi_logs      ADD COLUMN IF NOT EXISTS tenant_id TEXT;
ALTER TABLE complaints       ADD COLUMN IF NOT EXISTS tenant_id TEXT;
ALTER TABLE areas            ADD COLUMN IF NOT EXISTS tenant_id TEXT;
ALTER TABLE pos_list         ADD COLUMN IF NOT EXISTS tenant_id TEXT;
ALTER TABLE rosters          ADD COLUMN IF NOT EXISTS tenant_id TEXT;
ALTER TABLE config           ADD COLUMN IF NOT EXISTS tenant_id TEXT;

-- Index untuk performa query per tenant
CREATE INDEX IF NOT EXISTS idx_users_tenant_id            ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_patrol_reports_tenant_id   ON patrol_reports(tenant_id);
CREATE INDEX IF NOT EXISTS idx_findings_tenant_id         ON findings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_attendance_logs_tenant_id  ON attendance_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_mutasi_logs_tenant_id      ON mutasi_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_complaints_tenant_id       ON complaints(tenant_id);
CREATE INDEX IF NOT EXISTS idx_areas_tenant_id            ON areas(tenant_id);
CREATE INDEX IF NOT EXISTS idx_pos_list_tenant_id         ON pos_list(tenant_id);
CREATE INDEX IF NOT EXISTS idx_rosters_tenant_id          ON rosters(tenant_id);
CREATE INDEX IF NOT EXISTS idx_config_tenant_id           ON config(tenant_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. FUNGSI HELPER: set_app_tenant (untuk mengatur konteks tenant per sesi)
--    Frontend memanggil fungsi ini setelah user pilih tenant di layar login.
--    Setiap HTTP request ke Supabase adalah transaksi terpisah, jadi fungsi
--    ini harus dipanggil di setiap sesi / setiap kali halaman dimuat ulang.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_app_tenant(tenant_id TEXT)
RETURNS VOID AS $$
BEGIN
  PERFORM set_config('app.tenant_id', tenant_id, true);
END;
$$ LANGUAGE plpgsql;

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. ENABLE RLS DAN BUAT POLICY MULTI-TENANT
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE tenants            ENABLE ROW LEVEL SECURITY;
ALTER TABLE users              ENABLE ROW LEVEL SECURITY;
ALTER TABLE patrol_reports     ENABLE ROW LEVEL SECURITY;
ALTER TABLE findings           ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_logs    ENABLE ROW LEVEL SECURITY;
ALTER TABLE mutasi_logs        ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaints         ENABLE ROW LEVEL SECURITY;
ALTER TABLE areas              ENABLE ROW LEVEL SECURITY;
ALTER TABLE pos_list           ENABLE ROW LEVEL SECURITY;
ALTER TABLE rosters            ENABLE ROW LEVEL SECURITY;
ALTER TABLE config             ENABLE ROW LEVEL SECURITY;

-- Hapus policy lama jika ada (hindari error duplicate policy)
DROP POLICY IF EXISTS "Allow all for anon users" ON users;
DROP POLICY IF EXISTS "Allow all for anon patrol_reports" ON patrol_reports;
DROP POLICY IF EXISTS "Allow all for anon findings" ON findings;
DROP POLICY IF EXISTS "Allow all for anon attendance_logs" ON attendance_logs;
DROP POLICY IF EXISTS "Allow all for anon mutasi_logs" ON mutasi_logs;
DROP POLICY IF EXISTS "Allow all for anon complaints" ON complaints;
DROP POLICY IF EXISTS "Allow all for anon areas" ON areas;
DROP POLICY IF EXISTS "Allow all for anon pos_list" ON pos_list;
DROP POLICY IF EXISTS "Allow all for anon rosters" ON rosters;
DROP POLICY IF EXISTS "Allow all for anon config" ON config;
DROP POLICY IF EXISTS "Allow all for anon tenants" ON tenants;
DROP POLICY IF EXISTS "Tenants readable by all" ON tenants;
DROP POLICY IF EXISTS "Tenant isolation users" ON users;
DROP POLICY IF EXISTS "Tenant isolation patrol_reports" ON patrol_reports;
DROP POLICY IF EXISTS "Tenant isolation findings" ON findings;
DROP POLICY IF EXISTS "Tenant isolation attendance_logs" ON attendance_logs;
DROP POLICY IF EXISTS "Tenant isolation mutasi_logs" ON mutasi_logs;
DROP POLICY IF EXISTS "Tenant isolation complaints" ON complaints;
DROP POLICY IF EXISTS "Tenant isolation areas" ON areas;
DROP POLICY IF EXISTS "Tenant isolation pos_list" ON pos_list;
DROP POLICY IF EXISTS "Tenant isolation rosters" ON rosters;
DROP POLICY IF EXISTS "Tenant isolation config" ON config;

-- Policy untuk tabel tenants (bisa dilihat semua tenant, untuk dropdown login)
CREATE POLICY "Tenants readable by all" ON tenants
  FOR SELECT TO anon USING (true);

-- Policy multi-tenant untuk tabel data (hanya data milik tenant aktif)
-- Jika app.tenant_id belum di-set (NULL), tidak ada data yang akan muncul.
-- Ini sengaja, agar data tidak bocor ke tenant lain.
CREATE POLICY "Tenant isolation users" ON users
  FOR ALL TO anon
  USING (tenant_id = current_setting('app.tenant_id', true))
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true));

CREATE POLICY "Tenant isolation patrol_reports" ON patrol_reports
  FOR ALL TO anon
  USING (tenant_id = current_setting('app.tenant_id', true))
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true));

CREATE POLICY "Tenant isolation findings" ON findings
  FOR ALL TO anon
  USING (tenant_id = current_setting('app.tenant_id', true))
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true));

CREATE POLICY "Tenant isolation attendance_logs" ON attendance_logs
  FOR ALL TO anon
  USING (tenant_id = current_setting('app.tenant_id', true))
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true));

CREATE POLICY "Tenant isolation mutasi_logs" ON mutasi_logs
  FOR ALL TO anon
  USING (tenant_id = current_setting('app.tenant_id', true))
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true));

CREATE POLICY "Tenant isolation complaints" ON complaints
  FOR ALL TO anon
  USING (tenant_id = current_setting('app.tenant_id', true))
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true));

CREATE POLICY "Tenant isolation areas" ON areas
  FOR ALL TO anon
  USING (tenant_id = current_setting('app.tenant_id', true))
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true));

CREATE POLICY "Tenant isolation pos_list" ON pos_list
  FOR ALL TO anon
  USING (tenant_id = current_setting('app.tenant_id', true))
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true));

CREATE POLICY "Tenant isolation rosters" ON rosters
  FOR ALL TO anon
  USING (tenant_id = current_setting('app.tenant_id', true))
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true));

CREATE POLICY "Tenant isolation config" ON config
  FOR ALL TO anon
  USING (tenant_id = current_setting('app.tenant_id', true))
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true));

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. ENABLE REALTIME PUBLICATION
--    Menggunakan DO BLOCK untuk menghindari error jika tabel sudah ada di publication.
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'tenants'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE tenants;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'users'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE users;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'patrol_reports'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE patrol_reports;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'findings'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE findings;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'attendance_logs'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE attendance_logs;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'mutasi_logs'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE mutasi_logs;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'complaints'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE complaints;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'areas'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE areas;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'pos_list'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE pos_list;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'rosters'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE rosters;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'config'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE config;
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. VERIFIKASI (hilangkan tanda -- di awal baris untuk mencoba)
-- ─────────────────────────────────────────────────────────────────────────────
-- SELECT * FROM tenants;
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
-- SELECT * FROM pg_policies WHERE schemaname = 'public';
-- ============================================================================
