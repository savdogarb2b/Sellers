'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';

/* ─── ROLE CONFIG ──────────────────────────────────────────────────────────── */
const ROLE_CONFIG = {
  SUPERADMIN: {
    label: 'Super Admin',
    badge: 'SUPER',
    accent: '#8b5cf6',         // violet
    accentLight: 'rgba(139,92,246,0.12)',
    accentGlow:  'rgba(139,92,246,0.25)',
    gradient: 'linear-gradient(135deg,#7c3aed,#6366f1)',
    dot: '#8b5cf6',
  },
  ADMIN: {
    label: 'Administrator',
    badge: 'ADMIN',
    accent: '#6366f1',         // indigo
    accentLight: 'rgba(99,102,241,0.12)',
    accentGlow:  'rgba(99,102,241,0.25)',
    gradient: 'linear-gradient(135deg,#6366f1,#3b82f6)',
    dot: '#6366f1',
  },
  EMPLOYEE: {
    label: 'Xodim',
    badge: 'USER',
    accent: '#10b981',         // emerald
    accentLight: 'rgba(16,185,129,0.12)',
    accentGlow:  'rgba(16,185,129,0.25)',
    gradient: 'linear-gradient(135deg,#0ea5e9,#10b981)',
    dot: '#10b981',
  },
};

/* ─── ICONS ────────────────────────────────────────────────────────────────── */
const I = {
  // ── group section icons ──
  shield:    (s=14)=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  layout:    (s=14)=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>,
  trending:  (s=14)=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
  wallet:    (s=14)=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>,
  chartBar:  (s=14)=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></svg>,
  briefcase: (s=14)=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>,
  star:      (s=14)=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,

  // ── nav item icons ──
  gauge:     (s=15)=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22V12"/><path d="M12 2a10 10 0 1 0 10 10"/><path d="M20 12a8 8 0 1 0-16 0"/></svg>,
  building2: (s=15)=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/></svg>,
  brain:     (s=15)=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.46 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-2.14Z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.46 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-2.14Z"/></svg>,
  sliders:   (s=15)=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>,
  home:      (s=15)=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  users:     (s=15)=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  target:    (s=15)=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
  funnel:    (s=15)=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>,
  clipboard: (s=15)=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/></svg>,
  coin:      (s=15)=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M14.8 9A2 2 0 0 0 13 8h-2a2 2 0 0 0 0 4h2a2 2 0 0 1 0 4h-2a2 2 0 0 1-1.8-1"/><line x1="12" y1="6" x2="12" y2="8"/><line x1="12" y1="16" x2="12" y2="18"/></svg>,
  alertX:    (s=15)=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  gift:      (s=15)=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>,
  scale:     (s=15)=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="3" x2="12" y2="21"/><path d="M3 6l9 3 9-3"/><path d="M6 12l-3 6h6l-3-6z"/><path d="M18 12l-3 6h6l-3-6z"/></svg>,
  trophy:    (s=15)=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="8 21 12 21 16 21"/><line x1="12" y1="17" x2="12" y2="21"/><path d="M7 4h10l1 7a5 5 0 0 1-10 0v-.01L7 4"/><path d="M7 4H3v3a4 4 0 0 0 4 4"/><path d="M17 4h4v3a4 4 0 0 1-4 4"/></svg>,
  sparkle:   (s=15)=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>,
  mapPin:    (s=15)=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  fileEdit:  (s=15)=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="10" y1="12" x2="14" y2="12"/><line x1="10" y1="16" x2="14" y2="16"/></svg>,
  medal:     (s=15)=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="14" r="6"/><path d="M8.56 2.8a.5.5 0 0 1 .68-.2L12 4l2.76-1.4a.5.5 0 0 1 .68.2l1.64 3.18-2.76 1.4L12 6l-2.32 1.38-2.76-1.4Z"/><path d="m12 8 2.32 1.38L17.08 8"/><path d="M6.92 8 9.68 9.38 12 8"/></svg>,
  chatAI:    (s=15)=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="m9 10 1.5 1.5L13 9"/></svg>,
  kpi:       (s=15)=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>,
  payslip:   (s=15)=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v3"/><path d="M21 16v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3"/><rect x="1" y="8" width="22" height="8" rx="1"/><line x1="8" y1="12" x2="8" y2="12.01"/><line x1="12" y1="12" x2="16" y2="12"/></svg>,
  logout:    (s=14)=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
};

/* ─── MENU STRUCTURE ───────────────────────────────────────────────────────── */
const superadminGroups = [
  {
    key: 'control',
    title: 'Tizim Nazorati',
    icon: I.shield,
    items: [
      { href: '/superadmin',                label: 'Monitoring',    icon: I.gauge    },
      { href: '/superadmin/organizations',  label: 'Tashkilotlar',  icon: I.building2},
      { href: '/superadmin/ai',             label: 'AI Maslahat',   icon: I.brain    },
      { href: '/superadmin/settings',       label: 'Sozlamalar',    icon: I.sliders  },
    ],
  },
];

const adminGroups = [
  {
    key: 'core',
    title: 'Boshqaruv',
    icon: I.layout,
    items: [
      { href: '/admin',           label: 'Dashboard',         icon: I.home  },
      { href: '/admin/employees', label: 'Xodimlar',          icon: I.users },
    ],
  },
  {
    key: 'sales',
    title: 'Sotuv Bo\'limi',
    icon: I.trending,
    items: [
      { href: '/admin/strategy', label: 'Sotuv Rejasi',      icon: I.target    },
      { href: '/admin/funnel',   label: 'Sotuv Voronkasi',   icon: I.funnel    },
      { href: '/admin/sources', label: 'Lid Manbalari',    icon: I.target    },
      { href: '/admin/reports',  label: 'Kunlik Hisobotlar', icon: I.clipboard },
      { href: '/admin/feedback', label: 'Taklif & Shikoyat', icon: I.chatAI   },
    ],
  },
  {
    key: 'finance',
    title: 'Moliya',
    icon: I.wallet,
    items: [
      { href: '/admin/salary',    label: 'Ish Haqlar',      icon: I.coin   },
      { href: '/admin/penalties', label: 'Jarimalar',       icon: I.alertX },
      { href: '/admin/bonuses',   label: 'Bonuslar',        icon: I.gift   },
      { href: '/admin/finance',   label: 'Jarima & Bonus',  icon: I.scale  },
      { href: '/admin/leave',     label: 'Ruxsat & Jarimalar', icon: I.clipboard },
    ],
  },
  {
    key: 'analytics',
    title: 'Tahlil',
    icon: I.chartBar,
    items: [
      { href: '/admin/ratings',  label: 'Reyting',     icon: I.trophy  },
      { href: '/admin/chat',     label: 'AI Intellect', icon: I.sparkle },
      { href: '/admin/location', label: 'Ofis Joylashuvi', icon: I.mapPin },
      { href: '/admin/settings', label: 'Sozlamalar',   icon: I.sliders },
    ],
  },
];

const employeeGroups = [
  {
    key: 'daily',
    title: 'Kunlik',
    icon: I.briefcase,
    items: [
      { href: '/employee',          label: 'Dashboard',         icon: I.home      },
      { href: '/employee/checkin',  label: 'Nazorat Punkti',    icon: I.mapPin    },
      { href: '/employee/report',   label: 'Hisobot Yozish',    icon: I.fileEdit  },
      { href: '/employee/feedback', label: 'Taklif & Shikoyat', icon: I.chatAI   },
      { href: '/employee/leave',    label: 'Ruxsat So\'rash',   icon: I.clipboard },
    ],
  },
  {
    key: 'performance',
    title: 'Natijalar',
    icon: I.star,
    items: [
      { href: '/employee/kpi',      label: 'KPI',          icon: I.kpi     },
      { href: '/employee/salary',   label: 'Ish Haqi',     icon: I.payslip },
      { href: '/employee/ratings',  label: 'Reyting',      icon: I.medal   },
      { href: '/employee/chat',     label: 'AI Assistent', icon: I.chatAI  },
    ],
  },
];

/* ─── COMPONENT ────────────────────────────────────────────────────────────── */
export default function Sidebar() {
  const pathname  = usePathname();
  const { data: session } = useSession();
  const navRef    = useRef(null);
  const [expandedGroups, setExpandedGroups] = useState({});
  const [mounted,  setMounted]  = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    const role   = session?.user?.role;
    const groups = role === 'SUPERADMIN' ? superadminGroups
                 : role === 'ADMIN'      ? adminGroups
                 : employeeGroups;
    const init = {};
    if (groups) {
      groups.forEach(g => { init[g.key] = g.items.some(i => i.href === pathname); });
    }
    setExpandedGroups(init);
    setMounted(true);
    setTimeout(() => {
      try {
        const s = sessionStorage.getItem('sidebarScroll');
        if (s && navRef.current) navRef.current.scrollTop = +s;
      } catch {}
    }, 10);

    // Mobile sidebar events
    const handleToggle = () => setIsMobileOpen(p => !p);
    const handleClose = () => setIsMobileOpen(false);
    window.addEventListener('toggle-sidebar', handleToggle);
    window.addEventListener('close-sidebar', handleClose);
    return () => {
      window.removeEventListener('toggle-sidebar', handleToggle);
      window.removeEventListener('close-sidebar', handleClose);
    };
  }, [pathname, session]);

  const handleScroll = e => sessionStorage.setItem('sidebarScroll', e.target.scrollTop);
  const toggle = key => setExpandedGroups(p => ({ ...p, [key]: !p[key] }));
  const closeMobile = () => { if (window.innerWidth <= 768) setIsMobileOpen(false); };

  if (!session) return null;

  const role   = session.user.role || 'EMPLOYEE';
  const rc     = ROLE_CONFIG[role] || ROLE_CONFIG.EMPLOYEE;
  const groups = role === 'SUPERADMIN' ? superadminGroups
               : role === 'ADMIN'      ? adminGroups
               : employeeGroups;

  const nameInitials = (session.user.name || 'U')
    .split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <>
      {isMobileOpen && (
        <div 
          onClick={() => setIsMobileOpen(false)}
          className="sidebar-overlay"
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1040, backdropFilter: 'blur(3px)' }}
        />
      )}
      <aside className={`sidebar ${isMobileOpen ? 'open' : ''}`}>

      {/* ── BRAND ── */}
      <div style={{
        padding: '0 14px',
        height: 'var(--navbar-height)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '1px solid var(--border)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '9px', minWidth: 0 }}>
          <div style={{
            width: '28px', height: '28px', borderRadius: '7px',
            background: rc.gradient,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 900, fontSize: '12px', color: '#fff',
            flexShrink: 0, boxShadow: `0 2px 8px ${rc.accentGlow}`,
          }}>
            {(session.user.organizationName || 'S').charAt(0).toUpperCase()}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text)', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '120px' }}>
              {session.user.organizationName || 'SalesCRM'}
            </div>
            <div style={{ fontSize: '9px', color: 'var(--text-3)', fontWeight: 500, letterSpacing: '0.3px' }}>Workspace</div>
          </div>
        </div>
        {/* Role badge */}
        <div style={{
          padding: '2px 7px', borderRadius: '99px',
          background: rc.accentLight,
          border: `1px solid ${rc.accent}33`,
          fontSize: '8.5px', fontWeight: 800,
          color: rc.accent, letterSpacing: '0.5px',
          flexShrink: 0, textTransform: 'uppercase',
        }}>
          {rc.badge}
        </div>
      </div>

      {/* ── NAV ── */}
      <nav
        ref={navRef}
        onScroll={handleScroll}
        style={{
          flex: 1, overflowY: 'auto', padding: '10px 8px',
          scrollbarWidth: 'none',
          opacity: mounted ? 1 : 0, transition: 'opacity 0.2s',
        }}
      >
        {groups.map((group) => {
          const isOpen   = mounted ? expandedGroups[group.key] === true : group.items.some(i => i.href === pathname);
          const hasActive = group.items.some(i => pathname === i.href);

          return (
            <div key={group.key} style={{ marginBottom: '4px' }}>

              {/* Group header */}
              <button
                onClick={() => toggle(group.key)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '5px 8px', borderRadius: '7px',
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  fontFamily: 'Inter, sans-serif',
                  color: isOpen ? 'var(--text-2)' : hasActive ? rc.accent : 'var(--text-3)',
                  transition: 'all 0.15s',
                  marginBottom: '2px',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--sidebar-hover-bg)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {/* Group icon with colored dot when active */}
                  <div style={{
                    width: '20px', height: '20px', borderRadius: '5px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: (isOpen || hasActive) ? rc.accentLight : 'transparent',
                    color: (isOpen || hasActive) ? rc.accent : 'var(--text-3)',
                    transition: 'all 0.15s', flexShrink: 0,
                  }}>
                    {group.icon(11)}
                  </div>
                  <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                    {group.title}
                  </span>
                  {hasActive && !isOpen && (
                    <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: rc.accent, flexShrink: 0 }} />
                  )}
                </div>
                <svg
                  width="11" height="11" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2.5"
                  strokeLinecap="round" strokeLinejoin="round"
                  style={{ transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : 'rotate(0)', opacity: 0.5, flexShrink: 0 }}
                >
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>

              {/* Items */}
              <div style={{
                overflow: 'hidden',
                maxHeight: isOpen ? `${group.items.length * 34}px` : '0px',
                opacity: isOpen ? 1 : 0,
                transition: 'max-height 0.22s ease, opacity 0.18s ease',
              }}>
                {group.items.map(item => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={closeMobile}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        padding: '5px 8px 5px 10px',
                        marginBottom: '1px',
                        borderRadius: '7px',
                        textDecoration: 'none',
                        position: 'relative',
                        background: isActive ? rc.accentLight : 'transparent',
                        color: isActive ? rc.accent : 'var(--text-2)',
                        transition: 'all 0.14s',
                        fontWeight: isActive ? 600 : 400,
                        fontSize: '12px',
                      }}
                      onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--sidebar-hover-bg)'; }}
                      onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                    >
                      {/* Active indicator bar */}
                      {isActive && (
                        <span style={{
                          position: 'absolute', left: 0, top: '18%', bottom: '18%',
                          width: '2.5px', borderRadius: '0 2px 2px 0',
                          background: rc.accent,
                        }} />
                      )}
                      {/* Icon box */}
                      <div style={{
                        width: '22px', height: '22px', borderRadius: '5px', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: isActive ? `${rc.accent}22` : 'transparent',
                        color: isActive ? rc.accent : 'var(--text-3)',
                        transition: 'all 0.14s',
                      }}>
                        {item.icon(13)}
                      </div>
                      {item.label}
                    </Link>
                  );
                })}
              </div>

            </div>
          );
        })}
      </nav>

      {/* ── FOOTER / USER PROFILE ── */}
      <div style={{
        padding: '10px 12px 12px',
        borderTop: '1px solid var(--border)',
        flexShrink: 0,
      }}>
        {/* Profile card */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '9px',
          padding: '8px 10px', borderRadius: '9px',
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border)',
          marginBottom: '8px',
        }}>
          {/* Avatar */}
          <div style={{
            width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
            background: rc.gradient,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, fontSize: '12px', color: '#fff',
            boxShadow: `0 0 0 2px var(--bg-elevated), 0 0 0 3.5px ${rc.accent}50`,
          }}>
            {nameInitials}
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {session.user.name}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '1px' }}>
              <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: rc.accent, flexShrink: 0 }} />
              <span style={{ fontSize: '9.5px', color: rc.accent, fontWeight: 600 }}>{rc.label}</span>
            </div>
          </div>
        </div>

        <button
          onClick={async () => {
            await signOut({ redirect: false });
            window.location.href = '/login';
          }}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
            padding: '7px 12px', borderRadius: '7px', cursor: 'pointer',
            background: 'transparent',
            border: '1px solid var(--border)',
            color: 'var(--text-3)', fontSize: '11px', fontWeight: 600,
            fontFamily: 'Inter, sans-serif',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(244,63,94,0.08)';
            e.currentTarget.style.borderColor = 'rgba(244,63,94,0.25)';
            e.currentTarget.style.color = '#f43f5e';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.borderColor = 'var(--border)';
            e.currentTarget.style.color = 'var(--text-3)';
          }}
        >
          {I.logout()}
          Tizimdan chiqish
        </button>
      </div>

    </aside>
    </>
  );
}
