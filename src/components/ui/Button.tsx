'use client';

import { ReactNode } from 'react';

interface ButtonProps {
  children: ReactNode;
  variant?: 'primary' | 'outline' | 'danger' | 'danger-solid';
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit';
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  onClick,
  disabled,
  className = '',
  type = 'button',
}: ButtonProps) {
  const cls = [
    'btn',
    variant === 'primary' ? 'btn-primary' : '',
    variant === 'outline' ? 'btn-outline' : '',
    variant === 'danger' ? 'btn-danger' : '',
    variant === 'danger-solid' ? 'btn-danger-solid' : '',
    size === 'sm' ? 'btn-sm' : '',
    size === 'lg' ? 'btn-lg' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button type={type} className={cls} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}
