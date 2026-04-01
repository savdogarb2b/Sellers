'use client';
import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';

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
    if (form.newPassword.length < 6) { setError("Parol kamida 6 belgidan iborat bo'lishi kerak"); return; }
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

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'linear-gradient(135deg, #001e37 0%, #002d52 100%)', border: '1px solid rgba(255,178,104,0.25)', borderRadius: '16px', padding: '32px', width: '400px', boxShadow: '0 40px 80px rgba(0,0,0,0.6)', position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: '14px', right: '14px', background: 'rgba(255,255,255,0.08)', border: 'none', color: 'rgba(255,255,255,0.6)', width: '30px', height: '30px', borderRadius: '8px', cursor: 'pointer', fontSize: '18px', lineHeight: '1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
        <div style={{ fontSize: '15px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px', color: '#ffb268', marginBottom: '6px' }}>Parolni O'zgartirish</div>
        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', fontWeight: 600, marginBottom: '24px' }}>Xavfsizlik uchun joriy parolingizni tasdiqlang</div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {[
            { key: 'currentPassword', label: 'Joriy Parol' },
            { key: 'newPassword', label: 'Yangi Parol' },
            { key: 'confirmPassword', label: 'Parolni Tasdiqlash' },
          ].map(({ key, label }) => (
            <div key={key}>
              <div style={{ fontSize: '10px', fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>{label}</div>
              <input
                type="password"
                value={form[key]}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                required
                style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px 14px', color: 'white', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                onFocus={e => e.target.style.borderColor = '#ffb268'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
            </div>
          ))}
          {error && <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '8px', padding: '10px 14px', color: '#f87171', fontSize: '12px', fontWeight: 600 }}>{error}</div>}
          {success && <div style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: '8px', padding: '10px 14px', color: '#34d399', fontSize: '12px', fontWeight: 600 }}>{success}</div>}
          <button type="submit" disabled={loading} style={{ background: loading ? 'rgba(255,178,104,0.4)' : '#ffb268', color: '#001e37', border: 'none', borderRadius: '10px', padding: '12px', fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px', cursor: loading ? 'not-allowed' : 'pointer', marginTop: '4px', transition: 'all 0.2s' }}>
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

  const getPageTitle = () => {
    if (pathname === '/admin') return 'Boshqaruv Markazi';
    if (pathname.includes('/employees')) return 'Xodimlar Portali';
    if (pathname.includes('/strategy')) return 'Sotuv Rejasi';
    if (pathname.includes('/salary')) return 'Ish Haqlar';
    if (pathname.includes('/finance')) return 'Jarima & Bonus';
    if (pathname.includes('/funnel')) return 'Sotuv Voronkasi';
    if (pathname.includes('/chat')) return 'AI Intellect';
    if (pathname.includes('/settings')) return 'Tizim Sozlamalari';
    if (pathname === '/superadmin') return 'Global Monitor';
    return 'SalesCRM';
  };

  if (!session) return null;

  const initials = session.user.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'U';

  return (
    <>
      {showPasswordModal && <PasswordModal onClose={() => { setShowPasswordModal(false); setShowDropdown(false); }} />}

      <nav className="top-navbar">
        <div className="nav-left">
          <h2 className="nav-page-title">{getPageTitle()}</h2>
        </div>

        <div className="nav-right">
          <div className="nav-search-bar">
            <input type="text" placeholder="Tizim bo'ylab qidiruv..." />
          </div>

          <div className="nav-actions">
            <button className="nav-btn" title="Bildirishnomalar">
              <span className="notification-badge" />
            </button>

            <div className="nav-divider" />

            {/* Profile Button */}
            <div style={{ position: 'relative' }}>
              <div
                className="nav-user"
                onClick={() => setShowDropdown(d => !d)}
                style={{ cursor: 'pointer', userSelect: 'none', display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 10px', borderRadius: '10px', transition: 'background 0.2s', background: showDropdown ? 'rgba(255,178,104,0.1)' : 'transparent' }}
                onMouseEnter={e => !showDropdown && (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                onMouseLeave={e => !showDropdown && (e.currentTarget.style.background = 'transparent')}
              >
                {/* Avatar circle */}
                <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'linear-gradient(135deg, #ffb268, #ff8c00)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '12px', color: '#001e37', flexShrink: 0, boxShadow: '0 0 0 2px rgba(255,178,104,0.3)' }}>
                  {initials}
                </div>
                <div className="nav-user-details">
                  <span className="nav-user-name">{session.user.name}</span>
                  <span className="nav-user-role">{session.user.role}</span>
                </div>
                {/* Arrow */}
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ transition: 'transform 0.2s', transform: showDropdown ? 'rotate(180deg)' : 'rotate(0deg)', color: 'rgba(255,255,255,0.4)' }}>
                  <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>

              {/* Dropdown */}
              {showDropdown && (
                <>
                  {/* Backdrop */}
                  <div onClick={() => setShowDropdown(false)} style={{ position: 'fixed', inset: 0, zIndex: 998 }} />
                  <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, background: 'linear-gradient(135deg, #001e37 0%, #002d52 100%)', border: '1px solid rgba(255,178,104,0.2)', borderRadius: '12px', padding: '8px', minWidth: '200px', zIndex: 999, boxShadow: '0 20px 40px rgba(0,0,0,0.5)', backdropFilter: 'blur(20px)' }}>
                    {/* User info */}
                    <div style={{ padding: '10px 12px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: '6px' }}>
                      <div style={{ fontWeight: 800, fontSize: '13px', color: 'white' }}>{session.user.name}</div>
                      <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', marginTop: '2px', fontWeight: 600 }}>{session.user.email || session.user.role}</div>
                    </div>

                    {/* Change password button */}
                    <button
                      onClick={() => { setShowPasswordModal(true); setShowDropdown(false); }}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px', background: 'transparent', border: 'none', borderRadius: '8px', cursor: 'pointer', color: 'rgba(255,255,255,0.7)', fontSize: '12px', fontWeight: 700, textAlign: 'left', transition: 'all 0.15s' }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,178,104,0.1)'; e.currentTarget.style.color = '#ffb268'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                      </svg>
                      Parolni O'zgartirish
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}
