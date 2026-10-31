import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import './utils/ripple.js'
import { initRipple } from './utils/ripple.js'
initRipple()

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0b0f19', color: '#f8fafc', fontFamily: 'Inter, sans-serif', flexDirection: 'column', gap: '1rem', padding: '2rem', textAlign: 'center' }}>
          <img src="logo.png" alt="CMMDIGITAL" className="logo-3d" style={{ width: '80px', opacity: 0.5 }} />
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Terjadi Kesalahan</h1>
          <p style={{ color: '#94a3b8', maxWidth: '400px' }}>Aplikasi mengalami error. Silakan refresh halaman.</p>
          <pre style={{ 
            color: '#ef4444', 
            background: '#1e293b', 
            padding: '1rem', 
            borderRadius: '8px', 
            overflow: 'auto', 
            maxWidth: '90vw', 
            maxHeight: '40vh',
            fontSize: '0.8rem', 
            textAlign: 'left',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all'
          }}>
            {this.state.error?.toString() || 'Unknown Error'}
            {'\n\n'}
            {this.state.error?.stack || ''}
          </pre>
          <button onClick={() => window.location.reload()} style={{ padding: '0.6rem 1.5rem', background: '#3b82f6', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer', fontWeight: 600 }}>
            Refresh Halaman
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Register Service Worker for PWA support with safe auto-update.
// Banner muncul saat ada versi baru; reload hanya setelah pengguna setuju,
// agar input/form yang sedang diisi tidak hilang.
if ('serviceWorker' in navigator) {
  let updateRequested = false;
  let refreshing = false;

  const showUpdateBanner = (registration) => {
    if (document.getElementById('cmdigital-update-banner')) return;
    const banner = document.createElement('div');
    banner.id = 'cmdigital-update-banner';
    banner.setAttribute('role', 'status');
    banner.style.cssText = [
      'position:fixed', 'left:12px', 'right:12px', 'bottom:12px', 'z-index:2147483647',
      'display:flex', 'align-items:center', 'justify-content:space-between', 'gap:12px',
      'padding:12px 14px', 'border-radius:12px',
      'background:#0f172a', 'color:#e2e8f0',
      'border:1px solid rgba(59,130,246,0.55)',
      'box-shadow:0 10px 30px rgba(0,0,0,0.45)',
      'font-family:system-ui,-apple-system,Segoe UI,sans-serif', 'font-size:13px', 'line-height:1.35'
    ].join(';');
    banner.innerHTML = '<span>Versi baru CMMDIGITAL tersedia. Muat ulang untuk memperbarui.</span>';
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = 'Muat Ulang';
    button.style.cssText = [
      'flex:0 0 auto', 'padding:8px 14px', 'border:none', 'border-radius:8px',
      'background:#3b82f6', 'color:#fff', 'font-weight:700', 'font-size:12px', 'cursor:pointer'
    ].join(';');
    button.addEventListener('click', () => {
      updateRequested = true;
      button.disabled = true;
      button.textContent = 'Memperbarui...';
      const waiting = registration.waiting;
      if (waiting) {
        waiting.postMessage({ type: 'SKIP_WAITING' });
      } else {
        window.location.reload();
      }
    });
    banner.appendChild(button);
    document.body.appendChild(banner);
  };

  const watchWorker = (registration) => {
    if (registration.waiting && navigator.serviceWorker.controller) {
      showUpdateBanner(registration);
    }
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (!newWorker) return;
      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          showUpdateBanner(registration);
        }
      });
    });
  };

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' })
      .then((registration) => {
        console.log('PWA ServiceWorker registered with scope:', registration.scope);
        watchWorker(registration);

        const checkForUpdate = () => {
          if (document.visibilityState === 'visible' && navigator.onLine) {
            registration.update().catch(() => {});
          }
        };
        // Cek versi baru saat fokus, saat kembali online, dan berkala.
        window.addEventListener('focus', checkForUpdate);
        window.addEventListener('online', checkForUpdate);
        document.addEventListener('visibilitychange', checkForUpdate);
        setInterval(checkForUpdate, 60 * 1000);
        checkForUpdate();
      })
      .catch((err) => console.warn('PWA ServiceWorker registration failed:', err));

    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!updateRequested || refreshing) return;
      refreshing = true;
      window.location.reload();
    });
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)

