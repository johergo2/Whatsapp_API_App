'use client';

import { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className = '', ...props }: InputProps) {
  return (
    <div className="form-group">
      {label && <label htmlFor={props.id}>{label}</label>}
      <input className={error ? 'input-error' : ''} {...props} />
      {error && <span className="field-error">{error}</span>}
    </div>
  );
}
