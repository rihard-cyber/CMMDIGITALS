# SMPJDC - SISTEM MANAJEMEN KEAMANAN JAKARTA DESIGN CENTER
> **Smart Real-Time Building Security, Patrol Checkpoint Tracking & Anti-Fraud Management Platform**  
> *Developed for Jakarta Design Center (Jl. Jend. Gatot Subroto Kav. 53, Slipi, Jakarta Pusat)*

[![Build Status](https://img.shields.io/badge/Build-Passing-brightgreen.svg)]()
[![Platform](https://img.shields.io/badge/Platform-Web%20PWA%20%7C%20Android%20Capacitor-blue.svg)]()
[![React](https://img.shields.io/badge/React-18.3.1-61dafb.svg)]()
[![Vite](https://img.shields.io/badge/Vite-5.4.21-646cff.svg)]()
[![Supabase](https://img.shields.io/badge/Supabase-Realtime%20%26%20Storage-3ecf8e.svg)]()

---

## 🌟 IKHTISAR SISTEM

**SMPJDC** adalah sistem manajemen operasional pengamanan gedung terintegrasi yang dirancang untuk mendukung operasional regu pengamanan (Satpam), Komandan Regu (Danru), staf teknis, dan manajemen gedung di Jakarta Design Center.

### 🛡️ Fitur Unggulan Sistem:
1. **Patroli Checkpoint Digital (30 Titik Kontrol JDC)**:
   - Pemindaian QR Code akrilik di setiap lantai dan zona (Basement hingga Lantai 6, serta halaman perimeter).
   - Validasi keberadaan fisik dengan verifikasi foto temuan dan status kondisi area.
2. **Presensi Mandiri & Deteksi Anti-Fraud**:
   - Geofencing presisi berjarak 500 meter dari titik tengah koordinat JDC (`-6.2088, 106.8021`).
   - Anti-Fake GPS (deteksi emulator, koordinat statis, dan mock location).
   - Deteksi *Developer Options* / *USB Debugging* aktif pada perangkat Android.
   - Deteksi manipulasi jam perangkat dengan perbandingan waktu real-time NTP server.
   - Toleransi cerdas indoor: Petugas di area Basement 1 tetap dapat beroperasi tanpa terhambat ketiadaan sinyal satelit.
3. **Autentikasi PIN Universal**:
   - Petugas dapat login dengan 4 digit terakhir NRP atau NRP lengkapnya.
   - Proteksi brute-force (kunci otomatis 5 menit jika salah 5 kali).
4. **SOP & Serah Terima Mutasi Penjagaan**:
   - Pencatatan log mutasi harian, inventaris perlengkapan dinas, dan serah terima shift.
5. **Manajemen Roster & Lembur (Overtime)**:
   - Kalender penugasan shift bulanan per personil (Pagi, Siang, Malam, Middle 1, Middle 2, BKO, Khusus).
   - Impor & ekspor file jadwal kerja via Microsoft Excel (.xlsx) dengan SheetJS.
6. **Command Center & Real-Time Dashboard**:
   - Peta GPS interaktif Leaflet OpenStreetMap pos jaga JDC.
   - Heatmap persentase kepatuhan patroli per lantai.
   - Disposisi temuan cepat ke grup WhatsApp (Teknisi, Cleaning, dan Keamanan).
7. **Portal Layanan Komplain Tenant / Publik**:
   - Form pengaduan tenant pameran/showroom/pengunjung tanpa perlu login akun.
   - Penerbitan nomor tiket aduan otomatis (`#TKT-JDC-XXXX`).
   - Pelacakan progres penanganan komplain secara real-time.
8. **Kemampuan Offline First (Zero Data Loss)**:
   - Data otomatis dicadangkan di memori lokal tingkat tinggi (IndexedDB via LocalForage).
   - Antrean offline (`sapujagat_offline_queue`) otomatis disinkronkan ke cloud saat perangkat kembali menerima sinyal.
9. **Ekspor Laporan PDF Standar Resmi**:
   - Desain laporan formal A4 landscape, metadata lengkap, nomor register, dan foto resolusi tinggi terkompresi.

---

## 🏗️ ARSITEKTUR TEKNOLOGI

```
SMPJDC Stack
├── Frontend Core        : React 18 (Hooks, Lazy Suspense, Error Boundaries)
├── Build Tool           : Vite 5 (Fast HMR, Terser Rollup Bundling)
├── Native Mobile Layer  : Capacitor 6 (Android Studio, Java Bridge, Native Plugins)
├── Cloud Database       : Supabase PostgreSQL (Realtime Channel & Row Level Security)
├── Storage Bucket       : Supabase Storage (`photos` bucket)
├── Local Persistence    : LocalForage (IndexedDB engine) + LocalStorage Fallback
├── Barcode Engine       : html5-qrcode (Scanner) + node-qrcode (Generator)
├── UI Icons & Styling   : Lucide React + Vanilla Hardware-Accelerated CSS (Glassmorphism)
└── Spreadsheet Engine   : SheetJS (xlsx full bundle)
```

---

## 📁 STRUKTUR REPOSITORI

```
e:/APP.SAPUJAGAT_JDC/
├── android/                     # Proyek native Android Capacitor (Gradle, Manifest, Java Bridge)
│   └── app/src/main/
│       ├── AndroidManifest.xml  # Izin Kamera, Lokasi Fine/Coarse, Notifikasi, Media
│       └── java/com/jdc/sapujagat/patrol/
│           ├── MainActivity.java
│           └── DeviceSecurityPlugin.java  # Plugin native deteksi opsi pengembang
├── docs/                        # Output bundle produksi web (dist/build)
│   ├── index.html
│   ├── manifest.json            # PWA Web App Manifest
│   ├── sw.js                    # Service Worker caching offline
│   ├── App.SMPJDC.apk           # File instalasi Android APK siap pakai
│   └── assets/                  # CSS & JS chunks teroptimasi
├── public/                      # Static assets Vite (Logo, PWA icons, APK)
├── src/
│   ├── components/              # 19 Modul Komponen React
│   │   ├── AbsensiRegu.jsx          # Modul presensi, shift & rekap lembur
│   │   ├── BarcodeGenerator.jsx     # Generator & cetak massal QR Checkpoint
│   │   ├── ComplaintAdmin.jsx       # Manajemen tiket komplain tenant
│   │   ├── ComplaintForm.jsx        # Form komplain publik tenant
│   │   ├── ErrorBoundary.jsx        # Penanganan crash tampilan
│   │   ├── LoginPage.jsx            # Layar login NRP & PIN universal
│   │   ├── ManagementDashboard.jsx  # Dashboard eksekutif & peta GPS JDC
│   │   ├── MutasiPenjagaan.jsx      # Log kejadian & serah terima shift
│   │   ├── ReportsExport.jsx        # Ekspor rekapitulasi data ke PDF
│   │   ├── RosterManagement.jsx     # Jadwal dinas & integrasi Excel
│   │   ├── SecurityCheckBlock.jsx   # Layar pelindung verifikasi kamera & GPS
│   │   ├── SecurityPatrolApp.jsx    # Inti aplikasi patroli satpam lapangan
│   │   └── UserManagement.jsx       # Kelola user, jabatan, dan nomor WhatsApp
│   ├── data/
│   │   ├── posList.js               # 15 Pos Jaga Resmi JDC
│   │   ├── rosterData.js            # Engine kalkulasi shift & roster
│   │   └── waContacts.js            # Daftar nomor kontak WhatsApp divisi
│   ├── utils/
│   │   ├── db.js                    # IndexedDB offline store wrapper
│   │   ├── exportPdf.js             # Generator laporan cetak PDF
│   │   ├── haptics.js               # Getaran haptik responsif Capacitor
│   │   ├── image.js                 # Kompresi kanvas foto JPG 500x500
│   │   ├── navigation.js            # Android hardware back button handler
│   │   ├── security.js              # Enkripsi hash PIN, anti-fake GPS, audit token
│   │   ├── supabase.js              # Client Supabase & sinkronisasi real-time
│   │   └── supabaseConfig.js        # Kredensial URL & Anon Key Supabase
│   ├── App.jsx                  # Main application orchestrator & routing
│   ├── index.css                # Master styling, tema Cyber & ukiran watermark
│   └── main.jsx                 # Entry point React & registrasi Service Worker
├── supabase-complete-setup.sql  # Skrip setup database SQL Supabase lengkap
├── PANDUAN_OPERASIONAL_SMPJDC.md# Panduan lengkap operasional lapangan & SOP
├── capacitor.config.json        # Konfigurasi runtime Capacitor
├── package.json                 # Daftar modul dependensi npm
└── vite.config.js               # Konfigurasi server & build outDir docs/
```

---

## 🚀 PANDUAN INSTALASI & MENJALANKAN APLIKASI

### 1. Kebutuhan Sistem
- **Node.js**: Versi `>= 18.20.0`
- **NPM**: Versi `>= 9.0.0`
- **Browser**: Google Chrome, Mozilla Firefox, Microsoft Edge, atau Safari versi terbaru.
- **Android**: Smartphone Android minimal Android 8.0 (Oreo) hingga Android 14+.

### 2. Menjalankan di Lingkungan Lokal (Development)
```bash
# Clone repository
git clone https://github.com/rihard-cyber/SMP-JDC.git
cd SMP-JDC

# Install dependensi
npm install

# Jalankan dev server lokal (Port 3000)
npm run dev
```
Buka browser di: `http://localhost:3000`

### 3. Membangun Paket Produksi (Production Build)
```bash
# Build web ke folder docs/
npm run build

# Sinkronkan aset web ke proyek Android Capacitor
npm run cap:android
```

### 4. Menjalankan Aplikasi Android di Android Studio
```bash
# Buka proyek android di Android Studio
npm run android:open

# Atau compile APK via terminal:
cd android
./gradlew assembleDebug
```
Output APK berada di: `android/app/build/outputs/apk/debug/app-debug.apk`

---

## 🗄️ SETUP DATABASE SUPABASE (1-KLIK)

Aplikasi telah dikonfigurasi untuk terhubung ke Supabase. Untuk mengaktifkan tabel dan penyimpanan:
1. Buka dashboard proyek Supabase Anda.
2. Masuk ke **SQL Editor** -> **New Query**.
3. Buka file [supabase-complete-setup.sql](file:///e:/APP.SAPUJAGAT_JDC/supabase-complete-setup.sql), salin kodenya, dan klik **Run**.
4. 10 tabel utama (`users`, `patrol_reports`, `findings`, `attendance_logs`, `mutasi_logs`, `complaints`, `areas`, `pos_list`, `rosters`, `config`) serta bucket penyimpanan foto `photos` akan aktif secara instan.

---

## 🔐 KREDENSIAL LOGIN BAWAAN

Untuk pengujian awal dan operasional pertama:
- **Role**: Admin Super
- **NRP**: `10001`
- **Nama**: `Richard`
- **PIN Default**: `0001` (atau `10001`)

*Seluruh personil baru yang ditambahkan memiliki PIN bawaan berupa 4 digit terakhir nomor NRP mereka.*

---

## 📖 DOKUMENTASI TERKAIT
- [PANDUAN_OPERASIONAL_SMPJDC.md](file:///e:/APP.SAPUJAGAT_JDC/PANDUAN_OPERASIONAL_SMPJDC.md): Panduan lengkap SOP satpam, komandan regu, manajemen, troubleshooting lapangan, dan daftar titik checkpoint.
- [RELEASE_CHECKLIST.md](file:///e:/APP.SAPUJAGAT_JDC/RELEASE_CHECKLIST.md): Checklist teknis persiapan deployment.
- [supabase-complete-setup.sql](file:///e:/APP.SAPUJAGAT_JDC/supabase-complete-setup.sql): Skrip lengkap pembuatan skema database, RLS, Realtime, dan Storage.

---

**Lead Developer & Architect**: Richard Meha  
*SISTEM MANAJEMEN KEAMANAN JAKARTA DESIGN CENTER (SMPJDC) © 2026*
