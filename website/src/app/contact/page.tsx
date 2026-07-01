'use client';

import { BezelCard } from '@/components/bezel-card';
import { AnimatedSection } from '@/components/animated-section';

export default function ContactPage() {
  return (
    <div className="pt-32 pb-24">
      <AnimatedSection className="px-6 mb-16">
        <div className="mx-auto max-w-6xl">
          <div className="text-center max-w-2xl mx-auto space-y-4 mb-16">
            <span className="inline-flex items-center rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.2em] font-medium bg-background-element text-text-secondary">
              Contact
            </span>
            <h1 className="text-5xl sm:text-6xl font-bold tracking-tight">Nous contacter</h1>
            <p className="text-text-secondary leading-relaxed">
              Une question, une demande d&apos;inscription ou simplement envie de nous rejoindre ?
              N&apos;h&eacute;sitez pas &agrave; nous &eacute;crire.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
            <div className="md:col-span-3">
              <BezelCard>
                <div className="p-8 space-y-6">
                  <h2 className="text-xl font-bold tracking-tight">Envoyez-nous un message</h2>
                  <form
                    onSubmit={(e) => e.preventDefault()}
                    className="space-y-5"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs uppercase tracking-[0.2em] font-medium text-text-secondary">
                          Prénom
                        </label>
                        <input
                          type="text"
                          placeholder="Votre prénom"
                          className="w-full bg-background-element border-none rounded-xl px-4 py-3 text-sm outline-none ring-1 ring-inset ring-border focus:ring-accent transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs uppercase tracking-[0.2em] font-medium text-text-secondary">
                          Nom
                        </label>
                        <input
                          type="text"
                          placeholder="Votre nom"
                          className="w-full bg-background-element border-none rounded-xl px-4 py-3 text-sm outline-none ring-1 ring-inset ring-border focus:ring-accent transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]"
                        />
                      </div>
                    </div>
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
                        Message
                      </label>
                      <textarea
                        rows={5}
                        placeholder="Votre message..."
                        className="w-full bg-background-element border-none rounded-xl px-4 py-3 text-sm outline-none ring-1 ring-inset ring-border focus:ring-accent transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] resize-none"
                      />
                    </div>
                    <button
                      type="submit"
                      className="group inline-flex items-center gap-2 rounded-full bg-text text-background px-6 py-3 text-sm font-medium tracking-wide transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] hover:opacity-90"
                    >
                      Envoyer
                      <span className="inline-flex w-8 h-8 rounded-full bg-white/10 items-center justify-center transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:scale-105">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="22" y1="2" x2="11" y2="13" />
                          <polygon points="22 2 15 22 11 13 2 9 22 2" />
                        </svg>
                      </span>
                    </button>
                  </form>
                </div>
              </BezelCard>
            </div>

            <div className="md:col-span-2 space-y-6">
              <BezelCard>
                <div className="p-6 space-y-4">
                  <h3 className="font-bold tracking-tight">Contact</h3>
                  <div className="space-y-3 text-sm text-text-secondary">
                    <p>
                      Vous avez une question, une suggestion ou vous avez rencontr&eacute; un bug&nbsp;?
                      &Eacute;crivez-nous, nous vous r&eacute;pondrons dans les plus brefs d&eacute;lais.
                    </p>
                    <p>
                      Bancalais Natation est une application ind&eacute;pendante cr&eacute;&eacute;e par des nageurs,
                      pour les nageurs.
                    </p>
                  </div>
                </div>
              </BezelCard>
            </div>
          </div>
        </div>
      </AnimatedSection>
    </div>
  );
}
