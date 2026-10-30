import React, { useState, useEffect, useCallback } from 'react';
import { Download, X, Smartphone, ArrowUpCircle } from 'lucide-react';
import { Capacitor } from '@capacitor/core';

const DISMISS_KEY = 'smpjdc_pwa_dismissed_until';
const SESSION_KEY = 'smpjdc_pwa_prompt_shown';
const DAY_MS = 24 * 60 * 60 * 1000;

function readDismissedUntil() {
  try {
    return Number(localStorage.getItem(DISMISS_KEY) || 0);
  } catch (e) {
    return 0;
  }
}

export default function PWAInstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [promptType, setPromptType] = useState('pwa'); // 'pwa' | 'ios'

  const rememberDismissal = useCallback((days = 30) => {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now() + days * DAY_MS));
      sessionStorage.setItem(SESSION_KEY, 'true');
    } catch (e) {}
  }, []);

  const openPrompt = useCallback((type) => {
    // Only one prompt per browser session, even though the component is
    // mounted both on the login screen and inside the main app shell.
    try {
      if (sessionStorage.getItem(SESSION_KEY) === 'true') return;
      sessionStorage.setItem(SESSION_KEY, 'true');
    } catch (e) {}
    setPromptType(type);
    setShowPrompt(true);
  }, []);

  useEffect(() => {
    // Never show anything inside the native Android/iOS app shell.
    if (Capacitor.isNativePlatform()) return;

    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;
    if (isStandalone) return;

    // Respect the persistent "Nanti saja" choice for 30 days.
    if (readDismissedUntil() > Date.now()) return;
    // Already shown once in this browser session.
    try {
      if (sessionStorage.getItem(SESSION_KEY) === 'true') return;
    } catch (e) {}

    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIos = /iphone|ipad|ipod/.test(userAgent);
    const isSafari = /safari/.test(userAgent) && !/crios|fxios|edgios/.test(userAgent);

    // iOS cannot fire beforeinstallprompt: show the short manual guide once.
    let iosTimer = null;
    if (isIos && isSafari) {
      iosTimer = setTimeout(() => openPrompt('ios'), 4000);
    }

    // Android Chrome and desktop browsers expose the native install flow.
    // We deliberately do NOT auto-download the APK: the browser prompt is
    // enough and the native app never shows a web install banner.
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Let the first screen paint before showing a small, dismissible card.
      setTimeout(() => openPrompt('pwa'), 1800);
    };

    const handleInstalled = () => {
      rememberDismissal(365);
      setShowPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleInstalled);

    return () => {
      if (iosTimer) clearTimeout(iosTimer);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, [openPrompt, rememberDismissal]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      handleDismiss();
      return;
    }

    setShowPrompt(false);
    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        rememberDismissal(365);
      } else {
        rememberDismissal(14);
      }
    } catch (e) {
      rememberDismissal(14);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    rememberDismissal(30);
  };

  if (!showPrompt) return null;

  return (
    <div className="pwa-prompt-overlay" role="dialog" aria-modal="false" aria-label="Pasang aplikasi SMPJDC">
      <div className="pwa-prompt-card">
        <div className="pwa-prompt-header">
          <div className="pwa-prompt-icon-container">
            <Smartphone className="pwa-icon-phone" />
            <Download className="pwa-icon-download" />
          </div>
          <button className="pwa-close-btn" onClick={handleDismiss} aria-label="Tutup">
            <X size={18} />
          </button>
        </div>

        <div className="pwa-prompt-body">
          {promptType === 'ios' ? (
            <>
              <h3>Pasang di Layar Utama</h3>
              <p>
                Tambahkan SMPJDC ke layar utama untuk akses patroli lebih cepat, tanpa membuka browser.
              </p>
              <div className="ios-instructions">
                <p className="ios-step">
                  <span className="step-num">1</span>
                  Ketuk tombol bagikan <ArrowUpCircle size={15} className="ios-step-icon" /> di Safari.
                </p>
                <p className="ios-step">
                  <span className="step-num">2</span>
                  Pilih <strong>Tambahkan ke Layar Utama</strong>.
                </p>
              </div>
            </>
          ) : (
            <>
              <h3>Pasang Aplikasi SMPJDC</h3>
              <p>
                Buka lebih cepat dari beranda, layar penuh, dan notifikasi patroli tetap aktif.
              </p>
            </>
          )}
        </div>

        <div className="pwa-prompt-footer">
          <button className="pwa-btn-dismiss" onClick={handleDismiss}>
            Nanti Saja
          </button>
          {promptType === 'ios' ? (
            <button className="pwa-btn-install" onClick={handleDismiss}>
              Saya Mengerti
            </button>
          ) : (
            <button className="pwa-btn-install" onClick={handleInstallClick}>
              Pasang Sekarang
            </button>
          )}
        </div>
      </div>

      <style>{`
        .pwa-prompt-overlay {
          position: fixed;
          bottom: 24px;
          right: 24px;
          z-index: 950;
          animation: pwaSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          width: 370px;
          max-width: calc(100vw - 32px);
        }

        .pwa-prompt-card {
          background: var(--bg-glass, rgba(15, 23, 42, 0.9));
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid var(--border-glass, rgba(255, 255, 255, 0.08));
          border-radius: 20px;
          padding: 1.1rem;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5),
                      inset 0 1px 1px rgba(255, 255, 255, 0.1);
          color: var(--text-primary, #f8fafc);
          display: flex;
          flex-direction: column;
          gap: 0.85rem;
        }

        .pwa-prompt-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .pwa-prompt-icon-container {
          position: relative;
          width: 42px;
          height: 42px;
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(147, 51, 234, 0.15));
          border: 1px solid var(--border-glass, rgba(255, 255, 255, 0.1));
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .pwa-icon-phone {
          color: var(--color-primary, #3b82f6);
          width: 21px;
          height: 21px;
        }

        .pwa-icon-download {
          position: absolute;
          bottom: 5px;
          right: 5px;
          color: #10b981;
          width: 14px;
          height: 14px;
          background: #0f172a;
          border-radius: 50%;
          padding: 1px;
        }

        .pwa-close-btn {
          background: rgba(255, 255, 255, 0.05);
          border: none;
          color: var(--text-muted, #94a3b8);
          cursor: pointer;
          width: 30px;
          height: 30px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .pwa-close-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          color: var(--text-primary, #f8fafc);
        }

        .pwa-prompt-body h3 {
          font-family: 'Outfit', sans-serif;
          font-size: 1.05rem;
          font-weight: 700;
          margin: 0 0 0.4rem 0;
          letter-spacing: -0.01em;
          color: var(--text-primary, #f8fafc);
        }

        .pwa-prompt-body p {
          font-family: 'Inter', sans-serif;
          font-size: 0.8rem;
          line-height: 1.45;
          margin: 0;
          color: var(--text-secondary, #cbd5e1);
        }

        .ios-instructions {
          margin-top: 0.7rem;
          padding: 0.7rem;
          background: rgba(255, 255, 255, 0.03);
          border: 1px dashed var(--border-glass, rgba(255, 255, 255, 0.1));
          border-radius: 10px;
          display: flex;
          flex-direction: column;
          gap: 0.45rem;
        }

        .ios-step {
          font-size: 0.75rem !important;
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
          color: var(--text-secondary, #94a3b8) !important;
          margin: 0 !important;
        }

        .ios-step-icon {
          display: inline;
          vertical-align: middle;
          color: var(--color-primary, #3b82f6);
          margin: 0 2px;
        }

        .step-num {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 16px;
          height: 16px;
          background: rgba(59, 130, 246, 0.2);
          border: 1px solid rgba(59, 130, 246, 0.3);
          border-radius: 50%;
          font-size: 0.7rem;
          font-weight: 700;
          color: var(--color-primary, #3b82f6);
          flex-shrink: 0;
          margin-top: 1px;
        }

        .pwa-prompt-footer {
          display: flex;
          justify-content: flex-end;
          gap: 0.6rem;
        }

        .pwa-btn-dismiss {
          font-family: 'Inter', sans-serif;
          font-size: 0.8rem;
          font-weight: 600;
          background: transparent;
          border: 1px solid var(--border-glass, rgba(255, 255, 255, 0.15));
          color: var(--text-secondary, #cbd5e1);
          padding: 0.55rem 0.875rem;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .pwa-btn-dismiss:hover {
          background: rgba(255, 255, 255, 0.05);
          color: var(--text-primary, #f8fafc);
          border-color: rgba(255, 255, 255, 0.25);
        }

        .pwa-btn-install {
          font-family: 'Inter', sans-serif;
          font-size: 0.8rem;
          font-weight: 700;
          background: linear-gradient(135deg, var(--color-primary, #2563eb), #1d4ed8);
          border: none;
          color: white;
          padding: 0.55rem 1rem;
          border-radius: 10px;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
          transition: all 0.2s;
        }

        .pwa-btn-install:hover {
          background: linear-gradient(135deg, #1d4ed8, #1e40af);
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(37, 99, 235, 0.4);
        }

        .pwa-btn-install:active {
          transform: translateY(0);
        }

        @keyframes pwaSlideUp {
          from {
            transform: translateY(24px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @media (max-width: 640px) {
          .pwa-prompt-overlay {
            left: 12px;
            right: 12px;
            bottom: calc(76px + env(safe-area-inset-bottom, 0px));
            width: auto;
            max-width: none;
          }

          .pwa-prompt-card {
            border-radius: 18px;
            padding: 1rem;
            gap: 0.7rem;
          }

          .pwa-prompt-footer {
            flex-direction: row-reverse;
          }

          .pwa-btn-dismiss,
          .pwa-btn-install {
            flex: 1 1 0;
            padding: 0.7rem 0.5rem;
            font-size: 0.8rem;
            text-align: center;
          }
        }
      `}</style>
    </div>
  );
}
