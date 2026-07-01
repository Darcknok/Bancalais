'use client';

import { BezelCard } from '@/components/bezel-card';
import { AnimatedSection } from '@/components/animated-section';

const features = [
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
    title: 'Comp&eacute;titions',
    desc: 'Consultez le calendrier, inscrivez-vous aux &eacute;preuves et suivez vos performances en temps r&eacute;el.',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
    title: 'Planning',
    desc: 'Visualisez votre programme et le d&eacute;roul&eacute; des comp&eacute;titions avec une timeline claire.',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
    title: 'Messagerie',
    desc: 'Chattez avec votre coach et les autres nageurs, recevez les annonces importantes.',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    ),
    title: 'Notifications',
    desc: 'Restez inform&eacute; des annonces, des rappels de comp&eacute;titions et des actualit&eacute;s.',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
    title: 'Suivi personnel',
    desc: 'Suivez vos records, comparez vos temps et visualisez votre progression au fil des comp&eacute;titions.',
  },
];

export default function AProposPage() {
  return (
    <div className="pt-32 pb-24">
      <AnimatedSection className="px-6 mb-24">
        <div className="mx-auto max-w-6xl">
          <div className="text-center max-w-2xl mx-auto space-y-4 mb-16">
            <span className="inline-flex items-center rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.2em] font-medium bg-background-element text-text-secondary">
              &Agrave; propos
            </span>
            <h1 className="text-5xl sm:text-6xl font-bold tracking-tight">Bancalais Natation</h1>
            <p className="text-text-secondary leading-relaxed">
              Bancalais Natation est une application mobile cr&eacute;&eacute;e par des nageurs,
              pour les nageurs. Notre mission&nbsp;: vous offrir les meilleurs outils pour
              suivre vos comp&eacute;titions, organiser votre planning et rester connect&eacute;
              avec votre coach.
            </p>
          </div>

          <div className="relative rounded-[2rem] overflow-hidden min-h-[300px] bg-background-element flex items-center justify-center">
            <div className="text-center p-12">
              <span className="text-6xl mb-4 block">🏊</span>
              <p className="text-lg font-medium">Une app faite par des passionn&eacute;s</p>
              <p className="text-sm text-text-secondary mt-2">Ind&eacute;pendante, moderne, intuitive</p>
            </div>
          </div>
        </div>
      </AnimatedSection>

      <AnimatedSection className="px-6 mb-24">
        <div className="mx-auto max-w-6xl">
          <div className="text-center space-y-4 mb-16">
            <span className="inline-flex items-center rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.2em] font-medium bg-background-element text-text-secondary">
              Fonctionnalit&eacute;s
            </span>
            <h2 className="text-4xl sm:text-5xl font-bold tracking-tight">Tout ce dont vous avez besoin</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f) => (
              <BezelCard key={f.title} className="h-full">
                <div className="p-6 space-y-3">
                  <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                    {f.icon}
                  </div>
                  <h3 className="font-bold text-sm tracking-tight">{f.title}</h3>
                  <p className="text-xs text-text-secondary leading-relaxed">{f.desc}</p>
                </div>
              </BezelCard>
            ))}
          </div>
        </div>
      </AnimatedSection>

      <AnimatedSection className="px-6">
        <div className="mx-auto max-w-6xl">
          <BezelCard accent>
            <div className="p-12 sm:p-16 text-center space-y-6">
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
                Pr&ecirc;t &agrave; plonger&nbsp;?
              </h2>
              <p className="text-text-secondary max-w-md mx-auto">
                T&eacute;l&eacute;chargez l&apos;application Bancalais Natation et rejoignez
                la communaut&eacute; des nageurs connect&eacute;s.
              </p>
            </div>
          </BezelCard>
        </div>
      </AnimatedSection>
    </div>
  );
}
