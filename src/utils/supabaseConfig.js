const supabaseConfig = {
  url: import.meta.env.VITE_SUPABASE_URL || 'https://kjfpgtrhspvozikzttbe.supabase.co',
  anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_ijLoQjmjFNU6yC93yj5M8A_x_sFIhG8'
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
