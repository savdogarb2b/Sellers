'use client';
import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';

export default function EmployeeKPIPage() {
  const [kpis, setKpis] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetch('/api/kpi').then(r => r.json()).then(d => { setKpis(d); setLoading(false); }); }, []);

  // Group by user
  const grouped = kpis.reduce((acc, k) => {
    const name = k.user?.name || 'Noma\'lum';
    if (!acc[name]) acc[name] = [];
    acc[name].push(k);
    return acc;
  }, {});

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-header"><h1> Oylik KPI</h1><p>Barcha xodimlar KPI ko'rsatkichlari</p></div>
        {loading ? <div className="loading-container"><div className="loading-spinner" /></div> : (
          <div className="animate-in">
            {Object.entries(grouped).map(([name, userKpis]) => (
              <div className="card" key={name}>
                <div className="card-title" style={{ marginBottom: '16px' }}>{name}</div>
                {userKpis.map(k => {
                  const pct = k.targetValue > 0 ? Math.round(k.currentValue / k.targetValue * 100) : 0;
                  return (
                    <div key={k.id} style={{ marginBottom: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 600 }}>{k.name}</span>
                        <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{k.currentValue}/{k.targetValue} ({pct}%)</span>
                      </div>
                      <div className="progress-bar">
                        <div className={`progress-bar-fill ${pct >= 100 ? '' : pct >= 50 ? 'warning' : 'danger'}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
