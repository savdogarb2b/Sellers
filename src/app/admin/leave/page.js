'use client';
import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';

const TYPE_LABELS = { KECHIKISH: 'Kechikish', TOLIK_DAM: "To'liq dam", YARIM_KUN: 'Yarim kun' };
const TYPE_COLORS = { KECHIKISH: '#f59e0b', TOLIK_DAM: '#ef4444', YARIM_KUN: '#3b82f6' };
const STATUS_COLORS = {
  KUTILMOQDA: { bg: 'rgba(245,158,11,0.1)', color: '#f59e0b', label: 'Kutilmoqda' },
  TASDIQLANDI: { bg: 'rgba(16,185,129,0.1)', color: '#10b981', label: 'Tasdiqlandi' },
  RAD_ETILDI: { bg: 'rgba(239,68,68,0.1)', color: '#ef4444', label: 'Rad etildi' },
};

export default function AdminLeavePage() {
  const [requests, setRequests] = useState([]);
  const [penalties, setPenalties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('requests');
  const [selectedReq, setSelectedReq] = useState(null);
  const [adminNote, setAdminNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [editPenalty, setEditPenalty] = useState(null);
  const [penaltyForm, setPenaltyForm] = useState({ reason: '', amount: '' });

  const fetchData = async () => {
    const [req, pen] = await Promise.all([
      fetch('/api/leave-requests').then(r => r.ok ? r.json() : []),
      fetch('/api/penalty-records').then(r => r.ok ? r.json() : []),
    ]);
    setRequests(Array.isArray(req) ? req : []);
    setPenalties(Array.isArray(pen) ? pen : []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleDecision = async (id, status) => {
    setSaving(true);
    await fetch('/api/leave-requests', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status, adminNote }),
    });
    setSelectedReq(null);
    setAdminNote('');
    fetchData();
    setSaving(false);
  };

  const handleDeletePenalty = async (id) => {
    if (!confirm('Jarimani o\'chirishni xohlaysizmi?')) return;
    await fetch(`/api/penalty-records?id=${id}`, { method: 'DELETE' });
    fetchData();
  };

  const handleEditPenalty = async () => {
    if (!editPenalty) return;
    setSaving(true);
    await fetch('/api/penalty-records', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: editPenalty.id, reason: penaltyForm.reason, amount: penaltyForm.amount }),
    });
    setEditPenalty(null);
    fetchData();
    setSaving(false);
  };

  const kutilmoqda = requests.filter(r => r.status === 'KUTILMOQDA').length;

  if (loading) return <div className="app-layout"><Sidebar /><Navbar /><main className="main-content"><div className="loading-container"><div className="loading-spinner" /></div></main></div>;

  return (
    <div className="app-layout">
      <Sidebar />
      <Navbar />
      <main className="main-content">
        <div className="animate-in">

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div>
              <h1 style={{ fontSize: '20px', fontWeight: 900 }}>Ruxsatlar va Jarimalar</h1>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Xodimlar so'rovlari va jarima boshqaruvi</p>
            </div>
            {kutilmoqda > 0 && (
              <div style={{ padding: '8px 16px', borderRadius: '10px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}>
                <span style={{ fontSize: '12px', fontWeight: 800, color: '#f59e0b' }}>{kutilmoqda} ta kutilmoqda</span>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', background: 'var(--bg-elevated)', padding: '6px', borderRadius: '14px', width: 'fit-content' }}>
            <button onClick={() => setTab('requests')} className={`btn ${tab === 'requests' ? 'btn-primary' : 'btn-secondary'}`} style={{ border: 'none', borderRadius: '10px', fontSize: '10px', position: 'relative' }}>
              RUXSAT SO'ROVLARI
              {kutilmoqda > 0 && <span style={{ position: 'absolute', top: '-4px', right: '-4px', width: '16px', height: '16px', borderRadius: '50%', background: '#f59e0b', color: '#000', fontSize: '9px', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{kutilmoqda}</span>}
            </button>
            <button onClick={() => setTab('penalties')} className={`btn ${tab === 'penalties' ? 'btn-primary' : 'btn-secondary'}`} style={{ border: tab === 'penalties' ? '1px solid var(--primary-500)' : 'none', borderRadius: '10px', fontSize: '10px' }}>
              JARIMALAR ({penalties.length})
            </button>
          </div>

          {tab === 'requests' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {requests.length === 0 ? (
                <div className="card glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>So'rov topilmadi</div>
              ) : requests.map(r => {
                const st = STATUS_COLORS[r.status] || STATUS_COLORS.KUTILMOQDA;
                const typeColor = TYPE_COLORS[r.type] || '#f59e0b';
                return (
                  <div key={r.id} className="card glass-panel" style={{ padding: '20px', borderLeft: `3px solid ${typeColor}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 900, color: 'var(--primary-400)' }}>
                          {(r.user?.name || '?')[0].toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 800 }}>{r.user?.name}</div>
                          <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{new Date(r.date).toLocaleDateString('uz-UZ', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '10px', fontWeight: 800, padding: '3px 10px', borderRadius: '6px', background: `${typeColor}15`, color: typeColor, textTransform: 'uppercase' }}>{TYPE_LABELS[r.type]}</span>
                        <span style={{ fontSize: '10px', fontWeight: 800, padding: '3px 10px', borderRadius: '6px', background: st.bg, color: st.color }}>{st.label}</span>
                      </div>
                    </div>

                    <div style={{ fontSize: '14px', lineHeight: 1.6, padding: '12px 14px', background: 'var(--bg-elevated)', borderRadius: '10px', marginBottom: '12px' }}>
                      {r.reason}
                    </div>

                    {r.adminNote && (
                      <div style={{ padding: '10px 14px', background: 'rgba(16,185,129,0.05)', borderRadius: '10px', borderLeft: '3px solid #10b981', marginBottom: '12px' }}>
                        <div style={{ fontSize: '9px', fontWeight: 800, color: '#10b981', textTransform: 'uppercase', marginBottom: '4px' }}>Admin javobi</div>
                        <div style={{ fontSize: '12px' }}>{r.adminNote}</div>
                      </div>
                    )}

                    {r.status === 'KUTILMOQDA' && (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => { setSelectedReq(r); setAdminNote(''); }} style={{
                          flex: 1, padding: '10px', borderRadius: '10px', border: 'none', background: 'rgba(16,185,129,0.1)', color: '#10b981', fontWeight: 800, fontSize: '11px', cursor: 'pointer', textTransform: 'uppercase',
                        }}>Tasdiqlash</button>
                        <button onClick={() => handleDecision(r.id, 'RAD_ETILDI')} style={{
                          flex: 1, padding: '10px', borderRadius: '10px', border: 'none', background: 'rgba(239,68,68,0.1)', color: '#ef4444', fontWeight: 800, fontSize: '11px', cursor: 'pointer', textTransform: 'uppercase',
                        }}>Rad etish</button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {penalties.length === 0 ? (
                <div className="card glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Jarimalar topilmadi</div>
              ) : penalties.map(p => (
                <div key={p.id} className="card glass-panel" style={{ padding: '16px', borderLeft: '3px solid #ef4444' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 800 }}>{p.user?.name}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{p.reason}</div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>{new Date(p.date).toLocaleDateString('uz-UZ')}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '16px', fontWeight: 900, color: '#ef4444' }}>-{p.amount?.toLocaleString()}</span>
                      <button onClick={() => { setEditPenalty(p); setPenaltyForm({ reason: p.reason, amount: p.amount }); }} style={{ padding: '4px 10px', fontSize: '10px', fontWeight: 700, borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-elevated)', color: 'var(--primary-400)', cursor: 'pointer' }}>Tahrir</button>
                      <button onClick={() => handleDeletePenalty(p.id)} style={{ padding: '4px 10px', fontSize: '10px', fontWeight: 700, borderRadius: '6px', border: '1px solid rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.05)', color: '#ef4444', cursor: 'pointer' }}>O'chir</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </main>

      {selectedReq && (
        <div style={{ position: 'fixed', inset: 0, background: 'var(--bg-overlay)', backdropFilter: 'blur(10px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={() => setSelectedReq(null)}>
          <div className="card glass-panel animate-in" style={{ width: '100%', maxWidth: '500px', padding: '24px' }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: '15px', fontWeight: 900, textTransform: 'uppercase', marginBottom: '16px' }}>So'rovni tasdiqlash</div>
            <div style={{ padding: '12px', background: 'var(--bg-elevated)', borderRadius: '10px', marginBottom: '16px' }}>
              <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '4px' }}>{selectedReq.user?.name} — {TYPE_LABELS[selectedReq.type]}</div>
              <div style={{ fontSize: '13px', lineHeight: 1.6 }}>{selectedReq.reason}</div>
            </div>
            <div className="form-group">
              <label className="form-label" style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase' }}>Izoh (ixtiyoriy)</label>
              <textarea className="form-input" rows={3} value={adminNote} onChange={e => setAdminNote(e.target.value)} placeholder="Javob yoki izoh..." style={{ resize: 'vertical' }} />
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setSelectedReq(null)} style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--bg-elevated)', color: 'var(--text-primary)', fontWeight: 700, cursor: 'pointer', fontSize: '12px' }}>BEKOR</button>
              <button onClick={() => handleDecision(selectedReq.id, 'TASDIQLANDI')} disabled={saving} style={{ flex: 1, padding: '12px', borderRadius: '10px', border: 'none', background: '#10b981', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: '12px' }}>
                {saving ? '...' : 'TASDIQLASH'}
              </button>
            </div>
          </div>
        </div>
      )}

      {editPenalty && (
        <div style={{ position: 'fixed', inset: 0, background: 'var(--bg-overlay)', backdropFilter: 'blur(10px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={() => setEditPenalty(null)}>
          <div className="card glass-panel animate-in" style={{ width: '100%', maxWidth: '440px', padding: '24px' }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: '15px', fontWeight: 900, textTransform: 'uppercase', marginBottom: '16px' }}>Jarimani tahrirlash</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '16px' }}>Xodim: {editPenalty.user?.name}</div>
            <div className="form-group">
              <label className="form-label" style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase' }}>Sabab</label>
              <input className="form-input" value={penaltyForm.reason} onChange={e => setPenaltyForm({ ...penaltyForm, reason: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label" style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase' }}>Summa (0 qilsangiz jarima olib tashlanadi)</label>
              <input className="form-input" type="number" min="0" value={penaltyForm.amount} onChange={e => setPenaltyForm({ ...penaltyForm, amount: e.target.value })} />
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setEditPenalty(null)} style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--bg-elevated)', color: 'var(--text-primary)', fontWeight: 700, cursor: 'pointer', fontSize: '12px' }}>BEKOR</button>
              <button onClick={handleEditPenalty} disabled={saving} className="btn btn-primary" style={{ flex: 1, justifyContent: 'center', padding: '12px', fontSize: '12px' }}>
                {saving ? '...' : 'SAQLASH'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
