'use client';
import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';

export default function AssignPage() {
  const [employees, setEmployees] = useState([]);
  const [penalties, setPenalties] = useState([]);
  const [bonuses, setBonuses] = useState([]);
  const [penaltyRecords, setPenaltyRecords] = useState([]);
  const [bonusRecords, setBonusRecords] = useState([]);
  const [tab, setTab] = useState('penalty');
  const [form, setForm] = useState({ userId: '', templateId: '', reason: '', amount: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/employees').then(r => r.json()),
      fetch('/api/penalties').then(r => r.json()),
      fetch('/api/bonuses').then(r => r.json()),
      fetch('/api/penalty-records').then(r => r.json()),
      fetch('/api/bonus-records').then(r => r.json()),
    ]).then(([e, p, b, pr, br]) => { 
      setEmployees(e); setPenalties(p); setBonuses(b); setPenaltyRecords(pr); setBonusRecords(br); 
      setLoading(false);
    });
  }, []);

  const templates = tab === 'penalty' ? penalties : bonuses;

  const handleTemplateSelect = (id) => {
    const t = templates.find(t => t.id === id);
    if (t) setForm({ ...form, templateId: id, reason: t.reason, amount: t.amount.toString() });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = tab === 'penalty' ? '/api/penalty-records' : '/api/bonus-records';
    const body = { userId: form.userId, reason: form.reason, amount: form.amount, [tab === 'penalty' ? 'penaltyId' : 'bonusId']: form.templateId || null };
    await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    setForm({ userId: '', templateId: '', reason: '', amount: '' });
    
    const [pr, br] = await Promise.all([fetch('/api/penalty-records').then(r => r.json()), fetch('/api/bonus-records').then(r => r.json())]);
    setPenaltyRecords(pr); setBonusRecords(br);
  };

  const records = tab === 'penalty' ? penaltyRecords : bonusRecords;

  if (loading) return <div className="app-layout"><Sidebar /><Navbar /><main className="main-content"><div className="loading-container"><div className="loading-spinner" /></div></main></div>;

  return (
    <div className="app-layout">
      <Sidebar />
      <Navbar />
      <main className="main-content">
        <div className="animate-in">
          <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', background: 'rgba(255,255,255,0.03)', padding: '6px', borderRadius: '14px', width: 'fit-content' }}>
            <button className={`btn ${tab === 'penalty' ? 'btn-danger' : 'btn-secondary'}`} style={{ border: 'none', borderRadius: '10px' }} onClick={() => setTab('penalty')}>
               Jarimalar
            </button>
            <button className={`btn ${tab === 'bonus' ? 'btn-primary' : 'btn-secondary'}`} style={{ border: 'none', borderRadius: '10px' }} onClick={() => setTab('bonus')}>
               Bonuslar
            </button>
          </div>

          <div className="grid-2">
            <div className="card glass-panel" style={{ height: 'fit-content' }}>
              <div style={{ fontSize: '18px', fontWeight: 800, marginBottom: '20px', color: tab === 'penalty' ? 'var(--danger-400)' : 'var(--accent-teal)' }}>
                {tab === 'penalty' ? '🚫 Jarima yozish' : '✨ Bonus belgilash'}
              </div>
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label">Xodim *</label>
                  <select className="form-input" value={form.userId} onChange={e => setForm({...form, userId: e.target.value})} required style={{ background: 'rgba(0,0,0,0.2)' }}>
                    <option value="" style={{background:'#0f172a'}}>Xodimni tanlang...</option>
                    {employees.map(e => <option key={e.id} value={e.id} style={{background:'#0f172a'}}>{e.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Shablon</label>
                  <select className="form-input" value={form.templateId} onChange={e => handleTemplateSelect(e.target.value)} style={{ background: 'rgba(0,0,0,0.2)' }}>
                    <option value="" style={{background:'#0f172a'}}>Shablondan tanlang...</option>
                    {templates.map(t => <option key={t.id} value={t.id} style={{background:'#0f172a'}}>{t.reason} ({t.amount.toLocaleString()} so'm)</option>)}
                  </select>
                </div>
                <div className="form-group"><label className="form-label">Sabab *</label><input className="form-input" value={form.reason} onChange={e => setForm({...form, reason: e.target.value})} required placeholder="Asoslantirilgan sabab..." /></div>
                <div className="form-group"><label className="form-label">Summa (so'm) *</label><input className="form-input" type="number" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} required placeholder="Summani kiriting..." /></div>
                <button type="submit" className={`btn ${tab === 'penalty' ? 'btn-danger' : 'btn-primary'}`} style={{ width: '100%', justifyContent: 'center', marginTop: '12px' }}>
                  {tab === 'penalty' ? 'Tasdiqlash va Jarima yozish' : 'Tasdiqlash va Bonus berish'}
                </button>
              </form>
            </div>

            <div className="card glass-panel">
              <div style={{ fontSize: '18px', fontWeight: 800, marginBottom: '20px' }}>📜 Oxirgi amallar</div>
              {records.length === 0 ? (
                <div className="empty-state" style={{ padding: '40px' }}><div className="empty-state-text">Hozircha tarix yo'q</div></div>
              ) : (
                <div style={{ maxHeight: '600px', overflowY: 'auto', paddingRight: '8px' }}>
                  {records.map((r, i) => (
                    <div key={r.id} className="animate-in" style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      padding: '16px', 
                      borderRadius: '12px',
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.05)',
                      marginBottom: '12px',
                      animationDelay: `${i * 0.05}s`
                    }}>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '14px', color: 'var(--text-primary)' }}>{r.user?.name}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>{r.reason}</div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{new Date(r.date).toLocaleDateString('uz')}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontWeight: 900, fontSize: '16px', color: tab === 'penalty' ? 'var(--danger-500)' : 'var(--accent-teal)' }}>
                          {tab === 'penalty' ? '-' : '+'}{r.amount.toLocaleString()}
                        </span>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>so'm</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
