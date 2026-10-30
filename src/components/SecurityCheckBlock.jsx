import React, { useState, useEffect, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { Camera } from '@capacitor/camera';
import { Geolocation } from '@capacitor/geolocation';
import { 
  ShieldAlert, Camera as CameraIcon, MapPin, AlertTriangle, 
  CheckCircle2, XCircle, RefreshCw, Cpu, Fingerprint, Activity, Terminal
} from 'lucide-react';
import { 
  getGPSCoordinates, verifyGPSAntiFake, checkDeviceSecurity, 
  queryWebPermissions 
} from '../utils/security';

export default function SecurityCheckBlock({ onPassed, theme = 'dark' }) {
  const [checking, setChecking] = useState(true);
  const [logs, setLogs] = useState([]);
  const [status, setStatus] = useState({
    camera: 'checking', // 'checking' | 'granted' | 'denied'
    location: 'checking', // 'checking' | 'granted' | 'denied'
    antiFakeGps: 'checking', // 'checking' | 'granted' | 'denied'
    deviceSec: 'checking', // 'checking' | 'granted' | 'denied'
  });
  const [errorDetails, setErrorDetails] = useState([]);

  const addLog = useCallback((text) => {
    const time = new Date().toLocaleTimeString('id-ID', { hour12: false });
    setLogs(prev => [...prev.slice(-6), `[${time}] ${text}`]);
  }, []);

  const runVerification = useCallback(async (isRetry = false) => {
    setChecking(true);
    setErrorDetails([]);
    setLogs([]);
    addLog('>> MEMULAI VERIFIKASI KEAMANAN PERANGKAT...');
    
    let currentStatus = {
      camera: 'checking',
      location: 'checking',
      antiFakeGps: 'checking',
      deviceSec: 'checking'
    };
    setStatus({ ...currentStatus });

    // 1. Check Camera Permission
    let cameraOk = false;
    addLog('Mengecek izin Kamera real-time...');
    try {
      if (Capacitor.isNativePlatform()) {
        let camStatus = await Camera.checkPermissions();
        if (camStatus.camera !== 'granted') {
          addLog('Meminta izin kamera native...');
          camStatus = await Camera.requestPermissions();
        }
        cameraOk = camStatus.camera === 'granted';
      } else {
        const webPerms = await queryWebPermissions();
        if (webPerms.camera === 'granted') {
          cameraOk = true;
        } else {
          // Try to trigger camera prompt
          addLog('Meminta izin kamera browser...');
          try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (stream) {
              cameraOk = true;
              stream.getTracks().forEach(track => track.stop());
            }
          } catch (e) {
            cameraOk = false;
          }
        }
      }
    } catch (e) {
      console.error('Camera check failed:', e);
      cameraOk = false;
    }

    currentStatus.camera = cameraOk ? 'granted' : 'denied';
    setStatus({ ...currentStatus });
    if (cameraOk) {
      addLog('✓ Izin Kamera: DISETUJUI');
    } else {
      addLog('✗ Izin Kamera: DITOLAK');
    }

    // 2. Check Location Permission
    let locationOk = false;
    addLog('Mengecek izin Lokasi (GPS)...');
    try {
      if (Capacitor.isNativePlatform()) {
        let locStatus = await Geolocation.checkPermissions();
        if (locStatus.location !== 'granted') {
          addLog('Meminta izin lokasi native...');
          locStatus = await Geolocation.requestPermissions();
        }
        locationOk = locStatus.location === 'granted';
      } else {
        const webPerms = await queryWebPermissions();
        if (webPerms.geolocation === 'granted') {
          locationOk = true;
        } else {
          addLog('Meminta izin lokasi browser...');
          try {
            await new Promise((resolve, reject) => {
              navigator.geolocation.getCurrentPosition(resolve, reject, { 
                enableHighAccuracy: true, 
                timeout: 5000 
              });
            });
            locationOk = true;
          } catch (e) {
            locationOk = false;
          }
        }
      }
    } catch (e) {
      console.error('Location check failed:', e);
      locationOk = false;
    }

    currentStatus.location = locationOk ? 'granted' : 'denied';
    setStatus({ ...currentStatus });
    if (locationOk) {
      addLog('✓ Izin Lokasi: DISETUJUI');
    } else {
      addLog('✗ Izin Lokasi: DITOLAK');
    }

    // Stop and compile errors if permissions are not granted
    if (!cameraOk || !locationOk) {
      const errors = [];
      if (!cameraOk) errors.push('Akses Kamera ditolak. Aktifkan izin kamera di Pengaturan Aplikasi agar dapat mengambil foto presensi/laporan.');
      if (!locationOk) errors.push('Akses Lokasi ditolak. Aktifkan izin lokasi (Akurasi Tinggi/GPS) agar koordinat patroli Anda dapat diverifikasi.');
      setErrorDetails(errors);
      setChecking(false);
      addLog('>> VERIFIKASI GAGAL: Harap setujui semua izin yang diperlukan.');
      return;
    }

    // 3. Check Anti-Fake GPS (Genuine Coordinates Verification)
    addLog('Mengambil koordinat GPS real-time...');
    const coords = await getGPSCoordinates();
    let antiFakeOk = true;
    let antiFakeReason = '';

    if (coords) {
      addLog(`Menguji keaslian koordinat (Lat: ${coords.latitude.toFixed(4)}, Lng: ${coords.longitude.toFixed(4)})...`);
      const gpsCheck = verifyGPSAntiFake(coords);
      antiFakeOk = gpsCheck.secure;
      antiFakeReason = gpsCheck.reason;
    } else {
      // Sinyal GPS satelit terhalang gedung/basement (kondisi fisik normal di gedung)
      antiFakeOk = true;
      antiFakeReason = 'Sinyal satelit GPS indoor/lemah (Toleransi aktif)';
      addLog('⚠️ Sinyal satelit GPS indoor/lemah (Mode toleransi aktif)');
    }

    currentStatus.antiFakeGps = antiFakeOk ? 'granted' : 'denied';
    setStatus({ ...currentStatus });
    if (antiFakeOk) {
      addLog('✓ Validasi GPS: AMAN' + (coords ? ' (Lokasi fisik terdeteksi)' : ' (Toleransi indoor aktif)'));
    } else {
      addLog(`✗ Validasi GPS: ${antiFakeReason.toUpperCase()}`);
    }

    // 4. Check Device Security (Developer Options on Android)
    addLog('Memeriksa integritas perangkat...');
    const secCheck = await checkDeviceSecurity();
    const deviceOk = !secCheck.developerOptionsEnabled;

    currentStatus.deviceSec = deviceOk ? 'granted' : 'denied';
    setStatus({ ...currentStatus });
    if (deviceOk) {
      addLog('✓ Integritas Perangkat: AMAN (Opsi pengembang nonaktif)');
    } else {
      addLog('✗ Perangkat berisiko tinggi: OPSI PENGEMBANG/ADB AKTIF');
    }

    // Compile final errors
    const errors = [];
    if (!antiFakeOk) {
      errors.push(`Deteksi Fake GPS: ${antiFakeReason}. Harap matikan aplikasi pembuat lokasi palsu dan pastikan Anda menggunakan GPS fisik perangkat.`);
    }
    if (!deviceOk) {
      errors.push('Opsi Pengembang Aktif: Harap nonaktifkan "Developer Options" atau "Opsi Pengembang" di Pengaturan HP Anda untuk mencegah manipulasi sistem.');
    }

    setErrorDetails(errors);
    setChecking(false);

    if (errors.length === 0) {
      addLog('>> VERIFIKASI SUKSES! MENGALIHKAN KE APLIKASI...');
      setTimeout(() => {
        onPassed(false);
      }, 1000);
    } else {
      addLog('>> VERIFIKASI GAGAL: Perangkat tidak memenuhi standar keamanan patroli.');
    }
  }, [addLog, onPassed]);

  useEffect(() => {
    runVerification();
  }, []);

  const hasErrors = errorDetails.length > 0 || Object.values(status).includes('denied');

  return (
    <div className={`security-shield-overlay theme-${theme}`}>
      <style>{`
        .security-shield-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: radial-gradient(circle at center, #0b1329 0%, #020617 100%);
          z-index: 999999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1.5rem;
          color: #f8fafc;
          font-family: 'Inter', sans-serif;
          overflow-y: auto;
        }
        
        .security-shield-card {
          background: rgba(15, 23, 42, 0.45);
          backdrop-filter: blur(25px);
          -webkit-backdrop-filter: blur(25px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: 0 24px 60px rgba(0, 0, 0, 0.7), 
                      inset 0 1px 1px rgba(255, 255, 255, 0.1);
          border-radius: 24px;
          width: 480px;
          max-width: 100%;
          padding: 2rem;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          position: relative;
          overflow: hidden;
        }

        .security-shield-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 200%;
          height: 100%;
          background: linear-gradient(
            90deg, 
            transparent 0%, 
            rgba(59, 130, 246, 0.03) 50%, 
            transparent 100%
          );
          animation: laserScan 6s linear infinite;
          pointer-events: none;
        }

        @keyframes laserScan {
          0% { transform: translateX(-100%) rotate(0deg); }
          100% { transform: translateX(100%) rotate(0deg); }
        }

        .shield-header {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 0.75rem;
        }

        .shield-icon-container {
          position: relative;
          width: 80px;
          height: 80px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: rgba(59, 130, 246, 0.05);
          border: 1px solid rgba(59, 130, 246, 0.15);
          transition: all 0.5s;
        }

        .shield-icon-container.scanning {
          border-color: #3b82f6;
          box-shadow: 0 0 20px rgba(59, 130, 246, 0.25);
          animation: pulseShield 2s infinite ease-in-out;
        }

        .shield-icon-container.failed {
          border-color: #ef4444;
          box-shadow: 0 0 25px rgba(239, 68, 68, 0.3);
          background: rgba(239, 68, 68, 0.05);
        }

        .shield-icon-container.passed {
          border-color: #10b981;
          box-shadow: 0 0 25px rgba(16, 185, 129, 0.3);
          background: rgba(16, 185, 129, 0.05);
        }

        @keyframes pulseShield {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }

        .radar-ring {
          position: absolute;
          border: 2px dashed rgba(59, 130, 246, 0.3);
          width: 110px;
          height: 110px;
          border-radius: 50%;
          animation: spinRadar 10s linear infinite;
        }

        .failed .radar-ring {
          border-color: rgba(239, 68, 68, 0.2);
          animation: none;
        }

        .passed .radar-ring {
          border-color: rgba(16, 185, 129, 0.2);
          animation: none;
        }

        @keyframes spinRadar {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .shield-title {
          font-family: 'Outfit', sans-serif;
          font-size: 1.35rem;
          font-weight: 900;
          letter-spacing: 0.05em;
          color: #f8fafc;
          margin: 0;
          text-transform: uppercase;
        }

        .shield-subtitle {
          font-size: 0.75rem;
          letter-spacing: 0.2em;
          color: #3b82f6;
          font-weight: 700;
          margin-top: -0.25rem;
        }

        .shield-failed-subtitle {
          font-size: 0.75rem;
          letter-spacing: 0.2em;
          color: #ef4444;
          font-weight: 700;
          margin-top: -0.25rem;
        }

        .check-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          padding: 0.25rem 0;
        }

        .check-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.85rem 1.1rem;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.04);
          border-radius: 14px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .check-item:hover {
          background: rgba(255, 255, 255, 0.04);
          border-color: rgba(255, 255, 255, 0.08);
        }

        .check-left {
          display: flex;
          align-items: center;
          gap: 0.85rem;
        }

        .check-icon-wrap {
          color: #94a3b8;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .check-item.item-checking .check-icon-wrap {
          color: #3b82f6;
        }

        .check-item.item-granted .check-icon-wrap {
          color: #10b981;
        }

        .check-item.item-denied .check-icon-wrap {
          color: #ef4444;
        }

        .check-name {
          font-size: 0.85rem;
          font-weight: 600;
          color: #cbd5e1;
        }

        .check-item.item-granted .check-name {
          color: #f8fafc;
        }

        .check-status {
          font-size: 0.75rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 0.35rem;
        }

        .status-checking {
          color: #3b82f6;
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .status-granted {
          color: #10b981;
        }

        .status-denied {
          color: #ef4444;
        }

        .spin-icon {
          animation: spin 1.5s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        /* Console styling */
        .security-console {
          background: rgba(0, 0, 0, 0.35);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          padding: 0.75rem 1rem;
          font-family: 'Consolas', 'Courier New', monospace;
          font-size: 0.7rem;
          color: #10b981;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          min-height: 85px;
          text-align: left;
        }

        .console-header-row {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          color: #64748b;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          padding-bottom: 0.3rem;
          margin-bottom: 0.3rem;
          font-weight: 700;
        }

        .console-line {
          margin: 0;
          opacity: 0.85;
          letter-spacing: 0.02em;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* Error box styling */
        .error-remediation-box {
          background: rgba(239, 68, 68, 0.06);
          border: 1px dashed rgba(239, 68, 68, 0.25);
          border-radius: 14px;
          padding: 1rem;
          text-align: left;
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
        }

        .error-box-title {
          font-size: 0.8rem;
          font-weight: 800;
          color: #ef4444;
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }

        .error-box-list {
          margin: 0;
          padding-left: 1rem;
          font-size: 0.75rem;
          color: #cbd5e1;
          line-height: 1.45;
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }

        .btn-check-again {
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
          border: none;
          color: white;
          padding: 0.9rem 1.5rem;
          border-radius: 14px;
          font-size: 0.85rem;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          box-shadow: 0 4px 20px rgba(37, 99, 235, 0.35);
          transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        .btn-check-again:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 24px rgba(37, 99, 235, 0.45);
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
        }

        .btn-check-again:active {
          transform: translateY(0);
        }

        .btn-check-again:disabled {
          background: #334155;
          color: #64748b;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }
      `}</style>

      <div className="security-shield-card">
        {/* Header Block */}
        <div className="shield-header">
          <div className={`shield-icon-container ${
            checking ? 'scanning' : hasErrors ? 'failed' : 'passed'
          }`}>
            <div className="radar-ring"></div>
            {hasErrors ? (
              <ShieldAlert size={34} className="text-danger" />
            ) : !checking ? (
              <CheckCircle2 size={34} className="text-success" />
            ) : (
              <Fingerprint size={34} className="text-primary" />
            )}
          </div>
          <div style={{ marginTop: '1.25rem' }}>
            <h2 className="shield-title">Verifikasi Keamanan</h2>
            <p className={hasErrors ? 'shield-failed-subtitle' : 'shield-subtitle'}>
              {hasErrors ? 'Akses Perangkat Diblokir' : 'SMPJDC Core Security'}
            </p>
          </div>
        </div>

        {/* Console logs */}
        <div className="security-console">
          <div className="console-header-row">
            <Terminal size={11} />
            <span>SECURE_BOOT_CONSOLE v2.0</span>
          </div>
          {logs.length === 0 && <p className="console-line">Ready.</p>}
          {logs.map((log, idx) => (
            <p key={idx} className="console-line">{log}</p>
          ))}
        </div>

        {/* Security Checklist */}
        <div className="check-list">
          {/* CAMERA CHECK */}
          <div className={`check-item item-${status.camera}`}>
            <div className="check-left">
              <div className="check-icon-wrap">
                <CameraIcon size={16} />
              </div>
              <span className="check-name">Izin Kamera Real-time</span>
            </div>
            <div className="check-status">
              {status.camera === 'checking' && (
                <span className="status-checking">
                  <RefreshCw size={12} className="spin-icon" /> Memeriksa
                </span>
              )}
              {status.camera === 'granted' && (
                <span className="status-granted">✓ Diizinkan</span>
              )}
              {status.camera === 'denied' && (
                <span className="status-denied">✗ Ditolak</span>
              )}
            </div>
          </div>

          {/* GEOLOCATION CHECK */}
          <div className={`check-item item-${status.location}`}>
            <div className="check-left">
              <div className="check-icon-wrap">
                <MapPin size={16} />
              </div>
              <span className="check-name">Izin Lokasi Real-time</span>
            </div>
            <div className="check-status">
              {status.location === 'checking' && (
                <span className="status-checking">
                  <RefreshCw size={12} className="spin-icon" /> Memeriksa
                </span>
              )}
              {status.location === 'granted' && (
                <span className="status-granted">✓ Diizinkan</span>
              )}
              {status.location === 'denied' && (
                <span className="status-denied">✗ Ditolak</span>
              )}
            </div>
          </div>

          {/* MOCK GPS CHECK */}
          <div className={`check-item item-${status.antiFakeGps}`}>
            <div className="check-left">
              <div className="check-icon-wrap">
                <Activity size={16} />
              </div>
              <span className="check-name">Integrasi Anti-Fake GPS</span>
            </div>
            <div className="check-status">
              {status.antiFakeGps === 'checking' && (
                <span className="status-checking">
                  <RefreshCw size={12} className="spin-icon" /> Memeriksa
                </span>
              )}
              {status.antiFakeGps === 'granted' && (
                <span className="status-granted">✓ Aman</span>
              )}
              {status.antiFakeGps === 'denied' && (
                <span className="status-denied">✗ Terindikasi Mock</span>
              )}
            </div>
          </div>

          {/* DEVICE INTEGRITY (DEVELOPER OPTIONS) CHECK */}
          <div className={`check-item item-${status.deviceSec}`}>
            <div className="check-left">
              <div className="check-icon-wrap">
                <Cpu size={16} />
              </div>
              <span className="check-name">Integritas Perangkat Android</span>
            </div>
            <div className="check-status">
              {status.deviceSec === 'checking' && (
                <span className="status-checking">
                  <RefreshCw size={12} className="spin-icon" /> Memeriksa
                </span>
              )}
              {status.deviceSec === 'granted' && (
                <span className="status-granted">✓ Aman</span>
              )}
              {status.deviceSec === 'denied' && (
                <span className="status-denied">✗ Risiko Tinggi</span>
              )}
            </div>
          </div>
        </div>

        {/* Error remediation box */}
        {hasErrors && (
          <div className="error-remediation-box">
            <div className="error-box-title">
              <AlertTriangle size={15} />
              <span>Instruksi Penyelesaian:</span>
            </div>
            <ul className="error-box-list">
              {errorDetails.map((err, idx) => (
                <li key={idx}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Action Button */}
        {hasErrors && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', width: '100%' }}>
            <button 
              onClick={() => runVerification(true)} 
              disabled={checking}
              className="btn-check-again animate-pulse"
            >
              {checking ? (
                <>
                  <RefreshCw size={15} className="spin-icon" />
                  <span>Memproses...</span>
                </>
              ) : (
                <>
                  <RefreshCw size={15} />
                  <span>Cek Ulang Keamanan</span>
                </>
              )}
            </button>

            {/* Desktop / Management fallback bypass */}
            {!Capacitor.isNativePlatform() && (
              <button
                type="button"
                onClick={() => {
                  addLog('>> MODE PENGELOLA / DESKTOP DIAKTIFKAN');
                  onPassed(true);
                }}
                className="btn-desktop-bypass"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#94a3b8',
                  padding: '0.65rem 1rem',
                  borderRadius: '12px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                  transition: 'all 0.2s ease'
                }}
              >
                <Terminal size={14} />
                <span>Lanjutkan ke Dashboard (Mode Pengelola / PC)</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
