'use client';

import { Hero } from '@/components/hero';
import { AnimatedSection } from '@/components/animated-section';
import { Button } from '@/components/button';
import { Phone3D } from '@/components/phone-3d';


const appFeatures = [
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
    title: 'Compétitions',
    desc: 'Calendrier, inscriptions et suivi des performances en direct.',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
    title: 'Planning',
    desc: 'Timeline des compétitions avec programmes et horaires.',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
    title: 'Messagerie',
    desc: 'Chattez avec votre coach et les autres nageurs.',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    ),
    title: 'Notifications',
    desc: 'Annonces du coach, rappels et actualités.',
  },
];

export default function Home() {
  return (
    <div>
      <Hero />



      <AnimatedSection className="px-6 py-32">
        <div className="mx-auto max-w-6xl">
          <div className="text-center space-y-4 mb-16">
            <span className="inline-flex items-center rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.2em] font-medium bg-background-element text-text-secondary">
              L&apos;application mobile
            </span>
            <h2 className="text-4xl sm:text-5xl font-bold tracking-tight max-w-3xl mx-auto leading-[1.1]">
              Toute l&apos;exp&eacute;rience Bancalais dans votre poche
            </h2>
            <p className="text-text-secondary max-w-xl mx-auto">
              Naviguez entre les &eacute;crans ci-dessous pour d&eacute;couvrir l&apos;application.
            </p>
          </div>

          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="flex-1">
              <Phone3D />
            </div>

            <div className="flex-1 space-y-6">
              {appFeatures.map((f) => (
                <div key={f.title} className="flex items-start gap-4 group">
                  <div className="w-10 h-10 rounded-full bg-accent/10 dark:bg-accent-dark/10 flex items-center justify-center text-accent dark:text-accent-dark shrink-0 transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-110">
                    {f.icon}
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold tracking-tight text-sm">{f.title}</h3>
                    <p className="text-sm text-text-secondary">{f.desc}</p>
                  </div>
                </div>
              ))}

              <Button href="/app" arrow className="mt-4">
                En savoir plus
              </Button>
            </div>
          </div>
        </div>
      </AnimatedSection>

      <AnimatedSection className="px-6 py-32 bg-background-element/50">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
            <div className="lg:col-span-2 space-y-6">
              <span className="inline-flex items-center rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.2em] font-medium bg-background-element text-text-secondary">
                Planning interactif
              </span>
              <h2 className="text-4xl sm:text-5xl font-bold tracking-tight leading-[1.1]">
                Suivez vos courses <span className="text-accent dark:text-accent-dark">en temps r&eacute;el</span>
              </h2>
              <p className="text-text-secondary leading-relaxed max-w-xl">
                Consultez le programme de chaque comp&eacute;tition avec une timeline claire,
                comparez vos temps d&apos;engagement avec vos records personnels, et rep&eacute;rez
                instantan&eacute;ment vos nouvelles performances.
              </p>
              <Button href="/competitions" arrow>
                Voir les comp&eacute;titions
              </Button>
            </div>
            <div className="flex justify-center lg:justify-end">
              <Phone3D screen="planning" />
            </div>
          </div>
        </div>
      </AnimatedSection>

      <AnimatedSection className="px-6 py-32">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
            <div className="flex justify-center lg:justify-start order-2 lg:order-1">
              <Phone3D screen="chat" />
            </div>
            <div className="lg:col-span-2 space-y-6 order-1 lg:order-2">
              <span className="inline-flex items-center rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.2em] font-medium bg-background-element text-text-secondary">
                Messagerie int&eacute;gr&eacute;e
              </span>
              <h2 className="text-4xl sm:text-5xl font-bold tracking-tight leading-[1.1]">
                Restez connect&eacute; avec <span className="text-accent dark:text-accent-dark">votre coach</span>
              </h2>
              <p className="text-text-secondary leading-relaxed max-w-xl">
                &Eacute;changez directement avec votre entra&icirc;neur, recevez les annonces
                importantes et discutez avec les membres de votre groupe d&apos;entra&icirc;nement
                — le tout depuis l&apos;application.
              </p>
              <ul className="space-y-3">
                {[
                  'Messages priv&eacute;s avec le coach',
                  'Fils de discussion par groupe',
                  'Messages &eacute;pingl&eacute;s',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm text-text-secondary">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent shrink-0">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </AnimatedSection>

      <AnimatedSection className="px-6 py-32 bg-background-element/50">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
            <div className="lg:col-span-2 space-y-6">
              <span className="inline-flex items-center rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.2em] font-medium bg-background-element text-text-secondary">
                Comp&eacute;titions
              </span>
              <h2 className="text-4xl sm:text-5xl font-bold tracking-tight leading-[1.1]">
                Inscrivez-vous et <span className="text-accent dark:text-accent-dark">battez vos records</span>
              </h2>
              <p className="text-text-secondary leading-relaxed max-w-xl">
                Visualisez vos temps d&apos;engagement, comparez-les avec vos records personnels
                et suivez votre progression au fil des comp&eacute;titions.
              </p>
              <Button href="/competitions" arrow>
                Calendrier des comp&eacute;titions
              </Button>
            </div>
            <div className="flex justify-center lg:justify-end">
              <Phone3D screen="planning" />
            </div>
          </div>
        </div>
      </AnimatedSection>

      <AnimatedSection className="px-6 py-32">
        <div className="mx-auto max-w-6xl">
          <div className="relative overflow-hidden rounded-[2rem] bg-text text-background">
            <div className="p-12 sm:p-20 text-center space-y-8 relative z-10">
              <span className="inline-flex items-center rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.2em] font-medium bg-white/10 text-background/80">
                Pr&ecirc;t &agrave; plonger ?
              </span>
              <h2 className="text-4xl sm:text-5xl font-bold tracking-tight max-w-2xl mx-auto">
                Rejoignez les nageurs Bancalais
              </h2>
              <p className="text-background/70 max-w-lg mx-auto">
                Que vous soyez nageur d&eacute;butant ou confirm&eacute;, t&eacute;l&eacute;chargez l&apos;application et
                suivez vos performances, votre planning et votre progression.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button href="/contact" variant="secondary" className="!border-background/20 !text-background hover:!bg-white/10" arrow>
                  Nous contacter
                </Button>
                <a
                  href="/app"
                  className="group inline-flex items-center gap-2 rounded-full bg-background text-text px-6 py-3 text-sm font-medium tracking-wide transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] hover:opacity-90"
                >
                  D&eacute;couvrir l&apos;app
                  <span className="inline-flex w-8 h-8 rounded-full bg-text/10 items-center justify-center transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </AnimatedSection>
    </div>
  );
}
