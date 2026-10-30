import React, { useState } from 'react';
import { X, Printer, Download, Sparkles, Building2, ShieldCheck, Wrench, Sparkle, Car, PhoneCall, Smartphone, CheckCircle2 } from 'lucide-react';

export default function ComplaintPosterModal({ isOpen, onClose, complaintUrl, qrApiUrl }) {
  const [themeMode, setThemeMode] = useState('light'); // 'light' (print friendly) or 'dark' (luxury navy)
  const [paperSize, setPaperSize] = useState('a4'); // 'a4' or 'a5'
  const [hotline, setHotline] = useState(() => localStorage.getItem('cmdigital_poster_hotline') || 'Security & Helpdesk: (021) 5304747 / WhatsApp CMMDIGITAL');
  const [buildingName, setBuildingName] = useState(() => localStorage.getItem('cmdigital_poster_bldg') || 'CMMDIGITAL BUILDING');

  if (!isOpen) return null;

  const handlePrint = () => {
    const isDark = themeMode === 'dark';
    const printWin = window.open('', '_blank', 'width=900,height=1200');
    if (!printWin) {
      alert('Mohon izinkan pop-up di browser untuk mencetak poster.');
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="UTF-8">
        <title>Poster Pengaduan Publik - ${buildingName}</title>
        <style>
          @page {
            size: ${paperSize === 'a5' ? 'A5 portrait' : 'A4 portrait'};
            margin: 0;
          }
          * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          body {
            margin: 0;
            padding: 0;
            font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif;
            background: ${isDark ? '#081021' : '#ffffff'};
            color: ${isDark ? '#f8fafc' : '#0f172a'};
            display: flex;
            justify-content: center;
            align-items: center;
            width: 100vw;
            height: 100vh;
          }
          .poster-container {
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            padding: 32px 36px;
            background: ${isDark 
              ? 'linear-gradient(180deg, #09132b 0%, #060b17 100%)' 
              : 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)'};
            position: relative;
            border: ${isDark ? '2px solid #1e293b' : 'none'};
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid ${isDark ? '#1e3a8a' : '#e2e8f0'};
            padding-bottom: 16px;
          }
          .brand {
            display: flex;
            flex-direction: column;
          }
          .brand-title {
            font-size: 26px;
            font-weight: 900;
            letter-spacing: 2px;
            color: ${isDark ? '#38bdf8' : '#0369a1'};
            text-transform: uppercase;
            margin: 0;
          }
          .brand-sub {
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 1.5px;
            color: ${isDark ? '#94a3b8' : '#64748b'};
            margin-top: 2px;
            text-transform: uppercase;
          }
          .badge-live {
            background: ${isDark ? 'rgba(56, 189, 248, 0.15)' : '#e0f2fe'};
            border: 1px solid ${isDark ? '#0284c7' : '#bae6fd'};
            color: ${isDark ? '#38bdf8' : '#0369a1'};
            padding: 6px 14px;
            border-radius: 9999px;
            font-size: 11px;
            font-weight: 800;
            letter-spacing: 1px;
            text-transform: uppercase;
          }
          .hero-section {
            text-align: center;
            margin-top: 10px;
          }
          .hero-title {
            font-size: 32px;
            font-weight: 900;
            line-height: 1.15;
            margin: 0 0 8px 0;
            color: ${isDark ? '#ffffff' : '#0f172a'};
            letter-spacing: -0.5px;
          }
          .hero-title span {
            color: ${isDark ? '#38bdf8' : '#0284c7'};
          }
          .hero-desc {
            font-size: 13.5px;
            color: ${isDark ? '#94a3b8' : '#475569'};
            max-width: 80%;
            margin: 0 auto;
            line-height: 1.45;
          }
          .qr-wrapper {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            margin: 16px 0;
          }
          .qr-frame {
            background: #ffffff;
            padding: 16px;
            border-radius: 20px;
            box-shadow: ${isDark ? '0 15px 35px rgba(0,0,0,0.6)' : '0 12px 30px rgba(0,0,0,0.08)'};
            border: 3px solid ${isDark ? '#38bdf8' : '#0284c7'};
            text-align: center;
          }
          .qr-img {
            width: 220px;
            height: 220px;
            display: block;
          }
          .qr-caption {
            margin-top: 10px;
            font-size: 13px;
            font-weight: 900;
            letter-spacing: 1.5px;
            color: #0f172a;
            text-transform: uppercase;
          }
          .qr-subtext {
            font-size: 10px;
            color: #64748b;
            margin-top: 2px;
          }
          .steps-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 12px;
            margin: 10px 0;
          }
          .step-card {
            background: ${isDark ? 'rgba(255,255,255,0.04)' : '#f8fafc'};
            border: 1px solid ${isDark ? '#1e293b' : '#e2e8f0'};
            border-radius: 12px;
            padding: 12px 10px;
            text-align: center;
          }
          .step-num {
            width: 24px;
            height: 24px;
            border-radius: 50%;
            background: ${isDark ? '#0284c7' : '#0284c7'};
            color: #ffffff;
            font-size: 12px;
            font-weight: 800;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 6px auto;
          }
          .step-title {
            font-size: 12px;
            font-weight: 800;
            color: ${isDark ? '#f1f5f9' : '#1e293b'};
            margin-bottom: 3px;
          }
          .step-desc {
            font-size: 9.5px;
            color: ${isDark ? '#94a3b8' : '#64748b'};
            line-height: 1.35;
          }
          .category-pills {
            display: flex;
            justify-content: center;
            gap: 8px;
            flex-wrap: wrap;
            margin-top: 6px;
          }
          .pill {
            background: ${isDark ? '#0f172a' : '#f1f5f9'};
            border: 1px solid ${isDark ? '#334155' : '#cbd5e1'};
            color: ${isDark ? '#cbd5e1' : '#334155'};
            font-size: 9.5px;
            font-weight: 700;
            padding: 4px 10px;
            border-radius: 6px;
          }
          .footer-section {
            border-top: 2px solid ${isDark ? '#1e3a8a' : '#e2e8f0'};
            padding-top: 14px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .footer-info {
            font-size: 10px;
            color: ${isDark ? '#94a3b8' : '#64748b'};
            line-height: 1.4;
          }
          .footer-strong {
            font-weight: 800;
            color: ${isDark ? '#f8fafc' : '#0f172a'};
          }
          .footer-badge {
            text-align: right;
            font-size: 9px;
            color: ${isDark ? '#64748b' : '#94a3b8'};
            font-weight: 600;
          }
        </style>
      </head>
      <body>
        <div class="poster-container">
          <div class="header">
            <div class="brand">
              <h1 class="brand-title">${buildingName}</h1>
              <div class="brand-sub">Building Management & Security Support</div>
            </div>
            <div class="badge-live">Layanan Pengaduan Cepat</div>
          </div>

          <div class="hero-section">
            <h2 class="hero-title">Ada Masukan & Keluhan? <br><span>Scan & Kami Tuntaskan Segera</span></h2>
            <p class="hero-desc">
              Sampaikan kendala fasilitas, kebersihan, keamanan, atau kenyamanan di lingkungan gedung tanpa perlu login akun.
            </p>
          </div>

          <div class="qr-wrapper">
            <div class="qr-frame">
              <img src="${qrApiUrl}" class="qr-img" alt="QR Code Komplain" />
              <div class="qr-caption">Arahkan Kamera HP di Sini</div>
              <div class="qr-subtext">Otomatis membuka Form Tiket Publik CMMDIGITAL</div>
            </div>
          </div>

          <div class="steps-grid">
            <div class="step-card">
              <div class="step-num">1</div>
              <div class="step-title">Scan Barcode</div>
              <div class="step-desc">Gunakan kamera smartphone tanpa unduh aplikasi baru.</div>
            </div>
            <div class="step-card">
              <div class="step-num">2</div>
              <div class="step-title">Isi Kendala & Foto</div>
              <div class="step-desc">Tulis lokasi lantai & keluhan. Lampirkan foto bila diperlukan.</div>
            </div>
            <div class="step-card">
              <div class="step-num">3</div>
              <div class="step-title">Respon Petugas</div>
              <div class="step-desc">Tim Engineering, Kebersihan, atau Keamanan langsung merapat.</div>
            </div>
          </div>

          <div style="text-align:center;">
            <div style="font-size: 10px; font-weight: 700; color:${isDark ? '#64748b' : '#94a3b8'}; margin-bottom: 4px; text-transform:uppercase; letter-spacing:0.8px;">
              Layanan Penanganan Meliputi:
            </div>
            <div class="category-pills">
              <div class="pill">❄️ AC & Kelistrikan</div>
              <div class="pill">🧹 Kebersihan & Toilet</div>
              <div class="pill">🛡️ Keamanan & Satpam</div>
              <div class="pill">🚗 Parkir & Akses Lift</div>
              <div class="pill">💡 Fasilitas Tenant</div>
              <div class="pill">💬 Kritik & Saran</div>
            </div>
          </div>

          <div class="footer-section">
            <div class="footer-info">
              <div class="footer-strong">${hotline}</div>
              <div>Gedung CMMDIGITAL • Layanan Siaga 24 Jam</div>
            </div>
            <div class="footer-badge">
              <div>SISTEM TIKET RESMI</div>
              <div>CMD SYSTEM</div>
            </div>
          </div>
        </div>
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 500);
          };
        </script>
      </body>
      </html>
    `;

    printWin.document.open();
    printWin.document.write(htmlContent);
    printWin.document.close();
  };

  const isDark = themeMode === 'dark';

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      background: 'rgba(0,0,0,0.85)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem'
    }}>
      <div style={{
        background: 'var(--bg-glass-card, #0f172a)',
        border: '1px solid var(--border-glass, rgba(255,255,255,0.1))',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '850px',
        maxHeight: '92vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.7)',
        overflow: 'hidden'
      }}>
        {/* Header Modal */}
        <div style={{
          padding: '1rem 1.25rem',
          borderBottom: '1px solid var(--border-glass, rgba(255,255,255,0.1))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(255,255,255,0.02)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{
              background: 'linear-gradient(135deg, #0284c7, #38bdf8)',
              color: '#fff',
              padding: '0.45rem',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center'
            }}>
              <Printer size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Desain Poster & Standee Akrilik Komplain CMMDIGITAL
              </h3>
              <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Siap cetak format A4/A5 untuk dipajang di Lobby, Meja Resepsionis, Koridor Tenant & Area Publik
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn-icon" style={{ borderRadius: '50%', padding: '0.4rem' }}>
            <X size={18} />
          </button>
        </div>

        {/* Body Modal with Controls & Live Preview */}
        <div style={{
          display: 'flex',
          flex: 1,
          overflow: 'hidden',
          flexDirection: window.innerWidth < 768 ? 'column' : 'row'
        }}>
          {/* Controls Panel */}
          <div style={{
            width: window.innerWidth < 768 ? '100%' : '300px',
            borderRight: '1px solid var(--border-glass, rgba(255,255,255,0.1))',
            padding: '1rem',
            overflowY: 'auto',
            background: 'rgba(0,0,0,0.15)'
          }}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem' }}>
                PILIH TEMA POSTER
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
                <button
                  type="button"
                  onClick={() => setThemeMode('light')}
                  style={{
                    padding: '0.5rem',
                    borderRadius: '8px',
                    border: themeMode === 'light' ? '2px solid #0284c7' : '1px solid var(--border-glass)',
                    background: themeMode === 'light' ? '#ffffff' : 'rgba(255,255,255,0.05)',
                    color: themeMode === 'light' ? '#0f172a' : 'var(--text-secondary)',
                    fontWeight: 700,
                    fontSize: '0.72rem',
                    cursor: 'pointer'
                  }}
                >
                  📄 Light (Kertas/A4)
                </button>
                <button
                  type="button"
                  onClick={() => setThemeMode('dark')}
                  style={{
                    padding: '0.5rem',
                    borderRadius: '8px',
                    border: themeMode === 'dark' ? '2px solid #38bdf8' : '1px solid var(--border-glass)',
                    background: themeMode === 'dark' ? '#081021' : 'rgba(255,255,255,0.05)',
                    color: themeMode === 'dark' ? '#38bdf8' : 'var(--text-secondary)',
                    fontWeight: 700,
                    fontSize: '0.72rem',
                    cursor: 'pointer'
                  }}
                >
                  🌌 Navy Gold (Akrilik)
                </button>
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem' }}>
                UKURAN KERTAS
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
                <button
                  type="button"
                  onClick={() => setPaperSize('a4')}
                  style={{
                    padding: '0.45rem',
                    borderRadius: '8px',
                    border: paperSize === 'a4' ? '2px solid #0284c7' : '1px solid var(--border-glass)',
                    background: paperSize === 'a4' ? 'rgba(2, 132, 199, 0.15)' : 'transparent',
                    color: paperSize === 'a4' ? '#38bdf8' : 'var(--text-secondary)',
                    fontWeight: 700,
                    fontSize: '0.72rem'
                  }}
                >
                  A4 (Dinding/Papan)
                </button>
                <button
                  type="button"
                  onClick={() => setPaperSize('a5')}
                  style={{
                    padding: '0.45rem',
                    borderRadius: '8px',
                    border: paperSize === 'a5' ? '2px solid #0284c7' : '1px solid var(--border-glass)',
                    background: paperSize === 'a5' ? 'rgba(2, 132, 199, 0.15)' : 'transparent',
                    color: paperSize === 'a5' ? '#38bdf8' : 'var(--text-secondary)',
                    fontWeight: 700,
                    fontSize: '0.72rem'
                  }}
                >
                  A5 (Standee Meja)
                </button>
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                NAMA GEDUNG
              </label>
              <input
                type="text"
                value={buildingName}
                onChange={e => {
                  setBuildingName(e.target.value);
                  localStorage.setItem('cmdigital_poster_bldg', e.target.value);
                }}
                className="modern-input"
                style={{ fontSize: '0.75rem', width: '100%', padding: '0.4rem 0.6rem' }}
              />
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                INFO KONTAK / HELPDESK FOOTER
              </label>
              <input
                type="text"
                value={hotline}
                onChange={e => {
                  setHotline(e.target.value);
                  localStorage.setItem('cmdigital_poster_hotline', e.target.value);
                }}
                className="modern-input"
                style={{ fontSize: '0.75rem', width: '100%', padding: '0.4rem 0.6rem' }}
              />
            </div>

            <div style={{
              background: 'rgba(56, 189, 248, 0.08)',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              borderRadius: '8px',
              padding: '0.65rem',
              fontSize: '0.68rem',
              color: 'var(--text-secondary)',
              lineHeight: '1.45',
              marginBottom: '1rem'
            }}>
              💡 <strong>Tips Cetak:</strong> Gunakan opsi kertas tebal / Art Paper 260gr atau masukkan ke dalam bingkai standing akrilik transparan (A4/A5) agar terlihat mewah di meja resepsionis atau lift.
            </div>

            <button
              onClick={handlePrint}
              className="btn-primary"
              style={{
                width: '100%',
                padding: '0.65rem 1rem',
                fontSize: '0.82rem',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem'
              }}
            >
              <Printer size={16} /> Cetak / Unduh PDF Poster
            </button>
          </div>

          {/* Poster Live Preview Frame */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '1.25rem',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-start',
            background: 'rgba(0,0,0,0.4)'
          }}>
            <div style={{
              width: '100%',
              maxWidth: '440px',
              aspectRatio: '1 / 1.414',
              background: isDark ? 'linear-gradient(180deg, #09132b 0%, #060b17 100%)' : '#ffffff',
              color: isDark ? '#f8fafc' : '#0f172a',
              borderRadius: '12px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              border: isDark ? '2px solid #1e3a8a' : '1px solid #e2e8f0',
              position: 'relative'
            }}>
              {/* Header Preview */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `2px solid ${isDark ? '#1e3a8a' : '#e2e8f0'}`, paddingBottom: '0.5rem' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 900, letterSpacing: '1px', color: isDark ? '#38bdf8' : '#0284c7' }}>
                    {buildingName}
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.55rem', fontWeight: 700, color: isDark ? '#94a3b8' : '#64748b' }}>
                    BUILDING MANAGEMENT & SECURITY
                  </p>
                </div>
                <div style={{
                  background: isDark ? 'rgba(56, 189, 248, 0.15)' : '#e0f2fe',
                  color: isDark ? '#38bdf8' : '#0369a1',
                  border: `1px solid ${isDark ? '#0284c7' : '#bae6fd'}`,
                  borderRadius: '999px',
                  padding: '0.2rem 0.5rem',
                  fontSize: '0.55rem',
                  fontWeight: 800
                }}>
                  Layanan Cepat
                </div>
              </div>

              {/* Headline Preview */}
              <div style={{ textAlign: 'center', margin: '0.5rem 0' }}>
                <h3 style={{ margin: '0 0 0.2rem 0', fontSize: '1.05rem', fontWeight: 900, lineHeight: 1.2 }}>
                  Ada Masukan & Keluhan? <br />
                  <span style={{ color: isDark ? '#38bdf8' : '#0284c7' }}>Scan & Kami Tuntaskan Segera</span>
                </h3>
                <p style={{ margin: 0, fontSize: '0.62rem', color: isDark ? '#94a3b8' : '#64748b', lineHeight: 1.3 }}>
                  Sampaikan kendala fasilitas, AC, kebersihan, atau keamanan tanpa perlu login akun.
                </p>
              </div>

              {/* QR Center Preview */}
              <div style={{ textAlign: 'center', margin: '0.25rem 0' }}>
                <div style={{
                  background: '#ffffff',
                  padding: '0.6rem',
                  borderRadius: '12px',
                  display: 'inline-block',
                  border: `2px solid ${isDark ? '#38bdf8' : '#0284c7'}`,
                  boxShadow: '0 6px 15px rgba(0,0,0,0.1)'
                }}>
                  <img src={qrApiUrl} alt="QR Code" style={{ width: '130px', height: '130px', display: 'block' }} />
                  <div style={{ marginTop: '0.3rem', fontSize: '0.62rem', fontWeight: 900, color: '#0f172a', letterSpacing: '0.8px' }}>
                    ARAHKAN KAMERA HP
                  </div>
                  <div style={{ fontSize: '0.48rem', color: '#64748b' }}>
                    Buka Form Pengaduan CMMDIGITAL
                  </div>
                </div>
              </div>

              {/* 3 Steps Guide Preview */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.4rem', margin: '0.4rem 0' }}>
                <div style={{ background: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc', padding: '0.4rem 0.2rem', borderRadius: '6px', textAlign: 'center', border: `1px solid ${isDark ? '#1e293b' : '#e2e8f0'}` }}>
                  <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#0284c7', color: '#fff', fontSize: '0.55rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.2rem auto' }}>1</div>
                  <div style={{ fontSize: '0.55rem', fontWeight: 800 }}>Scan Barcode</div>
                  <div style={{ fontSize: '0.45rem', color: isDark ? '#94a3b8' : '#64748b' }}>Buka kamera HP</div>
                </div>
                <div style={{ background: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc', padding: '0.4rem 0.2rem', borderRadius: '6px', textAlign: 'center', border: `1px solid ${isDark ? '#1e293b' : '#e2e8f0'}` }}>
                  <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#0284c7', color: '#fff', fontSize: '0.55rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.2rem auto' }}>2</div>
                  <div style={{ fontSize: '0.55rem', fontWeight: 800 }}>Isi Keluhan</div>
                  <div style={{ fontSize: '0.45rem', color: isDark ? '#94a3b8' : '#64748b' }}>Tulis lantai & foto</div>
                </div>
                <div style={{ background: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc', padding: '0.4rem 0.2rem', borderRadius: '6px', textAlign: 'center', border: `1px solid ${isDark ? '#1e293b' : '#e2e8f0'}` }}>
                  <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#0284c7', color: '#fff', fontSize: '0.55rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.2rem auto' }}>3</div>
                  <div style={{ fontSize: '0.55rem', fontWeight: 800 }}>Respon Cepat</div>
                  <div style={{ fontSize: '0.45rem', color: isDark ? '#94a3b8' : '#64748b' }}>Tim sigap tangani</div>
                </div>
              </div>

              {/* Service Badges */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '0.25rem', flexWrap: 'wrap', margin: '0.2rem 0' }}>
                <span style={{ fontSize: '0.48rem', background: isDark ? '#0f172a' : '#f1f5f9', border: `1px solid ${isDark ? '#334155' : '#cbd5e1'}`, padding: '0.15rem 0.35rem', borderRadius: '4px' }}>❄️ AC & Fasilitas</span>
                <span style={{ fontSize: '0.48rem', background: isDark ? '#0f172a' : '#f1f5f9', border: `1px solid ${isDark ? '#334155' : '#cbd5e1'}`, padding: '0.15rem 0.35rem', borderRadius: '4px' }}>🧹 Kebersihan</span>
                <span style={{ fontSize: '0.48rem', background: isDark ? '#0f172a' : '#f1f5f9', border: `1px solid ${isDark ? '#334155' : '#cbd5e1'}`, padding: '0.15rem 0.35rem', borderRadius: '4px' }}>🛡️ Keamanan</span>
                <span style={{ fontSize: '0.48rem', background: isDark ? '#0f172a' : '#f1f5f9', border: `1px solid ${isDark ? '#334155' : '#cbd5e1'}`, padding: '0.15rem 0.35rem', borderRadius: '4px' }}>💬 Kritik & Saran</span>
              </div>

              {/* Footer Preview */}
              <div style={{ borderTop: `1px solid ${isDark ? '#1e3a8a' : '#e2e8f0'}`, paddingTop: '0.4rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.55rem', fontWeight: 800 }}>{hotline}</div>
                  <div style={{ fontSize: '0.48rem', color: isDark ? '#94a3b8' : '#64748b' }}>Gedung CMMDIGITAL</div>
                </div>
                <div style={{ fontSize: '0.48rem', fontWeight: 700, color: isDark ? '#38bdf8' : '#0284c7' }}>
                  SISTEM RESMI CMMDIGITAL
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
