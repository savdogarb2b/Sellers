'use client';
import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';

const ICON_OPTIONS = ['📱', '💬', '📸', '🌐', '📞', '🏢', '📧', '📣', '🤝', '🎯', '📋', '🔗'];

export default function AdminSourcesPage() {
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: '', icon: '📱' });
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const fetchData = async () => {
    const res = await fetch('/api/lead-sources');
    if (res.ok) setSources(await res.json());
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const method = editingId ? 'PUT' : 'POST';
    const body = editingId ? { ...form, id: editingId } : form;
    await fetch('/api/lead-sources', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    setForm({ name: '', icon: '📱' });
    setEditingId(null);
    setShowForm(false);
    fetchData();
    setSaving(false);
  };

  const openEdit = (s) => {
    setForm({ name: s.name, icon: s.icon || '📱' });
    setEditingId(s.id);
    setShowForm(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await fetch(`/api/lead-sources?id=${deleteId}`, { method: 'DELETE' });
    setDeleteId(null);
    fetchData();
  };

  if (loading) return <div className="app-layout"><Sidebar /><Navbar /><main className="main-content"><div className="loading-container"><div className="loading-spinner" /></div></main></div>;

  return (
    <div className="app-layout">
      <Sidebar />
      <Navbar />
      <main className="main-content">
        <div className="animate-in">

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div>
              <h1 style={{ fontSize: '20px', fontWeight: 900, letterSpacing: '-0.5px' }}>Lid Manbalari</h1>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Mijozlar qayerdan kelayotganini kuzating</p>
            </div>
            <button onClick={() => { setShowForm(!showForm); setEditingId(null); setForm({ name: '', icon: '📱' }); }} className="btn btn-primary" style={{ fontSize: '11px', padding: '10px 20px' }}>
              {showForm ? 'BEKOR' : 'YANGI MANBA'}
            </button>
          </div>

          {showForm && (
            <div className="card glass-panel" style={{ padding: '24px', marginBottom: '20px' }}>
              <div style={{ fontSize: '13px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>
                {editingId ? 'Manbani tahrirlash' : 'Yangi manba qo\'shish'}
              </div>
              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '16px' }}>
                  <label className="form-label" style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase' }}>Icon tanlang</label>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {ICON_OPTIONS.map(ic => (
                      <button key={ic} type="button" onClick={() => setForm({ ...form, icon: ic })} style={{
                        width: '40px', height: '40px', borderRadius: '10px', border: 'none', fontSize: '20px', cursor: 'pointer',
                        background: form.icon === ic ? 'var(--primary-500)' : 'var(--bg-elevated)',
                        outline: form.icon === ic ? '2px solid var(--primary-400)' : 'none',
                      }}>{ic}</button>
                    ))}
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase' }}>Manba nomi *</label>
                  <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="masalan: Instagram, Telegram, Tavsiya" required />
                </div>
                <button type="submit" className="btn btn-primary" disabled={saving} style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: '11px' }}>
                  {saving ? 'SAQLANMOQDA...' : editingId ? 'SAQLASH' : 'QO\'SHISH'}
                </button>
              </form>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' }}>
            {sources.length === 0 ? (
              <div className="card glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', gridColumn: '1 / -1' }}>
                Hali manba qo'shilmagan. "YANGI MANBA" tugmasini bosing.
              </div>
            ) : sources.map((s, i) => (
              <div key={s.id} className="card glass-panel" style={{ padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                    {s.icon || '📱'}
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 800 }}>{s.name}</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>#{i + 1}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button onClick={() => openEdit(s)} style={{ padding: '4px 8px', fontSize: '10px', fontWeight: 700, borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-elevated)', color: 'var(--primary-400)', cursor: 'pointer' }}>Tahrir</button>
                  <button onClick={() => setDeleteId(s.id)} style={{ padding: '4px 8px', fontSize: '10px', fontWeight: 700, borderRadius: '6px', border: '1px solid rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.05)', color: '#ef4444', cursor: 'pointer' }}>O'chir</button>
                </div>
              </div>
            ))}
          </div>

        </div>
      </main>

      {deleteId && (
        <div style={{ position: 'fixed', inset: 0, background: 'var(--bg-overlay)', backdropFilter: 'blur(10px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={() => setDeleteId(null)}>
          <div className="card glass-panel animate-in" style={{ width: '100%', maxWidth: '400px', padding: '24px', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: '36px', marginBottom: '16px' }}>&#9888;</div>
            <div style={{ fontSize: '16px', fontWeight: 800, marginBottom: '8px' }}>Manbani o'chirish</div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '24px' }}>Bu manba bilan bog'liq barcha hisobot ma'lumotlari ham o'chiriladi</div>
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
