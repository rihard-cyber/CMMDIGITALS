# PANDUAN LENGKAP OPERASIONAL & RUNBOOK PELUNCURAN SMPJDC
**SISTEM MANAJEMEN KEAMANAN JAKARTA DESIGN CENTER (SMPJDC)**  
*Dokumen Kesiapan Produksi (Production Readiness & Operational Manual)*  
*Lead Architect: Richard Meha | Versi Rilis: 1.0.1 Stable*

---

## 📑 DAFTAR ISI
1. [Ringkasan Eksekutif & Status Aplikasi](#1-ringkasan-eksekutif--status-aplikasi)
2. [Checklist Kesiapan Running Besok (H-1)](#2-checklist-kesiapan-running-besok-h-1)
3. [Panduan Setup Database Cloud Supabase (1-Klik)](#3-panduan-setup-database-cloud-supabase-1-klik)
4. [Mekanisme Akun Login & Autentikasi PIN Universal](#4-mekanisme-akun-login--autentikasi-pin-universal)
5. [SOP & Panduan Petugas Lapangan (Anggota Satpam)](#5-sop--panduan-petugas-lapangan-anggota-satpam)
6. [SOP Komandan Regu (Danru & Wadanru)](#6-sop-komandan-regu-danru--wadanru)
7. [SOP Manajemen & Superadmin (Monitoring & Ekspor Laporan)](#7-sop-manajemen--superadmin-monitoring--ekspor-laporan)
8. [Modul Komplain Tenant & Tiket Layanan Publik](#8-modul-komplain-tenant--tiket-layanan-publik)
9. [Penanganan Masalah Lapangan (Troubleshooting Matrix)](#9-penanganan-masalah-lapangan-troubleshooting-matrix)
10. [Daftar 30 Titik Checkpoint & 15 Pos Jaga JDC](#10-daftar-30-titik-checkpoint--15-pos-jaga-jdc)

---

## 1. RINGKASAN EKSEKUTIF & STATUS APLIKASI

Aplikasi **SMPJDC (Sistem Manajemen Pengamanan Jakarta Design Center)** adalah platform hybrid (Progressive Web App + Android Native Capacitor) yang dirancang khusus untuk memodernisasi tata kelola operasional keamanan gedung Jakarta Design Center (Jl. Jend. Gatot Subroto Kav. 53, Slipi, Jakarta Pusat).

### Hasil Audit Senior Developer:
- **Build Status**: ✅ `npm run build` sukses 100% tanpa error dan tanpa peringatan chunk splitting.
- **Android Sync Status**: ✅ `npx cap sync android` sukses, seluruh web assets terkompilasi ke folder `android/app/src/main/assets/public/` dan 5 plugin native tersinkronisasi.
- **Audit GPS & Anti-Fake**: 
  - Koordinat geofence telah diperbaiki secara presisi ke koordinat fisik JDC: **Latitude `-6.2088`**, **Longitude `106.8021`**.
  - Radius toleransi disetel aman ke **500 meter**, mencakup seluruh area gedung (Basement s/d Lt 6), halaman depan, halaman belakang, area parkir, hingga lapangan padel.
  - Deteksi GPS indoor telah disempurnakan dengan *fallback network location*: petugas di Basement 1 dan ruang tertutup tidak akan terblokir oleh kegagalan satelit GPS.
- **Autentikasi PIN Universal**: Petugas dapat login menggunakan **4-digit terakhir NRP** maupun **NRP lengkap**. Sistem secara otomatis memvalidasi dan menyimpan PIN tanpa risiko salah input yang berujung lockout.
- **Perlindungan Offline (Anti-Loss Data)**: Menggunakan teknologi **IndexedDB (LocalForage)** dengan fallback otomatis ke `localStorage`. Laporan patroli saat petugas berada di area *blank spot* (tanpa sinyal) otomatis masuk ke antrean offline (`sapujagat_offline_queue`) dan otomatis disinkronkan saat terhubung kembali ke jaringan.

---

## 2. CHECKLIST KESIAPAN RUNNING BESOK (H-1)

Gunakan checklist ini sebelum menyerahkan perangkat kepada regu jaga besok pagi:

| No | Komponen / Pengujian | Status | Catatan Operasional |
|---|---|:---:|---|
| 1 | Database Supabase Schema & RLS | ⚠️ Siap Eksekusi | Jalankan `supabase-complete-setup.sql` di SQL Editor Dashboard |
| 2 | Storage Bucket `photos` di Supabase | ⚠️ Siap Eksekusi | Buat bucket `photos` (Public = YES, limit 5MB) |
| 3 | Akses Web Produksi | ✅ Siap | Folder `docs/` siap dihosting via GitHub Pages / Vercel / Netlify |
| 4 | Paket APK Android (`App.SMPJDC.apk`) | ✅ Siap | Tersedia di folder `docs/App.SMPJDC.apk` dan `public/` |
| 5 | Master QR Code Checkpoint (1-30) | ✅ Siap | Cetak melalui menu **Barcode Generator** |
| 6 | Akun Superadmin Aktif | ✅ Siap | NRP: `10001`, Nama: `Richard`, PIN default: `0001` atau `10001` |
| 7 | Handset Petugas Siap Pakai | [ ] Belum Dicek | Pastikan baterai HP > 80%, GPS aktif (Akurasi Tinggi), Kamera bersih |

---

## 3. PANDUAN SETUP DATABASE CLOUD SUPABASE (1-KLIK)

Supabase digunakan sebagai backend sinkronisasi real-time antar perangkat satpam, komandan regu, dan dashboard manajemen.

### Langkah 1: Eksekusi File SQL Setup
1. Buka [Supabase Dashboard](https://supabase.com/dashboard) dan login ke akun proyek Anda (`apshtzpftfzdrygicvjl`).
2. Masuk ke menu **SQL Editor** pada sidebar kiri.
3. Klik **New Query**.
4. Buka file [supabase-complete-setup.sql](file:///e:/APP.SAPUJAGAT_JDC/supabase-complete-setup.sql) di text editor, salin seluruh kodenya, dan tempelkan ke SQL Editor Supabase.
5. Klik tombol **Run** (atau tekan `Ctrl + Enter`).
6. Pesan `Success. No rows returned` akan muncul. Sebanyak 10 tabel, indeks performa, publikasi Realtime, dan kebijakan RLS langsung aktif.

### Langkah 2: Verifikasi Bucket Penyimpanan Foto
Query SQL di atas telah otomatis menyiapkan bucket `photos`. Untuk memastikannya:
1. Masuk ke menu **Storage** pada sidebar Supabase.
2. Pastikan bucket bernama `photos` telah muncul dengan label **Public**.
3. Jika belum ada, klik **New Bucket** -> beri nama `photos` -> centang **Public bucket** -> simpan.

---

## 4. MEKANISME AKUN LOGIN & AUTENTIKASI PIN UNIVERSAL

Aplikasi menerapkan sistem login aman berbasis nomor induk NRP (Nomor Registrasi Personil) dan PIN terenkripsi hash.

### Aturan Autentikasi:
- **Akun Baru / Default**: PIN awal otomatis adalah **4 digit terakhir dari NRP** (atau jika NRP kurang dari 4 digit, sama dengan NRP itu sendiri).
- **Fleksibilitas Login**: Sistem menerima login jika petugas memasukkan 4 digit terakhir NRP **ATAU** NRP lengkapnya.
- **Proteksi Brute-Force**: Jika petugas salah memasukkan PIN sebanyak 5 kali berturut-turut, akun akan terkunci secara otomatis selama **5 menit** untuk mencegah pembajakan akun.

### Akun Sistem Bawaan:
- **Role**: Admin Super (Superadministrator)
- **NRP**: `10001`
- **Nama**: `Richard`
- **PIN Default**: `0001` (atau `10001`)
- **Akses**: Bebas mengakses seluruh 10 modul sistem tanpa batasan hierarki.

---

## 5. SOP & PANDUAN PETUGAS LAPANGAN (ANGGOTA SATPAM)

Petugas lapangan (Satpam) bertugas melaksanakan patroli gedung, scan titik kontrol QR code, melaporkan temuan, dan melakukan pencatatan mutasi tugas.

### A. Alur Memulai Dinas (Check-In Shift)
1. **Buka Aplikasi SMPJDC**: Buka aplikasi dari menu Android atau shortcut PWA browser.
2. **Pemeriksaan Keamanan (Shield Check)**:
   - Sistem akan memverifikasi izin Kamera dan GPS fisik.
   - Klik **Izinkan** saat muncul dialog izin Android / browser.
   - Jika berada di dalam posco atau basement dan GPS membutuhkan waktu mengunci satelit, sistem secara otomatis mengaktifkan mode toleransi indoor.
3. **Login Petugas**:
   - Masukkan **NRP**.
   - Masukkan **PIN** (4 digit terakhir NRP Anda).
   - Klik **Masuk Sistem**.
4. **Presensi Masuk & Plotting Pos**:
   - Masuk ke tab **Presensi / Absensi**.
   - Pilih **Regu** (Regu A / B / C / D) dan **Shift** (Pagi / Siang / Malam).
   - Pilih **Pos Plotting Jaga** Anda (misalnya: *Pos 01 Lobby*, *Pos JDC*, *Pos PK mobil*).
   - Lakukan foto verifikasi wajah (selfie) menghadap kamera.
   - Klik **Kirim Absensi Masuk**.

### B. Alur Pelaksanaan Patroli Gedung (Scan QR Checkpoint)
1. Buka tab **Patroli**.
2. Klik tombol besar **Scan Barcode Titik**.
3. Arahkan kamera smartphone ke QR Code akrilik yang terpasang di dinding checkpoint (misal: `JDC-BSMT-B-1` Depan R. Elektrik).
4. Kamera akan otomatis membaca kode dan menampilkan nama lantai, zona, dan titik lokasi.
5. **Pemeriksaan Kondisi**:
   - Jika area dalam keadaan baik: Pilih **Aman dan Kondusif**.
   - Jika ada kejanggalan: Pilih kategori (misal: *Kebocoran Air*, *Pintu Terbuka*, *Lampu Rusak*).
   - Ambil foto dokumentasi temuan jika ada kerusakan.
   - Berikan keterangan singkat.
6. Klik **Simpan Laporan Patroli**. Suara/getaran haptik akan mengonfirmasi laporan tersimpan.

### C. Alur Penggunaan Tombol SOS Darurat
- Jika terjadi insiden kritis (kebakaran, keributan, kecelakaan medis):
- Tekan dan tahan tombol **SOS DARURAT** merah di pojok kanan bawah selama 2 detik.
- Sirene peringatan dan alert koordinat otomatis disiarkan ke seluruh komandan regu dan dashboard pos komando pusat.

---

## 6. SOP KOMANDAN REGU (DANRU & WADANRU)

Komandan Regu (Danru) dan Wakil Komandan Regu (Wadanru) memegang kendali pengawasan anggota, jadwal roster, serah terima penjagaan (mutasi), dan approval lembur.

### A. Manajemen Absensi & Plotting Harian
1. Buka modul **Absensi Regu** dari navigasi utama.
2. Filter berdasarkan nama regu Anda (misal: *Regu A*).
3. Periksa status kehadiran personil:
   - Hijau = Hadir tepat waktu.
   - Kuning = Terlambat / Tukar Shift.
   - Merah = Belum absen / Tanpa Keterangan.
4. Jika ada anggota yang berhalangan hadir dan digantikan oleh personil lembur/backup:
   - Pilih personil pengganti -> pilih status **Tukar Shift / Backup Lembur**.
   - Masukkan estimasi jam lembur.
5. Unduh rekap presensi harian dalam format PDF resmi dengan klik tombol **Ekspor PDF Presensi**.

### B. Pencatatan Mutasi Penjagaan (Serah Terima Shift)
1. Masuk ke modul **Mutasi Penjagaan**.
2. Sebelum serah terima shift (misal pergantian Pagi ke Siang):
   - Catat kelengkapan inventaris jaga (HT, kunci master, senter, tongkat T, payung, metal detector).
   - Catat rekap kejadian penting selama 8 jam dinas.
   - Masukkan nama Petugas Masuk dan Petugas Keluar.
3. Klik **Simpan Catatan Mutasi**. Log mutasi bersifat permanen dan tersinkronisasi ke server.

---

## 7. SOP MANAJEMEN & SUPERADMIN (MONITORING & EKSPOR LAPORAN)

Modul ini digunakan oleh Chief Security, SPV, Building Manager, dan Developer (Richard Meha) untuk memantau performa pengamanan gedung JDC secara komprehensif.

### A. Membuka Dashboard pada Komputer Kantor (PC/Laptop)
1. Buka browser (Chrome / Edge / Firefox) pada PC manajemen.
2. Akses tautan web aplikasi SMPJDC.
3. Pada layar verifikasi keamanan awal:
   - Klik tombol **Lanjutkan ke Dashboard (Mode Pengelola / PC)**.
   - Mode ini mengizinkan PC tanpa webcam/GPS untuk tetap mengakses seluruh fitur kontrol manajemen.
4. Login menggunakan akun Superadmin atau Manajemen.

### B. Pemantauan Real-Time Command Center
1. **Live GPS Pos Map**: Peta interaktif Jakarta Design Center menampilkan persebaran pos keamanan dan status aktif petugas di area perimeter.
2. **Patrol Heatmap**: Menampilkan persentase kunjungan patroli dari Lantai Basement sampai Lantai 6. Titik yang belum dikunjungi akan berkedip merah.
3. **Disposisi Temuan Cepat**:
   - Klik temuan yang berstatus *Open*.
   - Pilih divisi penanggung jawab: **Teknisi**, **Cleaning**, atau **Keamanan**.
   - Klik tombol **Kirim Notifikasi WhatsApp**: Pesan resmi dengan rincian lokasi dan foto otomatis terformat dan siap dikirim ke PIC divisi terkait.

### C. Ekspor Laporan Resmi (Audit & Manajemen)
1. Buka tab **Reports Export** atau tombol cetak di masing-masing modul.
2. Pilih rentang tanggal (Harian, Mingguan, atau Bulanan).
3. Klik **Ekspor PDF**: Format PDF otomatis dirancang rapi dengan kop resmi *SMPJDC - Jakarta Design Center*, tata letak landscape A4, nomor registrasi dokumen, dan tanda tangan digital.

---

## 8. MODUL KOMPLAIN TENANT & TIKET LAYANAN PUBLIK

Sistem SMPJDC dilengkapi kanal aduan publik untuk tenant pameran, showroom, dan pengunjung gedung JDC.

### A. Cara Tenant Mengajukan Keluhan (Tanpa Login)
1. Tenant memindai QR Komplain yang terpasang di lift atau lobby JDC, atau membuka URL dengan parameter `?complaint`.
2. Tampil form komplain publik bergaya elegan:
   - Mengisi Nama Lengkap & Nomor WhatsApp.
   - Memilih Nama Tenant / Lokasi Lantai.
   - Memilih Kategori (Fasilitas, Engineering, Cleaning, Satpam, Lainnya).
   - Menjelaskan rincian keluhan dan melampirkan foto bukti.
3. Klik **Kirim Laporan Keluhan**.
4. Sistem otomatis menerbitkan **Nomor Tiket Aduan** (misal: `#TKT-JDC-1042`).
5. Tenant dapat melacak perkembangan status tiket kapan saja secara mandiri.

### B. Penanganan Tiket oleh Admin Keamanan
1. Admin membuka menu **Complaint Admin**.
2. Tiket baru masuk dengan label biru `Baru`.
3. Admin mengubah status menjadi `Diproses` dan meneruskan instruksi pekerjaan ke teknisi atau regu cleaning service.
4. Setelah pekerjaan selesai, admin mengunggah bukti penyelesaian dan mengubah status menjadi `Selesai`.

---

## 9. PENANGANAN MASALAH LAPANGAN (TROUBLESHOOTING MATRIX)

| Gejala Masalah | Penyebab Teknis | Langkah Penanganan Instan |
|---|---|---|
| **Layar Verifikasi Keamanan Tertahan** | Izin kamera/lokasi browser belum diaktifkan | Klik ikon gembok di sebelah URL browser -> ubah izin Kamera & Lokasi menjadi **Allow (Izinkan)** -> Refresh halaman. Di PC klik tombol *Mode Pengelola (Desktop)*. |
| **"Sinyal GPS Belum Terkunci" saat di Basement** | Beton bertulang menahan gelombang satelit | Sistem telah dilengkapi toleransi indoor. Pastikan Wi-Fi atau data seluler HP aktif agar sistem beralih ke *Network Cell Triangulation*. Scan fisik barcode tetap dapat disimpan. |
| **Pesan "Di Luar Radius Gedung JDC"** | Petugas berada di luar batas 500m dari Jl. Gatot Subroto Kav 53 | Pastikan petugas telah tiba di area gedung JDC. Jika akurasi GPS HP melayang, nonaktifkan dan aktifkan kembali tombol GPS di notifikasi Android untuk me-refresh sinyal. |
| **Kamera QR Tidak Muncul / Hitam** | Kamera sedang digunakan oleh aplikasi lain | Tutup aplikasi kamera bawaan atau aplikasi WhatsApp yang sedang berjalan di background, lalu refresh aplikasi SMPJDC. |
| **Tidak Ada Koneksi Internet (Offline)** | Jaringan provider drop di lantai tertentu | Tetap lakukan patroli dan foto seperti biasa. Seluruh data disimpan di database offline HP (`IndexedDB`) dan otomatis terunggah saat kembali mendapat sinyal. |
| **Lupa PIN Akun Petugas** | Petugas lupa PIN yang diubahnya | Danru atau Superadmin dapat melihat NRP petugas di menu *User Management*. PIN petugas dapat di-reset kembali ke 4 digit terakhir NRP. |

---

## 10. DAFTAR 30 TITIK CHECKPOINT & 15 POS JAGA JDC

Berikut adalah daftar referensi resmi kode barcode titik patroli dan pos jaga Jakarta Design Center:

### A. 30 Titik Kontrol Patroli Gedung (Checkpoints)
```
[Basement]
1.  JDC-BSMT-B-1   : Zona B - Depan R. Elektrik
2.  JDC-BSMT-A-2   : Zona A - R. Ganti Pakaian Security

[Lantai 1 s/d Lantai 6]
3.  JDC-LT01-A-3   : Lantai 1, Zona A - Tangga Sudut BNI 46
4.  JDC-LT01-B-4   : Lantai 1, Zona B - Tangga Sudut Gardu PLN
5.  JDC-LT02-B-5   : Lantai 2, Zona B - Tangga Sudut Pantry
6.  JDC-LT02-A-6   : Lantai 2, Zona A - Tangga Sudut BNI 46
7.  JDC-LT03-A-7   : Lantai 3, Zona A - Tangga Sudut Staff Security
8.  JDC-LT03-B-8   : Lantai 3, Zona B - Tangga Sudut Gardu PLN
9.  JDC-LT04-B-9   : Lantai 4, Zona B - Tangga Sudut Pantry
10. JDC-LT04-A-10  : Lantai 4, Zona A - Tangga Sudut BNI 46
11. JDC-LT05-B-11  : Lantai 5, Zona B - Tangga Sudut Gardu PLN
12. JDC-LT05-A-12  : Lantai 5, Zona A - Tangga Sudut R. Rapat JDC Office
13. JDC-LT06-A-13  : Lantai 6, Zona A - Tangga Sudut Mushola
14. JDC-LT06-B-14  : Lantai 6, Zona B - Depan Gudang Banquet / R. Carnition

[Area Luar & Perimeter]
15. JDC-HD-C-15    : Halaman Depan, Zona C - Koridor IAI DKI
16. JDC-HD-A-16    : Halaman Depan, Zona A - Ruang Chiller
17. JDC-HD-LOBBY-17: Halaman Depan, Lobby - Luar ATM Bank Mandiri
18. JDC-HD-HD-18   : Halaman Depan - Pos Keluar
19. JDC-HD-HD-19   : Halaman Depan - Pos Masuk
20. JDC-HSKN-A-20  : Halaman Samping Kanan, Zona A - Tiang Canopy Basement
21. JDC-HSKN-PS-21 : Halaman Samping Kanan, Zona Posco - Posco OO
22. JDC-HSKN-PT-22 : Halaman Samping Kanan, Zona Teknik - Ruang Teknik
23. JDC-HB-HB-23   : Halaman Belakang - Tembok Belakang Gardu Genset
24. JDC-HB-HB-24   : Halaman Belakang - Tembok Ujung Parkir Motor
25. JDC-HB-HB-25   : Halaman Belakang - Tembok Depan Gardu PLN
26. JDC-HB-HB-26   : Halaman Belakang - Kantin Belakang
27. JDC-HB-LP-27   : Halaman Belakang - Lapangan Padel I
28. JDC-HB-LP-28   : Halaman Belakang - Lapangan Padel II
29. JDC-HB-AP-29   : Halaman Belakang - Pintu Area Padel
30. JDC-HSKR-B-30  : Halaman Samping Kiri, Zona B - Kopi Tuku
```

### B. 15 Pos Jaga Penugasan JDC
```
1.  PJDC  : Pos Jaga Utama JDC
2.  P00A  : Pos 00 Area Basement
3.  P00L  : Pos 00 Lift Basement
4.  P01L  : Pos 01 Lift Lantai 1 (Pintu Sudut)
5.  P01   : Pos 01 Lobby Utama Lantai 1
6.  P23   : Pos Jaga Lantai 2 & 3 Area
7.  P45   : Pos Jaga Lantai 4 & 5 Area
8.  P67   : Pos Jaga Lantai 6 & 7 Area
9.  PKM   : Pos Parkir Mobil (PK Mobil)
10. P08A  : Pos 08A Halaman Depan Area A
11. P08B  : Pos 08B Halaman Depan Area B
12. P08C  : Pos 08C Halaman Depan Area C
13. P09   : Pos 09 Area Halaman Belakang
14. PKMR  : Pos Parkir Motor (PK Motor)
15. PMTR  : Pos Motor JDC
```

---

*SMPJDC - Jakarta Design Center Security Management Platform*  
*Dokumentasi ini disiapkan dan diverifikasi oleh Senior Developer untuk kelancaran operasional 100% tanpa kendala.*
