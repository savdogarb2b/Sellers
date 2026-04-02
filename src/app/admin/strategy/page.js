'use client';
import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';

export default function StrategyPage() {
  const [strategies, setStrategies] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [plans, setPlans] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showDistributeModal, setShowDistributeModal] = useState(null);
  const [form, setForm] = useState({ targetSales: '', targetConversion: '', startDate: '', endDate: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => { 
    Promise.all([
      fetch('/api/strategy').then(r => r.ok ? r.json() : []),
      fetch('/api/employees').then(r => r.ok ? r.json() : []),
      fetch('/api/employee-plans').then(r => r.ok ? r.json() : []),
    ]).then(([s, e, p]) => {
      setStrategies(Array.isArray(s) ? s : []);
      setEmployees(Array.isArray(e) ? e : []);
      setPlans(Array.isArray(p) ? p : []);
      setLoading(false);
    }).catch(err => {
      console.error('Fetch error:', err);
      setLoading(false);
    });
  }, []);

  const handleAssignPlan = async (userId, targetSales) => {
    const { month, year } = showDistributeModal;
    await fetch('/api/employee-plans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, month, year, targetSales: targetSales || 0 })
    });
    const p = await fetch('/api/employee-plans').then(r => r.json());
    setPlans(p);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    await fetch('/api/strategy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });
    const d = await fetch('/api/strategy').then(r => r.ok ? r.json() : []);
    const p = await fetch('/api/employee-plans').then(r => r.ok ? r.json() : []);
    setStrategies(Array.isArray(d) ? d : []);
    setPlans(Array.isArray(p) ? p : []);
    setShowModal(false);
    setForm({ targetSales: '', targetConversion: '', startDate: '', endDate: '' });
  };

  const months = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'];

  return (
    <div className="app-layout">
      <Sidebar />
      <Navbar />
      <main className="main-content">
        <div className="animate-in">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div>
              <div style={{ fontSize: '16px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Sotuv Strategiyasi</div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: '4px' }}>Bashorat va KPI monitoringi</div>
            </div>
            <button className="btn btn-primary" onClick={() => setShowModal(true)} style={{ fontSize: '11px', padding: '8px 16px', fontWeight: 700 }}>
              YANGI STRATEGIYA
            </button>
          </div>

        {loading ? (
          <div className="loading-container animate-in"><div className="loading-spinner" /></div>
        ) : strategies.length === 0 ? (
          <div className="card glass-panel animate-in" style={{ padding: '60px', textAlign: 'center' }}>
            <div className="empty-state">
              <div style={{ fontSize: '14px', fontWeight: 900, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Hozircha hech qanday strategiya belgilanmagan</div>
              <button className="btn btn-primary" onClick={() => setShowModal(true)} style={{ marginTop: '20px', fontSize: '10px' }}>BIRINCHI STRATEGIYANI YARATING</button>
            </div>
          </div>
        ) : strategies.map((s, idx) => (
          <div className="animate-in" key={s.id} style={{ animationDelay: `${idx * 0.1}s` }}>
            <div className="card glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--primary-400)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>STRATEGIYA MAQSADI</div>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
                    {s.targetSales} ta sotuv
                  </div>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginTop: '4px' }}>
                    MUDDAT: {new Date(s.startDate).toLocaleDateString('uz')} — {new Date(s.endDate).toLocaleDateString('uz')}
                  </div>
                </div>
                <div style={{ textAlign: 'right', background: 'var(--bg-input)', padding: '12px 20px', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '9px', color: 'var(--accent-teal)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700, marginBottom: '2px' }}>
                    MAQSADLI KONVERSIYA
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--accent-teal)' }}>{s.targetConversion}%</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                {s.months.map((m, mIdx) => {
                  const pct = m.targetSales > 0 ? Math.round(m.actualSales / m.targetSales * 100) : 0;
                  const isCurrentMonth = new Date().getMonth() + 1 === m.month && new Date().getFullYear() === m.year;
                  
                  return (
                    <div key={m.id} className="card glass-panel" style={{
                      padding: '20px',
                      borderRadius: '16px',
                      border: isCurrentMonth ? '1px solid var(--primary-500)' : '1px solid var(--border-color)',
                      background: isCurrentMonth ? 'var(--bg-card-hover)' : 'var(--bg-card)',
                      position: 'relative',
                      overflow: 'hidden',
                      margin: 0
                    }}>
                      {isCurrentMonth && (
                        <div style={{ position: 'absolute', top: 0, right: 0, background: 'var(--primary-500)', color: '#000', fontSize: '8px', fontWeight: 800, padding: '4px 12px', borderBottomLeftRadius: '8px', textTransform: 'uppercase' }}>
                          JORIY OY
                        </div>
                      )}
                      
                      <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                         {months[m.month - 1]} {m.year}
                      </div>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', alignItems: 'flex-end' }}>
                        <span style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>BAJARILISH KO'RSATKICHI</span>
                        <span style={{ fontSize: '13px', fontWeight: 800, color: pct >= 80 ? 'var(--accent-teal)' : pct >= 50 ? 'var(--warning-500)' : 'var(--danger-500)' }}>
                          {pct}%
                        </span>
                      </div>
                      <div style={{ height: '4px', width: '100%', background: 'var(--bg-input)', borderRadius: '4px', overflow: 'hidden', marginBottom: '16px' }}>
                        <div style={{ 
                          height: '100%', 
                          width: `${Math.min(pct, 100)}%`, 
                          background: pct >= 80 ? 'var(--accent-teal)' : pct >= 50 ? 'var(--warning-500)' : 'var(--danger-500)',
                          borderRadius: '4px'
                        }} />
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                        <div>
                          <div style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '2px' }}>REJA</div>
                          <div style={{ fontWeight: 800, fontSize: '15px' }}>{m.targetSales}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '2px' }}>AMALDA</div>
                          <div style={{ fontWeight: 800, fontSize: '15px', color: pct >= 100 ? 'var(--accent-teal)' : 'var(--text-primary)' }}>{m.actualSales}</div>
                        </div>
                      </div>

                      <div style={{ 
                        margin: '0 -20px -20px -20px',
                        padding: '12px 20px',
                        background: 'var(--bg-deeper)',
                        borderTop: '1px solid var(--border-color)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <span style={{ fontSize: '9px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Talab etiladi:</span>
                        <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--primary-400)' }}>{m.requiredLeads} ta lid</span>
                      </div>
                      <button 
                        onClick={() => setShowDistributeModal({ month: m.month, year: m.year, mainTarget: m.targetSales })} 
                        className="btn btn-secondary" 
                        style={{ padding: '8px 10px', marginTop: '32px', width: '100%', justifyContent: 'center' }}>
                        Xodimlarga taqsimlash
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
        </div>

        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)} style={{ backdropFilter: 'blur(4px)', background: 'var(--bg-card)' }}>
            <div className="card glass-panel modal" style={{ maxWidth: '540px', padding: '0', background: 'var(--bg-card)', border: '1px solid var(--border-color)' }} onClick={e => e.stopPropagation()}>
              <div className="modal-header" style={{ borderBottom: '1px solid var(--border-color)', padding: '16px 24px' }}>
                <div style={{ fontSize: '14px', fontWeight: 700 }}>Yangi sotuv strategiyasi</div>
                <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
              </div>
              <form onSubmit={handleCreate}>
                <div className="modal-body" style={{ padding: '24px' }}>
                  <div className="form-row">
                    <div className="form-group" style={{ flex: 1 }}>
                      <label className="form-label">Maqsadli sotuv soni</label>
                      <input className="form-input" type="number" value={form.targetSales} onChange={e => setForm({...form, targetSales: e.target.value})} required placeholder="500" />
                    </div>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label className="form-label">Konversiya (%)</label>
                      <input className="form-input" type="number" step="0.1" value={form.targetConversion} onChange={e => setForm({...form, targetConversion: e.target.value})} required placeholder="15.5" />
                    </div>
                  </div>
                  <div className="form-row" style={{ marginTop: '16px' }}>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label className="form-label">Boshlanish sanasi</label>
                      <input className="form-input" type="date" value={form.startDate} onChange={e => setForm({...form, startDate: e.target.value})} required />
                    </div>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label className="form-label">Tugash sanasi</label>
                      <input className="form-input" type="date" value={form.endDate} onChange={e => setForm({...form, endDate: e.target.value})} required />
                    </div>
                  </div>
                </div>
                <div className="modal-footer" style={{ borderTop: '1px solid var(--border-color)', padding: '16px 24px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Bekor qilish</button>
                  <button type="submit" className="btn btn-primary">Tasdiqlash</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showDistributeModal && (
          <div className="modal-overlay" onClick={() => setShowDistributeModal(null)} style={{ backdropFilter: 'blur(4px)', background: 'var(--bg-card)', zIndex: 100 }}>
            <div className="card glass-panel modal" style={{ maxWidth: '440px', padding: '0', background: 'var(--bg-card)', border: '1px solid var(--border-color)' }} onClick={e => e.stopPropagation()}>
              <div className="modal-header" style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-color)' }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 700 }}>Sotuv rejasini taqsimlash</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>{months[showDistributeModal.month - 1]} {showDistributeModal.year} | Umumiy reja: {showDistributeModal.mainTarget}</div>
                </div>
                <button className="modal-close" onClick={() => setShowDistributeModal(null)}>×</button>
              </div>
              <div className="modal-body" style={{ padding: '24px', maxHeight: '60vh', overflowY: 'auto' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '16px' }}>Maqsadlarni kiritib Enter tugmasini bosing yoki maydondan chiqing (avtomat saqlanadi).</div>
                {employees.map(emp => {
                  const empPlan = plans.find(p => p.userId === emp.id && p.month === showDistributeModal.month && p.year === showDistributeModal.year);
                  return (
                    <div key={emp.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', background: 'var(--bg-input)', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '13px' }}>{emp.name}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Reja:</span>
                        <input 
                          type="number" 
                          className="form-input" 
                          style={{ width: '80px', textAlign: 'center', padding: '6px' }} 
                          defaultValue={empPlan?.targetSales || ''} 
                          placeholder="0"
                          title="Qiymatni kiritib Enter bosing"
                          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); e.target.blur(); } }}
                          onBlur={(e) => handleAssignPlan(emp.id, e.target.value)}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
