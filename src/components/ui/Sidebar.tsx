'use client';

import { useApp } from '@/lib/store';
import { useRouter, usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { section: 'dashboard', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { section: 'templates', label: 'Crear Plantillas', icon: 'M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7' },
  { section: 'send', label: 'Configurar plantillas', icon: 'M12 19l9 2-9-18-9 18 9-2zm0 0v-8' },
  { section: 'prospects', label: 'Prospectos', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
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
      <div className="sidebar-brand" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
        <span style={{ color: '#075E54', fontSize: 16, fontWeight: 700 }}>Mercurio Software</span>
        <svg width="28" height="28" viewBox="0 0 175.216 175.552" fill="#fff" style={{ stroke: '#075E54', strokeWidth: 14 }}>
          <path d="M87.184 25.227c-33.733 0-61.166 27.423-61.178 61.13a60.98 60.98 0 0 0 9.349 32.535l1.455 2.312-6.179 22.559 23.146-6.069 2.235 1.324c9.387 5.571 20.15 8.518 31.126 8.524h.023c33.707 0 61.14-27.426 61.153-61.135a60.75 60.75 0 0 0-17.895-43.251 60.75 60.75 0 0 0-43.235-17.929z"/>
          <path fill="#075E54" transform="translate(26, 26) scale(0.7)" d="M68.772 55.603c-1.378-3.061-2.828-3.123-4.137-3.176l-3.524-.043c-1.226 0-3.218.46-4.902 2.3s-6.435 6.287-6.435 15.332 6.588 17.785 7.506 19.013 12.718 20.381 31.405 27.75c15.529 6.124 18.689 4.906 22.061 4.6s10.877-4.447 12.408-8.74 1.532-7.971 1.073-8.74-1.685-1.226-3.525-2.146-10.877-5.367-12.562-5.981-2.91-.919-4.137.921-4.746 5.979-5.819 7.206-2.144 1.381-3.984.462-7.76-2.861-14.784-9.124c-5.465-4.873-9.154-10.891-10.228-12.73s-.114-2.835.808-3.751c.825-.824 1.838-2.147 2.759-3.22s1.224-1.84 1.836-3.065.307-2.301-.153-3.22-4.032-10.011-5.666-13.647"/>
        </svg>
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
        <div style={{ textAlign: 'center', marginTop: '180px' }}>
          <img
            src="/Logo_P&A_transp.png"
            alt=""
            width={80}
            height={79}
          />
        </div>
      </div>
    </aside>
  );
}
