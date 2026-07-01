'use client';

import { useState, useEffect } from 'react';
import { BezelCard } from '@/components/bezel-card';
import { AnimatedSection } from '@/components/animated-section';
import { CompetitionCard } from '@/components/competition-card';
import { fetchAllCompetitions, type SourceCompetition } from '@/lib/competition-service';

type FilterMode = 'all' | 'local';

export default function CompetitionsPage() {
  const [search, setSearch] = useState('');
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [competitions, setCompetitions] = useState<SourceCompetition[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchAllCompetitions().then((res: { competitions: SourceCompetition[] }) => {
      setCompetitions(res.competitions);
      setLoading(false);
    });
  }, []);

  const filtered = competitions.filter(
    (c) => {
      if (filterMode === 'local' && c.source !== 'local') return false;
      if (!search) return true;
      return (
        c.lieu.toLowerCase().includes(search.toLowerCase()) ||
        c.nage.toLowerCase().includes(search.toLowerCase())
      );
    }
  );

  return (
    <div className="pt-32 pb-24">
      <AnimatedSection className="px-6 mb-16">
        <div className="mx-auto max-w-6xl">
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <span className="inline-flex items-center rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.2em] font-medium bg-background-element text-text-secondary">
              Calendrier
            </span>
            <h1 className="text-5xl sm:text-6xl font-bold tracking-tight">Compétitions</h1>
            <p className="text-text-secondary leading-relaxed">
              Retrouvez toutes les compétitions &agrave; venir et suivez les performances des nageurs.
            </p>
          </div>
        </div>
      </AnimatedSection>

      <AnimatedSection className="px-6 mb-8">
        <div className="mx-auto max-w-6xl">
          <BezelCard>
            <div className="p-2">
              <div className="flex items-center gap-3 px-4">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-text-secondary shrink-0">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  type="text"
                  placeholder="Rechercher une compétition par lieu ou épreuve..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="flex-1 bg-transparent border-none outline-none py-3 text-sm placeholder:text-text-secondary"
                />
              </div>
            </div>
          </BezelCard>
        </div>
      </AnimatedSection>

      <AnimatedSection className="px-6 mb-10">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setFilterMode('local')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                filterMode === 'local'
                  ? 'bg-accent dark:bg-accent-dark text-white'
                  : 'bg-background-element text-text-secondary hover:text-text'
              }`}
            >
              Mes compétitions
            </button>
            <button
              onClick={() => setFilterMode('all')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                filterMode === 'all'
                  ? 'bg-accent dark:bg-accent-dark text-white'
                  : 'bg-background-element text-text-secondary hover:text-text'
              }`}
            >
              Global
            </button>
          </div>
        </div>
      </AnimatedSection>

      <AnimatedSection className="px-6">
        <div className="mx-auto max-w-6xl">
          {filtered.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filtered.map((c) => (
                <div key={c.id} className="relative">
                  {c.source === 'liveffn' && (
                    <span className="absolute top-3 right-3 z-10 inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-accent/15 text-accent dark:text-accent-dark">
                      LiveFFN
                    </span>
                  )}
                  <CompetitionCard competition={c} source={c.source} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-text-secondary">Aucune compétition trouvée.</p>
            </div>
          )}
        </div>
      </AnimatedSection>
    </div>
  );
}
