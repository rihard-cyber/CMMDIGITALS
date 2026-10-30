# PROPOSAL PENGAJUAN
# SISTEM MANAJEMEN PENGAMANAN DIGITAL BERBASIS APLIKASI MOBILE
## **SMPJDC — Sistem Manajemen Pengamanan Jakarta Design Center**
### Pengganti Alat Patroli Konvensional (Guard Tour System Manual)

---

**Diajukan oleh:**
Richard Meha — Lead Developer & System Architect
Departemen Keamanan & Teknologi Informasi

**Ditujukan kepada:**
Yth. Manajemen / Building Management
**Jakarta Design Center (JDC)**
Jl. Jend. Gatot Subroto Kav. 53, Slipi, Jakarta Pusat 10260

**Tanggal:** Oktober 2026
**Versi Dokumen:** 1.0

---

## DAFTAR ISI

1. [Ringkasan Eksekutif](#1-ringkasan-eksekutif)
2. [Analisis 5W + 1H](#2-analisis-5w--1h)
3. [Latar Belakang & Permasalahan](#3-latar-belakang--permasalahan)
4. [Tujuan & Manfaat](#4-tujuan--manfaat)
5. [Solusi yang Ditawarkan: Aplikasi SMPJDC](#5-solusi-yang-ditawarkan-aplikasi-smpjdc)
6. [Fitur Unggulan Sistem](#6-fitur-unggulan-sistem)
7. [Perbandingan Sistem Lama vs Sistem Baru](#7-perbandingan-sistem-lama-vs-sistem-baru)
8. [Arsitektur Teknologi](#8-arsitektur-teknologi)
9. [Ruang Lingkup & Cakupan Area](#9-ruang-lingkup--cakupan-area)
10. [Metodologi Pengembangan](#10-metodologi-pengembangan)
11. [Timeline Implementasi](#11-timeline-implementasi)
12. [Rencana Anggaran Biaya (RAB) Detail](#12-rencana-anggaran-biaya-rab-detail)
13. [Analisis ROI (Return on Investment)](#13-analisis-roi-return-on-investment)
14. [Ketentuan Kerjasama & Skema Pembayaran](#14-ketentuan-kerjasama--skema-pembayaran)
15. [Penutup](#15-penutup)
16. [Lampiran](#16-lampiran)

---

## 1. RINGKASAN EKSEKUTIF

Jakarta Design Center (JDC) saat ini menggunakan sistem patroli keamanan gedung berbasis alat manual (*Guard Tour System* konvensional/mesin tempel RFID) untuk mengawasi dan memverifikasi kegiatan patroli petugas keamanan (Satpam). Namun, sistem tersebut memiliki sejumlah kendala operasional kritis, di antaranya:

- **Baterai titik checkpoint sering mati** — menyebabkan petugas tidak dapat melakukan pencatatan patroli di banyak titik.
- **Banyak titik checkpoint yang tidak berfungsi** — mengurangi akuntabilitas dan validasi kehadiran fisik petugas.
- **Laporan tidak real-time** — data baru bisa diunduh setelah shift selesai, sehingga manajemen tidak bisa memantau secara langsung.
- **Tidak ada dokumentasi visual** — alat lama hanya mencatat waktu & kode titik, tanpa foto bukti kondisi lapangan.
- **Rentan manipulasi** — alat dapat dititipkan kepada satu orang saja.

**Solusi yang Diajukan:** Pengembangan dan implementasi **SMPJDC (Sistem Manajemen Pengamanan Jakarta Design Center)**, sebuah platform digital terintegrasi berbasis **Aplikasi Mobile Android + Progressive Web App (PWA) + Cloud Dashboard Real-Time** yang dirancang khusus untuk menggantikan seluruh fungsi alat patroli manual dengan teknologi modern, transparan, dan anti-kecurangan.

**Total Estimasi Investasi:** Rp 64.950.000,- (Enam Puluh Empat Juta Sembilan Ratus Lima Puluh Ribu Rupiah)
**Waktu Implementasi:** 4 Minggu Go-Live
**Status Aplikasi:** ✅ Sudah selesai dikembangkan 100% dan siap operasional

---

## 2. ANALISIS 5W + 1H

### **WHAT — Apa?**
Pengajuan pengadaan dan implementasi **Aplikasi Sistem Manajemen Pengamanan Digital (SMPJDC)** sebagai pengganti alat patroli konvensional (mesin tempel/RFID reader) yang sudah tidak efektif. Aplikasi ini mencakup:
- Patroli Checkpoint Digital (QR Code) — 30 titik kontrol
- Presensi Mandiri dengan Anti-Fraud (Geofencing + Anti Fake-GPS)
- Dashboard Command Center Real-Time
- Ekspor Laporan PDF Resmi
- Portal Komplain Tenant
- Manajemen Roster & Lembur
- Serah Terima Mutasi Penjagaan Digital
- Tombol SOS Darurat

### **WHY — Mengapa?**
Karena sistem patroli manual yang saat ini digunakan memiliki masalah serius:

| No | Masalah Sistem Lama | Dampak Operasional |
|---|---|---|
| 1 | Baterai titik checkpoint sering mati/habis | Petugas tidak bisa mencatat kehadiran di titik tersebut |
| 2 | Banyak titik yang tidak berfungsi (rusak) | Data patroli tidak lengkap, sulit diaudit |
| 3 | Data tidak real-time | Manajemen baru tahu setelah shift selesai |
| 4 | Tidak ada foto bukti lapangan | Tidak bisa memverifikasi kondisi sebenarnya |
| 5 | Rawan manipulasi (dititipkan) | Satu orang bisa mewakili seluruh patroli |
| 6 | Biaya penggantian komponen mahal | Pengeluaran berulang tanpa peningkatan kualitas |
| 7 | Rekap laporan manual | Danru harus merekap data secara manual (butuh waktu) |

### **WHO — Siapa?**
| Pemangku Kepentingan | Peran |
|---|---|
| **Manajemen JDC / Building Manager** | Penerima & penyetuju proposal |
| **Richard Meha** | Lead Developer, System Architect, pembuat aplikasi |
| **Chief Security / SPV Keamanan** | Pengawas operasional keamanan |
| **Komandan Regu (Danru/Wadanru)** | Supervisor lapangan, pengelola roster & mutasi |
| **Anggota Satpam (4 Regu)** | Pengguna utama aplikasi di lapangan |
| **Tenant / Pengunjung JDC** | Pengguna modul komplain publik |

### **WHERE — Di Mana?**
- **Lokasi Gedung:** Jakarta Design Center, Jl. Jend. Gatot Subroto Kav. 53, Slipi, Jakarta Pusat 10260
- **Cakupan Area:** Seluruh gedung dari Basement hingga Lantai 6, Halaman Depan, Halaman Belakang, Halaman Samping Kanan & Kiri, Area Parkir, dan Lapangan Padel
- **Jumlah Titik Kontrol:** 30 Checkpoint Patroli + 15 Pos Jaga
- **Radius Geofencing:** 500 meter dari titik pusat JDC (Lat: -6.2088, Long: 106.8021)

### **WHEN — Kapan?**
- **Pengembangan Aplikasi:** Sudah selesai 100% (sudah dibangun dan diuji)
- **Rencana Implementasi:** Segera setelah proposal disetujui
- **Target Go-Live:** 4 minggu setelah persetujuan (setup database + pelatihan + pemasangan QR)
- **Masa Garansi:** 6 bulan gratis maintenance dan bug fixing

### **HOW — Bagaimana?**

Implementasi dilakukan dalam **4 fase** utama:

```
Fase 1 (Minggu 1-2)   : Setup infrastruktur cloud + database + deployment web
Fase 2 (Minggu 3-4)   : Cetak & pemasangan 30 QR Code akrilik di seluruh titik checkpoint
Fase 3 (Minggu 5-6)   : Instalasi APK di smartphone petugas + pelatihan seluruh personel
Fase 4 (Minggu 7-8)   : Go-Live operasional + monitoring transisi + evaluasi
```

---

## 3. LATAR BELAKANG & PERMASALAHAN

### 3.1 Kondisi Eksisting (Saat Ini)

Jakarta Design Center (JDC) merupakan gedung komersial bertingkat yang berlokasi strategis di Jl. Jend. Gatot Subroto, Jakarta Pusat. Untuk menjamin keamanan, ketertiban, dan pemeliharaan aset gedung, JDC menugaskan regu keamanan (Satpam) yang beroperasi dalam sistem shift 24 jam (Pagi, Siang, Malam, serta shift Middle dan BKO).

Saat ini, aktivitas patroli keliling gedung dilakukan menggunakan **Guard Tour System konvensional** — yaitu alat genggam berbasis RFID/kancing patroli yang memerlukan petugas menyentuhkan alat ke titik-titik checkpoint yang terpasang di dinding gedung.

### 3.2 Permasalahan Utama

1. **Baterai Titik Checkpoint Sering Mati**
   - Titik checkpoint RFID/kancing menggunakan baterai internal yang masa pakainya terbatas
   - Banyak titik yang baterainya sudah habis dan tidak segera diganti
   - Petugas tidak bisa merekam kehadirannya di titik yang mati

2. **Banyak Titik Checkpoint Rusak / Tidak Berfungsi**
   - Faktor cuaca, kelembaban, dan usia pakai menyebabkan kerusakan fisik
   - Biaya penggantian per unit cukup tinggi (Rp 50.000 — Rp 150.000/titik)
   - Proses pengadaan dan penggantian memakan waktu

3. **Monitoring Tidak Real-Time**
   - Data patroli tersimpan di memori alat dan baru bisa dilihat setelah di-download ke komputer
   - Jika terjadi insiden, manajemen/Danru baru mengetahui setelah shift selesai

4. **Tidak Ada Dokumentasi Visual**
   - Alat patroli lama hanya merekam **waktu** dan **kode titik**
   - Tidak bisa melampirkan foto bukti temuan (lampu mati, pintu terbuka, kebocoran, dll.)

5. **Rentan Kecurangan & Manipulasi**
   - Alat patroli bisa dititipkan — satu orang menyelesaikan seluruh rute untuk banyak petugas
   - Tidak ada validasi kehadiran fisik (GPS/foto selfie)

6. **Administrasi Manual yang Memakan Waktu**
   - Danru harus merekap data patroli secara manual setiap hari
   - Pencatatan mutasi penjagaan (serah terima shift) dilakukan di buku tulis
   - Laporan bulanan disusun secara manual di Excel

---

## 4. TUJUAN & MANFAAT

### 4.1 Tujuan

1. **Menggantikan alat patroli manual** yang sudah tidak efektif dengan sistem digital terintegrasi
2. **Menyediakan monitoring real-time** bagi manajemen dan Danru
3. **Mengeliminasi potensi kecurangan** dengan teknologi anti-fraud (Geofencing, Anti Fake-GPS, verifikasi foto)
4. **Mengotomatisasi pelaporan** — dari harian hingga bulanan, dalam format PDF resmi
5. **Menghemat biaya operasional** jangka panjang (tidak ada lagi biaya baterai, penggantian komponen, dll.)
6. **Meningkatkan citra profesionalisme** JDC sebagai gedung yang mengadopsi teknologi modern

### 4.2 Manfaat

| Pemangku Kepentingan | Manfaat yang Diperoleh |
|---|---|
| **Manajemen JDC** | Monitoring real-time via dashboard, laporan otomatis, transparansi penuh |
| **Chief Security / SPV** | Heatmap kepatuhan patroli, disposisi temuan cepat via WhatsApp |
| **Komandan Regu (Danru)** | Roster digital, rekap absensi otomatis, serah terima shift digital |
| **Anggota Satpam** | Alur kerja lebih mudah (scan QR via HP), tidak perlu bawa alat tambahan |
| **Tenant JDC** | Portal komplain digital dengan tracking tiket real-time |
| **Divisi Teknik & Cleaning** | Notifikasi temuan otomatis via WhatsApp berdasarkan kategori |

---

## 5. SOLUSI YANG DITAWARKAN: APLIKASI SMPJDC

**SMPJDC (Sistem Manajemen Pengamanan Jakarta Design Center)** adalah platform hybrid (Progressive Web App + Android Native) yang dirancang khusus dari nol (*from scratch*) untuk kebutuhan operasional keamanan gedung JDC.

### Keunggulan Utama:

| # | Keunggulan | Deskripsi |
|---|---|---|
| 1 | **100% Digital, Zero Hardware Dependency** | Tidak memerlukan alat patroli tambahan — cukup smartphone Android |
| 2 | **QR Code Akrilik Anti-Baterai** | Checkpoint menggunakan QR Code cetak akrilik — TIDAK ADA baterai, TIDAK PERNAH rusak karena daya habis |
| 3 | **Real-Time Monitoring** | Setiap scan, laporan, absensi langsung muncul di dashboard cloud |
| 4 | **Anti-Fraud Berlapis** | Geofencing 500m, Anti Fake-GPS, Deteksi Developer Options, Verifikasi Waktu NTP Server |
| 5 | **Offline-First (Zero Data Loss)** | Data tetap tersimpan meski tanpa internet, otomatis sync saat online kembali |
| 6 | **Foto Dokumentasi Temuan** | Setiap temuan bisa dilengkapi foto bukti untuk audit |
| 7 | **Ekspor Laporan PDF Resmi** | Format A4 landscape dengan kop resmi, nomor registrasi, dan metadata lengkap |
| 8 | **Multi-Platform** | Bisa diakses via Android (APK), Browser (PWA), dan PC (Dashboard Management) |

---

## 6. FITUR UNGGULAN SISTEM

### 6.1 Modul Validasi NRP Danru & Klasifikasi Otomatis Regu Patroli (Regu A, B, C, D)
**Kegunaan & Alur Kerja:**
- **Mekanisme Verifikasi Berjenjang:** Sebelum anggota Satpam dapat memulai rute patroli di lapangan, sistem mewajibkan anggota untuk memasukkan / memvalidasi **NRP Komandan Regu (Danru)** yang sedang berdinas pada shift tersebut.
- **Klasifikasi Otomatis:** Berdasarkan verifikasi NRP Danru, sistem secara cerdas mengelompokkan dan mengklasifikasikan sesi patroli tersebut ke regu yang bersangkutan (**Regu A, Regu B, Regu C, atau Regu D**).
- **Rantai Komando & Akuntabilitas:** Menjamin tidak ada patroli tanpa pengawasan Danru. Di laporan dan dashboard manajemen, langsung tercatat: *Nama Petugas Patroli*, *NRP & Nama Danru Pembina*, *Regu Dinas*, dan *Shift Penugasan*.
- **Evaluasi Kinerja Regu:** Memungkinkan manajemen membandingkan performa dan kepatuhan patroli antar regu secara transparan dan adil (Regu mana yang paling rajin, tepat waktu, dan teliti dalam patroli).

### 6.2 Modul Patroli Checkpoint Digital (30 Titik)
**Kegunaan & Alur Kerja:**
- Pemindaian plat akrilik QR Code permanen di setiap lantai dan zona (Basement s/d Lt. 6, Perimeter Luar, Parkir, hingga Lapangan Padel).
- Validasi keberadaan fisik petugas melalui GPS Geofencing + Timestamp tersinkronisasi server NTP.
- Formulir Cepat Kondisi Area: Status **Aman / Kondusif** atau **Ada Temuan**.
- Fitur Pelaporan Temuan Lengkap: Jika ada anomali (misal: pintu darurat tidak terkunci, lampu mati, kebocoran pipa, kaca retak), petugas langsung mengambil foto bukti lapangan, memilih kategori bahaya, dan menuliskan keterangan langsung di aplikasi.

### 6.3 Modul Sistem Tiketing Komplain, Aspirasi, & Kritik Saran Tenant / Publik
**Kegunaan & Alur Kerja:**
- **Akses Publik Tanpa Login:** Pengunjung gedung, pemilik stan/toko, maupun tenant perkantoran JDC cukup memindai QR Code poster "Pusat Bantuan & Layanan JDC" yang ditempel di lobby, lift, atau area publik.
- **Formulir Pengaduan & Kritik Saran Modern:** Pelapor dapat menuliskan keluhan fasilitas, kritik membangun, maupun saran peningkatan mutu gedung tanpa harus memasang aplikasi khusus.
- **Nomor Tiket Otomatis (#TKT-JDC-XXXX):** Setiap pengaduan atau kritik saran langsung diterbitkan nomor tiket resmi unik yang dapat dilacak progresnya oleh pelapor secara real-time.
- **Klasifikasi 6 Kategori Layanan:**
  1. *Fasilitas Gedung:* Lift, eskalator, pintu otomatis, toilet, penerangan.
  2. *Engineering / MEP:* Kelistrikan, AC, kebocoran pipa air, hydrant.
  3. *Housekeeping / Cleaning:* Area kotor, tempat sampah penuh, tumpahan cairan.
  4. *Keamanan / Security:* Parkir liar, barang mencurigakan, ketertiban.
  5. *Kritik & Saran:* Kotak aspirasi digital untuk masukan perbaikan layanan dan kepuasan tenant/pengunjung.
  6. *Lain-lain:* Pengaduan dan catatan khusus lainnya.
- **Pelacakan Status Transparan (SLA):** Status tiket bergerak dari **Baru (Submitted)** ➔ **Sedang Diproses (In Progress)** ➔ **Selesai (Resolved)** dengan catatan tindak lanjut.
- **Notifikasi Cepat WhatsApp:** Danru dan manajemen dapat langsung mendisposisikan tiket aduan atau kritik saran ini ke nomor WhatsApp PIC terkait (Teknisi, Cleaning, Keamanan, atau Manajemen Gedung) hanya dengan 1 klik.

### 6.4 Modul Disposisi Cepat WhatsApp PIC (Teknisi, Cleaning, Keamanan)
**Kegunaan & Alur Kerja:**
- Menghubungkan temuan patroli satpam dan komplain tenant langsung ke smartphone tim eksekutor lapangan.
- Template pesan WhatsApp resmi otomatis terisi: Lokasi gedung, jenis temuan, foto bukti, waktu kejadian, dan kontak pelapor/petugas.
- Memangkas birokrasi komunikasi dari hitungan jam menjadi hitungan detik.

### 6.5 Modul Presensi Mandiri & Deteksi Anti-Fraud Berlapis
**Kegunaan & Alur Kerja:**
- **Geofencing Presisi 500 Meter:** Hanya mengizinkan check-in/check-out absensi jika perangkat terdeteksi secara fisik berada di lingkungan gedung JDC.
- **Anti Fake-GPS & Mock Location:** Mendeteksi dan memblokir aplikasi pemalsu GPS (seperti Fake GPS Joystick, FlyGPS, dsb.) serta mendeteksi penggunaan emulator komputer.
- **Deteksi Developer Options:** Memblokir perangkat Android yang mengaktifkan mode debugging/rooting yang berpotensi memanipulasi aplikasi.
- **Verifikasi Waktu Server NTP:** Mencegah kecurangan petugas yang mengubah jam di pengaturan HP mereka untuk absensi mundur/maju.
- **Toleransi Cerdas Basement:** Algoritma khusus yang mengenali pantulan sinyal dan toleransi koordinat saat petugas berada di area basement.

### 6.6 Modul SOP & Serah Terima Mutasi Penjagaan Digital
**Kegunaan & Alur Kerja:**
- Menggantikan buku mutasi tulis tangan konvensional yang rentan basah, sobek, atau hilang.
- Checklist Inventaris Dinas Terpadu: Pengecekan kondisi Handy Talky (HT), charger, kunci master gedung, senter patroli, tongkat, rompi, dan buku register tamu.
- Catatan Khusus Shift: Poin instruksi penting dari Danru shift lama yang wajib diperhatikan oleh Danru shift baru (misal: "Lantai 3 sedang ada renovasi tenant malam hari").
- Tanda Tangan Digital / Validasi PIN serah terima antar Danru.

### 6.7 Modul Manajemen Roster Shift & Rekap Lembur (Excel)
**Kegunaan & Alur Kerja:**
- Kalender penjadwalan dinas bulanan untuk seluruh personel (Shift Pagi, Shift Siang, Shift Malam, Middle, BKO, dan Hari Libur/Lepas).
- Integrasi Penuh Microsoft Excel (.xlsx): Danru dapat mengunduh format template, mengisi roster bulanan di laptop, lalu mengunggahnya (import) ke sistem dengan 1 klik.
- Perhitungan Otomatis Jam Lembur: Sistem mengkalkulasi kelebihan jam dinas secara otomatis untuk transparansi penggajian dan efisiensi waktu Danru.

### 6.8 Modul Command Center & Real-Time Dashboard
**Kegunaan & Alur Kerja:**
- Peta Interaktif Leaflet OpenStreetMap: Menampilkan sebaran 15 pos jaga dan status regu yang sedang bertugas.
- Heatmap Kepatuhan Patroli: Indikator visual warna (Hijau/Kuning/Merah) persentase kepatuhan patroli per lantai (Basement hingga Lt. 6).
- Ringkasan Statistik Live: Total checkpoint discan hari ini, sisa titik belum patroli, temuan kerusakan aktif, dan status darurat.

### 6.9 Modul Lost & Found (Pencatatan Barang Temuan & Pengembalian)
**Kegunaan & Alur Kerja:**
- Registrasi Barang Tertinggal: Mencatat temuan dompet, ponsel, kunci, kartu akses, atau barang bawaan pengunjung/tenant di area JDC.
- Dokumentasi Foto & Deskripsi Lengkap: Lokasi penemuan, waktu, identitas petugas yang menemukan, serta tempat penyimpanan aman.
- Berita Acara Serah Terima: Formulir verifikasi saat pemilik sah mengambil barang dengan validasi identitas dan dokumentasi serah terima.

### 6.10 Kemampuan Offline-First (Zero Data Loss)
**Kegunaan & Alur Kerja:**
- Menggunakan basis data lokal IndexedDB yang ditenagai oleh LocalForage.
- Saat petugas patroli di area blind-spot (seperti ruang panel elektrik Basement atau tangga darurat tebal tanpa sinyal), aplikasi tetap bekerja lancar dan menyimpan scan secara lokal.
- Begitu perangkat mendeteksi sinyal internet atau Wi-Fi gedung, seluruh data patroli dan foto otomatis tersinkronisasi ke server Supabase tanpa intervensi manual.

### 6.11 Tombol SOS Darurat dengan Sirene & Koordinat
**Kegunaan & Alur Kerja:**
- Dirancang untuk situasi kritis (kebakaran, ancaman kejahatan, kecelakaan kerja, orang mencurigakan).
- Tombol "Press & Hold" selama 2 detik untuk menghindari ketidaksengajaan.
- Mengaktifkan suara sirene peringatan berkekuatan tinggi dari perangkat dan seketika menyiarkan (broadcast) alert darurat beserta koordinat lokasi GPS ke seluruh ponsel Danru dan Command Center.

### 6.12 Ekspor Laporan PDF Resmi A4 Landscape
**Kegunaan & Alur Kerja:**
- Otomatisasi penuh tanpa perlu Danru mengetik ulang laporan di Excel atau Word.
- Format standar resmi gedung: Menggunakan Kop Surat Resmi SMPJDC, nomor registrasi unik laporan, tanggal, rekap kehadiran regu, tabel rekapitulasi 30 titik checkpoint, foto resolusi tinggi terkompresi, serta kolom tanda tangan Danru dan Chief Security.
- Siap dicetak langsung atau diarsipkan untuk laporan bulanan ke Building Management.

### 6.13 Barcode & QR Code Generator Internal
**Kegunaan & Alur Kerja:**
- Modul internal bagi admin untuk menghasilkan kode QR baru jika ada penambahan titik checkpoint patroli di masa depan, atau pencetakan ulang QR akrilik yang rusak/hilang.
- Mampu menghasilkan QR Code untuk ID Card personel dengan enkripsi data internal.

---

## 7. PERBANDINGAN SISTEM LAMA VS SISTEM BARU

| Aspek | Sistem Lama (Guard Tour Manual) | Sistem Baru (SMPJDC Digital) |
|---|---|---|
| **Alat yang Digunakan** | Mesin genggam RFID / kancing patroli | Smartphone Android (sudah dimiliki petugas) |
| **Titik Checkpoint** | Tag RFID/kancing (perlu baterai) | QR Code akrilik cetak (TANPA baterai) |
| **Kendala Baterai** | ❌ Sering mati, banyak titik tidak berfungsi | ✅ Tidak ada baterai — QR Code permanen |
| **Monitoring** | ❌ Tertunda (harus download data) | ✅ Real-time via cloud dashboard |
| **Dokumentasi Visual** | ❌ Tidak ada (hanya waktu & kode) | ✅ Foto temuan + kategori + keterangan |
| **Anti-Kecurangan** | ❌ Bisa dititipkan | ✅ GPS + Anti Fake-GPS + verifikasi foto |
| **Laporan** | ❌ Rekap manual oleh Danru | ✅ Otomatis generate PDF resmi |
| **Biaya Maintenance** | ❌ Tinggi (ganti baterai, komponen rusak) | ✅ Minimal (hanya kuota internet) |
| **Tombol Darurat** | ❌ Tidak ada | ✅ SOS Darurat + sirene + broadcast |
| **Portal Komplain** | ❌ Tidak ada | ✅ Tiket digital real-time |
| **Offline Capability** | ⚠️ Simpan di alat, risiko hilang | ✅ IndexedDB + auto-sync (zero data loss) |
| **Skalabilitas** | ❌ Terbatas pada kapasitas alat | ✅ Unlimited — tinggal tambah QR Code |

---

## 8. ARSITEKTUR TEKNOLOGI

Aplikasi SMPJDC dibangun **dari nol (from scratch)** menggunakan teknologi modern dan terbukti:

```
ARSITEKTUR STACK SMPJDC
═══════════════════════════════════════════════════
│ LAYER              │ TEKNOLOGI                   │
═══════════════════════════════════════════════════
│ Frontend Core      │ React 18 (Hooks, Lazy       │
│                    │ Suspense, Error Boundaries)  │
│ Build Tool         │ Vite 5 (Fast HMR, Terser    │
│                    │ Rollup Bundling)             │
│ Native Mobile      │ Capacitor 6 (Android Studio, │
│                    │ Java Bridge, Native Plugins) │
│ Cloud Database     │ Supabase PostgreSQL          │
│                    │ (Realtime + RLS Security)    │
│ Cloud Storage      │ Supabase Storage Bucket      │
│ Local Persistence  │ LocalForage (IndexedDB) +    │
│                    │ localStorage Fallback        │
│ QR Code Engine     │ html5-qrcode (Scanner) +     │
│                    │ node-qrcode (Generator)      │
│ UI Framework       │ Lucide React Icons +         │
│                    │ Custom Glassmorphism CSS      │
│ Spreadsheet Engine │ SheetJS (xlsx full bundle)   │
│ Map/GPS Engine     │ Leaflet OpenStreetMap        │
│ PDF Engine         │ Custom Canvas-to-PDF Builder │
│ Haptic Feedback    │ Capacitor Haptics            │
═══════════════════════════════════════════════════
```

### Mengapa Teknologi Ini Dipilih?

| Teknologi | Alasan Pemilihan |
|---|---|
| **React 18** | Library UI terpopuler, performa tinggi, ekosistem luas |
| **Vite 5** | Build tool tercepat di industri, hot reload instan |
| **Capacitor 6** | Bridge mobile terbaik — satu codebase untuk Web + Android |
| **Supabase** | Database PostgreSQL gratis dengan realtime sync + Row Level Security |
| **LocalForage** | Penyimpanan offline terbaik, 10x lebih cepat dari localStorage |
| **QR Code Akrilik** | Tanpa baterai, tahan cuaca, biaya murah, mudah diganti |

### 8.2 Master Flowchart Alur Kerja Sistem dari Nol (End-to-End Workflow)

Aplikasi SMPJDC mengintegrasikan seluruh operasional pengamanan dalam satu siklus tertutup (*closed-loop digital ecosystem*), mulai dari tahap inisialisasi administrator, presensi anti-fraud petugas, pelaksanaan patroli 30 titik dengan validasi komando Danru, penanganan komplain tenant, hingga pelaporan otomatis ke Direksi:

```mermaid
flowchart TD
    classDef startEnd fill:#00f0ff,stroke:#00a8b3,stroke-width:2px,color:#0a0e1a;
    classDef process fill:#1e293b,stroke:#3b82f6,stroke-width:2px,color:#f8fafc;
    classDef decision fill:#312e81,stroke:#818cf8,stroke-width:2px,color:#fff;
    classDef warning fill:#7f1d1d,stroke:#ef4444,stroke-width:2px,color:#fca5a5;
    classDef cloud fill:#064e3b,stroke:#10b981,stroke-width:2px,color:#a7f3d0;
    classDef public fill:#78350f,stroke:#f59e0b,stroke-width:2px,color:#fde68a;

    %% FASE 1
    subgraph F1 ["FASE 1: INISIALISASI & SETUP ADMINISTRASI"]
        A([Mulai: Administrator / Chief]) :::startEnd --> B[Generate 30 QR Code Akrilik & Pos Jaga]:::process
        B --> C[Pemasangan Plat QR Fisik di Basement s/d Lt 6 + Perimeter]:::process
        C --> D[Setup Jadwal Roster 4 Regu A/B/C/D & Mapping NRP Danru]:::process
    end

    %% FASE 2
    subgraph F2 ["FASE 2: APEL & PRESENSI MANDIRI ANTI-FRAUD"]
        E([Petugas Satpam Buka Aplikasi]) :::startEnd --> F[Login PIN Petugas]:::process
        F --> G{Deteksi Fake GPS / Mock Location<br>& Developer Options Aktif?}:::decision
        G -- Terdeteksi Curang --> H[BLOKIR AKSES & Catat Indikasi Fraud]:::warning
        G -- Aman --> I{Validasi Radius GPS JDC<br><= 500 Meter?}:::decision
        I -- Di Luar Area --> J[Ditolak: Wajib Berada di Gedung JDC]:::warning
        I -- Sesuai Area --> K[Foto Selfie Wajah Real-Time]:::process
        K --> L[Pilih Shift, Regu, dan Pos Plotting]:::process
        L --> M[(Database Supabase: Status ON-DUTY)]:::cloud
    end

    %% FASE 3
    subgraph F3 ["FASE 3: PELAKSANAAN PATROLI CHECKPOINT (CORE)"]
        N([Mulai Rute Patroli]) :::startEnd --> O[Wajib Input / Pilih NRP Danru Berdinas]:::process
        O --> P[Sistem Mengunci Data ke Regu A / B / C / D]:::process
        P --> Q[Menuju Checkpoint 1 s/d 30]:::process
        Q --> R[Scan Plat QR Akrilik di Titik Checkpoint]:::process
        R --> S{Status Checkpoint?}:::decision
        S -- AMAN / NORMAL --> T[Submit Data Scan Checkpoint]:::process
        S -- ADA TEMUAN --> U[Pilih Kategori: Pintu/Hydrant/Lampu/Kebocoran dll.]:::process
        U --> V[Ambil Foto Bukti Temuan + Catatan Darurat]:::process
        V --> T
        
        T --> W{Koneksi Internet Tersedia?}:::decision
        W -- Tidak Ada (Basement) --> X[Simpan di IndexedDB LocalStorage HP]:::process
        W -- Ada Sinyal --> Y[(Sync ke Supabase Cloud PostgreSQL)]:::cloud
        X -. Auto-Sync Saat Dapat Sinyal .-> Y
    end

    %% FASE 4
    subgraph F4 ["FASE 4: PORTAL KOMPLAIN TENANT & LAYANAN GEDUNG"]
        Z([Tenant Scan Poster QR di Lift / Lobby]) :::public --> AA[Form Komplain Terbuka Tanpa Perlu Login]:::public
        AA --> AB[Isi Aduan Fasilitas + Lampirkan Foto Kerusakan]:::public
        AB --> AC[Sistem Terbitkan Kode Tiket: #TKT-JDC-XXXX]:::public
        AC --> AD[(Notifikasi Masuk ke Command Center)]:::cloud
        AD --> AE[Danru Disposisi 1-Klik ke WhatsApp Teknisi / Cleaning]:::process
        AE --> AF[Penyelesaian Masalah -> Update Status Tiket: SELESAI]:::process
    end

    %% FASE 5
    subgraph F5 ["FASE 5: COMMAND CENTER, MUTASI, & AUDIT DIREKSI"]
        Y --> AG[Live Monitoring Heatmap Kepatuhan & GPS]:::cloud
        AD --> AG
        AG --> AH[Buku Mutasi Penjagaan Digital & Serah Terima Shift]:::process
        AH --> AI[Petugas Presensi Keluar + Foto Selfie]:::process
        AI --> AJ[Danru / Chief Tekan Tombol 1-Klik Cetak Laporan]:::process
        AJ --> AK[(Generate Dokumen PDF Resmi A4 Siap Audit)]:::cloud
        AK --> AL([Review Eksekutif oleh Building Manager & Direksi JDC]) :::startEnd
    end

    D --> E
    M --> N
```

#### Rincian 5 Fase Operasional:
1. **Fase Inisialisasi:** Pemasangan 30 plat QR Code akrilik permanen tanpa baterai dan konfigurasi master data (NRP, roster shift, titik koordinat gedung).
2. **Fase Presensi Anti-Fraud:** Validasi 3 lapis (Device Security Check, Geofencing radius 500 meter, dan swafoto wajah) untuk menjamin akuntabilitas kehadiran fisik.
3. **Fase Rantai Komando & Patroli Checkpoint:** Anggota wajib menautkan patrolinya dengan NRP Danru bertugas, memastikan tidak ada patroli liar dan memudahkan evaluasi kedisiplinan per regu. Dilengkapi teknologi *Offline-First* (IndexedDB) sehingga tetap beroperasi normal di ruang panel basement yang kedap sinyal.
4. **Fase Layanan Terpadu Gedung:** Menghubungkan tenant dan pengunjung dengan tim operasional melalui tiket digital `#TKT-JDC-XXXX` yang terintegrasi dengan disposisi WhatsApp instan.
5. **Fase Command Center & Eksekutif:** Memungkinkan pimpinan memantau kepatuhan secara *real-time* dan mencetak laporan resmi berformat PDF A4 lengkap dengan foto bukti temuan lapangan dalam 1 klik.

---

## 9. RUANG LINGKUP & CAKUPAN AREA

### 9.1 Cakupan 30 Titik Checkpoint Patroli

| Zona | Jumlah Titik | Lokasi |
|---|---|---|
| Basement | 2 titik | Depan R. Elektrik, R. Ganti Pakaian Security |
| Lantai 1 | 2 titik | Tangga Sudut BNI 46, Tangga Sudut Gardu PLN |
| Lantai 2 | 2 titik | Tangga Sudut Pantry, Tangga Sudut BNI 46 |
| Lantai 3 | 2 titik | Tangga Sudut Staff Security, Tangga Sudut Gardu PLN |
| Lantai 4 | 2 titik | Tangga Sudut Pantry, Tangga Sudut BNI 46 |
| Lantai 5 | 2 titik | Tangga Sudut Gardu PLN, Tangga Sudut R. Rapat |
| Lantai 6 | 2 titik | Tangga Sudut Mushola, Depan Gudang Banquet |
| Halaman Depan | 5 titik | IAI DKI, Chiller, ATM Mandiri, Pos Keluar, Pos Masuk |
| Halaman Samping Kanan | 3 titik | Canopy Basement, Posco OO, R. Teknik |
| Halaman Belakang | 6 titik | Gardu Genset, Parkir Motor, Gardu PLN, Kantin, Padel I & II |
| Area Padel | 1 titik | Pintu Padel |
| Halaman Samping Kiri | 1 titik | Kopi Tuku |
| **TOTAL** | **30 Titik** | |

### 9.2 Cakupan 15 Pos Jaga

Pos Jaga Utama JDC, Pos Basement, Pos Lift, Pos Lobby, Pos Lt 2-3, Pos Lt 4-5, Pos Lt 6-7, Pos Parkir Mobil, Pos Halaman Depan (3 zona), Pos Halaman Belakang, Pos Parkir Motor (2 pos).

---

## 10. METODOLOGI PENGEMBANGAN

Aplikasi SMPJDC dikembangkan menggunakan metodologi **Agile Development** dengan pendekatan iteratif:

- **Sprint 1 (Minggu 1-2):** Analisis kebutuhan lapangan, survei 30 titik checkpoint, wawancara Danru & anggota
- **Sprint 2 (Minggu 3-4):** Desain UI/UX seluruh modul, wireframe, prototyping (Glassmorphism Theme)
- **Sprint 3 (Minggu 5-8):** Development frontend React 18, backend Supabase, 21 komponen, integrasi QR Scanner
- **Sprint 4 (Minggu 9-10):** Native Android build (Capacitor 6), plugin keamanan Java, Fake GPS detection
- **Sprint 5 (Minggu 11):** Quality Assurance, bug fixing, stress testing, security audit
- **Sprint 6 (Minggu 12):** Deployment produksi, pelatihan, go-live operasional

---

## 11. TIMELINE IMPLEMENTASI

| Minggu | Aktivitas | Penanggung Jawab |
|---|---|---|
| **Minggu 1** | Setup database Supabase (run SQL script), konfigurasi cloud storage, deployment web ke hosting | Developer (Richard) |
| **Minggu 2** | Cetak 30 QR Code akrilik + pemasangan di seluruh titik checkpoint gedung | Developer + Tim Teknik |
| **Minggu 3** | Instalasi APK di smartphone petugas, registrasi akun seluruh personel, konfigurasi roster | Developer + Danru |
| **Minggu 4** | Pelatihan operasional Satpam (scan QR, absensi, mutasi, SOS) | Developer |
| **Minggu 5** | Pelatihan Danru/Wadanru (dashboard, roster, ekspor PDF, complaint admin) | Developer |
| **Minggu 6** | Pelatihan Manajemen (command center, heatmap, disposisi WhatsApp) | Developer |
| **Minggu 7-8** | **GO-LIVE** — Operasional penuh + monitoring transisi + evaluasi awal | Seluruh tim |
| **Minggu 9-12** | Monitoring pasca-implementasi, fine-tuning, bug fixing jika ada | Developer |

---

## 12. RENCANA ANGGARAN BIAYA (RAB) DETAIL

### A. Biaya Pengembangan Aplikasi (Sudah Selesai)

| No | Komponen Pekerjaan | Spesifikasi | Vol | Satuan | Harga Satuan (Rp) | Total (Rp) |
|---|---|---|---|---|---|---|
| 1 | Analisis Sistem & Survei Lapangan | Survei 30 titik + 15 pos, SRS | 1 | Paket | 3.000.000 | 3.000.000 |
| 2 | Desain UI/UX Aplikasi | 10 modul, Glassmorphism, responsive | 1 | Proyek | 5.000.000 | 5.000.000 |
| 3 | Frontend Development (React 18) | 21 komponen, 3.500+ line JSX | 3 | Bulan | 8.000.000 | 24.000.000 |
| 4 | Backend & Database (Supabase) | 10 tabel, RLS, Realtime, Storage | 2 | Bulan | 6.000.000 | 12.000.000 |
| 5 | Android Native Build (Capacitor 6) | APK + Plugin Java (DeviceSecurity) | 1 | Bulan | 5.000.000 | 5.000.000 |
| 6 | Modul Keamanan (Anti-Fraud) | Geofencing, Fake GPS, NTP, Tamper | 1 | Paket | 4.000.000 | 4.000.000 |
| 7 | Quality Assurance & Testing | Unit test, integrasi, stress test | 1 | Paket | 2.500.000 | 2.500.000 |
| | **Subtotal A** | | | | | **55.500.000** |

### B. Biaya Infrastruktur & Material

| No | Komponen | Spesifikasi | Vol | Satuan | Harga Satuan (Rp) | Total (Rp) |
|---|---|---|---|---|---|---|
| 1 | Cetak QR Code Akrilik | Ukuran 10x10 cm, full color, tahan air | 30 | Pcs | 35.000 | 1.050.000 |
| 2 | QR Code Cadangan | Untuk penggantian jika rusak/hilang | 10 | Pcs | 35.000 | 350.000 |
| 3 | Sewa Cloud Database (Supabase Free Tier) | PostgreSQL + Realtime + Storage | 1 | Tahun | 0 | 0 |
| 4 | Sewa Hosting Web (Vercel/Netlify) | CDN global, SSL otomatis, Free Tier | 1 | Tahun | 0 | 0 |
| 5 | Domain Kustom (opsional) | .com atau .id | 1 | Tahun | 250.000 | 250.000 |
| | **Subtotal B** | | | | | **1.650.000** |

### C. Biaya Implementasi & Pelatihan

| No | Komponen | Spesifikasi | Vol | Satuan | Harga Satuan (Rp) | Total (Rp) |
|---|---|---|---|---|---|---|
| 1 | Deployment & Konfigurasi Server | Setup database, storage, hosting | 1 | Paket | 1.500.000 | 1.500.000 |
| 2 | Instalasi APK & Registrasi Akun | Setup di smartphone petugas | 1 | Paket | 500.000 | 500.000 |
| 3 | Pemasangan QR Code di 30 Titik | Termasuk lem khusus + bracket | 1 | Paket | 800.000 | 800.000 |
| 4 | Pelatihan Satpam (Anggota) | 4 sesi (per regu), hands-on | 4 | Sesi | 500.000 | 2.000.000 |
| 5 | Pelatihan Danru/Wadanru | 2 sesi, fitur advanced | 2 | Sesi | 500.000 | 1.000.000 |
| 6 | Pelatihan Manajemen | 1 sesi, dashboard & reporting | 1 | Sesi | 1.000.000 | 1.000.000 |
| 7 | User Manual & Dokumentasi | Panduan operasional lengkap (digital) | 1 | Paket | 1.000.000 | 1.000.000 |
| | **Subtotal C** | | | | | **7.800.000** |

### D. Biaya Garansi & Pemeliharaan

| No | Komponen | Spesifikasi | Vol | Satuan | Harga Satuan (Rp) | Total (Rp) |
|---|---|---|---|---|---|---|
| 1 | Garansi Bug Fixing | 6 bulan pertama pasca go-live | 1 | Paket | GRATIS | 0 |
| 2 | Maintenance Berkala (Opsional) | Setelah masa garansi (per bulan) | 12 | Bulan | 500.000 | 6.000.000* |
| | **Subtotal D** | | | | | **0** |

---

### REKAPITULASI TOTAL RAB

| Kategori | Total (Rp) |
|---|---|
| A. Pengembangan Aplikasi | 55.500.000 |
| B. Infrastruktur & Material | 1.650.000 |
| C. Implementasi & Pelatihan | 7.800.000 |
| D. Garansi (6 Bulan) | GRATIS |
| | |
| **TOTAL INVESTASI** | **Rp 64.950.000** |
| PPN 11% (jika dikenakan) | Rp 7.144.500 |
| **GRAND TOTAL (termasuk PPN)** | **Rp 72.094.500** |
| **GRAND TOTAL (tanpa PPN)** | **Rp 64.950.000** |

---

## 13. ANALISIS ROI (RETURN ON INVESTMENT)

### Perbandingan Biaya 3 Tahun

| Komponen Biaya | Sistem Lama (Manual) | Sistem Baru (SMPJDC) |
|---|---|---|
| Investasi Awal (Alat/Aplikasi) | Rp 15.000.000 (2 unit mesin) | Rp 64.950.000 |
| Penggantian Baterai Checkpoint/tahun | Rp 4.500.000 (30 titik × Rp 150.000) | Rp 0 |
| Penggantian Alat Rusak/tahun | Rp 3.000.000 | Rp 0 |
| QR Code Pengganti/tahun | Rp 0 | Rp 350.000 |
| Biaya Cloud/tahun | Rp 0 | Rp 0 (Free Tier) |
| Waktu Rekap Manual (senilai jam kerja)/tahun | Rp 7.200.000 (est. 2 jam/hari × 300 hari) | Rp 0 (otomatis) |
| **Total 3 Tahun** | **Rp 59.100.000** | **Rp 65.650.000** |

### Manfaat Non-Finansial (Intangible Benefits):
- ✅ Transparansi dan akuntabilitas 100%
- ✅ Pencegahan kecurangan secara real-time
- ✅ Dokumentasi visual untuk audit
- ✅ Peningkatan citra profesionalisme JDC
- ✅ Kecepatan respons terhadap insiden
- ✅ Kepuasan tenant meningkat (portal komplain)

---

## 14. KETENTUAN KERJASAMA & SKEMA PEMBAYARAN

### Skema Pembayaran (Termin):

| Termin | Tahapan | Persentase | Nominal (Rp) |
|---|---|---|---|
| **Termin 1 (DP)** | Saat proposal disetujui & kontrak ditandatangani | 30% | 19.485.000 |
| **Termin 2** | Setelah deployment web + database + cetak QR selesai | 40% | 25.980.000 |
| **Termin 3** | Setelah Go-Live + pelatihan selesai + UAT diterima | 30% | 19.485.000 |
| **TOTAL** | | **100%** | **64.950.000** |

---

## 15. PENUTUP

Demikian proposal pengajuan Sistem Manajemen Pengamanan Digital (SMPJDC) ini kami sampaikan. Dengan mengadopsi teknologi ini, Jakarta Design Center akan memiliki sistem patroli yang mandiri, tahan cuaca, tanpa ketergantungan baterai, dan terintegrasi secara digital.

Hormat kami,

**Richard Meha**
Lead Developer & System Architect
SMPJDC — Jakarta Design Center
Oktober 2026
