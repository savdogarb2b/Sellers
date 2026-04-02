'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await signIn('credentials', { email, password, redirect: false });
      if (res?.error) setError(res.error);
      else { router.push('/'); router.refresh(); }
    } catch { setError('Xatolik yuz berdi'); }
    setLoading(false);
  };

  return (
    <div className="login-wrapper">

      {/* ── LEFT PANEL ── */}
      <div className="login-left">
        {/* Glow orbs */}
        <div style={{ position: 'absolute', width: '320px', height: '320px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 70%)', top: '-60px', left: '-80px', filter: 'blur(40px)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', width: '280px', height: '280px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)', bottom: '60px', right: '-60px', filter: 'blur(50px)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', width: '200px', height: '200px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(16,185,129,0.12) 0%, transparent 70%)', bottom: '220px', left: '40px', filter: 'blur(30px)', pointerEvents: 'none' }} />

        {/* Logo */}
        <div className="animate-slide-up" style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '7px', background: 'linear-gradient(135deg, var(--primary), var(--violet))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '12px', color: '#fff' }}>S</div>
            <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text)', letterSpacing: '0.3px' }}>
              Sales<span style={{ color: 'var(--primary)' }}>CRM</span>
            </span>
          </div>
        </div>

        {/* Main content */}
        <div className="animate-slide-up delay-100" style={{ position: 'relative', zIndex: 2, maxWidth: '400px' }}>
          {/* Badge */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', background: 'var(--primary-ghost)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '99px', fontSize: '10px', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '18px' }}>
            <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
            Executive Dashboard
          </div>

          <h1 style={{ fontSize: 'clamp(24px, 3.5vw, 38px)', fontWeight: 900, lineHeight: 1.1, letterSpacing: '-0.8px', color: 'var(--text)', marginBottom: '14px' }}>
            Biznesingizni yangi bosqichga olib chiqing
          </h1>

          <p style={{ color: 'var(--text-2)', fontSize: '12.5px', lineHeight: 1.6, marginBottom: '28px' }}>
            Mijozlarni jalb qilishdan xodimlar KPI tahlillarigacha — SalesCRM sizning raqobatdosh ustunligingiz.
          </p>

          {/* Features */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              { icon: '📊', text: 'Real vaqtdagi analitika va hisobotlar' },
              { icon: '🤖', text: "Sun'iy intellekt bilan sotuv bashorati" },
              { icon: '🏆', text: 'Gamifikatsiya va motivatsiya tizimi' },
            ].map(({ icon, text }, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: 'var(--primary-ghost)', border: '1px solid rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', flexShrink: 0 }}>{icon}</div>
                <span style={{ fontSize: '12px', color: 'var(--text-2)', fontWeight: 500 }}>{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom social proof */}
        <div className="animate-slide-up delay-200" style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ display: 'flex', paddingLeft: '6px' }}>
            {['var(--primary)', 'var(--emerald)', 'var(--violet)'].map((c, i) => (
              <div key={i} style={{ width: '26px', height: '26px', borderRadius: '50%', background: c, border: '2px solid var(--bg-sidebar)', marginLeft: '-6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', fontWeight: 900, color: '#fff' }}>
                {i === 2 ? '+' : ''}
              </div>
            ))}
          </div>
          <p style={{ fontSize: '11px', color: 'var(--text-3)', fontWeight: 500 }}>O'zbekistonning yetakchi tashkilotlari tomonidan ishlatiladi</p>
        </div>
      </div>

      {/* ── RIGHT PANEL (FORM) ── */}
      <div className="login-right">
        {/* Back button */}
        <Link href="/" className="animate-slide-up" style={{
          position: 'absolute', top: '20px', right: '24px',
          display: 'flex', alignItems: 'center', gap: '5px',
          color: 'var(--text-3)', textDecoration: 'none',
          fontSize: '10.5px', fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: '0.7px',
          background: 'var(--bg-input)', padding: '6px 12px',
          borderRadius: '99px', border: '1px solid var(--border)',
          transition: 'all 0.15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.color = 'var(--primary)'; e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)'; }}
        onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-3)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          Bosh Sahifa
        </Link>

        {/* Form container */}
        <div className="animate-slide-up delay-200" style={{ width: '100%', maxWidth: '360px' }}>

          {/* Heading */}
          <div style={{ marginBottom: '28px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, var(--primary), var(--violet))', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </div>
            <h2 style={{ fontSize: '22px', fontWeight: 900, color: 'var(--text)', letterSpacing: '-0.4px', marginBottom: '6px' }}>Xush kelibsiz</h2>
            <p style={{ color: 'var(--text-3)', fontSize: '12px' }}>Hisobingizga kirish uchun ma'lumotlaringizni kiriting</p>
          </div>

          {/* Error */}
          {error && (
            <div className="animate-in" style={{ background: 'var(--rose-glow)', border: '1px solid rgba(244,63,94,0.2)', color: 'var(--rose)', padding: '9px 12px', borderRadius: '8px', marginBottom: '14px', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '7px' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

            {/* Email */}
            <div className="animate-slide-up delay-300">
              <label className="form-label">Pochta Manzili</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', display: 'flex', alignItems: 'center' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="admin@salescrm.uz"
                  required
                  className="form-input"
                  style={{ paddingLeft: '34px' }}
                />
              </div>
            </div>

            {/* Password */}
            <div className="animate-slide-up delay-400">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
                <label className="form-label" style={{ margin: 0 }}>Maxfiy Parol</label>
                <a href="#" style={{ fontSize: '10.5px', fontWeight: 600, color: 'var(--primary)', textDecoration: 'none' }}>Unutdingizmi?</a>
              </div>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', display: 'flex', alignItems: 'center' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                </span>
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="form-input"
                  style={{ paddingLeft: '34px', paddingRight: '38px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(p => !p)}
                  style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', display: 'flex', alignItems: 'center', padding: '2px' }}
                >
                  {showPw
                    ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  }
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary animate-slide-up delay-500"
              style={{ width: '100%', padding: '10px', fontSize: '12.5px', fontWeight: 700, letterSpacing: '0.2px', marginTop: '6px', borderRadius: '8px' }}
            >
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                  <span style={{ width: '13px', height: '13px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite', flexShrink: 0 }} />
                  Tasdiqlanmoqda...
                </span>
              ) : (
                <span style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                  Tizimga Kirish
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                </span>
              )}
            </button>
          </form>

          {/* Footer */}
          <div style={{ marginTop: '22px', padding: '14px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '9px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '1px' }}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            <p style={{ fontSize: '11px', color: 'var(--text-3)', lineHeight: 1.5 }}>
              Hisobingiz administrator tomonidan yaratiladi. Kirish muammosi bo'lsa, admin bilan bog'laning.
            </p>
          </div>
        </div>
      </div>

      {/* Responsive styles */}
      <style dangerouslySetInnerHTML={{ __html: `
        .login-wrapper {
          min-height: 100vh;
          display: flex;
          background: var(--bg);
          color: var(--text);
        }
        .login-left {
          flex: 1;
          position: relative;
          overflow: hidden;
          padding: 32px 40px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          background: var(--bg-sidebar);
          border-right: 1px solid var(--border);
        }
        .login-right {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 20px;
          position: relative;
          overflow-y: auto;
          background: var(--bg);
        }
        @media (max-width: 860px) {
          .login-wrapper { flex-direction: column; }
          .login-left { display: none; }
          .login-right { min-height: 100vh; }
        }
      `}} />
    </div>
  );
}
