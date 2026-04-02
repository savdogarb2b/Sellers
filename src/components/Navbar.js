'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';

// ─── THEME TOGGLE ─────────────────────────────────────────────────────────────
function useTheme() {
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    const saved = localStorage.getItem('theme') || 'dark';
    setTheme(saved);
    document.documentElement.setAttribute('data-theme', saved);
  }, []);

  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('theme', next);
    document.documentElement.setAttribute('data-theme', next);
  };

  return { theme, toggle };
}

// ─── ICONS ────────────────────────────────────────────────────────────────────
const IconSun = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
    <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
  </svg>
);

const IconMoon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>
);

const IconBell = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>
);

const IconSearch = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-3)', marginRight: '6px', flexShrink: 0 }}>
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);

const IconLock = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);

const IconChevron = ({ open }) => (
  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)', color: 'var(--text-3)' }}>
    <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// ─── PASSWORD MODAL ───────────────────────────────────────────────────────────
function PasswordModal({ onClose }) {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (form.newPassword !== form.confirmPassword) { setError("Yangi parollar mos kelmadi"); return; }
    if (form.newPassword.length < 6) { setError("Parol kamida 6 ta belgidan iborat bo'lishi kerak"); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/users/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: form.currentPassword, newPassword: form.newPassword }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error || 'Xatolik yuz berdi');
      else { setSuccess("Parol muvaffaqiyatli o'zgartirildi!"); setTimeout(onClose, 2000); }
    } catch { setError('Server bilan bog\'lanishda xatolik'); }
    finally { setLoading(false); }
  };

  const fields = [
    { key: 'currentPassword', label: 'Joriy Parol' },
    { key: 'newPassword', label: 'Yangi Parol' },
    { key: 'confirmPassword', label: 'Parolni Tasdiqlash' },
  ];

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'var(--bg-overlay)', backdropFilter: 'blur(10px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border-2)', borderRadius: '14px', padding: '26px', width: '100%', maxWidth: '380px', boxShadow: 'var(--shadow-xl)', position: 'relative', animation: 'modalIn 0.25s var(--ease)' }}
      >
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: '14px', right: '14px', background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-2)', width: '26px', height: '26px', borderRadius: '6px', cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter,sans-serif' }}
        >×</button>

        <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text)', marginBottom: '4px' }}>Parolni O'zgartirish</div>
        <div style={{ fontSize: '11px', color: 'var(--text-3)', marginBottom: '22px' }}>Xavfsizlik uchun joriy parolingizni tasdiqlang</div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {fields.map(({ key, label }) => (
            <div key={key}>
              <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '5px' }}>{label}</div>
              <input
                type="password"
                value={form[key]}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                required
                className="form-input"
                placeholder="••••••••"
              />
            </div>
          ))}

          {error && (
            <div style={{ background: 'var(--rose-glow)', border: '1px solid rgba(244,63,94,0.2)', borderRadius: '7px', padding: '9px 12px', color: 'var(--rose)', fontSize: '11.5px', fontWeight: 600 }}>
              {error}
            </div>
          )}
          {success && (
            <div style={{ background: 'var(--emerald-glow)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '7px', padding: '9px 12px', color: 'var(--emerald)', fontSize: '11.5px', fontWeight: 600 }}>
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', padding: '10px', marginTop: '4px', fontSize: '12px', fontWeight: 700, letterSpacing: '0.3px' }}
          >
            {loading ? 'Saqlanmoqda...' : 'Parolni Saqlash'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── NAVBAR ───────────────────────────────────────────────────────────────────
export default function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const { theme, toggle: toggleTheme } = useTheme();

  const getPageTitle = () => {
    if (pathname === '/admin') return 'Boshqaruv Markazi';
    if (pathname.includes('/employees')) return 'Xodimlar Portali';
    if (pathname.includes('/strategy')) return 'Sotuv Rejasi';
    if (pathname.includes('/salary')) return 'Ish Haqlar';
    if (pathname.includes('/finance')) return 'Jarima & Bonus';
    if (pathname.includes('/funnel')) return 'Sotuv Voronkasi';
    if (pathname.includes('/reports')) return 'Kunlik Hisobotlar';
    if (pathname.includes('/ratings')) return 'Liderlar Reytingi';
    if (pathname.includes('/chat')) return 'AI Intellect';
    if (pathname.includes('/settings')) return 'Sozlamalar';
    if (pathname.includes('/assign')) return 'Belgilash';
    if (pathname.includes('/penalties')) return 'Jarimalar';
    if (pathname.includes('/bonuses')) return 'Bonuslar';
    if (pathname === '/superadmin') return 'Global Monitor';
    if (pathname.includes('/organizations')) return 'Tashkilotlar';
    if (pathname === '/employee') return 'Mening Paneliim';
    if (pathname.includes('/checkin')) return 'Nazorat Punkti';
    if (pathname.includes('/report')) return 'Kunlik Hisobot';
    if (pathname.includes('/kpi')) return 'KPI';
    return 'SalesCRM';
  };

  if (!session) return null;

  const initials = session.user.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'U';

  return (
    <>
      {showPasswordModal && (
        <PasswordModal onClose={() => { setShowPasswordModal(false); setShowDropdown(false); }} />
      )}

      <nav className="top-navbar">
        {/* Left */}
        <div className="nav-left">
          <h2 className="nav-page-title">{getPageTitle()}</h2>
        </div>

        {/* Right */}
        <div className="nav-right">
          {/* Search */}
          <div className="nav-search-bar">
            <IconSearch />
            <input type="text" placeholder="Qidiruv..." />
          </div>

          {/* Theme toggle */}
          <button
            className="theme-toggle"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Kunduzgi mavzu' : 'Tungi mavzu'}
          >
            {theme === 'dark' ? <IconSun /> : <IconMoon />}
          </button>

          {/* Notifications */}
          <button className="nav-btn" title="Bildirishnomalar">
            <IconBell />
            <span className="notification-badge" />
          </button>

          <div className="nav-divider" />

          {/* Profile dropdown */}
          <div style={{ position: 'relative' }}>
            <div
              onClick={() => setShowDropdown(d => !d)}
              style={{
                cursor: 'pointer',
                userSelect: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '5px 8px',
                borderRadius: '8px',
                transition: 'background 0.15s',
                background: showDropdown ? 'var(--primary-ghost)' : 'transparent',
              }}
              onMouseEnter={e => { if (!showDropdown) e.currentTarget.style.background = 'var(--sidebar-hover-bg)'; }}
              onMouseLeave={e => { if (!showDropdown) e.currentTarget.style.background = 'transparent'; }}
            >
              {/* Avatar */}
              <div style={{
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--primary), var(--violet))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '11px',
                color: '#fff',
                flexShrink: 0,
              }}>
                {initials}
              </div>
              <div className="nav-user-details">
                <span className="nav-user-name">{session.user.name}</span>
                <span className="nav-user-role">{session.user.role}</span>
              </div>
              <IconChevron open={showDropdown} />
            </div>

            {/* Dropdown */}
            {showDropdown && (
              <>
                <div onClick={() => setShowDropdown(false)} style={{ position: 'fixed', inset: 0, zIndex: 998 }} />
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 6px)',
                    right: 0,
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-2)',
                    borderRadius: '10px',
                    padding: '6px',
                    minWidth: '190px',
                    zIndex: 999,
                    boxShadow: 'var(--shadow-lg)',
                    animation: 'slideDown 0.18s var(--ease)',
                  }}
                >
                  {/* User info */}
                  <div style={{ padding: '8px 10px 10px', borderBottom: '1px solid var(--border)', marginBottom: '5px' }}>
                    <div style={{ fontWeight: 700, fontSize: '12.5px', color: 'var(--text)' }}>{session.user.name}</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-3)', marginTop: '2px' }}>{session.user.email || session.user.role}</div>
                  </div>

                  {/* Change password */}
                  <button
                    onClick={() => { setShowPasswordModal(true); setShowDropdown(false); }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '9px',
                      padding: '8px 10px',
                      background: 'transparent',
                      border: 'none',
                      borderRadius: '7px',
                      cursor: 'pointer',
                      color: 'var(--text-2)',
                      fontSize: '12px',
                      fontWeight: 600,
                      textAlign: 'left',
                      transition: 'all 0.14s',
                      fontFamily: 'Inter, sans-serif',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--primary-ghost)'; e.currentTarget.style.color = 'var(--primary)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-2)'; }}
                  >
                    <IconLock />
                    Parolni O'zgartirish
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </nav>
    </>
  );
}
