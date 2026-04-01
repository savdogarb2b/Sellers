'use client';
import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie, RadialBarChart, RadialBar, Legend } from 'recharts';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/stats').then(r => r.ok ? r.json() : {}),
      fetch('/api/employees').then(r => r.ok ? r.json() : []),
      fetch('/api/attendance').then(r => r.ok ? r.json() : []),
    ]).then(([s, e, att]) => {
      setStats(s); setEmployees(e); setAttendance(att); setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="app-layout"><Sidebar /><Navbar /><main className="main-content"><div className="loading-container"><div className="loading-spinner" /></div></main></div>;

  const months = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyn', 'Iyl', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek'];
  const strategyMonths = stats?.strategy?.months || [];
  const maxSales = Math.max(...strategyMonths.map(m => Math.max(m.targetSales, m.actualSales)), 1);

  const todayStr = new Date().toDateString();
  const employeeActivity = employees.map(emp => {
    const todayAtt = attendance.find(a => a.userId === emp.id && new Date(a.date).toDateString() === todayStr);
    const kpiAvg = emp.kpis?.length > 0
      ? Math.round(emp.kpis.reduce((s, k) => s + (k.targetValue > 0 ? (k.currentValue || 0) / k.targetValue * 100 : 0), 0) / emp.kpis.length)
      : null;
    const empSales = emp.dailyReports?.reduce((s, r) => s + (r.sales || 0), 0) || 0;
    const empTotalLeads = emp.dailyReports?.reduce((s, r) => s + (r.leadStatuses ? r.leadStatuses.reduce((acc, ls) => acc + (ls.count || 0), 0) : 0), 0) || 0;
    const empConv = empTotalLeads > 0 ? Math.round((empSales / empTotalLeads) * 100) : 0;
    const empRevenue = emp.dailyReports?.reduce((s, r) => s + (r.revenue || 0), 0) || 0;
    const empAvgCheck = empSales > 0 ? Math.round(empRevenue / empSales) : 0;

    let streak = 0;
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

    return { ...emp, todayAtt, kpiAvg, empSales, empConv, empRevenue, empAvgCheck, streak };
  });

  const funnel = stats?.funnelDistribution || [];

  const last14Days = Array.from({length: 14}, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (13 - i));
    const dayStr = d.toDateString();
    
    // Sum across all employees for this day
    const daySales = employees.reduce((s, emp) => {
      const rep = emp.dailyReports?.find(r => new Date(r.date).toDateString() === dayStr);
      return s + (rep ? rep.sales : 0);
    }, 0);
    
    const dayRevenue = employees.reduce((s, emp) => {
      const rep = emp.dailyReports?.find(r => new Date(r.date).toDateString() === dayStr);
      return s + (rep ? rep.revenue : 0);
    }, 0);

    return { 
      name: d.toLocaleDateString('uz', { month: 'short', day: 'numeric' }), 
      sotuv: daySales, 
      tushum: Math.round(dayRevenue / 1000) 
    };
  });

  const financialData = [
    { name: 'Sarmoya (Maosh & Bonus)', value: (stats?.totalSalaryFund || 0) + (stats?.totalBonuses || 0), fill: 'var(--primary-500)' },
    { name: 'Kompaniya Qoldig\'i', value: Math.max(stats?.netFinancialBalance || 0, 0), fill: 'var(--accent-teal)' }
  ];

  const healthData = [
    { name: 'Strategiya Chtki (%)', uv: stats?.strategyProgress || 0, fill: 'var(--accent-teal)' },
    { name: 'Jamoaviy Konversiya (%)', uv: stats?.avgConversion || 0, fill: 'var(--primary-400)' },
    { name: 'Kunlik Intizom (%)', uv: stats?.attendanceRate || 0, fill: 'var(--accent-blue)' }
  ];

  return (
    <div className="app-layout">
      <Sidebar />
      <Navbar />
      <main className="main-content">
        <div className="animate-in">

        {/* ===== HEADER ===== */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{ fontSize: '16px', fontWeight: 950, textTransform: 'uppercase', letterSpacing: '2px' }}>Business Intelligence</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: '4px', fontWeight: 700 }}>
            Real-vaqt 23+ ko'rsatkich — {new Date().toLocaleDateString('uz')}
          </div>
        </div>

        {/* ===== ROW 1: ASOSIY 4 TA STAT ===== */}
        <div className="stats-grid">
          <StatCard label="Jami Xodimlar" value={stats?.totalEmployees || 0} sub="Faol shtat tarkibi" color="var(--primary-500)" />
          <StatCard label="Bugungi Davomat" value={`${stats?.attendanceRate || 0}%`} sub={`${stats?.todayAttendance || 0} xodim ishda`} color="var(--accent-teal)" />
          <StatCard label="Top Lider" value={stats?.topPerformer?.name || '—'} sub={`${stats?.topPerformer?.sales || 0} ta sotuv`} color="var(--accent-blue)" isText />
          <StatCard label="Haftalik Trend" value={`${stats?.weeklyTrendPercent > 0 ? '+' : ''}${stats?.weeklyTrendPercent || 0}%`} sub={`Bu hafta: ${stats?.thisWeekSales || 0} sotuv`} color={stats?.weeklyTrendPercent >= 0 ? 'var(--accent-teal)' : 'var(--danger-500)'} />
        </div>

        {/* ===== MOLIYA VA SALOMATLIK (YANGI ROW 2) ===== */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
          <StatCard label="Umumiy Tushum" value={`${(stats?.totalRevenue || 0).toLocaleString()} UZS`} sub="Kompaniyaga kirgan pul" color="var(--accent-teal)" />
          <StatCard label="Sof Balans (Qoldiq)" value={`${(stats?.netFinancialBalance || 0).toLocaleString()} UZS`} sub="Sof Moliya" color="var(--primary-400)" />
          <StatCard label="O'rtacha Chek" value={`${(stats?.avgCheck || 0).toLocaleString()} UZS`} sub="Bitta mijoz hajmi" color="#8b5cf6" />
          <StatCard label="Jami Lidlar" value={stats?.totalLeads || 0} sub="Kirib kelganlar" color="var(--accent-blue)" />
        </div>

        <div className="grid-2" style={{ marginBottom: '24px' }}>
          {/* Moliyaviy taqsimot */}
          <div className="card glass-panel" style={{ padding: '24px' }}>
            <div style={{ fontSize: '13px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>Moliyaviy Taqsimot (Daromad/Xarajat)</div>
            <div style={{ height: '220px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={financialData} cx="50%" cy="50%" innerRadius={70} outerRadius={90} paddingAngle={5} dataKey="value" stroke="none">
                    {financialData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    formatter={(value) => `${value.toLocaleString()} UZS`}
                    contentStyle={{ background: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                    itemStyle={{ fontSize: '12px', fontWeight: 800, color: '#fff' }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 800, fill: 'var(--text-muted)' }}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Tizimli Salomatlik */}
          <div className="card glass-panel" style={{ padding: '24px' }}>
            <div style={{ fontSize: '13px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>Tizimli Salomatlik Indikatori</div>
            <div style={{ height: '220px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart cx="50%" cy="50%" innerRadius="30%" outerRadius="100%" barSize={16} data={healthData} startAngle={90} endAngle={-270}>
                  <RadialBar minAngle={15} background={{ fill: 'rgba(255,255,255,0.05)' }} clockWise dataKey="uv" cornerRadius={10} />
                  <Legend iconSize={10} layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ fontSize: '11px', fontWeight: 800, paddingLeft: '20px' }} />
                  <RechartsTooltip 
                    formatter={(value) => `${value}%`}
                    contentStyle={{ background: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                    itemStyle={{ fontSize: '12px', fontWeight: 800, color: '#fff' }}
                  />
                </RadialBarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* ===== ROW 5: RECHARTS ===== */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '24px' }}>
          
          {/* 14 Kunlik Trend (Area Chart) */}
          <div className="card glass-panel" style={{ width: '100%', padding: '24px' }}>
            <div style={{ fontSize: '13px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between' }}>
              <span>Kunlik Tushum va Sotuv Dinamikasi (Oxirgi 14 kun)</span>
            </div>
            <div style={{ height: '320px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={last14Days} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorTushum" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.5}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorSotuv" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.5}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis yAxisId="left" stroke="var(--text-muted)" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `${v} ming`} />
                  <YAxis yAxisId="right" orientation="right" stroke="var(--text-muted)" fontSize={10} tickLine={false} axisLine={false} />
                  <RechartsTooltip 
                    contentStyle={{ background: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', backdropFilter: 'blur(10px)', color: '#fff' }}
                    itemStyle={{ fontSize: '12px', fontWeight: 800 }}
                    labelStyle={{ color: 'var(--primary-400)', fontSize: '10px', textTransform: 'uppercase', marginBottom: '4px', fontWeight: 800 }}
                  />
                  <Area yAxisId="left" type="monotone" dataKey="tushum" name="Tushum (ming UZS)" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorTushum)" />
                  <Area yAxisId="right" type="monotone" dataKey="sotuv" name="Sotuv Soni" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorSotuv)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid-2">
            {/* Voronka BarChart */}
            <div className="card glass-panel" style={{ padding: '24px' }}>
              <div style={{ fontSize: '13px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Sotuv Voronkasi</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '24px' }}>Mijozlarning bosqichlararo o'tishi</div>
              <div style={{ height: '260px', width: '100%' }}>
                {funnel.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={funnel} layout="vertical" margin={{ top: 0, right: 30, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" horizontal={true} vertical={false} />
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} stroke="var(--text-muted)" fontSize={10} width={100} />
                      <RechartsTooltip 
                        cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                        contentStyle={{ background: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} 
                        itemStyle={{ fontSize: '12px', fontWeight: 800, color: '#fff' }}
                      />
                      <Bar dataKey="count" name="Jami Lidlar" radius={[0, 6, 6, 0]} fill="var(--primary-500)">
                        {funnel.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#8b5cf6' : '#6d28d9'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="empty-state" style={{ padding: '40px' }}>Voronka ma'lumotlari yo'q</div>
                )}
              </div>
            </div>

            {/* Oylik Strategiya Progressi */}
            <div className="card glass-panel" style={{ padding: '24px' }}>
              <div style={{ fontSize: '13px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Yillik Kutilmalar</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '24px' }}>Belgilangan maqsad vs Amaliyot</div>
              <div style={{ height: '260px', width: '100%' }}>
                {strategyMonths.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={strategyMonths.map(m => ({ name: months[m.month - 1], Reja: m.targetSales, Amalda: m.actualSales }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis stroke="var(--text-muted)" fontSize={10} tickLine={false} axisLine={false} />
                      <RechartsTooltip 
                        cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                        contentStyle={{ background: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} 
                      />
                      <Bar dataKey="Reja" fill="var(--bg-input)" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Amalda" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="empty-state" style={{ padding: '40px' }}>Strategiya belgilanmagan</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ===== ROW 6: XODIMLAR FAOLLIGI ===== */}
        <div className="card glass-panel" style={{ marginTop: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px' }}>Jonli Faollik Paneli</div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600, marginTop: '2px' }}>Bugun, {new Date().toLocaleDateString('uz')}</div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <span className="activity-pill success" style={{ padding: '6px 12px', fontSize: '9px' }}>{stats?.todayAttendance || 0} Ishda</span>
              <span className="activity-pill success" style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'var(--accent-blue)', padding: '6px 12px', fontSize: '9px' }}>{stats?.todayReportedCount || 0} Hisobot</span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '6px' }}>
            {employeeActivity.map((emp, i) => {
              const checkedIn = !!emp.todayAtt;
              return (
                <div key={emp.id} className="animate-in" style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  padding: '12px 16px', 
                  background: 'rgba(255,255,255,0.015)',
                  borderRadius: '12px',
                  border: '1px solid rgba(255,255,255,0.03)',
                  gap: '16px',
                  animationDelay: `${i * 0.05}s`
                }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--primary-500)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '13px', color: '#0f172a' }}>
                    {emp.name?.charAt(0)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 750 }}>{emp.name}</span>
                      {emp.streak >= 3 && <span style={{ fontSize: '12px' }} title={`${emp.streak} kun streak`}>🔥</span>}
                      {emp.empConv >= 20 && emp.empSales >= 5 && <span style={{ fontSize: '12px' }} title="Usta Konversiya">💎</span>}
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600, display: 'flex', gap: '6px', alignItems: 'center' }}>
                      {emp.email}
                      {emp.empAvgCheck > 0 && <span>• O'rt. Chek: <span style={{color: '#8b5cf6', fontWeight: 800}}>{emp.empAvgCheck.toLocaleString()}</span></span>}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', minWidth: '60px' }}>
                    <div style={{ fontSize: '14px', fontWeight: 950, color: 'var(--accent-blue)' }}>
                      {(emp.empRevenue || 0).toLocaleString()} <span style={{fontSize: '9px'}}>UZS</span>
                    </div>
                    <div style={{ fontSize: '8px', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>Tushum</div>
                  </div>

                  <div style={{ textAlign: 'right', minWidth: '60px' }}>
                    <div style={{ fontSize: '14px', fontWeight: 950, color: 'var(--accent-teal)' }}>
                      {emp.empSales || 0}
                    </div>
                    <div style={{ fontSize: '8px', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>Sotuv</div>
                  </div>

                  <div style={{ textAlign: 'right', minWidth: '60px' }}>
                    <div style={{ fontSize: '14px', fontWeight: 950, color: emp.empConv >= 20 ? 'var(--accent-teal)' : 'var(--primary-400)' }}>
                      {emp.empConv || 0}%
                    </div>
                    <div style={{ fontSize: '8px', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>Konversiya</div>
                  </div>

                  <div style={{ textAlign: 'right', minWidth: '60px' }}>
                    <div style={{ fontSize: '14px', fontWeight: 950, color: emp.kpiAvg >= 80 ? 'var(--accent-teal)' : emp.kpiAvg >= 50 ? 'var(--primary-500)' : '#ef4444' }}>
                      {emp.kpiAvg || 0}%
                    </div>
                    <div style={{ fontSize: '8px', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>KPI</div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <span className={`activity-pill ${checkedIn ? (emp.todayAtt.isLate ? 'danger' : 'success') : 'danger'}`} style={{ opacity: checkedIn ? 1 : 0.5, fontSize: '9px' }}>
                      {checkedIn ? (emp.todayAtt.isLate ? 'Kechikdi' : 'Ishda') : 'Yo\'q'}
                    </span>
                  </div>
                </div>
              );
            })}
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

function MiniStat({ label, value, suffix = '', color, isText }) {
  return (
    <div className="card glass-panel" style={{ padding: '14px 16px', margin: 0, borderLeft: `2px solid ${color}` }}>
      <div style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)', marginBottom: '6px' }}>{label}</div>
      <div style={{ fontSize: isText ? '14px' : '18px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
        {value}<span style={{ fontSize: '10px', color: 'var(--text-ghost)', marginLeft: '2px' }}>{suffix}</span>
      </div>
    </div>
  );
}
