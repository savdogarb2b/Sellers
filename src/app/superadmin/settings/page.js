'use client';
import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';

export default function SuperadminSettingsPage() {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showDeepseekKey, setShowDeepseekKey] = useState(false);
  const [testStatus, setTestStatus] = useState(null); // null | 'testing' | 'success' | 'failed'

  const [form, setForm] = useState({
    DEEPSEEK_API_KEY: '',
    DEFAULT_MAX_EMPLOYEES: '50',
    DEFAULT_SUBSCRIPTION_PLAN: 'BASIC',
    SYSTEM_NAME: 'SalesCRM',
    LATE_PENALTY_DEFAULT: '50000',
    WORK_START_TIME: '09:00',
    WORK_END_TIME: '18:00',
    ACTIVE_AI_PROVIDER: 'deepseek',
  });

  useEffect(() => { fetchSettings(); }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/superadmin/settings');
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
        setForm(prev => ({ ...prev, ...data }));
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    setTestStatus(null);
    try {
      const res = await fetch('/api/superadmin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, ACTIVE_AI_PROVIDER: 'deepseek' }),
      });
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);

        // API kalitni test qilish
        if (form.DEEPSEEK_API_KEY) {
          setTestStatus('testing');
          try {
            const testRes = await fetch('/api/superadmin/ai', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ message: 'hi', test: true }),
            });
            if (testRes.ok) {
              const reader = testRes.body.getReader();
              const { value } = await reader.read();
              reader.cancel();
              setTestStatus(value && value.length > 0 ? 'success' : 'failed');
            } else {
              setTestStatus('failed');
            }
          } catch {
            setTestStatus('failed');
          }
          setTimeout(() => setTestStatus(null), 5000);
        }
      }
    } catch (e) {
      console.error(e);
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="app-layout">
        <Sidebar />
        <Navbar />
        <main className="main-content"><div className="loading-container"><div className="loading-spinner" /></div></main>
      </div>
    );
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <Navbar />
      <main className="main-content">
        <div className="animate-in">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
            <div>
              <div style={{ fontSize: '16px', fontWeight: 950, textTransform: 'uppercase', letterSpacing: '2px' }}>Tizim Sozlamalari</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: '4px', fontWeight: 700 }}>Global konfiguratsiya va AI integratsiyasi</div>
            </div>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving} style={{ fontSize: '10px', fontWeight: 900, padding: '12px 28px' }}>
              {saving ? 'SAQLANMOQDA...' : saved ? 'SAQLANDI' : 'SAQLASH'}
            </button>
          </div>

          {saved && (
            <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.15)', padding: '14px 20px', borderRadius: '12px', marginBottom: '24px', fontSize: '11px', fontWeight: 800, color: 'var(--accent-teal)', textTransform: 'uppercase', textAlign: 'center', animation: 'fadeIn 0.3s ease' }}>
              Sozlamalar muvaffaqiyatli saqlandi
            </div>
          )}
          {testStatus === 'testing' && (
            <div style={{ background: 'rgba(124, 58, 237, 0.08)', border: '1px solid rgba(124, 58, 237, 0.2)', padding: '14px 20px', borderRadius: '12px', marginBottom: '24px', fontSize: '11px', fontWeight: 800, color: 'var(--primary-400)', textTransform: 'uppercase', textAlign: 'center', animation: 'fadeIn 0.3s ease' }}>
              DeepSeek API tekshirilmoqda...
            </div>
          )}
          {testStatus === 'success' && (
            <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '14px 20px', borderRadius: '12px', marginBottom: '24px', fontSize: '11px', fontWeight: 800, color: '#10b981', textTransform: 'uppercase', textAlign: 'center', animation: 'fadeIn 0.3s ease' }}>
              ✓ DeepSeek API muvaffaqiyatli ulandi — tizim tayyor!
            </div>
          )}
          {testStatus === 'failed' && (
            <div style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '14px 20px', borderRadius: '12px', marginBottom: '24px', fontSize: '11px', fontWeight: 800, color: '#ef4444', textTransform: 'uppercase', textAlign: 'center', animation: 'fadeIn 0.3s ease' }}>
              ✗ DeepSeek API xatosi — kalitni tekshiring
            </div>
          )}

          {/* ===== AI CONFIGURATION ===== */}
          <div className="card glass-panel" style={{ padding: '28px', borderLeft: '4px solid var(--primary-500)' }}>
            <div style={{ fontSize: '12px', fontWeight: 950, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>AI Konfiguratsiya</div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '24px' }}>Modellar va API Integratsiyasi</div>

            <div className="form-group" style={{ marginBottom: '0' }}>
              <label className="form-label" style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase' }}>DeepSeek API Kalit</label>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <input
                  className="form-input"
                  type={showDeepseekKey ? 'text' : 'password'}
                  value={form.DEEPSEEK_API_KEY}
                  onChange={e => setForm({...form, DEEPSEEK_API_KEY: e.target.value})}
                  placeholder="sk-..."
                  style={{ flex: 1, fontFamily: 'monospace', fontSize: '13px', letterSpacing: '1px' }}
                />
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowDeepseekKey(!showDeepseekKey)}
                  style={{ fontSize: '9px', fontWeight: 900, padding: '12px 16px', whiteSpace: 'nowrap' }}
                >
                  {showDeepseekKey ? 'YASHIRISH' : "KO'RSATISH"}
                </button>
              </div>
            </div>
          </div>

          {/* ===== DEFAULT SETTINGS ===== */}
          <div className="card glass-panel" style={{ padding: '28px', borderLeft: '4px solid var(--accent-teal)' }}>
            <div style={{ fontSize: '12px', fontWeight: 950, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Default Sozlamalar</div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '24px' }}>Yangi tashkilotlar uchun standart qiymatlar</div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase' }}>Tizim Nomi</label>
                <input className="form-input" value={form.SYSTEM_NAME} onChange={e => setForm({...form, SYSTEM_NAME: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase' }}>Default Tarif</label>
                <select className="form-input" value={form.DEFAULT_SUBSCRIPTION_PLAN} onChange={e => setForm({...form, DEFAULT_SUBSCRIPTION_PLAN: e.target.value})}>
                  <option value="FREE">FREE</option>
                  <option value="BASIC">BASIC</option>
                  <option value="PREMIUM">PREMIUM</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase' }}>Max Xodimlar Limiti</label>
                <input className="form-input" type="number" value={form.DEFAULT_MAX_EMPLOYEES} onChange={e => setForm({...form, DEFAULT_MAX_EMPLOYEES: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase' }}>Kechikish Jarimasi (so'm)</label>
                <input className="form-input" type="number" value={form.LATE_PENALTY_DEFAULT} onChange={e => setForm({...form, LATE_PENALTY_DEFAULT: e.target.value})} />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase' }}>Ish Boshlanishi</label>
                <input className="form-input" type="time" value={form.WORK_START_TIME} onChange={e => setForm({...form, WORK_START_TIME: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase' }}>Ish Tugashi</label>
                <input className="form-input" type="time" value={form.WORK_END_TIME} onChange={e => setForm({...form, WORK_END_TIME: e.target.value})} />
              </div>
            </div>
          </div>

          {/* ===== SYSTEM INFO ===== */}
          <div className="card glass-panel" style={{ padding: '28px', borderLeft: '4px solid var(--accent-blue)' }}>
            <div style={{ fontSize: '12px', fontWeight: 950, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Tizim Ma'lumotlari</div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '24px' }}>Texnik detallar</div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
              <InfoBox label="Platforma" value="Next.js 16.2" />
              <InfoBox label="Ma'lumotlar Bazasi" value="SQLite (Prisma ORM)" />
              <InfoBox label="AI Model" value="DeepSeek-V3" />
              <InfoBox label="Autentifikatsiya" value="NextAuth.js (JWT)" />
              <InfoBox label="Versiya" value="v2.0.0" />
              <InfoBox label="Oxirgi Yangilanish" value={new Date().toLocaleDateString('uz')} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function InfoBox({ label, value }) {
  return (
    <div style={{ background: 'var(--bg-elevated)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
      <div style={{ fontSize: '9px', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>{label}</div>
      <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)' }}>{value}</div>
    </div>
  );
}
