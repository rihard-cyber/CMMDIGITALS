import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import {
  Plus, Download, Printer, Layers, Check,
  Building, User, UserCheck, Phone, Hash,
  RefreshCw, AlertTriangle, Edit3, Trash2, X,
  MapPin, QrCode, Shield, ArrowUpDown
} from 'lucide-react';

import QRCode from 'qrcode';
import { exportTableToPdf, formatDateForFile } from '../utils/exportPdf';
import { hapticLight } from '../utils/haptics';

const FLOOR_OPTIONS = [
  { value: 'Basement', label: 'Basement' },
  { value: '1', label: 'Lantai 1' },
  { value: '2', label: 'Lantai 2' },
  { value: '3', label: 'Lantai 3' },
  { value: '4', label: 'Lantai 4' },
  { value: '5', label: 'Lantai 5' },
  { value: '6', label: 'Lantai 6' },
  { value: 'Halaman Depan', label: 'Halaman Depan' },
  { value: 'Halaman Samping Kanan', label: 'Halaman Samping Kanan' },
  { value: 'Halaman Samping Kiri', label: 'Halaman Samping Kiri' },
  { value: 'Halaman Belakang', label: 'Halaman Belakang' },
];

const ZONE_OPTIONS = ['A', 'B', 'C', 'D', 'Lobby', 'Halaman Depan', 'Halaman Belakang', 'Posco Security', 'Petugas Teknik', 'Lapangan Padel', 'Area Padel'];

const FLOOR_OPTIONS_POS = [
  { value: 'Basement', label: 'Basement' },
  { value: '1', label: 'Lantai 1' },
  { value: '2 & 3', label: 'Lantai 2 & 3' },
  { value: '4 & 5', label: 'Lantai 4 & 5' },
  { value: '6 & 7', label: 'Lantai 6 & 7' },
  { value: 'Halaman Depan', label: 'Halaman Depan' },
  { value: 'Halaman Belakang', label: 'Halaman Belakang' },
  { value: 'Parkir', label: 'Parkir' },
];

const QR_LOCATION_CODES = {
  'Basement': 'BSMT',
  '1': 'LT01','2': 'LT02','3': 'LT03','4': 'LT04','5': 'LT05','6': 'LT06',
  'Halaman Depan': 'HD',
  'Halaman Samping Kanan': 'HSKN',
  'Halaman Samping Kiri': 'HSKR',
  'Halaman Belakang': 'HB',
};

const QR_ZONE_CODES = {
  'A': 'A',
  'B': 'B',
  'C': 'C',
  'D': 'D',
  'Lobby': 'LOBBY',
  'Halaman Depan': 'HD',
  'Halaman Belakang': 'HB',
  'Posco Security': 'PS',
  'Petugas Teknik': 'PT',
  'Lapangan Padel': 'LP',
  'Area Padel': 'AP',
};

const FLOOR_ORDER = {
  'Basement': 0,
  '1': 1, 'Lantai 1': 1,
  '2': 2, 'Lantai 2': 2,
  '3': 3, 'Lantai 3': 3,
  '4': 4, 'Lantai 4': 4,
  '5': 5, 'Lantai 5': 5,
  '6': 6, 'Lantai 6': 6,
  'Halaman Depan': 7,
  'Halaman Samping Kanan': 8,
  'Halaman Belakang': 9,
  'Halaman Samping Kiri': 10,
};

export const getFloorCode = (floorVal) => {
  if (QR_LOCATION_CODES[floorVal]) return QR_LOCATION_CODES[floorVal];
  const clean = (floorVal || '').replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  return clean || 'LT';
};

export const getZoneCode = (zoneVal) => {
  if (QR_ZONE_CODES[zoneVal]) return QR_ZONE_CODES[zoneVal];
  const clean = (zoneVal || '').replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  return clean || 'A';
};

export const buildBarcodeCode = (floorVal, zoneVal, numVal) => {
  const fCode = getFloorCode(floorVal);
  const zCode = getZoneCode(zoneVal);
  const nCode = String(numVal || '').trim();
  return `JDC-${fCode}-${zCode}-${nCode}`;
};

const REGU_OPTIONS = ['Regu A', 'Regu B', 'Regu C', 'Regu D'];
const SHIFT_OPTIONS = [
  { value: 'Pagi', label: 'Pagi 06-14' },
  { value: 'Siang', label: 'Siang 14-22' },
  { value: 'Malam', label: 'Malam 22-06' }
];

export default function BarcodeGenerator({
  areas, onAddArea, onUpdateArea, onDeleteArea,
  posList = [], onAddPos, onUpdatePos, onDeletePos,
  users, onAddUser, addToast
}) {
  const [tab, setTab] = useState('checkpoint');
  const [searchArea, setSearchArea] = useState('');
  const [searchPos, setSearchPos] = useState('');
  const [editArea, setEditArea] = useState(null);
  const [editPos, setEditPos] = useState(null);
  const canvasRef = useRef(null);
  const [presensiQrUrl, setPresensiQrUrl] = useState('');

  // ── Single Area Creator state ──
  const [floor, setFloor] = useState('1');
  const [floorCustom, setFloorCustom] = useState('');
  const [zone, setZone] = useState('A');
  const [zoneCustom, setZoneCustom] = useState('');
  const [titik, setTitik] = useState('');
  const [nomorTitik, setNomorTitik] = useState('');
  const [qrCounter, setQrCounter] = useState(() => {
    try { return parseInt(localStorage.getItem('smpjdc_qr_counter') || '1'); }
    catch { return 1; }
  });

  // ── Edit Area state ──
  const [eFloor, setEFloor] = useState('1');
  const [eFloorCustom, setEFloorCustom] = useState('');
  const [eZone, setEZone] = useState('A');
  const [eZoneCustom, setEZoneCustom] = useState('');
  const [eTitik, setETitik] = useState('');
  const [eNomorTitik, setENomorTitik] = useState('');
  const [eQrCode, setEQrCode] = useState('');

  // ── Pos Jaga state ──
  const [posLantai, setPosLantai] = useState('Basement');
  const [posLantaiCustom, setPosLantaiCustom] = useState('');
  const [posTitik, setPosTitik] = useState('');
  const [posKeterangan, setPosKeterangan] = useState('');
  const [posKode, setPosKode] = useState('');

  // ── Edit Pos state ──
  const [ePosLantai, setEPosLantai] = useState('Basement');
  const [ePosLantaiCustom, setEPosLantaiCustom] = useState('');
  const [ePosTitik, setEPosTitik] = useState('');
  const [ePosKeterangan, setEPosKeterangan] = useState('');
  const [ePosKode, setEPosKode] = useState('');

  const generateQRDataURL = useCallback(async (text) => {
    try {
      return await QRCode.toDataURL(text, { width: 400, margin: 2, color: { dark: '#0b0f19', light: '#ffffff' } });
    } catch {
      return await QRCode.toDataURL(text, { width: 400, margin: 2 });
    }
  }, []);

  useEffect(() => {
    const nums = areas.map(a => parseInt(a.nomorTitik, 10)).filter(n => !isNaN(n));
    const next = nums.length > 0 ? String(Math.max(...nums) + 1) : '1';
    setNomorTitik(next);
  }, [areas]);

  useEffect(() => {
    generateQRDataURL('JDC-MASTER-PRESENSI')
      .then(url => setPresensiQrUrl(url))
      .catch(err => console.warn('Failed to load Master Presensi QR:', err));
  }, [generateQRDataURL]);

  // ── User & Role Creator state ──
  const [userName, setUserName] = useState('');
  const [userNrp, setUserNrp] = useState('');
  const [userRole, setUserRole] = useState('Anggota');
  const [userAvatar, setUserAvatar] = useState('');
  const [userPin, setUserPin] = useState('');
  const [userRegu, setUserRegu] = useState('Regu A');
  const [userShift, setUserShift] = useState('Pagi');
  const [userHp, setUserHp] = useState('');

  const handleUserSubmit = (e) => {
    e.preventDefault();
    if (!userName.trim() || !userNrp.trim()) {
      alert('Nama dan NRP wajib diisi!');
      return;
    }
    if (userPin.length > 0 && userPin.length < 4) {
      alert('PIN minimal 4 digit (kosongkan jika tidak ingin PIN)');
      return;
    }
    if (users && users.some(u => u.nrp === userNrp)) {
      alert(`Error: NRP ${userNrp} sudah digunakan oleh anggota lain!`);
      return;
    }

    onAddUser({
      nama: userName, nrp: userNrp, jabatan: userRole,
      avatar: userAvatar, pin: userPin || userNrp.slice(-4),
      regu: userRegu, shift: userShift, nomorHp: userHp, status: 'Aktif'
    });

    setUserName(''); setUserNrp(''); setUserRole('Anggota');
    setUserAvatar(''); setUserPin(''); setUserRegu('Regu A');
    setUserShift('Pagi'); setUserHp('');
  };

  const floorFinal = floor === '__LAINNYA__' ? (floorCustom.trim() || 'Custom') : floor;
  const zoneFinal = zone === '__LAINNYA__' ? (zoneCustom.trim() || 'Custom') : zone;
  const qrLocCode = QR_LOCATION_CODES[floor] || floorFinal.replace(/[^A-Za-z0-9]/g, '').toUpperCase();

  const getQRPattern = () => {
    const num = String(qrCounter).padStart(3, '0');
    return `QR-${qrLocCode}-${num}`;
  };

  const getSortedAreas = useCallback((items) => {
    if (!items || !Array.isArray(items)) return [];

    // Filter duplicates by QR Code, (lantai + titik), and nomorTitik
    const seenQr = new Set();
    const seenLoc = new Set();
    const seenNum = new Set();
    const unique = [];

    for (const a of items) {
      if (!a) continue;
      const qr = (a.qrCode || '').toUpperCase().trim();
      const num = String(a.nomorTitik || '').trim();
      const locKey = `${(a.lantai || '').toLowerCase()}|${(a.titik || '').toLowerCase()}`;

      if (qr && seenQr.has(qr)) continue;
      if (seenLoc.has(locKey)) continue;
      if (num && seenNum.has(num)) continue;

      if (qr) seenQr.add(qr);
      seenLoc.add(locKey);
      if (num) seenNum.add(num);
      unique.push(a);
    }

    return unique.sort((a, b) => {
      const na = parseInt(a.nomorTitik, 10);
      const nb = parseInt(b.nomorTitik, 10);
      const hasNa = !isNaN(na);
      const hasNb = !isNaN(nb);
      if (hasNa && hasNb && na !== nb) return na - nb;
      if (hasNa && !hasNb) return -1;
      if (!hasNa && hasNb) return 1;
      const fa = FLOOR_ORDER[a.lantai] !== undefined ? FLOOR_ORDER[a.lantai] : 99;
      const fb = FLOOR_ORDER[b.lantai] !== undefined ? FLOOR_ORDER[b.lantai] : 99;
      if (fa !== fb) return fa - fb;
      const za = (a.zona || '').localeCompare(b.zona || '');
      if (za !== 0) return za;
      return (a.titik || '').localeCompare(b.titik || '');
    });
  }, []);

  const handleAdd = (e) => {
    e.preventDefault();
    if (!titik.trim()) { alert('Lokasi tidak boleh kosong!'); return; }
    const inputNomor = nomorTitik.trim();
    if (inputNomor) {
      const existing = areas.find(a => String(a.nomorTitik).trim() === inputNomor);
      if (existing) {
        alert(`Nomor titik ${inputNomor} sudah digunakan untuk lokasi "${existing.titik}"! Masukkan nomor lain agar tidak dobel.`);
        return;
      }
    }
    const qrCode = inputNomor
      ? buildBarcodeCode(floorFinal, zoneFinal, inputNomor)
      : getQRPattern();
    onAddArea({
      gedung: 'SMPJDC - Jakarta Design Center',
      lantai: floorFinal,
      zona: zoneFinal,
      nomorTitik: inputNomor,
      titik: titik.trim(),
      qrCode
    });
    const newCount = qrCounter + 1;
    setQrCounter(newCount);
    localStorage.setItem('smpjdc_qr_counter', String(newCount));
    setTitik('');
  };

  const handleDownloadQR = async (area) => {
    if (downloadingId) return;
    setDownloadingId(area.id);
    if (addToast) addToast(`Menyiapkan QR ${area.qrCode}...`, 'info');
    try {
      const dataUrl = await generateQRDataURL(area.qrCode);
      const link = document.createElement('a');
      link.download = `${area.qrCode}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      if (addToast) addToast(`QR ${area.qrCode} berhasil didownload`, 'success');
    } catch (err) {
      console.error('Download QR failed:', err);
      if (addToast) addToast('Gagal download QR, coba lagi', 'danger');
    } finally {
      setDownloadingId(null);
    }
  };

  const handlePrintQR = async (area) => {
    if (printLoadingId) return;
    setPrintLoadingId(area.id);
    const printWin = window.open('', '_blank', 'width=450,height=600');
    if (!printWin || printWin.closed || typeof printWin.closed === 'undefined') {
      if (addToast) addToast('Izinkan popup untuk mencetak barcode', 'warning');
      else alert('Izinkan popup untuk mencetak barcode, atau cetak manual.');
      setPrintLoadingId(null);
      return;
    }
    if (addToast) addToast(`Menyiapkan cetak QR ${area.qrCode}...`, 'info');
    try {
      const dataUrl = await generateQRDataURL(area.qrCode);
      printWin.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8" />
            <title>Cetak Barcode - ${area.qrCode}</title>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
                margin: 0;
                padding: 20px;
                box-sizing: border-box;
                color: #0b0f19;
                background: #f8fafc;
              }
              .barcode-card {
                border: 2px dashed #475569;
                padding: 16px;
                border-radius: 10px;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                background: #fff;
                width: 250px;
                box-sizing: border-box;
                text-align: center;
                position: relative;
              }
              .cut-guide {
                position: absolute;
                top: 4px;
                right: 8px;
                font-size: 11px;
                color: #94a3b8;
              }
              img {
                width: 190px;
                height: 190px;
                object-fit: contain;
                display: block;
                margin: 0 auto;
              }
              .barcode-code {
                margin: 10px 0 2px 0;
                font-size: 18px;
                font-weight: 800;
                letter-spacing: 0.5px;
                color: #0b0f19;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, monospace;
              }
              .barcode-loc {
                margin: 0;
                font-size: 12.5px;
                font-weight: 600;
                color: #334155;
                line-height: 1.3;
              }
              .no-print {
                margin-top: 15px;
                font-size: 12px;
                color: #94a3b8;
              }
              @media print {
                body {
                  background: #fff !important;
                  -webkit-print-color-adjust: exact;
                  padding: 0;
                }
                .no-print {
                  display: none !important;
                }
              }
            </style>
          </head>
          <body>
            <div class="barcode-card">
              <span class="cut-guide">✂</span>
              <img src="${dataUrl}" alt="${area.qrCode}" />
              <div class="barcode-code">${area.qrCode}</div>
              <div class="barcode-loc">${area.titik}</div>
            </div>
            <p class="no-print">Format Standar Barcode Checkpoint SMPJDC</p>
            <script>window.onload=function(){setTimeout(function(){window.print();},400)};<\/script>
          </body>
        </html>
      `);
      printWin.document.close();
    } catch (err) {
      console.error('Print QR failed:', err);
      if (addToast) addToast('Gagal menyiapkan QR untuk cetak', 'danger');
      printWin.close();
    } finally {
      setPrintLoadingId(null);
    }
  };

  const handlePrintAllQRs = async () => {
    const sorted = getSortedAreas(areas);
    if (sorted.length === 0) {
      if (addToast) addToast('Tidak ada checkpoint untuk dicetak', 'warning');
      return;
    }
    if (addToast) addToast(`Menyiapkan cetak ${sorted.length} QR (Format 6 per HVS)...`, 'info');
    try {
      const qrPairs = await Promise.all(sorted.map(async (area) => {
        const url = await generateQRDataURL(area.qrCode);
        return [area.id, url];
      }));
      const qrMap = Object.fromEntries(qrPairs);

      const chunkSize = 6;
      const pages = [];
      for (let i = 0; i < sorted.length; i += chunkSize) {
        pages.push(sorted.slice(i, i + chunkSize));
      }

      const pagesHtml = pages.map((pageItems, pageIdx) => {
        const cardsHtml = pageItems.map(area => `
          <div class="barcode-card">
            <span class="cut-guide">✂</span>
            <div class="qr-box">
              <img src="${qrMap[area.id]}" alt="${area.qrCode}" />
            </div>
            <div class="barcode-code">${area.qrCode}</div>
            <div class="barcode-loc" title="${area.titik}">${area.titik}</div>
          </div>
        `).join('');

        const emptySlots = 6 - pageItems.length;
        const emptyHtml = Array.from({ length: emptySlots }).map(() => `
          <div class="barcode-card empty-card">
            <div class="empty-placeholder">Area Potong Kosong</div>
          </div>
        `).join('');

        return `
          <div class="hvs-sheet">
            ${cardsHtml}
            ${emptyHtml}
          </div>
        `;
      }).join('');

      const printWin = window.open('', '_blank', 'width=800,height=900');
      if (!printWin || printWin.closed || typeof printWin.closed === 'undefined') {
        if (addToast) addToast('Izinkan popup untuk mencetak barcode', 'warning');
        return;
      }

      printWin.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8" />
            <title>Cetak Barcode Checkpoint SMPJDC (6 Barcode / HVS)</title>
            <style>
              @page {
                size: A4 portrait;
                margin: 8mm;
              }
              * {
                box-sizing: border-box;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              html, body {
                margin: 0;
                padding: 0;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                background: #f1f5f9;
                color: #0b0f19;
              }
              .toolbar-noprint {
                position: sticky;
                top: 0;
                background: #0f172a;
                color: #ffffff;
                padding: 10px 16px;
                display: flex;
                align-items: center;
                justify-content: space-between;
                z-index: 100;
                box-shadow: 0 2px 10px rgba(0,0,0,0.2);
              }
              .toolbar-noprint button {
                background: #0ea5e9;
                color: #ffffff;
                border: none;
                padding: 8px 18px;
                border-radius: 6px;
                font-weight: 700;
                font-size: 13px;
                cursor: pointer;
              }
              .sheets-container {
                padding: 15px;
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 20px;
              }
              .hvs-sheet {
                width: 194mm;
                height: 275mm;
                background: #ffffff;
                padding: 5mm;
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                grid-template-rows: repeat(3, 1fr);
                gap: 6mm;
                box-shadow: 0 4px 15px rgba(0,0,0,0.1);
                page-break-after: always;
                break-after: page;
                page-break-inside: avoid;
                break-inside: avoid;
              }
              .hvs-sheet:last-of-type {
                page-break-after: auto;
                break-after: auto;
              }
              .barcode-card {
                border: 1.5px dashed #475569;
                border-radius: 6px;
                background: #ffffff;
                padding: 8px 10px;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                text-align: center;
                height: 100%;
                max-height: 85mm;
                overflow: hidden;
                position: relative;
              }
              .empty-card {
                border-color: #cbd5e1;
                border-style: dotted;
                background: #f8fafc;
              }
              .empty-placeholder {
                color: #94a3b8;
                font-size: 11px;
                font-weight: 600;
              }
              .cut-guide {
                position: absolute;
                top: 3px;
                right: 6px;
                font-size: 11px;
                color: #94a3b8;
                user-select: none;
              }
              .qr-box {
                width: 145px;
                height: 145px;
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 0 auto;
              }
              .qr-box img {
                width: 145px;
                height: 145px;
                object-fit: contain;
                display: block;
              }
              .barcode-code {
                margin: 8px 0 2px 0;
                font-size: 16px;
                font-weight: 800;
                color: #0b0f19;
                letter-spacing: 0.5px;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace;
                line-height: 1.2;
                white-space: nowrap;
              }
              .barcode-loc {
                margin: 0;
                font-size: 11px;
                font-weight: 600;
                color: #334155;
                line-height: 1.25;
                max-width: 95%;
                height: 28px;
                overflow: hidden;
                text-overflow: ellipsis;
                display: -webkit-box;
                -webkit-line-clamp: 2;
                -webkit-box-orient: vertical;
                text-align: center;
              }
              @media print {
                body {
                  background: #ffffff !important;
                }
                .toolbar-noprint {
                  display: none !important;
                }
                .sheets-container {
                  padding: 0 !important;
                  gap: 0 !important;
                }
                .hvs-sheet {
                  width: 100% !important;
                  max-width: 100% !important;
                  height: 275mm !important;
                  max-height: 275mm !important;
                  box-shadow: none !important;
                  margin: 0 !important;
                  padding: 2mm !important;
                  page-break-after: always !important;
                  break-after: page !important;
                }
                .hvs-sheet:last-of-type {
                  page-break-after: auto !important;
                  break-after: auto !important;
                }
                .empty-card {
                  visibility: hidden !important;
                }
              }
            </style>
          </head>
          <body>
            <div class="toolbar-noprint">
              <div>
                <strong>Cetak Barcode Checkpoint</strong> — Total ${sorted.length} Barcode (${pages.length} Lembar HVS A4)
              </div>
              <button onclick="window.print()">🖨️ Cetak Dokumen</button>
            </div>
            <div class="sheets-container">
              ${pagesHtml}
            </div>
            <script>
              window.onload = function() {
                setTimeout(function() {
                  window.print();
                }, 500);
              };
            <\/script>
          </body>
        </html>
      `);
      printWin.document.close();
    } catch (err) {
      console.error('Print all QR failed:', err);
      if (addToast) addToast('Gagal mencetak QR', 'danger');
    }
  };

  const handleResequenceAndStandardize = () => {
    if (!areas || areas.length === 0) {
      if (addToast) addToast('Tidak ada checkpoint untuk dirapikan', 'warning');
      return;
    }
    const confirmed = window.confirm(
      'Apakah Anda ingin merapikan seluruh checkpoint, menghapus pendobelan nomor/barcode, mengurutkan nomor 1..N, dan menyamakan format barcode?'
    );
    if (!confirmed) return;

    // Filter duplicates by normalized qrCode, location, and nomorTitik
    const seenQr = new Set();
    const seenLoc = new Set();
    const uniqueAreas = [];
    const duplicateIds = [];

    for (const a of areas) {
      const qr = (a.qrCode || '').toUpperCase().trim();
      const locKey = `${(a.lantai || '').toLowerCase()}|${(a.titik || '').toLowerCase()}`;
      if ((qr && seenQr.has(qr)) || seenLoc.has(locKey)) {
        duplicateIds.push(a.id);
      } else {
        if (qr) seenQr.add(qr);
        seenLoc.add(locKey);
        uniqueAreas.push(a);
      }
    }

    // Delete any duplicates
    duplicateIds.forEach(id => {
      onDeleteArea(id);
    });

    // Sort unique areas by logical building floor progression
    const sorted = [...uniqueAreas].sort((a, b) => {
      const fa = FLOOR_ORDER[a.lantai] !== undefined ? FLOOR_ORDER[a.lantai] : 99;
      const fb = FLOOR_ORDER[b.lantai] !== undefined ? FLOOR_ORDER[b.lantai] : 99;
      if (fa !== fb) return fa - fb;
      const za = (a.zona || '').localeCompare(b.zona || '');
      if (za !== 0) return za;
      const na = parseInt(a.nomorTitik, 10);
      const nb = parseInt(b.nomorTitik, 10);
      if (!isNaN(na) && !isNaN(nb) && na !== nb) return na - nb;
      return (a.titik || '').localeCompare(b.titik || '');
    });

    let updatedCount = 0;
    sorted.forEach((area, index) => {
      const newNum = String(index + 1);
      const newQr = buildBarcodeCode(area.lantai, area.zona, newNum);
      if (area.nomorTitik !== newNum || area.qrCode !== newQr) {
        updatedCount++;
        onUpdateArea(area.id, {
          nomorTitik: newNum,
          qrCode: newQr
        });
      }
    });

    if (addToast) {
      addToast(
        duplicateIds.length > 0
          ? `Berhasil menghapus ${duplicateIds.length} data duplikat & merapikan nomor 1..${sorted.length}!`
          : `Berhasil mengurutkan dan menstandarkan nomor 1..${sorted.length}!`,
        'success'
      );
    }
  };

  const [downloadingId, setDownloadingId] = useState(null);
  const [printLoadingId, setPrintLoadingId] = useState(null);
  const [bulkCount, setBulkCount] = useState(100);
  const [generating, setGenerating] = useState(false);
  const [genProgress, setGenProgress] = useState(0);
  const [bulkDownloadReady, setBulkDownloadReady] = useState(false);

  // ── Edit Area handlers ──
  const openEditArea = (area) => {
    const isCustom = !FLOOR_OPTIONS.some(f => f.value === area.lantai);
    setEFloor(isCustom ? '__LAINNYA__' : area.lantai);
    setEFloorCustom(isCustom ? area.lantai : '');
    setEZone(ZONE_OPTIONS.includes(area.zona) ? area.zona : '__LAINNYA__');
    setEZoneCustom(ZONE_OPTIONS.includes(area.zona) ? '' : area.zona);
    setETitik(area.titik);
    setENomorTitik(area.nomorTitik || '');
    setEQrCode(area.qrCode);
    setEditArea(area);
  };

  const handleEditAreaSubmit = (e) => {
    e.preventDefault();
    if (!eTitik.trim()) { alert('Lokasi tidak boleh kosong!'); return; }
    const inputNomor = eNomorTitik.trim();
    if (inputNomor) {
      const existing = areas.find(a => a.id !== editArea.id && String(a.nomorTitik).trim() === inputNomor);
      if (existing) {
        alert(`Nomor titik ${inputNomor} sudah digunakan untuk lokasi "${existing.titik}"! Masukkan nomor lain agar tidak dobel.`);
        return;
      }
    }
    const eFloorFinal = eFloor === '__LAINNYA__' ? (eFloorCustom.trim() || 'Custom') : eFloor;
    const eZoneFinal = eZone === '__LAINNYA__' ? (eZoneCustom.trim() || 'Custom') : eZone;
    const newQrCode = inputNomor
      ? buildBarcodeCode(eFloorFinal, eZoneFinal, inputNomor)
      : (eQrCode.trim() || buildBarcodeCode(eFloorFinal, eZoneFinal, '0'));
    onUpdateArea(editArea.id, {
      lantai: eFloorFinal,
      zona: eZoneFinal,
      nomorTitik: inputNomor,
      titik: eTitik.trim(),
      qrCode: newQrCode
    });
    setEditArea(null);
  };

  // ── Pos Jaga handlers ──
  const handleAddPos = (e) => {
    e.preventDefault();
    if (!posTitik.trim()) { alert('Nama pos tidak boleh kosong!'); return; }
    const lantaiFinal = posLantai === '__LAINNYA__' ? (posLantaiCustom.trim() || 'Custom') : posLantai;
    onAddPos({
      lantai: lantaiFinal,
      titik: posTitik.trim(),
      keterangan: posKeterangan.trim(),
      kode: posKode.trim().toUpperCase()
    });
    setPosTitik('');
    setPosKeterangan('');
    setPosKode('');
    setPosLantaiCustom('');
  };

  const openEditPos = (pos) => {
    const isCustom = !FLOOR_OPTIONS_POS.some(f => f.value === pos.lantai);
    setEPosLantai(isCustom ? '__LAINNYA__' : pos.lantai);
    setEPosLantaiCustom(isCustom ? pos.lantai : '');
    setEPosTitik(pos.titik);
    setEPosKeterangan(pos.keterangan || '');
    setEPosKode(pos.kode || '');
    setEditPos(pos);
  };

  const handleEditPosSubmit = (e) => {
    e.preventDefault();
    if (!ePosTitik.trim()) { alert('Nama pos tidak boleh kosong!'); return; }
    const lantaiFinal = ePosLantai === '__LAINNYA__' ? (ePosLantaiCustom.trim() || 'Custom') : ePosLantai;
    onUpdatePos(editPos.id, {
      lantai: lantaiFinal,
      titik: ePosTitik.trim(),
      keterangan: ePosKeterangan.trim(),
      kode: ePosKode.trim().toUpperCase()
    });
    setEditPos(null);
  };

  const handleBulkGenerate = async () => {
    setGenerating(true);
    setBulkDownloadReady(false);
    setGenProgress(0);

    const areasToGenerate = getSortedAreas(areas);
    const total = areasToGenerate.length;

    for (let i = 0; i < total; i++) {
      const area = areasToGenerate[i];
      const qrData = area.qrCode || buildBarcodeCode(area.lantai, area.zona, area.nomorTitik || (i + 1));
      try {
        const dataUrl = await generateQRDataURL(qrData);
        const link = document.createElement('a');
        link.href = dataUrl;
        const numPrefix = String(area.nomorTitik || (i + 1)).padStart(2, '0');
        link.download = `QR-${numPrefix}-${qrData.replace(/[^a-zA-Z0-9]/g, '-')}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (e) {
        console.warn('Gagal download QR untuk', qrData, e);
      }
      await new Promise(r => setTimeout(r, 200));
      setGenProgress(Math.round(((i + 1) / total) * 100));
    }

    setGenerating(false);
    setBulkDownloadReady(true);
  };

  // ── Filters ──
  const filteredAreas = useMemo(() => {
    if (!searchArea.trim()) return areas;
    const q = searchArea.toLowerCase();
    return areas.filter(a =>
      a.titik.toLowerCase().includes(q) ||
      a.qrCode.toLowerCase().includes(q) ||
      a.lantai.toLowerCase().includes(q) ||
      a.zona.toLowerCase().includes(q)
    );
  }, [areas, searchArea]);

  const filteredPosList = useMemo(() => {
    if (!searchPos.trim()) return posList;
    const q = searchPos.toLowerCase();
    return posList.filter(p =>
      p.titik.toLowerCase().includes(q) ||
      p.keterangan?.toLowerCase().includes(q) ||
      p.kode?.toLowerCase().includes(q) ||
      p.lantai?.toLowerCase().includes(q)
    );
  }, [posList, searchPos]);

  const handleExportCheckpointPDF = () => {
    const rows = getSortedAreas(filteredAreas);
    const ok = exportTableToPdf({
      title: 'Master Checkpoint Barcode Patroli',
      fileName: `master-checkpoint-barcode-smpjdc-${formatDateForFile()}`,
      meta: [
        { label: 'Pencarian', value: searchArea || '-' },
        { label: 'Total Checkpoint', value: rows.length },
        { label: 'Sumber', value: 'Barcode Generator' },
        { label: 'Gedung', value: 'Jakarta Design Center' }
      ],
      columns: [
        { header: 'NO', width: '5%' },
        { header: 'QR CODE', width: '15%' },
        { header: 'GEDUNG', width: '18%' },
        { header: 'LANTAI', width: '12%' },
        { header: 'ZONA', width: '8%' },
        { header: 'NO. TITIK', width: '9%' },
        { header: 'LOKASI / TITIK PATROLI', width: '25%' },
        { header: 'KETERANGAN', width: '12%' }
      ],
      rows: rows.map((area, idx) => [
        idx + 1,
        { text: area.qrCode || '-', className: 'mono' },
        area.gedung || 'SMPJDC - Jakarta Design Center',
        ['1','2','3','4','5','6'].includes(area.lantai) ? `Lantai ${area.lantai}` : (area.lantai || '-'),
        area.zona || '-',
        area.nomorTitik || '-',
        { text: area.titik || '-', className: 'text-left' },
        area.keterangan || '-'
      ])
    });
    if (!ok) alert('Popup export PDF diblokir browser. Izinkan popup untuk aplikasi ini.');
  };

  const handleExportPosPDF = () => {
    const ok = exportTableToPdf({
      title: 'Master Pos Jaga Penjagaan',
      fileName: `master-pos-jaga-smpjdc-${formatDateForFile()}`,
      meta: [
        { label: 'Pencarian', value: searchPos || '-' },
        { label: 'Total Pos', value: filteredPosList.length },
        { label: 'Sumber', value: 'Barcode Generator' },
        { label: 'Gedung', value: 'Jakarta Design Center' }
      ],
      columns: [
        { header: 'NO', width: '6%' },
        { header: 'NAMA POS', width: '28%' },
        { header: 'LANTAI / AREA', width: '20%' },
        { header: 'KODE POS', width: '14%' },
        { header: 'KETERANGAN', width: '32%' }
      ],
      rows: filteredPosList.map((pos, idx) => [
        idx + 1,
        { text: pos.titik || '-', className: 'text-left' },
        pos.lantai || '-',
        { text: pos.kode || '-', className: 'mono' },
        { text: pos.keterangan || '-', className: 'text-left' }
      ])
    });
    if (!ok) alert('Popup export PDF diblokir browser. Izinkan popup untuk aplikasi ini.');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* ── TAB NAVIGATION (Android Native Grid - Zero Horizontal Scroll) ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
        gap: '0.5rem',
        borderBottom: '1px solid var(--border-glass)',
        paddingBottom: '0.75rem',
        width: '100%'
      }}>
        <button onClick={() => { hapticLight(); setTab('checkpoint'); }} style={{
          padding: '0.55rem 0.75rem', borderRadius: '10px', fontSize: '0.78rem', fontWeight: 700,
          border: `1.5px solid ${tab === 'checkpoint' ? 'var(--color-primary)' : 'var(--border-glass)'}`,
          background: tab === 'checkpoint' ? 'rgba(0,240,255,0.14)' : 'rgba(255,255,255,0.02)',
          color: tab === 'checkpoint' ? 'var(--color-primary)' : 'var(--text-secondary)',
          cursor: 'pointer', fontFamily: 'var(--font-sans)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem',
          minHeight: '46px', touchAction: 'manipulation', width: '100%'
        }}><QrCode size={16} /> Checkpoint Barcode</button>
        <button onClick={() => { hapticLight(); setTab('posjaga'); }} style={{
          padding: '0.55rem 0.75rem', borderRadius: '10px', fontSize: '0.78rem', fontWeight: 700,
          border: `1.5px solid ${tab === 'posjaga' ? 'var(--color-primary)' : 'var(--border-glass)'}`,
          background: tab === 'posjaga' ? 'rgba(0,240,255,0.14)' : 'rgba(255,255,255,0.02)',
          color: tab === 'posjaga' ? 'var(--color-primary)' : 'var(--text-secondary)',
          cursor: 'pointer', fontFamily: 'var(--font-sans)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem',
          minHeight: '46px', touchAction: 'manipulation', width: '100%'
        }}><Shield size={16} /> Pos Jaga</button>
        <button onClick={() => { hapticLight(); setTab('users'); }} style={{
          padding: '0.55rem 0.75rem', borderRadius: '10px', fontSize: '0.78rem', fontWeight: 700,
          border: `1.5px solid ${tab === 'users' ? 'var(--color-primary)' : 'var(--border-glass)'}`,
          background: tab === 'users' ? 'rgba(0,240,255,0.14)' : 'rgba(255,255,255,0.02)',
          color: tab === 'users' ? 'var(--color-primary)' : 'var(--text-secondary)',
          cursor: 'pointer', fontFamily: 'var(--font-sans)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem',
          minHeight: '46px', touchAction: 'manipulation', width: '100%'
        }}><User size={16} /> Registrasi Anggota</button>
        <button onClick={() => { hapticLight(); setTab('presensi_qr'); }} style={{
          padding: '0.55rem 0.75rem', borderRadius: '10px', fontSize: '0.78rem', fontWeight: 700,
          border: `1.5px solid ${tab === 'presensi_qr' ? 'var(--color-primary)' : 'var(--border-glass)'}`,
          background: tab === 'presensi_qr' ? 'rgba(0,240,255,0.14)' : 'rgba(255,255,255,0.02)',
          color: tab === 'presensi_qr' ? 'var(--color-primary)' : 'var(--text-secondary)',
          cursor: 'pointer', fontFamily: 'var(--font-sans)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem',
          minHeight: '46px', touchAction: 'manipulation', width: '100%'
        }}><QrCode size={16} /> QR Presensi Staff</button>
      </div>

      {/* ════════════════════════════════════════════════════
          TAB: CHECKPOINT BARCODE
          ════════════════════════════════════════════════════ */}
      {tab === 'checkpoint' && (
        <div className="grid-cols-3" style={{ gap: '2rem' }}>

          {/* ── SINGLE AREA REGISTRATION FORM ── */}
          <div className="glass-panel panel-body" style={{ height: 'fit-content' }}>
            <h3 className="section-title">
              <Plus size={18} className="text-primary" style={{ flexShrink: 0 }} />
              <span>Registrasi Area Baru</span>
            </h3>

            <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>

              <div className="form-field">
                <label className="form-label">LOKASI / GEDUNG</label>
                <div className="form-input-wrap" style={{ opacity: 0.6 }}>
                  <Building size={16} />
                  <input type="text" value="SMPJDC - Jakarta Design Center" disabled className="form-input" />
                </div>
              </div>

              <div className="form-grid">
                <div className="form-field">
                  <label className="form-label">LANTAI</label>
                  <select value={floor} onChange={e => setFloor(e.target.value)} className="form-select">
                    {FLOOR_OPTIONS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                    <option value="__LAINNYA__">Lainnya...</option>
                  </select>
                  {floor === '__LAINNYA__' && (
                    <input type="text" value={floorCustom} onChange={e => setFloorCustom(e.target.value)} placeholder="Tulis lantai manual" className="form-input form-input-sm" />
                  )}
                </div>
                <div className="form-field">
                  <label className="form-label">NOMOR TITIK</label>
                  <input type="text" value={nomorTitik} onChange={e => setNomorTitik(e.target.value)} placeholder="Cth: 1, 2, 3 atau ID" className="form-input" />
                </div>
              </div>

              <div className="form-grid">
                <div className="form-field">
                  <label className="form-label">ZONA</label>
                  <select value={zone} onChange={e => setZone(e.target.value)} className="form-select">
                    {ZONE_OPTIONS.map(z => <option key={z} value={z}>{z}</option>)}
                    <option value="__LAINNYA__">Lainnya...</option>
                  </select>
                  {zone === '__LAINNYA__' && (
                    <input type="text" value={zoneCustom} onChange={e => setZoneCustom(e.target.value)} placeholder="Tulis zona manual" className="form-input form-input-sm" />
                  )}
                </div>
                <div className="form-field">
                  <label className="form-label">LOKASI / TITIK PATROLI</label>
                  <input type="text" value={titik} onChange={e => setTitik(e.target.value)} placeholder="Contoh: Lobby Utama, Lift A Lt 1" className="form-input" required />
                </div>
              </div>

              {(titik || nomorTitik) && (
                <div className="glass-panel" style={{ padding: '0.75rem', background: 'rgba(59,130,246,0.02)', fontSize: '0.75rem', borderStyle: 'dashed' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                    <div className="preview-row"><span className="preview-label">Lokasi:</span><span className="preview-value">SMPJDC - Jakarta Design Center</span></div>
                    <div className="preview-row"><span className="preview-label">Lantai:</span><span className="preview-value">{FLOOR_OPTIONS.find(f => f.value === floor)?.label || floorFinal}</span></div>
                    <div className="preview-row"><span className="preview-label">No. Titik:</span><span className="preview-value">{nomorTitik || '-'}</span></div>
                    <div className="preview-row"><span className="preview-label">Zona:</span><span className="preview-value">{zoneFinal}</span></div>
                    <div className="preview-row"><span className="preview-label">Lokasi:</span><span className="preview-value">{titik || '-'}</span></div>
                    <div style={{ marginTop: '0.3rem', paddingTop: '0.3rem', borderTop: '1px solid var(--border-glass)' }}>
                      <span className="preview-label">QR Code:</span>
                      <p className="preview-qr">{nomorTitik.trim() ? buildBarcodeCode(floorFinal, zoneFinal, nomorTitik.trim()) : getQRPattern()}</p>
                    </div>
                  </div>
                </div>
              )}

              <button type="submit" className="btn-primary btn-full" style={{ minHeight: '48px', touchAction: 'manipulation' }}>
                <Plus size={16} /> Daftarkan Area
              </button>

            </form>
          </div>

          {/* ── MASTER AREA LIST ── */}
          <div className="glass-panel grid-span-2 panel-body">
            <div className="flex-between" style={{ marginBottom: '1.25rem', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
              <h3 className="section-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Building size={18} className="text-primary" style={{ flexShrink: 0 }} />
                <span>Daftar Checkpoint Aktif ({areas.length})</span>
              </h3>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ position: 'relative', minWidth: '130px' }}>
                  <input type="text" value={searchArea} onChange={e => setSearchArea(e.target.value)}
                    placeholder="Cari lokasi/QR..." className="form-input" style={{ padding: '0.4rem 0.6rem', fontSize: '0.75rem', minHeight: '42px' }} />
                </div>
                <button type="button" onClick={handlePrintAllQRs} className="btn-primary"
                  title="Cetak format kertas HVS (A4) isi 6 barcode per lembar"
                  style={{ padding: '0.45rem 0.85rem', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', width: 'auto', minHeight: '42px', touchAction: 'manipulation' }} data-no-ripple>
                  <Printer size={14} /> Cetak 6 QR / Lembar HVS
                </button>
                <button type="button" onClick={handleResequenceAndStandardize} className="btn-secondary"
                  title="Urutkan nomor titik 1..N & sinkronkan format kode barcode"
                  style={{ padding: '0.45rem 0.85rem', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', width: 'auto', minHeight: '42px', touchAction: 'manipulation' }} data-no-ripple>
                  <ArrowUpDown size={14} /> Urutkan & Rapikan
                </button>
                <button type="button" onClick={handleExportCheckpointPDF} className="btn-secondary"
                  title="Export tabel format PDF"
                  style={{ padding: '0.45rem 0.85rem', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', width: 'auto', minHeight: '42px', touchAction: 'manipulation' }} data-no-ripple>
                  <Download size={14} /> Export Tabel PDF
                </button>
              </div>
            </div>

            {/* ── MOBILE CARD VIEW (< 768px): Zero Horizontal Scroll ── */}
            <div className="show-on-mobile" style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {filteredAreas.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                  {searchArea ? 'Tidak ditemukan' : 'Belum ada area terdaftar'}
                </div>
              ) : (
                getSortedAreas(filteredAreas).map(area => (
                  <div key={`m-area-${area.id}`} className="mobile-data-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
                          <span style={{ fontSize: '0.65rem', fontWeight: 800, padding: '2px 6px', borderRadius: '4px', background: 'rgba(0,240,255,0.12)', color: 'var(--color-primary)', border: '1px solid rgba(0,240,255,0.25)' }}>
                            {['1','2','3','4','5','6'].includes(area.lantai) ? `Lantai ${area.lantai}` : area.lantai}
                          </span>
                          <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)' }}>
                            No. {area.nomorTitik || '-'}
                          </span>
                          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                            Zona {area.zona}
                          </span>
                        </div>
                        <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                          {area.titik}
                        </h4>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'monospace', marginTop: '0.2rem' }}>
                          QR: {area.qrCode}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.35rem', flexShrink: 0 }}>
                        <button onClick={() => openEditArea(area)} title="Edit area" className="btn-icon-primary" data-no-ripple style={{ minWidth: '38px', minHeight: '38px' }}>
                          <Edit3 size={15} />
                        </button>
                        <button onClick={() => handleDownloadQR(area)} title="Download QR" className="btn-icon-primary" data-no-ripple style={{ minWidth: '38px', minHeight: '38px' }}>
                          {downloadingId === area.id ? <RefreshCw size={15} className="spin" /> : <Download size={15} />}
                        </button>
                        <button onClick={() => handlePrintQR(area)} title="Cetak QR" className="btn-icon" data-no-ripple style={{ minWidth: '38px', minHeight: '38px' }}>
                          {printLoadingId === area.id ? <RefreshCw size={15} className="spin" /> : <Printer size={15} />}
                        </button>
                        <button onClick={() => onDeleteArea(area.id)} title="Hapus area" className="btn-icon-danger" data-no-ripple style={{ minWidth: '38px', minHeight: '38px' }}>
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* ── DESKTOP TABLE (>= 769px) ── */}
            <div className="hide-on-mobile table-wrap" style={{ overflowX: 'auto' }}>
              <table className="table-data" style={{ minWidth: '650px' }}>
                <thead>
                  <tr>
                    <th>Lantai</th><th>No. Titik</th><th>Zona</th>
                    <th>Lokasi</th><th>QR Code</th><th style={{ textAlign: 'right' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAreas.length === 0 ? (
                    <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>{searchArea ? 'Tidak ditemukan' : 'Belum ada area terdaftar'}</td></tr>
                  ) : (getSortedAreas(filteredAreas).map((area, idx) => (
                    <tr key={area.id} className={idx % 2 === 0 ? 'row-even' : ''}>
                      <td>{['1','2','3','4','5','6'].includes(area.lantai) ? `Lantai ${area.lantai}` : area.lantai}</td>
                      <td className="td-mono td-label">{area.nomorTitik || '-'}</td>
                      <td>{area.zona}</td>
                      <td className="td-primary td-label">{area.titik}</td>
                      <td className="td-mono" style={{ fontSize: '0.75rem', opacity: 0.8 }}>{area.qrCode}</td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="btn-group" style={{ justifyContent: 'flex-end', flexWrap: 'nowrap' }}>
                          <button onClick={() => openEditArea(area)} title="Edit area" className="btn-icon-primary" data-no-ripple
                            style={{ minWidth: '36px', minHeight: '36px', touchAction: 'manipulation' }}>
                            <Edit3 size={14} />
                          </button>
                          <button onClick={() => handleDownloadQR(area)} title="Download Barcode PNG" className="btn-icon-primary" data-no-ripple
                            style={{ minWidth: '36px', minHeight: '36px', touchAction: 'manipulation' }}>
                            {downloadingId === area.id ? <RefreshCw size={14} className="spin" /> : <Download size={14} />}
                          </button>
                          <button onClick={() => handlePrintQR(area)} title="Cetak Stiker Barcode" className="btn-icon" data-no-ripple
                            style={{ minWidth: '36px', minHeight: '36px', touchAction: 'manipulation' }}>
                            {printLoadingId === area.id ? <RefreshCw size={14} className="spin" /> : <Printer size={14} />}
                          </button>
                          <button onClick={() => onDeleteArea(area.id)} title="Hapus area" className="btn-icon-danger" data-no-ripple
                            style={{ minWidth: '36px', minHeight: '36px', touchAction: 'manipulation' }}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── BULK GENERATOR ── (hidden on this simplified view, moved to a panel) */}
          <div className="glass-panel panel-body" style={{ height: 'fit-content' }}>
            <h3 className="section-title">
              <Layers size={18} className="text-primary" style={{ flexShrink: 0 }} />
              <span>Generator Barcode Massal</span>
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <p className="text-secondary" style={{ fontSize: '0.85rem', lineHeight: '1.4' }}>
                Generate dan download barcode untuk dicetak sekaligus.
              </p>

              <div className="form-field">
                <label className="form-label">JUMLAH BARCODE</label>
                <select value={bulkCount} onChange={(e) => setBulkCount(parseInt(e.target.value))} className="form-select">
                  <option value="100">100 Barcode Lokasi</option>
                  <option value="500">500 Barcode Lokasi</option>
                  <option value="1000">1000 Barcode Lokasi</option>
                </select>
              </div>

              {generating ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div className="flex-between" style={{ fontSize: '0.75rem' }}>
                    <span>Memproses QR codes...</span>
                    <span>{genProgress}%</span>
                  </div>
                  <div className="progress-bar-bg"><div className="progress-bar-fill" style={{ width: `${genProgress}%` }} /></div>
                </div>
              ) : bulkDownloadReady ? (
                <div className="glass-panel" style={{ padding: '0.85rem', background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-success)', fontSize: '0.85rem', fontWeight: 600 }}>
                    <Check size={18} /> <span>{bulkCount} Barcodes Siap Didownload!</span>
                  </div>
                  <button onClick={() => {
                    const link = document.createElement('a');
                    link.href = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=SMPJDC-BULK-${bulkCount}`;
                    link.download = `smpjdc-${bulkCount}-barcodes.png`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    setBulkDownloadReady(false);
                  }} className="btn-primary btn-full" style={{ background: 'var(--color-success)', minHeight: '48px', touchAction: 'manipulation' }}>
                    <Download size={16} /> Download Sample PNG
                  </button>
                </div>
              ) : (
                <button onClick={handleBulkGenerate} className="btn-secondary btn-full" style={{ minHeight: '48px', touchAction: 'manipulation' }}>
                  Generate QR Codes
                </button>
              )}

              <div className="text-muted" style={{ fontSize: '0.7rem', lineHeight: '1.4' }}>
                <p>• Output berupa file PNG beresolusi tinggi.</p>
                <p>• Token dinamis disematkan secara acak guna mencegah duplikasi.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════
          TAB: POS JAGA
          ════════════════════════════════════════════════════ */}
      {tab === 'posjaga' && (
        <div className="grid-cols-2" style={{ gap: '2rem' }}>

          {/* ── ADD POS FORM ── */}
          <div className="glass-panel panel-body" style={{ height: 'fit-content' }}>
            <h3 className="section-title">
              <Plus size={18} className="text-primary" style={{ flexShrink: 0 }} />
              <span>Tambah Pos Jaga Baru</span>
            </h3>

            <form onSubmit={handleAddPos} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

              <div className="form-field">
                <label className="form-label">NAMA POS / TITIK</label>
                <input type="text" value={posTitik} onChange={e => setPosTitik(e.target.value)}
                  placeholder="Contoh: Pos 01 Lobby Utama" className="form-input" required />
              </div>

              <div className="form-field">
                <label className="form-label">LANTAI / AREA</label>
                <select value={posLantai} onChange={e => setPosLantai(e.target.value)} className="form-select">
                  {FLOOR_OPTIONS_POS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                  <option value="__LAINNYA__">Lainnya...</option>
                </select>
                {posLantai === '__LAINNYA__' && (
                  <input type="text" value={posLantaiCustom} onChange={e => setPosLantaiCustom(e.target.value)}
                    placeholder="Tulis lantai/area manual" className="form-input form-input-sm" />
                )}
              </div>

              <div className="form-field">
                <label className="form-label">KETERANGAN <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(opsional)</span></label>
                <input type="text" value={posKeterangan} onChange={e => setPosKeterangan(e.target.value)}
                  placeholder="Deskripsi pos" className="form-input" />
              </div>

              <div className="form-field">
                <label className="form-label">KODE POS <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(opsional, cth: P01)</span></label>
                <input type="text" value={posKode} onChange={e => setPosKode(e.target.value)}
                  placeholder="Contoh: P01, P23" className="form-input" style={{ textTransform: 'uppercase' }} />
              </div>

              <button type="submit" className="btn-primary btn-full" style={{ minHeight: '48px', touchAction: 'manipulation' }}>
                <Plus size={16} /> Tambah Pos Jaga
              </button>
            </form>
          </div>

          {/* ── POS LIST ── */}
          <div className="glass-panel grid-span-1 panel-body">
            <div className="flex-between" style={{ marginBottom: '1rem', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
              <h3 className="section-title" style={{ margin: 0 }}>
                <Shield size={18} className="text-primary" style={{ flexShrink: 0 }} />
                <span>Daftar Pos Jaga ({posList.length})</span>
              </h3>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', minWidth: '140px' }}>
                  <input type="text" value={searchPos} onChange={e => setSearchPos(e.target.value)}
                    placeholder="Cari pos..." className="form-input" style={{ padding: '0.4rem 0.6rem', fontSize: '0.75rem', minHeight: '44px' }} />
                </div>
                <button type="button" onClick={handleExportPosPDF} className="btn-secondary"
                  style={{ padding: '0.45rem 0.85rem', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', width: 'auto', minHeight: '44px', touchAction: 'manipulation' }} data-no-ripple>
                  <Download size={14} /> Export PDF
                </button>
              </div>
            </div>

            {/* ── MOBILE CARD VIEW (< 768px): Pos Jaga Zero Horizontal Scroll ── */}
            <div className="show-on-mobile" style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {filteredPosList.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                  {searchPos ? 'Tidak ditemukan' : 'Belum ada pos jaga'}
                </div>
              ) : (
                filteredPosList.map(pos => (
                  <div key={`m-pos-${pos.id}`} className="mobile-data-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
                          <span style={{ fontSize: '0.65rem', fontWeight: 800, padding: '2px 6px', borderRadius: '4px', background: 'rgba(0,240,255,0.12)', color: 'var(--color-primary)' }}>
                            {pos.lantai}
                          </span>
                          <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                            Kode: {pos.kode || '-'}
                          </span>
                        </div>
                        <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                          {pos.titik}
                        </h4>
                        {pos.keterangan && (
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                            {pos.keterangan}
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: '0.35rem', flexShrink: 0 }}>
                        <button onClick={() => openEditPos(pos)} title="Edit pos" className="btn-icon-primary" data-no-ripple style={{ minWidth: '38px', minHeight: '38px' }}>
                          <Edit3 size={15} />
                        </button>
                        <button onClick={() => onDeletePos(pos.id)} title="Hapus pos" className="btn-icon-danger" data-no-ripple style={{ minWidth: '38px', minHeight: '38px' }}>
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* ── DESKTOP TABLE (>= 769px) ── */}
            <div className="hide-on-mobile table-wrap" style={{ overflowX: 'auto' }}>
              <table className="table-data" style={{ minWidth: '500px' }}>
                <thead>
                  <tr>
                    <th>Nama Pos</th><th>Lantai</th><th>Keterangan</th><th>Kode</th><th style={{ textAlign: 'right' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPosList.length === 0 ? (
                    <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      {searchPos ? 'Tidak ditemukan' : 'Belum ada pos jaga'}
                    </td></tr>
                  ) : (filteredPosList.map((pos, idx) => (
                    <tr key={pos.id} className={idx % 2 === 0 ? 'row-even' : ''}>
                      <td className="td-primary td-label">{pos.titik}</td>
                      <td>{pos.lantai}</td>
                      <td style={{ fontSize: '0.75rem', opacity: 0.8 }}>{pos.keterangan || '-'}</td>
                      <td className="td-mono">{pos.kode || '-'}</td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="btn-group" style={{ justifyContent: 'flex-end', flexWrap: 'nowrap' }}>
                          <button onClick={() => openEditPos(pos)} title="Edit pos" className="btn-icon-primary" data-no-ripple
                            style={{ minWidth: '36px', minHeight: '36px', touchAction: 'manipulation' }}>
                            <Edit3 size={14} />
                          </button>
                          <button onClick={() => onDeletePos(pos.id)} title="Hapus pos" className="btn-icon-danger" data-no-ripple
                            style={{ minWidth: '36px', minHeight: '36px', touchAction: 'manipulation' }}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════
          TAB: REGISTRASI ANGGOTA
          ════════════════════════════════════════════════════ */}
      {tab === 'users' && (
        <div className="grid-cols-2" style={{ gap: '2rem' }}>
          <div className="glass-panel panel-body" style={{ height: 'fit-content' }}>
            <h3 className="section-title">
              <User size={18} className="text-primary" style={{ flexShrink: 0 }} />
              <span>Registrasi Anggota & Role</span>
            </h3>

            <form onSubmit={handleUserSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <div className="form-field">
                <label className="form-label">NAMA LENGKAP</label>
                <input type="text" value={userName} onChange={e => setUserName(e.target.value)} placeholder="Contoh: Richard Meha" className="form-input" required />
              </div>

              <div className="form-grid">
                <div className="form-field">
                  <label className="form-label">NRP / ID</label>
                  <div className="input-btn-group">
                    <input type="text" value={userNrp} onChange={e => setUserNrp(e.target.value)} placeholder="20005" className="form-input" required />
                    <button type="button" onClick={() => {
                      const existing = users.map(u => parseInt(u.nrp, 10)).filter(n => !isNaN(n));
                      const next = existing.length > 0 ? Math.max(...existing) + 1 : 10001;
                      setUserNrp(String(next).padStart(5, '0'));
                    }} title="Generate NRP" className="btn-gen">
                      <RefreshCw size={14} /> Generate
                    </button>
                  </div>
                </div>
                <div className="form-field">
                  <label className="form-label">JABATAN / ROLE</label>
                  <select value={userRole} onChange={e => setUserRole(e.target.value)} className="form-select">
                    <option value="Admin Super">Admin Super</option>
                    <option value="Manajemen">Manajemen</option>
                    <option value="SPV">SPV</option>
                    <option value="Danru">Danru</option>
                    <option value="Wadanru">Wadanru</option>
                    <option value="Anggota">Anggota</option>
                    <option value="BKO">BKO</option>
                    <option value="KH (Khusus)">KH (Khusus)</option>
                    <option value="Guest Viewer">Guest Viewer</option>
                  </select>
                </div>
              </div>

              <div className="form-grid">
                <div className="form-field">
                  <label className="form-label">REGU</label>
                  <select value={userRegu} onChange={e => setUserRegu(e.target.value)} className="form-select">
                    {REGU_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div className="form-field">
                  <label className="form-label">SHIFT</label>
                  <select value={userShift} onChange={e => setUserShift(e.target.value)} className="form-select">
                    {SHIFT_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-grid">
                <div className="form-field">
                  <label className="form-label"><Phone size={11} style={{ marginRight: '2px' }} /> NOMOR HP</label>
                  <input type="text" value={userHp} onChange={e => setUserHp(e.target.value)} placeholder="0812xxxx" className="form-input" />
                </div>
                <div className="form-field">
                  <label className="form-label"><Hash size={11} style={{ marginRight: '2px' }} /> PIN LOGIN</label>
                  <input type="text" value={userPin} onChange={e => setUserPin(e.target.value)} placeholder="Default: 4 digit NRP" maxLength={12} className="form-input" />
                </div>
              </div>

              <button type="submit" className="btn-primary btn-full" style={{ minHeight: '48px', touchAction: 'manipulation' }}>
                <UserCheck size={16} /> Tambahkan Anggota
              </button>
            </form>
          </div>

          <div className="glass-panel panel-body" style={{ height: 'fit-content' }}>
            <h3 className="section-title" style={{ marginBottom: '1rem' }}>
              <User size={18} className="text-primary" />
              <span>Anggota Terdaftar ({users.length})</span>
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
              Kelola anggota di menu <strong>Management User</strong>.
            </p>
            <div style={{ maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {[...users].sort((a, b) => a.nama?.localeCompare(b.nama)).map(u => (
                <div key={u.id} style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  padding: '0.4rem 0.6rem', borderRadius: '6px',
                  background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-glass)'
                }}>
                  <img src={u.avatar} alt="" style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }}
                    onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=40&fit=crop'; }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700 }}>{u.nama}</div>
                    <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>{u.jabatan} • {u.nrp}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════
          TAB: QR CODE PRESENSI (MASTER STAFF ROOM)
          ════════════════════════════════════════════════════ */}
      {tab === 'presensi_qr' && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '1rem 0' }}>
          <div className="glass-panel" style={{
            maxWidth: '500px',
            width: '100%',
            padding: '2rem',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1.25rem'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                <QrCode className="text-primary" size={20} />
                <span>MASTER QR CODE PRESENSI STAFF</span>
              </h2>
              <span className="badge badge-info" style={{ fontSize: '0.68rem', padding: '0.25rem 0.5rem', alignSelf: 'center', background: 'rgba(124,58,237,0.15)', color: '#a78bfa', border: '1px solid rgba(124,58,237,0.25)' }}>
                📍 Ruang Staff / Kantor Security JDC
              </span>
            </div>

            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: '1.45', margin: 0, maxWidth: '400px' }}>
              Cetak QR Code Master ini dan tempel di area Ruang Staff / Kantor Security. 
              Petugas wajib memindai QR Code ini untuk melakukan **Absensi Masuk** dan **Absensi Pulang** pada simulator presensi.
            </p>

            {/* QR Code Container */}
            <div style={{
              padding: '1rem',
              background: '#ffffff',
              borderRadius: '10px',
              border: '3px double #0b0f19',
              boxShadow: '0 8px 20px rgba(0,0,0,0.25)',
              display: 'inline-block'
            }}>
              {presensiQrUrl ? (
                <img src={presensiQrUrl} alt="Master QR Presensi" style={{ width: '200px', height: '200px', display: 'block' }} />
              ) : (
                <div style={{ width: '200px', height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0b0f19' }}>
                  <RefreshCw className="spin" size={24} />
                </div>
              )}
            </div>

            {/* Metadata code label */}
            <div style={{ fontFamily: 'monospace', fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-primary)', background: 'rgba(59,130,246,0.08)', padding: '0.3rem 0.8rem', borderRadius: '6px', border: '1px solid rgba(59,130,246,0.18)' }}>
              JDC-MASTER-PRESENSI
            </div>

            {/* Actions for Master QR */}
            <div style={{ display: 'flex', gap: '0.65rem', width: '100%', marginTop: '0.35rem' }}>
              <button
                type="button"
                className="btn-primary"
                style={{ flex: 1, minHeight: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', fontSize: '0.78rem', fontWeight: 700 }}
                onClick={() => handleDownloadQR({ qrCode: 'JDC-MASTER-PRESENSI' })}
              >
                <Download size={14} /> Download PNG
              </button>
              <button
                type="button"
                className="btn-secondary"
                style={{ flex: 1, minHeight: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', fontSize: '0.78rem', fontWeight: 700 }}
                onClick={() => handlePrintQR({
                  qrCode: 'JDC-MASTER-PRESENSI',
                  titik: 'Master Presensi Staff Room',
                  gedung: 'SMPJDC',
                  lantai: 'Staff Room',
                  zona: 'Staff Office'
                })}
              >
                <Printer size={14} /> Cetak Stiker QR
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════
          EDIT AREA MODAL
          ════════════════════════════════════════════════════ */}
      {editArea && (
        <div className="modal-overlay" onClick={() => setEditArea(null)}>
          <div className="glass-panel modal-content" onClick={e => e.stopPropagation()} style={{
            maxWidth: '500px', width: '95%', padding: '1.5rem', position: 'relative'
          }}>
            <button onClick={() => setEditArea(null)} style={{
              position: 'absolute', top: '0.75rem', right: '0.75rem', background: 'none', border: 'none',
              color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.25rem',
              minWidth: '44px', minHeight: '44px', touchAction: 'manipulation'
            }}><X size={18} /></button>

            <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Edit3 size={16} className="text-primary" /> Edit Checkpoint
            </h3>

            <form onSubmit={handleEditAreaSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-field">
                <label className="form-label">LANTAI</label>
                <select value={eFloor} onChange={e => setEFloor(e.target.value)} className="form-select">
                  {FLOOR_OPTIONS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                  <option value="__LAINNYA__">Lainnya...</option>
                </select>
                {eFloor === '__LAINNYA__' && (
                  <input type="text" value={eFloorCustom} onChange={e => setEFloorCustom(e.target.value)}
                    placeholder="Tulis lantai manual" className="form-input form-input-sm" />
                )}
              </div>

              <div className="form-grid">
                <div className="form-field">
                  <label className="form-label">NOMOR TITIK</label>
                  <input type="text" value={eNomorTitik} onChange={e => setENomorTitik(e.target.value)} className="form-input" />
                </div>
                <div className="form-field">
                  <label className="form-label">ZONA</label>
                  <select value={eZone} onChange={e => setEZone(e.target.value)} className="form-select">
                    {ZONE_OPTIONS.map(z => <option key={z} value={z}>{z}</option>)}
                    <option value="__LAINNYA__">Lainnya...</option>
                  </select>
                  {eZone === '__LAINNYA__' && (
                    <input type="text" value={eZoneCustom} onChange={e => setEZoneCustom(e.target.value)}
                      placeholder="Tulis zona manual" className="form-input form-input-sm" />
                  )}
                </div>
              </div>

              <div className="form-field">
                <label className="form-label">LOKASI / TITIK PATROLI</label>
                <input type="text" value={eTitik} onChange={e => setETitik(e.target.value)} className="form-input" required />
              </div>

              <div className="form-field">
                <label className="form-label">QR CODE</label>
                <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                  <input type="text" value={eQrCode} onChange={e => setEQrCode(e.target.value)} className="form-input form-input-sm"
                    style={{ fontFamily: 'monospace', fontSize: '0.8rem', opacity: 0.9, flex: 1 }} />
                  <button type="button" className="btn-secondary" style={{ padding: '0.4rem 0.6rem', fontSize: '0.72rem', whiteSpace: 'nowrap' }}
                    onClick={() => {
                      const ef = eFloor === '__LAINNYA__' ? (eFloorCustom.trim() || 'Custom') : eFloor;
                      const ez = eZone === '__LAINNYA__' ? (eZoneCustom.trim() || 'Custom') : eZone;
                      setEQrCode(buildBarcodeCode(ef, ez, eNomorTitik.trim() || '0'));
                    }}>
                    Standarkan
                  </button>
                </div>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                  * Kode standar: {buildBarcodeCode(eFloor === '__LAINNYA__' ? (eFloorCustom.trim() || 'Custom') : eFloor, eZone === '__LAINNYA__' ? (eZoneCustom.trim() || 'Custom') : eZone, eNomorTitik.trim() || '-')}
                </span>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button type="submit" className="btn-primary" style={{ flex: 1, padding: '0.6rem', minHeight: '48px', touchAction: 'manipulation' }}>
                  <Check size={16} /> Simpan Perubahan
                </button>
                <button type="button" onClick={() => setEditArea(null)} className="btn-secondary" style={{ flex: 1, padding: '0.6rem', minHeight: '48px', touchAction: 'manipulation' }}>
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════
          EDIT POS MODAL
          ════════════════════════════════════════════════════ */}
      {editPos && (
        <div className="modal-overlay" onClick={() => setEditPos(null)}>
          <div className="glass-panel modal-content" onClick={e => e.stopPropagation()} style={{
            maxWidth: '500px', width: '95%', padding: '1.5rem', position: 'relative'
          }}>
            <button onClick={() => setEditPos(null)} style={{
              position: 'absolute', top: '0.75rem', right: '0.75rem', background: 'none', border: 'none',
              color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.25rem',
              minWidth: '44px', minHeight: '44px', touchAction: 'manipulation'
            }}><X size={18} /></button>

            <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Edit3 size={16} className="text-primary" /> Edit Pos Jaga
            </h3>

            <form onSubmit={handleEditPosSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-field">
                <label className="form-label">NAMA POS / TITIK</label>
                <input type="text" value={ePosTitik} onChange={e => setEPosTitik(e.target.value)} className="form-input" required />
              </div>

              <div className="form-field">
                <label className="form-label">LANTAI / AREA</label>
                <select value={ePosLantai} onChange={e => setEPosLantai(e.target.value)} className="form-select">
                  {FLOOR_OPTIONS_POS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                  <option value="__LAINNYA__">Lainnya...</option>
                </select>
                {ePosLantai === '__LAINNYA__' && (
                  <input type="text" value={ePosLantaiCustom} onChange={e => setEPosLantaiCustom(e.target.value)}
                    placeholder="Tulis lantai manual" className="form-input form-input-sm" />
                )}
              </div>

              <div className="form-field">
                <label className="form-label">KETERANGAN</label>
                <input type="text" value={ePosKeterangan} onChange={e => setEPosKeterangan(e.target.value)} className="form-input" />
              </div>

              <div className="form-field">
                <label className="form-label">KODE POS</label>
                <input type="text" value={ePosKode} onChange={e => setEPosKode(e.target.value)} className="form-input form-input-sm" style={{ textTransform: 'uppercase' }} />
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button type="submit" className="btn-primary" style={{ flex: 1, padding: '0.6rem', minHeight: '48px', touchAction: 'manipulation' }}>
                  <Check size={16} /> Simpan Perubahan
                </button>
                <button type="button" onClick={() => setEditPos(null)} className="btn-secondary" style={{ flex: 1, padding: '0.6rem', minHeight: '48px', touchAction: 'manipulation' }}>
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Hidden Canvas for QR Rendering */}
      <canvas ref={canvasRef} width="250" height="290" style={{ display: 'none' }} />

    </div>
  );
}
