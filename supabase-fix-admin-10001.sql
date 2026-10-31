-- ============================================================================
-- CMMDIGITAL — FIX AKSES ADMIN SUPER NRP 10001
-- ============================================================================
-- Jalankan script ini di Supabase SQL Editor untuk memberikan hak akses penuh
-- kepada Admin Super dengan NRP 10001.
--
-- Efek script ini:
--   1. Pastikan jabatan = 'Admin Super' dan status = 'Aktif'.
--   2. Set must_change_password = false (tidak perlu ganti PIN dulu).
--   3. Konfirmasi email agar tidak terblokir.
--   4. Tampilkan verifikasi akhir.
-- ============================================================================

-- Step 1: Pastikan jabatan Admin Super dan status Aktif
UPDATE public.users
SET
  jabatan             = 'Admin Super',
  status              = 'Aktif',
  must_change_password = false,
  updated_at          = to_char(now() AT TIME ZONE 'utc', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
WHERE nrp = '10001';

-- Step 2: Konfirmasi email di auth.users agar tidak diblokir sistem autentikasi
UPDATE auth.users
SET
  email_confirmed_at = COALESCE(email_confirmed_at, now()),
  updated_at         = now()
WHERE id = (
  SELECT auth_user_id
  FROM public.users
  WHERE nrp = '10001'
  LIMIT 1
);

-- Step 3: Verifikasi hasil update
SELECT
  u.nrp,
  u.nama,
  u.jabatan,
  u.status,
  u.must_change_password,
  u.tenant_id,
  u.auth_user_id,
  au.email,
  au.email_confirmed_at IS NOT NULL AS email_confirmed
FROM public.users u
LEFT JOIN auth.users au ON au.id = u.auth_user_id
WHERE u.nrp = '10001';

-- ============================================================================
-- CATATAN PENTING:
--
-- Setelah menjalankan script ini, Admin Super NRP 10001 dapat login dengan:
--   - Email  : 10001@cmmdigital.app
--   - PIN    : 10001  (PIN default jika belum pernah diganti)
--
-- Setelah login, di UI akan tampil GOD MODE dengan akses ke semua fitur:
--   ✓ Dashboard Utama
--   ✓ Absensi & Plotting
--   ✓ Dashboard Target
--   ✓ Master & Barcode QR
--   ✓ Mutasi Penjagaan
--   ✓ Laporan & Export
--   ✓ Management User
--   ✓ Roster Jadwal Bulanan
--   ✓ Backup & Restore
--   ✓ Manajemen Tenant
--   ✓ Komplain Masuk
--   ✓ Penemuan Barang
--   ✓ Simulasi HP Petugas (GOD MODE bypass semua cek keamanan)
-- ============================================================================
