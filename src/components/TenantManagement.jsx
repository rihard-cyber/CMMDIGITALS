import React, { useState, useEffect, useCallback } from 'react';
import { 
  Building2, 
  UserPlus, 
  Edit3, 
  Trash2, 
  Save, 
  X, 
  Search, 
  Plus, 
  AlertCircle, 
  CheckCircle,
  Shield,
  Loader
} from 'lucide-react';
import { 
  subscribeTenants, 
  addTenantToFirestore, 
  updateTenantInFirestore, 
  deleteTenantFromFirestore 
} from '../utils/supabase';


const DEFAULT_TENANTS = [
  { id: 'tnt_pt_cmm', nama: 'PT. CMM (Pusat)', kode: 'PT_CMM', slug: 'pt-cmm', alamat: 'Pusat PT. CMM' },
  { id: 'tnt_kemendag', nama: 'Kementerian Perdagangan - Pusat', kode: 'KEMENDAG', slug: 'kemendag', alamat: 'Jakarta' },
  { id: 'tnt_kemendag_jateng', nama: 'Kementerian Perdagangan - Cabang Jawa Tengah', kode: 'KEMENDAG_JATENG', slug: 'kemendag-jateng', alamat: 'Semarang' },
  { id: 'tnt_wisma_jateng', nama: 'Gedung Wisma Jawa Tengah', kode: 'WISMA_JATENG', slug: 'wisma-jateng', alamat: 'Jl. Pahlawan No. 1, Semarang' },
  { id: 'tnt_astra', nama: 'Gedung Astra', kode: 'ASTRA', slug: 'astra', alamat: 'Jakarta' },
];

export default function TenantManagement({ currentUser, isGodMode, isAdmin, addToast: addToastProp }) {
  const [tenants, setTenants] = useState(DEFAULT_TENANTS);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // null = add mode, object = edit mode
  const [form, setForm] = useState({ nama: '', kode: '', slug: '', alamat: '' });
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const addToast = addToastProp || ((msg, type) => console.log(`[${type}] ${msg}`));

  // Load tenants from Supabase
  useEffect(() => {
    setLoading(true);
    const unsub = subscribeTenants((data) => {
      setLoading(false);
      if (data && Array.isArray(data) && data.length > 0) {
        setTenants(data.map(t => ({
          id: t.id,
          nama: t.nama,
          kode: t.kode,
          slug: t.slug,
          alamat: t.alamat || ''
        })));
      } else {
        setTenants(DEFAULT_TENANTS);
      }
    }, { limit: 100 });
    return () => unsub();
  }, []);

  // Reset form when toggle add/edit
  useEffect(() => {
    if (editing) {
      setForm({
        nama: editing.nama || '',
        kode: editing.kode || '',
        slug: editing.slug || '',
        alamat: editing.alamat || ''
      });
    } else {
      setForm({ nama: '', kode: '', slug: '', alamat: '' });
    }
  }, [editing]);

  const filteredTenants = tenants.filter(t => 
    t.nama.toLowerCase().includes(search.toLowerCase()) ||
    t.kode.toLowerCase().includes(search.toLowerCase()) ||
    t.slug.toLowerCase().includes(search.toLowerCase())
  );

  const handleInputChange = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleOpenAdd = () => {
    setEditing(null);
  };

  const handleOpenEdit = (tenant) => {
    setEditing(tenant);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.nama.trim() || !form.kode.trim() || !form.slug.trim()) {
      addToast('Nama, Kode, dan Slug wajib diisi', 'warning');
      return;
    }
    setSaving(true);
    try {
      const tenantData = {
        nama: form.nama.trim(),
        kode: form.kode.trim(),
        slug: form.slug.trim().toLowerCase().replace(/\s+/g, '-'),
        alamat: form.alamat.trim()
      };

      if (editing) {
        // Update existing
        await updateTenantInFirestore(editing.supabaseId || editing.id, tenantData);
        addToast(`Tenant "${form.nama}" berhasil diperbarui`, 'success');
      } else {
        // Add new — generate id
        const newId = 'tnt_' + form.slug.trim().toLowerCase().replace(/\s+/g, '-');
        await addTenantToFirestore({ ...tenantData, id: newId });
        addToast(`Tenant "${form.nama}" berhasil ditambahkan`, 'success');
      }

      setEditing(null);
      setForm({ nama: '', kode: '', slug: '', alamat: '' });
    } catch (err) {
      addToast(`Gagal menyimpan tenant: ${err.message}`, 'danger');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDeleteId) return;
    setSaving(true);
    try {
      await deleteTenantFromFirestore(confirmDeleteId);
      addToast('Tenant berhasil dihapus', 'success');
      setConfirmDeleteId(null);
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f8fafc', marginBottom: '0.25rem' }}>
            <Building2 size={20} style={{ marginRight: '0.5rem', color: '#3b82f6' }} />
            Manajemen Tenant
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
            Kelola gedung / cabang / lokasi tenant (PT. CMM, Kementerian, Wisma, Astra, dll.)
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          disabled={saving}
          className="tenant-btn-add"
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
          {saving ? <Loader size={14} /> : <Plus size={16} />}
          {saving ? 'Menyimpan...' : 'Tambah Tenant'}
        </button>
      </div>

      {/* Search */}
      <div style={{ marginBottom: '1rem' }}>
        <div style={{ position: 'relative', width: '100%', maxWidth: '320px' }}>
          <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
          <input
            type="text"
            placeholder="Cari nama, kode, atau slug tenant…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '0.7rem 1rem 0.7rem 2.5rem',
              borderRadius: '8px',
              border: '1px solid #334155',
              background: '#0f172a',
              color: '#f8fafc',
              fontSize: '0.9rem'
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
            {filteredTenants.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                  Tidak ada tenant ditemukan
                </td>
              </tr>
            ) : (
              filteredTenants.map((t) => (
                <tr key={t.id} style={{ borderBottom: '1px solid #1e293b' }}>
                  <td style={{ padding: '1rem', color: '#f8fafc', fontWeight: 500 }}>{t.nama}</td>
                  <td style={{ padding: '1rem', color: '#cbd5e1', fontSize: '0.85rem' }}>{t.kode}</td>
                  <td style={{ padding: '1rem', color: '#94a3b8', fontSize: '0.85rem', fontFamily: 'monospace' }}>{t.slug}</td>
                  <td style={{ padding: '1rem', color: '#94a3b8', fontSize: '0.85rem' }}>{t.alamat || '-'}</td>
                  <td style={{ padding: '1rem', textAlign: 'center' }}>
                    <button
                      onClick={() => handleOpenEdit(t)}
                      title="Edit"
                      style={{
                        background: 'transparent',
                        border: '1px solid #3b82f6',
                        color: '#3b82f6',
                        padding: '0.4rem 0.7rem',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        marginRight: '0.4rem'
                      }}
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(t.id)}
                      title="Hapus"
                      style={{
                        background: 'transparent',
                        border: '1px solid #ef4444',
                        color: '#ef4444',
                        padding: '0.4rem 0.7rem',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '0.8rem'
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

      {/* Add / Edit Modal */}
      {(editing || true) && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div style={{
            background: '#0f172a',
            border: '1px solid #334155',
            borderRadius: '12px',
            padding: '1.5rem',
            width: '100%',
            maxWidth: '420px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.1rem', color: '#f8fafc' }}>
                {editing ? 'Edit Tenant' : 'Tambah Tenant Baru'}
              </h2>
              <button
                onClick={() => setEditing(null)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
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
                  style={{
                    width: '100%',
                    padding: '0.7rem',
                    borderRadius: '8px',
                    border: '1px solid #334155',
                    background: '#020617',
                    color: '#f8fafc',
                    fontSize: '0.9rem'
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
                    textTransform: 'uppercase'
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
                    fontSize: '0.9rem'
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
                    fontSize: '0.9rem'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  style={{
                    background: 'transparent',
                    border: '1px solid #475569',
                    color: '#cbd5e1',
                    padding: '0.6rem 1.2rem',
                    borderRadius: '8px',
                    fontWeight: 600,
                    cursor: 'pointer'
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
                    opacity: saving ? 0.6 : 1
                  }}
                >
                  {saving ? <Loader size={14} /> : saving ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDeleteId && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
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
              Data terkait tenant ini akan dihapus dari sistem. Tindakan ini tidak dapat dibatalkan.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                onClick={() => setConfirmDeleteId(null)}
                style={{
                  background: 'transparent',
                  border: '1px solid #475569',
                  color: '#cbd5e1',
                  padding: '0.6rem 1.2rem',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                disabled={saving}
                style={{
                  background: '#ef4444',
                  border: 'none',
                  color: 'white',
                  padding: '0.6rem 1.2rem',
                  borderRadius: '8px',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  opacity: saving ? 0.6 : 1
                }}
              >
                {saving ? <Loader size={14} /> : 'Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
