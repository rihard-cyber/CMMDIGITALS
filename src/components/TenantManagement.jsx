import React, { useState, useEffect, useCallback } from 'react';
import {
  Building2,
  Edit3,
  Trash2,
  X,
  Search,
  Plus,
  AlertCircle,
  Shield,
  Loader,
  RefreshCw,
  MapPin
} from 'lucide-react';
import {
  subscribeTenants,
  addTenantToFirestore,
  updateTenantInFirestore,
  deleteTenantFromFirestore,
  loadAllTenantsFromFirestore
} from '../utils/supabase';

const EMPTY_FORM = { nama: '', kode: '', slug: '', alamat: '' };

const mapTenant = (t) => ({
  id: t.id || '',
  supabaseId: t.supabaseId || t.supabase_id || null,
  nama: t.nama || '',
  kode: t.kode || '',
  slug: t.slug || '',
  alamat: t.alamat || ''
});

export default function TenantManagement({ currentUser, isGodMode, isAdmin, addToast: addToastProp }) {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const addToast = addToastProp || ((msg, type) => console.log(`[${type}] ${msg}`));

  // Muat daftar tenant dari Supabase (realtime + initial fetch)
  useEffect(() => {
    setLoading(true);
    const unsub = subscribeTenants((data) => {
      setLoading(false);
      if (Array.isArray(data)) {
        setLoadError(false);
        setTenants(data.map(mapTenant));
      } else {
        // null = gagal koneksi / belum ada client Supabase
        setLoadError(true);
        setTenants([]);
      }
    }, { limit: 100 });

    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, []);

  // Tutup modal dengan tombol Escape
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      if (confirmDelete) setConfirmDelete(null);
      else if (formOpen) closeForm();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [formOpen, confirmDelete]);

  const refreshTenants = useCallback(async () => {
    const data = await loadAllTenantsFromFirestore();
    if (Array.isArray(data)) {
      setTenants(data.map(mapTenant));
      setLoadError(false);
    }
  }, []);

  const filteredTenants = tenants.filter((t) => {
    const q = search.toLowerCase();
    return (
      t.nama.toLowerCase().includes(q) ||
      t.kode.toLowerCase().includes(q) ||
      t.slug.toLowerCase().includes(q) ||
      t.alamat.toLowerCase().includes(q)
    );
  });

  const handleInputChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleOpenAdd = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormOpen(true);
  };

  const handleOpenEdit = (tenant) => {
    setEditing(tenant);
    setForm({
      nama: tenant.nama || '',
      kode: tenant.kode || '',
      slug: tenant.slug || '',
      alamat: tenant.alamat || ''
    });
    setFormOpen(true);
  };

  function closeForm() {
    setFormOpen(false);
    setEditing(null);
    setForm(EMPTY_FORM);
  }

  const handleSave = async (e) => {
    e.preventDefault();
    if (saving) return;

    const nama = form.nama.trim();
    const kode = form.kode.trim().toUpperCase();
    const slug = form.slug.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const alamat = form.alamat.trim();

    if (!nama || !kode || !slug) {
      addToast('Nama, Kode, dan Slug wajib diisi', 'warning');
      return;
    }

    // Cegah duplikat slug / kode (kecuali baris yang sedang diedit)
    const duplicate = tenants.find(
      (t) =>
        (t.slug === slug || t.kode.toUpperCase() === kode) &&
        (!editing || t.supabaseId !== editing.supabaseId)
    );
    if (duplicate) {
      addToast(`Slug atau Kode sudah dipakai oleh "${duplicate.nama}"`, 'warning');
      return;
    }

    setSaving(true);
    try {
      const tenantData = { nama, kode, slug, alamat };

      if (editing) {
        if (!editing.supabaseId) throw new Error('ID server tenant tidak ditemukan, muat ulang halaman');
        await updateTenantInFirestore(editing.supabaseId, tenantData);
        // Update optimistis supaya tabel langsung berubah
        setTenants((prev) =>
          prev.map((t) => (t.supabaseId === editing.supabaseId ? { ...t, ...tenantData } : t))
        );
        addToast(`Tenant "${nama}" berhasil diperbarui`, 'success');
      } else {
        const newId = 'tnt_' + slug;
        await addTenantToFirestore({ ...tenantData, id: newId });
        addToast(`Tenant "${nama}" berhasil ditambahkan`, 'success');
      }

      closeForm();
      // Sinkronkan ulang dengan server
      await refreshTenants();
    } catch (err) {
      addToast(`Gagal menyimpan tenant: ${err.message}`, 'danger');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete || saving) return;
    if (!confirmDelete.supabaseId) {
      addToast('ID server tenant tidak ditemukan, muat ulang halaman', 'danger');
      return;
    }

    setSaving(true);
    try {
      await deleteTenantFromFirestore(confirmDelete.supabaseId);
      setTenants((prev) => prev.filter((t) => t.supabaseId !== confirmDelete.supabaseId));
      addToast(`Tenant "${confirmDelete.nama}" berhasil dihapus`, 'success');
      setConfirmDelete(null);
      await refreshTenants();
    } catch (err) {
      addToast(`Gagal menghapus tenant: ${err.message}`, 'danger');
    } finally {
      setSaving(false);
    }
  };

  const isSuperAdmin = currentUser?.jabatan === 'Admin Super' || isGodMode;

  if (!isSuperAdmin) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#ef4444' }}>
        <Shield size={32} style={{ marginBottom: '1rem', opacity: 0.5 }} />
        <h2>Akses Ditolak</h2>
        <p>Hanya Admin Super yang dapat mengelola tenant.</p>
      </div>
    );
  }

  return (
    <div className="tenant-management" style={{ padding: '1.5rem', maxWidth: '900px', margin: '0 auto', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f8fafc', marginBottom: '0.25rem', display: 'flex', alignItems: 'center' }}>
            <Building2 size={20} style={{ marginRight: '0.5rem', color: '#3b82f6' }} />
            Manajemen Tenant
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
            Kelola gedung / cabang / lokasi tenant (PT. CMM, Kementerian, Wisma, Astra, dll.)
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={refreshTenants}
            disabled={saving || loading}
            title="Muat ulang data"
            style={{
              background: 'transparent',
              color: '#94a3b8',
              border: '1px solid #475569',
              padding: '0.6rem 0.9rem',
              borderRadius: '8px',
              fontWeight: 600,
              cursor: saving || loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              opacity: saving || loading ? 0.6 : 1
            }}
          >
            <RefreshCw size={15} />
          </button>
          <button
            onClick={handleOpenAdd}
            disabled={saving}
            style={{
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              padding: '0.6rem 1.2rem',
              borderRadius: '8px',
              fontWeight: 600,
              cursor: saving ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              opacity: saving ? 0.6 : 1
            }}
          >
            <Plus size={16} />
            Tambah Tenant
          </button>
        </div>
      </div>

      {loadError && (
        <div style={{
          background: 'rgba(239,68,68,0.1)',
          border: '1px solid #ef4444',
          color: '#fca5a5',
          borderRadius: '8px',
          padding: '0.75rem 1rem',
          marginBottom: '1rem',
          fontSize: '0.85rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <AlertCircle size={16} />
          Gagal memuat tenant dari server. Periksa koneksi / konfigurasi Supabase lalu klik tombol muat ulang.
        </div>
      )}

      {/* Search */}
      <div style={{ marginBottom: '1rem' }}>
        <div style={{ position: 'relative', width: '100%', maxWidth: '320px' }}>
          <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
          <input
            type="text"
            placeholder="Cari nama, kode, slug, atau alamat…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '0.7rem 1rem 0.7rem 2.5rem',
              borderRadius: '8px',
              border: '1px solid #334155',
              background: '#0f172a',
              color: '#f8fafc',
              fontSize: '0.9rem',
              boxSizing: 'border-box'
            }}
          />
        </div>
      </div>

      {/* Tenant List */}
      <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '10px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #334155' }}>
              <th style={{ textAlign: 'left', padding: '1rem', color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 600 }}>Nama Tenant</th>
              <th style={{ textAlign: 'left', padding: '1rem', color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 600 }}>Kode</th>
              <th style={{ textAlign: 'left', padding: '1rem', color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 600 }}>Slug</th>
              <th style={{ textAlign: 'left', padding: '1rem', color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 600 }}>Alamat</th>
              <th style={{ textAlign: 'center', padding: '1rem', color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 600 }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} style={{ padding: '2.5rem', textAlign: 'center', color: '#94a3b8' }}>
                  <Loader size={20} style={{ marginBottom: '0.5rem' }} />
                  <div>Memuat data tenant…</div>
                </td>
              </tr>
            ) : filteredTenants.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                  {tenants.length === 0
                    ? 'Belum ada tenant terdaftar. Klik "Tambah Tenant" untuk membuat lokasi baru.'
                    : 'Tidak ada tenant yang cocok dengan pencarian.'}
                </td>
              </tr>
            ) : (
              filteredTenants.map((t) => (
                <tr key={t.supabaseId || t.id} style={{ borderBottom: '1px solid #1e293b' }}>
                  <td style={{ padding: '1rem', color: '#f8fafc', fontWeight: 500 }}>
                    {t.nama}
                    {t.alamat ? (
                      <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.15rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <MapPin size={11} /> {t.alamat}
                      </div>
                    ) : null}
                  </td>
                  <td style={{ padding: '1rem', color: '#cbd5e1', fontSize: '0.85rem' }}>{t.kode}</td>
                  <td style={{ padding: '1rem', color: '#94a3b8', fontSize: '0.85rem', fontFamily: 'monospace' }}>{t.slug}</td>
                  <td style={{ padding: '1rem', color: '#94a3b8', fontSize: '0.85rem' }}>{t.alamat || '-'}</td>
                  <td style={{ padding: '1rem', textAlign: 'center', whiteSpace: 'nowrap' }}>
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(t)}
                      title="Edit"
                      style={{
                        background: 'transparent',
                        border: '1px solid #3b82f6',
                        color: '#3b82f6',
                        padding: '0.4rem 0.7rem',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        marginRight: '0.4rem'
                      }}
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(t)}
                      title="Hapus"
                      style={{
                        background: 'transparent',
                        border: '1px solid #ef4444',
                        color: '#ef4444',
                        padding: '0.4rem 0.7rem',
                        borderRadius: '6px',
                        cursor: 'pointer'
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p style={{ marginTop: '0.75rem', fontSize: '0.78rem', color: '#64748b' }}>
        Total: {tenants.length} tenant terdaftar
      </p>

      {/* Add / Edit Modal */}
      {formOpen && (
        <div
          role="dialog"
          aria-modal="true"
          onMouseDown={(e) => { if (e.target === e.currentTarget) closeForm(); }}
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(2,6,23,0.75)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 3000,
            padding: '1rem'
          }}
        >
          <div style={{
            background: '#0f172a',
            border: '1px solid #334155',
            borderRadius: '12px',
            padding: '1.5rem',
            width: '100%',
            maxWidth: '440px',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.1rem', color: '#f8fafc', margin: 0 }}>
                {editing ? 'Edit Tenant' : 'Tambah Tenant Baru'}
              </h2>
              <button
                type="button"
                onClick={closeForm}
                aria-label="Tutup"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: '0.25rem',
                  display: 'flex'
                }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.4rem' }}>Nama Tenant *</label>
                <input
                  type="text"
                  value={form.nama}
                  onChange={(e) => handleInputChange('nama', e.target.value)}
                  placeholder="Contoh: Gedung Wisma Jawa Tengah"
                  autoFocus
                  style={{
                    width: '100%',
                    padding: '0.7rem',
                    borderRadius: '8px',
                    border: '1px solid #334155',
                    background: '#020617',
                    color: '#f8fafc',
                    fontSize: '0.9rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.4rem' }}>Kode *</label>
                <input
                  type="text"
                  value={form.kode}
                  onChange={(e) => handleInputChange('kode', e.target.value)}
                  placeholder="Contoh: WISMA_JATENG"
                  style={{
                    width: '100%',
                    padding: '0.7rem',
                    borderRadius: '8px',
                    border: '1px solid #334155',
                    background: '#020617',
                    color: '#f8fafc',
                    fontSize: '0.9rem',
                    textTransform: 'uppercase',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.4rem' }}>Slug *</label>
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => handleInputChange('slug', e.target.value)}
                  placeholder="Contoh: wisma-jateng"
                  style={{
                    width: '100%',
                    padding: '0.7rem',
                    borderRadius: '8px',
                    border: '1px solid #334155',
                    background: '#020617',
                    color: '#f8fafc',
                    fontSize: '0.9rem',
                    boxSizing: 'border-box'
                  }}
                />
                <p style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.3rem' }}>
                  Digunakan untuk identifikasi tenant di sistem. Hanya huruf, angka, dan tanda hubung.
                </p>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.4rem' }}>Alamat</label>
                <input
                  type="text"
                  value={form.alamat}
                  onChange={(e) => handleInputChange('alamat', e.target.value)}
                  placeholder="Contoh: Jl. Pahlawan No. 1, Semarang"
                  style={{
                    width: '100%',
                    padding: '0.7rem',
                    borderRadius: '8px',
                    border: '1px solid #334155',
                    background: '#020617',
                    color: '#f8fafc',
                    fontSize: '0.9rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={closeForm}
                  disabled={saving}
                  style={{
                    background: 'transparent',
                    border: '1px solid #475569',
                    color: '#cbd5e1',
                    padding: '0.6rem 1.2rem',
                    borderRadius: '8px',
                    fontWeight: 600,
                    cursor: saving ? 'not-allowed' : 'pointer'
                  }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    background: '#3b82f6',
                    border: 'none',
                    color: 'white',
                    padding: '0.6rem 1.2rem',
                    borderRadius: '8px',
                    fontWeight: 600,
                    cursor: saving ? 'not-allowed' : 'pointer',
                    opacity: saving ? 0.6 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem'
                  }}
                >
                  {saving ? <Loader size={14} /> : null}
                  {saving ? 'Menyimpan…' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div
          role="dialog"
          aria-modal="true"
          onMouseDown={(e) => { if (e.target === e.currentTarget) setConfirmDelete(null); }}
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(2,6,23,0.75)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 3000,
            padding: '1rem'
          }}
        >
          <div style={{
            background: '#0f172a',
            border: '1px solid #334155',
            borderRadius: '12px',
            padding: '1.5rem',
            width: '100%',
            maxWidth: '380px',
            textAlign: 'center'
          }}>
            <AlertCircle size={32} style={{ color: '#ef4444', marginBottom: '1rem' }} />
            <h3 style={{ color: '#f8fafc', marginBottom: '0.75rem' }}>Hapus Tenant?</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              Tenant <strong style={{ color: '#f8fafc' }}>{confirmDelete.nama}</strong> akan dihapus dari sistem. Tindakan ini tidak dapat dibatalkan.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={() => setConfirmDelete(null)}
                disabled={saving}
                style={{
                  background: 'transparent',
                  border: '1px solid #475569',
                  color: '#cbd5e1',
                  padding: '0.6rem 1.2rem',
                  borderRadius: '8px',
                  cursor: saving ? 'not-allowed' : 'pointer'
                }}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={saving}
                style={{
                  background: '#ef4444',
                  border: 'none',
                  color: 'white',
                  padding: '0.6rem 1.2rem',
                  borderRadius: '8px',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  opacity: saving ? 0.6 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
              >
                {saving ? <Loader size={14} /> : null}
                {saving ? 'Menghapus…' : 'Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
