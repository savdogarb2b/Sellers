'use client';
import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from 'recharts';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/stats')
      .then(r => r.ok ? r.json() : {})
      .then(data => {
        setStats(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="app-layout"><Sidebar /><Navbar /><main className="main-content"><div className="loading-container"><div className="loading-spinner" /></div></main></div>;

  const summary = stats?.conversionSummary || {};
  const employeeConversions = stats?.employeeConversions || [];
  const funnelStages = stats?.funnelStageAnalytics || [];
  const weakestStage = stats?.weakestStage;

  return (
    <div className="app-layout">
      <Sidebar />
      <Navbar />
      <main className="main-content">
        <div className="animate-in">
          <div style={{ marginBottom: '28px' }}>
            <div style={{ fontSize: '16px', fontWeight: 950, textTransform: 'uppercase', letterSpacing: '2px' }}>Konversiya Dashboard</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: '4px', fontWeight: 700 }}>
              Leadlardan sotuvgacha eng muhim ko'rsatkichlar
            </div>
          </div>

          <div className="stats-grid" style={{ marginBottom: '16px' }}>
            <StatCard label="Jami Xodimlar" value={stats?.totalEmployees || 0} sub="Faol sotuv jamoasi" color="var(--primary-500)" />
            <StatCard label="Oylik Lidlar" value={summary.monthly?.leads || 0} sub="Joriy oy bo'yicha" color="var(--accent-blue)" />
            <StatCard label="Oylik Sotuvlar" value={summary.monthly?.sales || 0} sub="Yopilgan savdolar" color="var(--accent-teal)" />
            <StatCard label="Oylik Tushum" value={`${(summary.monthly?.revenue || 0).toLocaleString()} UZS`} sub="Joriy oy tushumi" color="#8b5cf6" isText />
          </div>

          <div className="stats-grid" style={{ marginBottom: '24px' }}>
            <StatCard label="Bugungi Conversion" value={`${summary.today?.conversion || 0}%`} sub={`${summary.today?.sales || 0} sotuv / ${summary.today?.leads || 0} lid`} color="var(--accent-teal)" />
            <StatCard label="Haftalik Conversion" value={`${summary.weekly?.conversion || 0}%`} sub={`${summary.weekly?.sales || 0} sotuv / ${summary.weekly?.leads || 0} lid`} color="var(--primary-400)" />
            <StatCard label="Oylik Conversion" value={`${summary.monthly?.conversion || 0}%`} sub={`${summary.monthly?.sales || 0} sotuv / ${summary.monthly?.leads || 0} lid`} color="var(--accent-blue)" />
            <StatCard label="Eng Zaif Bosqich" value={weakestStage?.name || '—'} sub={weakestStage ? `${weakestStage.dropOffPercent}% yo'qotish` : 'Maʼlumot yetarli emas'} color="var(--danger-500)" isText />
          </div>

          <div className="grid-2" style={{ marginBottom: '24px' }}>
            <div className="card glass-panel" style={{ padding: '24px' }}>
              <div style={{ fontSize: '13px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Funnel Bosqichlari Bo'yicha Yo'qotish</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '24px' }}>Joriy oy bo'yicha qaysi bosqichda mijoz ko'proq yo'qolyapti</div>
              <div style={{ height: '300px', width: '100%' }}>
                {funnelStages.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={funnelStages} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" horizontal vertical={false} />
                      <XAxis type="number" stroke="var(--text-muted)" fontSize={10} tickLine={false} axisLine={false} unit="%" />
                      <YAxis dataKey="name" type="category" width={110} stroke="var(--text-muted)" fontSize={10} tickLine={false} axisLine={false} />
                      <RechartsTooltip
                        formatter={(value, name, item) => {
                          if (name === 'dropOffPercent') return [`${value}%`, 'Yo\'qotish'];
                          return [`${value}`, 'Lidlar'];
                        }}
                        contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-2)', borderRadius: '10px', boxShadow: 'var(--shadow-lg)', color: 'var(--text)' }}
                        itemStyle={{ fontSize: '12px', fontWeight: 700, color: 'var(--text)' }}
                      />
                      <Bar dataKey="dropOffPercent" name="Yo'qotish" radius={[0, 6, 6, 0]}>
                        {funnelStages.map((stage, index) => (
                          <Cell key={stage.name} fill={index === 0 ? 'var(--primary-500)' : stage.dropOffPercent >= 40 ? '#ef4444' : stage.dropOffPercent >= 20 ? '#f59e0b' : '#10b981'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="empty-state" style={{ padding: '40px' }}>Voronka ma'lumotlari yo'q</div>
                )}
              </div>
            </div>

            <div className="card glass-panel" style={{ padding: '24px' }}>
              <div style={{ fontSize: '13px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Har Bir Xodim Bo'yicha Conversion</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '24px' }}>Joriy oy kesimida xodimlar natijasi</div>
              <div style={{ height: '300px', width: '100%' }}>
                {employeeConversions.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={employeeConversions.slice(0, 8)} margin={{ top: 0, right: 10, left: -10, bottom: 50 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
                      <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={10} tickLine={false} axisLine={false} angle={-20} textAnchor="end" interval={0} height={60} />
                      <YAxis stroke="var(--text-muted)" fontSize={10} tickLine={false} axisLine={false} unit="%" />
                      <RechartsTooltip
                        formatter={(value, name, item) => {
                          if (name === 'conversion') return [`${value}%`, 'Conversion'];
                          return [value, name];
                        }}
                        contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-2)', borderRadius: '10px', boxShadow: 'var(--shadow-lg)', color: 'var(--text)' }}
                        itemStyle={{ fontSize: '12px', fontWeight: 700, color: 'var(--text)' }}
                      />
                      <Bar dataKey="conversion" radius={[6, 6, 0, 0]}>
                        {employeeConversions.slice(0, 8).map((employee) => (
                          <Cell key={employee.id} fill={employee.conversion >= 20 ? '#10b981' : employee.conversion >= 10 ? '#8b5cf6' : '#ef4444'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="empty-state" style={{ padding: '40px' }}>Xodimlar bo'yicha ma'lumot yo'q</div>
                )}
              </div>
            </div>
          </div>

          <div className="card glass-panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px' }}>Konversiya Kesimidagi Xodimlar Ro'yxati</div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600, marginTop: '2px' }}>Joriy oy bo'yicha lid, sotuv va yo'qotishlar</div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <span className="activity-pill success" style={{ padding: '6px 12px', fontSize: '9px' }}>{stats?.todayAttendance || 0} Ishda</span>
                <span className="activity-pill success" style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'var(--accent-blue)', padding: '6px 12px', fontSize: '9px' }}>{stats?.todayReportedCount || 0} Hisobot</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
              {employeeConversions.length === 0 ? (
                <div className="empty-state" style={{ padding: '40px' }}>Xodimlar bo'yicha conversion ma'lumoti topilmadi</div>
              ) : employeeConversions.map((employee, index) => (
                <div key={employee.id} className="animate-in" style={{ display: 'grid', gridTemplateColumns: 'minmax(160px, 1.4fr) repeat(4, minmax(90px, 1fr)) 110px', gap: '12px', alignItems: 'center', padding: '14px 16px', background: 'var(--row-hover)', borderRadius: '10px', border: '1px solid var(--row-border)', animationDelay: `${index * 0.04}s` }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 800 }}>{employee.name}</span>
                      <span className={`activity-pill ${employee.checkedIn ? (employee.isLate ? 'danger' : 'success') : 'danger'}`} style={{ opacity: employee.checkedIn ? 1 : 0.55, fontSize: '9px' }}>
                        {employee.checkedIn ? (employee.isLate ? 'Kechikdi' : 'Ishda') : 'Yo\'q'}
                      </span>
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600, marginTop: '4px' }}>
                      Joriy oy kesimi
                    </div>
                  </div>

                  <MetricCell label="Lidlar" value={employee.leads} />
                  <MetricCell label="Sotuvlar" value={employee.sales} color="var(--accent-teal)" />
                  <MetricCell label="Conversion" value={`${employee.conversion}%`} color={employee.conversion >= 20 ? 'var(--accent-teal)' : employee.conversion >= 10 ? 'var(--primary-400)' : 'var(--danger-500)'} />
                  <MetricCell label="Yo'qotish" value={`${Math.max(employee.leads - employee.sales, 0)}`} color="var(--warning-500)" />
                  <MetricCell label="Tushum" value={`${employee.revenue.toLocaleString()} UZS`} color="#8b5cf6" isText />
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-primary)' }}>{employee.leads > 0 ? Math.max(100 - employee.conversion, 0).toFixed(1) : '0.0'}%</div>
                    <div style={{ fontSize: '8px', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase' }}>Yo'qotish foizi</div>
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

function StatCard({ label, value, sub, color, isText }) {
  return (
    <div className="card glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'center', borderTop: `2px solid ${color}` }}>
      <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)', marginBottom: '8px' }}>{label}</div>
      <div style={{ fontSize: isText ? '20px' : '28px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1, marginBottom: '8px', letterSpacing: '-0.5px' }}>{value}</div>
      <div style={{ fontSize: '11px', fontWeight: 600, color, display: 'flex', alignItems: 'center', gap: '6px' }}>
        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: color }} />
        {sub}
      </div>
    </div>
  );
}

function MetricCell({ label, value, color = 'var(--text-primary)', isText = false }) {
  return (
    <div style={{ textAlign: 'right' }}>
      <div style={{ fontSize: isText ? '11px' : '15px', fontWeight: 900, color }}>{value}</div>
      <div style={{ fontSize: '8px', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>{label}</div>
    </div>
  );
}
