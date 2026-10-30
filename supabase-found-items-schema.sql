-- ============================================
-- SMPJDC - Found Items (Lost & Found) Table Schema
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================

-- ── Found Items / Penemuan Barang (Lost & Found) ─────────────────────────
CREATE TABLE IF NOT EXISTS found_items (
  supabase_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  id TEXT UNIQUE,
  item_code TEXT UNIQUE,                    -- Kode barang (auto-generate: FND-YYYYMMDD-XXX)
  tanggal_penemuan TEXT,                    -- Tanggal ditemukan (YYYY-MM-DD)
  jam_penemuan TEXT,                        -- Jam ditemukan (HH:MM)
  tanggal_laporan TEXT,                     -- Tanggal dilaporkan (YYYY-MM-DD)
  nama_barang TEXT,                         -- Nama barang
  jenis_barang TEXT,                        -- Jenis: Elektronik, Aksesoris, Dokumen, Pakaian, Tas/Dompet, Lainnya
  kategori_barang TEXT,                     -- Kategori: Value tinggi, Value sedang, Value rendah, Dokumentasi
  lokasi_penemuan TEXT,                     -- Lokasi detail penemuan
  nama_penemu TEXT,                         -- Nama yang menemukan
  kategori_penemu TEXT,                     -- Kategori penemu: Security, Cleaning, Tenant, Pengunjung, Lainnya
  kontak_penemu TEXT,                       -- Kontak penemu (WA/Telepon)
  keterangan_penemu TEXT,                   -- Keterangan dari penemu
  foto_barang TEXT,                         -- Foto barang (URL utama)
  photos JSONB,                             -- Array foto tambahan
  status TEXT DEFAULT 'Ditemukan',          -- Status: Ditemukan, Diklaim, Diambil, Diserahkan, Dihapus
  nama_pengambil TEXT,                      -- Nama pengambil barang
  kontak_pengambil TEXT,                    -- Kontak pengambil
  no_identitas_pengambil TEXT,              -- No KTP/SIM/Identitas pengambil
  foto_identitas TEXT,                      -- Foto identitas pengambil
  diserahkan_oleh TEXT,                     -- Diserahkan oleh (security/staff)
  tanggal_pengambilan TEXT,                 -- Tanggal pengambilan (YYYY-MM-DD)
  catatan_serah_terima TEXT,                -- Catatan serah terima
  keterangan TEXT,                          -- Keterangan tambahan
  created_at TEXT,                          -- Timestamp created
  firebase_saved_at TEXT,                   -- Timestamp saved to Firebase/Supabase
  updated_at TEXT                           -- Timestamp last update
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_found_items_id ON found_items(id);
CREATE INDEX IF NOT EXISTS idx_found_items_item_code ON found_items(item_code);
CREATE INDEX IF NOT EXISTS idx_found_items_tanggal_penemuan ON found_items(tanggal_penemuan);
CREATE INDEX IF NOT EXISTS idx_found_items_status ON found_items(status);
CREATE INDEX IF NOT EXISTS idx_found_items_created_at ON found_items(created_at);
CREATE INDEX IF NOT EXISTS idx_found_items_nama_barang ON found_items(nama_barang);

-- Enable Realtime
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'found_items'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE found_items;
  END IF;
END $$;

-- ============================================
-- RLS Policies for found_items
-- ============================================
ALTER TABLE found_items ENABLE ROW LEVEL SECURITY;

-- Grant table privileges to anon/authenticated (WAJIB di Supabase Cloud)
GRANT ALL ON TABLE public.found_items TO anon, authenticated;

-- Allow all for anon (current app architecture uses anon key + local auth)
DROP POLICY IF EXISTS "Allow all for anon found_items" ON found_items;
CREATE POLICY "Allow all for anon found_items" ON found_items
  FOR ALL TO anon USING (true) WITH CHECK (true);

-- ============================================
-- JIKA TABEL found_items SUDAH ADA (migrasi)
-- Error: "permission denied for table found_items"
-- Jalankan blok ini saja:
-- ============================================
-- GRANT ALL ON TABLE public.found_items TO anon, authenticated;
-- ALTER TABLE public.found_items ENABLE ROW LEVEL SECURITY;
-- DROP POLICY IF EXISTS "Allow all for anon found_items" ON public.found_items;
-- CREATE POLICY "Allow all for anon found_items" ON public.found_items
--   FOR ALL TO anon USING (true) WITH CHECK (true);

-- ============================================
-- Verification
-- ============================================
-- Check table exists
-- SELECT * FROM pg_tables WHERE schemaname = 'public' AND tablename = 'found_items';

-- Check indexes
-- SELECT * FROM pg_indexes WHERE tablename = 'found_items';

-- Check RLS enabled
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename = 'found_items';

-- Check policies
-- SELECT * FROM pg_policies WHERE schemaname = 'public' AND tablename = 'found_items';

-- Check Realtime publication
-- SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'found_items';