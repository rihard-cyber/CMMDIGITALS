/**
 * =======================================================
 *   CMMDIGITAL SECURITY MANAGEMENT SYSTEM
 *   Module: Tenant Complaint Form (Form Komplain)
 *   Signed by: Richard Meha (by -Richard)
 *   Last Maintained: 2026-06-07
 *   Description: Tenant request submission form with built-in
 *                image compressor and ticket tracking system.
 * =======================================================
 */

import React, { useState, useEffect, useRef } from 'react';
import { Send, Camera, User, Building, MapPin, FileText, AlertTriangle, CheckCircle, X, QrCode, ChevronRight, MessageSquare } from 'lucide-react';
import { compressImage } from '../utils/image';
import { registerBackHandler } from '../utils/navigation';
import { subscribeTenants, loadComplaintByTicket } from '../utils/supabase';

const CATEGORIES = [
  { id: 'Fasilitas', label: 'Fasilitas', icon: Building, color: '#3b82f6' },
  { id: 'Engineering', label: 'Engineering', icon: AlertTriangle, color: '#f59e0b' },
  { id: 'Cleaning', label: 'Cleaning', icon: AlertTriangle, color: '#10b981' },
  { id: 'Satpam', label: 'Satpam / Security', icon: AlertTriangle, color: '#8b5cf6' },
  { id: 'Kritik & Saran', label: 'Kritik & Saran', icon: MessageSquare, color: '#ec4899' },
  { id: 'Lainnya', label: 'Lainnya', icon: FileText, color: '#6b7280' }
];

const FLOORS = [
  'Basement', 'Lt.1', 'Lt.2', 'Lt.3', 'Lt.4', 'Lt.5', 'Lt.6',
  'Halaman Depan', 'Halaman Belakang', 'Halaman Samping Kanan', 'Halaman Samping Kiri', 'Lainnya'
];

export default function ComplaintForm({ onAddComplaint }) {
  const [step, setStep] = useState('splash');
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('BOOTING CORE...');
  const [cyberLogs, setCyberLogs] = useState([]);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [floor, setFloor] = useState('');
  const [location, setLocation] = useState('');
  const [tenant, setTenant] = useState('');
  const [tenantId, setTenantId] = useState('');
  const [tenants, setTenants] = useState([]);
  const [loadingTenants, setLoadingTenants] = useState(true);
  const [category, setCategory] = useState('');
  const [categoryCustom, setCategoryCustom] = useState('');
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState([]);
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [ticketId, setTicketId] = useState('');
  const [trackMode, setTrackMode] = useState(false);
  const [trackId, setTrackId] = useState('');
  const [trackData, setTrackData] = useState(null);
  const [trackLoading, setTrackLoading] = useState(false);

  // Ref ke hidden file input untuk kamera Android
  const photoInputRef = useRef(null);

  // Splash animation (Cyberpunk Simulated Boot)
  useEffect(() => {
    if (step !== 'splash') return;

    const allLogs = [
      '>> INITIALIZING COMPLAINT PORTAL...',
      '>> LOADING SECURE GATEWAY UTILITIES...',
      '>> CONNECTING CENTRAL DATABASE DIRECTORY...',
      '>> SYNCING COMPLAINT CATEGORIES...',
      '>> LOAD SECURITY TOKEN: OK',
      '>> INTEGRATION STACK STATUS: OPERATIONAL',
      '>> PORTAL INTERFACE STABILIZED... SECURE',
      '>> SYSTEM COMPLAINT PORTAL IS READY!'
    ];

    setProgress(0);
    setCyberLogs([]);
    setStatusText('BOOTING CORE...');

    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return Math.min(prev + Math.floor(Math.random() * 8) + 4, 100);
      });
    }, 100);

    let logIndex = 0;
    const logInterval = setInterval(() => {
      if (logIndex < allLogs.length) {
        setCyberLogs(prev => [...prev, allLogs[logIndex]]);
        logIndex++;
      } else {
        clearInterval(logInterval);
      }
    }, 300);

    const statusInterval = setInterval(() => {
      setProgress(p => {
        if (p < 30) setStatusText('BOOTING CORE...');
        else if (p < 65) setStatusText('CALIBRATING PORTAL...');
        else if (p < 90) setStatusText('DECRYPTING INTERFACE...');
        else {
          setStatusText('SECURE & OPERATIONAL');
          clearInterval(statusInterval);
        }
        return p;
      });
    }, 200);

    const transitionTimer = setTimeout(() => {
      setStep('form');
    }, 3200);

    return () => {
      clearInterval(progressInterval);
      clearInterval(logInterval);
      clearInterval(statusInterval);
      clearTimeout(transitionTimer);
    };
  }, [step]);

  // Muat daftar lokasi/gedung terdaftar. QR poster bisa membawa ?tenant=tnt_xxx.
  useEffect(() => {
    setLoadingTenants(true);
    const urlTenant = typeof window !== 'undefined'
      ? (new URLSearchParams(window.location.search).get('tenant') || '')
      : '';
    let unsubscribe = null;
    unsubscribe = subscribeTenants((data) => {
      const list = Array.isArray(data) ? data : [];
      setTenants(list);
      setLoadingTenants(false);
      if (urlTenant) {
        const match = list.find(t => t.id === urlTenant || t.slug === urlTenant);
        if (match) {
          setTenantId(match.id);
          setErrors(p => ({ ...p, tenantId: '' }));
        }
      }
    }, { limit: 100 });
    return () => { if (typeof unsubscribe === 'function') unsubscribe(); };
  }, []);

  // Handle back button to go back from track mode to main form
  useEffect(() => {
    const unregister = registerBackHandler(() => {
      if (trackMode) {
        setTrackMode(false);
        setTrackData(null);
        return true;
      }
      return false;
    });
    return unregister;
  }, [trackMode]);

  const handlePhotoCapture = () => {
    if (photoInputRef.current) {
      photoInputRef.current.value = '';
      photoInputRef.current.click();
    }
  };

  const handlePhotoChange = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(f => {
      const reader = new FileReader();
      reader.onloadend = () => {
        compressImage(reader.result).then(compressed => {
          setPhotos(prev => [...prev, compressed]);
        });
      };
      reader.readAsDataURL(f);
    });
    e.target.value = '';
  };

  const removePhoto = (idx) => setPhotos(prev => prev.filter((_, i) => i !== idx));

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = {};
    if (!name.trim()) errs.name = 'Nama wajib diisi';
    if (!tenantId) errs.tenantId = 'Pilih lokasi / gedung';
    if (!floor) errs.floor = 'Pilih lantai';
    if (!category) errs.category = 'Pilih kategori pengaduan / saran';
    if (category === 'Lainnya' && !categoryCustom.trim()) errs.category = 'Tulis kategori pengaduan';
    if (!description.trim()) errs.description = category === 'Kritik & Saran' ? 'Isi kritik & saran wajib diisi' : 'Deskripsi komplain wajib diisi';
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});

    const dateCode = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const suffix = (globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2))
      .replace(/-/g, '').slice(0, 6).toUpperCase();
    const id = `CMP-${dateCode}-${suffix}`;
    const finalCategory = category === 'Lainnya' && categoryCustom.trim() ? categoryCustom.trim() : category;
    const selectedTenant = tenants.find(t => t.id === tenantId);
    const buildingName = selectedTenant?.nama || tenantId;
    const complaint = {
      id: `cmp-${Date.now()}`,
      ticketId: id,
      name: name.trim(),
      phone: phone.trim(),
      floor,
      location: location.trim(),
      tenant: tenant.trim() ? `${buildingName} — ${tenant.trim()}` : buildingName,
      tenant_id: tenantId,
      category: finalCategory,
      description: description.trim(),
      photos,
      status: 'Baru',
      department: '',
      remarks: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      history: [{ status: 'Baru', timestamp: new Date().toISOString(), note: 'Komplain dibuat' }],
      waStatus: 'Belum Dikirim'
    };
    // Simpan langsung ke localStorage sebagai jaring pengaman
    try {
      const existing = JSON.parse(localStorage.getItem('cmdigital_complaints') || '[]');
      existing.unshift(complaint);
      localStorage.setItem('cmdigital_complaints', JSON.stringify(existing));
    } catch (e) {
      console.warn('[Form] Gagal simpan langsung:', e);
    }
    onAddComplaint(complaint);
    setTicketId(id);
    setSubmitted(true);
  };

  const handleTrack = async (e) => {
    e.preventDefault();
    if (!trackId.trim()) return;
    const query = trackId.trim();
    setTrackLoading(true);
    try {
      const data = JSON.parse(localStorage.getItem('cmdigital_complaints') || '[]');
      let found = data.find(c =>
        String(c.ticketId || '').toUpperCase() === query.toUpperCase()
      );
      // Cari juga di cloud agar tiket bisa dilacak dari perangkat lain
      if (!found) found = await loadComplaintByTicket(query);
      setTrackData(found || 'notfound');
    } catch {
      setTrackData('notfound');
    } finally {
      setTrackLoading(false);
    }
  };

  const statusColor = (s) => ({
    Baru: '#3b82f6', Diterima: '#f59e0b', Diproses: '#8b5cf6', Selesai: '#10b981'
  })[s] || '#6b7280';

  if (step === 'splash') {
    return (
      <div className="splash-screen cyber-screen">
        <div className="cyber-corner corner-tl"></div>
        <div className="cyber-corner corner-tr"></div>
        <div className="cyber-corner corner-bl"></div>
        <div className="cyber-corner corner-br"></div>
        <div className="cyber-grid"></div>
        <div className="cyber-scanline"></div>
        <div className="cyber-hud-container">
          <div className="hud-ring ring-outer"></div>
          <div className="hud-ring ring-middle"></div>
          <div className="hud-ring ring-inner"></div>
          <div className="hud-ring ring-dashed"></div>
          <div className="splash-logo-container">
            <img src="logo.png" alt="CMMDIGITAL" className="splash-logo cyber-logo logo-3d-spin" />
          </div>
        </div>
        <div className="cyber-progress-container">
          <div className="cyber-progress-header">
            <span className="progress-label">COMPLAINT PORTAL INITIALIZATION</span>
            <span className="progress-percent">{progress}%</span>
          </div>
          <div className="cyber-progress-bar">
            <div className="cyber-progress-fill" style={{ width: `${progress}%` }}></div>
          </div>
        </div>
        <div className="cyber-console">
          <div className="console-header">
            <span className="console-title">[SECURE CORE COMPLAINT PROT]</span>
            <span className="console-status blink">{statusText}</span>
          </div>
          <div className="console-body">
            {cyberLogs.slice(-4).map((log, idx) => (
              <p key={idx} className="console-line">{log}</p>
            ))}
          </div>
        </div>
        <div className="splash-footer cyber-footer" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem', width: '100%', maxWidth: '420px', padding: '0 1rem' }}>
          <div className="ornamental-watermark" style={{ margin: '0 auto', opacity: 0.95, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', width: '100%' }}>
            <span className="ornament-symbol" style={{ fontSize: '0.65rem', color: 'var(--color-primary)', opacity: 0.8, whiteSpace: 'nowrap' }}>✧═════•❁❀❁•═════✧</span>
            <span className="watermark-text" style={{ fontFamily: "'Great Vibes', 'Brush Script MT', cursive", fontSize: '1.25rem', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
              Developer Richard Meha
            </span>
            <span className="ornament-symbol" style={{ fontSize: '0.65rem', color: 'var(--color-primary)', opacity: 0.8, whiteSpace: 'nowrap' }}>✧═════•❁❀❁•═════✧</span>
          </div>
          <span style={{ fontSize: '0.62rem', color: '#c7d2fe', letterSpacing: '0.12em', marginTop: '0.2rem', textTransform: 'uppercase', fontWeight: 'bold' }}>
            ★ CMMDIGITAL CORE ARCHITECT ★
          </span>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'transparent',
        padding: '2rem', width: '100%'
      }}>
        <div className="glass-panel complaint-glass-panel" style={{ maxWidth: 420, width: '100%', padding: '2rem', textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, margin: '0 auto 1rem', borderRadius: '50%', background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle size={36} style={{ color: '#10b981' }} />
          </div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Komplain Terkirim!</h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>Laporan Anda akan segera ditindaklanjuti.</p>
          <div className="glass-panel" style={{ padding: '1rem', marginBottom: '1.25rem', background: 'rgba(59,130,246,0.05)' }}>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Nomor Tiket</p>
            <p style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-primary)', letterSpacing: '0.05em' }}>{ticketId}</p>
          </div>
          <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
            Simpan nomor tiket untuk melacak status komplain Anda.
          </p>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={() => { setStep('form'); setSubmitted(false); setName(''); setPhone(''); setFloor(''); setLocation(''); setTenant(''); setCategory(''); setCategoryCustom(''); setDescription(''); setPhotos([]); setErrors({}); }} className="btn-primary" style={{ flex: 1, padding: '0.65rem', fontSize: '0.8rem', minHeight: '44px', touchAction: 'manipulation' }}>
              Buat Komplain Baru
            </button>
            <button onClick={() => { setStep('form'); setSubmitted(false); setTrackMode(true); }} className="btn-secondary" style={{ flex: 1, padding: '0.65rem', fontSize: '0.8rem' }}>
              Lacak Tiket
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (trackMode) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'transparent',
        padding: '2rem', width: '100%'
      }}>
        <div className="glass-panel complaint-glass-panel" style={{ maxWidth: 500, width: '100%', padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <button onClick={() => { setTrackMode(false); setTrackData(null); }} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: 0, display: 'flex' }}>
              <ChevronRight size={20} style={{ transform: 'rotate(180deg)' }} />
            </button>
            <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Lacak Komplain</h3>
          </div>

          <form onSubmit={handleTrack} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <div className="step-field">
              <label>CARI NOMOR TIKET</label>
              <input type="text" value={trackId} onChange={e => setTrackId(e.target.value)} placeholder="Cth: CMP-20260605-A1B2C3" className="modern-input" style={{ fontSize: '0.85rem' }} />
            </div>
            <button type="submit" disabled={trackLoading} className="btn-primary" style={{ padding: '0.6rem', fontSize: '0.8rem', opacity: trackLoading ? 0.7 : 1 }}>{trackLoading ? 'Mencari...' : 'Cari'}</button>
          </form>

          {trackData === 'notfound' && (
            <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
              <AlertTriangle size={32} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
              <p>Tiket tidak ditemukan. Periksa kembali nomor tiket Anda.</p>
            </div>
          )}

          {trackData && trackData !== 'notfound' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div className="glass-panel" style={{ padding: '0.75rem', background: 'rgba(59,130,246,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: 600 }}>TIKET</span>
                  <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--color-primary)', letterSpacing: '0.03em' }}>{trackData.ticketId}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: 600 }}>STATUS</span>
                  <span style={{
                    fontSize: '0.7rem', padding: '0.15rem 0.6rem', borderRadius: '20px', fontWeight: 700,
                    background: `${statusColor(trackData.status)}20`, color: statusColor(trackData.status)
                  }}>{trackData.status}</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.78rem' }}>
                <div className="preview-row"><span className="preview-label">Pelapor</span><span className="preview-value">{trackData.name}</span></div>
                {trackData.phone && <div className="preview-row"><span className="preview-label">Telepon</span><span className="preview-value">{trackData.phone}</span></div>}
                <div className="preview-row"><span className="preview-label">Lantai</span><span className="preview-value">{trackData.floor}</span></div>
                {trackData.location && <div className="preview-row"><span className="preview-label">Lokasi</span><span className="preview-value">{trackData.location}</span></div>}
                <div className="preview-row"><span className="preview-label">Tenant</span><span className="preview-value">{trackData.tenant}</span></div>
                <div className="preview-row"><span className="preview-label">Kategori</span><span className="preview-value">{trackData.category}</span></div>
              </div>

              <div style={{ fontSize: '0.78rem', color: 'var(--text-primary)', padding: '0.5rem 0.75rem', background: 'var(--bg-tertiary)', borderRadius: '6px' }}>
                <p style={{ fontWeight: 600, marginBottom: '0.25rem', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>DESKRIPSI</p>
                <p>{trackData.description}</p>
              </div>

              {trackData.photos?.length > 0 && (
                <div>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '0.4rem' }}>FOTO</p>
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    {trackData.photos.map((p, i) => (
                      <img key={i} src={p} alt="" style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: '6px', border: '1px solid var(--border-glass)' }} />
                    ))}
                  </div>
                </div>
              )}

              {/* Timeline */}
              <div style={{ marginTop: '0.5rem' }}>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '0.5rem' }}>RIWAYAT STATUS</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {trackData.history?.map((h, i) => (
                    <div key={i} style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: statusColor(h.status), flexShrink: 0 }} />
                        {i < trackData.history.length - 1 && <div style={{ width: 2, flex: 1, background: 'var(--border-glass)', minHeight: 16 }} />}
                      </div>
                      <div style={{ fontSize: '0.72rem' }}>
                        <span style={{ fontWeight: 700, color: statusColor(h.status) }}>{h.status}</span>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.6rem' }}>{new Date(h.timestamp).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}</p>
                        {h.note && <p style={{ color: 'var(--text-secondary)', fontSize: '0.65rem', marginTop: '0.1rem' }}>{h.note}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <button onClick={() => { setTrackMode(false); setTrackData(null); }} className="btn-secondary btn-full" style={{ marginTop: '1rem', padding: '0.5rem', fontSize: '0.75rem' }}>
            Kembali ke Form
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'transparent',
      padding: '2rem 1rem',
      display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%'
    }}>
      <div className="glass-panel complaint-glass-panel" style={{ maxWidth: 520, width: '100%', padding: '1.5rem 1.75rem', position: 'relative', overflow: 'hidden' }}>
        {/* Background decoration */}
        <div style={{ position: 'absolute', top: -40, right: -40, width: 120, height: 120, borderRadius: '50%', background: 'rgba(59,130,246,0.05)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -30, left: -30, width: 100, height: 100, borderRadius: '50%', background: 'rgba(139,92,246,0.05)', pointerEvents: 'none' }} />

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <img src="./logo.png" alt="CMMDIGITAL" className="logo-3d" style={{ height: 32, width: 'auto' }} />
            <div>
              <h2 style={{ fontSize: '1rem', fontWeight: 800, lineHeight: 1.2 }}>CMMDIGITAL</h2>
              <p style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Sistem Komplain Terpadu</p>
            </div>
          </div>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Sampaikan komplain, saran, atau laporan Anda tanpa perlu login.</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', position: 'relative', zIndex: 1 }}>
          {/* Name */}
          <div className="step-field">
            <label>NAMA LENGKAP <span style={{ color: 'var(--color-danger)' }}>*</span></label>
            <div className="scan-input-group">
              <User size={16} style={{ color: 'var(--text-muted)', position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              <input type="text" value={name} onChange={e => { setName(e.target.value); setErrors(p => ({ ...p, name: '' })); }}
                placeholder="Masukkan nama Anda" className="modern-input" style={{ paddingLeft: '2rem', fontSize: '0.82rem' }} />
            </div>
            {errors.name && <span style={{ fontSize: '0.65rem', color: 'var(--color-danger)' }}>{errors.name}</span>}
          </div>

          {/* Phone (optional) */}
          <div className="step-field">
            <label>NO. TELEPON <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(opsional — untuk notifikasi)</span></label>
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="Cth: 08123456789" className="modern-input" style={{ fontSize: '0.82rem' }} />
          </div>

          {/* Building / Tenant Location */}
          <div className="step-field">
            <label>LOKASI / GEDUNG <span style={{ color: 'var(--color-danger)' }}>*</span></label>
            <select value={tenantId} onChange={e => { setTenantId(e.target.value); setErrors(p => ({ ...p, tenantId: '' })); }} className="modern-select" style={{ fontSize: '0.82rem' }} disabled={loadingTenants}>
              <option value="">{loadingTenants ? '— Memuat lokasi...' : '— Pilih Lokasi / Gedung —'}</option>
              {tenants.map(t => <option key={t.id} value={t.id}>{t.nama}</option>)}
            </select>
            {!loadingTenants && tenants.length === 0 && (
              <span style={{ fontSize: '0.65rem', color: 'var(--color-danger)' }}>Belum ada lokasi terdaftar. Hubungi Admin PT. CMM.</span>
            )}
            {errors.tenantId && <span style={{ fontSize: '0.65rem', color: 'var(--color-danger)' }}>{errors.tenantId}</span>}
          </div>

          {/* Floor */}
          <div className="step-field">
            <label>LANTAI <span style={{ color: 'var(--color-danger)' }}>*</span></label>
            <select value={floor} onChange={e => { setFloor(e.target.value); setErrors(p => ({ ...p, floor: '' })); }} className="modern-select" style={{ fontSize: '0.82rem' }}>
              <option value="">— Pilih Lantai —</option>
              {FLOORS.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
            {errors.floor && <span style={{ fontSize: '0.65rem', color: 'var(--color-danger)' }}>{errors.floor}</span>}
          </div>

          {/* Tenant */}
          <div className="step-field">
            <label>LOKASI DETAIL <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(opsional)</span></label>
            <div className="scan-input-group">
              <MapPin size={16} style={{ color: 'var(--text-muted)', position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              <input type="text" value={location} onChange={e => setLocation(e.target.value)}
                placeholder="Cth: Depan Lobby / Koridor Lt. 2" className="modern-input" style={{ paddingLeft: '2rem', fontSize: '0.82rem' }} />
            </div>
          </div>

          {/* Unit / Ana Sorum */}
          <div className="step-field">
            <label>NAMA UNIT / ANA SORUM <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(opsional)</span></label>
            <div className="scan-input-group">
              <Building size={16} style={{ color: 'var(--text-muted)', position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              <input type="text" value={tenant} onChange={e => setTenant(e.target.value)}
                placeholder="Cth: PT Maju Jaya / Ana Sorum Lt. 3" className="modern-input" style={{ paddingLeft: '2rem', fontSize: '0.82rem' }} />
            </div>
          </div>

          {/* Category */}
          <div className="step-field">
            <label>KATEGORI TIKET / PENGADUAN <span style={{ color: 'var(--color-danger)' }}>*</span></label>
            <div className="complaint-cat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.35rem' }}>
              {CATEGORIES.map(c => (
                <button key={c.id} type="button" onClick={() => { setCategory(c.id); setCategoryCustom(''); setErrors(p => ({ ...p, category: '' })); }} style={{
                  padding: '0.6rem 0.45rem', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 700, minHeight: '48px',
                  border: `1.5px solid ${category === c.id ? c.color : 'var(--border-glass)'}`,
                  background: category === c.id ? `${c.color}18` : 'transparent',
                  color: category === c.id ? c.color : 'var(--text-secondary)',
                  cursor: 'pointer', fontFamily: 'var(--font-sans)', transition: 'all 0.2s', touchAction: 'manipulation'
                }}>{c.label}</button>
              ))}
            </div>
            {category === 'Lainnya' && (
              <input type="text" value={categoryCustom} onChange={e => setCategoryCustom(e.target.value)}
                placeholder="Ketik kategori lain..." className="modern-input" style={{ marginTop: '0.3rem', fontSize: '0.8rem' }} />
            )}
            {errors.category && <span style={{ fontSize: '0.65rem', color: 'var(--color-danger)' }}>{errors.category}</span>}
          </div>

          {/* Description */}
          <div className="step-field">
            <label>{category === 'Kritik & Saran' ? 'ISI KRITIK & SARAN' : 'DESKRIPSI KOMPLAIN'} <span style={{ color: 'var(--color-danger)' }}>*</span></label>
            <textarea value={description} onChange={e => { setDescription(e.target.value); setErrors(p => ({ ...p, description: '' })); }}
              placeholder={category === 'Kritik & Saran' ? 'Tuliskan kritik, masukan, atau saran Anda untuk peningkatan layanan gedung CMMDIGITAL...' : 'Jelaskan detail komplain atau kendala Anda...'} className="modern-input"
              style={{ height: '90px', resize: 'vertical', fontSize: '0.82rem', padding: '0.5rem' }} />
            {errors.description && <span style={{ fontSize: '0.65rem', color: 'var(--color-danger)' }}>{errors.description}</span>}
          </div>

          {/* Photos */}
          <div className="step-field">
            <label>FOTO BUKTI <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(opsional, max 3)</span></label>
            {photos.length > 0 && (
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.4rem' }}>
                {photos.map((p, i) => (
                  <div key={i} style={{ position: 'relative', width: 64, height: 64, borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--border-glass)' }}>
                    <img src={p} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <button type="button" onClick={() => removePhoto(i)} style={{ position: 'absolute', top: 2, right: 2, width: 18, height: 18, borderRadius: '50%', background: 'rgba(0,0,0,0.6)', border: 'none', color: '#fff', fontSize: '0.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={10} /></button>
                  </div>
                ))}
              </div>
            )}
            {photos.length < 3 && (
              <>
                {/* Hidden file input — dikontrol via ref agar kompatibel dengan Android WebView */}
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  multiple
                  onChange={handlePhotoChange}
                  style={{ display: 'none' }}
                />
                <button type="button" onClick={handlePhotoCapture} className="btn-secondary" style={{ padding: '0.45rem 0.75rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem', width: 'fit-content' }}>
                  <Camera size={14} /> {photos.length > 0 ? 'Tambah Foto' : 'Ambil / Upload Foto'}
                </button>
              </>
            )}
          </div>

          <button type="submit" className="btn-primary" style={{
            width: '100%', padding: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
            fontSize: '0.85rem', marginTop: '0.25rem'
          }}>
            <Send size={16} /> Kirim Komplain
          </button>
        </form>

        <div style={{ marginTop: '1.25rem', textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <button onClick={() => setTrackMode(true)} style={{
            background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer',
            fontSize: '0.75rem', fontWeight: 600, fontFamily: 'var(--font-sans)',
            display: 'inline-flex', alignItems: 'center', gap: '0.25rem'
          }}>
            <QrCode size={13} /> Lacak Tiket Komplain
          </button>
        </div>

        <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem', width: '100%', opacity: 0.9, position: 'relative', zIndex: 1 }}>
          <p style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', margin: 0, color: 'var(--text-muted)', fontSize: '0.65rem' }}>
            CMMDIGITAL &mdash; SISTEM MANAGEMENT MULTI-TENANT &copy; 2026
          </p>
          <div className="ornamental-watermark" style={{ margin: '0.2rem auto 0', width: '100%', maxWidth: '380px' }}>
            <span className="ornament-symbol" style={{ fontSize: '0.65rem', color: 'var(--color-primary)', opacity: 0.75, whiteSpace: 'nowrap' }}>✧═════•❁❀❁•═════✧</span>
            <span className="watermark-text" style={{ fontSize: '0.95rem', fontFamily: "'Great Vibes', 'Brush Script MT', cursive" }}>Developer Richard Meha</span>
            <span className="ornament-symbol" style={{ fontSize: '0.65rem', color: 'var(--color-primary)', opacity: 0.75, whiteSpace: 'nowrap' }}>✧═════•❁❀❁•═════✧</span>
          </div>
        </div>
      </div>
    </div>
  );
}
