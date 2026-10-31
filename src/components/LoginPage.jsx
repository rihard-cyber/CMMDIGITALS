import React, { useState, useEffect } from 'react';
import { Shield, Lock, Eye, EyeOff, Smartphone, Building, Loader, Building2, KeyRound, LogOut } from 'lucide-react';
import { subscribeTenants, setCurrentTenant, signInWithNrp, changeMyPin, signOutAuth } from '../utils/supabase';

const friendlyAuthError = (err) => {
  const msg = String(err?.message || err || '');
  if (/invalid login credentials|invalid_credentials/i.test(msg)) return 'NRP atau PIN salah.';
  if (/email not confirmed|email_not_confirmed/i.test(msg)) return 'Akun belum dikonfirmasi. Hubungi Admin Super.';
  if (/rate limit|over_.*rate/i.test(msg)) return 'Terlalu banyak percobaan. Tunggu beberapa menit lalu coba lagi.';
  if (/fetch|network|failed to fetch/i.test(msg)) return 'Tidak dapat terhubung ke server. Periksa koneksi internet.';
  if (/profile|profil/i.test(msg)) return msg;
  return msg || 'Login gagal. Silakan coba lagi.';
};

const friendlyPinError = (err) => {
  const msg = String(err?.message || err || '');
  if (/current_pin_invalid/i.test(msg)) return 'PIN saat ini salah. Silakan login ulang.';
  if (/pin_weak/i.test(msg)) return 'PIN baru minimal 6 karakter dan tidak boleh sama dengan NRP.';
  if (/pin_same/i.test(msg)) return 'PIN baru harus berbeda dari PIN lama.';
  if (/unauthenticated/i.test(msg)) return 'Sesi login berakhir. Silakan login ulang.';
  return msg || 'Gagal memperbarui PIN.';
};

export default function LoginPage({ onLogin, initialProfile = null }) {
  const [nrp, setNrp] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // login → change-pin (wajib saat login pertama) → tenant
  const initialMustChange = !!(initialProfile?.mustChangePassword || initialProfile?.must_change_password);
  const [step, setStep] = useState(
    initialProfile ? (initialMustChange ? 'change-pin' : 'tenant') : 'login'
  );
  const [authedUser, setAuthedUser] = useState(initialProfile || null);

  const [newPin, setNewPin] = useState('');
  const [confirmNewPin, setConfirmNewPin] = useState('');
  const [pinNotice, setPinNotice] = useState('');

  const [tenants, setTenants] = useState([]);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [loadingTenants, setLoadingTenants] = useState(false);

  useEffect(() => {
    if (initialProfile) {
      setAuthedUser(initialProfile);
      setStep(initialMustChange ? 'change-pin' : 'tenant');
    }
  }, [initialProfile, initialMustChange]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (!nrp.trim() || !pin.trim()) {
      setError('NRP dan PIN harus diisi');
      return;
    }

    setLoading(true);
    try {
      const result = await signInWithNrp(nrp.trim(), pin);
      if (result.error) {
        setError(friendlyAuthError(result.error));
        return;
      }
      const profile = result.profile;
      setAuthedUser(profile);
      setStep(profile.mustChangePassword || profile.must_change_password ? 'change-pin' : 'tenant');
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleChangePin = async (e) => {
    e.preventDefault();
    setError('');
    setPinNotice('');

    if (newPin.length < 6) {
      setError('PIN baru minimal 6 karakter.');
      return;
    }
    if (newPin !== confirmNewPin) {
      setError('Konfirmasi PIN baru tidak cocok.');
      return;
    }
    if (newPin === pin) {
      setError('PIN baru harus berbeda dari PIN sementara.');
      return;
    }

    setLoading(true);
    try {
      await changeMyPin(pin, newPin);
      setAuthedUser((prev) => prev ? { ...prev, mustChangePassword: false, must_change_password: false } : prev);
      setPin('');
      setNewPin('');
      setConfirmNewPin('');
      setPinNotice('PIN berhasil diperbarui. Pilih lokasi kerja Anda.');
      setStep('tenant');
    } catch (err) {
      const msg = friendlyPinError(err);
      setError(msg);
      if (/login ulang|sesi/i.test(msg)) {
        await signOutAuth().catch(() => {});
        setStep('login');
        setAuthedUser(null);
      }
    } finally {
      setLoading(false);
    }
  };

  // Muat daftar tenant setelah autentikasi. RLS hanya mengembalikan tenant
  // yang boleh diakses; Admin Super melihat semua, anggota hanya lokasinya.
  useEffect(() => {
    if (step !== 'tenant' || !authedUser) return;
    let cancelled = false;
    setLoadingTenants(true);
    setError('');

    const unsub = subscribeTenants((data) => {
      if (cancelled) return;
      setLoadingTenants(false);
      if (!data || !Array.isArray(data)) {
        setTenants([]);
        return;
      }

      const userTenantId = authedUser.tenantId || authedUser.tenant_id || null;
      const isOwner = authedUser.jabatan === 'Admin Super';
      const allowed = isOwner ? data : data.filter((t) => t.id === userTenantId);

      setTenants(allowed);
      if (allowed.length === 1) setSelectedTenant(allowed[0]);
      else setSelectedTenant(null);
    }, { limit: 100 });

    return () => { cancelled = true; unsub(); };
  }, [step, authedUser]);

  const handleSelectTenant = () => {
    if (!selectedTenant) {
      setError('Silakan pilih lokasi / gedung terlebih dahulu');
      return;
    }
    setError('');
    setCurrentTenant(selectedTenant.id);

    const meta = {
      id: selectedTenant.id,
      slug: selectedTenant.slug,
      nama: selectedTenant.nama
    };
    try { localStorage.setItem('cmdigital_tenant_meta', JSON.stringify(meta)); } catch (_) {}

    onLogin({
      ...authedUser,
      tenantId: selectedTenant.id,
      tenantSlug: selectedTenant.slug,
      tenantNama: selectedTenant.nama
    });
  };

  const handleBackToLogin = async () => {
    await signOutAuth().catch(() => {});
    setStep('login');
    setAuthedUser(null);
    setTenants([]);
    setSelectedTenant(null);
    setPin('');
    setNewPin('');
    setConfirmNewPin('');
    setError('');
    setPinNotice('');
  };

  if (loading) {
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
            <span className="progress-label">AUTHENTICATING PROFILE</span>
            <span className="progress-percent">SECURE CONTEXT</span>
          </div>
          <div className="cyber-progress-bar">
            <div className="cyber-progress-fill" style={{ width: '75%', animation: 'pulse 1.5s infinite' }}></div>
          </div>
        </div>
        <div className="cyber-console">
          <div className="console-header">
            <span className="console-title">[SECURE ACCESS VERIFICATION]</span>
            <span className="console-status blink">VERIFYING CREDENTIALS</span>
          </div>
          <div className="console-body">
            <p className="console-line">&gt;&gt; COMPILING CLIENT CRYPTO SIGNATURES...</p>
            <p className="console-line">&gt;&gt; MATCHING REGISTERED SECURITY NRP...</p>
            <p className="console-line">&gt;&gt; STABILIZING TOKEN SESSION KEYS...</p>
            <p className="console-line">&gt;&gt; SERVER-SIDE AUTHORIZATION ACTIVE... OK</p>
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

  // ── TAHAP WAJIB GANTI PIN (login pertama / setelah reset Admin) ──
  if (step === 'change-pin' && authedUser) {
    return (
      <div className="login-page">
        <div className="login-bg-animation">
          <div className="login-grid"></div>
          <div className="login-scanline"></div>
        </div>
        <div className="login-container">
          <div className="login-card">
            <div className="login-header">
              <div className="login-logo-ring">
                <img src="logo.png" alt="CMMDIGITAL" className="login-logo logo-3d" />
              </div>
              <h1 className="login-title">Ganti PIN Keamanan</h1>
              <p className="login-subtitle">
                Halo, <b>{authedUser.nama}</b> ({authedUser.nrp})
              </p>
              <p style={{ marginTop: '0.5rem', fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                PIN sementara Anda wajib diganti sebelum masuk. Gunakan minimal 6 karakter
                dan jangan memakai NRP.
              </p>
            </div>

            <form onSubmit={handleChangePin} className="login-form">
              {error && <div className="login-error">{error}</div>}
              {pinNotice && <div className="login-success">{pinNotice}</div>}

              <div className="login-field">
                <label>PIN Baru (min. 6 karakter)</label>
                <div className="login-input-wrap">
                  <KeyRound size={18} />
                  <input
                    type={showPin ? 'text' : 'password'}
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value)}
                    placeholder="Masukkan PIN baru"
                    maxLength={72}
                    autoFocus
                  />
                  <button type="button" className="login-toggle-pin" onClick={() => setShowPin(!showPin)}>
                    {showPin ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="login-field">
                <label>Konfirmasi PIN Baru</label>
                <div className="login-input-wrap">
                  <Lock size={18} />
                  <input
                    type={showPin ? 'text' : 'password'}
                    value={confirmNewPin}
                    onChange={(e) => setConfirmNewPin(e.target.value)}
                    placeholder="Ulangi PIN baru"
                    maxLength={72}
                  />
                </div>
              </div>

              <button type="submit" className="login-btn" disabled={loading}>
                Simpan PIN & Lanjut
              </button>

              <button type="button" onClick={handleBackToLogin} className="login-btn login-btn-secondary" style={{ background: 'transparent', border: '1px solid var(--border-glass)' }}>
                <LogOut size={16} /> Batal & Login Ulang
              </button>
            </form>

            <div className="login-security-badge">
              <Shield size={14} />
              <span>PIN disimpan terenkripsi di server</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── TAHAP PILIH TENANT (gedung / cabang) ──
  if (step === 'tenant' && authedUser) {
    return (
      <div className="login-page">
        <div className="login-bg-animation">
          <div className="login-grid"></div>
          <div className="login-scanline"></div>
        </div>
        <div className="login-container">
          <div className="login-card">
            <div className="login-header">
              <div className="login-logo-ring">
                <img src="logo.png" alt="CMMDIGITAL" className="login-logo logo-3d" />
              </div>
              <h1 className="login-title">Pilih Lokasi</h1>
              <p className="login-subtitle">
                Pilih gedung / cabang yang akan diakses
              </p>
              <p style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Halo, <b>{authedUser.nama}</b> ({authedUser.nrp})
              </p>
            </div>

            {error && <div className="login-error">{error}</div>}
            {pinNotice && <div className="login-success">{pinNotice}</div>}

            <div className="login-field">
              <label>Gedung / Cabang</label>
              <div className="login-input-wrap">
                <Building2 size={18} />
                <select
                  value={selectedTenant ? selectedTenant.id : ''}
                  onChange={(e) => {
                    const id = e.target.value;
                    const t = tenants.find(x => x.id === id);
                    setSelectedTenant(t || null);
                  }}
                  disabled={loadingTenants}
                  className="tenant-select"
                >
                  <option value="">-- Pilih Lokasi --</option>
                  {tenants.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nama} {t.kode ? `(${t.kode})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {loadingTenants && (
              <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                <Loader size={18} /> Memuat daftar lokasi…
              </div>
            )}

            {!loadingTenants && tenants.length === 0 && (
              <div style={{ textAlign: 'center', padding: '1rem', color: '#ef4444', fontSize: '0.85rem' }}>
                Akun ini belum terhubung ke lokasi tenant mana pun.<br />
                Hubungi Admin PT. CMM untuk didaftarkan.
              </div>
            )}

            <button
              type="button"
              className="login-btn"
              onClick={handleSelectTenant}
              disabled={loading || !selectedTenant || loadingTenants}
            >
              {loading ? 'Memproses...' : 'Masuk ke Lokasi'}
            </button>

            <button type="button" onClick={handleBackToLogin} className="login-btn login-btn-secondary" style={{ background: 'transparent', border: '1px solid var(--border-glass)' }}>
              <LogOut size={16} /> Keluar
            </button>

            <div className="login-security-badge">
              <Shield size={14} />
              <span>Data terisolasi per gedung (RLS)</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── TAHAP LOGIN NRP/PIN ──
  return (
    <div className="login-page">
      <div className="login-bg-animation">
        <div className="login-grid"></div>
        <div className="login-scanline"></div>
      </div>
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <div className="login-logo-ring">
              <img src="logo.png" alt="CMMDIGITAL" className="login-logo logo-3d" />
            </div>
            <h1 className="login-title">CMMDIGITAL</h1>
            <p className="login-subtitle">SISTEM MANAGEMENT MULTI-TENANT</p>
          </div>

          <form onSubmit={handleLogin} className="login-form">
            {error && <div className="login-error">{error}</div>}

            <div className="login-field">
              <label>NRP</label>
              <div className="login-input-wrap">
                <Smartphone size={18} />
                <input
                  type="text"
                  value={nrp}
                  onChange={(e) => setNrp(e.target.value)}
                  placeholder="Masukkan NRP"
                  autoComplete="username"
                  autoFocus
                />
              </div>
            </div>

            <div className="login-field">
              <label>PIN</label>
              <div className="login-input-wrap">
                <Lock size={18} />
                <input
                  type={showPin ? 'text' : 'password'}
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="Masukkan PIN"
                  maxLength={72}
                  autoComplete="current-password"
                />
                <button type="button" className="login-toggle-pin" onClick={() => setShowPin(!showPin)}>
                  {showPin ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? 'Memverifikasi...' : 'Masuk'}
            </button>
          </form>

          <div className="login-security-badge">
            <Shield size={14} />
            <span>Autentikasi server & enkripsi PIN</span>
          </div>

          <div className="login-footer-text" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem', marginTop: '1.25rem', borderTop: '1px solid var(--border-glass)', paddingTop: '1rem' }}>
            <p style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', margin: 0, color: 'var(--text-muted)', fontSize: '0.7rem' }}>
              <Building size={12} /> CMMDIGITAL - SISTEM MANAGEMENT MULTI-TENANT
            </p>
            <div className="ornamental-watermark" style={{ margin: '0.2rem auto 0', width: '100%', maxWidth: '340px' }}>
              <span className="ornament-symbol" style={{ fontSize: '0.65rem', color: 'var(--color-primary)', opacity: 0.75, whiteSpace: 'nowrap' }}>✧═════•❁❀❁•═════✧</span>
              <span className="watermark-text" style={{ fontSize: '0.95rem', fontFamily: "'Great Vibes', 'Brush Script MT', cursive" }}>Developer Richard Meha</span>
              <span className="ornament-symbol" style={{ fontSize: '0.65rem', color: 'var(--color-primary)', opacity: 0.75, whiteSpace: 'nowrap' }}>✧═════•❁❀❁•═════✧</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
