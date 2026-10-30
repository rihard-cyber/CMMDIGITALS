import { useState, useEffect, useRef } from 'react';
import {
  LayoutDashboard,
  Target,
  FileSpreadsheet,
  ClipboardList,
  BookOpen,
  FileText,
  Menu,
  Smartphone,
  Fingerprint,
  Package
} from 'lucide-react';

export default function BottomNav({ className = '', currentTab, onNavClick, onToggleSidebar, user, isSidebarOpen }) {
  const [visible, setVisible] = useState(true);
  const lastScrollY = useRef(0);

  // Reset navbar visibility on tab change
  useEffect(() => {
    setVisible(true);
    lastScrollY.current = 0;
  }, [currentTab]);

  useEffect(() => {
    let ticking = false;
    const handleScroll = (e) => {
      const target = e.target;
      let currentScrollY = 0;
      let isNearBottom = false;

      if (target && target.scrollTop !== undefined && target !== document) {
        currentScrollY = target.scrollTop;
        if (target.scrollHeight && target.clientHeight) {
          isNearBottom = target.scrollHeight - target.scrollTop - target.clientHeight < 35;
        }
      } else {
        currentScrollY = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
        const scrollHeight = document.documentElement.scrollHeight || document.body.scrollHeight || 0;
        const clientHeight = window.innerHeight || 0;
        isNearBottom = scrollHeight - currentScrollY - clientHeight < 35;
      }

      if (!ticking) {
        window.requestAnimationFrame(() => {
          const delta = currentScrollY - lastScrollY.current;

          // 1. Always show when at the top (<= 15px) or near bottom
          if (currentScrollY <= 15 || isNearBottom) {
            setVisible(true);
          } 
          // 2. Sensitive directional detection (threshold 8px to filter out micro-jitters)
          else if (Math.abs(delta) > 8) {
            if (delta > 0 && currentScrollY > 40) {
              // User scrolling down -> hide to maximize reading view
              setVisible(false);
            } else if (delta < 0) {
              // User scrolling up -> immediately reveal navbar
              setVisible(true);
            }
          }
          lastScrollY.current = currentScrollY;
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { capture: true, passive: true });
    return () => window.removeEventListener('scroll', handleScroll, { capture: true });
  }, []);

  const isGuard = ['Danru', 'Wadanru', 'Anggota'].includes(user?.jabatan);
  const isGuest = user?.jabatan === 'Guest Viewer';

  const getItems = () => {
    if (isGuest) {
      return [
        { id: 'target-compliance', label: 'Target', icon: Target },
        { id: null, label: 'Menu', icon: Menu, isMenu: true },
      ];
    }
    if (isGuard) {
      return [
        { id: 'guard-simulator', label: 'Patroli', icon: Smartphone },
        { id: 'mutasi', label: 'Mutasi', icon: BookOpen },
        { id: 'absensi', label: 'Presensi', icon: Fingerprint, isCenter: true },
        { id: 'lapor', label: 'Lapor', icon: FileText },
        { id: null, label: 'Menu', icon: Menu, isMenu: true },
      ];
    }
    return [
      { id: 'dashboard', label: 'Beranda', icon: LayoutDashboard },
      { id: 'absensi', label: 'Absensi', icon: ClipboardList },
      { id: 'target-compliance', label: 'Target', icon: Target },
      { id: 'reports', label: 'Laporan', icon: FileSpreadsheet },
      { id: 'found-items', label: 'Temuan', icon: Package },
      { id: null, label: 'Menu', icon: Menu, isMenu: true },
    ];
  };

  const items = getItems();
  const isNavVisible = visible && !isSidebarOpen;

  return (
    <nav className={`bottom-nav ${className} ${isNavVisible ? '' : 'bottom-nav-hidden'}`.trim()}>
      {items.map((item) => {
        if (item.isMenu) {
          return (
            <button
              key="menu"
              className="bottom-nav-btn bottom-nav-menu"
              onClick={onToggleSidebar}
              aria-label="Buka Menu"
            >
              <Menu size={22} />
              <span>{item.label}</span>
            </button>
          );
        }
        const Icon = item.icon;
        if (item.isCenter) {
          return (
            <button
              key={item.id}
              className={`bottom-nav-btn bottom-nav-btn-center ${currentTab === item.id ? 'active' : ''}`}
              onClick={() => onNavClick(item.id)}
              aria-label={item.label}
              title={item.label}
            >
              <Icon size={28} />
            </button>
          );
        }
        return (
          <button
            key={item.id}
            className={`bottom-nav-btn ${currentTab === item.id ? 'active' : ''}`}
            onClick={() => onNavClick(item.id)}
          >
            <Icon size={22} />
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
