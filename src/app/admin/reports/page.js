'use client';
import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';

export default function AdminReportsPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/reports').then(r => r.json()).then(d => {
      setReports(d);
      setLoading(false);
    });
  }, []);

  return (
    <div className="app-layout">
      <Sidebar />
      <Navbar />
      <main className="main-content">
        <div className="animate-in">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div>
              <div style={{ fontSize: '16px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Kunlik Hisobotlar</div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: '4px' }}>Barcha xodimlarning savdo natijalari</div>
            </div>
          </div>

          {loading ? (
            <div className="loading-container"><div className="loading-spinner" /></div>
          ) : reports.length === 0 ? (
            <div className="card glass-panel" style={{ padding: '60px', textAlign: 'center' }}>
              <div className="empty-state">
                <div style={{ fontSize: '14px', fontWeight: 900, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Hozircha hisobotlar yo'q</div>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {reports.map(r => (
                <div key={r.id} className="card glass-panel" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', marginBottom: '4px' }}>
                      {r.user?.name || 'Xodim'} 
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginLeft: '8px', fontWeight: 600 }}>
                        {new Date(r.date).toLocaleDateString('uz-UZ', { weekday: 'short', month: 'long', day: 'numeric' })}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '16px', fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, marginTop: '8px' }}>
                      <span style={{color: 'var(--text-primary)'}}>Qo'ng'iroqlar: {r.totalCalls}</span>
                      <span style={{color: 'var(--accent-blue)'}}>Uchrashuvlar: {r.officeVisits}</span>
                      <span style={{color: 'var(--accent-teal)'}}>Sotuvlar: {r.sales} ({(r.revenue || 0).toLocaleString()} UZS)</span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', background: 'var(--bg-input)', padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                       <span style={{ fontSize: '9px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Sifatli Lid</span>
                       <span style={{ fontSize: '15px', fontWeight: 800, color: 'var(--primary-400)' }}>{r.qualityLeads}</span>
                    </div>
                    {r.nonQualityLeads > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', background: 'rgba(239, 68, 68, 0.05)', padding: '6px 12px', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.1)' }}>
                         <span style={{ fontSize: '9px', fontWeight: 700, color: 'var(--danger-500)', textTransform: 'uppercase' }}>Sifatsiz</span>
                         <span style={{ fontSize: '15px', fontWeight: 800, color: 'var(--danger-500)' }}>{r.nonQualityLeads}</span>
                      </div>
                    )}
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
