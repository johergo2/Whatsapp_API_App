'use client';

import { useApp } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function LoginPage() {
  const { state, dispatch } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (state.cliente) {
      router.push('/');
    }
  }, [state.cliente, router]);

  return null;
}
