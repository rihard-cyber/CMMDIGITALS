/**
 * =======================================================
 *   SMPJDC - Found Items / Lost & Found (Penemuan Barang)
 *   Component: FoundItems.jsx
 *   Signed by: Richard Meha (by -Richard)
 *   Description: Dashboard Penemuan Barang (gaya ComplaintAdmin)
 *                + Export PDF (gaya ReportsExport)
 * =======================================================
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Package, Search, Printer, Plus, Edit, Trash2, X, Camera, Image,
  MapPin, Calendar, Clock, User, Phone, Tag, Shield, CheckCircle,
  Archive, FileText, ChevronDown, ChevronUp,
  RefreshCw, Info
} from 'lucide-react';
import { exportTableToPdf, formatDateOnlyId, formatDateTimeId, formatDateForFile, getFirstPhoto } from '../utils/exportPdf';
import { compressImage } from '../utils/image';
import { hapticLight } from '../utils/haptics';
import { registerBackHandler } from '../utils/navigation';

const STATUS_LIST = ['Ditemukan', 'Diklaim', 'Diambil', 'Diserahkan'];
const FILTER_SHORT = {
  all: 'Semua',
  Ditemukan: 'Temuan',
  Diklaim: 'Klaim',
  Diambil: 'Ambil',
  Diserahkan: 'Serah'
};

const STATUS_COLOR = {
  Ditemukan: '#3b82f6',
  Diklaim: '#f59e0b',
  Diambil: '#10b981',
  Diserahkan: '#8b5cf6',
  Dihapus: '#6b7280'
};

const JENIS_BARANG = [
  'Elektronik', 'Aksesoris', 'Dokumen', 'Pakaian',
  'Tas/Dompet', 'Kunci', 'Kartu Akses', 'Lainnya'
];

const KATEGORI_BARANG = [
  'Value tinggi (>1jt)',
  'Value sedang (100rb - 1jt)',
  'Value rendah (<100rb)',
  'Dokumentasi penting'
];

const KATEGORI_PENEMU = ['Security', 'Cleaning', 'Tenant', 'Pengunjung', 'Staff Teknik', 'Lainnya'];

const HARI_ID = ['MINGGU', 'SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU'];

const formatHariTanggalId = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return `${HARI_ID[date.getDay()]}, ${formatDateOnlyId(date)}`;
};

const emptyForm = (user) => ({
  nama_barang: '',
  jenis_barang: '',
  kategori_barang: '',
  lokasi_penemuan: '',
  nama_penemu: user?.nama || '',
  kategori_penemu: 'Security',
  kontak_penemu: user?.nomorHp || user?.nomor_hp || '',
  keterangan_penemu: '',
  tanggal_penemuan: new Date().toISOString().split('T')[0],
  jam_penemuan: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
  foto_barang: '',
  photos: []
});

const emptyClaim = (user) => ({
  nama_pengambil: '',
  kontak_pengambil: '',
  no_identitas_pengambil: '',
  foto_identitas: '',
  diserahkan_oleh: user?.nama || '',
  catatan_serah_terima: ''
});

export default function FoundItems({
  foundItems = [],
  users = [],
  currentUser,
  onAddFoundItem,
  onUpdateFoundItem,
  onDeleteFoundItem,
  onUpdateFoundItemStatus,
  isClient = false
}) {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState(() => emptyForm(currentUser));
  const [claimItem, setClaimItem] = useState(null);
  const [claimData, setClaimData] = useState(() => emptyClaim(currentUser));
  const [toasts, setToasts] = useState([]);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [claimError, setClaimError] = useState('');

  const canManage = ['Admin Super', 'Manajemen', 'SPV', 'Danru', 'Wadanru'].includes(currentUser?.jabatan);

  // Android hardware back: tutup form / klaim sebelum keluar halaman
  useEffect(() => {
    if (!showForm && !claimItem) return;
    const unregister = registerBackHandler(() => {
      if (saving) return true;
      if (showForm) {
        setShowForm(false);
        setEditingItem(null);
      }
      if (claimItem) setClaimItem(null);
      return true;
    });
    return unregister;
  }, [showForm, claimItem, saving]);

  const addToast = (message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  };

  // ── Stats ──────────────────────────────────────────────────────────────
  const stats = useMemo(() => ({
    all: foundItems.length,
    Ditemukan: foundItems.filter(f => f.status === 'Ditemukan').length,
    Diklaim: foundItems.filter(f => f.status === 'Diklaim').length,
    Diambil: foundItems.filter(f => f.status === 'Diambil').length,
    Diserahkan: foundItems.filter(f => f.status === 'Diserahkan').length
  }), [foundItems]);

  // ── Filter + Search ────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return foundItems.filter(f => {
      if (filter !== 'all' && f.status !== filter) return false;
      if (search) {
        const q = search.toLowerCase();
        const hay = [
          f.item_code, f.nama_barang, f.jenis_barang, f.kategori_barang,
          f.lokasi_penemuan, f.nama_penemu, f.kontak_penemu,
          f.nama_pengambil, f.kontak_pengambil, f.keterangan_penemu
        ].map(v => String(v || '').toLowerCase()).join(' ');
        if (!hay.includes(q)) return false;
      }
      return true;
    }).sort((a, b) => String(b.tanggal_penemuan || b.created_at || '').localeCompare(String(a.tanggal_penemuan || a.created_at || '')));
  }, [foundItems, filter, search]);

  // ── Form helpers ───────────────────────────────────────────────────────
  const openAddForm = () => {
    setEditingItem(null);
    setFormData(emptyForm(currentUser));
    setFormError('');
    setShowForm(true);
    hapticLight?.();
  };

  const openEditForm = (item) => {
    setEditingItem(item);
    setFormData({
      nama_barang: item.nama_barang || '',
      jenis_barang: item.jenis_barang || '',
      kategori_barang: item.kategori_barang || '',
      lokasi_penemuan: item.lokasi_penemuan || '',
      nama_penemu: item.nama_penemu || '',
      kategori_penemu: item.kategori_penemu || 'Security',
      kontak_penemu: item.kontak_penemu || '',
      keterangan_penemu: item.keterangan_penemu || '',
      tanggal_penemuan: item.tanggal_penemuan || new Date().toISOString().split('T')[0],
      jam_penemuan: item.jam_penemuan || '',
      foto_barang: item.foto_barang || '',
      photos: Array.isArray(item.photos) ? [...item.photos] : []
    });
    setFormError('');
    setShowForm(true);
    hapticLight?.();
  };

  const readImage = (file) => new Promise((resolve, reject) => {
    if (!file) return resolve('');
    if (!file.type.startsWith('image/')) return reject(new Error('File harus berupa gambar'));
    if (file.size > 5 * 1024 * 1024) return reject(new Error('Ukuran maksimal 5MB'));
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const compressed = await compressImage(reader.result, 800, 0.7);
        resolve(compressed);
      } catch (e) { resolve(reader.result); }
    };
    reader.onerror = () => reject(new Error('Gagal membaca file'));
    reader.readAsDataURL(file);
  });

  const handleMainPhoto = async (e) => {
    try {
      const data = await readImage(e.target.files?.[0]);
      if (data) {
        setFormData(prev => ({ ...prev, foto_barang: data }));
        addToast('Foto utama ditambahkan', 'success');
      }
    } catch (err) {
      addToast(err.message, 'danger');
    }
    e.target.value = '';
  };

  const handleExtraPhoto = async (e) => {
    try {
      const data = await readImage(e.target.files?.[0]);
      if (data) {
        setFormData(prev => ({ ...prev, photos: [...prev.photos, data] }));
        addToast('Foto tambahan ditambahkan', 'success');
      }
    } catch (err) {
      addToast(err.message, 'danger');
    }
    e.target.value = '';
  };

  const takePhoto = async (field) => {
    try {
      const { Camera: CapCamera } = await import('@capacitor/camera');
      const photo = await CapCamera.getPhoto({
        quality: 80,
        allowEditing: true,
        resultType: 'dataUrl',
        source: 'CAMERA',
        saveToGallery: false
      });
      const data = await compressImage(photo.dataUrl, 800, 0.7);
      if (field === 'main') setFormData(prev => ({ ...prev, foto_barang: data }));
      else if (field === 'extra') setFormData(prev => ({ ...prev, photos: [...prev.photos, data] }));
      else if (field === 'identitas') setClaimData(prev => ({ ...prev, foto_identitas: data }));
      addToast('Foto berhasil diambil', 'success');
    } catch (err) {
      if (!String(err?.message || '').toLowerCase().includes('cancel')) {
        addToast(`Kamera tidak tersedia: ${err.message || err}`, 'danger');
      }
    }
  };

  const handleClaimIdentitas = async (e) => {
    try {
      const data = await readImage(e.target.files?.[0]);
      if (data) {
        setClaimData(prev => ({ ...prev, foto_identitas: data }));
        addToast('Foto identitas ditambahkan', 'success');
      }
    } catch (err) {
      addToast(err.message, 'danger');
    }
    e.target.value = '';
  };

  const submitForm = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!formData.nama_barang.trim()) return setFormError('Nama barang wajib diisi');
    if (!formData.jenis_barang) return setFormError('Jenis barang wajib dipilih');
    if (!formData.lokasi_penemuan.trim()) return setFormError('Lokasi penemuan wajib diisi');

    setSaving(true);
    try {
      const payload = {
        ...formData,
        nama_barang: formData.nama_barang.trim(),
        lokasi_penemuan: formData.lokasi_penemuan.trim(),
        photos: formData.photos.length ? formData.photos : undefined
      };
      if (editingItem) {
        await onUpdateFoundItem(editingItem.id, payload);
        addToast('Data barang temuan diperbarui', 'success');
      } else {
        await onAddFoundItem(payload);
        addToast('Barang temuan berhasil dicatat', 'success');
      }
      setShowForm(false);
      setEditingItem(null);
      setFormData(emptyForm(currentUser));
    } catch (err) {
      setFormError(err?.message || 'Gagal menyimpan data');
    } finally {
      setSaving(false);
    }
  };

  const submitClaim = async (e) => {
    e.preventDefault();
    setClaimError('');
    if (!claimData.nama_pengambil.trim()) return setClaimError('Nama pengambil wajib diisi');
    if (!claimData.kontak_pengambil.trim()) return setClaimError('Kontak pengambil wajib diisi');
    if (!claimData.no_identitas_pengambil.trim()) return setClaimError('No identitas wajib diisi');

    setSaving(true);
    try {
      await onUpdateFoundItemStatus(claimItem.id, 'Diambil', {
        ...claimData,
        tanggal_pengambilan: new Date().toISOString().split('T')[0],
        updated_at: new Date().toISOString()
      });
      addToast('Barang berhasil diserahkan ke pengambil', 'success');
      setClaimItem(null);
      setClaimData(emptyClaim(currentUser));
    } catch (err) {
      setClaimError(err?.message || 'Gagal memproses pengambilan');
    } finally {
      setSaving(false);
    }
  };

  const handleHandover = (item) => {
    onUpdateFoundItemStatus(item.id, 'Diserahkan', {
      diserahkan_oleh: currentUser?.nama || '',
      keterangan: 'Diserahkan ke manajemen / pihak berwajib',
      tanggal_pengambilan: new Date().toISOString().split('T')[0],
      updated_at: new Date().toISOString()
    });
    addToast('Barang ditandai Diserahkan ke manajemen', 'success');
  };

  const changeStatus = (item, status) => {
    onUpdateFoundItemStatus(item.id, status, { updated_at: new Date().toISOString() });
    addToast(`Status ${item.nama_barang} → ${status}`, 'info');
  };

  // ── Export PDF (kolom sesuai permintaan) ───────────────────────────────
  const handleExportPDF = () => {
    const ok = exportTableToPdf({
      title: 'Laporan Penemuan Barang (Lost & Found)',
      subtitle: 'SMPJDC - Jakarta Design Center',
      fileName: `laporan-penemuan-barang-smpjdc-${formatDateForFile()}`,
      orientation: 'landscape',
      meta: [
        { label: 'Total Data', value: filtered.length },
        { label: 'Sudah Diambil', value: filtered.filter(f => f.status === 'Diambil').length },
        { label: 'Diserahkan', value: filtered.filter(f => f.status === 'Diserahkan').length },
        { label: 'Belum Diambil', value: filtered.filter(f => !['Diambil', 'Diserahkan'].includes(f.status)).length }
      ],
      columns: [
        { header: 'NO', width: '3%' },
        { header: 'JAM LAPORAN', width: '10%' },
        { header: 'JAM / TGL DITEMUKAN', width: '10%' },
        { header: 'NAMA / JENIS BARANG', width: '13%' },
        { header: 'NILAI', width: '8%' },
        { header: 'LOKASI PENEMUAN', width: '12%' },
        { header: 'NAMA PENEMU', width: '9%' },
        { header: 'KONTAK PENEMU', width: '8%' },
        { header: 'FOTO BARANG', width: '8%' },
        { header: 'STATUS', width: '12%' },
        { header: 'KETERANGAN', width: '7%' }
      ],
      rows: filtered.map((f, idx) => {
        const jamLaporan = formatDateTimeId(
          f.created_at || f.createdAt || f.tanggal_laporan || f.tanggal_penemuan
        );
        const jamTglDitemukan = `${f.jam_penemuan || '-'} / ${formatDateOnlyId(f.tanggal_penemuan)}`;

        const tanggalAmbil = f.tanggal_pengambilan ? formatHariTanggalId(f.tanggal_pengambilan) : '-';
        let statusText = 'BELUM DIAMBIL';
        if (f.status === 'Diambil') {
          statusText = [
            'SUDAH DIAMBIL',
            `Nama: ${f.nama_pengambil || '-'}`,
            `ID: ${f.no_identitas_pengambil || '-'}`,
            `Diserahkan: ${f.diserahkan_oleh || '-'}`,
            `Tgl: ${tanggalAmbil}`
          ].join('\n');
        } else if (f.status === 'Diserahkan') {
          statusText = [
            'DISERAHKAN KE MANAJEMEN',
            `Oleh: ${f.diserahkan_oleh || '-'}`,
            `Tgl: ${tanggalAmbil}`
          ].join('\n');
        } else if (f.status === 'Diklaim') {
          statusText = 'DIKLAIM\nBELUM DIAMBIL';
        }

        const identitasPhoto = f.foto_identitas || '';
        const statusCell = identitasPhoto
          ? { text: statusText, images: [identitasPhoto], className: 'text-left' }
          : { text: statusText, className: 'text-left' };

        const done = ['Diambil', 'Diserahkan'].includes(f.status);

        return [
          idx + 1,
          jamLaporan,
          jamTglDitemukan,
          { text: `${f.nama_barang || '-'}\n${f.jenis_barang || '-'}`, className: 'text-left' },
          f.kategori_barang || '-',
          { text: f.lokasi_penemuan || '-', className: 'text-left' },
          f.nama_penemu || '-',
          f.kontak_penemu || '-',
          {
            image: getFirstPhoto(f.foto_barang || f.photos),
            text: f.foto_barang ? 'Foto barang' : (f.photos?.length ? `${f.photos.length} foto` : '-')
          },
          statusCell,
          { text: done ? 'DONE' : 'BELUM', className: done ? 'status-done' : '' }
        ];
      })
    });
    if (!ok) alert('Popup export PDF diblokir browser. Izinkan popup untuk aplikasi ini.');
  };

  // ── Render helpers ─────────────────────────────────────────────────────
  const statusColor = (s) => STATUS_COLOR[s] || '#6b7280';

  const formatDate = (v) => {
    if (!v) return '-';
    try {
      const d = new Date(v);
      if (Number.isNaN(d.getTime())) return String(v);
      return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch { return String(v); }
  };

  const renderPhotos = (item) => {
    const photos = [item.foto_barang, ...(Array.isArray(item.photos) ? item.photos : [])].filter(Boolean);
    if (!photos.length) return null;
    return (
      <div style={{ marginBottom: '0.75rem' }}>
        <p style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '0.35rem' }}>
          FOTO BARANG ({photos.length})
        </p>
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          {photos.map((p, i) => (
            <a key={i} href={p} target="_blank" rel="noreferrer" title="Buka foto">
              <img src={p} alt={`Foto ${i + 1}`} style={{ width: 84, height: 84, objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--border-glass)' }} />
            </a>
          ))}
        </div>
      </div>
    );
  };

  const fieldRow = (Icon, label, value) => (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.35rem', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
      <Icon size={12} style={{ marginTop: 2, flexShrink: 0 }} />
      <span style={{ minWidth: 92 }}>{label}</span>
      <strong style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{value || '-'}</strong>
    </div>
  );

  return (
    <div>
      {/* ══ STATS (grid simetris 5 kolom di semua ukuran layar) ══ */}
      <div className="found-stats-grid">
        {[
          { label: 'Total Barang', short: 'Total', value: stats.all, color: '#3b82f6' },
          { label: 'Ditemukan', short: 'Temuan', value: stats.Ditemukan, color: '#3b82f6' },
          { label: 'Diklaim', short: 'Klaim', value: stats.Diklaim, color: '#f59e0b' },
          { label: 'Diambil', short: 'Ambil', value: stats.Diambil, color: '#10b981' },
          { label: 'Diserahkan', short: 'Serah', value: stats.Diserahkan, color: '#8b5cf6' }
        ].map(s => (
          <div
            key={s.label}
            className={`glass-panel found-stat-card${s.label === 'Total Barang' ? ' is-total' : ''}`}
            style={{ '--stat-color': s.color }}
          >
            <p className="found-stat-label">
              <span className="found-stat-label-full">{s.label}</span>
              <span className="found-stat-label-short">{s.short}</span>
            </p>
            <p className="found-stat-value">{s.value}</p>
          </div>
        ))}
      </div>

      {/* ══ TOOLBAR: Search + Filter (wrap, tanpa scroll horizontal) + Aksi ══ */}
      <div className="android-toolbar">
        <div className="android-search">
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari kode / nama / lokasi..."
            className="modern-input"
            style={{ paddingLeft: '2rem', fontSize: '0.78rem' }}
          />
        </div>
        <div className="segmented-filter" role="group" aria-label="Filter status barang temuan">
          {['all', ...STATUS_LIST].map(f => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={filter === f ? 'active' : ''}
              aria-pressed={filter === f}
            >
              <span className="filter-label-full">{f === 'all' ? 'Semua' : f}</span>
              <span className="filter-label-short">{FILTER_SHORT[f] || f}</span>
            </button>
          ))}
        </div>
        <div className="android-actions">
          <button onClick={handleExportPDF} className="btn-secondary" type="button">
            <Printer size={12} /> Export PDF
          </button>
          <button onClick={openAddForm} className="btn-primary" type="button">
            <Plus size={14} /> Catat Barang
          </button>
        </div>
      </div>

      {/* ══ LIST (gaya kartu komplain) ══ */}
      {filtered.length === 0 ? (
        <div className="empty-state" style={{ padding: '3rem 1rem', textAlign: 'center' }}>
          <Archive size={40} style={{ opacity: 0.2, marginBottom: '0.75rem', color: 'var(--text-muted)' }} />
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            {foundItems.length === 0 ? 'Belum ada barang temuan yang dicatat.' : 'Tidak ada data yang cocok dengan filter/pencarian.'}
          </p>
          {foundItems.length === 0 && (
            <button onClick={openAddForm} className="btn-primary" style={{ marginTop: '0.85rem', padding: '0.45rem 0.9rem', fontSize: '0.75rem' }}>
              <Plus size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} /> Catat Barang Pertama
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {filtered.map(item => {
            const isOpen = expandedId === item.id;
            const sc = statusColor(item.status);
            const waktuLabel = [item.jam_penemuan, item.tanggal_penemuan ? formatDate(item.tanggal_penemuan) : '']
              .filter(v => v && String(v).trim() && String(v).trim() !== '-')
              .join(' / ');
            const metaItems = [
              { id: 'jenis', Icon: Tag, value: item.jenis_barang },
              { id: 'lokasi', Icon: MapPin, value: item.lokasi_penemuan },
              { id: 'waktu', Icon: Clock, value: waktuLabel },
              { id: 'penemu', Icon: User, value: item.nama_penemu }
            ].filter(m => m.value && String(m.value).trim() && String(m.value).trim() !== '-');
            return (
              <div key={item.id} className="glass-panel" style={{
                padding: '0.75rem',
                transition: 'var(--transition-smooth)',
                borderLeft: `3px solid ${sc}`,
                background: isOpen ? 'rgba(59,130,246,0.05)' : undefined
              }}>
                {/* Header klik untuk expand */}
                <div onClick={() => setExpandedId(isOpen ? null : item.id)} style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                    <div style={{ minWidth: 0 }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 800, letterSpacing: '0.02em', color: 'var(--color-primary)' }}>
                        {item.item_code || 'TANPA KODE'}
                      </span>
                      <span style={{ marginLeft: '0.5rem', fontSize: '0.72rem', fontWeight: 700 }}>
                        {item.nama_barang || 'Barang tanpa nama'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}>
                      <span style={{
                        fontSize: '0.6rem', padding: '0.12rem 0.5rem', borderRadius: '20px', fontWeight: 700, whiteSpace: 'nowrap',
                        background: `${sc}20`, color: sc
                      }}>{item.status || 'Ditemukan'}</span>
                      {isOpen ? <ChevronUp size={14} style={{ color: 'var(--text-muted)' }} /> : <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} />}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.68rem', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
                    {metaItems.map(({ id, Icon, value }) => (
                      <span key={id} style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', minWidth: 0 }}>
                        <Icon size={10} style={{ flexShrink: 0 }} /> {value}
                      </span>
                    ))}
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-primary)', marginTop: '0.15rem' }}>
                    {item.kategori_barang ? `Kategori: ${item.kategori_barang}. ` : ''}{item.keterangan_penemu || 'Tidak ada keterangan tambahan.'}
                  </p>
                </div>

                {/* Detail panel (seperti komplain) */}
                {isOpen && (
                  <div onClick={e => e.stopPropagation()} style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-glass)' }}>
                    {renderPhotos(item)}

                    <div className="form-grid-2" style={{ gap: '0.5rem', marginBottom: '0.75rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                        <p style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: 600 }}>DATA PENEMUAN</p>
                        {fieldRow(Clock, 'Jam Laporan', formatDateTimeId(item.created_at || item.createdAt || item.tanggal_laporan))}
                        {fieldRow(Calendar, 'Tanggal', formatDate(item.tanggal_penemuan))}
                        {fieldRow(Clock, 'Jam', item.jam_penemuan)}
                        {fieldRow(MapPin, 'Lokasi', item.lokasi_penemuan)}
                        {fieldRow(Tag, 'Jenis', item.jenis_barang)}
                        {fieldRow(Info, 'Kategori', item.kategori_barang)}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                        <p style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: 600 }}>DATA PENEMU</p>
                        {fieldRow(User, 'Nama', item.nama_penemu)}
                        {fieldRow(Shield, 'Kategori', item.kategori_penemu)}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.72rem' }}>
                          <Phone size={12} style={{ color: 'var(--color-success)' }} />
                          <span style={{ minWidth: 92 }}>Kontak</span>
                          {item.kontak_penemu ? (
                            <a
                              href={`https://wa.me/${String(item.kontak_penemu).replace(/[^0-9]/g, '').replace(/^0/, '62')}`}
                              target="_blank" rel="noreferrer"
                              style={{ color: 'var(--color-success)', fontWeight: 600 }}
                            >{item.kontak_penemu}</a>
                          ) : <strong>-</strong>}
                        </div>
                        {fieldRow(FileText, 'Keterangan', item.keterangan_penemu)}
                      </div>
                    </div>

                    {/* Info pengambilan / serah terima */}
                    {(item.status === 'Diambil' || item.status === 'Diserahkan') && (
                      <div style={{ marginBottom: '0.75rem', padding: '0.6rem', borderRadius: '8px', background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.25)' }}>
                        <p style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: 700, marginBottom: '0.3rem' }}>
                          {item.status === 'Diambil' ? 'SERAH TERIMA PENGAMBILAN' : 'DISERAHKAN KE MANAJEMEN'}
                        </p>
                        {item.nama_pengambil && fieldRow(User, 'Pengambil', item.nama_pengambil)}
                        {item.kontak_pengambil && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.72rem' }}>
                            <Phone size={12} style={{ color: 'var(--color-success)' }} />
                            <span style={{ minWidth: 92 }}>Kontak</span>
                            <a href={`https://wa.me/${String(item.kontak_pengambil).replace(/[^0-9]/g, '').replace(/^0/, '62')}`} target="_blank" rel="noreferrer" style={{ color: 'var(--color-success)', fontWeight: 600 }}>
                              {item.kontak_pengambil}
                            </a>
                          </div>
                        )}
                        {item.no_identitas_pengambil && fieldRow(FileText, 'No Identitas', item.no_identitas_pengambil)}
                        {item.tanggal_pengambilan && fieldRow(Calendar, 'Tgl Ambil', formatDate(item.tanggal_pengambilan))}
                        {item.diserahkan_oleh && fieldRow(Shield, 'Diserahkan', item.diserahkan_oleh)}
                        {item.catatan_serah_terima && fieldRow(Info, 'Catatan', item.catatan_serah_terima)}
                        {item.foto_identitas && (
                          <div style={{ marginTop: '0.4rem' }}>
                            <p style={{ fontSize: '0.62rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>FOTO IDENTITAS</p>
                            <a href={item.foto_identitas} target="_blank" rel="noreferrer">
                              <img src={item.foto_identitas} alt="Identitas" style={{ width: 96, height: 68, objectFit: 'cover', borderRadius: '6px', border: '1px solid var(--border-glass)' }} />
                            </a>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Aksi */}
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
                      {canManage && ['Ditemukan', 'Diklaim'].includes(item.status) && (
                        <button
                          onClick={() => {
                            setClaimItem(item);
                            setClaimData(emptyClaim(currentUser));
                            setClaimError('');
                          }}
                          className="btn-success"
                          style={{ padding: '0.35rem 0.65rem', fontSize: '0.68rem', display: 'flex', alignItems: 'center', gap: '0.25rem', border: 'none', borderRadius: 6, fontWeight: 700, background: '#25d366', color: '#fff', cursor: 'pointer' }}
                        >
                          <CheckCircle size={12} /> Proses Pengambilan
                        </button>
                      )}
                      {canManage && ['Ditemukan', 'Diklaim'].includes(item.status) && (
                        <button onClick={() => handleHandover(item)} className="btn-secondary" style={{ padding: '0.35rem 0.65rem', fontSize: '0.68rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Archive size={12} /> Serahkan Manajemen
                        </button>
                      )}
                      {canManage && (
                        <button onClick={() => openEditForm(item)} className="btn-secondary" style={{ padding: '0.35rem 0.65rem', fontSize: '0.68rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Edit size={12} /> Edit
                        </button>
                      )}
                      {canManage && (
                        <select
                          value={item.status || 'Ditemukan'}
                          onChange={(e) => changeStatus(item, e.target.value)}
                          className="modern-select"
                          style={{ padding: '0.3rem 0.45rem', fontSize: '0.68rem', width: 'auto' }}
                        >
                          {STATUS_LIST.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      )}
                      {canManage && !isClient && (
                        <button onClick={() => onDeleteFoundItem(item.id)} className="btn-danger" style={{ padding: '0.35rem 0.65rem', fontSize: '0.68rem', display: 'flex', alignItems: 'center', gap: '0.25rem', background: 'rgba(239,68,68,0.12)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.4)', borderRadius: 6, fontWeight: 700, cursor: 'pointer' }}>
                          <Trash2 size={12} /> Hapus
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ══ MODAL FORM TAMBAH / EDIT ══ */}
      {showForm && (
        <div className="modal-overlay" onClick={() => !saving && setShowForm(false)}>
          <div className="glass-panel modal-panel" style={{ width: 720, maxWidth: '94%', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 className="modal-title" style={{ fontSize: '1rem' }}>
                <Package size={18} style={{ verticalAlign: 'middle', marginRight: 6 }} />
                {editingItem ? 'Edit Barang Temuan' : 'Catat Barang Temuan'}
              </h2>
              <button onClick={() => !saving && setShowForm(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            {formError && (
              <div style={{ fontSize: '0.72rem', color: '#ef4444', background: 'rgba(239,68,68,0.1)', border: '1px dashed rgba(239,68,68,0.4)', padding: '0.45rem 0.6rem', borderRadius: 6 }}>
                {formError}
              </div>
            )}

            <form onSubmit={submitForm} style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
              <div className="form-grid-2">
                <div>
                  <p style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: 700, marginBottom: '0.2rem' }}>NAMA BARANG *</p>
                  <input className="modern-input" value={formData.nama_barang} onChange={e => setFormData(p => ({ ...p, nama_barang: e.target.value }))} placeholder="Contoh: iPhone 13, Tas Hitam, Kunci Motor" />
                </div>
                <div>
                  <p style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: 700, marginBottom: '0.2rem' }}>JENIS BARANG *</p>
                  <select className="modern-select" value={formData.jenis_barang} onChange={e => setFormData(p => ({ ...p, jenis_barang: e.target.value }))}>
                    <option value="">Pilih jenis</option>
                    {JENIS_BARANG.map(j => <option key={j} value={j}>{j}</option>)}
                  </select>
                </div>
                <div>
                  <p style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: 700, marginBottom: '0.2rem' }}>KATEGORI NILAI</p>
                  <select className="modern-select" value={formData.kategori_barang} onChange={e => setFormData(p => ({ ...p, kategori_barang: e.target.value }))}>
                    <option value="">Pilih kategori</option>
                    {KATEGORI_BARANG.map(k => <option key={k} value={k}>{k}</option>)}
                  </select>
                </div>
                <div>
                  <p style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: 700, marginBottom: '0.2rem' }}>LOKASI PENEMUAN *</p>
                  <input className="modern-input" value={formData.lokasi_penemuan} onChange={e => setFormData(p => ({ ...p, lokasi_penemuan: e.target.value }))} placeholder="Contoh: Lantai 1 dekat tangga darurat B" />
                </div>
                <div>
                  <p style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: 700, marginBottom: '0.2rem' }}>TANGGAL DITEMUKAN</p>
                  <input type="date" className="modern-input" value={formData.tanggal_penemuan} onChange={e => setFormData(p => ({ ...p, tanggal_penemuan: e.target.value }))} />
                </div>
                <div>
                  <p style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: 700, marginBottom: '0.2rem' }}>JAM DITEMUKAN</p>
                  <input type="time" className="modern-input" value={formData.jam_penemuan} onChange={e => setFormData(p => ({ ...p, jam_penemuan: e.target.value }))} />
                </div>
                <div>
                  <p style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: 700, marginBottom: '0.2rem' }}>NAMA PENEMU</p>
                  <input className="modern-input" value={formData.nama_penemu} onChange={e => setFormData(p => ({ ...p, nama_penemu: e.target.value }))} placeholder="Nama yang menemukan" />
                </div>
                <div>
                  <p style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: 700, marginBottom: '0.2rem' }}>KATEGORI PENEMU</p>
                  <select className="modern-select" value={formData.kategori_penemu} onChange={e => setFormData(p => ({ ...p, kategori_penemu: e.target.value }))}>
                    {KATEGORI_PENEMU.map(k => <option key={k} value={k}>{k}</option>)}
                  </select>
                </div>
                <div>
                  <p style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: 700, marginBottom: '0.2rem' }}>KONTAK PENEMU (WA/TELP)</p>
                  <input type="tel" className="modern-input" value={formData.kontak_penemu} onChange={e => setFormData(p => ({ ...p, kontak_penemu: e.target.value }))} placeholder="08xxxxxxxxxx" />
                </div>
                <div>
                  <p style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: 700, marginBottom: '0.2rem' }}>KETERANGAN PENEMU</p>
                  <input className="modern-input" value={formData.keterangan_penemu} onChange={e => setFormData(p => ({ ...p, keterangan_penemu: e.target.value }))} placeholder="Kondisi barang saat ditemukan" />
                </div>
              </div>

              {/* Foto barang */}
              <div>
                <p style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: 700, marginBottom: '0.3rem' }}>FOTO BARANG</p>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
                  {formData.foto_barang && (
                    <div style={{ position: 'relative' }}>
                      <img src={formData.foto_barang} alt="Foto utama" style={{ width: 84, height: 84, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border-glass)' }} />
                      <button type="button" onClick={() => setFormData(p => ({ ...p, foto_barang: '' }))} style={{ position: 'absolute', top: -6, right: -6, background: '#ef4444', color: '#fff', border: 'none', borderRadius: '50%', width: 18, height: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <X size={11} />
                      </button>
                    </div>
                  )}
                  {formData.photos.map((p, i) => (
                    <div key={i} style={{ position: 'relative' }}>
                      <img src={p} alt={`Tambahan ${i + 1}`} style={{ width: 84, height: 84, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border-glass)' }} />
                      <button type="button" onClick={() => setFormData(prev => ({ ...prev, photos: prev.photos.filter((_, x) => x !== i) }))} style={{ position: 'absolute', top: -6, right: -6, background: '#ef4444', color: '#fff', border: 'none', borderRadius: '50%', width: 18, height: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <X size={11} />
                      </button>
                    </div>
                  ))}
                  <label className="btn-secondary" style={{ padding: '0.45rem 0.7rem', fontSize: '0.68rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer' }}>
                    <Image size={13} /> Pilih Foto
                    <input type="file" accept="image/*" hidden onChange={handleMainPhoto} />
                  </label>
                  <button type="button" onClick={() => takePhoto('main')} className="btn-secondary" style={{ padding: '0.45rem 0.7rem', fontSize: '0.68rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Camera size={13} /> Kamera
                  </button>
                  <label className="btn-secondary" style={{ padding: '0.45rem 0.7rem', fontSize: '0.68rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer' }}>
                    <Plus size={13} /> Foto Tambahan
                    <input type="file" accept="image/*" hidden onChange={handleExtraPhoto} />
                  </label>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.25rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowForm(false)} disabled={saving} style={{ padding: '0.45rem 0.9rem', fontSize: '0.75rem' }}>Batal</button>
                <button type="submit" className="btn-primary" disabled={saving} style={{ padding: '0.45rem 0.95rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  {saving ? <RefreshCw size={13} /> : <CheckCircle size={13} />}
                  {saving ? 'Menyimpan...' : (editingItem ? 'Simpan Perubahan' : 'Simpan Barang Temuan')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══ MODAL PROSES PENGAMBILAN ══ */}
      {claimItem && (
        <div className="modal-overlay" onClick={() => !saving && setClaimItem(null)}>
          <div className="glass-panel modal-panel" style={{ width: 560, maxWidth: '94%', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 className="modal-title" style={{ fontSize: '1rem' }}>
                <CheckCircle size={18} style={{ verticalAlign: 'middle', marginRight: 6, color: '#10b981' }} />
                Proses Pengambilan Barang
              </h2>
              <button onClick={() => !saving && setClaimItem(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
              Barang: <strong style={{ color: 'var(--text-primary)' }}>{claimItem.nama_barang}</strong> ({claimItem.item_code})
            </p>

            {claimError && (
              <div style={{ fontSize: '0.72rem', color: '#ef4444', background: 'rgba(239,68,68,0.1)', border: '1px dashed rgba(239,68,68,0.4)', padding: '0.45rem 0.6rem', borderRadius: 6 }}>
                {claimError}
              </div>
            )}

            <form onSubmit={submitClaim} style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
              <div className="form-grid-2">
                <div>
                  <p style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: 700, marginBottom: '0.2rem' }}>NAMA PENGAMBIL *</p>
                  <input className="modern-input" value={claimData.nama_pengambil} onChange={e => setClaimData(p => ({ ...p, nama_pengambil: e.target.value }))} placeholder="Nama penerima/pengambil" />
                </div>
                <div>
                  <p style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: 700, marginBottom: '0.2rem' }}>KONTAK PENGAMBIL *</p>
                  <input type="tel" className="modern-input" value={claimData.kontak_pengambil} onChange={e => setClaimData(p => ({ ...p, kontak_pengambil: e.target.value }))} placeholder="08xxxxxxxxxx" />
                </div>
                <div>
                  <p style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: 700, marginBottom: '0.2rem' }}>NO IDENTITAS (KTP/SIM) *</p>
                  <input className="modern-input" value={claimData.no_identitas_pengambil} onChange={e => setClaimData(p => ({ ...p, no_identitas_pengambil: e.target.value }))} placeholder="Nomor KTP/SIM/ID" />
                </div>
                <div>
                  <p style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: 700, marginBottom: '0.2rem' }}>DISERAHKAN OLEH</p>
                  <input className="modern-input" value={claimData.diserahkan_oleh} onChange={e => setClaimData(p => ({ ...p, diserahkan_oleh: e.target.value }))} />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <p style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: 700, marginBottom: '0.2rem' }}>CATATAN SERAH TERIMA</p>
                  <textarea className="modern-input" rows={2} value={claimData.catatan_serah_terima} onChange={e => setClaimData(p => ({ ...p, catatan_serah_terima: e.target.value }))} placeholder="Kondisi barang saat diserahkan, dll" />
                </div>
              </div>

              <div>
                <p style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: 700, marginBottom: '0.3rem' }}>FOTO IDENTITAS PENGAMBIL</p>
                <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  {claimData.foto_identitas && (
                    <div style={{ position: 'relative' }}>
                      <img src={claimData.foto_identitas} alt="Identitas" style={{ width: 96, height: 68, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border-glass)' }} />
                      <button type="button" onClick={() => setClaimData(p => ({ ...p, foto_identitas: '' }))} style={{ position: 'absolute', top: -6, right: -6, background: '#ef4444', color: '#fff', border: 'none', borderRadius: '50%', width: 18, height: 18, cursor: 'pointer' }}>
                        <X size={11} />
                      </button>
                    </div>
                  )}
                  <label className="btn-secondary" style={{ padding: '0.45rem 0.7rem', fontSize: '0.68rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer' }}>
                    <Image size={13} /> Pilih Foto
                    <input type="file" accept="image/*" hidden onChange={handleClaimIdentitas} />
                  </label>
                  <button type="button" onClick={() => takePhoto('identitas')} className="btn-secondary" style={{ padding: '0.45rem 0.7rem', fontSize: '0.68rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Camera size={13} /> Kamera
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.25rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setClaimItem(null)} disabled={saving} style={{ padding: '0.45rem 0.9rem', fontSize: '0.75rem' }}>Batal</button>
                <button type="submit" className="btn-primary" disabled={saving} style={{ padding: '0.45rem 0.95rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem', background: '#10b981' }}>
                  <CheckCircle size={13} /> {saving ? 'Memproses...' : 'Konfirmasi Pengambilan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══ TOASTS ══ */}
      <div style={{ position: 'fixed', bottom: 20, right: 20, display: 'flex', flexDirection: 'column', gap: '0.4rem', zIndex: 200 }}>
        {toasts.map(t => (
          <div key={t.id} style={{
            padding: '0.55rem 0.8rem', borderRadius: 8, fontSize: '0.75rem', fontWeight: 600,
            background: t.type === 'danger' ? '#ef4444' : t.type === 'success' ? '#10b981' : t.type === 'warning' ? '#f59e0b' : '#3b82f6',
            color: '#fff', boxShadow: '0 6px 20px rgba(0,0,0,0.3)', maxWidth: 320
          }}>{t.message}</div>
        ))}
      </div>
    </div>
  );
}