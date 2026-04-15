'use client';
import { useState, useEffect, useMemo } from 'react';
import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';
import { User, Calendar, Phone, Filter, Download, ChevronRight, BarChart3, Users } from 'lucide-react';

export default function AdminReportsPage() {
  const [reports, setReports] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('all');
  const [stages, setStages] = useState([]);
  const [loading, setLoading] = useState(true);

  // Date filters
  const [period, setPeriod] = useState('monthly');
  const [customDateStart, setCustomDateStart] = useState('');
  const [customDateEnd, setCustomDateEnd] = useState('');
  const [useCustomRange, setUseCustomRange] = useState(false);

  // Edit state
  const [editingReport, setEditingReport] = useState(null);

  const fetchReports = async () => {
    setLoading(true);
    let url = '/api/reports';

    let startDate, endDate;
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrowStart = new Date(todayStart);
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);

    if (useCustomRange && customDateStart && customDateEnd) {
      startDate = customDateStart;
      endDate = customDateEnd;
    } else {
      if (period === 'daily') {
        startDate = todayStart.toISOString();
        endDate = todayStart.toISOString();
      } else if (period === 'weekly') {
        const weekAgo = new Date(todayStart);
        weekAgo.setDate(weekAgo.getDate() - 7);
        startDate = weekAgo.toISOString();
        endDate = todayStart.toISOString();
      } else if (period === 'monthly') {
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        startDate = monthStart.toISOString();
        endDate = todayStart.toISOString();
      }
    }

    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (selectedEmployeeId !== 'all') params.append('userId', selectedEmployeeId);

    try {
      const res = await fetch(`${url}?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setReports(data);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetch('/api/funnel').then(r => r.json()).then(setStages);
    fetch('/api/employees').then(r => r.json()).then(data => {
      setEmployees(Array.isArray(data) ? data : data.data || []);
    });
  }, []);

  useEffect(() => {
    fetchReports();
  }, [period, useCustomRange, selectedEmployeeId]);

  useEffect(() => {
    if (useCustomRange && customDateStart && customDateEnd) {
      fetchReports();
    }
  }, [customDateStart, customDateEnd]);

  const formatCurrency = (num) => new Intl.NumberFormat('uz-UZ').format(num || 0);

  const handleEditClick = (report) => {
    setEditingReport({
      ...report,
      leadStatuses: stages.map(st => {
        const existing = report.leadStatuses?.find(ls => ls.stageId === st.id);
        return { stageId: st.id, count: existing ? existing.count : '', stage: st };
      })
    });
  };

  const handleUpdateReport = async (e) => {
    e.preventDefault();
    try {
      const validStatuses = editingReport.leadStatuses.filter(ls => ls.count !== '');
      const res = await fetch(`/api/reports/${editingReport.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...editingReport, leadStatuses: validStatuses }),
      });

      if (res.ok) {
        const updated = await res.json();
        setReports(reports.map(r => r.id === updated.id ? updated : r));
        setEditingReport(null);
      } else {
        alert("Xatolik yuz berdi");
      }
    } catch (err) {
      console.error(err);
      alert("Xatolik yuz berdi");
    }
  };

  // Group reports by week for the table summary
  const tableDataWithSummaries = useMemo(() => {
    if (reports.length === 0) return [];
    
    // Sort by date ascending to group naturally
    const sorted = [...reports].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    const result = [];
    let currentWeek = [];
    let weekNumber = -1;

    const getWeekNumber = (d) => {
      const date = new Date(d);
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() + 4 - (date.getDay() || 7));
      const yearStart = new Date(date.getFullYear(), 0, 1);
      return Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
    };

    sorted.forEach((report, index) => {
      const w = getWeekNumber(report.date);
      if (weekNumber !== -1 && w !== weekNumber) {
        // Add summary for finished week
        result.push({ isSummary: true, reports: [...currentWeek], label: `${weekNumber}-HAFTA JAMI` });
        currentWeek = [];
      }
      weekNumber = w;
      currentWeek.push(report);
      result.push(report);

      // If last item, add final summary
      if (index === sorted.length - 1) {
        result.push({ isSummary: true, reports: [...currentWeek], label: `${weekNumber}-HAFTA JAMI` });
      }
    });

    // Add Grand Total
    result.push({ isSummary: true, reports: [...sorted], label: 'YAKUNIY JAMI', isGrand: true });

    return result;
  }, [reports]);

  const getDayName = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('uz-UZ', { weekday: 'long' });
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <Navbar />
      <main className="main-content">
        <div className="animate-in" style={{ maxWidth: '1400px', margin: '0 auto' }}>
          
          {/* Header & Controls */}
          <div style={{ marginBottom: '30px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px', gap: '20px', flexWrap: 'wrap' }}>
              <div>
                <h1 style={{ fontSize: '24px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.5px', marginBottom: '4px' }}>Hisobotlar Jadvali</h1>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Xodimlar natijalarini Sheet ko'rinishida tahlil qilish</p>
              </div>
              
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn btn-secondary" style={{ height: '40px', padding: '0 16px', fontSize: '11px', fontWeight: 800 }}>
                  <Download size={14} style={{ marginRight: '8px' }} /> EXPORT EXCEL
                </button>
              </div>
            </div>

            {/* Filters Section */}
            <div className="card glass-panel" style={{ padding: '20px', display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'flex-end', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
              
              <div style={{ flex: '1 1 200px' }}>
                <label style={{ display: 'block', fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px' }}>Xodimni tanlang</label>
                <div style={{ position: 'relative' }}>
                  <Users size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary-400)' }} />
                  <select 
                    value={selectedEmployeeId} 
                    onChange={(e) => setSelectedEmployeeId(e.target.value)}
                    className="form-input" 
                    style={{ paddingLeft: '35px', height: '42px', fontSize: '13px', fontWeight: 700 }}
                  >
                    <option value="all">Barcha xodimlar</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ flex: '0 0 160px' }}>
                <label style={{ display: 'block', fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px' }}>Davr</label>
                <div style={{ position: 'relative' }}>
                  <BarChart3 size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--accent-teal)' }} />
                  <select 
                    value={period} 
                    onChange={(e) => { setPeriod(e.target.value); setUseCustomRange(false); }} 
                    className="form-input" 
                    style={{ paddingLeft: '35px', height: '42px', fontSize: '13px', fontWeight: 700 }}
                  >
                    <option value="daily">Bugun</option>
                    <option value="weekly">Bu hafta</option>
                    <option value="monthly">Bu oy</option>
                    <option value="all">Barcha vaqt</option>
                  </select>
                </div>
              </div>

              <div style={{ flex: '1 1 300px', display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px' }}>Dan</label>
                  <input type="date" value={customDateStart} onChange={(e) => { setCustomDateStart(e.target.value); setUseCustomRange(true); }} className="form-input" style={{ height: '42px', fontSize: '12px' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px' }}>Gacha</label>
                  <input type="date" value={customDateEnd} onChange={(e) => { setCustomDateEnd(e.target.value); setUseCustomRange(true); }} className="form-input" style={{ height: '42px', fontSize: '12px' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Table Content */}
          <div className="card glass-panel" style={{ padding: 0, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(10,10,10,0.4)' }}>
            {loading ? (
              <div style={{ padding: '100px', textAlign: 'center' }}>
                <div className="loading-spinner" style={{ margin: '0 auto 20px' }}></div>
                <p style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-muted)' }}>MA'LUMOTLAR YUKLANMOQDA...</p>
              </div>
            ) : reports.length === 0 ? (
              <div style={{ padding: '100px', textAlign: 'center' }}>
                <p style={{ fontSize: '14px', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Hisobotlar topilmadi</p>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>Tanlangan davrda yoki xodim bo'yicha ma'lumot yo'q</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1000px' }}>
                  <thead>
                    <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                      <th style={thStyle}>Sana</th>
                      <th style={thStyle}>Hafta kuni</th>
                      <th style={{ ...thStyle, background: 'rgba(184, 134, 11, 0.1)', color: '#daa520' }}>Jami q-roq</th>
                      <th style={{ ...thStyle, background: 'rgba(30, 144, 255, 0.1)', color: '#1e90ff' }}>Kiruvchi</th>
                      <th style={{ ...thStyle, background: 'rgba(30, 144, 255, 0.1)', color: '#1e90ff' }}>Zadacha</th>
                      <th style={{ ...thStyle, background: 'rgba(50, 205, 50, 0.1)', color: '#32cd32' }}>Sifatli</th>
                      <th style={{ ...thStyle, background: 'rgba(220, 20, 60, 0.1)', color: '#dc143c' }}>Sifatsiz</th>
                      
                      {/* Dynamic Funnel Stages */}
                      {stages.map(stage => (
                        <th key={stage.id} style={{ ...thStyle, background: 'rgba(255,255,255,0.02)', color: 'var(--primary-400)', minWidth: '80px' }}>
                          {stage.name}
                        </th>
                      ))}

                      <th style={{ ...thStyle, background: 'rgba(255, 69, 0, 0.1)', color: '#ff4500' }}>Ofis (K)</th>
                      <th style={{ ...thStyle, background: 'rgba(0, 206, 209, 0.1)', color: '#00ced1' }}>Sotuv (T)</th>
                      <th style={{ ...thStyle, background: 'rgba(138, 43, 226, 0.1)', color: '#8a2be2' }}>Summa (UZS)</th>
                      <th style={thStyle}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableDataWithSummaries.map((item, idx) => {
                      if (item.isSummary) {
                        const totalCalls = item.reports.reduce((s, r) => s + r.totalCalls, 0);
                        const incoming = item.reports.reduce((s, r) => s + r.incomingCalls, 0);
                        const outgoing = item.reports.reduce((s, r) => s + r.outgoingCalls, 0);
                        const quality = item.reports.reduce((s, r) => s + r.qualityLeads, 0);
                        const nonQuality = item.reports.reduce((s, r) => s + r.nonQualityLeads, 0);
                        const visits = item.reports.reduce((s, r) => s + r.officeVisits, 0);
                        const sales = item.reports.reduce((s, r) => s + r.sales, 0);
                        const revenue = item.reports.reduce((s, r) => s + r.revenue, 0);

                        return (
                          <tr key={`sum-${idx}`} style={{ 
                            background: item.isGrand ? 'rgba(50, 205, 50, 0.15)' : 'rgba(30, 144, 255, 0.1)', 
                            fontWeight: 900,
                            borderTop: '2px solid rgba(255,255,255,0.1)',
                            borderBottom: item.isGrand ? 'none' : '2px solid rgba(255,255,255,0.1)'
                          }}>
                            <td colSpan={2} style={{ ...tdStyle, textAlign: 'right', fontSize: '11px', color: 'var(--text-primary)' }}>{item.label}</td>
                            <td style={tdStyle}>{totalCalls}</td>
                            <td style={tdStyle}>{incoming}</td>
                            <td style={tdStyle}>{outgoing}</td>
                            <td style={tdStyle}>{quality}</td>
                            <td style={tdStyle}>{nonQuality}</td>
                            
                            {/* Dynamic Funnel Totals */}
                            {stages.map(stage => {
                              const stageTotal = item.reports.reduce((s, r) => {
                                const ls = r.leadStatuses?.find(ls => ls.stageId === stage.id);
                                return s + (ls ? ls.count : 0);
                              }, 0);
                              return <td key={stage.id} style={tdStyle}>{stageTotal}</td>;
                            })}

                            <td style={tdStyle}>{visits}</td>
                            <td style={tdStyle}>{sales}</td>
                            <td style={{ ...tdStyle, color: item.isGrand ? 'var(--accent-teal)' : 'inherit' }}>{formatCurrency(revenue)}</td>
                            <td style={tdStyle}></td>
                          </tr>
                        );
                      }

                      return (
                        <tr key={item.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', height: '45px' }}>
                          <td style={{ ...tdStyle, color: 'var(--text-muted)', fontSize: '11px' }}>{new Date(item.date).toLocaleDateString('uz-UZ')}</td>
                          <td style={{ ...tdStyle, textTransform: 'capitalize', fontWeight: 600 }}>{getDayName(item.date)}</td>
                          <td style={{ ...tdStyle, fontWeight: 800 }}>{item.totalCalls}</td>
                          <td style={tdStyle}>{item.incomingCalls}</td>
                          <td style={tdStyle}>{item.outgoingCalls}</td>
                          <td style={{ ...tdStyle, color: 'var(--primary-400)', fontWeight: 800 }}>{item.qualityLeads}</td>
                          <td style={{ ...tdStyle, color: 'var(--danger-500)' }}>{item.nonQualityLeads}</td>
                          
                          {/* Dynamic Funnel Row Data */}
                          {stages.map(stage => {
                            const ls = item.leadStatuses?.find(ls => ls.stageId === stage.id);
                            return <td key={stage.id} style={{ ...tdStyle, fontWeight: 700 }}>{ls ? ls.count : 0}</td>;
                          })}

                          <td style={{ ...tdStyle, color: 'var(--accent-blue)', fontWeight: 800 }}>{item.officeVisits}</td>
                          <td style={{ ...tdStyle, color: 'var(--accent-teal)', fontWeight: 800 }}>{item.sales}</td>
                          <td style={{ ...tdStyle, color: '#8b5cf6', fontWeight: 900 }}>{formatCurrency(item.revenue)}</td>
                          <td style={{ ...tdStyle, textAlign: 'right' }}>
                            <button 
                              onClick={() => handleEditClick(item)} 
                              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                              title="Tahrirlash"
                            >
                              <ChevronRight size={16} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Edit Modal (Keeping existing logic) */}
      {editingReport && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }} onClick={() => setEditingReport(null)}>
          <div className="card glass-panel animate-in" style={{ width: '100%', maxWidth: '600px', padding: '30px', maxHeight: '90vh', overflowY: 'auto', border: '1px solid var(--primary-500)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 900, textTransform: 'uppercase', color: 'var(--primary-400)' }}>Hisobotni Tahrirlash</h2>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>{editingReport.user?.name} | {new Date(editingReport.date).toLocaleDateString('uz-UZ')}</div>
              </div>
              <button onClick={() => setEditingReport(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '28px', cursor: 'pointer' }}>&times;</button>
            </div>

            <form onSubmit={handleUpdateReport}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '10px', fontWeight: 850 }}>KIRUVCHI Q-ROQLAR</label>
                  <input className="form-input" type="number" value={editingReport.incomingCalls} onChange={e => setEditingReport({ ...editingReport, incomingCalls: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '10px', fontWeight: 850 }}>CHIQUVCHI Q-ROQLAR</label>
                  <input className="form-input" type="number" value={editingReport.outgoingCalls} onChange={e => setEditingReport({ ...editingReport, outgoingCalls: e.target.value })} required />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '10px', fontWeight: 850 }}>SIFATLI LIDLAR</label>
                  <input className="form-input" type="number" value={editingReport.qualityLeads} onChange={e => setEditingReport({ ...editingReport, qualityLeads: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '10px', fontWeight: 850 }}>SIFATSIZ LIDLAR</label>
                  <input className="form-input" type="number" value={editingReport.nonQualityLeads} onChange={e => setEditingReport({ ...editingReport, nonQualityLeads: e.target.value })} required />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontSize: '10px', fontWeight: 850 }}>OFISGA KELIHLAR</label>
                <input className="form-input" type="number" value={editingReport.officeVisits} onChange={e => setEditingReport({ ...editingReport, officeVisits: e.target.value })} required />
              </div>

              {stages.length > 0 && (
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--primary-400)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    📊 Voronka bosqichlari
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    {editingReport.leadStatuses?.map((ls, i) => (
                      <div className="form-group" key={ls.stageId} style={{ marginBottom: 0 }}>
                        <label className="form-label" style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase' }}>{ls.stage?.name}</label>
                        <input className="form-input" type="number" value={ls.count} onChange={e => {
                          const newLs = [...editingReport.leadStatuses];
                          newLs[i].count = e.target.value;
                          setEditingReport({ ...editingReport, leadStatuses: newLs });
                        }} placeholder="0" min="0" required />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '10px', fontWeight: 850 }}>SOTUV SONI</label>
                  <input className="form-input" type="number" value={editingReport.sales} onChange={e => setEditingReport({ ...editingReport, sales: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '10px', fontWeight: 850 }}>UMUMIY TUSHUM (UZS)</label>
                  <input className="form-input" type="number" value={editingReport.revenue} onChange={e => setEditingReport({ ...editingReport, revenue: e.target.value })} required />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '30px' }}>
                <button type="button" onClick={() => setEditingReport(null)} className="btn btn-secondary" style={{ flex: 1, height: '45px', fontWeight: 800 }}>BEKOR QILISH</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, height: '45px', fontWeight: 800 }}>SAQLASH</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const thStyle = {
  padding: '16px 12px',
  textAlign: 'left',
  fontSize: '10px',
  fontWeight: 900,
  textTransform: 'uppercase',
  color: 'var(--text-muted)',
  letterSpacing: '0.5px'
};

const tdStyle = {
  padding: '12px',
  fontSize: '12px',
  color: 'var(--text-primary)'
};
