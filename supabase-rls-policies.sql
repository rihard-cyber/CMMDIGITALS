-- ============================================
-- SMPJDC - Supabase RLS Policies
-- Execute this SQL in Supabase SQL Editor
-- Run AFTER creating tables (supabase-schema.sql)
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

-- ============================================
-- POLICIES FOR ANON KEY (Current App Architecture)
-- The app uses Supabase anon key + local auth
-- Policies allow all operations for authenticated anon users
-- For production: Consider adding JWT-based auth with custom claims
-- ============================================

-- USERS - Allow all for anon (app handles auth locally)
CREATE POLICY "Allow all for anon users" ON users
  FOR ALL TO anon USING (true) WITH CHECK (true);

-- PATROL_REPORTS - Allow all for anon
CREATE POLICY "Allow all for anon patrol_reports" ON patrol_reports
  FOR ALL TO anon USING (true) WITH CHECK (true);

-- FINDINGS - Allow all for anon
CREATE POLICY "Allow all for anon findings" ON findings
  FOR ALL TO anon USING (true) WITH CHECK (true);

-- ATTENDANCE_LOGS - Allow all for anon
CREATE POLICY "Allow all for anon attendance_logs" ON attendance_logs
  FOR ALL TO anon USING (true) WITH CHECK (true);

-- MUTASI_LOGS - Allow all for anon
CREATE POLICY "Allow all for anon mutasi_logs" ON mutasi_logs
  FOR ALL TO anon USING (true) WITH CHECK (true);

-- COMPLAINTS - Allow all for anon (public complaint form)
CREATE POLICY "Allow all for anon complaints" ON complaints
  FOR ALL TO anon USING (true) WITH CHECK (true);

-- AREAS - Allow all for anon
CREATE POLICY "Allow all for anon areas" ON areas
  FOR ALL TO anon USING (true) WITH CHECK (true);

-- POS_LIST - Allow all for anon
CREATE POLICY "Allow all for anon pos_list" ON pos_list
  FOR ALL TO anon USING (true) WITH CHECK (true);

-- ROSTERS - Allow all for anon
CREATE POLICY "Allow all for anon rosters" ON rosters
  FOR ALL TO anon USING (true) WITH CHECK (true);

-- CONFIG - Allow all for anon
CREATE POLICY "Allow all for anon config" ON config
  FOR ALL TO anon USING (true) WITH CHECK (true);

-- ============================================
-- ALTERNATIVE: STRICTER POLICIES (For Future Auth Integration)
-- Uncomment and use when integrating Supabase Auth
-- ============================================

-- -- USERS - Users can only read/update their own data
-- CREATE POLICY "Users can read own data" ON users
--   FOR SELECT TO authenticated USING (auth.uid()::text = id);
-- CREATE POLICY "Users can update own data" ON users
--   FOR UPDATE TO authenticated USING (auth.uid()::text = id);

-- -- PATROL_REPORTS - Users can read all, write own
-- CREATE POLICY "Anyone can read patrol_reports" ON patrol_reports
--   FOR SELECT TO authenticated USING (true);
-- CREATE POLICY "Users can insert own patrol_reports" ON patrol_reports
--   FOR INSERT TO authenticated WITH CHECK (auth.uid()::text = user_id);
-- CREATE POLICY "Users can update own patrol_reports" ON patrol_reports
--   FOR UPDATE TO authenticated USING (auth.uid()::text = user_id);

-- -- FINDINGS - Similar pattern
-- CREATE POLICY "Anyone can read findings" ON findings
--   FOR SELECT TO authenticated USING (true);
-- CREATE POLICY "Users can insert own findings" ON findings
--   FOR INSERT TO authenticated WITH CHECK (auth.uid()::text = nrp);
-- CREATE POLICY "Users can update own findings" ON findings
--   FOR UPDATE TO authenticated USING (auth.uid()::text = nrp);

-- -- ADMIN policies (requires custom claim: app_metadata.role = 'admin')
-- CREATE POLICY "Admins can do everything" ON users
--   FOR ALL TO authenticated USING (auth.jwt() ->> 'app_metadata' ->> 'role' = 'admin');

-- ============================================
-- STORAGE POLICIES (for photos bucket)
-- ============================================

-- Enable RLS on storage.objects
-- Note: Run this in Supabase Storage settings or via Dashboard

-- INSERT policy - authenticated users can upload
-- CREATE POLICY "Authenticated users can upload photos" ON storage.objects
--   FOR INSERT TO authenticated WITH CHECK (bucket_id = 'photos');

-- SELECT policy - public read access for photos
-- CREATE POLICY "Public read access for photos" ON storage.objects
--   FOR SELECT USING (bucket_id = 'photos');

-- UPDATE/DELETE - only owners (requires custom metadata)
-- CREATE POLICY "Users can update own photos" ON storage.objects
--   FOR UPDATE TO authenticated USING (bucket_id = 'photos' AND auth.uid()::text = (metadata->>'owner')::text);

-- ============================================
-- VERIFICATION QUERIES
-- Run these to verify policies are active:
-- ============================================

-- SELECT * FROM pg_policies WHERE schemaname = 'public';
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';