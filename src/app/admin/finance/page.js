'use client';
import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';

export default function FinancePage() {
  const [activeTab, setActiveTab] = useState('assign');
  const [templateTab, setTemplateTab] = useState('penalties');
  const [assignTab, setAssignTab] = useState('penalty');

  const [penalties, setPenalties] = useState([]);
  const [bonuses, setBonuses] = useState([]);
  const [newTemplate, setNewTemplate] = useState({ reason: '', amount: '' });

  const [employees, setEmployees] = useState([]);
  const [penaltyRecords, setPenaltyRecords] = useState([]);
  const [bonusRecords, setBonusRecords] = useState([]);
  const [assignForm, setAssignForm] = useState({ userId: '', templateId: '', reason: '', amount: '' });

  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    const [e, p, b, pr, br] = await Promise.all([
      fetch('/api/employees').then(r => r.json()),
      fetch('/api/penalties').then(r => r.json()),
      fetch('/api/bonuses').then(r => r.json()),
      fetch('/api/penalty-records').then(r => r.json()),
      fetch('/api/bonus-records').then(r => r.json()),
    ]);
    setEmployees(e); setPenalties(p); setBonuses(b);
    setPenaltyRecords(pr); setBonusRecords(br);
    setLoading(false);
  };

  const handleAddTemplate = async (e) => {
    e.preventDefault();
    const url = templateTab === 'penalties' ? '/api/penalties' : '/api/bonuses';
    await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newTemplate) });
    setNewTemplate({ reason: '', amount: '' });
    fetchAll();
  };

  const handleDeleteTemplate = async (id) => {
    const url = templateTab === 'penalties' ? `/api/penalties?id=${id}` : `/api/bonuses?id=${id}`;
    await fetch(url, { method: 'DELETE' });
    fetchAll();
  };

  const handleTemplateSelect = (id) => {
    const templates = assignTab === 'penalty' ? penalties : bonuses;
    const t = templates.find(t => t.id === id);
    if (t) setAssignForm({ ...assignForm, templateId: id, reason: t.reason, amount: t.amount.toString() });
    else setAssignForm({ ...assignForm, templateId: id });
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    const url = assignTab === 'penalty' ? '/api/penalty-records' : '/api/bonus-records';
    const body = {
      userId: assignForm.userId,
      reason: assignForm.reason,
      amount: assignForm.amount,
      [assignTab === 'penalty' ? 'penaltyId' : 'bonusId']: assignForm.templateId || null,
    };
    await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    setAssignForm({ userId: '', templateId: '', reason: '', amount: '' });
    fetchAll();
  };

  const currentTemplates = templateTab === 'penalties' ? penalties : bonuses;
  const records = assignTab === 'penalty' ? penaltyRecords : bonusRecords;

  return (
    <div className="app-layout">
      <Sidebar />
      <Navbar />
      <main className="main-content">
        <div className="animate-in">
          <div className="finance-tabs" style={{ marginBottom: '24px' }}>
            <button className={`finance-tab ${activeTab === 'assign' ? 'active' : ''}`} onClick={() => setActiveTab('assign')}>
              BERISH VA TARIX
            </button>
            <button className={`finance-tab ${activeTab === 'templates' ? 'active' : ''}`} onClick={() => setActiveTab('templates')}>
              SHABLONLAR
            </button>
          </div>

          {loading ? (
            <div className="loading-container"><div className="loading-spinner" /></div>
          ) : activeTab === 'assign' ? (
            <div className="animate-in">
              <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', padding: '6px', borderRadius: '12px', width: 'fit-content' }}>
                <button className={`btn ${assignTab === 'penalty' ? 'btn-danger' : 'btn-secondary'}`} style={{ border: 'none', borderRadius: '8px', fontSize: '11px', padding: '6px 12px' }} onClick={() => setAssignTab('penalty')}>
                  Jarimalar
                </button>
                <button className={`btn ${assignTab === 'bonus' ? 'btn-primary' : 'btn-secondary'}`} style={{ border: 'none', borderRadius: '8px', fontSize: '11px', padding: '6px 12px' }} onClick={() => setAssignTab('bonus')}>
                  Bonuslar
                </button>
              </div>

              <div className="grid-2">
                <div className="card glass-panel" style={{ height: 'fit-content', padding: '24px' }}>
                  <div style={{ fontSize: '16px', fontWeight: 800, marginBottom: '20px', color: assignTab === 'penalty' ? 'var(--danger-500)' : 'var(--accent-teal)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {assignTab === 'penalty' ? 'Jarima yozish' : 'Bonus belgilash'}
                  </div>
                  <form onSubmit={handleAssign}>
                    <div className="form-group">
                      <label className="form-label">Xodim</label>
                      <select className="form-input" value={assignForm.userId} onChange={e => setAssignForm({ ...assignForm, userId: e.target.value })} required>
                        <option value="">Xodimni tanlang...</option>
                        {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Shablon (ixtiyoriy)</label>
                      <select className="form-input" value={assignForm.templateId} onChange={e => handleTemplateSelect(e.target.value)}>
                        <option value="">Shablondan tanlang...</option>
                        {(assignTab === 'penalty' ? penalties : bonuses).map(t => <option key={t.id} value={t.id}>{t.reason} — {t.amount.toLocaleString()} so'm</option>)}
                      </select>
                    </div>
                    <div className="form-group"><label className="form-label">Sabab</label><input className="form-input" value={assignForm.reason} onChange={e => setAssignForm({ ...assignForm, reason: e.target.value })} required placeholder="..." /></div>
                    <div className="form-group"><label className="form-label">Summa (so'm)</label><input className="form-input" type="number" value={assignForm.amount} onChange={e => setAssignForm({ ...assignForm, amount: e.target.value })} required placeholder="0" /></div>
                    <button type="submit" className={`btn ${assignTab === 'penalty' ? 'btn-danger' : 'btn-primary'}`} style={{ width: '100%', justifyContent: 'center', marginTop: '12px' }}>
                      {assignTab === 'penalty' ? 'Jarima yozish' : 'Bonus berish'}
                    </button>
                  </form>
                </div>

                <div className="card glass-panel" style={{ padding: '24px' }}>
                  <div style={{ fontSize: '16px', fontWeight: 800, marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Oxirgi amallar</div>
                  {records.length === 0 ? (
                    <div className="empty-state" style={{ padding: '40px' }}><div className="empty-state-text">Hozircha tarix yo'q</div></div>
                  ) : (
                    <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
                      {records.slice(0, 50).map((r, i) => (
                        <div key={r.id} className="animate-in" style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center', 
                          padding: '16px', 
                          borderRadius: '8px',
                          background: 'var(--bg-input)',
                          border: '1px solid var(--border-subtle)',
                          marginBottom: '8px',
                          animationDelay: `${i * 0.05}s`
                        }}>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)' }}>{r.user?.name}</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>{new Date(r.date).toLocaleString('uz')} — <span style={{ color: 'var(--text-primary)' }}>{r.reason}</span></div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontWeight: 800, fontSize: '16px', color: assignTab === 'penalty' ? 'var(--danger-500)' : 'var(--accent-teal)' }}>
                              {assignTab === 'penalty' ? '-' : '+'}{r.amount.toLocaleString()} <span style={{ fontSize: '10px' }}>so'm</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="animate-in">
              <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', padding: '6px', borderRadius: '12px', width: 'fit-content' }}>
                <button className={`btn ${templateTab === 'penalties' ? 'btn-danger' : 'btn-secondary'}`} style={{ border: 'none', borderRadius: '8px', fontSize: '11px', padding: '6px 12px' }} onClick={() => setTemplateTab('penalties')}>
                  Jarima shablonlari
                </button>
                <button className={`btn ${templateTab === 'bonuses' ? 'btn-primary' : 'btn-secondary'}`} style={{ border: 'none', borderRadius: '8px', fontSize: '11px', padding: '6px 12px' }} onClick={() => setTemplateTab('bonuses')}>
                  Bonus shablonlari
                </button>
              </div>

              <div className="grid-2">
                <div className="card glass-panel" style={{ height: 'fit-content', padding: '24px' }}>
                  <div style={{ fontSize: '16px', fontWeight: 800, marginBottom: '20px', color: templateTab === 'penalties' ? 'var(--danger-500)' : 'var(--accent-teal)', textTransform: 'uppercase' }}>
                    {templateTab === 'penalties' ? 'Yangi Jarima shabloni' : 'Yangi Bonus shabloni'}
                  </div>
                  <form onSubmit={handleAddTemplate}>
                    <div className="form-group">
                      <label className="form-label">Nomi / Sababi</label>
                      <input className="form-input" value={newTemplate.reason} onChange={e => setNewTemplate({ ...newTemplate, reason: e.target.value })} required placeholder={templateTab === 'penalties' ? 'Kechikish...' : 'Sotuv rekordi...'} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Summa (so'm)</label>
                      <input className="form-input" type="number" value={newTemplate.amount} onChange={e => setNewTemplate({ ...newTemplate, amount: e.target.value })} required placeholder="50000" />
                    </div>
                    <button type="submit" className={`btn ${templateTab === 'penalties' ? 'btn-danger' : 'btn-primary'}`} style={{ width: '100%', justifyContent: 'center', marginTop: '12px' }}>
                      Shablon qo'shish
                    </button>
                  </form>
                </div>

                <div className="card glass-panel" style={{ padding: '24px' }}>
                  <div style={{ fontSize: '16px', fontWeight: 800, marginBottom: '20px', textTransform: 'uppercase' }}>Mavjud shablonlar</div>
                  {currentTemplates.length === 0 ? (
                    <div className="empty-state" style={{ padding: '40px' }}><div className="empty-state-text">Hech qanday shablon yo'q</div></div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
                      {currentTemplates.map((t, i) => (
                        <div key={t.id} className="animate-in" style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center', 
                          padding: '12px 16px', 
                          borderRadius: '8px',
                          background: 'var(--bg-input)',
                          border: '1px solid var(--border-subtle)',
                          animationDelay: `${i * 0.05}s`
                        }}>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-primary)' }}>{t.reason}</div>
                            <div style={{ fontSize: '11px', color: templateTab === 'penalties' ? 'var(--danger-500)' : 'var(--accent-teal)', fontWeight: 700, marginTop: '2px' }}>
                              {t.amount.toLocaleString()} so'm
                            </div>
                          </div>
                          <button className="btn btn-danger btn-sm" style={{ padding: '6px 10px', fontSize: '10px' }} onClick={() => handleDeleteTemplate(t.id)}>O'chirish</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
