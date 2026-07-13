'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/store';
import type { Cliente } from '@/types';

export default function SeleccionarClientePage() {
  const { state, dispatch } = useApp();
  const router = useRouter();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const user = state.user;
    if (!user || !user.cliente_ids || user.cliente_ids.length <= 1) {
      router.push('/');
      return;
    }

    const clienteIds = user.cliente_ids;

    async function loadClientes() {
      try {
        const responses = await Promise.all(
          clienteIds.map((id) =>
            fetch(`/api/cliente?cliente_id=${id}`, {
              headers: { 'X-Cliente-Id': String(id) },
            }).then((r) => r.json()).catch(() => null)
          )
        );
        const valid = responses.filter((c) => c && c.id) as Cliente[];
        setClientes(valid);
      } catch {
        setError('Error cargando clientes');
      } finally {
        setLoading(false);
      }
    }

    loadClientes();
  }, [state.user, router]);

  async function handleSelect(clienteId: number) {
    const user = { ...state.user!, cliente_id: clienteId };
    dispatch({ type: 'SET_USER', payload: user });
    localStorage.setItem('mercurio_user', JSON.stringify(user));
    router.push('/');
  }

  if (loading) {
    return (
      <div id="login-screen" className="screen active">
        <div className="login-card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p>Cargando clientes...</p>
        </div>
      </div>
    );
  }

  return (
    <div id="login-screen" className="screen active">
      <div className="login-card" style={{ maxWidth: 480 }}>
        <div className="login-header">
          <svg width="64" height="64" viewBox="0 0 175.216 175.552">
            <path fill="#075E54" d="M87.184 25.227c-33.733 0-61.166 27.423-61.178 61.13a60.98 60.98 0 0 0 9.349 32.535l1.455 2.312-6.179 22.559 23.146-6.069 2.235 1.324c9.387 5.571 20.15 8.518 31.126 8.524h.023c33.707 0 61.14-27.426 61.153-61.135a60.75 60.75 0 0 0-17.895-43.251 60.75 60.75 0 0 0-43.235-17.929z"/>
            <path fill="#fff" fillRule="evenodd" d="M68.772 55.603c-1.378-3.061-2.828-3.123-4.137-3.176l-3.524-.043c-1.226 0-3.218.46-4.902 2.3s-6.435 6.287-6.435 15.332 6.588 17.785 7.506 19.013 12.718 20.381 31.405 27.75c15.529 6.124 18.689 4.906 22.061 4.6s10.877-4.447 12.408-8.74 1.532-7.971 1.073-8.74-1.685-1.226-3.525-2.146-10.877-5.367-12.562-5.981-2.91-.919-4.137.921-4.746 5.979-5.819 7.206-2.144 1.381-3.984.462-7.76-2.861-14.784-9.124c-5.465-4.873-9.154-10.891-10.228-12.73s-.114-2.835.808-3.751c.825-.824 1.838-2.147 2.759-3.22s1.224-1.84 1.836-3.065.307-2.301-.153-3.22-4.032-10.011-5.666-13.647"/>
          </svg>
          <h1>Mercurio Software</h1>
          <p className="subtitle">Seleccione el cliente a gestionar</p>
        </div>

        <div className="client-list">
          {clientes.map((cliente) => (
            <button
              key={cliente.id}
              type="button"
              className="client-card"
              onClick={() => handleSelect(cliente.id)}
            >
              <div className="client-name">{cliente.nombre_comercial}</div>
              <div className="client-meta">
                <span>{cliente.display_number}</span>
                <span>Plan: {cliente.plan}</span>
              </div>
              <div className="client-available">
                {cliente.requests_max - cliente.requests_usadas} disponibles de {cliente.requests_max}
              </div>
            </button>
          ))}

          {error && <p className="login-error">{error}</p>}
        </div>
      </div>
    </div>
  );
}