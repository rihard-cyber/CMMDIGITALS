import { createClient } from '@supabase/supabase-js';
import supabaseConfig, { isSupabaseConfigured } from './supabaseConfig';

let supabase = null;

/** Tenant aktif saat ini (di-set setelah login & pemilihan tenant) */
let currentTenantId = null;

/** Set tenant aktif. Panggil setelah user memilih tenant di layar login. */
const setCurrentTenant = (tenantId) => {
  currentTenantId = tenantId || null;
  try { localStorage.setItem('cmdigital_active_tenant', tenantId || ''); } catch (_) {}
};

/** Ambil tenant aktif yang sedang dipilih. */
const getCurrentTenant = () => {
  if (currentTenantId) return currentTenantId;
  try {
    const stored = localStorage.getItem('cmdigital_active_tenant');
    if (stored) currentTenantId = stored;
  } catch (_) {}
  return currentTenantId;
};

/** Hapus konteks tenant (logout). */
const clearCurrentTenant = () => {
  currentTenantId = null;
  try { localStorage.removeItem('cmdigital_active_tenant'); } catch (_) {}
};

export const initSupabase = () => {
  if (supabase) return supabase;
  if (!isSupabaseConfigured()) {
    console.log('[Supabase] Tidak dikonfigurasi — fallback ke localStorage');
    return null;
  }
  try {
    supabase = createClient(supabaseConfig.url, supabaseConfig.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false
      },
      realtime: { params: { eventsPerSecond: 10 } }
    });
    console.log('[Supabase] Terhubung:', supabaseConfig.url);
  } catch (e) {
    console.warn('[Supabase] Gagal init:', e);
    supabase = null;
  }
  return supabase;
};

// ─── Supabase Auth: NRP + PIN → email sintetis ───
export const nrpToEmail = (nrp) => {
  const local = String(nrp || '').trim().toLowerCase().replace(/[^a-z0-9._-]/g, '');
  return local ? `${local}@cmmdigital.app` : '';
};

export const getAuthSession = async () => {
  const client = initSupabase();
  if (!client) return null;
  try {
    const { data, error } = await client.auth.getSession();
    if (error) throw error;
    return data.session || null;
  } catch (e) {
    console.warn('[Auth] Gagal membaca session:', e?.message || e);
    return null;
  }
};

export const getAuthProfile = async () => {
  const client = initSupabase();
  if (!client) return { session: null, profile: null };
  const session = await getAuthSession();
  if (!session) return { session: null, profile: null };
  const { data, error } = await client
    .from('users')
    .select('*')
    .eq('auth_user_id', session.user.id)
    .maybeSingle();
  if (error) throw error;
  return { session, profile: data ? normalizeDoc(data) : null };
};

export const signInWithNrp = async (nrp, pin) => {
  const client = initSupabase();
  if (!client) return { error: new Error('Supabase belum dikonfigurasi') };
  const email = nrpToEmail(nrp);
  if (!email) return { error: new Error('NRP tidak valid') };

  const { data, error } = await client.auth.signInWithPassword({ email, password: pin });
  if (error) return { error };

  const { data: profile, error: profileError } = await client
    .from('users')
    .select('*')
    .eq('auth_user_id', data.user.id)
    .maybeSingle();

  if (profileError) {
    await client.auth.signOut().catch(() => {});
    return { error: profileError };
  }
  if (!profile) {
    await client.auth.signOut().catch(() => {});
    return { error: new Error('Akun ini belum terhubung ke profil anggota. Hubungi Admin Super.') };
  }
  if ((profile.status || '').toLowerCase() === 'nonaktif') {
    await client.auth.signOut().catch(() => {});
    return { error: new Error('Akun ini sedang nonaktif. Hubungi Admin Super.') };
  }

  return { session: data.session, profile: normalizeDoc(profile) };
};

export const signOutAuth = async () => {
  const client = initSupabase();
  if (!client) return;
  try { await client.auth.signOut(); } catch (e) { console.warn('[Auth] Gagal sign out:', e?.message || e); }
};

/** Ganti PIN sendiri. PIN lama diverifikasi di database (bcrypt). */
export const changeMyPin = async (currentPin, newPin) => {
  const client = initSupabase();
  if (!client) throw new Error('Supabase belum dikonfigurasi');
  const { error } = await client.rpc('change_my_pin', {
    p_current_pin: String(currentPin || ''),
    p_new_pin: String(newPin || '')
  });
  if (error) throw error;
};

/** Admin Super membuat akun login + profil anggota sekaligus. */
export const adminCreateMember = async ({ nrp, nama, jabatan, regu, nomorHp, tenantId, tempPin }) => {
  const client = initSupabase();
  if (!client) throw new Error('Supabase belum dikonfigurasi');
  const { data, error } = await client.rpc('admin_create_member', {
    p_nrp: String(nrp || ''),
    p_nama: String(nama || ''),
    p_jabatan: String(jabatan || 'Anggota'),
    p_regu: String(regu || ''),
    p_nomor_hp: String(nomorHp || ''),
    p_tenant_id: tenantId || getCurrentTenant() || null,
    p_temp_pin: tempPin ? String(tempPin) : null
  });
  if (error) throw error;
  return normalizeDoc(data);
};

export const adminResetMemberPin = async (supabaseId, tempPin) => {
  const client = initSupabase();
  if (!client) throw new Error('Supabase belum dikonfigurasi');
  const { error } = await client.rpc('admin_reset_member_pin', {
    p_supabase_id: supabaseId,
    p_temp_pin: String(tempPin || '')
  });
  if (error) throw error;
};

export const adminDeleteMember = async (supabaseId) => {
  const client = initSupabase();
  if (!client) throw new Error('Supabase belum dikonfigurasi');
  const { error } = await client.rpc('admin_delete_member', {
    p_supabase_id: supabaseId
  });
  if (error) throw error;
};

export const updateMember = async (supabaseId, updates) => {
  const client = initSupabase();
  if (!client) throw new Error('Supabase belum dikonfigurasi');
  const dbData = prepareData(updates, 'users');
  const { data, error } = await client.rpc('update_member', {
    p_supabase_id: supabaseId,
    p_updates: dbData
  });
  if (error) throw error;
  return data ? normalizeDoc(data) : null;
};

/** Form komplain publik: daftar tenant tanpa membuka tabel tenants ke anon. */
export const loadPublicTenants = async () => {
  const client = initSupabase();
  if (!client) return [];
  const { data, error } = await client.rpc('list_public_tenants');
  if (error) throw error;
  return Array.isArray(data) ? data : [];
};

/** Kirim komplain tanpa login (RPC tervalidasi di database). */
export const submitPublicComplaint = async (complaint) => {
  const client = initSupabase();
  if (!client) throw new Error('Supabase belum dikonfigurasi');
  const tenantId = complaint?.tenant_id || complaint?.tenantId || getCurrentTenant();
  if (!tenantId) throw new Error('Lokasi/gedung komplain belum dipilih');
  const { data, error } = await client.rpc('submit_complaint', {
    payload: {
      ...complaint,
      tenant_id: tenantId,
      ticket_id: complaint?.ticketId || complaint?.ticket_id,
      created_at: complaint?.createdAt || complaint?.created_at
    }
  });
  if (error) throw error;
  return data;
};

/** Lacak tiket publik lewat RPC terbatas (tanpa akses tabel langsung). */
export const trackComplaint = async (ticketId) => {
  const client = initSupabase();
  if (!client || !ticketId) return null;
  const { data, error } = await client.rpc('track_complaint', {
    p_ticket_id: String(ticketId).trim().toUpperCase()
  });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  return row ? normalizeDoc(row) : null;
};

// ─── Helpers: snake_case ↔ camelCase ───
function toSnake(str) {
  return str.replace(/[A-Z]/g, c => '_' + c.toLowerCase());
}

function toCamel(str) {
  return str.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

function normalizeDoc(doc) {
  if (!doc || typeof doc !== 'object') return doc;
  if (doc instanceof Date) return doc.toISOString();
  if (Array.isArray(doc)) return doc.map(normalizeDoc);
  const { supabase_id, ...rest } = doc;
  const result = { supabaseId: supabase_id, firebaseId: supabase_id };
  for (const [key, value] of Object.entries(rest)) {
    const normalized = normalizeDoc(value);
    result[toCamel(key)] = normalized;
    // Pertahankan juga nama kolom asli (snake_case) agar komponen lama
    // yang membaca field seperti item_code/nama_barang tetap kompatibel.
    if (key.includes('_')) result[key] = normalized;
  }
  return result;
}

const KNOWN_TABLE_COLUMNS = {
  users: new Set(['id', 'nrp', 'nama', 'jabatan', 'regu', 'avatar', 'status', 'email', 'nomor_hp', 'last_active', 'firebase_saved_at', 'created_at', 'updated_at', 'tenant_id', 'auth_user_id', 'must_change_password', 'pin_updated_at']),
  patrol_reports: new Set(['id', 'user_id', 'user_name', 'nrp', 'nomor_hp', 'shift', 'regu', 'area_id', 'gedung', 'lantai', 'zona', 'titik', 'kondisi', 'keterangan', 'foto', 'severity', 'timestamp', 'timestamp_end', 'date', 'time', 'kategori', 'kode_temuan', 'temuan', 'status', 'anti_fraud', 'jabatan', 'created_at', 'firebase_saved_at', 'updated_at', 'tenant_id']),
  findings: new Set(['id', 'report_id', 'kategori', 'area', 'tanggal', 'pelapor', 'nrp', 'nomor_hp', 'shift', 'regu', 'status', 'severity', 'detail', 'foto', 'department', 'wa_status', 'wa_sent_at', 'created_at', 'firebase_saved_at', 'updated_at', 'tenant_id']),
  attendance_logs: new Set(['id', 'tanggal', 'shift', 'regu', 'details', 'created_at', 'firebase_saved_at', 'updated_at', 'tenant_id']),
  mutasi_logs: new Set(['id', 'tanggal', 'shift', 'regu', 'waktu', 'tanggal_kejadian', 'jam_kejadian', 'lokasi', 'uraian', 'kategori', 'foto', 'petugas', 'nrp', 'nomor_hp', 'tindak_lanjut', 'pelapor', 'anti_fraud', 'petugas_masuk', 'petugas_keluar', 'catatan', 'created_at', 'firebase_saved_at', 'updated_at', 'tenant_id']),
  complaints: new Set(['id', 'ticket_id', 'name', 'phone', 'tenant', 'floor', 'location', 'category', 'description', 'department', 'status', 'remarks', 'wa_status', 'wa_sent_at', 'photos', 'history', 'created_at', 'firebase_saved_at', 'updated_at', 'tenant_id']),
  areas: new Set(['id', 'gedung', 'lantai', 'nomor_titik', 'zona', 'titik', 'qr_code', 'created_at', 'firebase_saved_at', 'updated_at', 'tenant_id']),
  pos_list: new Set(['id', 'lantai', 'titik', 'keterangan', 'kode', 'created_at', 'firebase_saved_at', 'updated_at', 'tenant_id']),
  found_items: new Set(['id', 'item_code', 'tanggal_penemuan', 'jam_penemuan', 'tanggal_laporan', 'nama_barang', 'jenis_barang', 'kategori_barang', 'lokasi_penemuan', 'nama_penemu', 'kategori_penemu', 'kontak_penemu', 'keterangan_penemu', 'foto_barang', 'photos', 'status', 'nama_pengambil', 'kontak_pengambil', 'no_identitas_pengambil', 'foto_identitas', 'diserahkan_oleh', 'tanggal_pengambilan', 'catatan_serah_terima', 'keterangan', 'created_at', 'firebase_saved_at', 'updated_at', 'tenant_id']),
  rosters: new Set(['year_month', 'roster_data', 'updated_by', 'created_at', 'updated_at', 'tenant_id']),
  config: new Set(['key', 'data', 'updated_at', 'tenant_id']),
  tenants: new Set(['id', 'nama', 'kode', 'slug', 'alamat', 'firebase_saved_at', 'created_at', 'updated_at', 'supabase_id']),
};

function prepareData(data, tableName) {
  const { supabaseId, firebaseId, ...rest } = data || {};
  const result = {};
  const allowed = KNOWN_TABLE_COLUMNS[tableName];
  for (const [key, value] of Object.entries(rest)) {
    if (value === undefined) continue;
    const snakeKey = toSnake(key);
    if (allowed && !allowed.has(snakeKey)) continue;
    result[snakeKey] = value;
  }

  // Otomatis sisipkan tenant_id untuk tabel data (kecuali tenants sendiri)
  if (tableName !== 'tenants' && allowed && allowed.has('tenant_id') && !result.tenant_id) {
    const t = getCurrentTenant();
    if (t) result.tenant_id = t;
  }
  return result;
}

// ─── Factory: real-time subscriber ───
const createSubscriber = (tableName, callback, orderField = 'created_at', opts = {}) => {
  const client = initSupabase();
  if (!client) { callback(null); return () => {}; }

  let unsubscribed = false;
  const channelName = `${tableName}-changes-${Date.now()}`;

  const fetchData = async () => {
    if (unsubscribed) return;
    const tenantId = getCurrentTenant();
    let query = client.from(tableName).select('*');
    // Filter data hanya untuk tenant aktif (kecuali tabel tenants itu sendiri)
    if (tableName !== 'tenants' && tenantId) {
      query = query.eq('tenant_id', tenantId);
    }
    const orderCol = toSnake(orderField);
    query = query.order(orderCol, { ascending: false, nullsFirst: false });
    if (opts.limit) query = query.limit(opts.limit);

    const { data, error } = await query;
    if (error) {
      console.warn(`[Supabase] Gagal baca ${tableName}:`, error);
      callback(null);
      return;
    }
    callback((data || []).map(normalizeDoc));
  };

  fetchData();

  const channel = client.channel(channelName)
    .on('postgres_changes',
      { event: '*', schema: 'public', table: tableName },
      () => { fetchData(); }
    )
    .subscribe();

  return () => {
    unsubscribed = true;
    client.removeChannel(channel);
  };
};

// ─── Factory: CRUD ───
const createAdder = (tableName) => async (data) => {
  const client = initSupabase();
  if (!client) return null;
  const dbData = prepareData(data, tableName);
  if (!dbData.created_at) dbData.created_at = new Date().toISOString();
  dbData.firebase_saved_at = new Date().toISOString();

  // Coba upsert dulu (jika UNIQUE constraint ada di DB)
  // Jika gagal karena constraint tidak ada, fallback ke insert biasa
  try {
    if (dbData.id) {
      // Cek apakah record dengan id ini sudah ada DI TENANT YANG SAMA.
      // Filter tenant mencegah update tidak sengaja menimpa data tenant lain
      // saat id kebetulan sama.
      const tenantId = tableName !== 'tenants' ? getCurrentTenant() : null;
      let existingQuery = client
        .from(tableName)
        .select('supabase_id')
        .eq('id', dbData.id);
      if (tenantId) existingQuery = existingQuery.eq('tenant_id', tenantId);
      const { data: existing } = await existingQuery.maybeSingle();

      if (existing) {
        // Update record yang sudah ada
        let updateQuery = client
          .from(tableName)
          .update(dbData)
          .eq('id', dbData.id);
        if (tenantId) updateQuery = updateQuery.eq('tenant_id', tenantId);
        const { data: updated, error: updateErr } = await updateQuery
          .select('supabase_id')
          .single();
        if (updateErr) throw updateErr;
        return updated?.supabase_id;
      }
    }

    // Insert baru
    const { data: result, error } = await client
      .from(tableName)
      .insert(dbData)
      .select('supabase_id')
      .single();
    if (error) throw error;
    return result?.supabase_id;
  } catch (e) {
    // Jika insert duplikat (race condition), anggap sukses
    if (e?.code === '23505') {
      console.warn(`[Supabase] Duplicate ${tableName}.id — skipped:`, dbData.id);
      return null;
    }
    throw e;
  }
};


const createUpdater = (tableName) => async (supabaseId, updates) => {
  const client = initSupabase();
  if (!client) return;
  try {
    const dbData = prepareData(updates, tableName);
    dbData.updated_at = new Date().toISOString();
    const tenantId = getCurrentTenant();
    let query = client.from(tableName).update(dbData).eq('supabase_id', supabaseId);
    if (tableName !== 'tenants' && tenantId) {
      query = query.eq('tenant_id', tenantId);
    }
    await query;
  } catch (e) {
    console.warn(`[Supabase] Gagal update ${tableName}:`, e);
  }
};

const createDeleter = (tableName) => async (supabaseId) => {
  const client = initSupabase();
  if (!client) return;
  const tenantId = getCurrentTenant();
  let query = client.from(tableName).delete().eq('supabase_id', supabaseId);
  if (tableName !== 'tenants' && tenantId) {
    query = query.eq('tenant_id', tenantId);
  }
  const { error } = await query;
  if (error) throw error;
};

const createLoader = (tableName, orderField = 'created_at') => async () => {
  const client = initSupabase();
  if (!client) return null;
  try {
    const tenantId = getCurrentTenant();
    let query = client.from(tableName).select('*');
    if (tableName !== 'tenants' && tenantId) {
      query = query.eq('tenant_id', tenantId);
    }
    const orderCol = toSnake(orderField);
    const { data, error } = await query.order(orderCol, { ascending: false, nullsFirst: false });
    if (error) throw error;
    return (data || []).map(normalizeDoc);
  } catch (e) {
    console.warn(`[Supabase] Gagal load ${tableName}:`, e);
    return null;
  }
};

// ─── Factory: bulk operations ───
const createBulkDeleter = (tableName) => async () => {
  const client = initSupabase();
  if (!client) return false;
  try {
    const tenantId = getCurrentTenant();
    let query = client.from(tableName).delete().neq('supabase_id', '00000000-0000-0000-0000-000000000000');
    if (tableName !== 'tenants' && tenantId) {
      query = query.eq('tenant_id', tenantId);
    }
    const { error } = await query;
    if (error) throw error;
    return true;
  } catch (e) {
    console.warn(`[Supabase] Gagal hapus semua ${tableName}:`, e);
    return false;
  }
};

// ─── Complaints ───
export const subscribeComplaints = (callback, opts = {}) =>
  createSubscriber('complaints', callback, 'created_at', opts);

const addComplaintDirect = createAdder('complaints');

// Form publik tidak punya session; gunakan RPC submit_complaint.
// Pengguna login tetap memakai insert langsung agar semua field tersimpan.
export const addComplaintToFirestore = async (complaint) => {
  const client = initSupabase();
  if (!client) return null;
  try {
    const { data: sessionData } = await client.auth.getSession();
    if (sessionData?.session) {
      return await addComplaintDirect(complaint);
    }
    const result = await submitPublicComplaint(complaint);
    return result?.supabase_id || null;
  } catch (e) {
    console.warn('[Supabase] Gagal simpan komplain:', e?.message || e);
    throw e;
  }
};

export const updateComplaintInFirestore = createUpdater('complaints');
export const deleteComplaintFromFirestore = createDeleter('complaints');
export const loadAllComplaintsFromFirestore = createLoader('complaints');

// Cek status tiket dari perangkat mana pun (form publik)
export const loadComplaintByTicket = (ticketId) => trackComplaint(ticketId);

// ─── Found Items (Penemuan Barang / Lost & Found) ───
export const subscribeFoundItems = (callback, opts = {}) =>
  createSubscriber('found_items', callback, 'created_at', opts);
export const addFoundItemToFirestore = createAdder('found_items');
export const updateFoundItemInFirestore = createUpdater('found_items');
export const deleteFoundItemFromFirestore = createDeleter('found_items');
export const loadAllFoundItemsFromFirestore = createLoader('found_items');

// ─── Patrol Reports ───
export const subscribeReports = (callback, opts = {}) =>
  createSubscriber('patrol_reports', callback, 'timestamp', opts);
export const addReportToFirestore = createAdder('patrol_reports');
export const updateReportInFirestore = createUpdater('patrol_reports');
export const deleteReportFromFirestore = createDeleter('patrol_reports');

// ─── Findings ───
export const subscribeFindings = (callback, opts = {}) =>
  createSubscriber('findings', callback, 'created_at', opts);
export const addFindingToFirestore = createAdder('findings');
export const updateFindingInFirestore = createUpdater('findings');
export const deleteFindingFromFirestore = createDeleter('findings');

// ─── Attendance Logs ───
export const subscribeAttendanceLogs = (callback, opts = {}) =>
  createSubscriber('attendance_logs', callback, 'tanggal', opts);
export const addAttendanceLogToFirestore = createAdder('attendance_logs');
export const updateAttendanceLogInFirestore = createUpdater('attendance_logs');
export const deleteAttendanceLogFromFirestore = createDeleter('attendance_logs');

// ─── Mutasi Logs ───
export const subscribeMutasiLogs = (callback, opts = {}) =>
  createSubscriber('mutasi_logs', callback, 'created_at', opts);
export const addMutasiLogToFirestore = createAdder('mutasi_logs');
export const updateMutasiLogInFirestore = createUpdater('mutasi_logs');
export const deleteMutasiLogFromFirestore = createDeleter('mutasi_logs');

// ─── Users ───
export const subscribeUsers = (callback, opts = {}) =>
  createSubscriber('users', callback, 'nrp', opts);
export const addUserToFirestore = createAdder('users');
// Semua update user (profil sendiri maupun anggota oleh Admin Super)
// melewati RPC update_member agar kolom sensitif tidak bisa diubah langsung.
export const updateUserInFirestore = (supabaseId, updates) => updateMember(supabaseId, updates);
export const deleteUserFromFirestore = (supabaseId) => adminDeleteMember(supabaseId);

// Reset massal user tidak lagi diizinkan — akun login dikelola lewat Auth.
export const resetUsersInFirestore = async () => {
  console.warn('[Supabase] resetUsersInFirestore dinonaktifkan. Gunakan manajemen anggota.');
  return false;
};

// ─── Areas / Checkpoints ───
export const subscribeAreas = (callback, opts = {}) =>
  createSubscriber('areas', callback, 'created_at', opts);
export const addAreaToFirestore = createAdder('areas');
export const updateAreaInFirestore = createUpdater('areas');
export const deleteAreaFromFirestore = createDeleter('areas');

// ─── Pos List ───
export const subscribePosList = (callback, opts = {}) =>
  createSubscriber('pos_list', callback, 'created_at', opts);
export const addPosToFirestore = createAdder('pos_list');
export const updatePosInFirestore = createUpdater('pos_list');
export const deletePosFromFirestore = createDeleter('pos_list');

// ─── WA Contacts (single row in config table) ───
export const subscribeWAContacts = (callback) => {
  const client = initSupabase();
  if (!client) { callback(null); return () => {}; }
  let unsubscribed = false;
  const channelName = `wa-contacts-${Date.now()}`;

  const fetchWA = async () => {
    if (unsubscribed) return;
    const tenantId = getCurrentTenant();
    let query = client.from('config').select('*').eq('key', 'wa_contacts');
    if (tenantId) query = query.eq('tenant_id', tenantId);
    const { data, error } = await query.maybeSingle();
    if (error) { callback(null); return; }
    callback(data?.data || null);
  };

  fetchWA();

  const channel = client.channel(channelName)
    .on('postgres_changes',
      { event: '*', schema: 'public', table: 'config', filter: `key=eq.wa_contacts` },
      () => { fetchWA(); }
    )
    .subscribe();

  return () => {
    unsubscribed = true;
    client.removeChannel(channel);
  };
};

export const saveWAContactsToFirestore = async (contacts) => {
  const client = initSupabase();
  if (!client) return false;
  try {
    const tenantId = getCurrentTenant();
    if (!tenantId) {
      console.warn('[Supabase] WA contacts tidak disimpan: tenant aktif belum dipilih');
      return false;
    }
    const upsertData = {
      key: 'wa_contacts',
      data: contacts,
      tenant_id: tenantId,
      updated_at: new Date().toISOString()
    };
    const { error } = await client
      .from('config')
      .upsert(upsertData, { onConflict: 'key,tenant_id' });
    if (error) throw error;
    return true;
  } catch (e) {
    console.warn('[Supabase] Gagal simpan WA contacts:', e);
    return false;
  }
};

// ─── Roster ───
export const saveRosterToFirestore = async (yearMonth, rosterData, userId) => {
  const client = initSupabase();
  if (!client) return false;
  try {
    const tenantId = getCurrentTenant();
    // Roster wajib terikat ke tenant aktif (satu roster per bulan per lokasi)
    if (!tenantId) {
      console.warn('[Supabase] Roster tidak disimpan: tenant aktif belum dipilih');
      return false;
    }
    const upsertData = {
      year_month: yearMonth,
      roster_data: rosterData,
      updated_by: userId || 'unknown',
      updated_at: new Date().toISOString(),
      tenant_id: tenantId
    };
    const { error } = await client
      .from('rosters')
      .upsert(upsertData, { onConflict: 'year_month,tenant_id' });
    if (error) throw error;
    return true;
  } catch (e) {
    console.warn('[Supabase] Gagal simpan roster:', e);
    return false;
  }
};

export const loadRosterFromFirestore = async (yearMonth) => {
  const client = initSupabase();
  if (!client) return null;
  try {
    const tenantId = getCurrentTenant();
    if (!tenantId) return null;
    let query = client.from('rosters').select('*')
      .eq('year_month', yearMonth)
      .eq('tenant_id', tenantId);
    const { data, error } = await query.maybeSingle();
    if (error) throw error;
    return data?.roster_data || null;
  } catch (e) {
    console.warn('[Supabase] Gagal baca roster:', e);
    return null;
  }
};

export const subscribeRoster = (yearMonth, callback) => {
  const client = initSupabase();
  if (!client) { callback(null); return () => {}; }
  let unsubscribed = false;
  const channelName = `roster-${yearMonth}-${Date.now()}`;

  const fetchRoster = async () => {
    if (unsubscribed) return;
    const tenantId = getCurrentTenant();
    if (!tenantId) { callback(null); return; }
    let query = client.from('rosters').select('*')
      .eq('year_month', yearMonth)
      .eq('tenant_id', tenantId);
    const { data, error } = await query.maybeSingle();
    if (error) { callback(null); return; }
    callback(data?.roster_data || null);
  };

  fetchRoster();

  const channel = client.channel(channelName)
    .on('postgres_changes',
      { event: '*', schema: 'public', table: 'rosters', filter: `year_month=eq.${yearMonth}` },
      () => { fetchRoster(); }
    )
    .subscribe();

  return () => {
    unsubscribed = true;
    client.removeChannel(channel);
  };
};

// ─── Bulk Operations ───
export const clearAllPatrolDataInFirestore = async () => {
  const client = initSupabase();
  if (!client) return false;
  const tables = ['patrol_reports', 'findings', 'mutasi_logs', 'attendance_logs', 'complaints'];
  try {
    const tenantId = getCurrentTenant();
    for (const table of tables) {
      let query = client.from(table).delete().neq('supabase_id', '00000000-0000-0000-0000-000000000000');
      if (tenantId) query = query.eq('tenant_id', tenantId);
      const { error } = await query;
      if (error) console.warn(`[Supabase] Gagal hapus ${table}:`, error);
    }
    return true;
  } catch (e) {
    console.warn('[Supabase] Gagal membersihkan data:', e);
    return false;
  }
};

export const deleteOldDataInFirestore = async (olderThanDays = 90) => {
  const client = initSupabase();
  if (!client) return { success: false, count: 0 };
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - olderThanDays);
  const cutoffStr = cutoff.toISOString();
  const tenantId = getCurrentTenant();
  const collections = [
    { name: 'patrol_reports', dateField: 'timestamp' },
    { name: 'findings', dateField: 'created_at' },
    { name: 'mutasi_logs', dateField: 'created_at' },
    { name: 'attendance_logs', dateField: 'tanggal' },
    { name: 'complaints', dateField: 'created_at' }
  ];
  let totalDeleted = 0;
  try {
    for (const { name, dateField } of collections) {
      let query = client.from(name).select('supabase_id,' + dateField);
      if (tenantId) query = query.eq('tenant_id', tenantId);
      const { data, error } = await query;
      if (error) continue;
      const toDelete = (data || []).filter(row => {
        const dateVal = row[dateField];
        if (!dateVal) return false;
        return new Date(dateVal) < cutoff;
      }).map(row => row.supabase_id);
      if (toDelete.length > 0) {
        let delQuery = client.from(name).delete().in('supabase_id', toDelete);
        if (tenantId) delQuery = delQuery.eq('tenant_id', tenantId);
        const { error: delError } = await delQuery;
        if (!delError) totalDeleted += toDelete.length;
      }
    }
    return { success: true, count: totalDeleted };
  } catch (e) {
    console.warn('[Supabase] Gagal hapus data lama:', e);
    return { success: false, count: totalDeleted };
  }
};

// ─── Storage: Photo Upload ───
const PHOTO_BUCKET = 'photos';

export const uploadPhoto = async (base64Str, filePath) => {
  const client = initSupabase();
  if (!client) return base64Str;
  try {
    const res = await fetch(base64Str);
    const blob = await res.blob();
    const { error } = await client.storage.from(PHOTO_BUCKET).upload(filePath, blob, {
      contentType: 'image/jpeg',
      upsert: true
    });
    if (error) throw error;
    const { data: urlData } = client.storage.from(PHOTO_BUCKET).getPublicUrl(filePath);
    return urlData.publicUrl;
  } catch (e) {
    console.warn('[Supabase] Gagal upload foto, fallback base64:', e);
    return base64Str;
  }
};

// ─── Tenants ───
export const subscribeTenants = (callback, opts = {}) =>
  createSubscriber('tenants', callback, 'created_at', opts);
export const addTenantToFirestore = createAdder('tenants');
export const updateTenantInFirestore = createUpdater('tenants');
export const deleteTenantFromFirestore = createDeleter('tenants');
export const loadAllTenantsFromFirestore = createLoader('tenants');

// Export helper tenant untuk digunakan di komponen frontend
export { setCurrentTenant, getCurrentTenant, clearCurrentTenant };
