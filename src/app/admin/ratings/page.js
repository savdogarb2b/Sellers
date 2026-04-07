'use client';
import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';

export default function RatingsPage() {
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => { 
    setLoading(true);
    fetch(`/api/ratings?month=${selectedMonth}&year=${selectedYear}`)
      .then(r => r.json())
      .then(d => { setRatings(d); setLoading(false); }); 
  }, [selectedMonth, selectedYear]);

  const monthNames = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'];

  // Top 3 leaders
  const top3 = ratings.slice(0, 3);
  const restRatings = ratings.slice(3);

  // Stats
  const totalSales = ratings.reduce((s, r) => s + (r.totalSales || 0), 0);
  const totalCalls = ratings.reduce((s, r) => s + (r.totalCalls || 0), 0);
  const avgConversion = ratings.length > 0 ? (ratings.reduce((s, r) => s + (r.conversion || 0), 0) / ratings.length).toFixed(1) : 0;
  const maxScore = ratings.length > 0 ? ratings[0]?.score || 0 : 0;

  const podiumOrder = [1, 0, 2]; // Silver, Gold, Bronze display order
  const podiumHeights = ['140px', '180px', '110px'];
  const podiumColors = ['#94a3b8', 'var(--primary-500)', '#b45309'];
  const podiumBg = ['rgba(148, 163, 184, 0.06)', 'rgba(124, 58, 237, 0.08)', 'rgba(180, 83, 9, 0.06)'];
  const podiumBorder = ['rgba(148, 163, 184, 0.15)', 'rgba(124, 58, 237, 0.25)', 'rgba(180, 83, 9, 0.15)'];
  const podiumLabels = ['2-O\'RIN', '1-O\'RIN', '3-O\'RIN'];

  return (
    <div className="app-layout">
      <Sidebar />
      <Navbar />
      <main className="main-content">
        <div className="animate-in">
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div>
              <div style={{ fontSize: '16px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Liderlar Reytingi</div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: '4px' }}>
                {monthNames[selectedMonth - 1]} {selectedYear} — Oylik ko'rsatkichlar monitoringi
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <select className="form-input" style={{ width: 140, fontSize: '11px', height: '36px', textTransform: 'uppercase', background: 'var(--bg-input)' }} value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))}>
                {Array.from({length: 12}, (_, i) => <option key={i+1} value={i+1}>{monthNames[i].toUpperCase()}</option>)}
              </select>
              <select className="form-input" style={{ width: 100, fontSize: '11px', height: '36px', background: 'var(--bg-input)' }} value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))}>
                {Array.from({length: 5}, (_, i) => <option key={i} value={new Date().getFullYear() - i}>{new Date().getFullYear() - i}-YIL</option>)}
              </select>
            </div>
          </div>

          {loading ? <div className="loading-container"><div className="loading-spinner" /></div> : ratings.length === 0 ? (
            <div className="card glass-panel" style={{ padding: '80px', textAlign: 'center' }}>
              <div style={{ fontSize: '14px', fontWeight: 900, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Bu oy uchun reyting ma'lumotlari yo'q</div>
            </div>
          ) : (
            <>
              {/* Stats Grid */}
              <div className="stats-grid" style={{ marginBottom: '24px' }}>
                <div className="card glass-panel" style={{ borderLeft: '4px solid var(--primary-500)', padding: '20px' }}>
                  <div style={{ fontSize: '9px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '1px' }}>Jami Sotuvlar</div>
                  <div style={{ fontSize: '24px', fontWeight: 800 }}>{totalSales}</div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px', fontWeight: 600 }}>Barcha xodimlar</div>
                </div>
                <div className="card glass-panel" style={{ borderLeft: '4px solid var(--accent-teal)', padding: '20px' }}>
                  <div style={{ fontSize: '9px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '1px' }}>Jami Qo'ng'iroqlar</div>
                  <div style={{ fontSize: '24px', fontWeight: 800 }}>{totalCalls}</div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px', fontWeight: 600 }}>Oylik aloqalar</div>
                </div>
                <div className="card glass-panel" style={{ borderLeft: '4px solid var(--accent-blue)', padding: '20px' }}>
                  <div style={{ fontSize: '9px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '1px' }}>O'rtacha Konv.</div>
                  <div style={{ fontSize: '24px', fontWeight: 800 }}>{avgConversion}%</div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px', fontWeight: 600 }}>Jamoa samaradorligi</div>
                </div>
                <div className="card glass-panel" style={{ borderLeft: '4px solid var(--border-color)', padding: '20px' }}>
                  <div style={{ fontSize: '9px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '1px' }}>Eng Yuqori Ball</div>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--primary-400)' }}>{maxScore}</div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px', fontWeight: 600 }}>{ratings[0]?.name || '—'}</div>
                </div>
              </div>

              {/* Podium — Top 3 */}
              {top3.length >= 3 && (
                <div className="card glass-panel animate-in" style={{ padding: '32px', marginBottom: '20px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '2px', textAlign: 'center', color: 'var(--text-muted)', marginBottom: '32px' }}>TOP LIDERLAR</div>
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: '16px', maxWidth: '600px', margin: '0 auto' }}>
                    {podiumOrder.map((idx, pos) => {
                      const leader = top3[idx];
                      if (!leader) return null;
                      return (
                        <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          {/* Avatar */}
                          <div style={{
                            width: pos === 1 ? '64px' : '52px',
                            height: pos === 1 ? '64px' : '52px',
                            borderRadius: '50%',
                            background: `linear-gradient(135deg, ${podiumColors[pos]}, ${podiumColors[pos]}88)`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: 950, fontSize: pos === 1 ? '24px' : '20px',
                            color: '#0f172a',
                            boxShadow: `0 8px 24px ${podiumColors[pos]}33`,
                            marginBottom: '12px',
                            border: `3px solid ${podiumColors[pos]}`,
                          }}>
                            {leader.name?.charAt(0)}
                          </div>
                          <div style={{ fontSize: '13px', fontWeight: 900, textTransform: 'uppercase', textAlign: 'center', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '150px' }}>{leader.name}</div>
                          <div style={{ fontSize: '18px', fontWeight: 950, color: podiumColors[pos], marginBottom: '4px' }}>{leader.score}</div>
                          <div style={{ fontSize: '9px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>BALL</div>
                          {/* Podium Block */}
                          <div style={{
                            width: '100%',
                            height: podiumHeights[pos],
                            background: podiumBg[pos],
                            border: `1px solid ${podiumBorder[pos]}`,
                            borderRadius: '16px 16px 0 0',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                            gap: '8px',
                            position: 'relative',
                          }}>
                            <div style={{ fontSize: '10px', fontWeight: 900, color: podiumColors[pos], textTransform: 'uppercase', letterSpacing: '1px' }}>{podiumLabels[pos]}</div>
                            <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700 }}>
                              Sotuv: {leader.totalSales}
                            </div>
                            <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700 }}>
                              Konversiya: {leader.conversion}%
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Full Leaderboard */}
              <div className="card glass-panel animate-in" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>To'liq Reyting Jadvali</div>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)' }}>{ratings.length} XODIM</div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {ratings.map((r, i) => {
                    const isTop3 = i < 3;
                    const rankColors = ['var(--primary-500)', '#94a3b8', '#ca8a04'];
                    const barWidth = maxScore > 0 ? Math.max((r.score / maxScore) * 100, 5) : 5;
                    
                    return (
                      <div key={r.id} className="animate-in" style={{
                        display: 'flex', alignItems: 'center', gap: '14px',
                        padding: '12px 16px',
                        background: isTop3 ? `${rankColors[i]}08` : 'var(--bg-input)',
                        borderRadius: '12px',
                        border: isTop3 ? `1px solid ${rankColors[i]}20` : '1px solid var(--border-subtle)',
                        transition: 'all 0.2s ease',
                        animationDelay: `${i * 0.03}s`,
                      }}>
                        {/* Rank */}
                        <div style={{
                          width: '32px', height: '32px', borderRadius: '8px',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '12px', fontWeight: 800,
                          color: isTop3 ? '#000' : 'var(--text-muted)',
                          background: isTop3 ? rankColors[i] : 'var(--bg-deeper)',
                          flexShrink: 0,
                          boxShadow: isTop3 ? `0 4px 12px ${rankColors[i]}30` : 'none',
                        }}>
                          {i + 1}
                        </div>

                        {/* Name & Details */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                            <span style={{ fontSize: '12px', fontWeight: isTop3 ? 800 : 700, textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.name}</span>
                          </div>
                          {/* Score Bar */}
                          <div style={{ height: '4px', background: 'var(--bg-input)', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{
                              width: `${barWidth}%`,
                              height: '100%',
                              borderRadius: '4px',
                              background: isTop3 ? `linear-gradient(90deg, ${rankColors[i]}, ${rankColors[i]}88)` : 'var(--primary-500)',
                              transition: 'width 1s ease',
                            }} />
                          </div>
                        </div>

                        {/* Metrics */}
                        <div style={{ display: 'flex', gap: '16px', flexShrink: 0, alignItems: 'center' }}>
                          <div style={{ textAlign: 'center', minWidth: '40px' }}>
                            <div style={{ fontSize: '12px', fontWeight: 800 }}>{r.totalSales}</div>
                            <div style={{ fontSize: '8px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Sotuv</div>
                          </div>
                          <div style={{ textAlign: 'center', minWidth: '70px' }}>
                            <div style={{ fontSize: '12px', fontWeight: 800, color: '#8b5cf6' }}>
                              {r.revenue >= 1000000 ? (r.revenue / 1000000).toFixed(1) + 'M' : (r.revenue || 0).toLocaleString()}
                            </div>
                            <div style={{ fontSize: '8px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Aylanma</div>
                          </div>
                          <div style={{ textAlign: 'center', minWidth: '40px' }}>
                            <div style={{ fontSize: '12px', fontWeight: 800 }}>{r.totalCalls}</div>
                            <div style={{ fontSize: '8px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Aloqa</div>
                          </div>
                          <div style={{ textAlign: 'center', minWidth: '40px' }}>
                            <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--accent-teal)' }}>{r.conversion}%</div>
                            <div style={{ fontSize: '8px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Konv.</div>
                          </div>
                          <div style={{ width: '1px', height: '24px', background: 'var(--border-color)' }} />
                          <div style={{ textAlign: 'center', minWidth: '40px' }}>
                            <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--accent-teal)' }}>+{(r.totalBonuses || 0).toLocaleString()}</div>
                            <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--danger-400)', marginTop: '2px' }}>-{(r.totalPenalties || 0).toLocaleString()}</div>
                          </div>
                          <div style={{ width: '1px', height: '24px', background: 'var(--border-color)' }} />
                          <div style={{ textAlign: 'right', minWidth: '40px' }}>
                            <div style={{ fontSize: '16px', fontWeight: 800, color: isTop3 ? rankColors[i] : 'var(--text-primary)' }}>{r.score}</div>
                            <div style={{ fontSize: '8px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Ball</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
