'use client';
import { useState, useEffect, useCallback } from 'react';
import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  ComposedChart, Line, PieChart, Pie, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';

// ─── CONSTANTS ───────────────────────────────────────────────────────────────
const DAY_OPTIONS = [
  { label: '1 kun', value: '1' },
  { label: '3 kun', value: '3' },
  { label: '5 kun', value: '5' },
  { label: '7 kun', value: '7' },
  { label: '10 kun', value: '10' },
  { label: '30 kun', value: '30' },
  { label: 'Barchasini', value: 'all' },
];

const COLORS = ['#ffb268', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899', '#06b6d4', '#f43f5e', '#84cc16'];
const PLAN_COLORS = { FREE: '#6b7280', BASIC: '#3b82f6', PREMIUM: '#ffb268' };

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const fmt = (n) => {
  if (n === undefined || n === null) return '0';
  if (n >= 1000000000) return (n / 1000000000).toFixed(1) + 'B';
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(0) + 'K';
  return String(Math.round(n));
};

const fmtFull = (n) => {
  if (!n) return '0';
  return Number(n).toLocaleString('uz-UZ');
};

// ─── CUSTOM TOOLTIP ──────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-2)', padding: '12px 16px', borderRadius: '10px', boxShadow: '0 20px 40px rgba(0,0,0,0.3)', zIndex: 1000 }}>
        <p style={{ color: 'var(--text-3)', fontSize: '10px', fontWeight: 800, marginBottom: '8px', textTransform: 'uppercase' }}>{label}</p>
        {payload.map((entry, idx) => (
          <p key={idx} style={{ color: entry.color, fontSize: '12px', fontWeight: 700, margin: '3px 0' }}>
            {entry.name}: <span style={{ color: 'var(--text)' }}>{typeof entry.value === 'number' && entry.value > 100000 ? fmtFull(entry.value) : entry.value}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// ─── DAY FILTER ───────────────────────────────────────────────────────────────
const DayFilter = ({ value, onChange }) => (
  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
    {DAY_OPTIONS.map(opt => (
      <button key={opt.value} onClick={() => onChange(opt.value)} style={{
        padding: '5px 12px', fontSize: '10px', fontWeight: 800, borderRadius: '6px', border: 'none',
        cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.5px', transition: 'all 0.2s',
        background: value === opt.value ? '#ffb268' : 'var(--bg-elevated)',
        color: value === opt.value ? '#0f172a' : 'var(--text-2)',
        boxShadow: value === opt.value ? '0 4px 12px rgba(255,178,104,0.4)' : 'none',
      }}>{opt.label}</button>
    ))}
  </div>
);

// ─── STAT CARD ───────────────────────────────────────────────────────────────
const StatCard = ({ icon, label, desc, value, valueSuffix, sub, accent = '#ffb268' }) => (
  <div className="card glass-panel" style={{ padding: '18px', borderLeft: `3px solid ${accent}`, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
      <div style={{ width: '30px', height: '30px', borderRadius: '7px', background: `${accent}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', flexShrink: 0 }}>{icon}</div>
      <div>
        <div style={{ fontSize: '11px', fontWeight: 900, color: 'var(--text)' }}>{label}</div>
        {desc && <div style={{ fontSize: '9px', fontWeight: 600, color: 'var(--text-3)', marginTop: '1px' }}>{desc}</div>}
      </div>
    </div>
    <div style={{ fontSize: '24px', fontWeight: 900, color: 'var(--text)', lineHeight: 1 }}>
      {value}{valueSuffix && <span style={{ fontSize: '12px', fontWeight: 700, color: accent, marginLeft: '4px' }}>{valueSuffix}</span>}
    </div>
    {sub && <div style={{ fontSize: '10px', color: 'var(--text-3)', fontWeight: 600, marginTop: '7px', borderTop: '1px solid var(--border)', paddingTop: '7px', lineHeight: 1.4 }}>{sub}</div>}
    <div style={{ position: 'absolute', right: '-8px', bottom: '-8px', width: '45px', height: '45px', borderRadius: '50%', background: accent, opacity: 0.05 }} />
  </div>
);

// ─── SECTION HEADER ──────────────────────────────────────────────────────────
const SectionHeader = ({ icon, title, desc }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid var(--border)' }}>
    <div style={{ fontSize: '18px' }}>{icon}</div>
    <div>
      <div style={{ fontSize: '13px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{title}</div>
      {desc && <div style={{ fontSize: '10px', color: 'var(--text-3)', marginTop: '2px' }}>{desc}</div>}
    </div>
  </div>
);

// ─── KPI BADGE ───────────────────────────────────────────────────────────────
const KpiBadge = ({ label, value, total, color }) => {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div style={{ flex: 1, background: 'var(--bg-elevated)', borderRadius: '10px', padding: '14px', border: `1px solid ${color}30` }}>
      <div style={{ fontSize: '9px', fontWeight: 800, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>{label}</div>
      <div style={{ fontSize: '22px', fontWeight: 900, color }}>{value}</div>
      <div style={{ fontSize: '10px', color: 'var(--text-3)', marginTop: '4px' }}>{pct}% jami maqsaddan</div>
      <div style={{ width: '100%', height: '3px', background: 'var(--border)', borderRadius: '2px', overflow: 'hidden', marginTop: '8px' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, transition: 'width 0.5s' }} />
      </div>
    </div>
  );
};

// ─── MAIN DASHBOARD ──────────────────────────────────────────────────────────
export default function SuperadminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState('7');

  const loadStats = useCallback(async (d) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/superadmin/stats?days=${d}`);
      const data = await res.json();
      setStats(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadStats(days); }, [days, loadStats]);

  if (loading) {
    return (
      <div className="app-layout">
        <Sidebar /><Navbar />
        <main className="main-content">
          <div className="loading-container"><div className="loading-spinner" /></div>
        </main>
      </div>
    );
  }

  const g = stats?.global || {};
  const f = stats?.financial || {};
  const k = stats?.kpi || {};
  const s = stats?.sales || {};
  const sub = stats?.subscriptionDist || {};
  const orgs = stats?.organizations || [];
  const operators = stats?.operatorStats || [];
  const selectedDayLabel = DAY_OPTIONS.find(d => d.value === days)?.label || '';

  // ─── Chart data ───────────────────────────────────────────────────────────
  const topOrgs = [...orgs].sort((a, b) => b.avgKpi - a.avgKpi).slice(0, 3);
  const radarMetrics = [{ metric: 'KPI %' }, { metric: 'Konversiya' }, { metric: 'Samaradorlik' }];
  topOrgs.forEach(o => {
    radarMetrics[0][o.name] = o.avgKpi || 0;
    radarMetrics[1][o.name] = o.totalCalls ? Math.round((o.qualityLeads / o.totalCalls) * 100) : 0;
    radarMetrics[2][o.name] = o.salaryFund > 0 ? Math.min(100, Math.round((o.revenue / o.salaryFund) * 20)) : 0;
  });

  const callsData = orgs.slice(0, 8).map(o => ({
    name: o.name.length > 10 ? o.name.slice(0, 10) + '…' : o.name,
    'Kiruvchi': o.incomingCalls || 0,
    'Chiquvchi': o.outgoingCalls || 0,
    'Ofis': o.officeVisits || 0,
  }));

  const financeData = orgs.map(o => ({
    name: o.name.length > 10 ? o.name.slice(0, 10) + '…' : o.name,
    Tushum: o.revenue || 0,
    Maosh: o.salaryFund || 0,
    'Sof Foyda': o.netProfit || 0,
  }));

  const pieData = orgs.filter(o => o.qualityLeads > 0).map(o => ({ name: o.name, value: o.qualityLeads }));

  const subscriptionPieData = [
    { name: 'Free', value: sub.FREE || 0 },
    { name: 'Basic', value: sub.BASIC || 0 },
    { name: 'Premium', value: sub.PREMIUM || 0 },
  ].filter(d => d.value > 0);

  const operatorChartData = [...operators]
    .sort((a, b) => b.qualityLeads - a.qualityLeads)
    .slice(0, 10)
    .map(op => ({
      name: op.name.split(' ')[0],
      Lidlar: op.qualityLeads,
      'Konv%': op.conversion,
    }));

  const kpiChartData = [
    { name: 'Bajardi', value: k.kpiAchieved || 0, color: '#10b981' },
    { name: 'Bajarmadi', value: k.kpiNotAchieved || 0, color: '#ef4444' },
    { name: '120%+ bajardi', value: k.kpiOverAchieved || 0, color: '#ffb268' },
  ].filter(d => d.value > 0);

  return (
    <div className="app-layout">
      <Sidebar /><Navbar />
      <main className="main-content">
        <div className="animate-in">

          {/* ─── HEADER ─── */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <div style={{ fontSize: '18px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Global Tizim Monitori</div>
              <div style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '4px', fontWeight: 600 }}>
                Ko'rsatilmoqda: <span style={{ color: '#ffb268' }}>{selectedDayLabel}</span> davridagi ma'lumotlar
              </div>
            </div>
            <DayFilter value={days} onChange={setDays} />
          </div>

          {/* ══════════════════════════════════════════════════════════════ */}
          {/* BLOK 1 — ASOSIY 8 TA KARTA                                    */}
          {/* ══════════════════════════════════════════════════════════════ */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
            <StatCard icon="💰" label="Umumiy Sotuvchilar Tushumi" desc="Barcha xodimlar tushirgan pul" value={fmt(s.totalRevenue)} valueSuffix="so'm" sub={`🛒 ${fmt(s.totalSales)} ta sotuv | ${selectedDayLabel}`} accent="#ffb268" />
            <StatCard icon="🎯" label="Jami Ishlangan Lidlar" desc="Sifatli natija chiqargan kontaktlar" value={fmt(s.monthQualityLeads)} valueSuffix="ta lid" sub={`📞 ${fmt(s.monthTotalCalls)} ta qo'ng'iroqdan`} accent="#3b82f6" />
            <StatCard icon="📈" label="Umumiy Konversiya" desc="Sifatli lid / Jami qo'ng'iroq" value={s.overallConversion || 0} valueSuffix="%" sub={`Formula: (Lid ÷ Qo'ng'iroq) × 100`} accent="#10b981" />
            <StatCard icon="💵" label="Sof Foyda (Net Profit)" desc="Tushum minus ish haqi xarajatlari" value={fmt(f.netProfit)} valueSuffix="so'm" sub={`Maosh xarajatlari: ${f.payrollToRevenueRatio || 0}% tushumdan`} accent={f.netProfit >= 0 ? '#10b981' : '#ef4444'} />
            <StatCard icon="📞" label="Bir Qo'ng'iroqdan Tushum" desc="O'rtacha har bir qo'ng'iroqdan daromad" value={fmt(s.revenuePerCall)} valueSuffix="so'm" sub={`Jami ${fmt(s.monthTotalCalls)} ta qo'ng'iroq`} accent="#8b5cf6" />
            <StatCard icon="👤" label="Bir Xodim Boshiga Tushum" desc="Har bir sotuvchi keltirgan o'rtacha daromad" value={fmt(s.revenuePerEmployee)} valueSuffix="so'm" sub={`${g.totalEmployees || 0} xodim bo'yicha hisob`} accent="#ec4899" />
            <StatCard icon="📲" label="Kiruvchi vs Chiquvchi" desc="Qo'ng'iroqlar yo'nalishi tahlili" value={fmt(s.totalIncomingCalls)} valueSuffix="kiruvchi" sub={`📤 ${fmt(s.totalOutgoingCalls)} ta chiquvchi | 🏢 ${fmt(s.totalOfficeVisits)} ofis`} accent="#06b6d4" />
            <StatCard icon="📊" label="Xodim Boshiga Kunlik Qo'ng'iroq" desc="O'rtacha bir xodim kuniga qancha qo'ng'iroq" value={s.avgCallsPerEmployeePerDay || 0} valueSuffix="ta/kun" sub={`${g.totalEmployees} xodim × ${s.avgCallsPerEmployeePerDay || 0} = ${fmt(s.monthTotalCalls)} jami`} accent="#84cc16" />
          </div>

          {/* ══════════════════════════════════════════════════════════════ */}
          {/* BLOK 2 — MOLIYAVIY & TASHKILOT KARTALAR                       */}
          {/* ══════════════════════════════════════════════════════════════ */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
            <StatCard icon="🏢" label="Tashkilotlar" desc="Jami registratsiya qilingan kompaniyalar" value={g.totalOrgs} valueSuffix="ta" sub={`✅ ${g.activeOrgs} aktiv | ⏸ ${g.frozenOrgs} muzlatilgan`} accent="#8b5cf6" />
            <StatCard icon="👥" label="Tizimda Xodimlar Soni" desc="Barcha aktiv sotuvchilar" value={g.totalEmployees} valueSuffix="xodim" sub={`💼 ${g.totalAdmins} ta Admin boshqarmoqda`} accent="#06b6d4" />
            <StatCard icon="🏆" label="O'rtacha KPI Bajarish" desc="Xodimlar maqsadlarini qancha foizda bajardi" value={k.avgKpiCompletion || 0} valueSuffix="%" sub={`✅ ${k.kpiAchieved || 0} bajardi | ❌ ${k.kpiNotAchieved || 0} bajarmadi`} accent="#ec4899" />
            <StatCard icon="💳" label="Ish Haqi Fondi" desc="Barcha kompaniyalardagi jami maoshlar" value={fmt(f.totalSalaryFund)} valueSuffix="so'm" sub={`🔴 Jarima: -${fmt(f.monthPenalties)} | 🟢 Bonus: +${fmt(f.monthBonuses)}`} accent="#f43f5e" />
          </div>

          {/* ══════════════════════════════════════════════════════════════ */}
          {/* BLOK 3 — KPI TAHLILI                                           */}
          {/* ══════════════════════════════════════════════════════════════ */}
          <div className="card glass-panel" style={{ padding: '20px', marginBottom: '20px' }}>
            <SectionHeader icon="🏆" title="KPI Bajarish Tahlili" desc={`${k.totalActiveKpis || 0} ta faol maqsad bo'yicha tahlil`} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <KpiBadge label="Maqsadga Yetdi ✅" value={k.kpiAchieved || 0} total={k.totalActiveKpis || 0} color="#10b981" />
              <KpiBadge label="Maqsadga Yetmadi ❌" value={k.kpiNotAchieved || 0} total={k.totalActiveKpis || 0} color="#ef4444" />
              <KpiBadge label="120%+ Bajardi 🚀" value={k.kpiOverAchieved || 0} total={k.totalActiveKpis || 0} color="#ffb268" />
              <div style={{ flex: 1, background: 'var(--bg-elevated)', borderRadius: '10px', padding: '14px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{ fontSize: '9px', fontWeight: 800, color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: '6px' }}>O'rtacha Bajarish</div>
                <div style={{ fontSize: '28px', fontWeight: 900, color: k.avgKpiCompletion >= 80 ? '#10b981' : k.avgKpiCompletion >= 50 ? '#f59e0b' : '#ef4444' }}>{k.avgKpiCompletion || 0}%</div>
                <div style={{ fontSize: '10px', color: 'var(--text-3)', marginTop: '4px' }}>
                  {k.avgKpiCompletion >= 80 ? '🟢 Yaxshi natija' : k.avgKpiCompletion >= 50 ? "🟡 O'rtacha" : '🔴 Past natija'}
                </div>
                {k.bestKpiOrg && <div style={{ fontSize: '10px', color: '#ffb268', marginTop: '8px', fontWeight: 700 }}>🥇 {k.bestKpiOrg.name}: {k.bestKpiOrg.value}%</div>}
              </div>
            </div>
            {/* KPI pie chart */}
            {kpiChartData.length > 0 && (
              <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                <div style={{ width: '180px', height: '180px', flexShrink: 0 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={kpiChartData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value" stroke="none">
                        {kpiChartData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <RechartsTooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {kpiChartData.map((d, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: d.color, flexShrink: 0 }} />
                      <div style={{ fontSize: '12px', fontWeight: 700, flex: 1 }}>{d.name}</div>
                      <div style={{ fontWeight: 900, color: d.color }}>{d.value} ta</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ══════════════════════════════════════════════════════════════ */}
          {/* BLOK 4 — QONG'IROQ TAHLILI + SUBSCRIPTION                     */}
          {/* ══════════════════════════════════════════════════════════════ */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '20px', marginBottom: '20px' }}>

            {/* Calls breakdown chart */}
            <div className="card glass-panel" style={{ padding: '20px' }}>
              <SectionHeader icon="📞" title="Qo'ng'iroqlar Tahlili" desc="Kiruvchi, chiquvchi va ofis tashrifi bo'yicha" />
              <div style={{ width: '100%', height: '260px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={callsData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
                    <XAxis dataKey="name" stroke="var(--text-3)" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="var(--text-3)" fontSize={10} tickLine={false} axisLine={false} />
                    <RechartsTooltip content={<CustomTooltip />} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 700 }} />
                    <Bar dataKey="Kiruvchi" fill="#06b6d4" radius={[3, 3, 0, 0]} barSize={14} />
                    <Bar dataKey="Chiquvchi" fill="#3b82f6" radius={[3, 3, 0, 0]} barSize={14} />
                    <Bar dataKey="Ofis" fill="#8b5cf6" radius={[3, 3, 0, 0]} barSize={14} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Subscription pie */}
            <div className="card glass-panel" style={{ padding: '20px' }}>
              <SectionHeader icon="📋" title="Subscriptsiya Taqsimoti" desc="Kompaniyalar tariflari bo'yicha" />
              <div style={{ width: '100%', height: '200px', position: 'relative' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={subscriptionPieData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={5} dataKey="value" stroke="none">
                      {subscriptionPieData.map((entry, i) => (
                        <Cell key={i} fill={PLAN_COLORS[entry.name.toUpperCase()] || COLORS[i]} />
                      ))}
                    </Pie>
                    <RechartsTooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                  <div style={{ fontSize: '20px', fontWeight: 900, color: 'var(--text)' }}>{g.totalOrgs || 0}</div>
                  <div style={{ fontSize: '9px', color: 'var(--text-3)', fontWeight: 700 }}>JAMI</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px', justifyContent: 'center' }}>
                {[{ k: 'FREE', c: '#6b7280' }, { k: 'BASIC', c: '#3b82f6' }, { k: 'PREMIUM', c: '#ffb268' }].map(({ k: key, c }) => (
                  <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '10px', fontWeight: 700 }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: c }} />
                    <span style={{ color: 'var(--text-2)' }}>{key}:</span>
                    <span style={{ color: c }}>{sub[key] || 0}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════════ */}
          {/* BLOK 5 — MOLIYAVIY TAHLIL + RADAR                             */}
          {/* ══════════════════════════════════════════════════════════════ */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '20px', marginBottom: '20px' }}>

            <div className="card glass-panel" style={{ padding: '20px' }}>
              <SectionHeader icon="💵" title="Tushum vs Maosh vs Sof Foyda" desc="Kompaniyalar bo'yicha moliyaviy tahlil" />
              <div style={{ width: '100%', height: '260px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={financeData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
                    <XAxis dataKey="name" stroke="var(--text-3)" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="var(--text-3)" fontSize={10} tickLine={false} axisLine={false} tickFormatter={v => v >= 1000000 ? (v / 1000000).toFixed(0) + 'M' : v} />
                    <RechartsTooltip content={<CustomTooltip />} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 700 }} />
                    <Bar dataKey="Tushum" barSize={22} fill="#ffb268" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="Maosh" barSize={22} fill="#3b82f6" radius={[3, 3, 0, 0]} />
                    <Line type="monotone" dataKey="Sof Foyda" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card glass-panel" style={{ padding: '20px' }}>
              <SectionHeader icon="🕸" title="TOP 3 Tashkilot Sifat Tahlili" desc="KPI, Konversiya, Samaradorlik" />
              <div style={{ width: '100%', height: '260px' }}>
                {topOrgs.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarMetrics}>
                      <PolarGrid stroke="var(--chart-grid)" />
                      <PolarAngleAxis dataKey="metric" tick={{ fill: 'var(--text-3)', fontSize: 10, fontWeight: 700 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                      <RechartsTooltip content={<CustomTooltip />} />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 700 }} />
                      {topOrgs.map((org, i) => (
                        <Radar key={org.id} name={org.name} dataKey={org.name} stroke={COLORS[i]} fill={COLORS[i]} fillOpacity={0.3} />
                      ))}
                    </RadarChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)', fontSize: '12px' }}>Ma'lumot yo'q</div>
                )}
              </div>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════════ */}
          {/* BLOK 6 — OPERATORLAR JADVALI                                  */}
          {/* ══════════════════════════════════════════════════════════════ */}
          <div className="card glass-panel" style={{ padding: '24px', marginBottom: '20px' }}>
            <SectionHeader icon="👨‍💼" title="Operatorlar Konversiyasi va Ko'rsatkichlari" desc={`Sotuvchi xodimlarning ${selectedDayLabel} davridagi to'liq statistikasi`} />
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['#', 'Xodim', 'Qo\'ng\'iroq', 'Kiruvchi', 'Chiquvchi', 'Ofis', 'Lid ✅', 'Lid ❌', 'Konversiya', 'Tushum', 'Har qo\'ng\'iroqdan', 'KPI'].map(h => (
                      <th key={h} style={{ padding: '8px 10px', color: 'var(--text-3)', textTransform: 'uppercase', fontSize: '8px', fontWeight: 900, letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {operators.length === 0 ? (
                    <tr><td colSpan={12} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-3)', fontSize: '12px' }}>Bu davr uchun ma'lumot yo'q</td></tr>
                  ) : operators.map((op, i) => {
                    const convColor = op.conversion >= 50 ? '#10b981' : op.conversion >= 25 ? '#f59e0b' : '#ef4444';
                    const kpiColor = op.avgKpi >= 80 ? '#10b981' : op.avgKpi >= 50 ? '#f59e0b' : '#ef4444';
                    return (
                      <tr key={op.id}
                        style={{ borderBottom: '1px solid var(--row-border)', background: i % 2 === 0 ? 'var(--row-hover)' : 'transparent', transition: 'background 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--row-hover)'}
                        onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? 'var(--row-hover)' : 'transparent'}
                      >
                        <td style={{ padding: '10px' }}>
                          {i < 3
                            ? <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: ['#ffb268', '#94a3b8', '#cd7f32'][i], display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '9px', color: '#0f172a' }}>{i + 1}</div>
                            : <div style={{ fontSize: '10px', color: 'var(--text-3)', fontWeight: 700, paddingLeft: '4px' }}>{i + 1}</div>}
                        </td>
                        <td style={{ padding: '10px' }}>
                          <div style={{ fontWeight: 800, color: 'var(--text)', whiteSpace: 'nowrap' }}>{op.name}</div>
                          <div style={{ fontSize: '9px', color: 'var(--text-3)', marginTop: '1px' }}>{op.email}</div>
                        </td>
                        <td style={{ padding: '10px', fontWeight: 700 }}>{op.totalCalls}</td>
                        <td style={{ padding: '10px', color: '#06b6d4', fontWeight: 700 }}>{op.incomingCalls || 0}</td>
                        <td style={{ padding: '10px', color: '#3b82f6', fontWeight: 700 }}>{op.outgoingCalls || 0}</td>
                        <td style={{ padding: '10px', color: '#8b5cf6', fontWeight: 700 }}>{op.officeVisits || 0}</td>
                        <td style={{ padding: '10px', color: '#10b981', fontWeight: 800 }}>{op.qualityLeads}</td>
                        <td style={{ padding: '10px', color: '#ef4444', fontWeight: 700 }}>{op.nonQualityLeads}</td>
                        <td style={{ padding: '10px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <div style={{ width: '40px', height: '4px', background: 'var(--border)', borderRadius: '2px', overflow: 'hidden' }}>
                              <div style={{ width: `${Math.min(100, op.conversion)}%`, height: '100%', background: convColor }} />
                            </div>
                            <span style={{ fontWeight: 800, color: convColor, fontSize: '11px' }}>{op.conversion}%</span>
                          </div>
                        </td>
                        <td style={{ padding: '10px', fontWeight: 800, color: '#ffb268', whiteSpace: 'nowrap' }}>{fmt(op.revenue)}</td>
                        <td style={{ padding: '10px', fontWeight: 700, color: 'var(--text-2)', whiteSpace: 'nowrap' }}>{fmt(op.revenuePerCall)}</td>
                        <td style={{ padding: '10px' }}>
                          <span style={{ fontWeight: 800, color: kpiColor }}>{op.avgKpi}%</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════════ */}
          {/* BLOK 7 — TASHKILOTLAR LEADERBOARD                             */}
          {/* ══════════════════════════════════════════════════════════════ */}
          <div className="card glass-panel" style={{ padding: '24px' }}>
            <SectionHeader icon="🏢" title={`Tashkilotlar Reytingi (${orgs.length})`} desc="Har bir kompaniyaning to'liq samaradorlik tahlili" />
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Tashkilot', 'Holat', 'Kapasite', 'Tushum', 'Sof Foyda', 'Xodim/Tushum', 'Konversiya', 'KPI', 'Qo\'ng\'iroq', 'Maosh Fondi'].map(h => (
                      <th key={h} style={{ padding: '10px 10px', color: 'var(--text-3)', textTransform: 'uppercase', fontSize: '8px', fontWeight: 900, letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {orgs.map((org, i) => {
                    const capColor = org.capacityUsed >= 80 ? '#ef4444' : org.capacityUsed >= 50 ? '#f59e0b' : '#10b981';
                    const convVal = org.totalCalls > 0 ? Math.round((org.qualityLeads / org.totalCalls) * 100) : 0;
                    const convColor = convVal >= 50 ? '#10b981' : convVal >= 25 ? '#f59e0b' : '#ef4444';
                    return (
                      <tr key={org.id}
                        style={{ borderBottom: '1px solid var(--row-border)', background: i % 2 === 0 ? 'var(--row-hover)' : 'transparent', transition: 'background 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--row-hover)'}
                        onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? 'var(--row-hover)' : 'transparent'}
                      >
                        <td style={{ padding: '12px 10px' }}>
                          <div style={{ fontWeight: 800, color: 'var(--text)', whiteSpace: 'nowrap' }}>{org.name}</div>
                          <div style={{ fontSize: '9px', color: 'var(--text-3)', marginTop: '1px' }}>{org.subscriptionPlan} • {org.phone || 'Tel yo\'q'}</div>
                        </td>
                        <td style={{ padding: '12px 10px' }}>
                          <div style={{ display: 'inline-flex', padding: '2px 8px', background: org.status === 'ACTIVE' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)', color: org.status === 'ACTIVE' ? '#10b981' : '#f59e0b', borderRadius: '20px', fontSize: '8px', fontWeight: 800, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                            {org.status}
                          </div>
                        </td>
                        <td style={{ padding: '12px 10px', minWidth: '100px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <div style={{ width: '40px', height: '4px', background: 'var(--border)', borderRadius: '2px', overflow: 'hidden' }}>
                              <div style={{ width: `${org.capacityUsed}%`, height: '100%', background: capColor }} />
                            </div>
                            <span style={{ color: capColor, fontWeight: 700, fontSize: '11px' }}>{org.capacityUsed}%</span>
                          </div>
                          <div style={{ fontSize: '9px', color: 'var(--text-3)', marginTop: '2px' }}>{org.employeeCount}/{org.maxEmployees}</div>
                        </td>
                        <td style={{ padding: '12px 10px', fontWeight: 800, color: '#ffb268', whiteSpace: 'nowrap' }}>{fmt(org.revenue)}</td>
                        <td style={{ padding: '12px 10px', fontWeight: 800, color: org.netProfit >= 0 ? '#10b981' : '#ef4444', whiteSpace: 'nowrap' }}>
                          {org.netProfit >= 0 ? '+' : ''}{fmt(org.netProfit)}
                        </td>
                        <td style={{ padding: '12px 10px', color: 'var(--text-2)', fontWeight: 700, whiteSpace: 'nowrap' }}>{fmt(org.revenuePerEmployee)}</td>
                        <td style={{ padding: '12px 10px' }}>
                          <span style={{ fontWeight: 800, color: convColor }}>{convVal}%</span>
                        </td>
                        <td style={{ padding: '12px 10px' }}>
                          <span style={{ fontWeight: 700, color: org.avgKpi >= 70 ? '#10b981' : org.avgKpi >= 40 ? '#f59e0b' : '#ef4444' }}>{org.avgKpi}%</span>
                        </td>
                        <td style={{ padding: '12px 10px', fontSize: '11px', color: 'var(--text-2)', whiteSpace: 'nowrap' }}>
                          📥{org.incomingCalls || 0} / 📤{org.outgoingCalls || 0}
                        </td>
                        <td style={{ padding: '12px 10px', whiteSpace: 'nowrap' }}>
                          <div style={{ fontSize: '11px', fontWeight: 800 }}>{fmt(org.salaryFund)}</div>
                          <div style={{ fontSize: '9px', color: 'var(--text-3)' }}>
                            <span style={{ color: '#ef4444' }}>-{fmt(org.penalties)}</span> / <span style={{ color: '#3b82f6' }}>+{fmt(org.bonuses)}</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {orgs.length === 0 && (
                    <tr><td colSpan={10} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-3)', fontSize: '12px' }}>Tashkilotlar ma'lumotlari yo'q</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
