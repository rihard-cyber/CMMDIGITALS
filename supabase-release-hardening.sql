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
