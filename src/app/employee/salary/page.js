'use client';
import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';

export default function EmployeeSalaryPage() {
  const [penalties, setPenalties] = useState([]);
  const [bonuses, setBonuses] = useState([]);
  const [employee, setEmployee] = useState(null);
  const [kpis, setKpis] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/penalty-records').then(r => r.json()),
      fetch('/api/bonus-records').then(r => r.json()),
      fetch('/api/kpi').then(r => r.json()),
      fetch('/api/employees').then(r => r.json()),
    ]).then(([p, b, k, employees]) => {
      setPenalties(p); setBonuses(b); setKpis(k);
      // For employee view, we get our own data from employees list
      // But since employee can only see their own, just use context
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="app-layout"><Sidebar /><main className="main-content"><div className="loading-container"><div className="loading-spinner" /></div></main></div>;

  const totalPenalties = penalties.reduce((s, r) => s + r.amount, 0);
  const totalBonuses = bonuses.reduce((s, r) => s + r.amount, 0);
  const kpiBonus = kpis.reduce((sum, k) => {
    const pct = k.targetValue > 0 ? k.currentValue / k.targetValue : 0;
    return sum + (pct >= 1 ? 300000 : pct >= 0.8 ? 150000 : 0);
  }, 0);

  return (
    <div className="app-layout">
      <Sidebar />
      <Navbar />
      <main className="main-content">
        <div className="animate-in">
          <div style={{ marginBottom: '24px' }}>
            <div style={{ fontSize: '14px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px' }}>Moliya va Maosh</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: '4px' }}>Bonus, jarima va KPI hisob-kitobi</div>
          </div>

          <div className="stats-grid" style={{ marginBottom: '24px' }}>
            <div className="card glass-panel" style={{ borderLeft: '4px solid var(--accent-teal)' }}>
              <div style={{ fontSize: '9px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '1px' }}>KPI Bonus</div>
              <div style={{ fontSize: '24px', fontWeight: 950, color: 'var(--accent-teal)' }}>{(kpiBonus / 1000).toFixed(0)}K</div>
              <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '4px', fontWeight: 600 }}>UZS</div>
            </div>
            <div className="card glass-panel" style={{ borderLeft: '4px solid var(--primary-500)' }}>
              <div style={{ fontSize: '9px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '1px' }}>Jami Bonuslar</div>
              <div style={{ fontSize: '24px', fontWeight: 950, color: 'var(--primary-400)' }}>{(totalBonuses / 1000).toFixed(0)}K</div>
              <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '4px', fontWeight: 600 }}>UZS</div>
            </div>
            <div className="card glass-panel" style={{ borderLeft: '4px solid var(--danger-500)' }}>
              <div style={{ fontSize: '9px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '1px' }}>Jarimalar</div>
              <div style={{ fontSize: '24px', fontWeight: 950, color: 'var(--danger-500)' }}>{(totalPenalties / 1000).toFixed(0)}K</div>
              <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '4px', fontWeight: 600 }}>UZS</div>
            </div>
          </div>

          <div className="grid-2">
            <div className="card glass-panel">
              <div style={{ fontSize: '12px', fontWeight: 850, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '20px', color: 'var(--danger-400)' }}>Jarimalar Tarixi</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {penalties.length === 0 ? (
                  <div style={{ padding: '20px', textAlign: 'center', fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Jarima mavjud emas</div>
                ) : penalties.map(r => (
                  <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', background: 'rgba(239, 68, 68, 0.02)', borderRadius: '10px', border: '1px solid rgba(239, 68, 68, 0.05)' }}>
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 750, textTransform: 'uppercase' }}>{r.reason}</div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600, marginTop: '2px' }}>{new Date(r.date).toLocaleDateString('uz')}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ color: 'var(--danger-500)', fontWeight: 900, fontSize: '13px' }}>-{r.amount.toLocaleString()}</div>
                      <div style={{ fontSize: '8px', color: 'var(--text-muted)', fontWeight: 800 }}>UZS</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card glass-panel">
              <div style={{ fontSize: '12px', fontWeight: 850, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '20px', color: 'var(--accent-teal)' }}>Bonuslar Tarixi</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {bonuses.length === 0 ? (
                  <div style={{ padding: '20px', textAlign: 'center', fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Bonus mavjud emas</div>
                ) : bonuses.map(r => (
                  <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', background: 'rgba(16, 185, 129, 0.02)', borderRadius: '10px', border: '1px solid rgba(16, 185, 129, 0.05)' }}>
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 750, textTransform: 'uppercase' }}>{r.reason}</div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600, marginTop: '2px' }}>{new Date(r.date).toLocaleDateString('uz')}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ color: 'var(--accent-teal)', fontWeight: 900, fontSize: '13px' }}>+{r.amount.toLocaleString()}</div>
                      <div style={{ fontSize: '8px', color: 'var(--text-muted)', fontWeight: 800 }}>UZS</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
