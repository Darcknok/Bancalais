import { competitions as localCompetitions, type Competition as LocalCompetition } from '@/lib/competitions';
import {
  fetchLiveFFNCompetitions,
  fetchLiveFFNProgram,
  fetchLiveFFNCompetition as fetchLiveFFNDetail,
  type LiveFFNCompetitionSummary,
  type LiveFFNSession,
} from '@/lib/liveffn';

export type CompetitionSource = 'local' | 'liveffn';

export type SourceCompetition = LocalCompetition & {
  source: CompetitionSource;
  liveffnId?: number;
};

function liveFFNToLocalCompetition(lf: LiveFFNCompetitionSummary): SourceCompetition {
  return {
    id: lf.id,
    lieu: lf.lieu || lf.ville || lf.nom,
    date: lf.dateDebut && lf.dateFin
      ? `${lf.dateDebut} - ${lf.dateFin}`
      : lf.dateDebut || '',
    nage: '',
    typeNage: 'crawl',
    schedule: {
      ouverturePortes: '',
      debutEpreuves: '',
      engagements: '',
      epreuves: [],
      pause: '',
      remiseRecompenses: '',
    },
    source: 'liveffn',
    liveffnId: lf.id,
  };
}

export async function fetchAllCompetitions(
  filter?: 'all' | 'local' | 'liveffn'
): Promise<{ competitions: SourceCompetition[] }> {
  if (filter === 'local') {
    return { competitions: localCompetitions.map(c => ({ ...c, source: 'local' })) };
  }
  if (filter === 'liveffn') {
    const liveffnRes = await fetchLiveFFNCompetitions('courantes');
    const liveffn: SourceCompetition[] = (liveffnRes.data?.competitions ?? []).map(liveFFNToLocalCompetition);
    return { competitions: liveffn };
  }

  const [liveffnRes] = await Promise.all([
    fetchLiveFFNCompetitions('courantes'),
  ]);

  const local: SourceCompetition[] = localCompetitions.map(c => ({ ...c, source: 'local' }));
  const liveffn: SourceCompetition[] = (liveffnRes.data?.competitions ?? []).map(liveFFNToLocalCompetition);

  return { competitions: [...local, ...liveffn] };
}

export async function fetchCompetitionDetail(
  id: number,
  source: CompetitionSource,
): Promise<{ competition?: SourceCompetition; error?: string }> {
  if (source === 'local') {
    const comp = localCompetitions.find(c => c.id === id);
    if (!comp) return { error: 'Compétition non trouvée' };
    return { competition: { ...comp, source: 'local' } };
  }

  const [detailRes, programRes] = await Promise.all([
    fetchLiveFFNDetail(id),
    fetchLiveFFNProgram(id),
  ]);

  if (detailRes.error) return { error: detailRes.error };
  if (programRes.error) return { error: programRes.error };

  const detail = detailRes.data!.competition;
  const sessions = programRes.data!.sessions;

  const epreuves = sessions.flatMap(s =>
    s.epreuves.map(e => ({
      heure: e.heure || s.heureDebut || '',
      nage: e.nom,
      typeNage: 'crawl' as const,
      tempsEngagement: '',
    }))
  );

  const competition: SourceCompetition = {
    id,
    lieu: detail.location || detail.ville || detail.nom || detail.name || '',
    date: detail.dateRange || detail.dates || '',
    nage: epreuves[0]?.nage || '',
    typeNage: 'crawl',
    schedule: {
      ouverturePortes: sessions[0]?.ouverturePortes || '',
      debutEpreuves: epreuves[0]?.heure || '',
      engagements: '',
      epreuves,
      pause: '',
      remiseRecompenses: epreuves.slice(-1)[0]?.heure || '',
    },
    source: 'liveffn',
    liveffnId: id,
  };

  return { competition };
}
