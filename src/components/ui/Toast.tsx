'use client';

import { useEffect } from 'react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  onClose: () => void;
}

export function Toast({ message, type = 'info', onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const colors: Record<string, string> = {
    success: '#E8F5E9',
    error: '#FFEBEE',
    warning: '#FFF3E0',
    info: '#E3F2FD',
  };

  const textColors: Record<string, string> = {
    success: '#2E7D32',
    error: '#C62828',
    warning: '#E65100',
    info: '#1565C0',
  };

  return (
    <div
      className="toast-inline"
      style={{
        background: colors[type],
        color: textColors[type],
        border: `1px solid ${colors[type]}`,
      }}
    >
      {message}
    </div>
  );
}
