'use client';
import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from 'recharts';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('monthly');
  const [customDateStart, setCustomDateStart] = useState('');
  const [customDateEnd, setCustomDateEnd] = useState('');
  const [useCustomRange, setUseCustomRange] = useState(false);

  const fetchStats = async () => {
    setLoading(true);
    let url = '/api/stats';
    if (useCustomRange && customDateStart && customDateEnd) {
      url += `?startDate=${customDateStart}&endDate=${customDateEnd}`;
    } else {
      url += `?period=${period}`;
    }
    try {
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Stats fetch error:', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchStats();
  }, [period, useCustomRange]);

  useEffect(() => {
    if (useCustomRange && customDateStart && customDateEnd) {
      fetchStats();
    }
  }, [customDateStart, customDateEnd]);

  const formatCurrency = (amount) => {
    const n = Number(amount || 0);
    if (n >= 1000000000) return (n / 1000000000).toFixed(1) + ' mlrd';
    if (n >= 1000000) return (n / 1000000).toFixed(1) + ' mln';
    return n.toLocaleString('uz-UZ');
  };

  const formatNumber = (num) => new Intl.NumberFormat('uz-UZ').format(num || 0);

  if (loading || !stats) return (
    <div className="app-layout"><Sidebar /><Navbar /><main className="main-content"><div className="loading-container"><div className="loading-spinner" /></div></main></div>
  );

  const employeeConversions = stats?.employeeConversions || [];
  const funnelStages = stats?.funnelStageAnalytics || [];
  const weakestStage = stats?.weakestStage;
  const topPerformer = stats?.topPerformer;
  const strategy = stats?.strategy;

  const periodLabel = useCustomRange ? `${customDateStart} → ${customDateEnd}` : (period === 'monthly' ? 'Bu oy' : period === 'weekly' ? 'Bu hafta' : period === 'daily' ? 'Bugun' : 'Barcha vaqt');

  return (
    <div className="app-layout">
      <Sidebar />
      <Navbar />
      <main className="main-content">
        <div className="animate-in">
          {/* Header + Date Filter */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <div style={{ fontSize: '18px', fontWeight: 950, textTransform: 'uppercase', letterSpacing: '2px' }}>Dashboard</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: '4px', fontWeight: 700 }}>
                {periodLabel}
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

          {/* 1-4: Asosiy statlar */}
          <div className="stats-grid" style={{ marginBottom: '20px' }}>
            <StatCard label="Jami Xodimlar" value={stats?.totalEmployees || 0} sub="Sotuv jamoasi" color="var(--primary-500)" />
            <StatCard label="Oylik Lidlar" value={stats?.totalQualityLeads || 0} sub="Sifatli leadlar" color="var(--accent-blue)" />
            <StatCard label="Oylik Sotuvlar" value={stats?.totalSales || 0} sub="Yopilgan savdolar" color="var(--accent-teal)" />
            <StatCard label="Oylik Tushum" value={`${formatCurrency(stats?.totalRevenue || 0)} so'm`} sub="Jami tushum" color="#8b5cf6" isText />
          </div>

          {/* 5: O'rtacha chek | 7: Strategiya | 8: Konversiya | 11: Davomat */}
          <div className="stats-grid" style={{ marginBottom: '20px' }}>
            <StatCard label="O'rtacha Chek" value={`${formatCurrency(stats?.avgCheck || 0)} so'm`} sub="Tushum / Sotuv" color="var(--warning-500)" isText />
            <StatCard
              label="Strategiya Bajarilishi"
              value={`${stats?.strategyProgress || 0}%`}
              sub={`Reja: ${formatNumber(stats?.strategyTargetSales || 0)} | Real: ${formatNumber(stats?.strategyActualSales || 0)}`}
              color={stats?.strategyProgress >= 80 ? 'var(--accent-teal)' : stats?.strategyProgress >= 50 ? 'var(--warning-500)' : 'var(--danger-500)'}
            />
            <StatCard label="Umumiy Konversiya" value={`${stats?.avgConversion || 0}%`} sub="Lid → Sotuv" color="var(--primary-400)" />
            <StatCard label="Bugungi Davomat" value={`${stats?.todayAttendance || 0} / ${stats?.totalEmployees || 0}`} sub={`${stats?.attendanceRate || 0}% ishtirok`} color={stats?.attendanceRate >= 80 ? 'var(--accent-teal)' : stats?.attendanceRate >= 50 ? 'var(--warning-500)' : 'var(--danger-500)'} />
          </div>

          {/* 12: Top Lider */}
          {topPerformer && topPerformer.name !== '—' && (
            <div style={{ background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.1), rgba(16, 185, 129, 0.05))', border: '1px solid rgba(124, 58, 237, 0.2)', borderRadius: '16px', padding: '20px 24px', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>👑</div>
                <div>
                  <div style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)' }}>Top Lider Xodim</div>
                  <div style={{ fontSize: '18px', fontWeight: 900, color: 'var(--text-primary)' }}>{topPerformer.name}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Sotuvlar</div>
                  <div style={{ fontSize: '16px', fontWeight: 900, color: 'var(--accent-teal)' }}>{formatNumber(topPerformer.sales)}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Lidlar</div>
                  <div style={{ fontSize: '16px', fontWeight: 900, color: 'var(--accent-blue)' }}>{formatNumber(topPerformer.leads)}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Tushum</div>
                  <div style={{ fontSize: '16px', fontWeight: 900, color: '#8b5cf6' }}>{formatCurrency(topPerformer.revenue)}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Konversiya</div>
                  <div style={{ fontSize: '16px', fontWeight: 900, color: 'var(--primary-400)' }}>{topPerformer.conversion}%</div>
                </div>
              </div>
            </div>
          )}

          {/* 9: Sotuv bosqichlari + Zaif bosqich | 10: Xodimlar conversion chart */}
          <div className="grid-2" style={{ marginBottom: '24px' }}>
            <div className="card glass-panel" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ fontSize: '13px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px' }}>Sotuv Bosqichlari</div>
                {weakestStage && weakestStage.name && (
                  <div style={{ padding: '4px 10px', borderRadius: '6px', background: 'rgba(239, 68, 68, 0.1)', fontSize: '10px', fontWeight: 700, color: 'var(--danger-500)' }}>
                    Zaif: {weakestStage.name} ({weakestStage.dropOffPercent}% yo'qotish)
                  </div>
                )}
              </div>
              <div style={{ height: '220px', width: '100%' }}>
                {funnelStages.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={funnelStages} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" horizontal vertical={false} />
                      <XAxis type="number" stroke="var(--text-muted)" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis dataKey="name" type="category" width={90} stroke="var(--text-muted)" fontSize={9} tickLine={false} axisLine={false} />
                      <RechartsTooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-2)', borderRadius: '10px', boxShadow: 'var(--shadow-lg)', color: 'var(--text)' }} />
                      <Bar dataKey="count" name="Lidlar" radius={[0, 6, 6, 0]}>
                        {funnelStages.map((stage, i) => (
                          <Cell key={stage.name} fill={stage.dropOffPercent >= 40 ? '#ef4444' : stage.dropOffPercent >= 20 ? '#f59e0b' : '#6366f1'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="empty-state">Voronka ma'lumotlari yo'q</div>
                )}
              </div>
            </div>

            <div className="card glass-panel" style={{ padding: '24px' }}>
              <div style={{ fontSize: '13px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>Xodimlar Konversiyasi</div>
              <div style={{ height: '220px', width: '100%' }}>
                {employeeConversions.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={employeeConversions.slice(0, 8)} margin={{ top: 0, right: 10, left: -10, bottom: 40 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
                      <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={9} tickLine={false} axisLine={false} angle={-20} textAnchor="end" interval={0} height={50} />
                      <YAxis stroke="var(--text-muted)" fontSize={10} tickLine={false} axisLine={false} unit="%" />
                      <RechartsTooltip formatter={(value) => [`${value}%`, 'Conversion']} contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-2)', borderRadius: '10px', boxShadow: 'var(--shadow-lg)', color: 'var(--text)' }} />
                      <Bar dataKey="conversion" radius={[4, 4, 0, 0]}>
                        {employeeConversions.slice(0, 8).map((emp) => (
                          <Cell key={emp.id} fill={emp.conversion >= 20 ? '#10b981' : emp.conversion >= 10 ? '#8b5cf6' : '#ef4444'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="empty-state">Xodimlar ma'lumoti yo'q</div>
                )}
              </div>
            </div>
          </div>

          {/* 10: Xodimlar ro'yxati */}
          <div className="card glass-panel">
            <div style={{ fontSize: '13px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '20px' }}>Xodimlar Natijalari</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
              {employeeConversions.length === 0 ? (
                <div className="empty-state" style={{ padding: '40px', gridColumn: '1 / -1' }}>Xodimlar bo'yicha ma'lumot yo'q</div>
              ) : employeeConversions.map((emp, i) => (
                <div key={emp.id} style={{ background: 'var(--bg-input)', borderRadius: '12px', padding: '16px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '16px', fontWeight: 900, color: i < 3 ? '#fbbf24' : 'var(--text-primary)' }}>#{i + 1}</span>
                      <span style={{ fontSize: '13px', fontWeight: 700 }}>{emp.name}</span>
                    </div>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600 }}>{emp.checkedIn ? (emp.isLate ? 'Kechikdi' : 'Ishda') : 'Yo\'q'}</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div>
                      <div style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Lidlar</div>
                      <div style={{ fontSize: '14px', fontWeight: 800 }}>{emp.leads}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Sotuvlar</div>
                      <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--accent-teal)' }}>{emp.sales}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Konversiya</div>
                      <div style={{ fontSize: '14px', fontWeight: 800, color: emp.conversion >= 20 ? 'var(--accent-teal)' : emp.conversion >= 10 ? 'var(--primary-400)' : 'var(--danger-500)' }}>{emp.conversion}%</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Tushum</div>
                      <div style={{ fontSize: '14px', fontWeight: 800, color: '#8b5cf6' }}>{formatCurrency(emp.revenue)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({ label, value, sub, color, isText = false }) {
  return (
    <div className="card glass-panel" style={{ padding: '18px 20px', borderTop: `3px solid ${color}` }}>
      <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)', marginBottom: '8px' }}>{label}</div>
      <div style={{ fontSize: isText ? '20px' : '26px', fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1.1, marginBottom: '6px', letterSpacing: '-0.5px' }}>{value}</div>
      <div style={{ fontSize: '11px', fontWeight: 600, color, display: 'flex', alignItems: 'center', gap: '6px' }}>
        <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: color }} />
        {sub}
      </div>
    </div>
  );
}
