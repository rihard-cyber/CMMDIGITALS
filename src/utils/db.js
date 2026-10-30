import localforage from 'localforage';

localforage.config({
  name: 'cmdigital',
  storeName: 'cmdigital_store',
  description: 'CMMDIGITAL offline data store'
});

const MIGRATED_KEY = '__db_migrated_v2';

function getKeyString(key) {
  return typeof key === 'string' ? key : String(key);
}

async function migrateFromLocalStorage() {
  const done = await localforage.getItem(MIGRATED_KEY);
  if (done) return [];

  const KEYS_TO_MIGRATE = [
    'cmdigital_users', 'cmdigital_users_sig', 'cmdigital_session',
    'cmdigital_last_route', 'cmdigital_theme', 'cmdigital_areas',
    'cmdigital_reports', 'cmdigital_findings', 'cmdigital_pos_list',
    'cmdigital_mutasi_logs', 'cmdigital_attendance_logs', 'cmdigital_complaints',
    'cmdigital_wa_contacts', 'cmdigital_login_attempts', 'cmdigital_db_version',
    'cmdigital_offline_queue', 'cmdigital_last_plotting_id', 'cmdigital_qr_counter',
    'cmdigital_custom_complaint_url'
  ];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith('cmdigital_pin_')) KEYS_TO_MIGRATE.push(k);
  }

  const migrated = [];
  for (const key of KEYS_TO_MIGRATE) {
    try {
      const val = localStorage.getItem(key);
      if (val !== null) {
        const parsed = JSON.parse(val);
        await localforage.setItem(key, parsed);
        migrated.push(key);
      }
    } catch (_) {}
  }

  await localforage.setItem(MIGRATED_KEY, true);
  console.log(`[DB] Migrated ${migrated.length} keys to IndexedDB`);
  return migrated;
}

migrateFromLocalStorage();

const db = {
  async get(key) {
    try {
      return await localforage.getItem(key);
    } catch (e) {
      try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : null;
      } catch (_) { return null; }
    }
  },

  async set(key, value) {
    try {
      await localforage.setItem(key, value);
      try { localStorage.setItem(key, JSON.stringify(value)); } catch (_) {}
      return true;
    } catch (e) {
      try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch (_) {}
      return false;
    }
  },

  async remove(key) {
    try {
      await localforage.removeItem(key);
      localStorage.removeItem(key);
      return true;
    } catch (_) { return false; }
  },

  async syncToLocalStorage() {
    try {
      const keys = await localforage.keys();
      for (const key of keys) {
        if (key === MIGRATED_KEY) continue;
        const val = await localforage.getItem(key);
        if (val !== null) {
          try { localStorage.setItem(key, JSON.stringify(val)); } catch (_) {}
        }
      }
      console.log(`[DB] Synced ${keys.length} keys back to localStorage`);
    } catch (_) {}
  }
};

export default db;
