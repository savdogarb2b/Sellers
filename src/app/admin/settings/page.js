'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';

export default function SettingsPage() {
  const { data: session, update } = useSession();
  const [form, setForm] = useState({
    organizationName: '',
    name: '',
    email: '',
    workStartTime: '09:00',
    workEndTime: '18:00',
    latenessPenalty: '50000',
  });
  const [loading, setLoading] = useState(true);
  const [savingOrg, setSavingOrg] = useState(false);
  const [savingWork, setSavingWork] = useState(false);

  useEffect(() => {
    fetch('/api/settings').then(r => r.json()).then(data => {
      setForm({
        organizationName: data.organization?.name || '',
        name: data.name || '',
        email: data.email || '',
        workStartTime: data.workStartTime || '09:00',
        workEndTime: data.workEndTime || '18:00',
        latenessPenalty: data.latenessPenalty || '50000',
      });
      setLoading(false);
    });
  }, []);

  const handleSave = async (type) => {
    if (type === 'org') setSavingOrg(true);
    else setSavingWork(true);

    try {
       await fetch('/api/settings', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify(form)
       });
       
       if (update) update();

       setTimeout(() => {
         if (type === 'org') setSavingOrg(false);
         else setSavingWork(false);
       }, 800);
    } catch (e) {
       console.error(e);
       if (type === 'org') setSavingOrg(false);
       else setSavingWork(false);
    }
  };

  if (loading) return <div className="app-layout"><Sidebar /><Navbar /><main className="main-content"><div className="loading-container"><div className="loading-spinner" /></div></main></div>;

  return (
    <div className="app-layout">
      <Sidebar />
      <Navbar />
      <main className="main-content">
        <div className="animate-in">
          <div className="grid-2">
            <div className="card glass-panel animate-in">
              <div style={{ fontSize: '16px', fontWeight: 800, marginBottom: '20px', letterSpacing: '-0.5px', textTransform: 'uppercase' }}>Tashkilot ma'lumotlari</div>
              <div className="form-group">
                <label className="form-label">Tashkilot nomi</label>
                <input className="form-input" style={{background: 'var(--bg-elevated)'}} value={form.organizationName} onChange={e => setForm({...form, organizationName: e.target.value})} placeholder="Masalan: Elite Sales LLC" />
              </div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Rahbar Ismi</label><input className="form-input" style={{background: 'var(--bg-elevated)'}} value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Rahbar ismini kiriting..." /></div>
                <div className="form-group"><label className="form-label">Akkount Email</label><input className="form-input" style={{background: 'var(--bg-elevated)'}} value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="Emailni kiriting..." /></div>
              </div>
              <button className="btn btn-primary" style={{ width: '100%', marginTop: '12px', fontSize: '11px' }} onClick={() => handleSave('org')} disabled={savingOrg}>
                {savingOrg ? ' MUVAFFARIYATLI SAQLANDI' : 'O\'ZGARISHLARNI SAQLASH'}
              </button>
            </div>

            <div className="card glass-panel animate-in" style={{ animationDelay: '0.1s' }}>
              <div style={{ fontSize: '16px', fontWeight: 800, marginBottom: '20px', letterSpacing: '-0.5px', textTransform: 'uppercase' }}>Standart tartibotlar</div>
              <div style={{ background: 'rgba(124, 58, 237, 0.05)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(124, 58, 237, 0.1)', marginBottom: '20px', fontSize: '12px', color: 'var(--primary-400)' }}>
                 Ushbu sozlamalar barcha yangi xodimlar uchun andaza sifatida ishlatiladi.
              </div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Ish boshlash vaqti</label><input className="form-input" type="time" style={{background: 'var(--bg-elevated)'}} value={form.workStartTime} onChange={e => setForm({...form, workStartTime: e.target.value})} /></div>
                <div className="form-group"><label className="form-label">Ish tugash vaqti</label><input className="form-input" type="time" style={{background: 'var(--bg-elevated)'}} value={form.workEndTime} onChange={e => setForm({...form, workEndTime: e.target.value})} /></div>
              </div>
              <div className="form-group">
                <label className="form-label">Kechikish uchun jarima summasi (so'm)</label>
                <input className="form-input" type="number" style={{background: 'var(--bg-elevated)'}} value={form.latenessPenalty} onChange={e => setForm({...form, latenessPenalty: e.target.value})} placeholder="50000" />
                <div className="form-hint" style={{ marginTop: '8px', opacity: 0.6, fontSize: '11px' }}>Kechikish chegarasidan oshib ketganda belgilangan jarima summasi.</div>
              </div>
              <button className="btn btn-primary" style={{ width: '100%', marginTop: '12px', fontSize: '11px' }} onClick={() => handleSave('work')} disabled={savingWork}>
                {savingWork ? ' MUVAFFARIYATLI SAQLANDI' : 'TARTIBOTLARNI SAQLASH'}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
