# CMMDIGITAL

Aplikasi manajemen keamanan **multi-tenant** milik **PT. CMM**. Satu aplikasi digunakan oleh banyak lokasi/gedung/cabang (tenant), dengan data yang terisolasi per tenant.

## Konsep

| Pihak | Peran |
|-------|-------|
| PT. CMM | Pemilik aplikasi & Super Admin (pusat) |
| Tenant | Gedung / cabang / lokasi yang terdaftar |
| Anggota | Petugas yang bekerja di tenant masing-masing |

Alur login: **NRP + PIN → pilih lokasi/tenant → dashboard**. Setelah tenant dipilih, seluruh data (patroli, absensi, temuan, komplain, area, roster, kontak WA) difilter berdasarkan `tenant_id`.

- **Admin Super** dapat melihat dan memilih semua tenant.
- **Danru / Wadanru / Anggota** hanya dapat memilih tenant tempat akunnya terdaftar.
- Form komplain publik meminta pengunjung memilih lokasi secara eksplisit; perangkat publik tidak diberi tenant aktif global.
- Setiap tenant baru mulai **tanpa area/POS contoh**. Area dibuat melalui menu **Master & Barcode QR**.

## Fitur

- Patroli QR checkpoint + validasi GPS
- Absensi regu & mutasi penjagaan
- Laporan temuan dan komplain tenant
- Penemuan barang (lost & found)
- Manajemen area / checkpoint & barcode
- Roster jadwal bulanan per tenant
- Kontak disposisi WhatsApp per tenant
- Manajemen tenant (khusus Admin Super)
- Backup & restore data lokal

## Teknologi

- React 18 + Vite
- Supabase (database + realtime + RLS)
- Capacitor 6 (Android)
- PWA (installable, offline shell)

## Menjalankan

```bash
npm install --legacy-peer-deps
npm run dev
```

Buka `http://localhost:3000`.

Buat file `.env` di root:

```env
VITE_SUPABASE_URL=https://<project>.supabase.co
VITE_SUPABASE_ANON_KEY=<publishable-anon-key>
```

## Build

```bash
npm run build          # output ke docs/ (GitHub Pages)
npx cap sync android   # sinkronisasi ke project Android
npx cap open android   # buka Android Studio
```

## Database

### Instalasi baru (project Supabase baru)

Jalankan berurutan di **Supabase SQL Editor**:

1. `supabase-schema.sql` — tabel dasar.
2. `supabase-multi-tenant.sql` — tabel `tenants`, kolom `tenant_id`, RLS, realtime, grant.
3. `supabase-release-hardening.sql` — backfill data lama, `tenant_id NOT NULL` + foreign key `ON DELETE RESTRICT`, unique NRP, unique `config(key, tenant_id)`, unique `found_items(item_code, tenant_id)`, seed POS awal PT. CMM.

Alternatif sekali jalan untuk instalasi baru: `supabase-complete-setup.sql` (gabungan ketiga file di atas + bucket storage foto).

### Database yang sudah berjalan

Cukup jalankan:

```sql
-- di Supabase SQL Editor
-- salin isi supabase-release-hardening.sql
```

File tersebut **idempotent** dan aman diulang. Isinya adalah hardening yang dipakai versi rilis ini:

- `found_items` lengkap dengan `tenant_id`, index, RLS, realtime.
- Backfill baris lama tanpa tenant ke `tnt_pt_cmm`.
- `tenant_id NOT NULL` + FK `ON DELETE RESTRICT` pada 11 tabel data.
- `config` unik per `(key, tenant_id)` (WA contacts per lokasi).
- `rosters` unik per `(year_month, tenant_id)`.
- `users.nrp` unik.
- POS awal hanya untuk `tnt_pt_cmm`.

### Skema isolasi

- Tabel data wajib memiliki `tenant_id` yang valid.
- Semua query aplikasi menyaring `tenant_id` tenant aktif; data tanpa tenant tidak ditampilkan.
- Menghapus tenant yang masih memiliki data akan ditolak oleh foreign key.
- Insert/update dengan `tenant_id` yang tidak terdaftar akan ditolak database.

> **Penting:** RLS saat ini masih permisif untuk `anon` karena autentikasi memakai NRP/PIN lokal, bukan Supabase Auth. Isolasi tenant di aplikasi **bukan batas keamanan database**. Lihat bagian Keamanan di bawah.

## Deployment

- **Web:** GitHub Pages dari folder `docs/` (workflow `.github/workflows/deploy.yml`).
  - URL: `https://rihard-cyber.github.io/CMMDIGITALS/`
- **Android:** build APK/AAB melalui Android Studio setelah `npx cap sync android`.

Setelah `npm run build`, folder `docs/` sudah berisi bundle produksi dan service worker dengan cache versi terbaru.

## Pengujian rilis

Script E2E memakai Chrome lokal + `puppeteer-core`:

```bash
node e2e-admin.cjs       # login admin, tenant picker, semua menu
node e2e-member.cjs      # user tenant hanya melihat lokasinya
node e2e-public.cjs      # komplain publik + lacak tiket lintas perangkat
node e2e-found-items.cjs # CRUD barang temuan + isolasi tenant
node e2e-roster.cjs      # roster per tenant + cloud sync
node e2e-wa.cjs          # kontak WA per tenant + cloud sync
```

Jalankan dev server (`npm run dev`) sebelum mengeksekusi script E2E.

## Keamanan & batasan yang perlu diketahui

- RLS permisif untuk `anon`: siapa pun yang memiliki anon key dapat membaca/menulis seluruh data. Ini harus diganti dengan **Supabase Auth + JWT claims + RLS ketat** sebelum data sensitif produksi dipercayakan.
- PIN disimpan sebagai hash lokal di perangkat dan PIN awal adalah NRP. Segera ganti PIN setelah login pertama.
- Isolasi tenant saat ini ditegakkan oleh aplikasi + foreign key database, bukan oleh RLS per pengguna.
- Service worker meng-cache shell aplikasi; setelah deploy versi baru, pengguna mungkin perlu menutup/membuka ulang aplikasi untuk mengambil cache terbaru.

---

© 2026 PT. CMM — CMMDIGITAL
