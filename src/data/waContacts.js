// ─── Shared WA Contacts Config ─────────────────────────────────────────────
// Nomor telepon disimpan per tenant di localStorage agar setiap lokasi punya
// kontak WhatsApp sendiri. Format nomor: kode negara tanpa + (cth: 6281234567890)

import { getCurrentTenant } from '../utils/supabase';

const LS_KEY = 'cmdigital_wa_contacts';

function storageKey() {
  const tenantId = getCurrentTenant();
  return tenantId ? `${LS_KEY}_${tenantId}` : LS_KEY;
}

export const WA_DEFAULTS = {
  Teknisi: {
    nama:  'Kepala Teknisi (Engineering)',
    nomor: '6281234567890',
    emoji: '🛠️',
    color: '#3b82f6',
  },
  Cleaning: {
    nama:  'Kepala Cleaning Service',
    nomor: '6281112223334',
    emoji: '🧹',
    color: '#7c3aed',
  },
  Keamanan: {
    nama:  'Kepala Security / Danru',
    nomor: '6289876543210',
    emoji: '🛡️',
    color: '#f59e0b',
  },
};

/** Baca kontak dari localStorage, fallback ke default */
export function getWAContacts() {
  try {
    const key = storageKey();
    let saved = localStorage.getItem(key);
    // Migrasi sekali dari key global lama ke key per tenant
    if (!saved && key !== LS_KEY) {
      const legacy = localStorage.getItem(LS_KEY);
      if (legacy) {
        localStorage.setItem(key, legacy);
        saved = legacy;
      }
    }
    if (!saved) return { ...WA_DEFAULTS };
    const parsed = JSON.parse(saved);
    // Merge: pastikan semua key ada
    return {
      Teknisi:  { ...WA_DEFAULTS.Teknisi,  ...parsed.Teknisi  },
      Cleaning: { ...WA_DEFAULTS.Cleaning, ...parsed.Cleaning },
      Keamanan: { ...WA_DEFAULTS.Keamanan, ...parsed.Keamanan },
    };
  } catch {
    return { ...WA_DEFAULTS };
  }
}

/** Simpan perubahan nomor/nama ke localStorage (per tenant) */
export function saveWAContacts(contacts) {
  localStorage.setItem(storageKey(), JSON.stringify(contacts));
}

/**
 * Buat teks pesan WA standar untuk satu temuan
 * @param {object} finding - objek temuan
 * @param {string} dept    - 'Teknisi' | 'Cleaning' | 'Keamanan'
 * @param {object} [contacts] - override contacts (opsional)
 */
export function buildWAMessage(finding, dept, contacts) {
  const c = (contacts || getWAContacts())[dept] || WA_DEFAULTS.Keamanan;
  const now = new Date().toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' });
  return (
    `*📋 LAPORAN TEMUAN - CMMDIGITAL*\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `${c.emoji} *Disposisi ke: ${c.nama}*\n\n` +
    `🆔 *ID Tiket:* \`${finding.id}\`\n` +
    `📌 *Kategori:* ${finding.kategori}\n` +
    `📍 *Lokasi:* ${finding.area}\n` +
    `⚠️ *Tingkat:* ${finding.severity || 'Rendah'}\n` +
    `🕐 *Waktu Temuan:* ${new Date(finding.tanggal).toLocaleString('id-ID')} WIB\n` +
    `👮 *Dilaporkan oleh:* ${finding.pelapor}\n\n` +
    `📝 *Keterangan:*\n"${finding.detail}"\n\n` +
    `⚡ *Mohon segera ditindaklanjuti!*\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `_Sistem Manajemen Multi-Tenant CMMDIGITAL_\n` +
    `_Dikirim: ${now}_`
  );
}

/**
 * Buat link WA siap klik
 */
export function buildWALink(finding, dept, contacts) {
  const c = (contacts || getWAContacts())[dept] || WA_DEFAULTS.Keamanan;
  const msg = buildWAMessage(finding, dept, contacts);
  return `https://api.whatsapp.com/send?phone=${c.nomor}&text=${encodeURIComponent(msg)}`;
}

/**
 * Buat pesan rekap semua tiket open untuk satu departemen
 */
export function buildWARekap(openItems, dept, contacts) {
  const c = (contacts || getWAContacts())[dept] || WA_DEFAULTS.Keamanan;
  const now = new Date().toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' });
  return (
    `*${c.emoji} REKAP TIKET OPEN - CMMDIGITAL*\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `Yth. ${c.nama},\n\n` +
    `Berikut tiket aktif yang perlu ditindaklanjuti:\n\n` +
    openItems.map((f, i) =>
      `${i + 1}. [${f.severity || 'Rendah'}] ${f.kategori}\n   📍 ${f.area}\n   📋 ${f.detail}\n`
    ).join('\n') +
    `\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `Total: *${openItems.length} tiket aktif*\n` +
    `_Sistem Manajemen Multi-Tenant CMMDIGITAL_\n` +
    `_Dikirim: ${now}_`
  );
}
