# CMMDIGITAL

Aplikasi manajemen keamanan **multi-tenant** milik **PT. CMM**. Satu aplikasi digunakan oleh banyak lokasi/gedung/cabang (tenant), dengan data yang terisolasi per tenant.

## Konsep

| Pihak | Peran |
|-------|-------|
| PT. CMM | Pemilik aplikasi & Super Admin (pusat) |
| Tenant | Gedung / cabang / lokasi yang terdaftar |
| Anggota | Petugas yang bekerja di tenant masing-masing |

Alur login: **NRP + PIN → pilih lokasi/tenant → dashboard**. Setelah tenant dipilih, seluruh data (patroli, absensi, temuan, komplain, area, roster) difilter berdasarkan `tenant_id`.

## Fitur

- Patroli QR checkpoint + validasi GPS
- Absensi regu & mutasi penjagaan
- Laporan temuan dan komplain tenant
- Penemuan barang (lost & found)
- Manajemen area / checkpoint & barcode
- Roster jadwal bulanan
- Manajemen tenant (khusus Admin Super)
- Backup & restore data lokal

## Teknologi

- React 18 + Vite
- Supabase (database + realtime + RLS multi-tenant)
- Capacitor 6 (Android)
- PWA (installable, offline shell)

## Menjalankan

```bash
npm install --legacy-peer-deps
npm run dev
```

Buka `http://localhost:3000`.

## Build

```bash
npm run build          # output ke docs/ (GitHub Pages)
npx cap sync android   # sinkronisasi ke project Android
npx cap open android   # buka Android Studio
```

## Database

Jalankan `supabase-multi-tenant.sql` di **Supabase SQL Editor**. File ini membuat tabel `tenants`, menambahkan kolom `tenant_id` ke semua tabel data, mengaktifkan RLS, dan mengisi tenant awal.

## Deployment

- Web: GitHub Pages dari folder `docs/`
- Android: build APK/AAB melalui Android Studio

---

© 2026 PT. CMM — CMMDIGITAL
