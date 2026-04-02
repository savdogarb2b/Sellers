'use client';
import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';

const emptyForm = {
  name: '', fixedSalary: '', workStartTime: '09:00', workEndTime: '18:00',
  latenessThreshold: '15', latenessPenalty: '50000'
};

export default function EmployeesPage() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editEmp, setEditEmp] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [kpis, setKpis] = useState([{ name: '', targetValue: '' }]);
  const [saving, setSaving] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [showCredentials, setShowCredentials] = useState(null);

  useEffect(() => { fetchData(); }, []);
  const fetchData = async () => { const r = await fetch('/api/employees'); setEmployees(await r.json()); setLoading(false); };

  const openCreate = () => { setEditEmp(null); setForm(emptyForm); setKpis([{ name: '', targetValue: '' }]); setShowModal(true); };
  const openEdit = (emp, e) => {
    e.stopPropagation();
    setEditEmp(emp);
    setForm({
      name: emp.name, fixedSalary: emp.fixedSalary || '',
      workStartTime: emp.workStartTime || '09:00', workEndTime: emp.workEndTime || '18:00',
      latenessThreshold: emp.latenessThreshold || '15', latenessPenalty: emp.latenessPenalty || '50000'
    });
    setKpis(emp.kpis?.length > 0 ? emp.kpis.map(k => ({ name: k.name, targetValue: k.targetValue })) : [{ name: '', targetValue: '' }]);
    setShowModal(true);
  };

  const addKpi = () => setKpis([...kpis, { name: '', targetValue: '' }]);
  const removeKpi = (i) => setKpis(kpis.filter((_, idx) => idx !== i));
  const updateKpi = (i, field, val) => {
    const next = [...kpis];
    next[i][field] = val;
    setKpis(next);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const body = { ...form, kpis: kpis.filter(k => k.name && k.targetValue) };
    const method = editEmp ? 'PUT' : 'POST';
    const res = await fetch('/api/employees', { 
      method, 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify(editEmp ? { ...body, id: editEmp.id } : body) 
    });
    const result = await res.json();
    setSaving(false);
    setShowModal(false);
    if (!editEmp && result.generatedCredentials) setShowCredentials({ login: result.generatedCredentials.login, password: result.generatedCredentials.password, empName: body.name });
    fetchData();
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (confirm('Xodimni o\'chirmoqchimisiz?')) { await fetch(`/api/employees?id=${id}`, { method: 'DELETE' }); fetchData(); }
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <Navbar />
      <main className="main-content">
        <div className="animate-in">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div>
              <div style={{ fontSize: '16px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Xodimlar Boshqaruvi</div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: '4px' }}>Shtat va KPI parametrlarini sozlash</div>
            </div>
            <button className="btn btn-primary" onClick={openCreate} style={{ fontSize: '11px', padding: '8px 16px', fontWeight: 700 }}>
              YANGI XODIM QO'SHISH
            </button>
          </div>

          {loading ? (
            <div className="loading-container"><div className="loading-spinner" /></div>
          ) : employees.length === 0 ? (
            <div className="card glass-panel animate-in" style={{ padding: '60px', textAlign: 'center' }}>
              <div className="empty-state">
                <div style={{ fontSize: '14px', fontWeight: 900, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Hech qanday xodim mavjud emas</div>
                <button className="btn btn-primary" onClick={openCreate} style={{ marginTop: '20px', fontSize: '10px' }}>BIRINCHI XODIMNI YARATING</button>
              </div>
            </div>
          ) : (
            <div className="employee-grid">
              {employees.map((emp, i) => {
                const totalPen = emp.penaltyRecords?.reduce((s, r) => s + r.amount, 0) || 0;
                const totalBon = emp.bonusRecords?.reduce((s, r) => s + r.amount, 0) || 0;
                const kpiAvg = emp.kpis?.length > 0
                  ? Math.round(emp.kpis.reduce((s, k) => s + (k.targetValue > 0 ? (k.currentValue || 0) / k.targetValue * 100 : 0), 0) / emp.kpis.length)
                  : 0;

                let streak = 0;
                const empSales = emp.dailyReports?.reduce((s, r) => s + (r.sales || 0), 0) || 0;
                const empTotalLeads = emp.dailyReports?.reduce((s, r) => s + (r.leadStatuses ? r.leadStatuses.reduce((acc, ls) => acc + (ls.count || 0), 0) : 0), 0) || 0;
                const empConv = empTotalLeads > 0 ? Math.round((empSales / empTotalLeads) * 100) : 0;
                
                if (emp.dailyReports && emp.dailyReports.length > 0) {
                  const sorted = [...emp.dailyReports].sort((a,b) => new Date(b.date) - new Date(a.date));
                  let currentDate = new Date(); currentDate.setHours(0,0,0,0);
                  for (let i=0; i<30; i++) {
                    const d = new Date(currentDate); d.setDate(d.getDate() - i);
                    const dayStr = d.toDateString();
                    const rep = sorted.find(r => new Date(r.date).toDateString() === dayStr);
                    if (rep && rep.sales > 0) { streak++; }
                    else if (i === 0 && (!rep || rep.sales === 0)) { continue; }
                    else { break; }
                  }
                }

                const isOpen = selectedEmp === emp.id;
                
                return (
                  <div key={emp.id} className="employee-card card glass-panel" onClick={() => setSelectedEmp(isOpen ? null : emp.id)} 
                    style={{ 
                      padding: '16px',
                      marginBottom: '0',
                      animationDelay: `${i * 0.05}s`,
                      border: isOpen ? '1px solid var(--primary-500)' : '1px solid var(--border-color)',
                      background: isOpen ? 'var(--bg-card-hover)' : 'var(--bg-card)',
                      cursor: 'pointer',
                    }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '16px' }}>
                       <div className="employee-avatar" style={{ background: 'var(--primary-500)', color: '#000', fontWeight: 800, width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}>{emp.name?.charAt(0)}</div>
                       <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '14px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {emp.name}
                            {streak >= 3 && <span style={{ fontSize: '12px' }} title={`${streak} kun streak`}>🔥</span>}
                            {empConv >= 20 && empSales >= 5 && <span style={{ fontSize: '12px' }} title="Usta Konversiya">💎</span>}
                          </div>
                          <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600 }}>{emp.role || 'SOTUVCHI'}</div>
                       </div>
                       <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '16px', fontWeight: 800, color: kpiAvg >= 80 ? 'var(--accent-teal)' : kpiAvg >= 50 ? 'var(--primary-500)' : 'var(--danger-500)' }}>{kpiAvg}%</div>
                          <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>KPI</div>
                       </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: isOpen ? '16px' : '0' }}>
                       <div style={{ padding: '10px', background: 'var(--bg-input)', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                          <div style={{ fontSize: '9px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '2px' }}>Bonuslar</div>
                          <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--accent-teal)' }}>+{totalBon.toLocaleString()}</div>
                       </div>
                       <div style={{ padding: '10px', background: 'var(--bg-input)', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                          <div style={{ fontSize: '9px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '2px' }}>Jarimalar</div>
                          <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--danger-500)' }}>-{totalPen.toLocaleString()}</div>
                       </div>
                    </div>

                    {isOpen && (
                      <div className="animate-in" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <button className="btn btn-secondary btn-sm" style={{ flex: '1 1 calc(50% - 4px)' }} onClick={(e) => openEdit(emp, e)}>Tahrirlash</button>
                        <button className="btn btn-secondary btn-sm" style={{ flex: '1 1 calc(50% - 4px)' }} onClick={(e) => {
                          e.stopPropagation();
                          if(confirm('Foydalanuvchi parolini yangilashni xohlaysizmi?')) {
                            fetch('/api/employees/reset-password', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ id: emp.id })
                            })
                            .then(r => r.json())
                            .then(res => {
                              if(res.success) {
                                setShowCredentials({ login: res.login, password: res.newPassword, empName: res.empName });
                              } else {
                                alert(res.error || 'Qandaydir xatolik yuz berdi');
                              }
                            });
                          }
                        }}>
                          Parolni Yangilash
                        </button>
                        <button className="btn btn-danger btn-sm" style={{ flex: '1 1 100%' }} onClick={(e) => handleDelete(emp.id, e)}>O'chirish</button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {showModal && (
          <div className="modal-overlay" style={{ backdropFilter: 'blur(4px)', background: 'var(--bg-card)' }}>
            <div className="card glass-panel modal" style={{ maxWidth: '540px', padding: '0', background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
              <div className="modal-header" style={{ borderBottom: '1px solid var(--border-color)', padding: '16px 24px' }}>
                <div style={{ fontSize: '14px', fontWeight: 700 }}>{editEmp ? 'Xodimni tahrirlash' : 'Yangi xodim qo\'shish'}</div>
                <button type="button" className="modal-close" onClick={() => setShowModal(false)}>×</button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body" style={{ padding: '24px' }}>
                  <div className="form-group">
                    <label className="form-label">To'liq ism</label>
                    <input className="form-input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required placeholder="To'liq ism" />
                  </div>
                  <div className="form-row" style={{ marginTop: '16px' }}>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label className="form-label">Fiksal maosh (so'm)</label>
                      <input className="form-input" type="number" value={form.fixedSalary} onChange={e => setForm({...form, fixedSalary: e.target.value})} placeholder="3000000" />
                    </div>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label className="form-label">Kechikish jarimasi</label>
                      <input className="form-input" type="number" value={form.latenessPenalty} onChange={e => setForm({...form, latenessPenalty: e.target.value})} placeholder="50000" />
                    </div>
                  </div>
                  <div className="form-row" style={{ marginTop: '16px' }}>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label className="form-label">Ish vaqti (boshlash)</label>
                      <input className="form-input" type="time" value={form.workStartTime} onChange={e => setForm({...form, workStartTime: e.target.value})} />
                    </div>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label className="form-label">Ish vaqti (tugash)</label>
                      <input className="form-input" type="time" value={form.workEndTime} onChange={e => setForm({...form, workEndTime: e.target.value})} />
                    </div>
                  </div>
                  
                  <div style={{ marginTop: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>KPI Ko'rsatkichlari</div>
                      <button type="button" className="btn btn-secondary btn-sm" onClick={addKpi}>+ KPI</button>
                    </div>
                    {kpis.map((k, i) => (
                      <div key={i} className="form-row" style={{ marginBottom: '12px', alignItems: 'flex-end', gap: '12px' }}>
                        <div style={{ flex: 2 }}>
                           <label className="form-label">Nomi</label>
                           <input className="form-input" placeholder="..." value={k.name} onChange={e => updateKpi(i, 'name', e.target.value)} />
                        </div>
                        <div style={{ flex: 1 }}>
                           <label className="form-label">Maqsad</label>
                           <input className="form-input" type="number" placeholder="50" value={k.targetValue} onChange={e => updateKpi(i, 'targetValue', e.target.value)} />
                        </div>
                        <button type="button" className="btn btn-danger" onClick={() => removeKpi(i)}>O'chirish</button>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="modal-footer" style={{ borderTop: '1px solid var(--border-color)', padding: '16px 24px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                   <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Bekor qilish</button>
                   <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saqlanmoqda...' : 'Saqlash'}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showCredentials && (
          <div className="modal-overlay" style={{ backdropFilter: 'blur(4px)', background: 'var(--bg-card)' }}>
             <div className="card glass-panel modal" style={{ maxWidth: '440px', padding: '0', background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                <div className="modal-header" style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-color)' }}>
                   <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>Kirish ma'lumotlari</div>
                </div>
                <div className="modal-body" style={{ padding: '24px' }}>
                   <div style={{ padding: '16px', background: 'var(--bg-input)', borderRadius: '8px', border: '1px solid var(--border-subtle)', marginBottom: '16px' }}>
                      <div style={{ marginBottom: '16px' }}>
                         <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Xodim</div>
                         <div style={{ fontSize: '14px', fontWeight: 700 }}>{showCredentials.empName}</div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
                         <div>
                            <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Login / Email</div>
                            <div style={{ fontSize: '14px', fontWeight: 700, letterSpacing: '0.5px', background: 'var(--bg-deeper)', padding: '10px', borderRadius: '6px' }}>{showCredentials.login}</div>
                         </div>
                         <div>
                            <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Parol</div>
                            <div style={{ fontSize: '14px', fontWeight: 700, letterSpacing: '0.5px', background: 'var(--bg-deeper)', padding: '10px', borderRadius: '6px' }}>{showCredentials.password}</div>
                         </div>
                      </div>
                   </div>
                   <div style={{ background: 'rgba(239, 68, 68, 0.05)', border: '1px solid var(--danger-400)', padding: '12px', borderRadius: '6px', fontSize: '11px', color: 'var(--danger-500)', lineHeight: '1.4' }}>
                      Diqqat! Ushbu ma'lumotlarni xodimga yuboring. Parol faqat bir marta ko'rsatiladi va qayta tiklanmaydi.
                   </div>
                </div>
                <div className="modal-footer" style={{ padding: '16px 24px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end' }}>
                   <button className="btn btn-primary" onClick={() => setShowCredentials(null)}>Tushunarli</button>
                </div>
             </div>
          </div>
        )}
      </main>
    </div>
  );
}
