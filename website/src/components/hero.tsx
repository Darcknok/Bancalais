'use client';

import { Button } from './button';

export function Hero() {
  return (
    <section className="relative min-h-[100dvh] flex flex-col items-center justify-center px-6 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-accent/[0.03] dark:bg-accent-dark/[0.03] blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-accent/[0.02] dark:bg-accent-dark/[0.02] blur-3xl" />
      </div>

      <div className="relative z-10 text-center max-w-3xl mx-auto">
        <div className="animate-blur-in">
          <span className="inline-flex items-center rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.2em] font-medium bg-background-element text-text-secondary mb-8">
            L&apos;app des nageurs
          </span>
        </div>

        <h1 className="text-7xl sm:text-8xl md:text-[9rem] font-bold tracking-tight leading-[0.9] text-text">
          <span className="block animate-fade-up" style={{ animationDelay: '0.2s', animationFillMode: 'both' }}>
            Bancalais
          </span>
          <span className="block text-text-secondary mt-2 animate-fade-up" style={{ animationDelay: '0.4s', animationFillMode: 'both' }}>
            Natation
          </span>
        </h1>

        <p className="mt-8 text-lg text-text-secondary max-w-xl mx-auto animate-fade-up" style={{ animationDelay: '0.6s', animationFillMode: 'both' }}>
          L&apos;application des nageurs, faite par des nageurs.
          Suivez vos comp&eacute;titions, organisez votre planning, et restez connect&eacute;
          avec votre coach — le tout depuis votre t&eacute;l&eacute;phone.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-up" style={{ animationDelay: '0.8s', animationFillMode: 'both' }}>
          <Button href="/app" arrow>
            D&eacute;couvrir l&apos;app
          </Button>
          <Button href="/competitions" variant="secondary" arrow>
            Voir les comp&eacute;titions
          </Button>
        </div>
      </div>

      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-float">
        <svg width="20" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-text-secondary">
          <line x1="12" y1="5" x2="12" y2="19" />
          <polyline points="19 12 12 19 5 12" />
        </svg>
      </div>
    </section>
  );
}
