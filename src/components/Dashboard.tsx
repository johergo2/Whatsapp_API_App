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
    <section id="section-dashboard" className="section active">
      <div className="section-header">
        <h2>Dashboard</h2>
        <p>Resumen de su plan y actividad</p>
      </div>

      <div className="card">
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
