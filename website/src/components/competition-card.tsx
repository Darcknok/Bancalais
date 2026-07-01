'use client';

import Link from 'next/link';
import { BezelCard } from './bezel-card';
import { nageCouleurs, nageLabels, type Competition } from '@/lib/competitions';

interface CompetitionCardProps {
  competition: Competition;
  source?: 'local' | 'liveffn';
}

export function CompetitionCard({ competition, source = 'local' }: CompetitionCardProps) {
  const color = nageCouleurs[competition.typeNage];

  return (
    <Link href={`/competitions/${competition.id}${source === 'liveffn' ? '?source=liveffn' : ''}`}>
      <BezelCard
        accent
        accentColor={color}
        className="h-full group cursor-pointer transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-1"
      >
        <div className="p-6 space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-[0.2em] text-text-secondary font-medium">
                {competition.date}
              </p>
              <h3 className="text-lg font-bold tracking-tight">
                {competition.lieu}
              </h3>
            </div>
            <span
              className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider text-white"
              style={{ backgroundColor: color }}
            >
              {nageLabels[competition.typeNage]}
            </span>
          </div>

          <p className="text-sm text-text-secondary">
            {competition.nage}
          </p>

          <div className="flex items-center gap-3 text-xs text-text-secondary">
            <span className="flex items-center gap-1">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              {competition.schedule.debutEpreuves}
            </span>
            <span className="flex items-center gap-1">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
              {competition.lieu}
            </span>
          </div>

          <div className="pt-2 flex items-center gap-1 text-sm font-medium text-accent dark:text-accent-dark">
            <span>Voir le détail</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-1">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </div>
        </div>
      </BezelCard>
    </Link>
  );
}
