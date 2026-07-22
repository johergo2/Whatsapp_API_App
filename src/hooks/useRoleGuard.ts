'use client';

import { useApp } from '@/lib/store';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';

const ALLOWED_ROUTES: Record<string, string[]> = {
  superadmin: [
    '/', '/login', '/chat', '/templates', '/send', '/prospects',
    '/history', '/history/detail', '/history/detailed', '/upload',
    '/seleccionar-cliente', '/register',
  ],
  usuario: [
    '/', '/login', '/chat', '/templates', '/send', '/prospects',
    '/history', '/upload', '/seleccionar-cliente', '/register',
  ],
  envíos: [
    '/', '/login', '/prospects', '/seleccionar-cliente', '/register',
  ],
};

export function useRoleGuard() {
  const { state } = useApp();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (state.sessionLoading) return;

    if (!state.user) {
      if (pathname !== '/login') {
        router.replace('/login');
      }
      return;
    }

    const allowed = ALLOWED_ROUTES[state.user.rol];
    if (allowed && !allowed.includes(pathname)) {
      router.replace('/');
    }
  }, [state.user, state.sessionLoading, pathname, router]);
}
