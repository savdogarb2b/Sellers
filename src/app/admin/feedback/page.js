'use client';
import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';

const STATUS_OPTIONS = [
  { value: '', label: 'Barchasi' },
  { value: 'YANGI', label: 'Yangi' },
  { value: 'KORILDI', label: "Ko'rildi" },
  { value: 'HAL_QILINDI', label: 'Hal qilindi' },
];
const TYPE_OPTIONS = [
  { value: '', label: 'Barchasi' },
  { value: 'TAKLIF', label: 'Takliflar' },
  { value: 'SHIKOYAT', label: 'Shikoyatlar' },
];
const STATUS_COLORS = {
  YANGI: { bg: 'rgba(59,130,246,0.1)', color: '#3b82f6', label: 'Yangi' },
  KORILDI: { bg: 'rgba(245,158,11,0.1)', color: '#f59e0b', label: "Ko'rildi" },
  HAL_QILINDI: { bg: 'rgba(16,185,129,0.1)', color: '#10b981', label: 'Hal qilindi' },
};

export default function AdminFeedbackPage() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [adminNote, setAdminNote] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState({ taklif: 0, shikoyat: 0, yangi: 0, hal: 0 });
  const LIMIT = 15;

  const fetchData = async () => {
    let url = `/api/feedback?page=${page}&limit=${LIMIT}&`;
    if (filterType) url += `type=${filterType}&`;
    if (filterStatus) url += `status=${filterStatus}&`;
    const res = await fetch(url);
    if (res.ok) {
      const json = await res.json();
      setFeedbacks(json.data || []);
      setTotalPages(json.pagination?.totalPages || 1);
      setTotal(json.pagination?.total || 0);
    }
    // Stat'lar uchun alohida (filtrsiz, barcha yozuvlar)
    const allRes = await fetch('/api/feedback');
    if (allRes.ok) {
      const all = await allRes.json();
      setStats({
        taklif: all.filter(f => f.type === 'TAKLIF').length,
        shikoyat: all.filter(f => f.type === 'SHIKOYAT').length,
        yangi: all.filter(f => f.status === 'YANGI').length,
        hal: all.filter(f => f.status === 'HAL_QILINDI').length,
      });
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [filterType, filterStatus, page]);
  useEffect(() => { setPage(1); }, [filterType, filterStatus]);

  const handleStatusChange = async (id, status) => {
    await fetch('/api/feedback', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    });
    fetchData();
  };

  const openDetail = (f) => {
    setSelectedFeedback(f);
    setAdminNote(f.adminNote || '');
    setNewStatus(f.status);
  };

  const handleSave = async () => {
    if (!selectedFeedback) return;
    setSaving(true);
    await fetch('/api/feedback', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: selectedFeedback.id, adminNote, status: newStatus }),
    });
    setSelectedFeedback(null);
    fetchData();
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await fetch(`/api/feedback?id=${deleteId}`, { method: 'DELETE' });
    setDeleteId(null);
    fetchData();
  };

  const taklifCount = stats.taklif;
  const shikoyatCount = stats.shikoyat;
  const yangiCount = stats.yangi;
  const halCount = stats.hal;

  if (loading) return <div className="app-layout"><Sidebar /><Navbar /><main className="main-content"><div className="loading-container"><div className="loading-spinner" /></div></main></div>;

  return (
    <div className="app-layout">
      <Sidebar />
      <Navbar />
      <main className="main-content">
        <div className="animate-in">

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h1 style={{ fontSize: '20px', fontWeight: 900, letterSpacing: '-0.5px' }}>Taklif va Shikoyatlar</h1>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Xodimlar tomonidan yozilgan mijoz fikrlari</p>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <select className="form-input" value={filterType} onChange={e => setFilterType(e.target.value)} style={{ padding: '8px 12px', fontSize: '11px', fontWeight: 700 }}>
                {TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <select className="form-input" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ padding: '8px 12px', fontSize: '11px', fontWeight: 700 }}>
                {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>

          <div className="stats-grid" style={{ marginBottom: '20px' }}>
            <div className="card glass-panel" style={{ padding: '16px', borderLeft: '3px solid #3b82f6' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Takliflar</div>
              <div style={{ fontSize: '24px', fontWeight: 900 }}>{taklifCount}</div>
            </div>
            <div className="card glass-panel" style={{ padding: '16px', borderLeft: '3px solid #ef4444' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Shikoyatlar</div>
              <div style={{ fontSize: '24px', fontWeight: 900 }}>{shikoyatCount}</div>
            </div>
            <div className="card glass-panel" style={{ padding: '16px', borderLeft: '3px solid #f59e0b' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Yangi</div>
              <div style={{ fontSize: '24px', fontWeight: 900, color: yangiCount > 0 ? '#f59e0b' : 'var(--text-primary)' }}>{yangiCount}</div>
            </div>
            <div className="card glass-panel" style={{ padding: '16px', borderLeft: '3px solid #10b981' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Hal qilindi</div>
              <div style={{ fontSize: '24px', fontWeight: 900 }}>{halCount}</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {feedbacks.length === 0 ? (
              <div className="card glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Ma'lumot topilmadi</div>
            ) : feedbacks.map(f => {
              const st = STATUS_COLORS[f.status] || STATUS_COLORS.YANGI;
              return (
                <div key={f.id} className="card glass-panel" style={{ padding: '20px', borderLeft: `3px solid ${f.type === 'TAKLIF' ? '#3b82f6' : '#ef4444'}` }}>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', padding: '3px 10px', borderRadius: '6px', background: f.type === 'TAKLIF' ? 'rgba(59,130,246,0.15)' : 'rgba(239,68,68,0.15)', color: f.type === 'TAKLIF' ? '#3b82f6' : '#ef4444' }}>
                        {f.type === 'TAKLIF' ? 'TAKLIF' : 'SHIKOYAT'}
                      </span>
                      <span style={{ fontSize: '10px', fontWeight: 700, padding: '3px 10px', borderRadius: '6px', background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>{f.category}</span>
                      <select value={f.status} onChange={e => handleStatusChange(f.id, e.target.value)} style={{
                        padding: '3px 10px', fontSize: '10px', fontWeight: 800, borderRadius: '6px', border: 'none', cursor: 'pointer',
                        background: st.bg, color: st.color, textTransform: 'uppercase',
                      }}>
                        <option value="YANGI">Yangi</option>
                        <option value="KORILDI">Ko'rildi</option>
                        <option value="HAL_QILINDI">Hal qilindi</option>
                      </select>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{new Date(f.date).toLocaleDateString('uz-UZ', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      <button onClick={() => openDetail(f)} style={{ padding: '4px 10px', fontSize: '10px', fontWeight: 700, borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-elevated)', color: 'var(--primary-400)', cursor: 'pointer' }}>Javob</button>
                      <button onClick={() => setDeleteId(f.id)} style={{ padding: '4px 10px', fontSize: '10px', fontWeight: 700, borderRadius: '6px', border: '1px solid rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.05)', color: '#ef4444', cursor: 'pointer' }}>O'chir</button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 900, color: 'var(--primary-400)', flexShrink: 0 }}>
                      {(f.user?.name || '?')[0].toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 800 }}>{f.user?.name}</div>
                      {(f.customerName || f.customerPhone) && (
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
                          Mijoz: {f.customerName || '—'} {f.customerPhone && `| ${f.customerPhone}`}
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ fontSize: '14px', fontWeight: 500, lineHeight: 1.7, color: 'var(--text-primary)', padding: '12px 16px', background: 'var(--bg-elevated)', borderRadius: '10px', marginBottom: f.adminNote ? '12px' : '0' }}>
                    {f.message}
                  </div>

                  {f.adminNote && (
                    <div style={{ padding: '12px 16px', background: 'rgba(16,185,129,0.05)', borderRadius: '10px', borderLeft: '3px solid #10b981' }}>
                      <div style={{ fontSize: '9px', fontWeight: 800, color: '#10b981', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.5px' }}>Admin javobi</div>
                      <div style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.6 }}>{f.adminNote}</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '24px' }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{
                padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border)', background: page === 1 ? 'var(--bg-elevated)' : 'var(--bg-card)',
                color: page === 1 ? 'var(--text-muted)' : 'var(--text-primary)', fontWeight: 700, fontSize: '12px', cursor: page === 1 ? 'default' : 'pointer',
              }}>Oldingi</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
                .reduce((acc, p, i, arr) => {
                  if (i > 0 && p - arr[i - 1] > 1) acc.push('...');
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, i) =>
                  p === '...' ? (
                    <span key={`dot-${i}`} style={{ color: 'var(--text-muted)', fontSize: '12px' }}>...</span>
                  ) : (
                    <button key={p} onClick={() => setPage(p)} style={{
                      width: '36px', height: '36px', borderRadius: '8px', border: 'none', fontWeight: 800, fontSize: '12px', cursor: 'pointer',
                      background: page === p ? 'var(--primary-500)' : 'var(--bg-elevated)', color: page === p ? '#fff' : 'var(--text-primary)',
                    }}>{p}</button>
                  )
                )}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{
                padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border)', background: page === totalPages ? 'var(--bg-elevated)' : 'var(--bg-card)',
                color: page === totalPages ? 'var(--text-muted)' : 'var(--text-primary)', fontWeight: 700, fontSize: '12px', cursor: page === totalPages ? 'default' : 'pointer',
              }}>Keyingi</button>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '8px' }}>Jami: {total}</span>
            </div>
          )}

        </div>
      </main>

      {selectedFeedback && (
        <div style={{ position: 'fixed', inset: 0, background: 'var(--bg-overlay)', backdropFilter: 'blur(10px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={() => setSelectedFeedback(null)}>
          <div className="card glass-panel animate-in" style={{ width: '100%', maxWidth: '560px', padding: '28px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ fontSize: '15px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Batafsil ko'rish va javob</div>
              <button onClick={() => setSelectedFeedback(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '24px', cursor: 'pointer' }}>×</button>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '10px', fontWeight: 800, padding: '4px 12px', borderRadius: '6px', background: selectedFeedback.type === 'TAKLIF' ? 'rgba(59,130,246,0.15)' : 'rgba(239,68,68,0.15)', color: selectedFeedback.type === 'TAKLIF' ? '#3b82f6' : '#ef4444', textTransform: 'uppercase' }}>{selectedFeedback.type}</span>
              <span style={{ fontSize: '10px', fontWeight: 700, padding: '4px 12px', borderRadius: '6px', background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>{selectedFeedback.category}</span>
              <span style={{ fontSize: '10px', fontWeight: 600, padding: '4px 12px', borderRadius: '6px', background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>{new Date(selectedFeedback.date).toLocaleDateString('uz-UZ', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
            </div>

            <div style={{ padding: '14px 16px', background: 'var(--bg-elevated)', borderRadius: '10px', marginBottom: '16px', borderLeft: `3px solid ${selectedFeedback.type === 'TAKLIF' ? '#3b82f6' : '#ef4444'}` }}>
              <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '6px' }}>
                {selectedFeedback.user?.name}
                {selectedFeedback.customerName && <span style={{ marginLeft: '8px', fontWeight: 600 }}>| Mijoz: {selectedFeedback.customerName}</span>}
                {selectedFeedback.customerPhone && <span style={{ marginLeft: '8px', fontWeight: 600 }}>| {selectedFeedback.customerPhone}</span>}
              </div>
              <div style={{ fontSize: '14px', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{selectedFeedback.message}</div>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase' }}>Holatni o'zgartirish</label>
              <select className="form-input" value={newStatus} onChange={e => setNewStatus(e.target.value)}>
                <option value="YANGI">Yangi</option>
                <option value="KORILDI">Ko'rildi</option>
                <option value="HAL_QILINDI">Hal qilindi</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase' }}>Admin javobi / Izoh</label>
              <textarea className="form-input" rows={4} value={adminNote} onChange={e => setAdminNote(e.target.value)} placeholder="Javob yoki izoh yozing..." style={{ resize: 'vertical' }} />
            </div>

            <button onClick={handleSave} disabled={saving} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: '11px' }}>
              {saving ? 'SAQLANMOQDA...' : 'SAQLASH'}
            </button>
          </div>
        </div>
      )}

      {deleteId && (
        <div style={{ position: 'fixed', inset: 0, background: 'var(--bg-overlay)', backdropFilter: 'blur(10px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={() => setDeleteId(null)}>
          <div className="card glass-panel animate-in" style={{ width: '100%', maxWidth: '400px', padding: '24px', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: '36px', marginBottom: '16px' }}>&#9888;</div>
            <div style={{ fontSize: '16px', fontWeight: 800, marginBottom: '8px' }}>O'chirishni tasdiqlang</div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '24px' }}>Bu amalni qaytarib bo'lmaydi</div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button onClick={() => setDeleteId(null)} style={{ padding: '10px 24px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--bg-elevated)', color: 'var(--text-primary)', fontWeight: 700, cursor: 'pointer', fontSize: '12px' }}>BEKOR</button>
              <button onClick={handleDelete} style={{ padding: '10px 24px', borderRadius: '10px', border: 'none', background: '#ef4444', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: '12px' }}>O'CHIRISH</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
