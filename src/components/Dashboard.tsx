'use client';

import { useApp } from '@/lib/store';
import { Card } from '@/components/ui/Card';

function formatDate(dateStr: string) {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    return isNaN(d.getTime())
      ? dateStr
      : d.toLocaleDateString('es-CO', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        });
  } catch {
    return dateStr;
  }
}

export function Dashboard() {
  const { state } = useApp();
  const c = state.cliente;

  if (!c) return null;

  const usadas = c.requests_usadas || 0;
  const max = c.requests_max || 1;
  const disponibles = max - usadas;
  const pct = Math.min(100, Math.round((usadas / max) * 100));
  const cutoff = c.periodo_fin ? formatDate(c.periodo_fin) : '';

  return (
    <section id="section-dashboard" className="section active" style={{ position: 'relative', marginTop: -32 }}>
      <img
        src="/Productosasesorias_transp.png"
        alt=""
        width={180}
        height={83}
        style={{ position: 'absolute', top: 24, right: 0, zIndex: 0 }}
      />
      <div className="section-header" style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center' }}>
                <svg width="56" height="56" viewBox="0 0 175.216 175.552" style={{ marginBottom: 4 }}>
                  <path fill="#075E54" stroke="#fff" strokeWidth="16" d="M87.184 25.227c-33.733 0-61.166 27.423-61.178 61.13a60.98 60.98 0 0 0 9.349 32.535l1.455 2.312-6.179 22.559 23.146-6.069 2.235 1.324c9.387 5.571 20.15 8.518 31.126 8.524h.023c33.707 0 61.14-27.426 61.153-61.135a60.75 60.75 0 0 0-17.895-43.251 60.75 60.75 0 0 0-43.235-17.929z"/>
                  <path fill="#fff" fillRule="evenodd" d="M68.772 55.603c-1.378-3.061-2.828-3.123-4.137-3.176l-3.524-.043c-1.226 0-3.218.46-4.902 2.3s-6.435 6.287-6.435 15.332 6.588 17.785 7.506 19.013 12.718 20.381 31.405 27.75c15.529 6.124 18.689 4.906 22.061 4.6s10.877-4.447 12.408-8.74 1.532-7.971 1.073-8.74-1.685-1.226-3.525-2.146-10.877-5.367-12.562-5.981-2.91-.919-4.137.921-4.746 5.979-5.819 7.206-2.144 1.381-3.984.462-7.76-2.861-14.784-9.124c-5.465-4.873-9.154-10.891-10.228-12.73s-.114-2.835.808-3.751c.825-.824 1.838-2.147 2.759-3.22s1.224-1.84 1.836-3.065.307-2.301-.153-3.22-4.032-10.011-5.666-13.647"/>
                </svg>
                <div style={{ color: '#075E54', fontSize: 22, fontWeight: 700, marginTop: -12, marginBottom: 2 }}>Mercurio Software</div>
        </div>
        <h2>Dashboard</h2>
        <p>Resumen de su plan y actividad</p>
      </div>

      <div className="card" style={{ marginTop: 4 }}>
        <h3>Plan contratado</h3>
        <div className="summary-grid">
          <div>
            <span className="summary-label">Plan</span>
            <span className="summary-value">{c.plan || 'Sin plan'}</span>
          </div>
          <div>
            <span className="summary-label">WhatsApp</span>
            <span className="summary-value">{c.display_number || '-'}</span>
          </div>
          <div>
            <span className="summary-label">Phone ID</span>
            <span className="summary-value" style={{ fontSize: 12 }}>{c.phone_number_id || '-'}</span>
          </div>
          <div>
            <span className="summary-label">Usados</span>
            <span className="summary-value">{usadas}</span>
          </div>
          <div>
            <span className="summary-label">Total / Disponibles</span>
            <span className="summary-value">
              {max} / {disponibles}
            </span>
          </div>
          <div>
            <span className="summary-label">Vigencia</span>
            <span className="summary-value">{c.periodo_fin ? formatDate(c.periodo_fin) : '-'}</span>
          </div>
        </div>
        {cutoff && (
          <p style={{ fontSize: 13, color: '#667781', marginTop: 8 }}>
            Corte: {cutoff}
          </p>
        )}
        <div className="progress-container" style={{ marginTop: 16 }}>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: pct + '%' }} />
          </div>
          <span className="progress-text">{pct}%</span>
        </div>
      </div>

      <div className="card">
        <h3>Resumen de envíos</h3>
        <div className="summary-grid">
          <div>
            <span className="summary-label">Prospectos</span>
            <span className="summary-value">{state.prospects.length}</span>
          </div>
          <div>
            <span className="summary-label">Enviados</span>
            <span className="summary-value">{state.prospects.filter((p) => p.estado).length}</span>
          </div>
          <div>
            <span className="summary-label">Pendientes</span>
            <span className="summary-value">{state.prospects.filter((p) => !p.estado).length}</span>
          </div>
          <div>
            <span className="summary-label">Plantillas</span>
            <span className="summary-value">{state.templates.length}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
