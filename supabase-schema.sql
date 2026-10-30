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

-- ── Enable Realtime for all tables ──────────
ALTER PUBLICATION supabase_realtime ADD TABLE users;
ALTER PUBLICATION supabase_realtime ADD TABLE patrol_reports;
ALTER PUBLICATION supabase_realtime ADD TABLE findings;
ALTER PUBLICATION supabase_realtime ADD TABLE attendance_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE mutasi_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE complaints;
ALTER PUBLICATION supabase_realtime ADD TABLE areas;
ALTER PUBLICATION supabase_realtime ADD TABLE pos_list;
ALTER PUBLICATION supabase_realtime ADD TABLE rosters;
ALTER PUBLICATION supabase_realtime ADD TABLE config;

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
