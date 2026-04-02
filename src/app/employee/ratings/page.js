'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';

export default function EmployeeRatingsPage() {
  const { data: session } = useSession();
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

  const myIndex = ratings.findIndex(r => r.id === session?.user?.id);
  const myRating = ratings[myIndex];

  const medalEmoji = (i) => i === 0 ? '' : i === 1 ? '' : i === 2 ? '' : null;
  const getRankClass = (i) => i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : 'normal';

  return (
    <div className="app-layout">
      <Sidebar />
      <Navbar />
      <main className="main-content">
        <div className="animate-in">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px' }}>Liderlar Reytingi</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: '4px' }}>Oylik ko'rsatkichlar monitoringi</div>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <select className="form-input" style={{ width: '140px', fontSize: '11px', height: '36px', textTransform: 'uppercase' }} value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))}>
                {Array.from({length: 12}, (_, i) => <option key={i+1} value={i+1}>{i+1}-OY REYTINGI</option>)}
              </select>
              <select className="form-input" style={{ width: '100px', fontSize: '11px', height: '36px' }} value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))}>
                {Array.from({length: 5}, (_, i) => <option key={i} value={new Date().getFullYear() - i}>{new Date().getFullYear() - i}-YIL</option>)}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="loading-container"><div className="loading-spinner" /></div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

              {/* My position summary */}
              {myRating && (
                <div className="card glass-panel" style={{ borderLeft: '4px solid var(--primary-500)', display: 'flex', alignItems: 'center', gap: '24px', padding: '24px' }}>
                  <div style={{ textAlign: 'center', minWidth: '80px' }}>
                    <div style={{ fontSize: '32px', fontWeight: 950, letterSpacing: '-2px', color: 'var(--primary-400)' }}>#{myIndex + 1}</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase' }}>O'RNINGIZ</div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '18px', fontWeight: 900, color: 'var(--text-primary)', textTransform: 'uppercase' }}>{myRating.name}</div>
                    <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
                      <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Sotuvlar: <span style={{ color: 'var(--text-primary)' }}>{myRating.totalSales}</span></div>
                      <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Konversiya: <span style={{ color: 'var(--text-primary)' }}>{myRating.conversion}%</span></div>
                      <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Ball: <span style={{ color: 'var(--primary-400)' }}>{myRating.score}</span></div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '24px', flexShrink: 0 }}>
                    {myIndex > 0 && (
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase' }}>Keyingi pog'ona</div>
                        <div style={{ fontSize: '14px', fontWeight: 900, color: 'var(--danger-500)', marginTop: '2px' }}>
                          -{ratings[myIndex - 1].score - myRating.score} BALL
                        </div>
                      </div>
                    )}
                    {myIndex < ratings.length - 1 && (
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase' }}>Ustunlik</div>
                        <div style={{ fontSize: '14px', fontWeight: 900, color: 'var(--accent-teal)', marginTop: '2px' }}>
                          +{myRating.score - ratings[myIndex + 1].score} BALL
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Full list */}
              <div className="card glass-panel">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Top Reyting</div>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)' }}>{ratings.length} NAZORATCHI</div>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {ratings.map((r, i) => {
                    const isMe = r.email === session?.user?.email;
                    const rankColor = i === 0 ? 'var(--primary-500)' : i === 1 ? '#cbd5e1' : i === 2 ? '#b45309' : 'var(--text-muted)';
                    return (
                      <div key={r.id} style={{
                        display: 'flex', alignItems: 'center', gap: '16px', padding: '12px 16px',
                        background: isMe ? 'rgba(124,58,237,0.05)' : 'var(--bg-elevated)',
                        borderRadius: '12px',
                        border: isMe ? '1px solid rgba(124,58,237,0.1)' : '1px solid var(--border)',
                        transition: 'all 0.2s ease'
                      }}>
                        <div style={{ 
                          width: '32px', height: '32px', borderRadius: '8px', 
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '14px', fontWeight: 950, color: i < 3 ? '#0f172a' : 'var(--text-muted)',
                          background: i < 3 ? rankColor : 'var(--bg-elevated)'
                        }}>
                          {i + 1}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '13px', fontWeight: isMe ? 850 : 700, color: 'var(--text-primary)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {r.name}
                            {isMe && <span style={{ fontSize: '8px', background: 'var(--primary-500)', color: '#0f172a', padding: '2px 6px', borderRadius: '4px', fontWeight: 900 }}>MEN</span>}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, marginTop: '2px' }}>
                            SOTUVLAR: {r.totalSales} | KONVERSIYA: {r.conversion}%
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '16px', fontWeight: 950, color: i < 3 ? rankColor : 'var(--text-primary)' }}>{r.score}</div>
                          <div style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: 800 }}>BALL</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
