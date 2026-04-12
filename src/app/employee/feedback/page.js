'use client';
import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';

const CATEGORIES = ['Mahsulot', 'Xizmat', 'Narx', 'Yetkazish', 'Boshqa'];
const STATUS_COLORS = {
  YANGI: { bg: 'rgba(59,130,246,0.1)', color: '#3b82f6', label: 'Yangi' },
  KORILDI: { bg: 'rgba(245,158,11,0.1)', color: '#f59e0b', label: "Ko'rildi" },
  HAL_QILINDI: { bg: 'rgba(16,185,129,0.1)', color: '#10b981', label: 'Hal qilindi' },
};

export default function EmployeeFeedbackPage() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [form, setForm] = useState({ type: 'TAKLIF', customerName: '', customerPhone: '', message: '', category: 'Boshqa' });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState({ taklif: 0, shikoyat: 0, hal: 0 });
  const LIMIT = 15;

  const fetchData = async () => {
    const res = await fetch(`/api/feedback?page=${page}&limit=${LIMIT}`);
    if (res.ok) {
      const json = await res.json();
      setFeedbacks(json.data || []);
      setTotalPages(json.pagination?.totalPages || 1);
      setTotal(json.pagination?.total || 0);
    }
    const allRes = await fetch('/api/feedback');
    if (allRes.ok) {
      const all = await allRes.json();
      setStats({
        taklif: all.filter(f => f.type === 'TAKLIF').length,
        shikoyat: all.filter(f => f.type === 'SHIKOYAT').length,
        hal: all.filter(f => f.status === 'HAL_QILINDI').length,
      });
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [page]);

  const resetForm = () => {
    setForm({ type: 'TAKLIF', customerName: '', customerPhone: '', message: '', category: 'Boshqa' });
    setEditingId(null);
    setShowForm(false);
  };

  const openEdit = (f) => {
    setForm({ type: f.type, customerName: f.customerName || '', customerPhone: f.customerPhone || '', message: f.message, category: f.category || 'Boshqa' });
    setEditingId(f.id);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);

    const url = '/api/feedback';
    const method = editingId ? 'PUT' : 'POST';
    const body = editingId ? { ...form, id: editingId } : form;

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      setSuccess(editingId ? 'Muvaffaqiyatli tahrirlandi!' : (form.type === 'TAKLIF' ? 'Taklif yuborildi!' : 'Shikoyat yuborildi!'));
      resetForm();
      setPage(1);
      fetchData();
      setTimeout(() => setSuccess(''), 3000);
    }
    setSending(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await fetch(`/api/feedback?id=${deleteId}`, { method: 'DELETE' });
    setDeleteId(null);
    fetchData();
  };

  const taklifCount = stats.taklif;
  const shikoyatCount = stats.shikoyat;
  const halQilindiCount = stats.hal;

  if (loading) return <div className="app-layout"><Sidebar /><Navbar /><main className="main-content"><div className="loading-container"><div className="loading-spinner" /></div></main></div>;

  return (
    <div className="app-layout">
      <Sidebar />
      <Navbar />
      <main className="main-content">
        <div className="animate-in">

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div>
              <h1 style={{ fontSize: '20px', fontWeight: 900, letterSpacing: '-0.5px' }}>Taklif va Shikoyatlar</h1>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Mijozlardan kelgan fikr-mulohazalar</p>
            </div>
            <button onClick={() => { if (showForm) resetForm(); else setShowForm(true); }} className="btn btn-primary" style={{ fontSize: '11px', padding: '10px 20px' }}>
              {showForm ? 'BEKOR QILISH' : 'YANGI YOZISH'}
            </button>
          </div>

          {success && (
            <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '12px', padding: '12px 16px', marginBottom: '16px', color: '#10b981', fontWeight: 700, fontSize: '13px' }}>
              {success}
            </div>
          )}

          <div className="stats-grid" style={{ marginBottom: '20px' }}>
            <div className="card glass-panel" style={{ padding: '16px', borderLeft: '3px solid #3b82f6' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Takliflar</div>
              <div style={{ fontSize: '24px', fontWeight: 900 }}>{taklifCount}</div>
            </div>
            <div className="card glass-panel" style={{ padding: '16px', borderLeft: '3px solid #ef4444' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Shikoyatlar</div>
              <div style={{ fontSize: '24px', fontWeight: 900 }}>{shikoyatCount}</div>
            </div>
            <div className="card glass-panel" style={{ padding: '16px', borderLeft: '3px solid #10b981' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Hal qilindi</div>
              <div style={{ fontSize: '24px', fontWeight: 900 }}>{halQilindiCount}</div>
            </div>
          </div>

          {showForm && (
            <div className="card glass-panel" style={{ padding: '24px', marginBottom: '20px' }}>
              <div style={{ fontSize: '13px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '20px' }}>
                {editingId ? 'Tahrirlash' : 'Yangi taklif yoki shikoyat'}
              </div>
              <form onSubmit={handleSubmit}>
                <div className="form-row" style={{ marginBottom: '16px' }}>
                  <button type="button" onClick={() => setForm({...form, type: 'TAKLIF'})} style={{
                    flex: 1, padding: '12px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: 800, fontSize: '12px', textTransform: 'uppercase',
                    background: form.type === 'TAKLIF' ? 'rgba(59,130,246,0.2)' : 'var(--bg-elevated)', color: form.type === 'TAKLIF' ? '#3b82f6' : 'var(--text-muted)',
                    outline: form.type === 'TAKLIF' ? '2px solid #3b82f6' : 'none',
                  }}>Taklif</button>
                  <button type="button" onClick={() => setForm({...form, type: 'SHIKOYAT'})} style={{
                    flex: 1, padding: '12px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: 800, fontSize: '12px', textTransform: 'uppercase',
                    background: form.type === 'SHIKOYAT' ? 'rgba(239,68,68,0.2)' : 'var(--bg-elevated)', color: form.type === 'SHIKOYAT' ? '#ef4444' : 'var(--text-muted)',
                    outline: form.type === 'SHIKOYAT' ? '2px solid #ef4444' : 'none',
                  }}>Shikoyat</button>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase' }}>Mijoz ismi</label>
                    <input className="form-input" value={form.customerName} onChange={e => setForm({...form, customerName: e.target.value})} placeholder="Ixtiyoriy" />
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase' }}>Telefon raqami</label>
                    <input className="form-input" value={form.customerPhone} onChange={e => setForm({...form, customerPhone: e.target.value})} placeholder="Ixtiyoriy" />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase' }}>Kategoriya</label>
                  <select className="form-input" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase' }}>Xabar *</label>
                  <textarea className="form-input" rows={4} value={form.message} onChange={e => setForm({...form, message: e.target.value})} placeholder="Mijozning taklifi yoki shikoyatini yozing..." required style={{ resize: 'vertical' }} />
                </div>

                <button type="submit" className="btn btn-primary" disabled={sending} style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: '11px' }}>
                  {sending ? 'YUBORILMOQDA...' : editingId ? 'SAQLASH' : 'YUBORISH'}
                </button>
              </form>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {feedbacks.length === 0 ? (
              <div className="card glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                Hali taklif yoki shikoyat yozilmagan
              </div>
            ) : feedbacks.map(f => {
              const st = STATUS_COLORS[f.status] || STATUS_COLORS.YANGI;
              return (
                <div key={f.id} className="card glass-panel" style={{ padding: '16px', borderLeft: `3px solid ${f.type === 'TAKLIF' ? '#3b82f6' : '#ef4444'}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', padding: '3px 10px', borderRadius: '6px', background: f.type === 'TAKLIF' ? 'rgba(59,130,246,0.1)' : 'rgba(239,68,68,0.1)', color: f.type === 'TAKLIF' ? '#3b82f6' : '#ef4444' }}>{f.type}</span>
                      <span style={{ fontSize: '10px', fontWeight: 700, padding: '3px 10px', borderRadius: '6px', background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>{f.category}</span>
                      <span style={{ fontSize: '10px', fontWeight: 800, padding: '3px 10px', borderRadius: '6px', background: st.bg, color: st.color }}>{st.label}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{new Date(f.date).toLocaleDateString('uz-UZ')}</span>
                      <button onClick={() => openEdit(f)} style={{ padding: '4px 8px', fontSize: '10px', fontWeight: 700, borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-elevated)', color: 'var(--primary-400)', cursor: 'pointer' }}>Tahrir</button>
                      <button onClick={() => setDeleteId(f.id)} style={{ padding: '4px 8px', fontSize: '10px', fontWeight: 700, borderRadius: '6px', border: '1px solid rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.05)', color: '#ef4444', cursor: 'pointer' }}>O'chir</button>
                    </div>
                  </div>

                  <div style={{ fontSize: '13px', fontWeight: 600, lineHeight: 1.6, color: 'var(--text-primary)', marginBottom: '8px' }}>{f.message}</div>

                  {(f.customerName || f.customerPhone) && (
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                      {f.customerName && <span>Mijoz: {f.customerName}</span>}
                      {f.customerPhone && <span style={{ marginLeft: '12px' }}>Tel: {f.customerPhone}</span>}
                    </div>
                  )}

                  {f.adminNote && (
                    <div style={{ padding: '10px 14px', background: 'rgba(16,185,129,0.05)', borderRadius: '10px', borderLeft: '3px solid #10b981' }}>
                      <div style={{ fontSize: '9px', fontWeight: 800, color: '#10b981', textTransform: 'uppercase', marginBottom: '4px', letterSpacing: '0.5px' }}>Admin javobi</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-primary)', lineHeight: 1.6 }}>{f.adminNote}</div>
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
