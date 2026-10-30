-- ============================================
-- SMPJDC - COMPLETE SUPABASE SETUP (SCHEMA + RLS)
-- Run this entire file in Supabase Dashboard → SQL Editor
-- ============================================

-- ============================================
-- PART 1: SCHEMA (from supabase-schema.sql)
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

-- ── Rosters (single doc per month) ────────────
CREATE TABLE IF NOT EXISTS rosters (
  supabase_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  year_month TEXT UNIQUE,
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

-- ── Enable Realtime for all tables (Idempotent) ──
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'users') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE users;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'patrol_reports') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE patrol_reports;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'findings') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE findings;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'attendance_logs') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE attendance_logs;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'mutasi_logs') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE mutasi_logs;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'complaints') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE complaints;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'areas') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE areas;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'pos_list') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE pos_list;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'rosters') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE rosters;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'config') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE config;
  END IF;
END $$;

-- ============================================
-- PART 2: RLS POLICIES (from supabase-rls-policies.sql)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE patrol_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE mutasi_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE pos_list ENABLE ROW LEVEL SECURITY;
ALTER TABLE rosters ENABLE ROW LEVEL SECURITY;
ALTER TABLE config ENABLE ROW LEVEL SECURITY;

-- POLICIES FOR ANON KEY (Current App Architecture)
-- The app uses Supabase anon key + local auth
-- Policies allow all operations for authenticated anon users

-- USERS - Allow all for anon (app handles auth locally)
DROP POLICY IF EXISTS "Allow all for anon users" ON users;
CREATE POLICY "Allow all for anon users" ON users
  FOR ALL TO anon USING (true) WITH CHECK (true);

-- PATROL_REPORTS - Allow all for anon
DROP POLICY IF EXISTS "Allow all for anon patrol_reports" ON patrol_reports;
CREATE POLICY "Allow all for anon patrol_reports" ON patrol_reports
  FOR ALL TO anon USING (true) WITH CHECK (true);

-- FINDINGS - Allow all for anon
DROP POLICY IF EXISTS "Allow all for anon findings" ON findings;
CREATE POLICY "Allow all for anon findings" ON findings
  FOR ALL TO anon USING (true) WITH CHECK (true);

-- ATTENDANCE_LOGS - Allow all for anon
DROP POLICY IF EXISTS "Allow all for anon attendance_logs" ON attendance_logs;
CREATE POLICY "Allow all for anon attendance_logs" ON attendance_logs
  FOR ALL TO anon USING (true) WITH CHECK (true);

-- MUTASI_LOGS - Allow all for anon
DROP POLICY IF EXISTS "Allow all for anon mutasi_logs" ON mutasi_logs;
CREATE POLICY "Allow all for anon mutasi_logs" ON mutasi_logs
  FOR ALL TO anon USING (true) WITH CHECK (true);

-- COMPLAINTS - Allow all for anon (public complaint form)
DROP POLICY IF EXISTS "Allow all for anon complaints" ON complaints;
CREATE POLICY "Allow all for anon complaints" ON complaints
  FOR ALL TO anon USING (true) WITH CHECK (true);

-- AREAS - Allow all for anon
DROP POLICY IF EXISTS "Allow all for anon areas" ON areas;
CREATE POLICY "Allow all for anon areas" ON areas
  FOR ALL TO anon USING (true) WITH CHECK (true);

-- POS_LIST - Allow all for anon
DROP POLICY IF EXISTS "Allow all for anon pos_list" ON pos_list;
CREATE POLICY "Allow all for anon pos_list" ON pos_list
  FOR ALL TO anon USING (true) WITH CHECK (true);

-- ROSTERS - Allow all for anon
DROP POLICY IF EXISTS "Allow all for anon rosters" ON rosters;
CREATE POLICY "Allow all for anon rosters" ON rosters
  FOR ALL TO anon USING (true) WITH CHECK (true);

-- CONFIG - Allow all for anon
DROP POLICY IF EXISTS "Allow all for anon config" ON config;
CREATE POLICY "Allow all for anon config" ON config
  FOR ALL TO anon USING (true) WITH CHECK (true);

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