'use client';

import { BezelCard } from '@/components/bezel-card';
import { AnimatedSection } from '@/components/animated-section';
import { Button } from '@/components/button';
import { Phone3D } from '@/components/phone-3d';

const features = [
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
    title: 'Comp&eacute;titions',
    description: 'Consultez le calendrier, inscrivez-vous aux &eacute;preuves et suivez vos performances en temps r&eacute;el.',
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
    description: 'Visualisez votre programme d\'entra&icirc;nement et le d&eacute;roul&eacute; des comp&eacute;titions avec une timeline claire.',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
    title: 'Chat',
    description: '&Eacute;changez avec votre coach et les autres nageurs via la messagerie int&eacute;gr&eacute;e.',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    ),
    title: 'Notifications',
    description: 'Restez inform&eacute; des annonces du coach, des rappels de comp&eacute;titions et des actualit&eacute;s.',
  },
];

export default function AppPage() {
  return (
    <div className="pt-32 pb-24">
      <AnimatedSection className="px-6 mb-24">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div className="space-y-6">
              <span className="inline-flex items-center rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.2em] font-medium bg-background-element text-text-secondary">
                Application mobile
              </span>
              <h1 className="text-5xl sm:text-6xl font-bold tracking-tight leading-[1.1]">
                Bancalais Natation
              </h1>
              <p className="text-lg text-text-secondary leading-relaxed">
                L&apos;application des nageurs, faite par des nageurs.
                Suivez les comp&eacute;titions, g&eacute;rez votre planning, et restez connect&eacute;
                avec votre coach.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button href="/connexion" arrow>
                  Acc&eacute;der &agrave; l&apos;app
                </Button>
              </div>
            </div>

            <div className="flex justify-center">
              <Phone3D screen="accueil" />
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
            <h2 className="text-4xl sm:text-5xl font-bold tracking-tight">
              Tout ce dont vous avez besoin
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {features.map((f) => (
              <BezelCard key={f.title} className="h-full">
                <div className="p-6 space-y-4">
                  <div className="w-10 h-10 rounded-full bg-accent/10 dark:bg-accent-dark/10 flex items-center justify-center text-accent dark:text-accent-dark">
                    {f.icon}
                  </div>
                  <h3 className="font-bold tracking-tight">{f.title}</h3>
                  <p className="text-sm text-text-secondary leading-relaxed">
                    {f.description}
                  </p>
                </div>
              </BezelCard>
            ))}
          </div>
        </div>
      </AnimatedSection>

      <AnimatedSection className="px-6 mb-24">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-center">
            <div className="flex justify-center lg:justify-start">
              <Phone3D screen="planning" />
            </div>
            <div className="lg:col-span-2 space-y-6">
              <span className="inline-flex items-center rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.2em] font-medium bg-background-element text-text-secondary">
                Planning
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight leading-[1.1]">
                Un planning clair pour chaque comp&eacute;tition
              </h2>
              <p className="text-text-secondary leading-relaxed">
                La timeline interactive vous montre le d&eacute;roul&eacute; complet de la journ&eacute;e&nbsp;:
                ouverture des portes, engagements, chaque &eacute;preuve avec son horaire,
                les pauses et la remise des r&eacute;compenses.
              </p>
            </div>
          </div>
        </div>
      </AnimatedSection>

      <AnimatedSection className="px-6 mb-24">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-center">
            <div className="lg:col-span-2 space-y-6 order-2 lg:order-1">
              <span className="inline-flex items-center rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.2em] font-medium bg-background-element text-text-secondary">
                Messagerie
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight leading-[1.1]">
                Discutez avec votre coach
              </h2>
              <p className="text-text-secondary leading-relaxed">
                Un syst&egrave;me de messagerie complet avec messages priv&eacute;s au coach,
                fils de discussion par groupe d&apos;entra&icirc;nement et messages &eacute;pingl&eacute;s
                pour les annonces importantes.
              </p>
            </div>
            <div className="flex justify-center lg:justify-end order-1 lg:order-2">
              <Phone3D screen="chat" />
            </div>
          </div>
        </div>
      </AnimatedSection>

      <AnimatedSection className="px-6">
        <div className="mx-auto max-w-6xl">
          <BezelCard accent>
            <div className="p-12 sm:p-16 text-center space-y-6">
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
                Pr&ecirc;t &agrave; plonger ?
              </h2>
              <p className="text-text-secondary max-w-md mx-auto">
                Connectez-vous &agrave; l&apos;application pour acc&eacute;der &agrave; toutes les fonctionnalit&eacute;s
                et suivre votre progression.
              </p>
              <Button href="/connexion" arrow>
                Se connecter
              </Button>
            </div>
          </BezelCard>
        </div>
      </AnimatedSection>
    </div>
  );
}
