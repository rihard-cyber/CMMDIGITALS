import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar, Users, MapPin, Clock, CheckCircle2, UserCheck, RefreshCw, 
  ClipboardList, HelpCircle, MessageSquare, Phone, AlertTriangle, Check, 
  User, ExternalLink, Shield, Activity, Edit2, Save, X, BookOpen, Search,
  FileText, ArrowLeft, ChevronRight
} from 'lucide-react';
import { SHIFT_CODES, getRoster, getYearMonth } from '../data/rosterData';
import { exportTableToPdf, formatDateForFile, formatDateOnlyId } from '../utils/exportPdf';
import { hapticLight, hapticSuccess } from '../utils/haptics';

export default function AbsensiRegu({ 
  users, 
  areas,
  posList = [],
  attendanceLogs, 
  onAddAttendance,
  currentUser,
  onUpdateUser,
  reports = []
}) {
  const todayStr = new Date().toISOString().split('T')[0];
  
  const [hari, setHari] = useState(() => {
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    return days[new Date().getDay()];
  });
  
  // Default to currentUser's regu if available, otherwise Regu A
  const [selectedRegu, setSelectedRegu] = useState(() => {
    return currentUser?.regu || 'Regu A';
  });
  
  const [selectedShift, setSelectedShift] = useState('P'); // 'P' | 'S' | 'M' | 'Md' etc
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'form' | 'history' | 'roster-daily' | 'lemburan'
  const [mobileView, setMobileView] = useState(() => (typeof window !== 'undefined' && window.innerWidth < 768 ? 'menu' : 'content'));
  const [selectedLemburMonth, setSelectedLemburMonth] = useState(() => getYearMonth());
  const [memberSearch, setMemberSearch] = useState('');
  const [selectedAddMemberId, setSelectedAddMemberId] = useState('');

  const SUBTABS = [
    { 
      id: 'roster-daily', 
      icon: <BookOpen size={18} />, 
      title: 'Absensi Roster', 
      short: 'Roster',
      sub: 'Jadwal Otomatis',
      color: '#00f0ff'
    },
    { 
      id: 'dashboard',    
      icon: <Activity size={18} />,     
      title: 'Dashboard Regu', 
      short: 'Dashboard',
      sub: 'Live Monitoring',
      color: '#39ff14'
    },
    { 
      id: 'form',         
      icon: <ClipboardList size={18} />, 
      title: 'Form Manual', 
      short: 'Form',
      sub: 'Plotting & Jaga',
      color: '#ffb700'
    },
    { 
      id: 'history',      
      icon: <UserCheck size={18} />,     
      title: 'Histori Absensi', 
      short: 'Histori',
      sub: 'Arsip Log',
      color: '#3b82f6'
    },
    { 
      id: 'lemburan',     
      icon: <Clock size={18} />,         
      title: 'Rekap Lemburan', 
      short: 'Lembur',
      sub: 'Overtime & Backup',
      color: '#a855f7'
    }
  ];
  const activeTabMeta = SUBTABS.find(t => t.id === activeTab) || SUBTABS[1];

  const handleSelectTab = (tabId) => {
    hapticLight();
    setActiveTab(tabId);
    setMobileView('content');
    setTimeout(() => {
      const el = document.getElementById('absensi-active-tab-container');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 60);
  };
  
  // For phone number editing
  const [phoneInputs, setPhoneInputs] = useState({});
  const [editingPhoneId, setEditingPhoneId] = useState(null);
  const [selectedAuditLog, setSelectedAuditLog] = useState(null);

  const handleShowAudit = (memberId) => {
    const member = users.find(u => String(u.id) === String(memberId));
    if (!member) return;
    
    // Find check-in details for today
    let attRow = null;
    const activeLog = attendanceLogs.find(l => l.tanggal === todayStr && l.details?.some(d => String(d.personilId) === String(memberId)));
    if (activeLog) {
      attRow = activeLog.details.find(d => String(d.personilId) === String(memberId));
    }
    
    if (attRow) {
      setSelectedAuditLog({ member, attRow });
    } else {
      alert(`Personil "${member.nama}" belum melakukan presensi masuk hari ini.`);
    }
  };

  // Authorization check for Danru/Wadanru/Admin
  const isAuthorizedFiller = useMemo(() => {
    const role = currentUser?.jabatan || '';
    return ['Admin Super', 'admin', 'Admin', 'Danru', 'Wadanru'].includes(role);
  }, [currentUser]);

  // All patrol users — Danru/Wadanru can pick from anyone
  const allPatrolUsers = useMemo(() =>
    users.filter(u => ['Danru', 'Wadanru', 'Anggota', 'BKO', 'KH (Khusus)', 'Middle 1', 'Middle 2'].includes(u.jabatan)),
  [users]);

  // Filter by regu
  const reguMembers = useMemo(() => {
    if (!selectedRegu || selectedRegu === 'Semua Regu') return allPatrolUsers;
    return allPatrolUsers.filter(u => u.regu === selectedRegu);
  }, [allPatrolUsers, selectedRegu]);

  // Filter and compile all overtime (Lembur) entries
  const lemburanRows = useMemo(() => {
    const list = [];
    attendanceLogs.forEach(log => {
      if (!log.tanggal || !log.tanggal.startsWith(selectedLemburMonth)) return;
      (log.details || []).forEach(d => {
        const isLemburRow = d.isLembur === true || 
                            d.alasan?.toLowerCase().includes('lembur') || 
                            d.alasan?.toLowerCase().includes('backup') || 
                            d.status === 'Tukar Shift';
        
        // If regu filter is active, check if either the log regu or personil's regu matches
        if (selectedRegu !== 'Semua Regu' && log.regu !== selectedRegu && d.regu !== selectedRegu) return;

        if (isLemburRow) {
          list.push({
            logId: log.id,
            tanggal: log.tanggal,
            hari: log.hari || ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'][new Date(log.tanggal).getDay()],
            regu: log.regu,
            shift: log.shift,
            detail: d
          });
        }
      });
    });
    return list.sort((a, b) => b.tanggal.localeCompare(a.tanggal));
  }, [attendanceLogs, selectedLemburMonth, selectedRegu]);

  const lemburStats = useMemo(() => {
    let totalJam = 0;
    const uniquePersonnel = new Set();
    lemburanRows.forEach(row => {
      const jam = parseInt(row.detail.jamLembur, 10) || 8;
      totalJam += jam;
      uniquePersonnel.add(row.detail.personilId || row.detail.nama);
    });
    return {
      totalJam,
      totalKegiatan: lemburanRows.length,
      totalPersonil: uniquePersonnel.size
    };
  }, [lemburanRows]);

  const handleExportLemburPDF = () => {
    if (lemburanRows.length === 0) {
      alert('Belum ada data lemburan untuk diexport.');
      return;
    }

    const ok = exportTableToPdf({
      title: 'Laporan Rekapitulasi Lemburan Keamanan JDC',
      fileName: `rekap-lembur-smpjdc-${selectedLemburMonth}`,
      meta: [
        { label: 'Bulan Rekap', value: selectedLemburMonth },
        { label: 'Regu Pantau', value: selectedRegu },
        { label: 'Total Jam Lembur', value: `${lemburStats.totalJam} Jam` },
        { label: 'Total Personil', value: `${lemburStats.totalPersonil} Orang` }
      ],
      columns: [
        { header: 'NO', width: '4%' },
        { header: 'TANGGAL', width: '9%' },
        { header: 'NAMA PERSONIL', width: '13%' },
        { header: 'NRP', width: '7%' },
        { header: 'REGU / JABATAN', width: '10%' },
        { header: 'SHIFT LEMBUR', width: '7%' },
        { header: 'DURASI', width: '6%' },
        { header: 'JAM MASUK/PULANG', width: '10%' },
        { header: 'VERIFIKASI GPS', width: '13%' },
        { header: 'FOTO SELFIE', width: '12%' },
        { header: 'KEPERLUAN / ALASAN', width: '10%' }
      ],
      rows: lemburanRows.map((row, idx) => {
        const d = row.detail;
        const checkInOutStr = `${d.checkInTime || '-'}\n${d.checkOutTime || '-'}`;
        const gpsStr = (d.lat && d.lng) ? `Lat: ${Number(d.lat).toFixed(4)}\nLong: ${Number(d.lng).toFixed(4)}` : '-';
        
        return [
          idx + 1,
          formatDateOnlyId(row.tanggal),
          d.nama || '-',
          d.nrp || '-',
          `${d.regu || '-'} / ${d.jabatan || '-'}`,
          `Shift ${row.shift}`,
          `${parseInt(d.jamLembur, 10) || 8} Jam`,
          checkInOutStr,
          gpsStr,
          d.fotoSelfie ? { image: d.fotoSelfie, text: d.nama || '' } : '-',
          d.alasan || 'Lembur / Backup'
        ];
      })
    });

    if (!ok) alert('Ekspor PDF gagal. Pastikan browser tidak memblokir pop-up.');
  };

  // Rows state for table editing
  const [rows, setRows] = useState([]);

  // Available users to add from other squads (cross-regu)
  const availableToAddUsers = useMemo(() => {
    const activeIds = new Set(rows.map(r => r.personilId));
    return allPatrolUsers.filter(u => !activeIds.has(u.id));
  }, [allPatrolUsers, rows]);

  // Filtered rows for table search (decoupled from master rows)
  const displayedRows = useMemo(() => {
    if (!memberSearch.trim()) return rows;
    const q = memberSearch.trim().toLowerCase();
    return rows.filter(row =>
      row.nama?.toLowerCase().includes(q) ||
      row.nrp?.toLowerCase().includes(q) ||
      row.jabatan?.toLowerCase().includes(q) ||
      row.regu?.toLowerCase().includes(q)
    );
  }, [rows, memberSearch]);

  // Get time string by shift code (all JDC codes)
  const getJamDinas = (shiftCode) => {
    const info = SHIFT_CODES[shiftCode];
    if (info) return info.jam.replace(':', '.').replace(' - ', ' - ').replace(/:(\d{2})/g, '.$1');
    return '-';
  };

  // Re-generate table rows when Regu or Shift or attendanceLogs changes
  useEffect(() => {
    const existingLog = attendanceLogs.find(
      log => log.tanggal === todayStr && log.regu === selectedRegu && log.shift === selectedShift
    );

    if (existingLog) {
      setRows(existingLog.details);
    } else {
      const defaultRows = reguMembers.map((member, index) => {
        const posIndex = index % (posList.length || 1);
        const defaultPos = posList[posIndex] ? posList[posIndex].titik : '';
        
        return {
          personilId: member.id,
          nama: member.nama,
          nrp: member.nrp,
          regu: member.regu,
          jabatan: member.jabatan,
          status: 'Hadir',
          alasan: '',
          penggantiId: '',
          posPlotting: defaultPos,
          jamDinas: getJamDinas(selectedShift)
        };
      });
      setRows(defaultRows);
    }
  }, [selectedRegu, selectedShift, reguMembers, attendanceLogs]);

  const handleRowChangeById = (personilId, field, value) => {
    setRows(prev => prev.map((row) => {
      if (row.personilId !== personilId) return row;
      
      const updated = { ...row, [field]: value };
      
      if (field === 'status') {
        if (value === 'Hadir') {
          updated.alasan = '';
          updated.penggantiId = '';
        } else if (value === 'Tukar Shift') {
          updated.alasan = 'Tukar Shift';
        } else if (value === 'Sakit') {
          updated.alasan = 'Sakit';
          updated.posPlotting = '-';
        } else if (value === 'Cuti') {
          updated.alasan = 'Cuti';
          updated.posPlotting = '-';
        } else if (value === 'Mangkir') {
          updated.alasan = 'Mangkir';
          updated.posPlotting = '-';
        } else if (value === 'Tidak Hadir') {
          updated.alasan = 'Tidak Hadir';
          updated.posPlotting = '-';
        }
      }
      return updated;
    }));
  };

  const handleAddMember = (userId) => {
    if (!userId) return;
    const user = allPatrolUsers.find(u => String(u.id) === String(userId));
    if (!user) return;

    const posIndex = rows.length % (posList.length || 1);
    const defaultPos = posList[posIndex] ? posList[posIndex].titik : '';

    const newRow = {
      personilId: user.id,
      nama: user.nama,
      nrp: user.nrp,
      regu: user.regu,
      jabatan: user.jabatan,
      status: 'Hadir',
      alasan: '',
      penggantiId: '',
      posPlotting: defaultPos,
      jamDinas: getJamDinas(selectedShift)
    };

    setRows(prev => [...prev, newRow]);
    setSelectedAddMemberId('');
  };

  const handleRemoveRowById = (personilId) => {
    setRows(prev => prev.filter(row => row.personilId !== personilId));
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (rows.length === 0) {
      alert('Tidak ada anggota regu untuk diabsensi.');
      return;
    }

    onAddAttendance({
      tanggal: todayStr,
      hari,
      regu: selectedRegu,
      shift: selectedShift,
      jamDinas: getJamDinas(selectedShift),
      details: rows
    });
    
    // Automatically switch to dashboard after saving to view the status
    setActiveTab('dashboard');
  };

  // Get substitute options — all patrol users (cross-regu)
  const substituteOptions = users.filter(u => ['Danru', 'Wadanru', 'Anggota', 'BKO', 'KH (Khusus)', 'Middle 1', 'Middle 2'].includes(u.jabatan));

  // Find if plotting has been saved today for the selected regu
  // Aggregates from both traditional and roster-based logs
  const todayAttendance = (() => {
    const tradLog = attendanceLogs.find(
      log => log.tanggal === todayStr && log.regu === selectedRegu
    );
    const rosterDetails = [];
    attendanceLogs.forEach(log => {
      if (log.tanggal === todayStr && log.isRosterBased) {
        (log.details || []).forEach(d => {
          const user = users.find(u => u.id === d.personilId);
          if (user && user.regu === selectedRegu) rosterDetails.push(d);
        });
      }
    });
    if (tradLog) {
      if (rosterDetails.length === 0) return tradLog;
      const seen = new Set((tradLog.details || []).map(d => String(d.personilId || d.userId)));
      const merged = [...(tradLog.details || [])];
      rosterDetails.forEach(d => {
        const key = String(d.personilId || d.userId);
        if (!seen.has(key)) { seen.add(key); merged.push(d); }
      });
      return { ...tradLog, details: merged };
    }
    if (rosterDetails.length === 0) return null;
    return {
      tanggal: todayStr, regu: selectedRegu, shift: 'Roster', jamDinas: '-',
      details: rosterDetails
    };
  })();

  // Helper to determine status and counts for today
  const getMemberStatus = (member) => {
    const memberDetail = todayAttendance?.details?.find(d => d.personilId === member.id);
    const reportsToday = reports.filter(
      r => r.userId === member.id && r.timestamp?.startsWith(todayStr)
    );
    const patrolCount = reportsToday.length;

    let isOnline = false;
    let lastActiveText = 'Offline';
    if (member.lastActive) {
      const lastActiveDate = new Date(member.lastActive);
      const diffMs = new Date() - lastActiveDate;
      const diffMins = Math.floor(diffMs / 60000);
      isOnline = diffMs < 300000; // 5 minutes threshold
      
      if (diffMins < 1) {
        lastActiveText = 'Aktif';
      } else if (diffMins < 60) {
        lastActiveText = `${diffMins}m lalu`;
      } else {
        lastActiveText = `${Math.floor(diffMins / 60)}j lalu`;
      }
    }

    let statusLabel = 'Offline';
    let statusColor = 'var(--text-muted)';
    let statusIndicator = '⚪';
    let statusKey = 'offline';

    if (memberDetail && memberDetail.status !== 'Hadir') {
      statusLabel = memberDetail.status;
      statusColor = 'var(--color-danger)';
      statusIndicator = '❌';
      statusKey = 'absent';
    } else {
      if (patrolCount > 0) {
        statusLabel = `Patroli (${patrolCount} area)`;
        statusColor = 'var(--color-success)';
        statusIndicator = '🟢';
        statusKey = 'patroli';
      } else if (isOnline) {
        statusLabel = 'Standby / Login';
        statusColor = 'var(--color-warning)';
        statusIndicator = '🟡';
        statusKey = 'login';
      }
    }

    return {
      statusLabel,
      statusColor,
      statusIndicator,
      statusKey,
      patrolCount,
      lastActiveText,
      isOnline,
      plottingPos: memberDetail?.posPlotting || '-',
      shiftCode: todayAttendance?.shift || '-',
      jamDinas: todayAttendance?.jamDinas || '-'
    };
  };

  const generateWALink = (member, statusInfo) => {
    const hp = member.nomorHp || '';
    let cleanHp = hp.replace(/\D/g, '');
    if (cleanHp.startsWith('0')) {
      cleanHp = '62' + cleanHp.slice(1);
    }
    
    const hariTanggal = `${hari}, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`;
    const text = `🛡️ *NOTIFIKASI PLOTTING PENJAGAAN JDC* 🛡️

Halo *${member.nama}*, berikut adalah detail plotting dinas Anda hari ini:

📅 Hari/Tanggal: *${hariTanggal}*
👥 Regu: *${selectedRegu}*
⏱️ Shift: *Shift ${statusInfo.shiftCode} (${statusInfo.jamDinas})*
📍 Pos Jaga: *${statusInfo.plottingPos}*
🟢 Status Kehadiran: *${statusInfo.statusLabel}*

Harap standby di pos masing-masing dan lakukan patroli berkala menggunakan aplikasi JDC.

_Sistem Manajemen Keamanan JDC_`;

    const encodedText = encodeURIComponent(text);
    if (cleanHp) {
      return `https://wa.me/${cleanHp}?text=${encodedText}`;
    } else {
      return `https://api.whatsapp.com/send?text=${encodedText}`;
    }
  };

  const handlePhoneInputChange = (memberId, value) => {
    setPhoneInputs(prev => ({
      ...prev,
      [memberId]: value
    }));
  };

  const handlePhoneSave = (memberId) => {
    const raw = phoneInputs[memberId];
    if (raw === undefined) return;
    const val = raw.trim();
    if (!val && raw !== '') return;
    
    if (onUpdateUser) {
      onUpdateUser(memberId, { nomorHp: val || '-' });
      setEditingPhoneId(null);
    }
  };

  const handleExportAttendancePDF = () => {
    const sourceLogs = [];
    if (attendanceLogs && attendanceLogs.length > 0) {
      sourceLogs.push(...attendanceLogs);
    } else if (todayAttendance) {
      sourceLogs.push(todayAttendance);
    }
    if (sourceLogs.length === 0) {
      alert('Belum ada data absensi untuk diexport.');
      return;
    }
    const rowsForExport = [];
    sourceLogs.forEach((log) => {
      if (!log) return;
      (log.details || []).forEach((detail) => {
        const substitute = users.find(u => String(u.id) === String(detail.penggantiId));
        rowsForExport.push({ log, detail, substitute });
      });
    });

    const ok = exportTableToPdf({
      title: 'Absensi & Plotting Penjagaan',
      fileName: `absensi-plotting-smpjdc-${formatDateForFile()}`,
      meta: [
        { label: 'Regu Aktif', value: selectedRegu },
        { label: 'Shift Aktif', value: selectedShift },
        { label: 'Total Log', value: sourceLogs.length },
        { label: 'Total Personil', value: rowsForExport.length }
      ],
      columns: [
        { header: 'NO', width: '4%' },
        { header: 'TANGGAL', width: '8%' },
        { header: 'HARI', width: '6%' },
        { header: 'REGU', width: '7%' },
        { header: 'SHIFT', width: '5%' },
        { header: 'JAM DINAS', width: '8%' },
        { header: 'NAMA PERSONIL', width: '11%' },
        { header: 'NRP', width: '6%' },
        { header: 'JABATAN', width: '8%' },
        { header: 'STATUS HADIR', width: '8%' },
        { header: 'KETERANGAN', width: '9%' },
        { header: 'PLOTTING POS', width: '11%' },
        { header: 'PENGGANTI', width: '9%' }
      ],
      rows: rowsForExport.map(({ log, detail, substitute }, idx) => [
        idx + 1,
        formatDateOnlyId(log.tanggal),
        log.hari || '-',
        log.regu || detail.regu || '-',
        log.shift || '-',
        log.jamDinas || detail.jamDinas || '-',
        detail.nama || '-',
        detail.nrp || '-',
        detail.jabatan || '-',
        detail.status || '-',
        detail.alasan || '-',
        detail.posPlotting || '-',
        substitute ? `${substitute.nama} (${substitute.regu || '-'})` : '-'
      ])
    });
    if (!ok) alert('Popup export PDF diblokir browser. Izinkan popup untuk aplikasi ini.');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* ── 1. ANDROID MENU GRID (Hub on Mobile, Persistent Tab Bar on Desktop) ── */}
      <div className={`android-subtab-container ${mobileView === 'content' ? 'hide-on-mobile' : ''}`}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <ClipboardList size={18} className="text-primary" /> Modul Absensi & Plotting Regu
            </h3>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', margin: '0.15rem 0 0 0' }}>
              Pilih menu di bawah ini untuk membuka data operasional (100% Android Native):
            </p>
          </div>
          <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '3px 8px', borderRadius: '12px', background: 'rgba(0,240,255,0.1)', color: 'var(--color-primary)', border: '1px solid rgba(0,240,255,0.25)' }}>
            5 Menu
          </span>
        </div>

        <div className="android-subtab-grid" role="tablist">
          {SUBTABS.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-label={tab.title}
                onClick={() => handleSelectTab(tab.id)}
                className={`android-subtab-card ${isActive ? 'active' : ''}`}
              >
                <div className="subtab-icon-row">
                  <div 
                    className="subtab-icon-wrap" 
                    style={{ 
                      color: isActive ? '#070a13' : tab.color,
                      background: isActive ? tab.color : `${tab.color}18`,
                      border: `1px solid ${tab.color}35`
                    }}
                  >
                    {tab.icon}
                  </div>
                  {isActive && (
                    <span className="subtab-active-badge">
                      ● Aktif
                    </span>
                  )}
                </div>
                <span className="subtab-title subtab-title-full">{tab.title}</span>
                <span className="subtab-title subtab-title-short">{tab.short}</span>
                <span className="subtab-sub">{tab.sub}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 2. ANDROID ACTIVE VIEW HEADER (Mobile Direct Screen Appbar) ── */}
      {mobileView === 'content' && (
        <div className="mobile-only-header glass-panel" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0.65rem 0.85rem', borderRadius: '12px',
          borderLeft: `4px solid ${activeTabMeta.color}`,
          background: 'var(--bg-glass)',
          gap: '0.65rem', flexWrap: 'wrap'
        }}>
          <button
            type="button"
            onClick={() => { hapticLight(); setMobileView('menu'); }}
            className="android-back-btn"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.45rem',
              padding: '0.45rem 0.75rem', borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid var(--border-glass)',
              color: 'var(--text-primary)', fontSize: '0.78rem',
              fontWeight: 700, cursor: 'pointer', touchAction: 'manipulation'
            }}
          >
            <ArrowLeft size={16} /> Menu Absensi
          </button>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <span style={{
              width: '26px', height: '26px', borderRadius: '6px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: `${activeTabMeta.color}22`, color: activeTabMeta.color,
              border: `1px solid ${activeTabMeta.color}44`
            }}>
              {activeTabMeta.icon}
            </span>
            <div style={{ lineHeight: '1.2' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)' }}>{activeTabMeta.title}</div>
              <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>{activeTabMeta.sub}</div>
            </div>
          </div>
        </div>
      )}

      {/* ANCHOR FOR DIRECT SCROLL */}
      <div id="absensi-active-tab-container" style={{ scrollMarginTop: '80px' }} />

      {/* REGU & METADATA BAR (Mobile-First Ergonomic) */}
      <div className="glass-panel" style={{ padding: '0.85rem 1rem', display: 'flex', flexWrap: 'wrap', gap: '0.85rem', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem', flex: 1, minWidth: '240px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
            <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-secondary)' }}>MEMANTAU REGU</span>
            <select 
              value={selectedRegu} 
              onChange={e => setSelectedRegu(e.target.value)} 
              className="modern-select"
              style={{ padding: '0.45rem 0.75rem', fontSize: '0.82rem', width: '100%' }}
            >
              <option value="Semua Regu">Semua Regu</option>
              {['Regu A', 'Regu B', 'Regu C', 'Regu D', 'Non-Regu'].map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
            <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-secondary)' }}>SHIFT OPERASIONAL</span>
            <select 
              value={selectedShift} 
              onChange={e => setSelectedShift(e.target.value)} 
              className="modern-select"
              style={{ padding: '0.45rem 0.75rem', fontSize: '0.82rem', width: '100%' }}
            >
              {Object.entries(SHIFT_CODES).filter(([c]) => c !== 'X').map(([code, info]) => (
                <option key={code} value={code}>{code} · {info.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap', width: '100%', maxWidth: '320px' }}>
          <div style={{ fontSize: '0.78rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Hari Ini:</span>{' '}
            <strong style={{ color: 'var(--color-primary)' }}>{hari}, {todayStr}</strong>
          </div>
          <button type="button" onClick={handleExportAttendancePDF} className="btn-secondary" style={{ padding: '0.45rem 0.75rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <FileText size={14} /> Export PDF
          </button>
        </div>
      </div>

      {/* ========================================== */}
      {/* TAB 0: ABSENSI HARIAN BERDASARKAN ROSTER */}
      {/* ========================================== */}
      {activeTab === 'roster-daily' && (
        <div className="android-tab-content">
          <AbsensiRosterHarian
            users={users}
            posList={posList}
            attendanceLogs={attendanceLogs}
            onAddAttendance={onAddAttendance}
            reports={reports}
            todayStr={todayStr}
            getJamDinas={getJamDinas}
            onShowAudit={handleShowAudit}
          />
        </div>
      )}

      {/* ========================================== */}
      {/* TAB 1: DASHBOARD REGU */}
      {/* ========================================== */}
      {activeTab === 'dashboard' && (
        <div className="android-tab-content">
          {!todayAttendance ? (
            <div className="glass-panel" style={{ padding: '3rem 2rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.2rem', background: 'rgba(239, 68, 68, 0.03)', border: '1px dashed rgba(239, 68, 68, 0.25)' }}>
              <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AlertTriangle size={32} />
              </div>
              <div style={{ maxWidth: '450px' }}>
                <h4 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>PLOTTING HARI INI BELUM DIISI!</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                  Absensi & pos penugasan untuk <strong>{selectedRegu}</strong> hari ini belum ditentukan. Anda harus membuat plotting terlebih dahulu agar dapat memantau status keaktifan personil secara real-time.
                </p>
              </div>
              <button 
                type="button"
                onClick={() => handleSelectTab('form')} 
                className="btn-primary" 
                style={{ padding: '0.75rem 2rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700 }}
              >
                <ClipboardList size={16} /> Mulai Isi Absensi & Plotting
              </button>
            </div>
          ) : (
            <>
              {/* KPI CARDS */}
              <div className="grid-cols-3" style={{ gap: '1rem' }}>
                {/* Kehadiran */}
                {(() => {
                  const total = reguMembers.length;
                  const hadir = todayAttendance.details.filter(d => d.status === 'Hadir').length;
                  const tukar = todayAttendance.details.filter(d => d.status === 'Tukar Shift').length;
                  const nonHadir = total - hadir - tukar;
                  
                  return (
                    <div className="glass-panel" style={{ padding: '1.25rem', borderLeft: '4px solid var(--color-primary)' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.5rem' }}>
                        <UserCheck size={14} className="text-primary" /> STATUS KEHADIRAN REGU
                      </div>
                      <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                        {hadir + tukar} <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 500 }}>/ {total} Personil</span>
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '0.4rem' }}>
                        Hadir: <strong>{hadir}</strong> • Tukar: <strong>{tukar}</strong> • Absen: <strong style={{ color: nonHadir > 0 ? 'var(--color-danger)' : 'inherit' }}>{nonHadir}</strong>
                      </div>
                    </div>
                  );
                })()}

                {/* Keaktifan / Login */}
                {(() => {
                  const stats = reguMembers.map(m => getMemberStatus(m));
                  const onlineCount = stats.filter(s => s.isOnline && s.statusKey !== 'absent').length;
                  const offlineCount = stats.filter(s => !s.isOnline && s.statusKey === 'offline').length;
                  
                  return (
                    <div className="glass-panel" style={{ padding: '1.25rem', borderLeft: '4px solid var(--color-warning)' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.5rem' }}>
                        <Users size={14} className="text-warning" /> STATUS KONEKSI (LOGIN)
                      </div>
                      <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                        {onlineCount} <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 500 }}>Online JDC</span>
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '0.4rem' }}>
                        Active: <strong>{onlineCount}</strong> • Standby/Offline: <strong>{offlineCount}</strong>
                      </div>
                    </div>
                  );
                })()}

                {/* Patrol progress */}
                {(() => {
                  const stats = reguMembers.map(m => getMemberStatus(m));
                  const patrolActive = stats.filter(s => s.patrolCount > 0).length;
                  const totalScans = stats.reduce((acc, curr) => acc + curr.patrolCount, 0);
                  
                  return (
                    <div className="glass-panel" style={{ padding: '1.25rem', borderLeft: '4px solid var(--color-success)' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.5rem' }}>
                        <Activity size={14} className="text-success" /> PROGRESS PATROLI
                      </div>
                      <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                        {patrolActive} <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 500 }}>Petugas Patroli</span>
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '0.4rem' }}>
                        Total Checkpoint Terscan Hari Ini: <strong>{totalScans} Area</strong>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* DETAILED MEMBERS LIST */}
              <div className="glass-panel" style={{ padding: '1.5rem', marginTop: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <h4 style={{ fontSize: '0.98rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Shield size={16} className="text-primary" />
                    <span>Pemantauan Personil {selectedRegu} — Shift {todayAttendance.shift}</span>
                  </h4>
                  <span className="badge badge-info" style={{ fontSize: '0.7rem', padding: '0.35rem 0.75rem' }}>
                    Jam Dinas: {todayAttendance.jamDinas}
                  </span>
                </div>

                {/* Desktop View Table */}
                <div className="desktop-only-table" style={{ overflowX: 'auto', border: '1px solid var(--border-glass)', borderRadius: '8px', background: 'rgba(0,0,0,0.1)' }}>
                  <table className="absensi-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '850px' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-glass)', background: 'rgba(255,255,255,0.01)' }}>
                        <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>No</th>
                        <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Nama Personil</th>
                        <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Jabatan</th>
                        <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Plotting Pos</th>
                        <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Keaktifan (Real-time)</th>
                        <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Progress Patroli</th>
                        <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Nomor WhatsApp</th>
                        <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textAlign: 'center' }}>Kirim Notif WA</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reguMembers.length === 0 ? (
                        <tr>
                          <td colSpan="8" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                            Tidak ada personil terdaftar di regu ini.
                          </td>
                        </tr>
                      ) : (
                        reguMembers.map((member, idx) => {
                          const statusInfo = getMemberStatus(member);
                          
                          return (
                            <tr key={member.id} style={{ borderBottom: '1px solid var(--border-glass)', transition: 'background 0.2s' }}>
                              <td style={{ padding: '0.9rem 1rem', fontSize: '0.8rem', fontWeight: 600 }}>{idx + 1}</td>
                              
                              <td style={{ padding: '0.9rem 1rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                  <img 
                                    src={member.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=40'} 
                                    alt="" 
                                    style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover', border: '1.5px solid rgba(59,130,246,0.3)' }} 
                                    onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=40'; }}
                                  />
                                  <div>
                                    <div 
                                      style={{ fontWeight: 800, fontSize: '0.82rem', cursor: 'pointer', color: 'var(--color-primary)', textDecoration: 'underline' }}
                                      onClick={() => handleShowAudit(member.id)}
                                      title="Klik untuk detail audit presensi"
                                    >
                                      {member.nama}
                                    </div>
                                    <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>NRP: {member.nrp}</div>
                                  </div>
                                </div>
                              </td>
                              
                              <td style={{ padding: '0.9rem 1rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                {member.jabatan}
                              </td>
                              
                              <td style={{ padding: '0.9rem 1rem' }}>
                                <span className="badge badge-info" style={{ fontSize: '0.7rem', fontWeight: 700, background: 'rgba(6,182,212,0.1)', color: '#06b6d4', border: '1px solid rgba(6,182,212,0.2)' }}>
                                  📍 {statusInfo.plottingPos}
                                </span>
                              </td>
                              
                              <td style={{ padding: '0.9rem 1rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem' }}>
                                  <span>{statusInfo.statusIndicator}</span>
                                  <span style={{ color: statusInfo.statusColor, fontWeight: 700 }}>
                                    {statusInfo.statusLabel}
                                  </span>
                                  {statusInfo.statusKey !== 'absent' && (
                                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginLeft: '0.2rem' }}>
                                      ({statusInfo.lastActiveText})
                                    </span>
                                  )}
                                </div>
                              </td>

                              <td style={{ padding: '0.9rem 1rem' }}>
                                {statusInfo.patrolCount > 0 ? (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                                    <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-success)' }}>
                                      {statusInfo.patrolCount} Area Terscan
                                    </div>
                                    <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>
                                      Terakhir: {(() => {
                                        const sorted = reports.filter(r => r.userId === member.id && r.timestamp?.startsWith(todayStr)).sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));
                                        if (sorted.length > 0) {
                                          return new Date(sorted[0].timestamp).toLocaleTimeString('id-ID', {hour:'2-digit',minute:'2-digit'});
                                        }
                                        return '-';
                                      })()} WIB
                                    </span>
                                  </div>
                                ) : (
                                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Belum patroli</span>
                                )}
                              </td>

                              <td style={{ padding: '0.9rem 1rem' }}>
                                {editingPhoneId === member.id ? (
                                  <div style={{ display: 'flex', gap: '0.2rem', alignItems: 'center' }}>
                                    <input 
                                      type="text" 
                                      value={phoneInputs[member.id] !== undefined ? phoneInputs[member.id] : (member.nomorHp || '')} 
                                      onChange={e => handlePhoneInputChange(member.id, e.target.value)} 
                                      placeholder="Cth: 0812..." 
                                      className="modern-input" 
                                      style={{ padding: '0.2rem 0.4rem', fontSize: '0.72rem', width: '110px' }}
                                    />
                                    <button type="button" onClick={() => handlePhoneSave(member.id)} style={{ border: '1px solid var(--color-success)', background: 'rgba(16,185,129,0.1)', color: 'var(--color-success)', borderRadius: '4px', padding: '0.25rem', cursor: 'pointer', display: 'flex' }}><Check size={11} /></button>
                                    <button type="button" onClick={() => setEditingPhoneId(null)} style={{ border: '1px solid var(--border-glass)', background: 'transparent', color: 'var(--text-muted)', borderRadius: '4px', padding: '0.25rem', cursor: 'pointer', display: 'flex' }}><X size={11} /></button>
                                  </div>
                                ) : (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                    {member.nomorHp ? (
                                      <>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-primary)' }}>{member.nomorHp}</span>
                                        <button type="button" onClick={() => { setEditingPhoneId(member.id); handlePhoneInputChange(member.id, member.nomorHp); }} style={{ border: 'none', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', opacity: 0.6 }} title="Ubah HP"><Edit2 size={11} /></button>
                                      </>
                                    ) : (
                                      <button type="button" onClick={() => { setEditingPhoneId(member.id); handlePhoneInputChange(member.id, ''); }} style={{ border: '1px dashed rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.05)', color: '#f87171', borderRadius: '4px', padding: '0.2rem 0.5rem', fontSize: '0.68rem', fontWeight: 600, cursor: 'pointer' }}>
                                        + Hubungkan HP
                                      </button>
                                    )}
                                  </div>
                                )}
                              </td>

                              <td style={{ padding: '0.9rem 1rem', textAlign: 'center' }}>
                                <a 
                                  href={generateWALink(member, statusInfo)}
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '50%',
                                    background: 'rgba(16, 185, 129, 0.12)',
                                    border: '1.5px solid rgba(16, 185, 129, 0.35)',
                                    color: '#10b981',
                                    transition: 'all 0.2s',
                                    cursor: 'pointer',
                                    boxShadow: '0 0 8px rgba(16,185,129,0.08)'
                                  }}
                                  title="Kirim plotting ke WhatsApp petugas"
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.background = '#10b981';
                                    e.currentTarget.style.color = 'white';
                                    e.currentTarget.style.boxShadow = '0 0 15px #10b981';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'rgba(16, 185, 129, 0.12)';
                                    e.currentTarget.style.color = '#10b981';
                                    e.currentTarget.style.boxShadow = '0 0 8px rgba(16,185,129,0.08)';
                                  }}
                                >
                                  <MessageSquare size={14} />
                                </a>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Android Mobile Cards (Zero Horizontal Scroll!) */}
                <div className="mobile-only-cards">
                  {reguMembers.length === 0 ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      Tidak ada personil terdaftar di regu ini.
                    </div>
                  ) : (
                    reguMembers.map((member, idx) => {
                      const statusInfo = getMemberStatus(member);
                      const isEditingPhone = editingPhoneId === member.id;
                      return (
                        <div key={member.id} className="android-member-card">
                          <div className="android-member-card-header">
                            <div className="android-member-info">
                              <img 
                                src={member.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=40'} 
                                alt="" 
                                className="android-member-avatar"
                                onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=40'; }}
                              />
                              <div>
                                <div 
                                  className="android-member-name"
                                  onClick={() => handleShowAudit(member.id)}
                                  title="Klik untuk detail audit presensi"
                                  style={{ cursor: 'pointer', color: 'var(--color-primary)', textDecoration: 'underline' }}
                                >
                                  {member.nama}
                                </div>
                                <div className="android-member-meta">
                                  NRP: {member.nrp || '-'} · <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{member.jabatan}</span>
                                </div>
                              </div>
                            </div>
                            <span style={{ fontSize: '0.68rem', fontWeight: 800, padding: '0.2rem 0.5rem', borderRadius: '6px', background: 'rgba(59,130,246,0.15)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.3)' }}>
                              #{idx + 1}
                            </span>
                          </div>

                          {/* Grid info: Pos & Status */}
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', background: 'rgba(255,255,255,0.02)', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
                            <div>
                              <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', display: 'block' }}>PLOTTING POS</span>
                              <strong style={{ fontSize: '0.78rem', color: '#06b6d4', display: 'flex', alignItems: 'center', gap: '0.2rem', marginTop: '0.15rem' }}>
                                📍 {statusInfo.plottingPos}
                              </strong>
                            </div>
                            <div>
                              <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', display: 'block' }}>KEAKTIFAN</span>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.15rem', fontSize: '0.75rem', fontWeight: 700, color: statusInfo.statusColor }}>
                                <span>{statusInfo.statusIndicator}</span>
                                <span>{statusInfo.statusLabel}</span>
                              </div>
                            </div>
                          </div>

                          {/* Patrol status */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                            <span>Progress Patroli:</span>
                            {statusInfo.patrolCount > 0 ? (
                              <strong style={{ color: 'var(--color-success)' }}>
                                {statusInfo.patrolCount} Area Terscan
                              </strong>
                            ) : (
                              <span style={{ color: 'var(--text-muted)' }}>Belum patroli</span>
                            )}
                          </div>

                          {/* Action Row: WhatsApp & Phone */}
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', borderTop: '1px solid var(--border-glass)', paddingTop: '0.6rem', flexWrap: 'wrap' }}>
                            {isEditingPhone ? (
                              <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center', flex: 1, minWidth: '150px' }}>
                                <input 
                                  type="text" 
                                  value={phoneInputs[member.id] !== undefined ? phoneInputs[member.id] : (member.nomorHp || '')} 
                                  onChange={e => handlePhoneInputChange(member.id, e.target.value)} 
                                  placeholder="0812..." 
                                  className="modern-input" 
                                  style={{ padding: '0.3rem 0.5rem', fontSize: '0.75rem', flex: 1 }}
                                />
                                <button type="button" onClick={() => handlePhoneSave(member.id)} className="btn-primary" style={{ padding: '0.3rem 0.5rem', fontSize: '0.7rem' }}>
                                  <Check size={12} />
                                </button>
                                <button type="button" onClick={() => setEditingPhoneId(null)} className="btn-secondary" style={{ padding: '0.3rem 0.5rem', fontSize: '0.7rem' }}>
                                  <X size={12} />
                                </button>
                              </div>
                            ) : (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                <Phone size={12} className="text-primary" />
                                <span>{member.nomorHp || 'Belum ada no HP'}</span>
                                <button 
                                  type="button" 
                                  onClick={() => { setEditingPhoneId(member.id); handlePhoneInputChange(member.id, member.nomorHp || ''); }}
                                  style={{ border: 'none', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px' }}
                                  title="Ubah nomor HP"
                                >
                                  <Edit2 size={11} />
                                </button>
                              </div>
                            )}

                            <a 
                              href={generateWALink(member, statusInfo)}
                              target="_blank" 
                              rel="noopener noreferrer"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.35rem',
                                padding: '0.35rem 0.75rem',
                                borderRadius: '8px',
                                background: 'rgba(16, 185, 129, 0.15)',
                                border: '1px solid rgba(16, 185, 129, 0.35)',
                                color: '#10b981',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                textDecoration: 'none'
                              }}
                            >
                              <MessageSquare size={13} /> Kirim Plotting WA
                            </a>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ========================================== */}
      {/* TAB 2: FORM ABSENSI & PLOTTING */}
      {/* ========================================== */}
      {activeTab === 'form' && (
        <div className="android-tab-content"><div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ClipboardList size={20} className="text-primary" />
            <span>Form Isian Absensi Regu & Plotting Penjagaan</span>
          </h3>

          {!isAuthorizedFiller ? (
            <div style={{ padding: '2rem 1.5rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', background: 'rgba(239, 68, 68, 0.03)', border: '1px dashed rgba(239, 68, 68, 0.25)', borderRadius: '8px' }}>
              <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Shield size={26} />
              </div>
              <div style={{ maxWidth: '420px' }}>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>Akses Dibatasi</h4>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                  Hanya <strong>Danru, Wadanru, atau Admin</strong> yang diperkenankan untuk mengisi atau memperbarui data absensi manual / plotting penjagaan regu.
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Metadata Parameters */}
              <div className="grid-cols-3" style={{ gap: '1rem' }}>
                <div className="step-field">
                  <label><Calendar size={12} /> HARI</label>
                  <select value={hari} onChange={e => setHari(e.target.value)} className="modern-select">
                    {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'].map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                
                <div className="step-field">
                  <label><Clock size={12} /> SHIFT JAGA</label>
                  <select value={selectedShift} onChange={e => setSelectedShift(e.target.value)} className="modern-select">
                    <option value="P">Pagi 06-14</option>
                    <option value="S">Siang 14-22</option>
                    <option value="M">Malam 22-06</option>
                  </select>
                </div>

                <div className="step-field">
                  <label><Users size={12} /> REGU (Filter)</label>
                  <select value={selectedRegu} onChange={e => setSelectedRegu(e.target.value)} className="modern-select">
                    {['Regu A', 'Regu B', 'Regu C', 'Regu D'].map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Search & Add Members */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                <div className="step-field">
                  <label><Search size={12} /> CARI ANGGOTA (Filter Nama/NRP/Jabatan/Regu)</label>
                  <input
                    type="text"
                    value={memberSearch}
                    onChange={e => setMemberSearch(e.target.value)}
                    placeholder="Ketik nama, NRP, jabatan, atau regu..."
                    className="modern-input"
                    style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}
                  />
                </div>
                <div className="step-field">
                  <label><UserCheck size={12} /> TAMBAH ANGGOTA LINTAS REGU</label>
                  <select
                    value={selectedAddMemberId}
                    onChange={e => {
                      setSelectedAddMemberId(e.target.value);
                      handleAddMember(e.target.value);
                    }}
                    className="modern-select"
                    style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}
                  >
                    <option value="">-- Pilih Anggota untuk Ditambahkan --</option>
                    {availableToAddUsers.map(u => (
                      <option key={u.id} value={u.id}>{u.nama} ({u.jabatan} - {u.regu || 'Non-Regu'})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Desktop View Table */}
              <div className="desktop-only-table" style={{ overflowX: 'auto', border: '1px solid var(--border-glass)', borderRadius: '8px', background: 'rgba(0,0,0,0.1)' }}>
                <table className="absensi-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '950px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-glass)' }}>
                      <th style={{ padding: '0.85rem 1rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>No</th>
                      <th style={{ padding: '0.85rem 1rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Nama</th>
                      <th style={{ padding: '0.85rem 1rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>NRP</th>
                      <th style={{ padding: '0.85rem 1rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Regu</th>
                      <th style={{ padding: '0.85rem 1rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Jabatan</th>
                      <th style={{ padding: '0.85rem 1rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Keterangan Hadir</th>
                      <th style={{ padding: '0.85rem 1rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Jika Tidak Hadir Karena</th>
                      <th style={{ padding: '0.85rem 1rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Nama Pengganti (Tukar Shift / Backup)</th>
                      <th style={{ padding: '0.85rem 1rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Plotting Pos (Pilih)</th>
                      <th style={{ padding: '0.85rem 1rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Jam Dinas</th>
                      <th style={{ padding: '0.85rem 1rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textAlign: 'center' }}>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedRows.length === 0 ? (
                      <tr>
                        <td colSpan="11" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                          Tidak ada personil yang cocok dengan filter pencarian atau regu ini.
                        </td>
                      </tr>
                    ) : (
                      displayedRows.map((row, idx) => (
                        <tr key={row.personilId} style={{ borderBottom: '1px solid var(--border-glass)' }}>
                          <td style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', fontWeight: 600 }}>{idx + 1}</td>
                          <td style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', fontWeight: 700 }}>{row.nama}</td>
                          <td style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{row.nrp || '-'}</td>
                          <td style={{ padding: '0.75rem 1rem', fontSize: '0.8rem' }}>
                            <span style={{ padding: '0.15rem 0.4rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600, background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}>{row.regu || '-'}</span>
                          </td>
                          <td style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{row.jabatan}</td>
                          <td style={{ padding: '0.75rem 1rem' }}>
                            <select 
                              value={row.status} 
                              onChange={e => handleRowChangeById(row.personilId, 'status', e.target.value)} 
                              className="modern-select"
                              style={{ padding: '0.35rem 0.5rem', fontSize: '0.8rem', minWidth: '110px' }}
                            >
                              <option value="Hadir">Hadir</option>
                              <option value="Tidak Hadir">Tidak Hadir</option>
                              <option value="Tukar Shift">Tukar Shift</option>
                              <option value="Sakit">Sakit</option>
                              <option value="Cuti">Cuti</option>
                              <option value="Mangkir">Mangkir</option>
                            </select>
                          </td>
                          <td style={{ padding: '0.75rem 1rem' }}>
                            <input 
                              type="text" 
                              value={row.alasan} 
                              onChange={e => handleRowChangeById(row.personilId, 'alasan', e.target.value)} 
                              placeholder="-" 
                              disabled={row.status === 'Hadir'}
                              className="modern-input" 
                              style={{ padding: '0.35rem 0.5rem', fontSize: '0.8rem' }}
                            />
                          </td>
                          <td style={{ padding: '0.75rem 1rem' }}>
                            <select 
                              value={row.penggantiId} 
                              onChange={e => handleRowChangeById(row.personilId, 'penggantiId', e.target.value)} 
                              disabled={row.status !== 'Tukar Shift' && row.status !== 'Tidak Hadir'}
                              className="modern-select"
                              style={{ padding: '0.35rem 0.5rem', fontSize: '0.8rem' }}
                            >
                              <option value="">-- Tidak Ada --</option>
                              {substituteOptions.map(opt => (
                                <option key={opt.id} value={opt.id}>{opt.nama} ({opt.jabatan} - {opt.regu})</option>
                              ))}
                            </select>
                          </td>
                          <td style={{ padding: '0.75rem 1rem' }}>
                            <select 
                              value={row.posPlotting} 
                              onChange={e => handleRowChangeById(row.personilId, 'posPlotting', e.target.value)} 
                              disabled={['Sakit', 'Cuti', 'Mangkir'].includes(row.status)}
                              className="modern-select"
                              style={{ padding: '0.35rem 0.5rem', fontSize: '0.8rem' }}
                            >
                              <option value="-">-</option>
                              {posList.map(p => (
                                <option key={p.id} value={p.titik}>{p.titik}</option>
                              ))}
                            </select>
                          </td>
                          <td style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            {row.jamDinas}
                          </td>
                          <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                            <button
                              type="button"
                              onClick={() => handleRemoveRowById(row.personilId)}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--color-danger)',
                                cursor: 'pointer',
                                padding: '0.25rem',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                opacity: 0.8,
                                transition: 'opacity 0.2s'
                              }}
                              onMouseEnter={e => e.currentTarget.style.opacity = 1}
                              onMouseLeave={e => e.currentTarget.style.opacity = 0.8}
                              title="Hapus dari daftar"
                            >
                              <X size={16} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Android Mobile Form Cards (Zero Horizontal Scroll!) */}
              <div className="mobile-only-cards">
                {displayedRows.length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Tidak ada personil yang cocok dengan filter pencarian atau regu ini.
                  </div>
                ) : (
                  displayedRows.map((row, idx) => (
                    <div key={row.personilId} className="android-member-card">
                      <div className="android-member-card-header">
                        <div>
                          <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                            {row.nama}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.1rem' }}>
                            NRP: {row.nrp || '-'} · <span style={{ color: 'var(--color-primary)' }}>{row.jabatan}</span> · Regu: {row.regu || '-'}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveRowById(row.personilId)}
                          style={{
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            color: 'var(--color-danger)',
                            cursor: 'pointer',
                            padding: '0.4rem',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                          title="Hapus dari daftar"
                        >
                          <X size={15} />
                        </button>
                      </div>

                      {/* Controls Grid */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.65rem' }}>
                        <div>
                          <label style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>STATUS HADIR</label>
                          <select 
                            value={row.status} 
                            onChange={e => handleRowChangeById(row.personilId, 'status', e.target.value)} 
                            className="modern-select"
                            style={{ width: '100%', padding: '0.45rem 0.6rem', fontSize: '0.8rem' }}
                          >
                            <option value="Hadir">Hadir</option>
                            <option value="Tidak Hadir">Tidak Hadir</option>
                            <option value="Tukar Shift">Tukar Shift</option>
                            <option value="Sakit">Sakit</option>
                            <option value="Cuti">Cuti</option>
                            <option value="Mangkir">Mangkir</option>
                          </select>
                        </div>

                        <div>
                          <label style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>PLOTTING POS</label>
                          <select 
                            value={row.posPlotting} 
                            onChange={e => handleRowChangeById(row.personilId, 'posPlotting', e.target.value)} 
                            disabled={['Sakit', 'Cuti', 'Mangkir'].includes(row.status)}
                            className="modern-select"
                            style={{ width: '100%', padding: '0.45rem 0.6rem', fontSize: '0.8rem' }}
                          >
                            <option value="-">-</option>
                            {posList.map(p => (
                              <option key={p.id} value={p.titik}>{p.titik}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Alasan & Pengganti */}
                      {row.status !== 'Hadir' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', background: 'rgba(255,255,255,0.02)', padding: '0.65rem', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
                          <div>
                            <label style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.2rem' }}>ALASAN / KETERANGAN</label>
                            <input 
                              type="text" 
                              value={row.alasan} 
                              onChange={e => handleRowChangeById(row.personilId, 'alasan', e.target.value)} 
                              placeholder="Alasan tidak hadir..." 
                              className="modern-input" 
                              style={{ width: '100%', padding: '0.4rem 0.6rem', fontSize: '0.78rem' }}
                            />
                          </div>
                          
                          {(row.status === 'Tukar Shift' || row.status === 'Tidak Hadir') && (
                            <div>
                              <label style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.2rem' }}>PERSONIL PENGGANTI (BACKUP)</label>
                              <select 
                                value={row.penggantiId} 
                                onChange={e => handleRowChangeById(row.personilId, 'penggantiId', e.target.value)} 
                                className="modern-select"
                                style={{ width: '100%', padding: '0.4rem 0.6rem', fontSize: '0.78rem' }}
                              >
                                <option value="">-- Pilih Pengganti --</option>
                                {substituteOptions.map(opt => (
                                  <option key={opt.id} value={opt.id}>{opt.nama} ({opt.jabatan} - {opt.regu})</option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>
                      )}

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-glass)', paddingTop: '0.5rem' }}>
                        <span>Jam Dinas: <strong style={{ color: 'var(--text-primary)' }}>{row.jamDinas}</strong></span>
                        <span style={{ fontSize: '0.68rem', color: 'var(--color-primary)' }}>#{idx + 1}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '0.5rem' }}>
                <button type="submit" className="btn-primary" style={{ padding: '0.65rem 2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CheckCircle2 size={16} /> Simpan Absensi & Plotting
                </button>
              </div>
            </form>
          )}
        </div></div>
      )}

      {/* ========================================== */}
      {/* TAB 3: HISTORI ABSENSI */}
      {/* ========================================== */}
      {activeTab === 'history' && (
        <div className="android-tab-content"><div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <UserCheck size={20} className="text-primary" />
            <span>Histori Absensi & Plotting Terdaftar</span>
          </h3>
          
          <div className="grid-cols-3" style={{ gap: '1rem' }}>
            {attendanceLogs.length === 0 ? (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                Belum ada log absensi terdaftar. Silakan buat absensi baru di atas.
              </div>
            ) : (
              [...attendanceLogs].reverse().map((log, index) => {
                const presentCount = log.details.filter(d => d.status === 'Hadir' || d.status === 'Tukar Shift').length;
                return (
                  <div key={log.id || index} className="glass-panel" style={{ padding: '1rem', borderLeft: '3px solid var(--color-primary)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <div>
                        <h4 style={{ fontSize: '0.9rem', fontWeight: 800 }}>{log.regu}</h4>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{log.hari}, {log.tanggal}</p>
                      </div>
                      <span className="badge badge-info" style={{ fontSize: '0.6rem' }}>Shift {log.shift}</span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Jam Dinas:</span>
                        <span style={{ fontWeight: 600 }}>{log.jamDinas}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Kepatuhan Plotting:</span>
                        <span style={{ fontWeight: 600, color: 'var(--color-success)' }}>{presentCount} / {log.details.length} Personil</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div></div>
      )}

      {/* ========================================== */}
      {/* TAB 4: REKAP & LAPORAN LEMBURAN */}
      {/* ========================================== */}
      {activeTab === 'lemburan' && (
        <div className="android-tab-content"><div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <h3 style={{ fontSize: '1.1rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock size={20} className="text-primary" />
              <span>Rekapitulasi Lemburan & Penambahan Personil Dadakan</span>
            </h3>
            
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input 
                type="month" 
                value={selectedLemburMonth} 
                onChange={e => setSelectedLemburMonth(e.target.value)} 
                className="modern-input"
                style={{ padding: '0.4rem 0.8rem', fontSize: '0.82rem', fontFamily: 'var(--font-sans)', width: '150px' }}
              />
              <button 
                type="button" 
                onClick={handleExportLemburPDF} 
                className="btn-primary" 
                style={{ padding: '0.45rem 1rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
              >
                <FileText size={14} /> Ekspor PDF Lemburan
              </button>
            </div>
          </div>

          {/* KPI Mini Grid */}
          <div className="grid-cols-3" style={{ gap: '1rem' }}>
            <div className="glass-panel" style={{ padding: '1rem', borderLeft: '4px solid var(--color-primary)' }}>
              <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-secondary)' }}>TOTAL AKUMULASI LEMBUR</span>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.2rem' }}>
                {lemburStats.totalJam} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Jam</span>
              </div>
            </div>
            <div className="glass-panel" style={{ padding: '1rem', borderLeft: '4px solid var(--color-success)' }}>
              <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-secondary)' }}>TOTAL KEGIATAN LEMBUR</span>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.2rem' }}>
                {lemburStats.totalKegiatan} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Tugas</span>
              </div>
            </div>
            <div className="glass-panel" style={{ padding: '1rem', borderLeft: '4px solid var(--color-warning)' }}>
              <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-secondary)' }}>PERSONIL YANG LEMBUR</span>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.2rem' }}>
                {lemburStats.totalPersonil} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Orang</span>
              </div>
            </div>
          </div>

          {/* Desktop View Table */}
          <div className="desktop-only-table" style={{ overflowX: 'auto', border: '1px solid var(--border-glass)', borderRadius: '8px', background: 'rgba(0,0,0,0.1)' }}>
            <table className="absensi-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '950px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-glass)', background: 'rgba(255,255,255,0.01)' }}>
                  <th style={{ padding: '0.75rem', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)' }}>No</th>
                  <th style={{ padding: '0.75rem', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Tanggal</th>
                  <th style={{ padding: '0.75rem', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Nama Personil</th>
                  <th style={{ padding: '0.75rem', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Shift</th>
                  <th style={{ padding: '0.75rem', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Durasi</th>
                  <th style={{ padding: '0.75rem', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Jam Masuk/Pulang</th>
                  <th style={{ padding: '0.75rem', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Verifikasi GPS</th>
                  <th style={{ padding: '0.75rem', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', textAlign: 'center' }}>Foto Selfie</th>
                  <th style={{ padding: '0.75rem', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Alasan / Keperluan</th>
                </tr>
              </thead>
              <tbody>
                {lemburanRows.length === 0 ? (
                  <tr>
                    <td colSpan="9" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      Tidak ditemukan riwayat lemburan untuk filter regu/bulan yang dipilih.
                    </td>
                  </tr>
                ) : (
                  lemburanRows.map((row, idx) => {
                    const d = row.detail;
                    return (
                      <tr key={`${row.logId}-${idx}`} style={{ borderBottom: '1px solid var(--border-glass)', transition: 'background 0.2s' }}>
                        <td style={{ padding: '0.75rem', fontSize: '0.75rem', fontWeight: 600 }}>{idx + 1}</td>
                        <td style={{ padding: '0.75rem', fontSize: '0.75rem' }}>
                          <span style={{ fontWeight: 700 }}>{row.hari}</span>
                          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{row.tanggal}</div>
                        </td>
                        <td style={{ padding: '0.75rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <img 
                              src={d.fotoSelfie || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=40'} 
                              alt="" 
                              style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover', border: '1.5px solid rgba(124,58,237,0.3)' }}
                              onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=40'; }}
                            />
                            <div>
                              <div style={{ fontWeight: 800, fontSize: '0.78rem' }}>{d.nama}</div>
                              <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>NRP: {d.nrp} · {d.regu}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '0.75rem', fontSize: '0.75rem' }}>
                          <span className="badge badge-info" style={{ fontSize: '0.65rem' }}>Shift {row.shift}</span>
                        </td>
                        <td style={{ padding: '0.75rem', fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                          {parseInt(d.jamLembur, 10) || 8} Jam
                        </td>
                        <td style={{ padding: '0.75rem', fontSize: '0.72rem', lineHeight: '1.4' }}>
                          <div>🟢 {d.checkInTime || '-'}</div>
                          {d.checkOutTime && <div style={{ color: 'var(--color-danger)' }}>🔴 {d.checkOutTime}</div>}
                        </td>
                        <td style={{ padding: '0.75rem', fontSize: '0.68rem', fontFamily: 'monospace', lineHeight: '1.3' }}>
                          {d.lat && d.lng ? (
                            <>
                              <div>Lat: {Number(d.lat).toFixed(4)}</div>
                              <div>Long: {Number(d.lng).toFixed(4)}</div>
                            </>
                          ) : (
                            <span style={{ color: 'var(--text-muted)' }}>-</span>
                          )}
                        </td>
                        <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                          {d.fotoSelfie ? (
                            <img 
                              src={d.fotoSelfie} 
                              alt="Selfie" 
                              style={{ width: '42px', height: '42px', borderRadius: '6px', objectFit: 'cover', border: '1px solid var(--border-glass)', cursor: 'pointer' }}
                              onClick={() => {
                                const w = window.open();
                                if (w) {
                                  w.document.write(`<img src="${d.fotoSelfie}" style="max-width:100%; max-height:100vh; display:block; margin:auto;" />`);
                                  w.document.close();
                                }
                              }}
                            />
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>-</span>
                          )}
                        </td>
                        <td style={{ padding: '0.75rem', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                          {d.alasan || 'Lembur / Backup'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Android Mobile Lembur Cards (Zero Horizontal Scroll!) */}
          <div className="mobile-only-cards">
            {lemburanRows.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                Tidak ditemukan riwayat lemburan untuk filter regu/bulan yang dipilih.
              </div>
            ) : (
              lemburanRows.map((row, idx) => {
                const d = row.detail;
                return (
                  <div key={`${row.logId}-${idx}`} className="android-member-card">
                    <div className="android-member-card-header">
                      <div className="android-member-info">
                        <img 
                          src={d.fotoSelfie || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=40'} 
                          alt="" 
                          className="android-member-avatar"
                          onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=40'; }}
                        />
                        <div>
                          <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-primary)' }}>{d.nama}</div>
                          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>NRP: {d.nrp} · {d.regu}</div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span className="badge badge-info" style={{ fontSize: '0.65rem' }}>Shift {row.shift}</span>
                        <div style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--color-primary)', marginTop: '0.15rem' }}>
                          {parseInt(d.jamLembur, 10) || 8} Jam
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', background: 'rgba(255,255,255,0.02)', padding: '0.55rem', borderRadius: '8px', border: '1px solid var(--border-glass)', fontSize: '0.72rem' }}>
                      <div>
                        <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', display: 'block' }}>TANGGAL</span>
                        <strong>{row.hari}, {row.tanggal}</strong>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', display: 'block' }}>PRESENSI MASUK/PULANG</span>
                        <div>🟢 {d.checkInTime || '-'} {d.checkOutTime ? `· 🔴 ${d.checkOutTime}` : ''}</div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Keperluan: <strong>{d.alasan || 'Lembur / Backup'}</strong></span>
                      {d.lat && d.lng ? (
                        <span style={{ fontSize: '0.65rem', color: '#10b981', fontWeight: 700 }}>
                          📍 GPS Valid
                        </span>
                      ) : null}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div></div>
      )}

      {/* ======================================================== */}
      {/* FUTURISTIC DETAILED AUDIT MODAL (ANTI-FRAUD) */}
      {/* ======================================================== */}
      {selectedAuditLog && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(5, 8, 16, 0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1rem'
        }} onClick={() => setSelectedAuditLog(null)}>
          <div style={{
            background: 'rgba(15, 23, 42, 0.95)',
            border: '1px solid var(--border-glass)',
            borderRadius: '16px',
            maxWidth: '500px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            padding: '1.25rem',
            position: 'relative'
          }} onClick={e => e.stopPropagation()}>
            
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.65rem' }}>
              <h3 style={{ fontSize: '0.98rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '0.45rem', color: 'var(--text-primary)' }}>
                <Shield size={18} className="text-primary" />
                <span>Rincian Keamanan Presensi JDC</span>
              </h3>
              <button 
                onClick={() => setSelectedAuditLog(null)} 
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Profile Overview */}
            <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '0.65rem', borderRadius: '10px', border: '1px solid var(--border-glass)' }}>
              <img 
                src={selectedAuditLog.member.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'} 
                alt="" 
                style={{ width: '46px', height: '46px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--color-primary)' }} 
                onError={e => e.target.src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
              />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{selectedAuditLog.member.nama}</strong>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>NRP: {selectedAuditLog.member.nrp} · {selectedAuditLog.member.jabatan}</span>
                <span style={{ fontSize: '0.72rem', color: 'var(--color-primary)', fontWeight: 700 }}>{selectedAuditLog.member.regu || 'Semua Regu'}</span>
              </div>
            </div>

            {/* Shift & Time Details */}
            <div className="grid-cols-2" style={{ gap: '0.65rem', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)' }}>
              <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-glass)', padding: '0.5rem 0.65rem', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>JAM DINAS / SHIFT</div>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.15rem' }}>
                  {selectedAuditLog.attRow.jamDinas}
                </div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-glass)', padding: '0.5rem 0.65rem', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>PLOTTING POS JAGA</div>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#06b6d4', marginTop: '0.15rem' }}>
                  📍 {selectedAuditLog.attRow.posPlotting}
                </div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-glass)', padding: '0.5rem 0.65rem', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>PRESENSI MASUK</div>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-success)', marginTop: '0.15rem' }}>
                  {selectedAuditLog.attRow.checkInTime || '-'}
                </div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-glass)', padding: '0.5rem 0.65rem', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>PRESENSI PULANG</div>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-danger)', marginTop: '0.15rem' }}>
                  {selectedAuditLog.attRow.checkOutTime || 'Belum Pulang'}
                </div>
              </div>
            </div>

            {/* Selfie Snapshot & Liveness Info */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
              <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-secondary)' }}>FOTO SELFIE & VERIFIKASI WAJAH (ANTI-FAKE)</span>
              <div style={{ position: 'relative', width: '100%', height: '180px', borderRadius: '10px', overflow: 'hidden', border: '1px solid var(--border-glass)', background: '#090d16', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {selectedAuditLog.attRow.fotoSelfie ? (
                  <>
                    <img 
                      src={selectedAuditLog.attRow.fotoSelfie} 
                      alt="Selfie Check-in" 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    {/* Glowing face mesh box overlay */}
                    <div style={{
                      position: 'absolute',
                      border: '2.5px solid #10b981',
                      borderRadius: '50%',
                      width: '90px',
                      height: '115px',
                      boxShadow: '0 0 15px #10b981, inset 0 0 10px #10b981',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      pointerEvents: 'none'
                    }}>
                      <span style={{ background: '#10b981', color: 'white', fontSize: '0.45rem', fontWeight: 900, padding: '1px 3px', borderRadius: '3px', position: 'absolute', top: '-10px', whiteSpace: 'nowrap' }}>FACE OK</span>
                    </div>
                  </>
                ) : (
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Tidak ada foto selfie terlampir</div>
                )}
                
                {/* Liveness Tag overlay */}
                <div style={{
                  position: 'absolute',
                  top: '8px',
                  right: '8px',
                  background: selectedAuditLog.attRow.isLivenessVerified ? 'rgba(16,185,129,0.9)' : 'rgba(245,158,11,0.9)',
                  padding: '0.2rem 0.5rem',
                  borderRadius: '5px',
                  fontSize: '0.58rem',
                  fontWeight: 800,
                  color: 'white',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.3)'
                }}>
                  {selectedAuditLog.attRow.isLivenessVerified ? 'Liveness Lulus (Anti-Fake)' : 'Liveness N/A (Manual)'}
                </div>
              </div>
            </div>

            {/* GPS Anti-Fake & Location */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
              <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-secondary)' }}>KOORDINAT LOKASI & DETEKSI GPS PALSU</span>
              <div style={{ background: 'rgba(0,0,0,0.15)', border: '1px solid var(--border-glass)', padding: '0.75rem', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    <MapPin size={13} className="text-primary" />
                    <span>Lokasi GPS</span>
                  </div>
                  {selectedAuditLog.attRow.lat && selectedAuditLog.attRow.lng ? (
                    <a 
                      href={`https://www.google.com/maps/search/?api=1&query=${selectedAuditLog.attRow.lat},${selectedAuditLog.attRow.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-secondary"
                      style={{ fontSize: '0.65rem', padding: '0.2rem 0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem', textDecoration: 'none' }}
                    >
                      <ExternalLink size={10} /> Buka Peta
                    </a>
                  ) : null}
                </div>

                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                  Latitude: {selectedAuditLog.attRow.lat || '-'}<br />
                  Longitude: {selectedAuditLog.attRow.lng || '-'}
                </div>

                <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '0.4rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                  {/* Developer options check */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Opsi Pengembang (Dev Options):</span>
                    <strong style={{ color: selectedAuditLog.attRow.developerOptionsEnabled ? '#ef4444' : '#10b981' }}>
                      {selectedAuditLog.attRow.developerOptionsEnabled ? 'AKTIF ❌ (Ditolak)' : 'NON-AKTIF ✅ (Aman)'}
                    </strong>
                  </div>
                  {/* Mock GPS check */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Deteksi Fake GPS (Mock Location):</span>
                    <strong style={{ color: selectedAuditLog.attRow.isMockLocation ? '#ef4444' : '#10b981' }}>
                      {selectedAuditLog.attRow.isMockLocation ? 'TERDETEKSI MOCK ❌' : 'GPS FISIK AMAN ✅'}
                    </strong>
                  </div>
                  {/* GPS Accuracy */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Akurasi Sinyal GPS:</span>
                    <strong style={{ color: 'var(--text-primary)' }}>
                      {selectedAuditLog.attRow.gpsAccuracy ? `${Number(selectedAuditLog.attRow.gpsAccuracy).toFixed(1)} meter` : 'N/A'}
                    </strong>
                  </div>
                  {/* Device info */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Perangkat Pengirim:</span>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.65rem', maxWidth: '240px', textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={selectedAuditLog.attRow.deviceInfo}>
                      {selectedAuditLog.attRow.deviceInfo || 'PWA Web Browser'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <button 
              type="button" 
              onClick={() => setSelectedAuditLog(null)} 
              className="btn-primary btn-full"
              style={{ padding: '0.6rem', fontWeight: 700, fontSize: '0.8rem', marginTop: '0.25rem' }}
            >
              Tutup Rincian Audit
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


// ─── Sub-komponen: Absensi Harian Berbasis Roster ────────────────────────────
function AbsensiRosterHarian({ users, posList, attendanceLogs, onAddAttendance, reports, todayStr, getJamDinas }) {
  const yearMonth = getYearMonth(new Date(todayStr));
  const rosterData = getRoster(yearMonth);

  const scheduledByShift = useMemo(() => {
    const map = {};
    Object.entries(rosterData).forEach(([userId, dates]) => {
      const code = dates[todayStr];
      if (!code || code === 'X') return;
      const user = users.find(u => String(u.id) === String(userId));
      if (!user) return;
      if (!map[code]) map[code] = [];
      map[code].push({ user, shiftCode: code });
    });
    return map;
  }, [rosterData, users, todayStr]);

  const activeShifts = useMemo(() => Object.keys(scheduledByShift).sort(), [scheduledByShift]);
  const [selectedShift, setSelectedShift] = useState(() => activeShifts[0] || 'P');
  const [extraUsers, setExtraUsers] = useState([]);
  const [rows, setRows] = useState([]);
  const [saveStatus, setSaveStatus] = useState('');

  useEffect(() => {
    const shift = selectedShift;
    const existingLog = attendanceLogs.find(
      l => l.tanggal === todayStr && l.shift === shift && l.isRosterBased
    );
    if (existingLog) {
      setRows(existingLog.details);
      setExtraUsers([]);
    } else {
      const scheduled = (scheduledByShift[shift] || []).map(({ user }) => ({
        personilId: user.id,
        nama: user.nama,
        jabatan: user.jabatan,
        regu: user.regu || '-',
        status: 'Hadir',
        alasan: '',
        penggantiId: '',
        posPlotting: posList[0]?.titik || '-',
        jamDinas: getJamDinas(shift)
      }));
      setRows(scheduled);
      setExtraUsers([]);
    }
  }, [selectedShift, scheduledByShift, attendanceLogs, todayStr, posList]);

  const handleRowChange = (idx, field, value) => {
    setRows(prev => prev.map((row, i) => {
      if (i !== idx) return row;
      const updated = { ...row, [field]: value };
      if (field === 'status') {
        if (['Sakit', 'Cuti', 'Mangkir', 'Tidak Hadir'].includes(value)) { updated.posPlotting = '-'; updated.alasan = value; }
        else if (value === 'Hadir') { updated.alasan = ''; }
      }
      return updated;
    }));
  };

  const handleAddExtra = () => {
    const noSchedule = users.filter(u => {
      const code = rosterData[String(u.id)]?.[todayStr];
      return (!code || code === 'X') && ['Danru','Wadanru','Anggota','BKO','KH (Khusus)'].includes(u.jabatan);
    });
    setExtraUsers(noSchedule);
  };

  const handleAddExtraUser = (userId) => {
    const user = users.find(u => String(u.id) === String(userId));
    if (!user || rows.find(r => String(r.personilId) === String(userId))) return;
    setRows(prev => [...prev, {
      personilId: user.id, nama: user.nama, jabatan: user.jabatan, regu: user.regu || '-',
      status: 'Tukar Shift', alasan: 'Backup / Lembur', penggantiId: '',
      posPlotting: posList[0]?.titik || '-', jamDinas: getJamDinas(selectedShift)
    }]);
    setExtraUsers([]);
  };

  const handleSave = () => {
    if (rows.length === 0) { alert('Tidak ada personil yang dijadwalkan.'); return; }
    onAddAttendance({
      tanggal: todayStr,
      hari: ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'][new Date(todayStr).getDay()],
      regu: `Roster-${selectedShift}`,
      shift: selectedShift,
      jamDinas: getJamDinas(selectedShift),
      isRosterBased: true,
      details: rows
    });
    setSaveStatus('✓ Absensi harian berhasil disimpan!');
    setTimeout(() => setSaveStatus(''), 3000);
  };

  if (activeShifts.length === 0) {
    return (
      <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
        <div style={{ fontSize: '2.5rem' }}>📅</div>
        <h4 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Belum Ada Roster Hari Ini</h4>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', maxWidth: '400px', lineHeight: '1.5' }}>
          Jadwal kerja untuk hari ini (<strong>{todayStr}</strong>) belum diinput di Roster Jadwal Bulanan. Minta Admin/SPV untuk mengisinya.
        </p>
      </div>
    );
  }

  const shiftInfo = SHIFT_CODES[selectedShift] || {};

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div className="glass-panel" style={{ padding: '1rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {activeShifts.map(code => {
            const info = SHIFT_CODES[code] || {};
            return (
              <button key={code} onClick={() => setSelectedShift(code)} style={{
                padding: '0.45rem 0.9rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700,
                border: `2px solid ${selectedShift === code ? (info.color || 'var(--color-primary)') : 'var(--border-glass)'}`,
                background: selectedShift === code ? (info.bg || 'rgba(59,130,246,0.12)') : 'transparent',
                color: selectedShift === code ? (info.color || 'var(--color-primary)') : 'var(--text-secondary)', cursor: 'pointer'
              }}>
                {code} — {info.label || code} ({info.jam || '-'}) · {(scheduledByShift[code] || []).length} org
              </button>
            );
          })}
        </div>
        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>📅 {todayStr}</span>
      </div>

      <div className="glass-panel" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Shield size={16} style={{ color: shiftInfo.color || 'var(--color-primary)' }} />
            Shift {selectedShift} — {shiftInfo.label} ({shiftInfo.jam})
            <span style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-muted)', marginLeft: '0.4rem' }}>{rows.length} personil terjadwal</span>
          </h4>
          <button onClick={handleAddExtra} style={{ padding: '0.35rem 0.75rem', borderRadius: '6px', border: '1px dashed var(--color-primary)', background: 'rgba(59,130,246,0.08)', color: 'var(--color-primary)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700 }}>
            + Tambah Ekstra / Lembur
          </button>
        </div>

        {extraUsers.length > 0 && (
          <div style={{ marginBottom: '1rem', padding: '0.75rem', background: 'rgba(59,130,246,0.07)', borderRadius: '8px', border: '1px solid rgba(59,130,246,0.2)' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--color-primary)' }}>Pilih personil ekstra:</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {extraUsers.map(u => (
                <button key={u.id} onClick={() => handleAddExtraUser(u.id)} style={{ padding: '0.25rem 0.6rem', borderRadius: '5px', border: '1px solid var(--border-glass)', background: 'var(--bg-card)', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '0.72rem' }}>
                  {u.nama} ({u.jabatan})
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Desktop View Table */}
        <div className="desktop-only-table" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '750px', fontSize: '0.8rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-glass)', background: 'rgba(255,255,255,0.01)' }}>
                {['No', 'Nama', 'Jabatan / Regu', 'Status Hadir', 'Keterangan', 'Plotting Pos', 'Jam Dinas'].map(h => (
                  <th key={h} style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan="7" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Tidak ada personil dijadwalkan untuk shift ini.</td></tr>
              ) : rows.map((row, idx) => (
                <tr key={`${row.personilId}-${idx}`} style={{ borderBottom: '1px solid var(--border-glass)' }}>
                  <td style={{ padding: '0.65rem 0.75rem', fontWeight: 600 }}>{idx + 1}</td>
                  <td style={{ padding: '0.65rem 0.75rem', fontWeight: 700 }}>
                    <span 
                      style={{ cursor: 'pointer', color: 'var(--color-primary)', textDecoration: 'underline' }}
                      onClick={() => onShowAudit && onShowAudit(row.personilId)}
                      title="Klik untuk detail audit presensi"
                    >
                      {row.nama}
                    </span>
                  </td>
                  <td style={{ padding: '0.65rem 0.75rem', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{row.jabatan} · {row.regu}</td>
                  <td style={{ padding: '0.65rem 0.75rem' }}>
                    <select value={row.status} onChange={e => handleRowChange(idx, 'status', e.target.value)} className="modern-select" style={{ padding: '0.3rem 0.5rem', fontSize: '0.75rem' }}>
                      {['Hadir', 'Tukar Shift', 'Sakit', 'Cuti', 'Mangkir', 'Tidak Hadir'].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td style={{ padding: '0.65rem 0.75rem' }}>
                    <input type="text" value={row.alasan} onChange={e => handleRowChange(idx, 'alasan', e.target.value)} className="modern-input" style={{ fontSize: '0.75rem', padding: '0.3rem 0.5rem' }} placeholder="-" />
                  </td>
                  <td style={{ padding: '0.65rem 0.75rem' }}>
                    <select value={row.posPlotting} onChange={e => handleRowChange(idx, 'posPlotting', e.target.value)} className="modern-select" style={{ padding: '0.3rem 0.5rem', fontSize: '0.75rem' }} disabled={['Sakit','Cuti','Mangkir'].includes(row.status)}>
                      <option value="-">-</option>
                      {posList.map(p => <option key={p.id} value={p.titik}>{p.titik}</option>)}
                    </select>
                  </td>
                  <td style={{ padding: '0.65rem 0.75rem', fontSize: '0.72rem', color: 'var(--text-muted)' }}>{row.jamDinas}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Android Mobile Personil Cards (Zero Horizontal Scroll!) */}
        <div className="mobile-only-cards">
          {rows.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              Tidak ada personil dijadwalkan untuk shift ini.
            </div>
          ) : (
            rows.map((row, idx) => (
              <div key={`${row.personilId}-${idx}`} className="android-member-card">
                <div className="android-member-card-header">
                  <div>
                    <div 
                      style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--color-primary)', cursor: 'pointer', textDecoration: 'underline' }}
                      onClick={() => onShowAudit && onShowAudit(row.personilId)}
                      title="Klik untuk detail audit presensi"
                    >
                      {row.nama}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                      {row.jabatan} · <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{row.regu}</span>
                    </div>
                  </div>
                  <span style={{ fontSize: '0.68rem', fontWeight: 800, padding: '0.2rem 0.5rem', borderRadius: '6px', background: 'rgba(59,130,246,0.15)', color: '#3b82f6' }}>
                    #{idx + 1}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.65rem' }}>
                  <div>
                    <label style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>STATUS HADIR</label>
                    <select 
                      value={row.status} 
                      onChange={e => handleRowChange(idx, 'status', e.target.value)} 
                      className="modern-select" 
                      style={{ width: '100%', padding: '0.45rem 0.6rem', fontSize: '0.8rem' }}
                    >
                      {['Hadir', 'Tukar Shift', 'Sakit', 'Cuti', 'Mangkir', 'Tidak Hadir'].map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>PLOTTING POS</label>
                    <select 
                      value={row.posPlotting} 
                      onChange={e => handleRowChange(idx, 'posPlotting', e.target.value)} 
                      className="modern-select" 
                      style={{ width: '100%', padding: '0.45rem 0.6rem', fontSize: '0.8rem' }} 
                      disabled={['Sakit','Cuti','Mangkir'].includes(row.status)}
                    >
                      <option value="-">-</option>
                      {posList.map(p => (
                        <option key={p.id} value={p.titik}>{p.titik}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {row.status !== 'Hadir' && (
                  <div>
                    <label style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.2rem' }}>KETERANGAN / ALASAN</label>
                    <input 
                      type="text" 
                      value={row.alasan} 
                      onChange={e => handleRowChange(idx, 'alasan', e.target.value)} 
                      className="modern-input" 
                      style={{ width: '100%', fontSize: '0.78rem', padding: '0.4rem 0.6rem' }} 
                      placeholder="Masukkan alasan atau keterangan..." 
                    />
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-glass)', paddingTop: '0.45rem' }}>
                  <span>Jam Dinas: <strong style={{ color: 'var(--text-primary)' }}>{row.jamDinas}</strong></span>
                  <span style={{ fontSize: '0.68rem', color: 'var(--color-primary)' }}>Shift {selectedShift}</span>
                </div>
              </div>
            ))
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem', gap: '1rem', alignItems: 'center' }}>
          {saveStatus && <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>{saveStatus}</span>}
          <button onClick={handleSave} className="btn-primary" style={{ padding: '0.6rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <CheckCircle2 size={15} /> Simpan Absensi Shift {selectedShift}
          </button>
        </div>
      </div>
    </div>
  );
}
