const supabaseConfig = {
  url: 'https://apshtzpftfzdrygicvjl.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwc2h0enBmdGZ6ZHJ5Z2ljdmpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwOTU0NjQsImV4cCI6MjA5NjY3MTQ2NH0.TAlxGXkvyUbCdVBCvYmVQ5JspehVwUCrLEMWCLN3lBs'
};

// ⚠️ SECURITY NOTE: This anon key is public (designed for client-side use).
// MUST enable Row Level Security (RLS) on ALL tables in Supabase Dashboard:
// 1. Go to Supabase Dashboard → Authentication → Policies
// 2. Enable RLS on each table: users, patrol_reports, findings, attendance_logs,
//    mutasi_logs, complaints, areas, pos_list, rosters, config
// 3. Create policies (see supabase-rls-policies.sql for reference)
// 4. For anon key: policies should allow operations based on your auth model
//    Current app uses local auth, so policies allow all for 'anon' role
// 5. For production: Consider integrating Supabase Auth with JWT for stricter policies

export const isSupabaseConfigured = () => {
  return supabaseConfig.url && supabaseConfig.anonKey && supabaseConfig.url !== 'https://your-project.supabase.co';
};

export default supabaseConfig;
