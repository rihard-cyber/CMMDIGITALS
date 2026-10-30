# Changelog — 10 Juni 2026

## Goal
Migrasi penuh Firebase → Supabase, perbaiki semua CRUD, fix responsive click issues.

## Progress

### 🔧 Supabase Core Fixes
- `KNOWN_TABLE_COLUMNS` added for ALL 10 tables (supabase.js)
- `prepareData` strips `firebaseId` + `supabaseId` sebelum insert
- `createAdder` sekarang `throw` error (tidak silent catch)
- `createDeleter` sekarang `throw` error
- `createUpdater` pakai `prepareData(data, tableName)`
- Batch sync di App.jsx ditambah try/catch untuk error handling

### 🖱️ Click / Responsive Fix
- `e.stopPropagation()` + `e.preventDefault()` di semua tombol Edit/Hapus User
- Sidebar `pointer-events: none` di ≥1025px (cegah scrollbar gutter intercept click)
- Ukuran tombol user-action-btn diperbesar (`padding: 0.45rem`, `border: 2px`)

### 🎨 UI / UX
- **ConfirmModal** baru (style GitHub) — backdrop blur, icon AlertTriangle, animasi fade+scale
- Semua `window.confirm()` diganti ConfirmModal:
  - Users ✅
  - Areas ✅
  - Pos List ✅
  - Mutasi Logs ✅
- Toast error untuk setiap gagal sync CRUD

### 🗃️ CRUD — Semua Handler Diperbaiki

| Feature | C | R | U | D | Fix |
|---|---|---|---|---|---|
| **Users** | ✅ | ✅ | ✅ | ✅ | supabaseId + await + localStorage sync |
| **Areas** | ✅ | ✅ | ✅ | ✅ | Modal + supabaseId + async |
| **Pos List** | ✅ | ✅ | ✅ | ✅ | Modal + supabaseId + async |
| **Patrol Reports** | ✅ | ✅ | 🔲 | 🔲 | firebaseId→supabaseId |
| **Findings** | ✅ | ✅ | ✅ | 🔲 | firebaseId→supabaseId |
| **Attendance Logs** | ✅ | ✅ | ✅ | 🔲 | firebaseId→supabaseId |
| **Mutasi Logs** | ✅ | ✅ | 🔲 | ✅ | Modal + supabaseId + async |
| **Complaints** | ✅ | ✅ | ✅ | 🔲 | firebaseId→supabaseId |
| **Avatar** | - | - | ✅ | - | supabaseId fallback |
| **Presence** | - | - | ✅ | - | supabaseId fallback |

### 📦 Build Status
- Build sukses (~629 KB gzipped ~166 KB)
- Deploy ke GitHub Pages (`docs/` folder)
- Commit terakhir: `27d8528`

## ⚠️ Belum Selesai
- Complaints: belum ada handler Delete
- Patrol Reports: belum ada handler Update/Delete
- Findings: belum ada handler Delete
- Attendance Logs: belum ada handler Delete
- Rosters: belum diintegrasikan ke CRUD pattern baru
- WA Contacts: belum dicek

## Next Steps (Besok)
1. Hard refresh browser (Ctrl+F5)
2. Test semua CRUD di layar lebar & sempit
3. Tambah delete untuk Complaints, Reports, Findings, Attendance
4. Cek Roster & WA Contacts
5. Perbaiki kalo ada error baru
