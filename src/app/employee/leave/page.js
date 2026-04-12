'use client';
import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';

const TYPE_OPTIONS = [
  { value: 'KECHIKISH', label: 'Kechikib kelaman', color: '#f59e0b', desc: 'Bugun ishga kechroq kelaman' },
  { value: 'TOLIK_DAM', label: 'To\'liq dam olaman', color: '#ef4444', desc: 'Bugun ishga kelmayman' },
  { value: 'YARIM_KUN', label: 'Yarim kun ishlayman', color: '#3b82f6', desc: 'Yarim kundan keyin ketaman' },
];
const STATUS_COLORS = {
  KUTILMOQDA: { bg: 'rgba(245,158,11,0.1)', color: '#f59e0b', label: 'Kutilmoqda' },
  TASDIQLANDI: { bg: 'rgba(16,185,129,0.1)', color: '#10b981', label: 'Tasdiqlandi' },
  RAD_ETILDI: { bg: 'rgba(239,68,68,0.1)', color: '#ef4444', label: 'Rad etildi' },
};

export default function EmployeeLeavePage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({ type: 'KECHIKISH', date: new Date().toISOString().slice(0, 10), reason: '' });

  const fetchData = async () => {
    const res = await fetch('/api/leave-requests');
    if (res.ok) setRequests(await res.json());
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    const res = await fetch('/api/leave-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setSuccess('So\'rov muvaffaqiyatli yuborildi!');
      setForm({ type: 'KECHIKISH', date: new Date().toISOString().slice(0, 10), reason: '' });
      setShowForm(false);
      fetchData();
      setTimeout(() => setSuccess(''), 3000);
    }
    setSending(false);
  };

  const handleDelete = async (id) => {
    if (!confirm('So\'rovni o\'chirishni xohlaysizmi?')) return;
    await fetch(`/api/leave-requests?id=${id}`, { method: 'DELETE' });
    fetchData();
  };

  const kutilmoqda = requests.filter(r => r.status === 'KUTILMOQDA').length;
  const tasdiqlandi = requests.filter(r => r.status === 'TASDIQLANDI').length;

  if (loading) return <div className="app-layout"><Sidebar /><Navbar /><main className="main-content"><div className="loading-container"><div className="loading-spinner" /></div></main></div>;

  return (
    <div className="app-layout">
      <Sidebar />
      <Navbar />
      <main className="main-content">
        <div className="animate-in">

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div>
              <h1 style={{ fontSize: '20px', fontWeight: 900 }}>Ruxsat So'rash</h1>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Kechikish yoki dam olish uchun ruxsat</p>
            </div>
            <button onClick={() => setShowForm(!showForm)} className="btn btn-primary" style={{ fontSize: '11px', padding: '10px 20px' }}>
              {showForm ? 'BEKOR' : 'RUXSAT SO\'RASH'}
            </button>
          </div>

          {success && (
            <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '12px', padding: '12px 16px', marginBottom: '16px', color: '#10b981', fontWeight: 700, fontSize: '13px' }}>
              {success}
            </div>
          )}

          <div className="stats-grid" style={{ marginBottom: '20px' }}>
            <div className="card glass-panel" style={{ padding: '16px', borderLeft: '3px solid #f59e0b' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Kutilmoqda</div>
              <div style={{ fontSize: '24px', fontWeight: 900, color: kutilmoqda > 0 ? '#f59e0b' : 'var(--text-primary)' }}>{kutilmoqda}</div>
            </div>
            <div className="card glass-panel" style={{ padding: '16px', borderLeft: '3px solid #10b981' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Tasdiqlangan</div>
              <div style={{ fontSize: '24px', fontWeight: 900 }}>{tasdiqlandi}</div>
            </div>
            <div className="card glass-panel" style={{ padding: '16px', borderLeft: '3px solid var(--primary-500)' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Jami so'rovlar</div>
              <div style={{ fontSize: '24px', fontWeight: 900 }}>{requests.length}</div>
            </div>
          </div>

          {showForm && (
            <div className="card glass-panel" style={{ padding: '24px', marginBottom: '20px' }}>
              <div style={{ fontSize: '13px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '20px' }}>Yangi so'rov</div>
              <form onSubmit={handleSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '16px' }}>
                  {TYPE_OPTIONS.map(t => (
                    <button key={t.value} type="button" onClick={() => setForm({ ...form, type: t.value })} style={{
                      padding: '14px', borderRadius: '12px', border: 'none', cursor: 'pointer', textAlign: 'center',
                      background: form.type === t.value ? `${t.color}20` : 'var(--bg-elevated)',
                      outline: form.type === t.value ? `2px solid ${t.color}` : 'none',
                    }}>
                      <div style={{ fontSize: '12px', fontWeight: 800, color: form.type === t.value ? t.color : 'var(--text-primary)', marginBottom: '4px' }}>{t.label}</div>
                      <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>{t.desc}</div>
                    </button>
                  ))}
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase' }}>Sana</label>
                  <input className="form-input" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase' }}>Sabab *</label>
                  <textarea className="form-input" rows={3} value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} placeholder="Sababni yozing..." required style={{ resize: 'vertical' }} />
                </div>

                <button type="submit" className="btn btn-primary" disabled={sending} style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: '11px' }}>
                  {sending ? 'YUBORILMOQDA...' : 'YUBORISH'}
                </button>
              </form>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {requests.length === 0 ? (
              <div className="card glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                Hali so'rov yuborilmagan
              </div>
            ) : requests.map(r => {
              const st = STATUS_COLORS[r.status] || STATUS_COLORS.KUTILMOQDA;
              const typeOpt = TYPE_OPTIONS.find(t => t.value === r.type) || TYPE_OPTIONS[0];
              return (
                <div key={r.id} className="card glass-panel" style={{ padding: '16px', borderLeft: `3px solid ${typeOpt.color}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '10px', fontWeight: 800, padding: '3px 10px', borderRadius: '6px', background: `${typeOpt.color}15`, color: typeOpt.color, textTransform: 'uppercase' }}>{typeOpt.label}</span>
                      <span style={{ fontSize: '10px', fontWeight: 800, padding: '3px 10px', borderRadius: '6px', background: st.bg, color: st.color }}>{st.label}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{new Date(r.date).toLocaleDateString('uz-UZ')}</span>
                      {r.status === 'KUTILMOQDA' && (
                        <button onClick={() => handleDelete(r.id)} style={{ padding: '4px 8px', fontSize: '10px', fontWeight: 700, borderRadius: '6px', border: '1px solid rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.05)', color: '#ef4444', cursor: 'pointer' }}>Bekor</button>
                      )}
                    </div>
                  </div>
                  <div style={{ fontSize: '13px', lineHeight: 1.6, color: 'var(--text-primary)' }}>{r.reason}</div>
                  {r.adminNote && (
                    <div style={{ marginTop: '8px', padding: '10px 14px', background: 'rgba(16,185,129,0.05)', borderRadius: '10px', borderLeft: '3px solid #10b981' }}>
                      <div style={{ fontSize: '9px', fontWeight: 800, color: '#10b981', textTransform: 'uppercase', marginBottom: '4px' }}>Admin javobi</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-primary)' }}>{r.adminNote}</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>
      </main>
    </div>
  );
}
