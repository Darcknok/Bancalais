'use client';

import { type ReactNode } from 'react';

interface ButtonProps {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  href?: string;
  onClick?: () => void;
  className?: string;
  arrow?: boolean;
}

export function Button({
  children,
  variant = 'primary',
  href,
  onClick,
  className = '',
  arrow = false,
}: ButtonProps) {
  const base =
    'group inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-medium tracking-wide transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98]';

  const variants = {
    primary:
      'bg-text text-background hover:opacity-90',
    secondary:
      'ring-1 ring-inset ring-border text-text hover:bg-background-element',
    ghost:
      'text-text-secondary hover:text-text',
  };

  const arrowEl = arrow ? (
    <span className="inline-flex w-8 h-8 rounded-full bg-black/10 dark:bg-white/10 items-center justify-center transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:scale-105">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="5" y1="12" x2="19" y2="12" />
        <polyline points="12 5 19 12 12 19" />
      </svg>
    </span>
  ) : null;

  const classes = `${base} ${variants[variant]} ${className}`;

  if (href) {
    return (
      <a href={href} className={classes}>
        {children}
        {arrowEl}
      </a>
    );
  }

  return (
    <button onClick={onClick} className={classes}>
      {children}
      {arrowEl}
    </button>
  );
}
