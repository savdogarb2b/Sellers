'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';

const icons = {
  system: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
  executive: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>,
  revenue: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  capital: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 18V6"/></svg>,
  analytics: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  operations: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>,
  intelligence: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  
  // Sub-icons
  activity: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  building: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/></svg>,
  bot: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><line x1="8" y1="16" x2="8" y2="16"/><line x1="16" y1="16" x2="16" y2="16"/></svg>,
  settings: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  home: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  users: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  fileText: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
  funnel: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>,
  calendar: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  dollar: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
  minus: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="8" y1="12" x2="16" y2="12"/></svg>,
  plus: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>,
  edit: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  award: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>,
};

const superadminGroups = [
  {
    title: 'Tizim Nazorati',
    icon: icons.system,
    items: [
      { href: '/superadmin', label: 'Monitor', icon: icons.activity },
      { href: '/superadmin/organizations', label: 'Tashkilotlar', icon: icons.building },
      { href: '/superadmin/ai', label: 'AI Maslahat', icon: icons.bot },
      { href: '/superadmin/settings', label: 'Sozlamalar', icon: icons.settings },
    ],
  },
];

const adminGroups = [
  {
    title: 'Boshqaruv',
    icon: icons.executive,
    items: [
      { href: '/admin', label: 'Bosh Sahifa', icon: icons.home },
      { href: '/admin/employees', label: 'Xodimlar', icon: icons.users },
    ],
  },
  {
    title: 'Sotuv Bo\'limi',
    icon: icons.revenue,
    items: [
      { href: '/admin/strategy', label: 'Sotuv Rejasi', icon: icons.fileText },
      { href: '/admin/funnel', label: 'Sotuv Voronkasi', icon: icons.funnel },
      { href: '/admin/reports', label: 'Kunlik Hisobotlar', icon: icons.calendar },
    ],
  },
  {
    title: 'Kapital va Moliya',
    icon: icons.capital,
    items: [
      { href: '/admin/salary', label: 'Ish Haqlar', icon: icons.dollar },
      { href: '/admin/penalties', label: 'Jarimalar', icon: icons.minus },
      { href: '/admin/bonuses', label: 'Bonuslar', icon: icons.plus },
      { href: '/admin/finance', label: 'Jarima va Bonus', icon: icons.edit },
    ],
  },
  {
    title: 'Tahlil va Reyting',
    icon: icons.analytics,
    items: [
      { href: '/admin/ratings', label: 'Liderlar Reytingi', icon: icons.award },
      { href: '/admin/chat', label: 'AI Intellect', icon: icons.bot },
      { href: '/admin/settings', label: 'Sozlamalar', icon: icons.settings },
    ],
  },
];

const employeeGroups = [
  {
    title: 'Kunlik Faoliyat',
    icon: icons.operations,
    items: [
      { href: '/employee', label: 'Panel', icon: icons.activity },
      { href: '/employee/checkin', label: 'Nazorat Punkti', icon: icons.calendar },
      { href: '/employee/report', label: 'Hisobot', icon: icons.fileText },
    ],
  },
  {
    title: 'Ko\'rsatkichlar',
    icon: icons.intelligence,
    items: [
      { href: '/employee/ratings', label: 'Reyting', icon: icons.award },
      { href: '/employee/chat', label: 'AI Assistent', icon: icons.bot },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const navRef = useRef(null);

  const [expandedGroups, setExpandedGroups] = useState({});
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // Determine which groups should be open based ONLY on current pathname
    const role = session?.user?.role;
    const groups = role === 'SUPERADMIN' ? superadminGroups : 
                   role === 'ADMIN' ? adminGroups : employeeGroups;
                   
    let initialExpanded = {};
    groups.forEach(group => {
      if (group.items.some(item => item.href === pathname)) {
        initialExpanded[group.title] = true;
      } else {
        initialExpanded[group.title] = false;
      }
    });
    setExpandedGroups(initialExpanded);
    setIsMounted(true);

    // Restore scroll position gracefully without causing a jump/flash
    setTimeout(() => {
      try {
        const savedScroll = sessionStorage.getItem('sidebarScroll');
        if (savedScroll && navRef.current) {
          navRef.current.scrollTop = parseInt(savedScroll, 10);
        }
      } catch (e) {}
    }, 10);
  }, [pathname, session]);

  const handleScroll = (e) => {
    sessionStorage.setItem('sidebarScroll', e.target.scrollTop);
  };

  const toggleGroup = (title) => {
    setExpandedGroups(prev => ({
      ...prev,
      [title]: !prev[title]
    }));
  };

  if (!session) return null;

  const role = session.user.role;
  const groups = role === 'SUPERADMIN' ? superadminGroups : 
                 role === 'ADMIN' ? adminGroups : employeeGroups;
  
  const roleLabel = role === 'SUPERADMIN' ? 'SUPER' : 
                    role === 'ADMIN' ? 'ADMIN' : 'USER';

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-logo">C+</div>
        <div className="brand-details">
          <h1 style={{ fontSize: '13px', fontWeight: 800, letterSpacing: '0.5px' }}>{session.user.organizationName || 'SalesCRM'}</h1>
          <p style={{ fontSize: '9px', fontWeight: 600, color: 'var(--text-muted)' }}>Workspace</p>
        </div>
      </div>

      <nav className="sidebar-nav" ref={navRef} onScroll={handleScroll} style={!isMounted ? { opacity: 0 } : { opacity: 1, transition: 'opacity 0.2s ease' }}>
        {groups.map((group, i) => {
          // If not mounted yet, assume only the active group is expanded
          const isExpanded = isMounted 
            ? expandedGroups[group.title] === true 
            : group.items.some(item => item.href === pathname);
            
          const hasActiveItem = group.items.some(item => pathname === item.href);

          return (
            <div key={i} style={{ marginBottom: '4px' }}>
              <div 
                className={`sidebar-section-dropdown ${isExpanded ? 'active' : ''}`}
                onClick={() => toggleGroup(group.title)}
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '10px 16px', margin: '4px 12px', borderRadius: '12px',
                  cursor: 'pointer',
                  background: isExpanded ? 'rgba(255,255,255,0.03)' : 'transparent',
                  color: hasActiveItem && !isExpanded ? 'var(--primary-400)' : (isExpanded ? 'var(--text-primary)' : 'var(--text-ghost)'),
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => { if(!isExpanded) e.currentTarget.style.background = 'rgba(255,255,255,0.02)' }}
                onMouseLeave={e => { if(!isExpanded) e.currentTarget.style.background = 'transparent' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>
                  {group.icon && <span style={{ display: 'inline-flex', alignItems: 'center', opacity: 0.8 }}>{group.icon}</span>}
                  {group.title}
                </div>
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: '20px', height: '20px', borderRadius: '50%',
                  background: isExpanded ? 'rgba(255,255,255,0.05)' : 'transparent',
                  transition: 'all 0.3s ease',
                  transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)'
                }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </div>
              </div>
              
              <div style={{
                overflow: 'hidden',
                transition: 'max-height 0.3s ease, opacity 0.3s ease',
                maxHeight: isExpanded ? `${group.items.length * 45}px` : '0px',
                opacity: isExpanded ? 1 : 0,
                display: 'flex', flexDirection: 'column',
                paddingLeft: '12px'
              }}>
                {group.items.map(item => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`sidebar-link ${isActive ? 'active' : ''}`}
                      style={{ paddingLeft: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}
                    >
                      {item.icon && <span style={{ display: 'inline-flex', alignItems: 'center', opacity: isActive ? 1 : 0.6, color: isActive ? 'var(--primary-400)' : 'var(--text-secondary)' }}>{item.icon}</span>}
                      <span className="link-text" style={{ fontWeight: isActive ? 700 : 500 }}>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-user-avatar" style={{ fontSize: '12px', width: '30px', height: '30px' }}>
            {session.user.name?.charAt(0) || 'U'}
          </div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name" style={{ fontSize: '12px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100px' }}>{session.user.name}</div>
            <div className="sidebar-user-role" style={{ fontSize: '9px' }}>{roleLabel}</div>
          </div>
        </div>
        <button className="logout-btn" onClick={() => signOut({ callbackUrl: '/login' })}>
          CHIQISH
        </button>
      </div>
    </aside>
  );
}
