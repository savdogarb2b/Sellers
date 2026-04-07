'use client';
import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';

export default function AdminReportsPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  // Date filters
  const [period, setPeriod] = useState('daily');
  const [customDateStart, setCustomDateStart] = useState('');
  const [customDateEnd, setCustomDateEnd] = useState('');
  const [useCustomRange, setUseCustomRange] = useState(false);

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
        endDate = todayStart.toISOString(); // For daily we just want today
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

    if (startDate && endDate) {
      url += `?startDate=${startDate}&endDate=${endDate}`;
    }

    try {
      const res = await fetch(url);
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
    fetchReports();
  }, [period, useCustomRange]);

  useEffect(() => {
    if (useCustomRange && customDateStart && customDateEnd) {
      fetchReports();
    }
  }, [customDateStart, customDateEnd]);

  const formatCurrency = (num) => new Intl.NumberFormat('uz-UZ').format(num || 0);

  return (
    <div className="app-layout">
      <Sidebar />
      <Navbar />
      <main className="main-content">
        <div className="animate-in">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <div style={{ fontSize: '18px', fontWeight: 950, textTransform: 'uppercase', letterSpacing: '1px' }}>Kunlik Hisobotlar</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: '4px', fontWeight: 700 }}>
                Xodimlarning to'liq savdo ko'rsatkichlari
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <select value={period} onChange={(e) => { setPeriod(e.target.value); setUseCustomRange(false); }} className="form-input" style={{ padding: '8px 16px', fontSize: '12px', fontWeight: 700, minWidth: '140px' }}>
                <option value="daily">Bugun</option>
                <option value="weekly">Bu hafta</option>
                <option value="monthly">Bu oy</option>
                <option value="all">Barcha vaqt</option>
              </select>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input type="date" value={customDateStart} onChange={(e) => { setCustomDateStart(e.target.value); setUseCustomRange(true); }} className="form-input" style={{ padding: '8px 12px', fontSize: '11px' }} />
                <span style={{ color: 'var(--text-muted)', fontWeight: 700 }}>—</span>
                <input type="date" value={customDateEnd} onChange={(e) => { setCustomDateEnd(e.target.value); setUseCustomRange(true); }} className="form-input" style={{ padding: '8px 12px', fontSize: '11px' }} />
              </div>
            </div>
          </div>

          {loading ? (
            <div className="loading-container"><div className="loading-spinner" /></div>
          ) : reports.length === 0 ? (
            <div className="card glass-panel" style={{ padding: '60px', textAlign: 'center' }}>
              <div className="empty-state">
                <div style={{ fontSize: '14px', fontWeight: 900, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Hozircha hisobotlar yo'q</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>Tanlangan sanada xodimlar hisobot yubormagan</div>
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
              {reports.map(r => (
                <div key={r.id} className="card glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  
                  {/* Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: 900, textTransform: 'uppercase', color: 'var(--text-primary)' }}>
                        {r.user?.name || 'Xodim'}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, marginTop: '4px' }}>
                        {new Date(r.date).toLocaleDateString('uz-UZ', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '9px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Tushum</div>
                      <div style={{ fontSize: '16px', fontWeight: 900, color: '#8b5cf6' }}>{formatCurrency(r.revenue)} so'm</div>
                    </div>
                  </div>

                  {/* Asosiy raqamlar */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div style={{ background: 'var(--bg-input)', padding: '12px', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '8px' }}>Qo'ng'iroqlar</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 600 }}>Jami:</span>
                        <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)' }}>{r.totalCalls}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>Kiruvchi:</span>
                        <span style={{ fontSize: '12px', fontWeight: 800 }}>{r.incomingCalls}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>Chiquvchi:</span>
                        <span style={{ fontSize: '12px', fontWeight: 800 }}>{r.outgoingCalls}</span>
                      </div>
                    </div>

                    <div style={{ background: 'var(--bg-input)', padding: '12px', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '8px' }}>Lidlar & Natija</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 600 }}>Sifatli Lid:</span>
                        <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--primary-400)' }}>{r.qualityLeads}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>Sifatsiz Lid:</span>
                        <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--danger-500)' }}>{r.nonQualityLeads}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '11px', fontWeight: 600 }}>Uchrashuv:</span>
                        <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--accent-blue)' }}>{r.officeVisits}</span>
                      </div>
                    </div>
                  </div>

                  {/* Funnel bosqichlari (Agar mavjud bo'lsa) */}
                  {r.leadStatuses && r.leadStatuses.length > 0 && (
                    <div style={{ marginTop: '4px' }}>
                      <div style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px' }}>Voronka Bosqichlari</div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        {r.leadStatuses.map(ls => (
                          <div key={ls.id} style={{ display: 'flex', justifyContent: 'space-between', background: 'var(--bg-card)', padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border-2)' }}>
                            <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)' }}>{ls.stage?.name || 'Bosqich'}</span>
                            <span style={{ fontSize: '11px', fontWeight: 800 }}>{ls.count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Yopilgan savdo xulosasi */}
                  <div style={{ marginTop: 'auto', paddingTop: '12px', borderTop: '1px dashed var(--border-2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Yopilgan Savdo</div>
                    <div style={{ fontSize: '20px', fontWeight: 900, color: 'var(--accent-teal)' }}>{r.sales} <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>ta</span></div>
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
