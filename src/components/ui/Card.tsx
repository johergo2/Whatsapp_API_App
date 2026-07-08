'use client';

import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  title?: string;
  className?: string;
}

export function Card({ children, title, className = '' }: CardProps) {
  return (
    <div className={`card ${className}`}>
      {title && <h3>{title}</h3>}
      {children}
    </div>
  );
}
