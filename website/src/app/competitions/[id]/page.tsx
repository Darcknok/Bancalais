'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { BezelCard } from '@/components/bezel-card';
import { AnimatedSection } from '@/components/animated-section';
import { nageCouleurs, nageLabels } from '@/lib/competitions';
import { fetchCompetitionDetail, type SourceCompetition, type CompetitionSource } from '@/lib/competition-service';

export default function CompetitionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const sourceParam = searchParams.get('source');
  const source: CompetitionSource = sourceParam === 'liveffn' ? 'liveffn' : 'local';

  const [competition, setCompetition] = useState<SourceCompetition | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchCompetitionDetail(Number(id), source).then((res: { competition?: SourceCompetition; error?: string }) => {
      if (res.competition) setCompetition(res.competition);
      if (res.error) setError(res.error);
      setLoading(false);
    });
  }, [id, source]);

  if (loading) {
    return (
      <div className="pt-32 px-6 text-center">
        <p className="text-text-secondary">Chargement...</p>
      </div>
    );
  }

  if (!competition) {
    return (
      <div className="pt-32 px-6 text-center">
        <h1 className="text-3xl font-bold">{error || 'Compétition non trouvée'}</h1>
        <Link href="/competitions" className="mt-4 inline-flex text-accent dark:text-accent-dark">
          Retour aux compétitions
        </Link>
      </div>
    );
  }

  const color = nageCouleurs[competition.typeNage] || '#2563EB';
  const schedule = competition.schedule;

  const items: { label: string; time: string; type?: 'epreuve' | 'event'; nage?: string; temps?: string }[] = [
    ...(schedule.ouverturePortes ? [{ label: 'Ouverture des portes', time: schedule.ouverturePortes, type: 'event' as const }] : []),
    ...(schedule.engagements ? [{ label: 'Engagements', time: schedule.engagements, type: 'event' as const }] : []),
    ...(schedule.debutEpreuves ? [{ label: 'Début des épreuves', time: schedule.debutEpreuves, type: 'event' as const }] : []),
    ...schedule.epreuves.map((e: { nage: string; heure: string; typeNage: string; tempsEngagement: string }) => ({
      label: e.nage,
      time: e.heure,
      type: 'epreuve' as const,
      nage: e.typeNage || 'crawl',
      temps: e.tempsEngagement || '',
      epreuve: e,
    })),
    ...(schedule.pause ? [{ label: `Pause (${schedule.pause})`, time: '', type: 'event' as const }] : []),
    ...(schedule.remiseRecompenses ? [{ label: 'Remise des récompenses', time: schedule.remiseRecompenses, type: 'event' as const }] : []),
  ];

  return (
    <div className="pt-32 pb-24">
      <AnimatedSection className="px-6 mb-12">
        <div className="mx-auto max-w-4xl">
          <Link
            href="/competitions"
            className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] mb-8"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            Retour aux compétitions
          </Link>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-xs uppercase tracking-[0.2em] text-text-secondary font-medium">
                {competition.date}
              </span>
              <span
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider text-white"
                style={{ backgroundColor: color }}
              >
                {nageLabels[competition.typeNage]}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <h1 className="text-5xl sm:text-6xl font-bold tracking-tight">
                {competition.lieu}
              </h1>
              {competition.source === 'liveffn' && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-accent/15 text-accent dark:text-accent-dark">
                  LiveFFN
                </span>
              )}
            </div>
            {(schedule.debutEpreuves || schedule.remiseRecompenses) && (
              <div className="flex items-center gap-4 text-sm text-text-secondary">
                <span className="flex items-center gap-1.5">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  {schedule.debutEpreuves || ''}{schedule.debutEpreuves && schedule.remiseRecompenses ? ' — ' : ''}{schedule.remiseRecompenses || ''}
                </span>
              </div>
            )}
          </div>
        </div>
      </AnimatedSection>

      <AnimatedSection className="px-6">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-2xl font-bold tracking-tight mb-8">Programme de la journée</h2>

          <div className="relative">
            <div className="absolute left-[19px] top-0 bottom-0 w-px bg-border" />

            <div className="space-y-6">
              {items.map((item, i) => {
                if (item.type === 'epreuve') {
                  const e = 'epreuve' in item ? (item as any).epreuve : schedule.epreuves[i];
                  if (!e) return null;
                  const eColor = nageCouleurs[e.typeNage as keyof typeof nageCouleurs] || '#2563EB';
                  const eLabel = nageLabels[e.typeNage as keyof typeof nageLabels] || e.typeNage;
                  const engagementTemps = e.tempsEngagement;
                  return (
                    <div key={i} className="relative pl-12">
                      <div
                        className="absolute left-3 top-1.5 w-4 h-4 rounded-full border-2 border-background"
                        style={{ backgroundColor: eColor }}
                      />
                      <BezelCard>
                        <div className="p-5">
                          <div className="flex items-start justify-between gap-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span
                                  className="w-2 h-2 rounded-full"
                                  style={{ backgroundColor: eColor }}
                                />
                                <p className="font-semibold tracking-tight">{e.nage}</p>
                              </div>
                              <div className="flex items-center gap-3 text-xs text-text-secondary">
                                <span className="uppercase tracking-wider font-medium">
                                  {eLabel}
                                </span>
                                {engagementTemps && (
                                  <span>Temps d&apos;engagement : {engagementTemps}</span>
                                )}
                              </div>
                            </div>
                            <span className="text-lg font-bold tabular-nums tracking-tight text-accent dark:text-accent-dark">
                              {e.heure}
                            </span>
                          </div>
                        </div>
                      </BezelCard>
                    </div>
                  );
                }

                const isPause = item.label.startsWith('Pause');
                return (
                  <div key={i} className="relative pl-12">
                    <div className={`absolute left-3 top-1.5 w-4 h-4 rounded-full border-2 border-background ${isPause ? 'bg-background-element' : 'bg-accent/20'}`} />
                    <div className="flex items-center justify-between py-3">
                      <span className={`text-sm font-medium ${isPause ? 'text-text-secondary italic' : ''}`}>
                        {item.label}
                      </span>
                      {item.time && (
                        <span className="text-sm font-medium tabular-nums text-text-secondary">
                          {item.time}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </AnimatedSection>
    </div>
  );
}
