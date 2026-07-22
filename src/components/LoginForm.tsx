'use client';

import { useState } from 'react';
import { useApp } from '@/lib/store';
import { useRouter } from 'next/navigation';
// ***** TEMPORAL: importar Link cuando se restaure el registro
// import Link from 'next/link';
// ***********************************

export function LoginForm() {
  const { dispatch } = useApp();
  const router = useRouter();
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPw, setShowPw] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!usuario.trim() || !password) return;
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: usuario.trim(), password }),
      });

      let body: any;
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        body = await res.json();
      } else {
        const text = await res.text();
        console.error('Respuesta no JSON:', res.status, text.slice(0, 200));
        throw new Error(`Respuesta inesperada del servidor (${res.status})`);
      }

      if (!res.ok) {
        setError(body.detail || 'Error al iniciar sesión');
        setLoading(false);
        return;
      }

      // Usuario tiene múltiples clientes -> redirigir a selección
      if (body.cliente_id === null && body.cliente_ids && body.cliente_ids.length > 1) {
        dispatch({ type: 'SET_USER', payload: body });
        localStorage.setItem('mercurio_user', JSON.stringify(body));
        router.push('/seleccionar-cliente');
        return;
      }

      // Usuario con un solo cliente -> AppProvider cargará los datos al montar
      dispatch({ type: 'SET_USER', payload: body });
      localStorage.setItem('mercurio_user', JSON.stringify(body));

      router.push('/');
    } catch (e: any) {
      console.error('Login error:', e);
      setError(e.message || 'Error de conexión con el servidor');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div id="login-screen" className="screen active">
      <div className="login-card">
        <div className="login-header">
          <svg width="64" height="64" viewBox="0 0 175.216 175.552">
            <path fill="#075E54" d="M87.184 25.227c-33.733 0-61.166 27.423-61.178 61.13a60.98 60.98 0 0 0 9.349 32.535l1.455 2.312-6.179 22.559 23.146-6.069 2.235 1.324c9.387 5.571 20.15 8.518 31.126 8.524h.023c33.707 0 61.14-27.426 61.153-61.135a60.75 60.75 0 0 0-17.895-43.251 60.75 60.75 0 0 0-43.235-17.929z"/>
            <path fill="#fff" fillRule="evenodd" d="M68.772 55.603c-1.378-3.061-2.828-3.123-4.137-3.176l-3.524-.043c-1.226 0-3.218.46-4.902 2.3s-6.435 6.287-6.435 15.332 6.588 17.785 7.506 19.013 12.718 20.381 31.405 27.75c15.529 6.124 18.689 4.906 22.061 4.6s10.877-4.447 12.408-8.74 1.532-7.971 1.073-8.74-1.685-1.226-3.525-2.146-10.877-5.367-12.562-5.981-2.91-.919-4.137.921-4.746 5.979-5.819 7.206-2.144 1.381-3.984.462-7.76-2.861-14.784-9.124c-5.465-4.873-9.154-10.891-10.228-12.73s-.114-2.835.808-3.751c.825-.824 1.838-2.147 2.759-3.22s1.224-1.84 1.836-3.065.307-2.301-.153-3.22-4.032-10.011-5.666-13.647"/>
          </svg>
          <h1>Mercurio Software</h1>
          <p className="subtitle">Plataforma de envío masivo de mensajes</p>
        </div>
        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="usuario">Usuario</label>
            <input
              type="text"
              id="usuario"
              placeholder="Nombre de usuario"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              required
              autoComplete="username"
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <div className="input-wrapper">
              <input
                type={showPw ? 'text' : 'password'}
                id="password"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPw(!showPw)}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  {showPw ? (
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19M1 1l23 23" />
                  ) : (
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  )}
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </button>
            </div>
          </div>
          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" strokeDasharray="31.4 31.4" strokeLinecap="round">
                    <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite" />
                  </circle>
                </svg>
                Ingresando...
              </span>
            ) : (
              'Ingresar'
            )}
          </button>
        </form>
        {/** TODO TEMPORAL: restaurar link de registro cuando el usuario lo solicite
        <div className="login-footer" style={{ marginTop: 16, textAlign: 'center' }}>
          <Link href="/register" style={{ color: '#075E54', fontSize: 14, textDecoration: 'underline' }}>
            ¿No tienes cuenta? Regístrate
          </Link>
        </div>
        ***********************************/}
        {error && <p className="login-error">{error}</p>}
      </div>
    </div>
  );
}
