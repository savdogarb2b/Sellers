'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';
import Link from 'next/link';

function DonutChart({ percent, color = 'var(--primary-500)', size = 80 }) {
  const r = 38;
  const circ = 2 * Math.PI * r;
  const dash = (Math.min(percent, 100) / 100) * circ;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
      <circle cx="50" cy="50" r={r} fill="none" stroke="var(--border-2)" strokeWidth="10" />
      <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="10" strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" style={{ transition: 'stroke-dasharray 1s ease-out' }} />
    </svg>
  );
}

function WorkCountdown({ workEndTime }) {
  const [remaining, setRemaining] = useState('');
  const [ended, setEnded] = useState(false);
  useEffect(() => {
    const tick = () => {
      if (!workEndTime) { setRemaining(''); return; }
      const [h, m] = workEndTime.split(':').map(Number);
      const now = new Date();
      const end = new Date(); end.setHours(h, m, 0, 0);
      const diff = end - now;
      if (diff <= 0) { setEnded(true); setRemaining('ISH TUGADI'); return; }
      const hrs = Math.floor(diff / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setRemaining(`${hrs}:${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}`);
    };
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [workEndTime]);
  if (!workEndTime || !remaining) return null;
  return (
    <div style={{ background: 'var(--bg-card)', padding: '10px 20px', borderRadius: '12px', border: '1px solid var(--border-color)', textAlign: 'right' }}>
      <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>{ended ? 'Vaqt:' : 'Tugashiga:'}</div>
      <div style={{ fontSize: '18px', fontWeight: 800, color: ended ? 'var(--primary-500)' : 'var(--text-primary)', fontFamily: 'monospace' }}>{remaining}</div>
    </div>
  );
}

export default function EmployeeDashboard() {
  const { data: session } = useSession();
  const [kpis, setKpis] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [penalties, setPenalties] = useState([]);
  const [bonuses, setBonuses] = useState([]);
  const [reports, setReports] = useState([]);
  const [funnel, setFunnel] = useState([]);
  const [userData, setUserData] = useState(null);
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSalaryModal, setShowSalaryModal] = useState(false);

  useEffect(() => {
    if (!session) return;
    Promise.all([
      fetch('/api/kpi').then(r => r.ok ? r.json() : []),
      fetch('/api/attendance').then(r => r.ok ? r.json() : []),
      fetch('/api/penalty-records').then(r => r.ok ? r.json() : []),
      fetch('/api/bonus-records').then(r => r.ok ? r.json() : []),
      fetch('/api/reports').then(r => r.ok ? r.json() : []),
      fetch('/api/employees').then(r => r.ok ? r.json() : []),
      fetch('/api/employee-plans').then(r => r.ok ? r.json() : []),
      fetch('/api/funnel').then(r => r.ok ? r.json() : []),
    ]).then(([k, a, p, b, rep, emps, plans, f]) => {
      setKpis(Array.isArray(k) ? k : []); 
      setAttendance(Array.isArray(a) ? a : []); 
      setPenalties(Array.isArray(p) ? p : []); 
      setBonuses(Array.isArray(b) ? b : []); 
      setReports(Array.isArray(rep) ? rep : []); 
      setFunnel(Array.isArray(f) ? f : []);

      const safeEmps = Array.isArray(emps) ? emps : [];
      const me = safeEmps.find(e => e.email === session?.user?.email) || safeEmps[0];
      setUserData(me);

      const safePlans = Array.isArray(plans) ? plans : [];
      setPlan(safePlans[0] || null);
      
      setLoading(false);
    }).catch(err => {
      console.error('Dashboard fetch error:', err);
      setLoading(false);
    });
  }, [session]);

  if (loading) return <div className="app-layout"><Sidebar /><Navbar /><main className="main-content"><div className="loading-container"><div className="loading-spinner" /></div></main></div>;

  const totalPenalties = penalties.reduce((s, r) => s + (r.amount || 0), 0);
  const totalBonuses = bonuses.reduce((s, r) => s + (r.amount || 0), 0);
  const todayAttendance = attendance.find(a => new Date(a.date).toDateString() === new Date().toDateString());
  const lateCount = attendance.filter(a => a.isLate).length;
  const todayReport = reports.find(r => new Date(r.date).toDateString() === new Date().toDateString());
  const hasReportToday = !!todayReport;

  const fixedSalary = userData?.fixedSalary || 0;
  const netSalary = fixedSalary + totalBonuses - totalPenalties;

  const kpiAvg = kpis.length > 0
    ? Math.round(kpis.reduce((s, k) => s + (k.targetValue > 0 ? (k.currentValue || 0) / k.targetValue * 100 : 0), 0) / kpis.length)
    : 0;

  const totalSales = reports.reduce((s, r) => s + (r.sales || 0), 0);
  const totalRevenue = reports.reduce((s, r) => s + (r.revenue || 0), 0);
  const totalFunnelLeads = reports.reduce((s, r) => s + (r.leadStatuses ? r.leadStatuses.reduce((acc, ls) => acc + ls.count, 0) : 0), 0);
  const conversion = totalFunnelLeads > 0 ? Math.round(totalSales / totalFunnelLeads * 100) : 0;
  const avgCheck = totalSales > 0 ? Math.round(totalRevenue / totalSales) : 0;
  
  const currentMonthSales = reports.filter(r => new Date(r.date).getMonth() === new Date().getMonth()).reduce((s, r) => s + (r.sales || 0), 0);
  const planProgress = plan && plan.targetSales > 0 ? Math.round(currentMonthSales / plan.targetSales * 100) : 0;

  // Streak Calculation
  let streak = 0;
  const sortedReports = [...reports].sort((a,b) => new Date(b.date) - new Date(a.date));
  let currentDate = new Date(); currentDate.setHours(0,0,0,0);
  for (let i=0; i<30; i++) {
    const d = new Date(currentDate); d.setDate(d.getDate() - i);
    const dayStr = d.toDateString();
    const rep = sortedReports.find(r => new Date(r.date).toDateString() === dayStr);
    if (rep && rep.sales > 0) { streak++; }
    else if (i === 0 && (!rep || rep.sales === 0)) { continue; } // ignore today if incomplete or 0
    else { break; }
  }

  // 14 day Activity Array
  const last14Days = Array.from({length: 14}, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (13 - i));
    const rep = reports.find(r => new Date(r.date).toDateString() === d.toDateString());
    return { date: d, calls: rep ? (rep.totalCalls || 0) : 0, sales: rep ? (rep.sales || 0) : 0 };
  });
  const maxActivity = Math.max(...last14Days.map(d => Math.max(d.calls, d.sales)), 1);

  // Personal Funnel logic
  const personalFunnelMap = {};
  reports.forEach(r => {
    if (r.leadStatuses) {
      r.leadStatuses.forEach(ls => {
        personalFunnelMap[ls.stageId] = (personalFunnelMap[ls.stageId] || 0) + (ls.count || 0);
      });
    }
  });
  const personalFunnel = funnel.map(stage => ({ ...stage, count: personalFunnelMap[stage.id] || 0 }));
  const maxPersonalFunnelCount = Math.max(...personalFunnel.map(f => f.count), 1);

  // AI Tip
  let aiTip = "Yaxshi natijalar barqarorlik bo'ladi. Bugun ham tinimsiz harakat qiling!";
  if (streak >= 3) aiTip = `Siz yonmoqdasiz! Qatorasiga ${streak} kun savdo qildingiz. Olovni o'chirmang! 🔥`;
  else if (conversion < 10 && totalFunnelLeads > 5) aiTip = "So'nggi paytlarda konversiya biroz pasaygan. Mijozlar qiziqishini orttirishga harakat qiling.";
  else if (planProgress < 50 && new Date().getDate() > 15) aiTip = "Oylik reja yarmiga yetmagan, qattiqroq ishlaymiz, siz uddalaysiz!";

  return (
    <div className="app-layout">
      <Sidebar />
      <Navbar />
      <main className="main-content">
        <div className="animate-in">
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '-0.5px' }}>Salom, {(session?.user?.name || 'Xodim').split(' ')[0]}!</h1>
              <p style={{ color: 'var(--text-muted)', fontWeight: 600, fontSize: '12px', marginTop: '4px' }}>Bugun {new Date().toLocaleDateString('uz', { month: 'long', day: 'numeric' })}, omadli ish kuni!</p>
            </div>
            <div style={{ display: 'flex', gap: '16px' }}>
              {streak >= 3 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--rose-glow)', border: '1px solid rgba(244,63,94,0.2)', padding: '8px 16px', borderRadius: '12px' }}>
                  <span style={{ fontSize: '18px' }}>🔥</span>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 900, color: 'var(--danger-500)' }}>{streak} Kun Streak</div>
                    <div style={{ fontSize: '9px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Ketma-ket savdo</div>
                  </div>
                </div>
              )}
              {conversion > 20 && currentMonthSales >= 5 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--violet-glow)', border: '1px solid rgba(139,92,246,0.2)', padding: '8px 16px', borderRadius: '12px' }}>
                  <span style={{ fontSize: '18px' }}>💎</span>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 900, color: '#a78bfa' }}>Usta Konversiya</div>
                    <div style={{ fontSize: '9px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Top Ko'rsatkich</div>
                  </div>
                </div>
              )}
              <WorkCountdown workEndTime={userData?.workEndTime} />
            </div>
          </div>

          <div style={{ background: 'linear-gradient(90deg, var(--primary-ghost), transparent)', borderLeft: '4px solid var(--primary)', padding: '16px 20px', borderRadius: '12px', marginBottom: '24px', display: 'flex', gap: '16px', alignItems: 'center', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '24px' }}>🤖</div>
            <div>
              <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--primary-400)', textTransform: 'uppercase', marginBottom: '4px', letterSpacing: '1px' }}>AI Maslahat</div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{aiTip}</div>
            </div>
          </div>

          <div className="stats-grid">
            <div className="card glass-panel" style={{ borderLeft: '4px solid ' + (todayAttendance ? (todayAttendance.isLate ? 'var(--warning-500)' : 'var(--accent-teal)') : 'var(--danger-500)'), padding: '20px' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '1px' }}>Bugungi Davomat</div>
              <div style={{ fontSize: '20px', fontWeight: 800, textTransform: 'uppercase' }}>
                {todayAttendance ? (todayAttendance.isLate ? 'Kechikdingiz' : 'Keldingiz') : 'Kelmadi'}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                {todayAttendance ? `Kirish: ${new Date(todayAttendance.checkInTime).toLocaleTimeString('uz', { hour: '2-digit', minute: '2-digit' })}` : 'Hali qayd etilmagan'}
              </div>
            </div>

            <div className="card glass-panel" style={{ borderLeft: '4px solid var(--accent-teal)', padding: '20px' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '1px' }}>Konversiya</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)' }}>{conversion}%</div>
                {conversion > 0 && <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--accent-teal)' }}>Sifatli</span>}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Sotuv / Sifatli Lid</div>
            </div>

            <div className="card glass-panel" style={{ borderLeft: '4px solid #8b5cf6', padding: '20px' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '1px' }}>O'rtacha Chek</div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)' }}>{avgCheck.toLocaleString()}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>UZS (Jami uzra)</div>
            </div>

            <div className="card glass-panel cursor-pointer hover-glow" onClick={() => setShowSalaryModal(true)} style={{ borderLeft: '4px solid var(--accent-blue)', padding: '20px', cursor: 'pointer', position: 'relative' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '1px' }}>Kutil. Maosh (Tafsilot)</div>
              <div style={{ fontSize: '20px', fontWeight: 800 }}>{netSalary.toLocaleString()} s.</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Joriy oydagi hisob</div>
              <div style={{ position: 'absolute', top: '20px', right: '20px', fontSize: '12px', color: 'var(--primary-400)' }}>🛈</div>
            </div>

            <div className="card glass-panel" style={{ borderLeft: '4px solid var(--warning-400)', padding: '20px' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '1px' }}>Reja Progress</div>
              {plan ? (
                <>
                  <div style={{ fontSize: '20px', fontWeight: 800 }}>{currentMonthSales} / <span style={{color: 'var(--primary-400)'}}>{plan.targetSales}</span> ({planProgress}%)</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Bu yilgi oylik reja</div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: '20px', fontWeight: 800 }}>—</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Belgilanmagan</div>
                </>
              )}
            </div>
            
            <div className="card glass-panel" style={{ borderLeft: '4px solid var(--primary-500)', padding: '20px' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '1px' }}>KPI O'rtacha</div>
              <div style={{ fontSize: '20px', fontWeight: 800 }}>{kpiAvg}%</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Kundalik maqsadlar bo'yicha</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '20px', marginBottom: '20px' }}>
            <div className="card glass-panel" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div style={{ fontSize: '13px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px' }}>Faollik Dinamikasi (14 Kun)</div>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <div style={{ width: '8px', height: '8px', background: 'var(--border-2)', borderRadius: '2px' }}/> 
                    <span style={{ fontSize: '9px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Qo'ng'iroq</span>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <div style={{ width: '8px', height: '8px', background: 'var(--accent-teal)', borderRadius: '2px' }}/> 
                    <span style={{ fontSize: '9px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Sotuv</span>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '180px', padding: '10px 0' }}>
                {last14Days.map((d, i) => {
                  const pCalls = maxActivity > 0 ? (d.calls / maxActivity) * 100 : 0;
                  const pSales = maxActivity > 0 ? (d.sales / maxActivity) * 100 : 0;
                  return (
                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                      <div style={{ display: 'flex', gap: '2px', alignItems: 'flex-end', height: '120px', width: '100%', justifyContent: 'center' }}>
                        <div style={{ height: `${pCalls}%`, width: '8px', background: 'var(--border-2)', borderRadius: '4px 4px 0 0', position: 'relative' }} title={`Qo'ng'iroqlar: ${d.calls}`}>
                          <div style={{ position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)', fontSize: '8px', color: 'var(--text-muted)', marginBottom: '4px' }}>{d.calls}</div>
                        </div>
                        <div style={{ height: `${pSales}%`, width: '8px', background: 'var(--accent-teal)', borderRadius: '4px 4px 0 0', boxShadow: pSales > 0 ? '0 0 8px rgba(16,185,129,0.3)' : 'none', position: 'relative' }} title={`Sotuvlar: ${d.sales}`}>
                          <div style={{ position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)', fontSize: '8px', color: 'var(--text-muted)', marginBottom: '4px' }}>{d.sales}</div>
                        </div>
                      </div>
                      <div style={{ fontSize: '8px', fontWeight: 800, color: 'var(--text-muted)', transform: 'rotate(-45deg)', marginTop: '8px' }}>{d.date.getDate()}/{d.date.getMonth()+1}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="card glass-panel" style={{ padding: '24px' }}>
              <div style={{ fontSize: '13px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '24px' }}>Shaxsiy Voronka (Jami)</div>
              {personalFunnel.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '10px' }}>
                  {personalFunnel.map((stage, i) => {
                    const pct = maxPersonalFunnelCount > 0 ? Math.round(stage.count / maxPersonalFunnelCount * 100) : 0;
                    return (
                      <div key={i}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', alignItems: 'center' }}>
                          <span style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase' }}>{stage.name}</span>
                          <span style={{ fontSize: '14px', fontWeight: 900, color: 'var(--primary-400)' }}>{stage.count}</span>
                        </div>
                        <div style={{ height: '8px', background: 'var(--border)', borderRadius: '10px', overflow: 'hidden' }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: `linear-gradient(90deg, var(--primary-500), var(--accent-blue))`, borderRadius: '10px' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="empty-state" style={{ padding: '40px' }}><div className="empty-state-text">Hech qanday ma'lumot yo'q</div></div>
              )}
            </div>
          </div>

        </div>
      </main>

      {showSalaryModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'var(--bg-overlay)', backdropFilter: 'blur(10px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={() => setShowSalaryModal(false)}>
          <div className="card glass-panel animate-in" style={{ width: '100%', maxWidth: '400px', padding: '24px', position: 'relative' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px' }}>Maosh Tarixi</div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Joriy oydagi operatsiyalar</div>
              </div>
              <button 
                onClick={() => setShowSalaryModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '24px', cursor: 'pointer', outline: 'none' }}
              >×</button>
            </div>
            
            <div style={{ background: 'var(--primary-ghost)', padding: '16px', borderRadius: '12px', marginBottom: '20px', textAlign: 'center', border: '1px solid var(--border-focus)' }}>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Yakuniy Miqdor</div>
              <div style={{ fontSize: '28px', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-1px' }}>{netSalary.toLocaleString()} UZS</div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto', paddingRight: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'var(--bg-elevated)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Fikslangan oylik</span>
                <span style={{ fontSize: '13px', fontWeight: 800 }}>{fixedSalary.toLocaleString()}</span>
              </div>
              
              <div style={{ margin: '8px 0', fontSize: '10px', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Bonuslar (+{(totalBonuses).toLocaleString()})</div>
              {bonuses.length === 0 ? <div style={{ fontSize: '11px', color: 'var(--text-ghost)', fontStyle: 'italic', paddingLeft: '8px' }}>Mavjud emas</div> : bonuses.map(b => (
                <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'var(--emerald-glow)', borderRadius: '8px', borderLeft: '3px solid var(--emerald)' }}>
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 700 }}>{b.reason}</div>
                    <div style={{ fontSize: '9px', color: 'var(--text-muted)', marginTop: '2px' }}>{new Date(b.date).toLocaleDateString()}</div>
                  </div>
                  <span style={{ fontSize: '13px', fontWeight: 900, color: 'var(--accent-teal)' }}>+{b.amount.toLocaleString()}</span>
                </div>
              ))}

              <div style={{ margin: '8px 0', fontSize: '10px', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Jarimalar (-{(totalPenalties).toLocaleString()})</div>
              {penalties.length === 0 ? <div style={{ fontSize: '11px', color: 'var(--text-ghost)', fontStyle: 'italic', paddingLeft: '8px' }}>Mavjud emas</div> : penalties.map(p => (
                <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'var(--rose-glow)', borderRadius: '8px', borderLeft: '3px solid var(--rose)' }}>
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 700 }}>{p.reason}</div>
                    <div style={{ fontSize: '9px', color: 'var(--text-muted)', marginTop: '2px' }}>{new Date(p.date).toLocaleDateString()}</div>
                  </div>
                  <span style={{ fontSize: '13px', fontWeight: 900, color: 'var(--danger-500)' }}>-{p.amount.toLocaleString()}</span>
                </div>
              ))}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
