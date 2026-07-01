'use client';

import { type ReactNode } from 'react';

interface BezelCardProps {
  children: ReactNode;
  className?: string;
  accent?: boolean;
  accentColor?: string;
  padding?: string;
}

export function BezelCard({
  children,
  className = '',
  accent = false,
  accentColor = 'var(--color-accent)',
  padding = 'p-1.5',
}: BezelCardProps) {
  return (
    <div
      className={`relative rounded-[2rem] bg-black/[0.03] dark:bg-white/[0.05] ${padding} ${className}`}
    >
      {accent && (
        <div
          className="absolute top-0 left-0 right-0 h-1 rounded-t-[2rem] z-10"
          style={{ backgroundColor: accentColor }}
        />
      )}
      <div className="rounded-[calc(2rem-0.375rem)] bg-background dark:bg-background-element shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]">
        {children}
      </div>
    </div>
  );
}
