'use client';
import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';

export default function ReportPage() {
  const [stages, setStages] = useState([]);
  const [sources, setSources] = useState([]);
  const [reports, setReports] = useState([]);
  const [yesterdayReport, setYesterdayReport] = useState(null);
  const [form, setForm] = useState({ incomingCalls: '', outgoingCalls: '', qualityLeads: '', nonQualityLeads: '', officeVisits: '', sales: '', revenue: '' });
  const [leadStatuses, setLeadStatuses] = useState([]);
  const [sourceStatuses, setSourceStatuses] = useState([]);
  const [tab, setTab] = useState('form');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/funnel').then(r => r.json()),
      fetch('/api/reports').then(r => r.json()),
      fetch('/api/lead-sources').then(r => r.ok ? r.json() : []),
    ]).then(([s, r, src]) => {
      setStages(s);
      setReports(r);
      setSources(Array.isArray(src) ? src : []);
      setLeadStatuses(s.map(st => ({ stageId: st.id, count: '' })));
      setSourceStatuses((Array.isArray(src) ? src : []).map(sc => ({ sourceId: sc.id, count: '' })));

      const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
      const yRep = r.find(rep => new Date(rep.date).toDateString() === yesterday.toDateString());
      setYesterdayReport(yRep || null);

      setLoading(false);
    });
  }, []);

  const todayReport = reports.find(r => new Date(r.date).toDateString() === new Date().toDateString());

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validStatuses = leadStatuses.filter(ls => ls.count);
    const validSources = sourceStatuses.filter(ss => ss.count);
    await fetch('/api/reports', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, leadStatuses: validStatuses, sourceStatuses: validSources }),
    });
    setSuccess(true);
    setTimeout(() => setSuccess(false), 4000);
    setForm({ incomingCalls: '', outgoingCalls: '', qualityLeads: '', nonQualityLeads: '', officeVisits: '', sales: '', revenue: '' });
    setLeadStatuses(stages.map(st => ({ stageId: st.id, count: '' })));
    setSourceStatuses(sources.map(sc => ({ sourceId: sc.id, count: '' })));
    const r = await fetch('/api/reports'); const reps = await r.json(); setReports(reps);

    const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
    setYesterdayReport(reps.find(rep => new Date(rep.date).toDateString() === yesterday.toDateString()) || null);
  };

  const updateLeadStatus = (i, count) => { const nls = [...leadStatuses]; nls[i].count = count; setLeadStatuses(nls); };
  const updateSourceStatus = (i, count) => { const nss = [...sourceStatuses]; nss[i].count = count; setSourceStatuses(nss); };

  return (
    <div className="app-layout">
      <Sidebar />
      <Navbar />
      <main className="main-content">
        <div className="animate-in">
          {todayReport && (
            <div style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.1)', borderRadius: '16px', padding: '12px 16px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontWeight: 800, color: 'var(--accent-teal)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Bugungi hisobot yuborilgan!</span>
              <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Qo'ng'iroqlar: {todayReport.totalCalls} ta • Sifatli lidlar: {todayReport.qualityLeads} ta</span>
            </div>
          )}

          <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', background: 'var(--bg-elevated)', padding: '6px', borderRadius: '14px', width: 'fit-content' }}>
            <button className={`btn ${tab === 'form' ? 'btn-primary' : 'btn-secondary'}`} style={{ border: 'none', borderRadius: '10px', fontSize: '10px' }} onClick={() => setTab('form')}>HISOBOT YOZISH</button>
            <button className={`btn ${tab === 'history' ? 'btn-secondary' : 'btn-secondary'}`} style={{ border: tab === 'history' ? '1px solid var(--primary-500)' : 'none', borderRadius: '10px', fontSize: '10px' }} onClick={() => setTab('history')}>TARIX ({reports.length})</button>
          </div>

          {tab === 'form' ? (
            <div className="animate-in" style={{ maxWidth: '900px' }}>
              <div className="card glass-panel" style={{ padding: '28px' }}>
                {success && (
                  <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '12px', padding: '14px', marginBottom: '20px', color: 'var(--accent-teal)', textAlign: 'center', fontWeight: 800, fontSize: '13px', textTransform: 'uppercase' }}>
                     HISOBOT QABUL QILINDI
                  </div>
                )}
                {todayReport ? (
                  <div className="empty-state" style={{ padding: '60px' }}>
                    <div className="empty-state-text" style={{ fontSize: '18px', fontWeight: 900, textTransform: 'uppercase' }}>Hisobot yuborilgan</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '8px' }}>Ertaga yangi natijalarni kutamiz.</div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit}>
                    <div style={{ fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--primary-400)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '16px' }}>📊</span> Kunlik Voronka
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '16px' }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase' }}>1. Kiruvchi qo'ng'iroq</label>
                        <input className="form-input" type="number" value={form.incomingCalls} onChange={e => setForm({...form, incomingCalls: e.target.value})} placeholder="0" min="0" required />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase' }}>2. Zadacha</label>
                        <input className="form-input" type="number" value={form.outgoingCalls} onChange={e => setForm({...form, outgoingCalls: e.target.value})} placeholder="0" min="0" required />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase' }}>3. Yangi lidlar</label>
                        <input className="form-input" type="number" value={form.officeVisits} onChange={e => setForm({...form, officeVisits: e.target.value})} placeholder="0" min="0" required />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '20px' }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase' }}>4. Sifatli lidlar</label>
                        <input className="form-input" type="number" value={form.qualityLeads} onChange={e => setForm({...form, qualityLeads: e.target.value})} placeholder="0" min="0" required />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase' }}>5. Sifatsiz lidlar</label>
                        <input className="form-input" type="number" value={form.nonQualityLeads} onChange={e => setForm({...form, nonQualityLeads: e.target.value})} placeholder="0" min="0" required />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase' }}>6. Sotib olganlar</label>
                        <input className="form-input" type="number" value={form.sales} onChange={e => setForm({...form, sales: e.target.value})} placeholder="0" min="0" required />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase' }}>7. Summa (UZS)</label>
                        <input className="form-input" type="number" value={form.revenue} onChange={e => setForm({...form, revenue: e.target.value})} placeholder="0" min="0" required />
                      </div>
                    </div>

                    {sources.length > 0 && (
                      <div style={{ background: 'rgba(16,185,129,0.03)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: '14px', padding: '20px', marginBottom: '20px' }}>
                        <div style={{ fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', color: '#10b981', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px', letterSpacing: '1px' }}>
                          <span style={{ fontSize: '16px' }}>📣</span> Lid Manbalari
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '12px' }}>
                          {sources.map((s, i) => (
                            <div className="form-group" key={s.id} style={{ marginBottom: 0 }}>
                              <label className="form-label" style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase' }}>{s.icon || '📱'} {s.name}</label>
                              <input className="form-input" type="number" value={sourceStatuses[i]?.count || ''} onChange={e => updateSourceStatus(i, e.target.value)} placeholder="0" min="0" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {stages.length > 0 && (
                      <div style={{ background: 'var(--bg-card-hover)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '20px', marginBottom: '20px' }}>
                        <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '14px' }}>Qo'shimcha voronka bosqichlari</div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '12px' }}>
                          {stages.map((s, i) => (
                            <div className="form-group" key={s.id} style={{ marginBottom: 0 }}>
                              <label className="form-label" style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase' }}>{s.name}</label>
                              <input className="form-input" type="number" value={leadStatuses[i]?.count || ''} onChange={e => updateLeadStatus(i, e.target.value)} placeholder="0" min="0" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '8px', fontSize: '12px', padding: '16px' }}>
                      HISOBOTNI YUBORISH
                    </button>
                  </form>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '20px' }}>
                {yesterdayReport ? (
                  <div className="card glass-panel" style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <div style={{ fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Kechagi natijalar</div>
                      <span style={{ fontSize: '10px', fontWeight: 900, color: 'var(--text-muted)', background: 'var(--bg-elevated)', padding: '4px 8px', borderRadius: '4px' }}>KECHA</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div style={{ padding: '12px', background: 'var(--bg-elevated)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                        <div style={{ fontSize: '20px', fontWeight: 900 }}>{yesterdayReport.totalCalls}</div>
                        <div style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', marginTop: '2px' }}>Jami qo'ng'iroq</div>
                      </div>
                      <div style={{ padding: '12px', background: 'rgba(25, 255, 178, 0.03)', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.05)' }}>
                        <div style={{ fontSize: '20px', fontWeight: 900, color: 'var(--accent-teal)' }}>{yesterdayReport.sales}</div>
                        <div style={{ fontSize: '9px', color: 'var(--accent-teal)', fontWeight: 800, textTransform: 'uppercase', marginTop: '2px' }}>Sotuvlar</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'var(--bg-elevated)', borderRadius: '12px', border: '1px solid var(--border)', marginTop: '12px' }}>
                      <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Umumiy tushum</span>
                      <span style={{ fontSize: '12px', fontWeight: 900, color: 'var(--primary-400)' }}>{(yesterdayReport.revenue || 0).toLocaleString()} UZS</span>
                    </div>
                  </div>
                ) : (
                  <div className="card glass-panel" style={{ padding: '20px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', marginBottom: '8px' }}>Kechagi ma'lumotlar</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Kechagi hisobot topilmadi</div>
                  </div>
                )}

                {reports.length > 0 ? (
                  <div className="card glass-panel" style={{ padding: '20px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '16px' }}>Haftalik o'rtacha</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      {(() => {
                        const week = reports.slice(0, 7);
                        const avgCalls = Math.round(week.reduce((s, r) => s + r.totalCalls, 0) / week.length);
                        return <>
                          <div style={{ padding: '12px', background: 'var(--bg-elevated)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                            <div style={{ fontSize: '20px', fontWeight: 900 }}>{avgCalls}</div>
                            <div style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', marginTop: '2px' }}>O'rtacha aloqa</div>
                          </div>
                          <div style={{ padding: '12px', background: 'var(--bg-elevated)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                            <div style={{ fontSize: '20px', fontWeight: 900, color: 'var(--accent-teal)' }}>{Math.round(week.reduce((s, r) => s + r.sales, 0) / week.length)}</div>
                            <div style={{ fontSize: '9px', color: 'var(--accent-teal)', fontWeight: 800, textTransform: 'uppercase', marginTop: '2px' }}>O'rtacha sotuv</div>
                          </div>
                        </>;
                      })()}
                    </div>
                  </div>
                ) : <div />}
              </div>
            </div>
          ) : (
            <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {reports.length === 0 ? (
                <div className="card glass-panel" style={{ padding: '40px', textAlign: 'center' }}>
                  <div className="empty-state-text">Hali hech qanday hisobotingiz yo'q</div>
                </div>
              ) : reports.map(r => (
                <div key={r.id} className="card glass-panel" style={{ padding: '16px 24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '14px', textTransform: 'uppercase' }}>
                       {new Date(r.date).toLocaleDateString('uz-UZ', { weekday: 'long', month: 'long', day: 'numeric' })}
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span style={{ fontSize: '10px', fontWeight: 900, padding: '4px 8px', borderRadius: '4px', background: 'var(--bg-elevated)', border: '1px solid var(--border-color)' }}>{r.totalCalls} ALOQA</span>
                      <span style={{ fontSize: '10px', fontWeight: 900, padding: '4px 8px', borderRadius: '4px', background: 'rgba(56, 189, 248, 0.1)', color: 'var(--accent-blue)' }}>{r.officeVisits} KELDI</span>
                      <span style={{ fontSize: '10px', fontWeight: 900, padding: '4px 8px', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--accent-teal)' }}>{r.sales} TASDIQ • {(r.revenue || 0).toLocaleString()} UZS</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '16px', marginTop: '12px', fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>
                    <span>SIFATLI LID: {r.qualityLeads}</span>
                    <span>SIFATSIZ LID: {r.nonQualityLeads}</span>
                    {r.leadStatuses?.length > 0 && r.leadStatuses.map(ls => (
                      <span key={ls.id} style={{ textTransform: 'uppercase' }}>{ls.stage?.name}: {ls.count}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
