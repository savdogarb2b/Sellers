'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        setError(res.error);
      } else {
        router.push('/');
        router.refresh();
      }
    } catch (err) {
      setError('Xatolik yuz berdi');
    }
    setLoading(false);
  };

  return (
    <div style={{ height: '100vh', overflow: 'hidden', display: 'flex', background: 'var(--bg-deeper)', color: 'var(--text-primary)' }} className="login-wrapper">
      
      {/* LEFT COLUMN: System Info (Hidden on mobile) */}
      <div className="login-left" style={{ 
        flex: '1', position: 'relative', overflow: 'hidden', padding: '40px',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        borderRight: '1px solid var(--border-color)',
        background: 'linear-gradient(145deg, rgba(16, 185, 129, 0.05) 0%, rgba(5, 5, 5, 1) 80%)'
      }}>
        {/* Background Blur Sphere */}
        <div className="landing-glow-sphere" style={{ top: '-10%', left: '-10%', filter: 'blur(80px)', opacity: 0.7 }} />
        <div className="landing-glow-sphere secondary" style={{ bottom: '-20%', right: '-10%', filter: 'blur(100px)', opacity: 0.5 }} />

        {/* Top Logo */}
        <div className="animate-slide-up" style={{ zIndex: 10, position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="brand-logo" style={{ width: 32, height: 32, background: 'linear-gradient(135deg, var(--primary-400), var(--primary-600))', color: '#000', fontSize: '14px' }}>S</div>
            <span style={{ fontSize: '16px', fontWeight: 900, letterSpacing: '2px', textTransform: 'uppercase' }}>Sales<span style={{ color: 'var(--primary-500)' }}>CRM</span></span>
          </div>
        </div>

        {/* Center Marketing Text */}
        <div className="animate-slide-up delay-100" style={{ zIndex: 10, position: 'relative', marginTop: 'auto', marginBottom: '40px', maxWidth: '440px' }}>
          <div style={{ padding: '4px 12px', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--accent-teal)', borderRadius: 'var(--radius-full)', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px', border: '1px solid rgba(16, 185, 129, 0.2)', display: 'inline-block' }}>
            EXECUTIVE DASHBOARD
          </div>
          <h1 style={{ fontSize: 'clamp(28px, 3vw, 42px)', fontWeight: 950, lineHeight: 1.1, letterSpacing: '-1px', marginBottom: '16px' }}>
            Biznesingizning eng muhim qadamlari shu yerda boshlanadi.
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: 1.5, marginBottom: '24px' }}>
            Mijozlarni jalb qilishdan tortib, xodimlar KPI qiymatlarini Sun’iy intellekt orqali tahlil qilishgacha — SalesCRM sizni yangi bosqichga olib chiqadi.
          </p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
             <InfoCheck text="Real vaqtdagi Recharts monitorlari" />
             <InfoCheck text="SaaS himoyasi va xodimlarni boshqarish" />
             <InfoCheck text="Gamifikatsiya va Avto-Jarimalar" />
          </div>
        </div>

        {/* Bottom Footer or Decorative */}
        <div className="animate-slide-up delay-200" style={{ zIndex: 10, position: 'relative', display: 'flex', alignItems: 'center', gap: '12px' }}>
           <div style={{ display: 'flex', paddingLeft: '8px' }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#2563eb', border: '2px solid var(--bg-deeper)', marginLeft: '-8px' }} />
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#10b981', border: '2px solid var(--bg-deeper)', marginLeft: '-8px' }} />
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#8b5cf6', border: '2px solid var(--bg-deeper)', marginLeft: '-8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 900 }}>+99</div>
           </div>
           <p style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>O’zbekistonning yetakchi tashkilotlari sinovidan o’tgan</p>
        </div>
      </div>

      {/* RIGHT COLUMN: Login Form */}
      <div className="login-right" style={{ 
        flex: '1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', position: 'relative', overflowY: 'auto' 
      }}>
        {/* Back Button */}
        <Link href="/" className="animate-slide-up" style={{
          position: 'absolute', top: '24px', right: '32px',
          display: 'flex', alignItems: 'center', gap: '6px',
          color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px',
          background: 'rgba(255,255,255,0.02)', padding: '8px 14px', borderRadius: 'var(--radius-full)',
          border: '1px solid var(--border-color)', transition: 'all 0.3s ease'
        }}
        onMouseEnter={(e) => { e.currentTarget.style.color = 'white'; e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          Bosh Sahifa
        </Link>


        <div className="animate-slide-up delay-200" style={{ width: '100%', maxWidth: '380px', display: 'flex', flexDirection: 'column' }}>
          
          <div style={{ marginBottom: '30px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 900, marginBottom: '6px', color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>Xush Kelibsiz.</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 500 }}>Shaxsiy pochta va parolingizni kiriting.</p>
          </div>

          {error && (
            <div className="animate-in" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#ef4444', padding: '10px', borderRadius: '8px', marginBottom: '16px', fontSize: '12px', fontWeight: 700, textAlign: 'center' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
             <div className="animate-slide-up delay-300">
              <label style={{ display: 'block', fontSize: '10px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>Pochta Manzili</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@salescrm.uz"
                required
                style={{ 
                  width: '100%', padding: '12px 14px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '8px',
                  color: 'white', fontSize: '13px', fontWeight: 500, fontFamily: 'Inter, sans-serif', outline: 'none', transition: 'all 0.3s ease'
                }}
                onFocus={(e) => { e.target.style.borderColor = 'var(--primary-500)'; e.target.style.boxShadow = '0 0 0 3px rgba(212, 175, 55, 0.1)'; }}
                onBlur={(e) => { e.target.style.borderColor = 'var(--border-color)'; e.target.style.boxShadow = 'none'; }}
              />
            </div>

            <div className="animate-slide-up delay-400">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
                <label style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Maxfiy Parol</label>
                <a href="#" style={{ fontSize: '10px', fontWeight: 700, color: 'var(--primary-400)', textDecoration: 'none' }}>Parolni unutdingizmi?</a>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{ 
                  width: '100%', padding: '12px 14px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '8px',
                  color: 'white', fontSize: '13px', fontWeight: 500, fontFamily: 'Inter, sans-serif', outline: 'none', transition: 'all 0.3s ease'
                }}
                onFocus={(e) => { e.target.style.borderColor = 'var(--primary-500)'; e.target.style.boxShadow = '0 0 0 3px rgba(212, 175, 55, 0.1)'; }}
                onBlur={(e) => { e.target.style.borderColor = 'var(--border-color)'; e.target.style.boxShadow = 'none'; }}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary animate-slide-up delay-500"
              style={{ width: '100%', padding: '12px', borderRadius: '8px', fontSize: '13px', fontWeight: 800, letterSpacing: '1px', marginTop: '8px' }}
              disabled={loading}
            >
              {loading ? 'Tasdiqlanmoqda...' : 'Tizimga Kirish'}
            </button>
          </form>


        </div>
      </div>

      {/* Internal CSS for mobile responsiveness of the split layout */}
      <style dangerouslySetInnerHTML={{__html: `
        @media (max-width: 900px) {
           .login-wrapper { flex-direction: column !important; display: block !important; overflow-y: auto !important; height: auto !important; min-height: 100vh !important; }
           .login-left { display: none !important; }
        }
      `}} />
    </div>
  );
}

// ---------------- Helper Component ---------------- //
function InfoCheck({ text }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.1)' }}>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--primary-400)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
      </div>
      <span style={{ fontSize: '12px', color: 'var(--text-primary)', fontWeight: 600 }}>{text}</span>
    </div>
  );
}
