import React, { useState, useRef } from 'react';
import { Download, Upload, AlertTriangle, CheckCircle, Database, RefreshCw } from 'lucide-react';

const ALL_KEYS = [
  'sapujagat_users', 'sapujagat_areas', 'sapujagat_reports', 'sapujagat_findings',
  'cmdigital_mutasi_logs', 'cmdigital_attendance_logs', 'cmdigital_complaints',
  'cmdigital_pos_list', 'sapujagat_found_items', 'cmdigital_theme', 'cmdigital_db_version'
];

export default function BackupRestore({ addToast, onClearAllData }) {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const fileRef = useRef(null);

  const collectAllData = () => {
    const data = {};
    ALL_KEYS.forEach(key => {
      try {
        const val = localStorage.getItem(key);
        if (val) data[key] = JSON.parse(val);
      } catch {}
    });
    return data;
  };

  const handleExport = () => {
    setBusy(true);
    try {
      const data = collectAllData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cmdigital-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setResult({ type: 'success', message: `Backup berhasil! ${Object.keys(data).length} key tersimpan.` });
      if (addToast) addToast(`Backup berhasil — ${Object.keys(data).length} key`, 'success');
    } catch (e) {
      setResult({ type: 'error', message: `Gagal backup: ${e.message}` });
    }
    setBusy(false);
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setBusy(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        let count = 0;
        Object.entries(data).forEach(([key, value]) => {
          if (ALL_KEYS.includes(key)) {
            localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
            count++;
          }
        });
        setResult({ type: 'success', message: `Restore berhasil! ${count} key dipulihkan. Refresh halaman untuk melihat perubahan.` });
        if (addToast) addToast(`Restore berhasil! ${count} key dipulihkan.`, 'success');
      } catch (err) {
        setResult({ type: 'error', message: `Gagal restore: ${err.message}` });
      }
      setBusy(false);
    };
    reader.readAsText(file);
  };

  const handleClearAllData = async () => {
    if (!window.confirm('Yakin ingin menghapus SEMUA data lokal? Tindakan ini tidak bisa dibatalkan.')) return;
    try {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const k = localStorage.key(i);
        if (k && (k.startsWith('cmdigital_') || k.startsWith('sapujagat_'))) {
          localStorage.removeItem(k);
        }
      }
      if (onClearAllData) await onClearAllData();
      setResult({ type: 'success', message: 'Semua data lokal berhasil dihapus!' });
      if (addToast) addToast('Semua data lokal berhasil dihapus!', 'success');
    } catch (e) {
      setResult({ type: 'error', message: `Gagal hapus: ${e.message}` });
    }
  };

  return (
    <div style={{ padding: '1.5rem', maxWidth: '700px', margin: '0 auto' }}>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f8fafc', marginBottom: '1rem' }}>
        <Database size={20} style={{ marginRight: '0.5rem', color: '#3b82f6' }} />
        Backup & Restore Data
      </h2>

      <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '10px', padding: '1.5rem', marginBottom: '1rem' }}>
        <h3 style={{ fontSize: '0.9rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>Export Backup</h3>
        <p style={{ color: '#cbd5e1', fontSize: '0.85rem', marginBottom: '1rem' }}>
          Cadangkan semua data lokal (user, laporan, temuan, absensi, komplain, dan tema) ke file JSON.
        </p>
        <button
          onClick={handleExport}
          disabled={busy}
          style={{
            background: busy ? '#475569' : '#10b981',
            border: 'none',
            color: 'white',
            padding: '0.75rem 1.5rem',
            borderRadius: '8px',
            fontWeight: 600,
            cursor: busy ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            opacity: busy ? 0.6 : 1
          }}
        >
          {busy ? <RefreshCw size={16} /> : <Download size={16} />}
          {busy ? 'Membuat backup...' : 'Unduh Backup JSON'}
        </button>
        {result && result.type === 'success' && (
          <p style={{ marginTop: '0.75rem', color: '#10b981', fontSize: '0.85rem' }}>{result.message}</p>
        )}
        {result && result.type === 'error' && (
          <p style={{ marginTop: '0.75rem', color: '#ef4444', fontSize: '0.85rem' }}>{result.message}</p>
        )}
      </div>

      <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '10px', padding: '1.5rem', marginBottom: '1rem' }}>
        <h3 style={{ fontSize: '0.9rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>Import Restore</h3>
        <p style={{ color: '#cbd5e1', fontSize: '0.85rem', marginBottom: '1rem' }}>
          Pulihkan data dari file backup JSON yang sebelumnya diunduh.
        </p>
        <input
          ref={fileRef}
          type="file"
          accept=".json"
          style={{ display: 'none' }}
        />
        <button
          onClick={() => fileRef.current.click()}
          disabled={busy}
          style={{
            background: busy ? '#475569' : '#3b82f6',
            border: 'none',
            color: 'white',
            padding: '0.75rem 1.5rem',
            borderRadius: '8px',
            fontWeight: 600,
            cursor: busy ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            opacity: busy ? 0.6 : 1
          }}
        >
          {busy ? <RefreshCw size={16} /> : <Upload size={16} />}
          {busy ? 'Memproses restore...' : 'Pilih File & Restore'}
        </button>
      </div>

      <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '10px', padding: '1.5rem' }}>
        <h3 style={{ fontSize: '0.9rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>Utilitas</h3>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            onClick={handleClearAllData}
            disabled={busy}
            style={{
              background: 'transparent',
              border: '1px solid #ef4444',
              color: '#ef4444',
              padding: '0.75rem 1.25rem',
              borderRadius: '8px',
              fontWeight: 600,
              cursor: busy ? 'not-allowed' : 'pointer',
              opacity: busy ? 0.5 : 1
            }}
          >
            Hapus Semua Data Lokal
          </button>
        </div>
      </div>
    </div>
  );
}
