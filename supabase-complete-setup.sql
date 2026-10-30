-- ============================================================================
-- CMMDIGITAL — COMPLETE SUPABASE SETUP (FRESH INSTALL)
-- ============================================================================
-- File ini adalah gabungan berurutan dari:
--   1. supabase-schema.sql
--   2. supabase-multi-tenant.sql
--   3. supabase-release-hardening.sql
--   4. bucket storage + policy foto
--
-- Gunakan file ini untuk project Supabase BARU.
-- Untuk database yang sudah berjalan, cukup jalankan:
--   supabase-release-hardening.sql
--
-- Aman dijalankan ulang (idempotent) selama data tenant sudah konsisten.
-- ============================================================================
-- ============================================
-- SMPJDC - Supabase Database Schema
-- Execute this SQL in Supabase SQL Editor
-- ============================================

-- ── Users ────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  supabase_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  id TEXT UNIQUE,
  nrp TEXT,
  nama TEXT,
  jabatan TEXT,
  regu TEXT,
  avatar TEXT,
  status TEXT,
  email TEXT,
  nomor_hp TEXT,
  last_active TEXT,
  firebase_id TEXT,
  created_at TEXT,
  firebase_saved_at TEXT,
  updated_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_users_id ON users(id);
CREATE INDEX IF NOT EXISTS idx_users_nrp ON users(nrp);

-- ── Patrol Reports ───────────────────────────
CREATE TABLE IF NOT EXISTS patrol_reports (
  supabase_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  id TEXT UNIQUE,
  user_id TEXT,
  user_name TEXT,
  nrp TEXT,
  nomor_hp TEXT,
  shift TEXT,
  regu TEXT,
  area_id TEXT,
  gedung TEXT,
  lantai TEXT,
  zona TEXT,
  titik TEXT,
  kondisi TEXT,
  keterangan TEXT,
  foto TEXT,
  severity TEXT,
  timestamp TEXT,
  timestamp_end TEXT,
  date TEXT,
  time TEXT,
  kategori TEXT,
  kode_temuan TEXT,
  temuan TEXT,
  status TEXT,
  anti_fraud JSONB,
  jabatan TEXT,
  created_at TEXT,
  firebase_saved_at TEXT,
  updated_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_patrol_reports_id ON patrol_reports(id);
CREATE INDEX IF NOT EXISTS idx_patrol_reports_timestamp ON patrol_reports(timestamp);

-- ── Findings ─────────────────────────────────
CREATE TABLE IF NOT EXISTS findings (
  supabase_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  id TEXT UNIQUE,
  report_id TEXT,
  kategori TEXT,
  area TEXT,
  tanggal TEXT,
  pelapor TEXT,
  nrp TEXT,
  nomor_hp TEXT,
  shift TEXT,
  regu TEXT,
  status TEXT,
  severity TEXT,
  detail TEXT,
  foto TEXT,
  department TEXT,
  wa_status TEXT,
  wa_sent_at TEXT,
  created_at TEXT,
  firebase_saved_at TEXT,
  updated_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_findings_id ON findings(id);
CREATE INDEX IF NOT EXISTS idx_findings_created_at ON findings(created_at);

-- ── Attendance Logs ──────────────────────────
CREATE TABLE IF NOT EXISTS attendance_logs (
  supabase_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  id TEXT UNIQUE,
  tanggal TEXT,
  shift TEXT,
  regu TEXT,
  details JSONB,
  created_at TEXT,
  firebase_saved_at TEXT,
  updated_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_attendance_logs_id ON attendance_logs(id);
CREATE INDEX IF NOT EXISTS idx_attendance_logs_tanggal ON attendance_logs(tanggal);

-- ── Mutasi Logs ──────────────────────────────
CREATE TABLE IF NOT EXISTS mutasi_logs (
  supabase_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  id TEXT UNIQUE,
  tanggal TEXT,
  shift TEXT,
  regu TEXT,
  waktu TEXT,
  tanggal_kejadian TEXT,
  jam_kejadian TEXT,
  lokasi TEXT,
  uraian TEXT,
  kategori TEXT,
  foto TEXT,
  petugas TEXT,
  nrp TEXT,
  nomor_hp TEXT,
  tindak_lanjut TEXT,
  pelapor TEXT,
  anti_fraud JSONB,
  petugas_masuk TEXT,
  petugas_keluar TEXT,
  catatan TEXT,
  created_at TEXT,
  firebase_saved_at TEXT,
  updated_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_mutasi_logs_id ON mutasi_logs(id);
CREATE INDEX IF NOT EXISTS idx_mutasi_logs_created_at ON mutasi_logs(created_at);

-- ── Complaints ───────────────────────────────
CREATE TABLE IF NOT EXISTS complaints (
  supabase_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  id TEXT UNIQUE,
  ticket_id TEXT,
  name TEXT,
  phone TEXT,
  tenant TEXT,
  floor TEXT,
  location TEXT,
  category TEXT,
  description TEXT,
  department TEXT,
  status TEXT,
  remarks TEXT,
  wa_status TEXT,
  wa_sent_at TEXT,
  photos JSONB,
  history JSONB,
  created_at TEXT,
  firebase_saved_at TEXT,
  updated_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_complaints_id ON complaints(id);
CREATE INDEX IF NOT EXISTS idx_complaints_created_at ON complaints(created_at);

-- ── Areas / Checkpoints ──────────────────────
CREATE TABLE IF NOT EXISTS areas (
  supabase_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  id TEXT UNIQUE,
  gedung TEXT,
  lantai TEXT,
  nomor_titik TEXT,
  zona TEXT,
  titik TEXT,
  qr_code TEXT,
  created_at TEXT,
  firebase_saved_at TEXT,
  updated_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_areas_id ON areas(id);

-- ── Pos List ─────────────────────────────────
CREATE TABLE IF NOT EXISTS pos_list (
  supabase_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  id TEXT UNIQUE,
  lantai TEXT,
  titik TEXT,
  keterangan TEXT,
  kode TEXT,
  created_at TEXT,
  firebase_saved_at TEXT,
  updated_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_pos_list_id ON pos_list(id);

-- ── Found Items / Penemuan Barang (Lost & Found) ────────────
-- Kolom tenant_id ditambahkan oleh supabase-multi-tenant.sql, lalu
-- diwajibkan + diberi foreign key oleh supabase-release-hardening.sql.
CREATE TABLE IF NOT EXISTS found_items (
  supabase_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  id TEXT UNIQUE,
  item_code TEXT,
  tanggal_penemuan TEXT,
  jam_penemuan TEXT,
  tanggal_laporan TEXT,
  nama_barang TEXT,
  jenis_barang TEXT,
  kategori_barang TEXT,
  lokasi_penemuan TEXT,
  nama_penemu TEXT,
  kategori_penemu TEXT,
  kontak_penemu TEXT,
  keterangan_penemu TEXT,
  foto_barang TEXT,
  photos JSONB,
  status TEXT DEFAULT 'Ditemukan',
  nama_pengambil TEXT,
  kontak_pengambil TEXT,
  no_identitas_pengambil TEXT,
  foto_identitas TEXT,
  diserahkan_oleh TEXT,
  tanggal_pengambilan TEXT,
  catatan_serah_terima TEXT,
  keterangan TEXT,
  created_at TEXT,
  firebase_saved_at TEXT,
  updated_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_found_items_id ON found_items(id);
CREATE INDEX IF NOT EXISTS idx_found_items_item_code ON found_items(item_code);
CREATE INDEX IF NOT EXISTS idx_found_items_tanggal ON found_items(tanggal_penemuan);
CREATE INDEX IF NOT EXISTS idx_found_items_status ON found_items(status);
CREATE INDEX IF NOT EXISTS idx_found_items_created_at ON found_items(created_at);

-- ── Rosters (satu dokumen per bulan per tenant) ────────────
CREATE TABLE IF NOT EXISTS rosters (
  supabase_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  year_month TEXT,
  roster_data JSONB,
  updated_by TEXT,
  created_at TEXT,
  updated_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_rosters_year_month ON rosters(year_month);

-- ── Config (WA Contacts, etc.) ──────────────
CREATE TABLE IF NOT EXISTS config (
  supabase_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT UNIQUE,
  data JSONB,
  updated_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_config_key ON config(key);

-- ── Enable Realtime for all tables (idempotent) ──────────
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'users','patrol_reports','findings','attendance_logs','mutasi_logs',
    'complaints','areas','pos_list','found_items','rosters','config'
  ]
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = t
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
    END IF;
  END LOOP;
END $$;


-- ============================================
-- MIGRATION: Jalankan ini jika tabel sudah ADA
-- di Supabase (hapus -- di awal setiap baris)
-- ============================================
-- ALTER TABLE users ADD CONSTRAINT users_id_unique UNIQUE (id);
-- ALTER TABLE patrol_reports ADD CONSTRAINT patrol_reports_id_unique UNIQUE (id);
-- ALTER TABLE findings ADD CONSTRAINT findings_id_unique UNIQUE (id);
-- ALTER TABLE attendance_logs ADD CONSTRAINT attendance_logs_id_unique UNIQUE (id);
-- ALTER TABLE mutasi_logs ADD CONSTRAINT mutasi_logs_id_unique UNIQUE (id);
-- ALTER TABLE complaints ADD CONSTRAINT complaints_id_unique UNIQUE (id);
-- ALTER TABLE areas ADD CONSTRAINT areas_id_unique UNIQUE (id);
-- ALTER TABLE pos_list ADD CONSTRAINT pos_list_id_unique UNIQUE (id);


-- ============================================================================
-- SMPJDC / CMMDIGITAL MULTI-TENANT MIGRATION
-- Jalankan SQL ini di Supabase SQL Editor (Project BARU untuk multi-tenant)
-- URUTAN WAJIB:
--   1. supabase-schema.sql
--   2. supabase-multi-tenant.sql   (file ini)
--   3. supabase-release-hardening.sql
-- Untuk database yang SUDAH berjalan, cukup jalankan file 3 (aman diulang).
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

-- Pastikan kolom firebase_saved_at ada juga pada tabel tenants yang sudah dibuat sebelumnya
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS firebase_saved_at TIMESTAMPTZ DEFAULT now();

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
ALTER TABLE found_items      ADD COLUMN IF NOT EXISTS tenant_id TEXT;
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
CREATE INDEX IF NOT EXISTS idx_found_items_tenant_id      ON found_items(tenant_id);
CREATE INDEX IF NOT EXISTS idx_rosters_tenant_id          ON rosters(tenant_id);
CREATE INDEX IF NOT EXISTS idx_config_tenant_id           ON config(tenant_id);

-- Roster: satu jadwal per bulan PER TENANT (bukan global)
ALTER TABLE rosters DROP CONSTRAINT IF EXISTS rosters_year_month_key;
CREATE UNIQUE INDEX IF NOT EXISTS idx_rosters_year_month_tenant
  ON rosters(year_month, tenant_id);

-- Config: key hanya unik di dalam satu tenant (WA contacts per lokasi)
ALTER TABLE config DROP CONSTRAINT IF EXISTS config_key_key;
DROP INDEX IF EXISTS config_key_key;
CREATE UNIQUE INDEX IF NOT EXISTS idx_config_key_tenant
  ON config(key, tenant_id);

-- Found items: kode barang unik per tenant, bukan global
CREATE UNIQUE INDEX IF NOT EXISTS idx_found_items_code_tenant
  ON found_items(item_code, tenant_id);

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
ALTER TABLE found_items        ENABLE ROW LEVEL SECURITY;
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
DROP POLICY IF EXISTS "Allow all for anon found_items" ON found_items;
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
DROP POLICY IF EXISTS "Tenant isolation found_items" ON found_items;
DROP POLICY IF EXISTS "Tenant isolation rosters" ON rosters;
DROP POLICY IF EXISTS "Tenant isolation config" ON config;

-- Policy CRUD untuk semua tabel.
-- CATATAN KEAMANAN: aplikasi memakai login NRP/PIN sendiri (bukan Supabase Auth),
-- sehingga anon key tidak memiliki klaim tenant. Isolasi data dilakukan di
-- aplikasi dengan menyaring tenant_id (getCurrentTenant()). Untuk keamanan
-- tingkat database, migrasikan ke Supabase Auth + JWT claims di kemudian hari.
-- Tanpa policy ini, seluruh data (users, areas, laporan) tidak bisa dibaca.
CREATE POLICY "Allow all for anon tenants" ON tenants
  FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for anon users" ON users
  FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for anon patrol_reports" ON patrol_reports
  FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for anon findings" ON findings
  FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for anon attendance_logs" ON attendance_logs
  FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for anon mutasi_logs" ON mutasi_logs
  FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for anon complaints" ON complaints
  FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for anon areas" ON areas
  FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for anon pos_list" ON pos_list
  FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for anon found_items" ON found_items
  FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for anon rosters" ON rosters
  FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for anon config" ON config
  FOR ALL TO anon USING (true) WITH CHECK (true);

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
    WHERE pubname = 'supabase_realtime' AND tablename = 'found_items'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE found_items;
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
-- 6. GRANT UNTUK ANON/AUTHENTICATED (Supabase Cloud)
-- ─────────────────────────────────────────────────────────────────────────────
GRANT ALL ON TABLE public.tenants TO anon, authenticated;
GRANT ALL ON TABLE public.users TO anon, authenticated;
GRANT ALL ON TABLE public.patrol_reports TO anon, authenticated;
GRANT ALL ON TABLE public.findings TO anon, authenticated;
GRANT ALL ON TABLE public.attendance_logs TO anon, authenticated;
GRANT ALL ON TABLE public.mutasi_logs TO anon, authenticated;
GRANT ALL ON TABLE public.complaints TO anon, authenticated;
GRANT ALL ON TABLE public.areas TO anon, authenticated;
GRANT ALL ON TABLE public.pos_list TO anon, authenticated;
GRANT ALL ON TABLE public.found_items TO anon, authenticated;
GRANT ALL ON TABLE public.rosters TO anon, authenticated;
GRANT ALL ON TABLE public.config TO anon, authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. LANGKAH BERIKUTNYA
--    Jalankan supabase-release-hardening.sql untuk:
--    - backfill tenant_id data lama,
--    - NOT NULL + foreign key ON DELETE RESTRICT,
--    - unique NRP,
--    - seed POS awal PT. CMM.
-- ─────────────────────────────────────────────────────────────────────────────

-- ─────────────────────────────────────────────────────────────────────────────
-- 8. VERIFIKASI (hilangkan tanda -- di awal baris untuk mencoba)
-- ─────────────────────────────────────────────────────────────────────────────
-- SELECT * FROM tenants;
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
-- SELECT * FROM pg_policies WHERE schemaname = 'public';
-- ============================================================================


-- ============================================================================
-- CMMDIGITAL — RELEASE HARDENING MIGRATION
-- Tujuan:
--   1. Melengkapi tabel found_items (Lost & Found) yang dipakai aplikasi.
--   2. Menjamin setiap baris data operasional punya tenant_id yang valid.
--   3. Membuat config (WA contacts) unik per tenant, bukan global.
--   4. Mencegah NRP ganda.
--   5. Mengisi POS awal khusus PT. CMM (tanpa menyuntikkan data ke tenant lain).
--
-- Aman dijalankan berulang (idempotent).
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ────────────────────────────────────────────────────────────────────────────
-- 1. FOUND ITEMS (LOST & FOUND)
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS found_items (
  supabase_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  id TEXT,
  item_code TEXT,
  tanggal_penemuan TEXT,
  jam_penemuan TEXT,
  tanggal_laporan TEXT,
  nama_barang TEXT,
  jenis_barang TEXT,
  kategori_barang TEXT,
  lokasi_penemuan TEXT,
  nama_penemu TEXT,
  kategori_penemu TEXT,
  kontak_penemu TEXT,
  keterangan_penemu TEXT,
  foto_barang TEXT,
  photos JSONB,
  status TEXT DEFAULT 'Ditemukan',
  nama_pengambil TEXT,
  kontak_pengambil TEXT,
  no_identitas_pengambil TEXT,
  foto_identitas TEXT,
  diserahkan_oleh TEXT,
  tanggal_pengambilan TEXT,
  catatan_serah_terima TEXT,
  keterangan TEXT,
  created_at TEXT,
  firebase_saved_at TEXT,
  updated_at TEXT,
  tenant_id TEXT
);

-- Untuk instalasi lama yang tabelnya sudah ada tetapi belum punya tenant_id
ALTER TABLE found_items ADD COLUMN IF NOT EXISTS tenant_id TEXT;

CREATE INDEX IF NOT EXISTS idx_found_items_id             ON found_items(id);
CREATE INDEX IF NOT EXISTS idx_found_items_item_code      ON found_items(item_code);
CREATE INDEX IF NOT EXISTS idx_found_items_tanggal        ON found_items(tanggal_penemuan);
CREATE INDEX IF NOT EXISTS idx_found_items_status         ON found_items(status);
CREATE INDEX IF NOT EXISTS idx_found_items_created_at     ON found_items(created_at);
CREATE INDEX IF NOT EXISTS idx_found_items_tenant_id      ON found_items(tenant_id);

-- Kode barang cukup unik per tenant (dua lokasi boleh punya kode sama)
ALTER TABLE found_items DROP CONSTRAINT IF EXISTS found_items_item_code_key;
CREATE UNIQUE INDEX IF NOT EXISTS idx_found_items_code_tenant
  ON found_items(item_code, tenant_id);

ALTER TABLE found_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for anon found_items" ON found_items;
CREATE POLICY "Allow all for anon found_items" ON found_items
  FOR ALL TO anon USING (true) WITH CHECK (true);

GRANT ALL ON TABLE public.found_items TO anon, authenticated;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'found_items'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE found_items;
  END IF;
END $$;

-- ────────────────────────────────────────────────────────────────────────────
-- 2. BACKFILL DATA LAMA (hanya jika ada baris tanpa tenant)
--    Data lama sebelum multi-tenant memang milik PT. CMM (pusat).
-- ────────────────────────────────────────────────────────────────────────────
UPDATE users           SET tenant_id = 'tnt_pt_cmm' WHERE tenant_id IS NULL;
UPDATE areas           SET tenant_id = 'tnt_pt_cmm' WHERE tenant_id IS NULL;
UPDATE pos_list        SET tenant_id = 'tnt_pt_cmm' WHERE tenant_id IS NULL;
UPDATE patrol_reports  SET tenant_id = 'tnt_pt_cmm' WHERE tenant_id IS NULL;
UPDATE findings        SET tenant_id = 'tnt_pt_cmm' WHERE tenant_id IS NULL;
UPDATE attendance_logs SET tenant_id = 'tnt_pt_cmm' WHERE tenant_id IS NULL;
UPDATE mutasi_logs     SET tenant_id = 'tnt_pt_cmm' WHERE tenant_id IS NULL;
UPDATE complaints      SET tenant_id = 'tnt_pt_cmm' WHERE tenant_id IS NULL;
UPDATE found_items     SET tenant_id = 'tnt_pt_cmm' WHERE tenant_id IS NULL;
UPDATE rosters         SET tenant_id = 'tnt_pt_cmm' WHERE tenant_id IS NULL;
UPDATE config          SET tenant_id = 'tnt_pt_cmm' WHERE tenant_id IS NULL;

-- ────────────────────────────────────────────────────────────────────────────
-- 3. TENANT_ID WAJIB TERISI + FOREIGN KEY KE tenants(id)
--    Dengan ini data tidak bisa dibuat tanpa lokasi yang valid.
-- ────────────────────────────────────────────────────────────────────────────
ALTER TABLE users           ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE areas           ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE pos_list        ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE patrol_reports  ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE findings        ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE attendance_logs ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE mutasi_logs     ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE complaints      ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE found_items     ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE rosters         ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE config          ALTER COLUMN tenant_id SET NOT NULL;

DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'users','areas','pos_list','patrol_reports','findings',
    'attendance_logs','mutasi_logs','complaints','found_items','rosters','config'
  ]
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conname = 'fk_' || t || '_tenant'
        AND conrelid = ('public.' || t)::regclass
    ) THEN
      EXECUTE format(
        'ALTER TABLE public.%I ADD CONSTRAINT %I FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE RESTRICT',
        t, 'fk_' || t || '_tenant'
      );
    END IF;
  END LOOP;
END $$;

-- ────────────────────────────────────────────────────────────────────────────
-- 4. CONFIG PER TENANT (WA contacts)
--    key hanya unik di dalam satu tenant.
-- ────────────────────────────────────────────────────────────────────────────
ALTER TABLE config DROP CONSTRAINT IF EXISTS config_key_key;
DROP INDEX IF EXISTS config_key_key;
CREATE UNIQUE INDEX IF NOT EXISTS idx_config_key_tenant
  ON config(key, tenant_id);

-- ────────────────────────────────────────────────────────────────────────────
-- 5. NRP TIDAK BOLEH GANDA
-- ────────────────────────────────────────────────────────────────────────────
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_nrp_unique ON users(nrp);

-- ────────────────────────────────────────────────────────────────────────────
-- 6. SEED POS AWAL PT. CMM (hanya jika belum ada)
-- ────────────────────────────────────────────────────────────────────────────
INSERT INTO pos_list (id, lantai, titik, keterangan, kode, tenant_id, created_at, updated_at)
SELECT v.id, v.lantai, v.titik, v.keterangan, v.kode, 'tnt_pt_cmm',
       now()::text, now()::text
FROM (VALUES
  ('pos-cmd',         'Pos CMMDIGITAL',  'Pos CMMDIGITAL',              'Pos jaga utama CMMDIGITAL',        'PCMD'),
  ('pos-00-area',     'Basement',        'Pos 00 Area',                 'Pos area basement',                'P00A'),
  ('pos-00-lift-bsmt','Basement',        'Pos 00 Lift Basement',        'Pos lift basement',                'P00L'),
  ('pos-01-lift',     '1',               'Pos 01 Lift (Pintu sudut)',   'Pos lift lantai 1 pintu sudut',    'P01L'),
  ('pos-01-lobby',    '1',               'Pos 01 Lobby',                'Pos lobby utama lantai 1',         'P01'),
  ('pos-23-area',     '2 & 3',           'Pos 2/3 area',                'Pos jaga lantai 2 dan 3',          'P23'),
  ('pos-45-area',     '4 & 5',           'Pos 4/5 Area',                'Pos jaga lantai 4 dan 5',          'P45'),
  ('pos-67-area',     '6 & 7',           'Pos 6/7 Area',                'Pos jaga lantai 6 dan 7',          'P67'),
  ('pos-pk-mobil',    'Parkir',          'Pos PK mobil',                'Pos parkir mobil',                 'PKM'),
  ('pos-08a',         'Halaman Depan',   'Pos 08A',                     'Pos depan area A',                 'P08A'),
  ('pos-08b',         'Halaman Depan',   'Pos 08B',                     'Pos depan area B',                 'P08B'),
  ('pos-08c',         'Halaman Depan',   'Pos 08C',                     'Pos depan area C',                 'P08C'),
  ('pos-09-area',     'Halaman Belakang','Pos 09 Area',                 'Pos area belakang',                'P09'),
  ('pos-pk-motor',    'Parkir',          'Pos PK motor',                'Pos parkir motor',                 'PKMR'),
  ('pos-motor',       'Parkir',          'Pos Motor',                   'Pos motor',                        'PMTR')
) AS v(id, lantai, titik, keterangan, kode)
WHERE NOT EXISTS (
  SELECT 1 FROM pos_list p
  WHERE p.id = v.id AND p.tenant_id = 'tnt_pt_cmm'
);

-- ────────────────────────────────────────────────────────────────────────────
-- 7. RELOAD SCHEMA CACHE POSTGREST
-- ────────────────────────────────────────────────────────────────────────────
NOTIFY pgrst, 'reload schema';

-- Verifikasi cepat
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname='public' ORDER BY tablename;
-- SELECT conname, conrelid::regclass FROM pg_constraint WHERE conname LIKE 'fk_%_tenant';
-- SELECT key, tenant_id FROM config;
-- SELECT count(*) FROM found_items;


-- ============================================
-- PART 3: STORAGE BUCKET & POLICIES

-- Pastikan buat bucket 'photos' di Dashboard → Storage:
-- ============================================

-- 1. Buat bucket 'photos' (jika belum ada)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('photos', 'photos', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/*'])
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Kebijakan Storage (Wrapped safely agar tidak memicu ERROR 42501: must be owner of table objects)
-- CATATAN: Di Supabase Cloud, tabel storage.objects dimiliki oleh role 'supabase_storage_admin'.
-- Jika menjalankan query ini via SQL Editor dengan role postgres, Supabase dapat mengembalikan error 42501.
-- Blok di bawah ini aman dijalankan karena menangkap exception privilege secara otomatis.
DO $$
BEGIN
  -- INSERT policy - Allow anon role to upload photos to 'photos' bucket
  BEGIN
    DROP POLICY IF EXISTS "Allow anon uploads to photos" ON storage.objects;
    CREATE POLICY "Allow anon uploads to photos" ON storage.objects
      FOR INSERT TO anon WITH CHECK (bucket_id = 'photos');
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'Skipping direct policy on storage.objects (insufficient privilege). Silakan atur policy lewat menu Storage -> Policies di dashboard Supabase.';
  WHEN OTHERS THEN
    RAISE NOTICE 'Policy creation skipped: %', SQLERRM;
  END;

  -- SELECT policy - public read access for photos
  BEGIN
    DROP POLICY IF EXISTS "Public read access for photos" ON storage.objects;
    CREATE POLICY "Public read access for photos" ON storage.objects
      FOR SELECT TO public USING (bucket_id = 'photos');
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'Skipping direct SELECT policy on storage.objects.';
  WHEN OTHERS THEN
    RAISE NOTICE 'Policy creation skipped: %', SQLERRM;
  END;

  -- UPDATE/DELETE policy for anon
  BEGIN
    DROP POLICY IF EXISTS "Allow anon update and delete on photos" ON storage.objects;
    CREATE POLICY "Allow anon update and delete on photos" ON storage.objects
      FOR ALL TO anon USING (bucket_id = 'photos');
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'Skipping direct UPDATE/DELETE policy on storage.objects.';
  WHEN OTHERS THEN
    RAISE NOTICE 'Policy creation skipped: %', SQLERRM;
  END;
END $$;

-- ============================================
-- VERIFICATION QUERIES
-- Run these to verify everything is active:
-- ============================================

-- Check tables exist
-- SELECT * FROM pg_tables WHERE schemaname = 'public';

-- Check RLS enabled
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';

-- Check policies
-- SELECT * FROM pg_policies WHERE schemaname = 'public';

-- Check Realtime publication
-- SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';

