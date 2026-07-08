'use client';

import { useApp } from '@/lib/store';
import { useRouter, usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { section: 'dashboard', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { section: 'templates', label: 'Plantillas', icon: 'M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7' },
  { section: 'prospects', label: 'Prospectos', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
  { section: 'send', label: 'Enviar mensajes', icon: 'M12 19l9 2-9-18-9 18 9-2zm0 0v-8' },
  { section: 'history', label: 'Historial', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
];

export function Sidebar() {
  const { state } = useApp();
  const router = useRouter();
  const pathname = usePathname();

  function navigate(section: string) {
    router.push(section === 'dashboard' ? '/' : `/${section}`);
  }

  const current = pathname === '/' ? 'dashboard' : pathname.slice(1);

  return (
    <aside className="sidebar" id="sidebar">
      <div className="sidebar-brand">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
        </svg>
        <span>Mercurio Send</span>
      </div>
      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item) => (
          <a
            key={item.section}
            className={`nav-item ${current === item.section ? 'active' : ''}`}
            onClick={() => navigate(item.section)}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d={item.icon} />
            </svg>
            {item.label}
          </a>
        ))}
      </nav>
      <div className="sidebar-footer">
        <div className="badge" id="badge-msg-count">
          {state.prospects.filter((p) => p.estado).length} / {state.prospects.length} mensajes
        </div>
      </div>
    </aside>
  );
}
