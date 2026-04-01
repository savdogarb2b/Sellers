'use client';
import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';

export default function OrganizationsPage() {
  const [orgs, setOrgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(null);
  const [showFreezeModal, setShowFreezeModal] = useState(null);
  const [showCredentials, setShowCredentials] = useState(null);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);

  const [createForm, setCreateForm] = useState({ orgName: '', orgAddress: '', orgPhone: '', adminName: '', description: '', maxEmployees: 50, subscriptionPlan: 'BASIC' });
  const [editForm, setEditForm] = useState({});
  const [freezeReason, setFreezeReason] = useState('');

  useEffect(() => { fetchOrgs(); }, []);

  const fetchOrgs = async () => {
    const res = await fetch('/api/organizations');
    const data = await res.json();
    setOrgs(data);
    setLoading(false);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    const res = await fetch('/api/organizations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(createForm),
    });
    const data = await res.json();
    setCreating(false);
    setShowCreateModal(false);
    setCreateForm({ orgName: '', orgAddress: '', orgPhone: '', adminName: '', description: '', maxEmployees: 50, subscriptionPlan: 'BASIC' });
    if (data.generatedCredentials) {
      setShowCredentials({
        orgName: createForm.orgName,
        adminName: createForm.adminName,
        ...data.generatedCredentials,
      });
    }
    fetchOrgs();
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await fetch('/api/organizations', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editForm),
    });
    setSaving(false);
    setShowEditModal(null);
    fetchOrgs();
  };

  const handleFreeze = async (orgId) => {
    await fetch('/api/organizations', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: orgId, action: 'FREEZE', reason: freezeReason }),
    });
    setShowFreezeModal(null);
    setFreezeReason('');
    fetchOrgs();
  };

  const handleUnfreeze = async (orgId) => {
    await fetch('/api/organizations', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: orgId, action: 'UNFREEZE' }),
    });
    fetchOrgs();
  };

  const handleSoftDelete = async (orgId) => {
    if (!confirm("Haqiqatan o'chirmoqchimisiz? Tashkilot arxivlanadi.")) return;
    await fetch('/api/organizations', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: orgId, action: 'DELETE' }),
    });
    fetchOrgs();
  };

  const handleRestore = async (orgId) => {
    await fetch('/api/organizations', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: orgId, action: 'RESTORE' }),
    });
    fetchOrgs();
  };

  const openEdit = (org) => {
    setEditForm({
      id: org.id,
      name: org.name,
      address: org.address || '',
      phone: org.phone || '',
      description: org.description || '',
      maxEmployees: org.maxEmployees || 50,
      subscriptionPlan: org.subscriptionPlan || 'BASIC',
    });
    setShowEditModal(org.id);
  };

  const copyToClipboard = (text) => navigator.clipboard.writeText(text);

  const filteredOrgs = orgs.filter(org => {
    const status = org.status || 'ACTIVE';
    if (filter === 'ALL') return true;
    return status === filter;
  });

  const statusCounts = {
    ALL: orgs.length,
    ACTIVE: orgs.filter(o => (o.status || 'ACTIVE') === 'ACTIVE').length,
    FROZEN: orgs.filter(o => o.status === 'FROZEN').length,
    DELETED: orgs.filter(o => o.status === 'DELETED').length,
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <Navbar />
      <main className="main-content">
        <div className="animate-in">
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
            <div>
              <div style={{ fontSize: '16px', fontWeight: 950, textTransform: 'uppercase', letterSpacing: '2px' }}>Tashkilotlar Boshqaruvi</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: '4px', fontWeight: 700  }}>Yaratish, tahrirlash, muzlatish va o'chirish</div>
            </div>
            <button className="btn btn-primary" onClick={() => setShowCreateModal(true)} style={{ fontSize: '10px', padding: '12px 24px', fontWeight: 900 }}>
              YANGI TASHKILOT
            </button>
          </div>

          {/* Filter Tabs */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
            {['ALL', 'ACTIVE', 'FROZEN', 'DELETED'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  padding: '8px 20px',
                  borderRadius: '20px',
                  border: filter === f ? '1px solid var(--primary-500)' : '1px solid rgba(255,255,255,0.08)',
                  background: filter === f ? 'var(--primary-ghost)' : 'rgba(255,255,255,0.02)',
                  color: filter === f ? 'var(--primary-400)' : 'var(--text-muted)',
                  fontSize: '10px',
                  fontWeight: 900,
                  cursor: 'pointer',
                  fontFamily: 'Inter, sans-serif',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  transition: 'all 0.2s ease',
                }}
              >
                {f === 'ALL' ? 'Barchasi' : f === 'ACTIVE' ? 'Faol' : f === 'FROZEN' ? 'Muzlatilgan' : "O'chirilgan"} ({statusCounts[f]})
              </button>
            ))}
          </div>

          {/* Organizations Grid */}
          {loading ? (
            <div className="loading-container"><div className="loading-spinner" /></div>
          ) : filteredOrgs.length === 0 ? (
            <div className="card glass-panel" style={{ padding: '80px', textAlign: 'center' }}>
              <div style={{ fontSize: '14px', fontWeight: 900, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Hech qanday tashkilot topilmadi</div>
              <button className="btn btn-primary" onClick={() => setShowCreateModal(true)} style={{ marginTop: '20px', fontSize: '10px' }}>BIRINCHI TASHKILOTNI YARATING</button>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '16px' }}>
              {filteredOrgs.map((org, i) => {
                const empCount = org._count?.users || 0;
                const orgKpis = org.users?.reduce((s, u) => s + (u.kpis?.length || 0), 0) || 0;
                const orgPenalties = org.users?.reduce((s, u) => s + (u.penaltyRecords?.reduce((ps, p) => ps + p.amount, 0) || 0), 0) || 0;
                const orgBonuses = org.users?.reduce((s, u) => s + (u.bonusRecords?.reduce((bs, b) => bs + b.amount, 0) || 0), 0) || 0;
                const status = org.status || 'ACTIVE';

                return (
                  <div className="card glass-panel animate-in" key={org.id} style={{ animationDelay: `${i * 0.03}s`, padding: '24px', borderLeft: `4px solid ${status === 'ACTIVE' ? 'var(--accent-teal)' : status === 'FROZEN' ? 'var(--warning-500)' : 'var(--danger-500)'}` }}>
                    {/* Top row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                          <span style={{ fontSize: '16px', fontWeight: 950, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{org.name}</span>
                          <StatusBadge status={status} />
                          <span style={{ fontSize: '9px', fontWeight: 800, color: 'var(--text-ghost)', padding: '2px 8px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>{org.subscriptionPlan || 'BASIC'}</span>
                        </div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                          {org.address && <span>{org.address} • </span>}
                          {org.phone && <span>{org.phone} • </span>}
                          <span>Max: {org.maxEmployees || 50} xodim • </span>
                          <span style={{ color: 'var(--primary-400)' }}>Sana: {new Date(org.createdAt).toLocaleDateString('uz')}</span>
                        </div>
                        {org.description && <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '6px', fontWeight: 500, fontStyle: 'italic' }}>{org.description}</div>}
                        {status === 'FROZEN' && org.frozenReason && (
                          <div style={{ fontSize: '10px', color: 'var(--warning-500)', marginTop: '6px', fontWeight: 700 }}>
                            Sabab: {org.frozenReason} • {org.frozenAt && new Date(org.frozenAt).toLocaleDateString('uz')}
                          </div>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                        <ActionBtn label="TAHRIRLASH" onClick={() => openEdit(org)} color="var(--primary-400)" />
                        {status === 'ACTIVE' && (
                          <ActionBtn label="MUZLATISH" onClick={() => setShowFreezeModal(org.id)} color="var(--warning-500)" />
                        )}
                        {status === 'FROZEN' && (
                          <ActionBtn label="FAOLLASHTIRISH" onClick={() => handleUnfreeze(org.id)} color="var(--accent-teal)" />
                        )}
                        {status === 'DELETED' ? (
                          <ActionBtn label="TIKLASH" onClick={() => handleRestore(org.id)} color="var(--accent-teal)" />
                        ) : (
                          <ActionBtn label="O'CHIRISH" onClick={() => handleSoftDelete(org.id)} color="var(--danger-500)" />
                        )}
                      </div>
                    </div>

                    {/* Stats row */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                      <MiniStat label="Xodimlar" value={empCount} />
                      <MiniStat label="KPIlar" value={orgKpis} />
                      <MiniStat label="Jarimalar" value={`${(orgPenalties / 1000).toFixed(0)}K`} color="var(--danger-400)" />
                      <MiniStat label="Bonuslar" value={`${(orgBonuses / 1000).toFixed(0)}K`} color="var(--accent-teal)" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ===== CREATE MODAL ===== */}
        {showCreateModal && (
          <ModalOverlay onClose={() => setShowCreateModal(false)}>
            <div style={{ padding: '28px' }}>
              <div style={{ fontSize: '14px', fontWeight: 950, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Yangi Tashkilot Ro'yxatdan O'tkazish</div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '24px' }}>Admin login va parol avtomatik yaratiladi</div>
            </div>
            <form onSubmit={handleCreate}>
              <div style={{ padding: '0 28px 28px' }}>
                <div style={{ background: 'rgba(124,58,237,0.05)', padding: '14px', borderRadius: '12px', border: '1px solid rgba(124,58,237,0.1)', marginBottom: '24px', fontSize: '10px', color: 'var(--primary-400)', fontWeight: 800, textTransform: 'uppercase', textAlign: 'center', letterSpacing: '0.5px' }}>
                  Admin kirish ma'lumotlari tizim tomonidan avtomatik yaratiladi
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase' }}>Tashkilot nomi *</label>
                  <input className="form-input" value={createForm.orgName} onChange={e => setCreateForm({...createForm, orgName: e.target.value})} required placeholder="Masalan: NAJOT TA'LIM" />
                </div>

                <div className="form-row" style={{ marginTop: '12px' }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase' }}>Manzil</label>
                    <input className="form-input" value={createForm.orgAddress} onChange={e => setCreateForm({...createForm, orgAddress: e.target.value})} placeholder="Shahar, tuman..." />
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase' }}>Telefon</label>
                    <input className="form-input" value={createForm.orgPhone} onChange={e => setCreateForm({...createForm, orgPhone: e.target.value})} placeholder="+998..." />
                  </div>
                </div>

                <div className="form-group" style={{ marginTop: '12px' }}>
                  <label className="form-label" style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase' }}>Tavsif</label>
                  <input className="form-input" value={createForm.description} onChange={e => setCreateForm({...createForm, description: e.target.value})} placeholder="Tashkilot faoliyati haqida qisqacha..." />
                </div>

                <div className="form-row" style={{ marginTop: '12px' }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase' }}>Max Xodimlar</label>
                    <input className="form-input" type="number" value={createForm.maxEmployees} onChange={e => setCreateForm({...createForm, maxEmployees: parseInt(e.target.value) || 50})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase' }}>Tarif</label>
                    <select className="form-input" value={createForm.subscriptionPlan} onChange={e => setCreateForm({...createForm, subscriptionPlan: e.target.value})}>
                      <option value="FREE">FREE</option>
                      <option value="BASIC">BASIC</option>
                      <option value="PREMIUM">PREMIUM</option>
                    </select>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '20px', marginTop: '20px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 900, color: 'var(--text-muted)', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '1px' }}>Admin Ma'lumotlari</div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase' }}>Admin to'liq ismi *</label>
                    <input className="form-input" value={createForm.adminName} onChange={e => setCreateForm({...createForm, adminName: e.target.value})} required placeholder="Masalan: SHERZOD ABDULLAYEV" />
                    <div style={{ fontSize: '9px', color: 'var(--text-muted)', marginTop: '8px', fontWeight: 700, textTransform: 'uppercase' }}>Login va parol ismi asosida shakllantiriladi</div>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', padding: '20px 28px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)} style={{ fontSize: '10px', fontWeight: 800 }}>BEKOR QILISH</button>
                <button type="submit" className="btn btn-primary" disabled={creating} style={{ fontSize: '10px', fontWeight: 900 }}>{creating ? 'YARATILMOQDA...' : 'TASHKILOTNI YARATISH'}</button>
              </div>
            </form>
          </ModalOverlay>
        )}

        {/* ===== EDIT MODAL ===== */}
        {showEditModal && (
          <ModalOverlay onClose={() => setShowEditModal(null)}>
            <div style={{ padding: '28px' }}>
              <div style={{ fontSize: '14px', fontWeight: 950, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Tashkilotni Tahrirlash</div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '24px' }}>Barcha maydonlarni o'zgartirish mumkin</div>
            </div>
            <form onSubmit={handleEdit}>
              <div style={{ padding: '0 28px 28px' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase' }}>Tashkilot nomi</label>
                  <input className="form-input" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} required />
                </div>
                <div className="form-row" style={{ marginTop: '12px' }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase' }}>Manzil</label>
                    <input className="form-input" value={editForm.address} onChange={e => setEditForm({...editForm, address: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase' }}>Telefon</label>
                    <input className="form-input" value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} />
                  </div>
                </div>
                <div className="form-group" style={{ marginTop: '12px' }}>
                  <label className="form-label" style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase' }}>Tavsif</label>
                  <input className="form-input" value={editForm.description} onChange={e => setEditForm({...editForm, description: e.target.value})} />
                </div>
                <div className="form-row" style={{ marginTop: '12px' }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase' }}>Max Xodimlar</label>
                    <input className="form-input" type="number" value={editForm.maxEmployees} onChange={e => setEditForm({...editForm, maxEmployees: parseInt(e.target.value) || 50})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase' }}>Tarif</label>
                    <select className="form-input" value={editForm.subscriptionPlan} onChange={e => setEditForm({...editForm, subscriptionPlan: e.target.value})}>
                      <option value="FREE">FREE</option>
                      <option value="BASIC">BASIC</option>
                      <option value="PREMIUM">PREMIUM</option>
                    </select>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', padding: '20px 28px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(null)} style={{ fontSize: '10px', fontWeight: 800 }}>BEKOR QILISH</button>
                <button type="submit" className="btn btn-primary" disabled={saving} style={{ fontSize: '10px', fontWeight: 900 }}>{saving ? 'SAQLANMOQDA...' : 'SAQLASH'}</button>
              </div>
            </form>
          </ModalOverlay>
        )}

        {/* ===== FREEZE MODAL ===== */}
        {showFreezeModal && (
          <ModalOverlay onClose={() => setShowFreezeModal(null)}>
            <div style={{ padding: '28px' }}>
              <div style={{ fontSize: '14px', fontWeight: 950, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Tashkilotni Muzlatish</div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '24px' }}>Muzlatilgan tashkilot foydalanuvchilari tizimga kira olmaydi</div>
            </div>
            <div style={{ padding: '0 28px 28px' }}>
              <div style={{ background: 'rgba(245, 158, 11, 0.05)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(245, 158, 11, 0.1)', marginBottom: '20px', fontSize: '10px', color: 'var(--warning-500)', fontWeight: 800, textTransform: 'uppercase', textAlign: 'center' }}>
                Diqqat! Muzlatilgan tashkilotning barcha foydalanuvchilari tizimga kira olmaydi
              </div>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase' }}>Muzlatish sababi</label>
                <input className="form-input" value={freezeReason} onChange={e => setFreezeReason(e.target.value)} placeholder="Masalan: To'lov muddati o'tgan..." />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', padding: '20px 28px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <button className="btn btn-secondary" onClick={() => setShowFreezeModal(null)} style={{ fontSize: '10px', fontWeight: 800 }}>BEKOR QILISH</button>
              <button className="btn btn-primary" onClick={() => handleFreeze(showFreezeModal)} style={{ fontSize: '10px', fontWeight: 900, background: 'linear-gradient(135deg, var(--warning-500), #d97706)' }}>MUZLATISH</button>
            </div>
          </ModalOverlay>
        )}

        {/* ===== CREDENTIALS MODAL ===== */}
        {showCredentials && (
          <ModalOverlay onClose={() => setShowCredentials(null)}>
            <div style={{ padding: '28px', textAlign: 'center' }}>
              <div style={{ fontSize: '16px', fontWeight: 950, textTransform: 'uppercase', color: 'var(--primary-400)', letterSpacing: '2px', marginBottom: '24px' }}>Tashkilot Muvaffaqiyatli Yaratildi</div>

              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '24px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '24px' }}>
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '6px' }}>ADMINISTRATOR</div>
                  <div style={{ fontSize: '18px', fontWeight: 900, textTransform: 'uppercase' }}>{showCredentials.adminName}</div>
                  <div style={{ fontSize: '11px', color: 'var(--primary-400)', fontWeight: 800, marginTop: '2px' }}>{showCredentials.orgName}</div>
                </div>
                <div style={{ display: 'grid', gap: '16px' }}>
                  <div>
                    <div style={{ fontSize: '9px', fontWeight: 900, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '6px' }}>LOGIN / EMAIL</div>
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '12px', fontSize: '16px', fontWeight: 950, letterSpacing: '1px' }}>{showCredentials.login}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '9px', fontWeight: 900, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '6px' }}>MAXFIY PAROL</div>
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '12px', fontSize: '16px', fontWeight: 950, letterSpacing: '1px' }}>{showCredentials.password}</div>
                  </div>
                </div>
              </div>

              <div style={{ background: 'rgba(239,68,68,0.05)', padding: '14px', borderRadius: '12px', border: '1px solid rgba(239,68,68,0.1)', fontSize: '10px', color: 'var(--danger-400)', fontWeight: 900, textTransform: 'uppercase', lineHeight: '1.5', marginBottom: '20px' }}>
                Diqqat! Ushbu ma'lumotlarni saqlab qo'ying. Parol qayta ko'rsatilmaydi.
              </div>

              <button className="btn btn-primary" style={{ width: '100%', padding: '14px', fontSize: '11px', fontWeight: 950 }}
                onClick={() => {
                  copyToClipboard(`Tashkilot: ${showCredentials.orgName}\nAdmin: ${showCredentials.adminName}\nLogin: ${showCredentials.login}\nParol: ${showCredentials.password}`);
                  alert('Nusxa olindi!');
                }}>
                BARCHASINI NUSXA OLISH
              </button>
            </div>
            <div style={{ justifyContent: 'center', display: 'flex', padding: '0 28px 28px' }}>
              <button className="btn btn-secondary" onClick={() => setShowCredentials(null)} style={{ fontSize: '10px', fontWeight: 900 }}>TUSHUNARLI VA YOPISH</button>
            </div>
          </ModalOverlay>
        )}
      </main>
    </div>
  );
}

function ModalOverlay({ children, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose} style={{ backdropFilter: 'blur(14px)', background: 'rgba(0,30,55,0.85)' }}>
      <div className="card glass-panel" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px', width: '100%', border: '1px solid rgba(255,255,255,0.1)', animation: 'modalIn 0.3s ease forwards', margin: '5vh auto' }}>
        {children}
      </div>
    </div>
  );
}

function ActionBtn({ label, onClick, color }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '6px 14px',
        fontSize: '9px',
        fontWeight: 900,
        color: color,
        background: 'rgba(255,255,255,0.02)',
        border: `1px solid ${color}22`,
        borderRadius: '8px',
        cursor: 'pointer',
        fontFamily: 'Inter, sans-serif',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        transition: 'all 0.2s ease',
      }}
      onMouseEnter={e => { e.target.style.background = `${color}15`; e.target.style.borderColor = `${color}44`; }}
      onMouseLeave={e => { e.target.style.background = 'rgba(255,255,255,0.02)'; e.target.style.borderColor = `${color}22`; }}
    >
      {label}
    </button>
  );
}

function MiniStat({ label, value, color }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '14px 12px', borderRadius: '12px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.03)' }}>
      <div style={{ fontSize: '17px', fontWeight: 950, color: color || 'var(--text-primary)' }}>{value}</div>
      <div style={{ fontSize: '8px', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: '4px' }}>{label}</div>
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    ACTIVE: { bg: 'rgba(16, 185, 129, 0.1)', color: 'var(--accent-teal)', border: 'rgba(16, 185, 129, 0.2)', text: 'FAOL' },
    FROZEN: { bg: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning-500)', border: 'rgba(245, 158, 11, 0.2)', text: 'MUZLATILGAN' },
    DELETED: { bg: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger-500)', border: 'rgba(239, 68, 68, 0.2)', text: "O'CHIRILGAN" },
  };
  const s = styles[status] || styles.ACTIVE;
  return (
    <span style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}`, padding: '3px 10px', borderRadius: '20px', fontSize: '9px', fontWeight: 900, letterSpacing: '0.5px' }}>
      {s.text}
    </span>
  );
}
