'use client';
import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';

export default function CheckinPage() {
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');
  const [time, setTime] = useState('');
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [allAttendance, setAllAttendance] = useState([]);
  const [userData, setUserData] = useState(null);
  const [workEndRemaining, setWorkEndRemaining] = useState('');

  useEffect(() => {
    // Clock
    const updateTime = () => {
      setTime(new Date().toLocaleTimeString('uz', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const clockIv = setInterval(updateTime, 1000);

    // Fetch data
    Promise.all([
      fetch('/api/attendance').then(r => r.json()),
      fetch('/api/employees').then(r => r.json()),
    ]).then(([data, emps]) => {
      setAllAttendance(data);
      const me = emps[0];
      setUserData(me);
      const today = data.find(a => new Date(a.date).toDateString() === new Date().toDateString());
      if (today) {
        setTodayAttendance(today);
        setStatus('done');
        const defaultWarningMessage = me?.latenessMessage || 'Hozircha ogohlantirish berildi. 3-kechikishdan boshlab jarima yoziladi.';
        setMessage(today.isLate
          ? ((today.warningIssued || me?.latenessState === 'WARNING')
              ? `Kechikib keldingiz (${today.lateMinutes} daqiqa). ${today.warningMessage || defaultWarningMessage}`
              : `Kechikib keldingiz (${today.lateMinutes} daqiqa, jarima: ${today.penaltyApplied?.toLocaleString()} so'm)`) 
          : 'Bugun muvaffaqiyatli keldingiz! ');
      } else {
        setStatus('ready');
      }
    });

    return () => clearInterval(clockIv);
  }, []);

  // Countdown
  useEffect(() => {
    if (!userData?.workEndTime) return;
    const tick = () => {
      const [h, m] = userData.workEndTime.split(':').map(Number);
      const now = new Date();
      const end = new Date(); end.setHours(h, m, 0, 0);
      const diff = end - now;
      if (diff <= 0) { setWorkEndRemaining('Ish vaqti tugadi 🏁'); return; }
      const hrs = Math.floor(diff / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setWorkEndRemaining(`${hrs}:${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}`);
    };
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [userData]);

  const handleCheckin = async () => {
    setStatus('loading');
    setMessage('Tasdiqlanmoqda...');
    try {
      const res = await fetch('/api/attendance', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus('done');
        setTodayAttendance(data);
        setMessage(data.isLate
          ? (data.warningIssued
              ? `Kechikib keldingiz! (${data.lateMinutes} daqiqa). ${data.warningMessage}`
              : `Kechikib keldingiz! (${data.lateMinutes} daqiqa, jarima: ${data.penaltyApplied?.toLocaleString()} so'm)`) 
          : ' Muvaffaqiyatli keldingiz!');
        const upd = await fetch('/api/attendance').then(r => r.json());
        setAllAttendance(upd);
      } else {
        setStatus('error');
        setMessage(data.error || 'Xatolik yuz berdi');
      }
    } catch (err) {
      setStatus('error');
      setMessage(err.message || 'Xatolik yuz berdi');
    }
  };

  // Last 30 days of attendance with details
  const last30 = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (29 - i));
    const rec = allAttendance.find(a => new Date(a.date).toDateString() === d.toDateString());
    return { date: d, rec };
  }).reverse().filter(x => x.rec || x.date <= new Date());

  return (
    <div className="app-layout">
      <Sidebar />
      <Navbar />
      <main className="main-content">
        <div className="animate-in">
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
            <div className="card glass-panel">
              <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '24px', letterSpacing: '1px' }}>Nazorat Punkti</div>
              
              {userData && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '32px', marginBottom: '32px', background: 'var(--bg-card)', padding: '20px', borderRadius: '16px' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Ish boshlash</div>
                    <div style={{ fontSize: '20px', fontWeight: 900, color: 'var(--primary-400)' }}>{userData.workStartTime}</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Ish tugash</div>
                    <div style={{ fontSize: '20px', fontWeight: 900, color: 'var(--accent-400)' }}>{userData.workEndTime}</div>
                  </div>
                  {workEndRemaining && (
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Tugashiga qoldi</div>
                      <div style={{ fontSize: '16px', fontWeight: 900, color: 'var(--warning-400)', fontFamily: 'monospace' }}>{workEndRemaining}</div>
                    </div>
                  )}
                </div>
              )}

              <div className="checkin-container" style={{ paddingTop: 0, textAlign: 'center' }}>
                <div className="checkin-time" style={{ fontSize: '48px', fontWeight: 950, letterSpacing: '-2px', marginBottom: '4px' }}>{time}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '32px', fontWeight: 600, textTransform: 'uppercase' }}>
                  {new Date().toLocaleDateString('uz', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
                
                <button
                  className={`checkin-btn ${status}`}
                  onClick={status === 'ready' ? handleCheckin : undefined}
                  disabled={status !== 'ready'}
                  style={{ 
                    width: '180px', 
                    height: '180px', 
                    borderRadius: '50%', 
                    border: '4px solid var(--border-color)',
                    background: status === 'done' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(124, 58, 237, 0.1)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Hozirgi holat:</span>
                  <span style={{ fontSize: '18px', marginTop: '8px', fontWeight: 900, textTransform: 'uppercase' }}>
                    {status === 'loading' ? 'KUTING...' : status === 'done' ? 'TASDIQLANDI' : status === 'error' ? 'XATOLIK' : 'TASDIQLASH'}
                  </span>
                </button>

                {message && (
                  <div style={{
                    color: status === 'done' ? (todayAttendance?.isLate ? 'var(--warning-400)' : 'var(--accent-teal)') : 'var(--danger-400)',
                    marginTop: '24px', fontSize: '14px', fontWeight: 700, textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.5px'
                  }}>
                    {message}
                  </div>
                )}

                {todayAttendance && (
                  <div style={{ marginTop: '24px', display: 'flex', gap: '12px', justifyContent: 'center' }}>
                    <div style={{ padding: '8px 16px', borderRadius: '12px', background: 'var(--bg-elevated)', border: '1px solid var(--border-color)' }}>
                      <div style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Kirish</div>
                      <div style={{ fontSize: '14px', fontWeight: 800 }}>{new Date(todayAttendance.checkInTime).toLocaleTimeString('uz', { hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                    {todayAttendance.lateMinutes > 0 && (
                      <div style={{ padding: '8px 16px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.1)' }}>
                        <div style={{ fontSize: '9px', color: 'var(--danger-400)', textTransform: 'uppercase' }}>Kechikish</div>
                        <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--danger-400)' }}>{todayAttendance.lateMinutes} daq</div>
                      </div>
                    )}
                    {todayAttendance.isLate && (
                      <div style={{ padding: '8px 16px', borderRadius: '12px', background: (todayAttendance.warningIssued || userData?.latenessState === 'WARNING') ? 'rgba(245, 158, 11, 0.08)' : 'rgba(239, 68, 68, 0.05)', border: (todayAttendance.warningIssued || userData?.latenessState === 'WARNING') ? '1px solid rgba(245, 158, 11, 0.18)' : '1px solid rgba(239, 68, 68, 0.1)' }}>
                        <div style={{ fontSize: '9px', color: (todayAttendance.warningIssued || userData?.latenessState === 'WARNING') ? 'var(--warning-500)' : 'var(--danger-400)', textTransform: 'uppercase' }}>
                          {(todayAttendance.warningIssued || userData?.latenessState === 'WARNING') ? 'Ogohlantirish' : 'Jarima holati'}
                        </div>
                        <div style={{ fontSize: '12px', fontWeight: 800, color: (todayAttendance.warningIssued || userData?.latenessState === 'WARNING') ? 'var(--warning-500)' : 'var(--danger-400)' }}>
                          {(todayAttendance.warningIssued || userData?.latenessState === 'WARNING') ? `${todayAttendance.lateCountTotal || userData?.lateAttendanceCount || 1}-kechikish` : 'Jarima yozildi'}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="card glass-panel">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Davomat Tarixi</div>
                <div style={{ display: 'flex', gap: '8px', fontSize: '9px', fontWeight: 700, textTransform: 'uppercase' }}>
                  <span style={{ color: 'var(--accent-teal)' }}>Keldi</span>
                  <span style={{ color: 'var(--warning-500)' }}>Kechikdi</span>
                  <span style={{ color: 'var(--danger-500)' }}>Kelmadi</span>
                </div>
              </div>
              
              <div style={{ maxHeight: '420px', overflowY: 'auto', paddingRight: '8px' }}>
                {last30.filter(x => x.date <= new Date()).map(({ date, rec }) => {
                  const isToday = date.toDateString() === new Date().toDateString();
                  return (
                    <div key={date.toISOString()} style={{
                      display: 'flex', alignItems: 'center', gap: '16px', padding: '12px',
                      borderBottom: '1px solid var(--border)',
                      background: isToday ? 'rgba(124,58,237,0.03)' : 'transparent',
                      borderRadius: '12px',
                      marginBottom: '4px'
                    }}>
                      <div style={{
                        width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                        background: rec ? (rec.isLate ? 'var(--warning-500)' : 'var(--accent-teal)') : 'var(--danger-500)'
                      }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '13px', fontWeight: isToday ? 800 : 600 }}>
                          {date.toLocaleDateString('uz-UZ', { weekday: 'short', month: 'short', day: 'numeric' })}
                          {isToday && <span style={{ marginLeft: 8, fontSize: '9px', background: 'var(--primary-500)', color: '#0f172a', padding: '2px 6px', borderRadius: '4px', fontWeight: 900 }}>BUGUN</span>}
                        </div>
                        {rec && (
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                            KIRISH: {new Date(rec.checkInTime).toLocaleTimeString('uz', { hour: '2-digit', minute: '2-digit' })}
                            {rec.isLate && ` | ${rec.lateMinutes} DAQ KECHIKISH`}
                          </div>
                        )}
                      </div>
                      <div style={{ fontSize: '11px', fontWeight: 900, textTransform: 'uppercase',
                        color: rec ? (rec.isLate ? 'var(--warning-500)' : 'var(--accent-teal)') : 'var(--danger-500)' }}>
                        {rec ? (rec.isLate ? 'Kechikdi' : 'Keldi') : 'Kelmadi'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
