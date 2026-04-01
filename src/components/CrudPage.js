'use client';
import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';

function CrudPage({ title, apiUrl, fields }) {
  const [items, setItems] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(fields.reduce((acc, f) => ({ ...acc, [f.name]: '' }), {}));
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);
  const fetchData = async () => { const r = await fetch(apiUrl); setItems(await r.json()); setLoading(false); };

  const openCreate = () => {
    setEditItem(null);
    setForm(fields.reduce((acc, f) => ({ ...acc, [f.name]: '' }), {}));
    setShowModal(true);
  };

  const openEdit = (item) => {
    setEditItem(item);
    const formData = {};
    fields.forEach(f => {
      formData[f.name] = item[f.name] !== null && item[f.name] !== undefined ? String(item[f.name]) : '';
    });
    setForm(formData);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editItem) {
      // Update
      await fetch(apiUrl, { 
        method: 'PUT', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ ...form, id: editItem.id }) 
      });
    } else {
      // Create
      await fetch(apiUrl, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(form) 
      });
    }
    setShowModal(false);
    setEditItem(null);
    setForm(fields.reduce((acc, f) => ({ ...acc, [f.name]: '' }), {}));
    fetchData();
  };

  const handleDelete = async (id) => {
    if (confirm('O\'chirmoqchimisiz?')) { await fetch(`${apiUrl}?id=${id}`, { method: 'DELETE' }); fetchData(); }
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <Navbar />
      <main className="main-content">
        <div className="animate-in">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div>
              <div style={{ fontSize: '16px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{title}</div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: '4px' }}>Tizim sozlamalari va ma'lumotlar bazasi</div>
            </div>
            <button className="btn btn-primary" onClick={openCreate} style={{ fontSize: '11px', padding: '8px 16px', fontWeight: 700 }}>
               YANGI QO'SHISH
            </button>
          </div>

        <div className="card glass-panel animate-in" style={{ padding: '0', overflow: 'hidden' }}>
          {loading ? (
            <div className="loading-container" style={{ padding: '40px' }}><div className="loading-spinner" /></div>
          ) : items.length === 0 ? (
            <div className="empty-state" style={{ padding: '80px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '16px' }}>Hozircha {title} mavjud emas</div>
              <button className="btn btn-primary" onClick={openCreate} style={{ fontSize: '11px' }}>BIRINCHI YOZUVNI QO'SHISH</button>
            </div>
          ) : (
            <div className="table-container" style={{ overflowX: 'auto', border: 'none' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {fields.map(f => (
                      <th key={f.name}>{f.label}</th>
                    ))}
                    <th style={{ textAlign: 'right' }}>AMALLAR</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => (
                    <tr key={item.id}>
                      {fields.map(f => (
                        <td key={f.name} style={{ textTransform: 'uppercase' }}>
                          {f.format ? f.format(item[f.name]) : item[f.name]}
                        </td>
                      ))}
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button className="btn btn-secondary btn-sm" onClick={() => openEdit(item)}>
                            Tahrir
                          </button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleDelete(item.id)}>
                            O'chirish
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {showModal && (
          <div className="modal-overlay" onClick={() => { setShowModal(false); setEditItem(null); }} style={{ backdropFilter: 'blur(4px)', background: 'rgba(0,0,0,0.6)' }}>
            <div className="modal glass-panel" style={{ maxWidth: '440px', padding: '0', background: 'var(--bg-card)' }} onClick={e => e.stopPropagation()}>
              <div className="modal-header" style={{ borderBottom: '1px solid var(--border-color)', padding: '16px 24px' }}>
                <div style={{ fontSize: '14px', fontWeight: 700 }}>{editItem ? 'Ma\'lumotni tahrirlash' : 'Yangi ma\'lumot qo\'shish'}</div>
                <button className="modal-close" onClick={() => { setShowModal(false); setEditItem(null); }}>×</button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body" style={{ padding: '24px' }}>
                  {fields.map(f => (
                    <div className="form-group" key={f.name} style={{ marginBottom: '16px' }}>
                      <label className="form-label">{f.label}</label>
                      <input 
                        className="form-input" 
                        type={f.type || 'text'} 
                        value={form[f.name]} 
                        onChange={e => setForm({...form, [f.name]: e.target.value})} 
                        required 
                        placeholder="..."
                      />
                    </div>
                  ))}
                </div>
                <div className="modal-footer" style={{ borderTop: '1px solid var(--border-color)', padding: '16px 24px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => { setShowModal(false); setEditItem(null); }}>Bekor qilish</button>
                  <button type="submit" className="btn btn-primary">{editItem ? 'Saqlash' : 'Qo\'shish'}</button>
                </div>
              </form>
            </div>
          </div>
        )}
        </div>
      </main>
    </div>
  );
}

export function PenaltiesPage() {
  return <CrudPage title="Jarimalar" apiUrl="/api/penalties" fields={[
    { name: 'reason', label: 'Sabab' },
    { name: 'amount', label: 'Summa (so\'m)', type: 'number', format: v => `${Number(v).toLocaleString()} so'm` },
  ]} />;
}

export function BonusesPage() {
  return <CrudPage title="Bonuslar" apiUrl="/api/bonuses" fields={[
    { name: 'reason', label: 'Sabab' },
    { name: 'amount', label: 'Summa (so\'m)', type: 'number', format: v => `${Number(v).toLocaleString()} so'm` },
  ]} />;
}

export function FunnelPage() {
  return <CrudPage title="Sotuv voronkasi" apiUrl="/api/funnel" fields={[
    { name: 'name', label: 'Bosqich nomi' },
  ]} />;
}
