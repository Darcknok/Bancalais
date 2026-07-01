'use client';

import Link from 'next/link';
import { BezelCard } from '@/components/bezel-card';
import { AnimatedSection } from '@/components/animated-section';

export default function ConnexionPage() {
  return (
    <div className="pt-32 pb-24 min-h-[100dvh] flex items-center justify-center">
      <AnimatedSection className="px-6 w-full">
        <div className="mx-auto max-w-md">
          <div className="text-center space-y-3 mb-10">
            <Link href="/" className="inline-flex items-center gap-2 font-bold text-lg tracking-tight">
              <span className="w-8 h-8 rounded-full bg-text text-background flex items-center justify-center text-sm font-bold">
                B
              </span>
              Bancalais
            </Link>
            <h1 className="text-3xl font-bold tracking-tight">Connexion</h1>
            <p className="text-sm text-text-secondary">
              Acc&eacute;dez &agrave; l&apos;application Bancalais Natation
            </p>
          </div>

          <BezelCard>
            <div className="p-8 space-y-6">
              <form
                onSubmit={(e) => e.preventDefault()}
                className="space-y-5"
              >
                <div className="space-y-1.5">
                  <label className="text-xs uppercase tracking-[0.2em] font-medium text-text-secondary">
                    Email
                  </label>
                  <input
                    type="email"
                    placeholder="votre@email.fr"
                    className="w-full bg-background-element border-none rounded-xl px-4 py-3 text-sm outline-none ring-1 ring-inset ring-border focus:ring-accent transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs uppercase tracking-[0.2em] font-medium text-text-secondary">
                    Mot de passe
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    className="w-full bg-background-element border-none rounded-xl px-4 py-3 text-sm outline-none ring-1 ring-inset ring-border focus:ring-accent transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]"
                  />
                </div>

                <button
                  type="submit"
                  className="group w-full inline-flex items-center justify-center gap-2 rounded-full bg-text text-background px-6 py-3 text-sm font-medium tracking-wide transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] hover:opacity-90"
                >
                  Se connecter
                  <span className="inline-flex w-8 h-8 rounded-full bg-white/10 items-center justify-center transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:scale-105">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </span>
                </button>
              </form>

              <div className="text-center text-sm text-text-secondary">
                <p>
                  Pas encore de compte ?{' '}
                  <span className="text-accent dark:text-accent-dark font-medium">
                    T&eacute;l&eacute;chargez l&apos;application
                  </span>
                </p>
              </div>

              <div className="pt-4 border-t border-border text-center">
                <Link
                  href="/"
                  className="text-xs text-text-secondary hover:text-text transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]"
                >
                  ← Retour au site
                </Link>
              </div>
            </div>
          </BezelCard>

          <p className="text-center text-xs text-text-secondary mt-8">
            Cette connexion redirige vers l&apos;application mobile Bancalais Natation.
          </p>
        </div>
      </AnimatedSection>
    </div>
  );
}
