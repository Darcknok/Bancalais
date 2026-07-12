/**
 * HTML Parser for LiveFFN.com pages.
 * Uses cheerio to parse the legacy HTML structure and extract structured data.
 */

import * as cheerio from 'cheerio';
import type {
  LiveFFNCompetition,
  LiveFFNCompetitionDetail,
  LiveFFNPartner,
  LiveFFNParticipant,
  LiveFFNSession,
  LiveFFNEvent,
  LiveFFNRaceResult,
  LiveFFNSwimmer,
  LiveFFNClub,
  LiveFFNSplit,
  ProgramItem,
  Genre,
  Niveau,
  Bassin,
} from './types';

// ─── Helpers ─────────────────────────────────────────────────────

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&eacute;/g, 'é')
    .replace(/&egrave;/g, 'è')
    .replace(/&ecirc;/g, 'ê')
    .replace(/&agrave;/g, 'à')
    .replace(/&acirc;/g, 'â')
    .replace(/&ocirc;/g, 'ô')
    .replace(/&icirc;/g, 'î')
    .replace(/&ucirc;/g, 'û')
    .replace(/&euml;/g, 'ë')
    .replace(/&iuml;/g, 'ï')
    .replace(/&ccedil;/g, 'ç')
    .replace(/&Ccedil;/g, 'Ç')
    .replace(/&ntilde;/g, 'ñ')
    .replace(/&auml;/g, 'ä')
    .replace(/&ouml;/g, 'ö')
    .replace(/&uuml;/g, 'ü')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&rsquo;/g, "'")
    .replace(/&lsquo;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .trim();
}

function parseDateToISO(dateStr: string): string | null {
  // "Samedi 27/06/2026" or "Lundi 29/06/2026"
  const match = dateStr.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (match) {
    const [, day, month, year] = match;
    return `${year}-${month}-${day}`;
  }
  return null;
}

const FRENCH_MONTHS: Record<string, string> = {
  'janvier': '01', 'février': '02', 'fevrier': '02', 'mars': '03', 'avril': '04',
  'mai': '05', 'juin': '06', 'juillet': '07', 'août': '08', 'aout': '08',
  'septembre': '09', 'octobre': '10', 'novembre': '11', 'décembre': '12', 'decembre': '12',
};

/**
 * Convert a French long-form date like "Samedi 27 Juin 2026" to ISO "2026-06-27".
 * Strips the day-of-week, maps the French month name, pads the day.
 */
function parseFrenchDateToISO(dateStr: string): string | null {
  // First try the DD/MM/YYYY format already handled
  const iso = parseDateToISO(dateStr);
  if (iso) return iso;

  // "Samedi 27 Juin 2026" → day=27, month=Juin, year=2026
  // "Mercredi 1er Juillet 2026" → ordinal "1er" must be captured with day
  const match = dateStr.match(/(\d{1,2})(?:er|e|nd|rd|th)?\s+(\S+)\s+(\d{4})/);
  if (!match) return null;

  const day = match[1].padStart(2, '0');
  const monthName = match[2].toLowerCase();
  const year = match[3];
  const month = FRENCH_MONTHS[monthName];

  if (!month) {
    console.warn(`[parser] Unknown French month: "${match[2]}" in date "${dateStr}"`);
    return null;
  }

  return `${year}-${month}-${day}`;
}

function parseFullDateRange(text: string): { dateDebut: string | null; dateFin: string | null } {
  // "Du Samedi 27/06/2026 au Jeudi 02/07/2026"
  // "Lundi 29/06/2026"
  const rangeMatch = text.match(/Du.*?(\d{2}\/\d{2}\/\d{4}).*?au.*?(\d{2}\/\d{2}\/\d{4})/i);
  if (rangeMatch) {
    return {
      dateDebut: parseDateToISO(rangeMatch[1]),
      dateFin: parseDateToISO(rangeMatch[2]),
    };
  }
  const singleMatch = text.match(/(\d{2}\/\d{2}\/\d{4})/);
  if (singleMatch) {
    return {
      dateDebut: parseDateToISO(singleMatch[1]),
      dateFin: null,
    };
  }
  return { dateDebut: null, dateFin: null };
}

function extractCompetitionIdFromUrl(url: string | undefined): number | null {
  if (!url) return null;
  const match = url.match(/competition=(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

function extractIufFromUrl(url: string | undefined): number | null {
  if (!url) return null;
  const match = url.match(/iuf=(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

function extractStructureFromUrl(url: string | undefined): number | null {
  if (!url) return null;
  const match = url.match(/structure=(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

/**
 * Extrait le nom et le prénom d'un nom complet au format français LiveFFN.
 *
 * La convention LiveFFN est claire : le nom de famille est en MAJUSCULES
 * et le(s) prénom(s) sont en minuscules / capitale initiale.
 *
 * Exemples :
 *   "CALAIS OREFICE Mathias"    → lastName="CALAIS OREFICE", firstName="Mathias"
 *   "SIMON LEGRAND Sanzo"       → lastName="SIMON LEGRAND", firstName="Sanzo"
 *   "ROBERT Antoine"            → lastName="ROBERT", firstName="Antoine"
 *   "DUPONT Jean Marie"         → lastName="DUPONT", firstName="Jean Marie"
 *   "D'ARGENT Sophie"           → lastName="D'ARGENT", firstName="Sophie"
 */
function parseFrenchName(fullName: string): { lastName: string; firstName: string } {
  const trimmed = fullName.trim();
  if (!trimmed) return { lastName: '', firstName: '' };

  const words = trimmed.split(/\s+/);
  const lastNameWords: string[] = [];
  const firstNameWords: string[] = [];
  let foundNonUpper = false;

  for (const word of words) {
    // Un mot est considéré comme "tout majuscule" s'il contient au moins
    // une lettre et que toutes ses lettres sont en majuscules (supporte les
    // accents français, les apostrophes et les traits d'union).
    const isAllUpper = word === word.toUpperCase() && /[A-ZÀ-ÖØ-Þ]/i.test(word);

    if (isAllUpper && !foundNonUpper) {
      lastNameWords.push(word);
    } else {
      foundNonUpper = true;
      firstNameWords.push(word);
    }
  }

  return {
    lastName: lastNameWords.join(' '),
    firstName: firstNameWords.join(' '),
  };
}

// Garder parseSwimmerName comme alias pour compatibilité, mais utiliser
// la nouvelle implémentation intelligente.
const parseSwimmerName = parseFrenchName;

function parseTimeToMs(time: string): number | null {
  // "00:48.82" or "23.38" or "--:--.--" or "59:59.99"
  if (time.includes('--') || time === '59:59.99') return null;

  const withMinutes = time.match(/(\d+):(\d+)\.(\d+)/);
  if (withMinutes) {
    const mins = parseInt(withMinutes[1], 10);
    const secs = parseInt(withMinutes[2], 10);
    const cents = parseInt(withMinutes[3], 10);
    return mins * 60000 + secs * 1000 + cents * 10;
  }

  const withoutMinutes = time.match(/(\d+)\.(\d+)/);
  if (withoutMinutes) {
    const secs = parseInt(withoutMinutes[1], 10);
    const cents = parseInt(withoutMinutes[2], 10);
    return secs * 1000 + cents * 10;
  }

  return null;
}

function determineGenre(eventName: string): Genre {
  if (eventName.includes('Dames') || eventName.includes('Femmes')) return 'F';
  if (eventName.includes('Messieurs') || eventName.includes('Hommes')) return 'M';
  return 'M'; // default
}

function getNiveauFromSuffix(suffix: string): Niveau {
  switch (suffix.toUpperCase()) {
    case 'N': return 'National';
    case 'R': return 'Régional';
    case 'D': return 'Départemental';
    default: return 'Régional';
  }
}

function parseBassin(text: string): Bassin {
  if (text.includes('50')) return '50m';
  return '25m';
}

function parseStats(text: string): { engagements: number | null; nageurs: number | null } {
  const match = text.match(/(\d+)\s*engagements?\s*\/\s*(\d+)\s*nageurs?/);
  if (match) {
    return {
      engagements: parseInt(match[1], 10),
      nageurs: parseInt(match[2], 10),
    };
  }
  return { engagements: null, nageurs: null };
}

// ─── Main parsers ────────────────────────────────────────────────

/**
 * Parse the competition list page.
 * Supports both "courantes" and "recemment_termine" pages.
 */
export function parseCompetitionList(html: string): LiveFFNCompetition[] {
  const $ = cheerio.load(html);
  const competitions: LiveFFNCompetition[] = [];

  $('div[class^="containeur_niveau"]').each((_, element) => {
    const $el = $(element);
    const classAttr = $el.attr('class') || '';
    const suffix = classAttr.replace('containeur_niveau', '').trim();
    const niveau = getNiveauFromSuffix(suffix);

    // Lien principal
    const $link = $el.find('.information_box a').first();
    const href = $link.attr('href') || '';
    const id = extractCompetitionIdFromUrl(href);
    if (!id) return;

    // Nom
    const nomEl = $el.find(`.competition_nom${suffix}`);
    const nom = decodeHtmlEntities(nomEl.text().trim());

    // Lieu
    const lieuEl = $el.find(`.competition_lieu${suffix}`);
    const lieu = decodeHtmlEntities(lieuEl.text().trim());

    // Bassin
    const bassinEl = $el.find(`.bassin${suffix}`);
    const bassin = parseBassin(bassinEl.text().trim());

    // Image
    const $img = $el.find('.visuel_img img');
    const imageUrl = $img.attr('src') || '';
    const absoluteImageUrl = imageUrl.startsWith('http')
      ? imageUrl
      : `https://www.liveffn.com${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;

    // Dates
    const dateEl = $el.find(`.date${suffix}`);
    const dateText = decodeHtmlEntities(dateEl.text().trim());
    const { dateDebut, dateFin } = parseFullDateRange(dateText);

    // Stats
    const { engagements, nageurs } = parseStats(dateText);

    competitions.push({
      id,
      nom,
      lieu,
      bassin,
      niveau,
      dateDebut,
      dateFin,
      engagements,
      nageurs,
      imageUrl: absoluteImageUrl,
      lien: href.startsWith('http') ? href : `https://www.liveffn.com${href}`,
    });
  });

  return competitions;
}

/**
 * Parse the competition home page for details.
 */
export function parseCompetitionDetail(html: string, competitionId: number): LiveFFNCompetitionDetail {
  const $ = cheerio.load(html);

  const name = decodeHtmlEntities($('div.titre').text().trim());
  const location = decodeHtmlEntities($('div.lieu').text().trim());
  const dateRange = decodeHtmlEntities($('div.date').text().trim());

  // Extract pool length from name after " - "
  const poolLength = name.includes(' - ') ? name.split(' - ').pop()?.trim() || '' : '';

  // Parse dates
  const { dateDebut, dateFin } = parseFullDateRange(dateRange);

  // Poster
  const posterSrc = $('table.affiche img').first().attr('src') || '';
  const posterUrl = posterSrc.startsWith('http')
    ? posterSrc
    : `https://www.liveffn.com${posterSrc}`;

  // Partners
  const partners: LiveFFNPartner[] = [];
  $('#bande_partenaire .item_partenaire_normal img').each((_, img) => {
    const src = $(img).attr('src') || '';
    const absoluteSrc = src.startsWith('http') ? src : `https://www.liveffn.com${src}`;
    const idMatch = src.match(/partenaire_\d+_(\d+)\.png/);
    partners.push({
      id: idMatch ? parseInt(idMatch[1], 10) : 0,
      imageUrl: absoluteSrc,
    });
  });

  // Organizer link
  let organizerUrl: string | undefined;
  $('.sdt_box a').each((_, a) => {
    const text = $(a).text().trim().toLowerCase();
    if (text.includes('site organisateur') || text.includes('organisateur')) {
      organizerUrl = $(a).attr('href') || undefined;
    }
  });

  return {
    id: competitionId,
    name,
    location,
    poolLength,
    dateRange,
    startDate: dateDebut ?? '',
    endDate: dateFin ?? '',
    posterUrl,
    partners,
    organizerUrl,
  };
}

/**
 * Parse the participant list page.
 * HTML: <ul id="myList"><li class="survol">...</li></ul>
 */
export function parseParticipants(html: string): LiveFFNParticipant[] {
  const $ = cheerio.load(html);
  const participants: LiveFFNParticipant[] = [];

  $('#myList li.survol').each((_, li) => {
    const $li = $(li);
    const $nageurLink = $li.find('.nageur a');
    const fullName = decodeHtmlEntities($nageurLink.text().trim());
    const iuf = extractIufFromUrl($nageurLink.attr('href'));
    if (!iuf || !fullName) return;

    // French format: "NOM Prenom" — le nom de famille est en MAJUSCULES
    // (éventuellement composé : "CALAIS OREFICE Mathias")
    const parsed = parseFrenchName(fullName);
    const nom = parsed.lastName;
    const prenom = parsed.firstName;

    const birthYearText = $li.find('.naissance').text().trim();
    const birthYear = parseInt(birthYearText, 10) || 0;
    const nationality = $li.find('.nationalite').text().trim() || 'FRA';

    const $structureLink = $li.find('.structure a');
    const clubName = decodeHtmlEntities($structureLink.text().trim());
    const clubId = extractStructureFromUrl($structureLink.attr('href'));

    participants.push({
      iuf,
      nom,
      prenom,
      fullName,
      birthYear,
      nationality,
      clubId: clubId ?? 0,
      clubName: clubName || '',
    });
  });

  return participants;
}

/**
 * Parse the competition programme page.
 */
export function parseProgram(html: string): LiveFFNSession[] {
  const $ = cheerio.load(html);
  const sessions: LiveFFNSession[] = [];

  // The programme uses accordion: h6 for session title, div for content
  $('#accordion > h6').each((i, headerEl) => {
    const $header = $(headerEl);
    const headerText = decodeHtmlEntities($header.text().trim());

    // "Réunion N° 1 : Samedi 27 Juin 2026"
    const sessionNumMatch = headerText.match(/Réunion\s*N[°]\s*(\d+)/i);
    const numero = sessionNumMatch ? parseInt(sessionNumMatch[1], 10) : i + 1;

    // Extract date from header: "Réunion N° 1 : Samedi 27 Juin 2026"
    const dateMatch = headerText.replace('É', 'E').match(/:\s*(.+)/);
    const rawDate = dateMatch ? dateMatch[1].trim() : '';
    const date = parseFrenchDateToISO(rawDate) || rawDate;

    // Get the following div content
    const $content = $header.next('div');
    const $ul = $content.find('ul.reunion');

    let ouverturePortes = '';
    const epreuves: LiveFFNEvent[] = [];
    const eventsNonSportifs: string[] = [];
    const items: ProgramItem[] = [];

    $ul.find('li').each((_, li) => {
      const $li = $(li);
      const liClass = $li.attr('class') || '';
      const liText = decodeHtmlEntities($li.text().trim());

      // Door opening
      if (liClass === 'debutEpreuve') {
        const doorMatch = liText.match(/Ouverture des portes\s*:\s*(\S+)/i);
        if (doorMatch) ouverturePortes = doorMatch[1];
        // Use a clean label without "Les horaires sont donnés à titre indicatif"
        const cleanLabel = doorMatch ? `Ouverture des portes : ${doorMatch[1]}` : liText;
        items.push({ kind: 'debutEpreuve', label: cleanLabel, sessionNumero: numero });
        return;
      }

      // Non-sport events
      if (liClass === 'EventNonSportif') {
        eventsNonSportifs.push(liText);
        items.push({ kind: 'nonSportif', label: liText, sessionNumero: numero });
        return;
      }

      // Regular event
      if (liClass === 'survol') {
        // Try to parse from the onclick attribute (more reliable)
        const onClick = $li.find('.tooltip').attr('onclick') || $li.find('span[onclick]').attr('onclick') || '';
        let eprId = 0, typId = 0, catId = 0, numEpreuve = 0;

        // onclick uses JS string concat like '&epr_id='+'82'+' — strip quotes/+/spaces to get flat params
        const cleanOnClick = onClick.replace(/['+\s]/g, '');
        const eprMatch = cleanOnClick.match(/epr_id=(\d+)/);
        const typMatch = cleanOnClick.match(/typ_id=(\d+)/);
        const catMatch = cleanOnClick.match(/cat_id=(\d+)/);
        const numMatch = cleanOnClick.match(/num_epreuve=(\d+)/);
        if (eprMatch) eprId = parseInt(eprMatch[1], 10);
        if (typMatch) typId = parseInt(typMatch[1], 10);
        if (catMatch) catId = parseInt(catMatch[1], 10);
        if (numMatch) numEpreuve = parseInt(numMatch[1], 10);

        // Time
        const timeEl = $li.find('.time');
        const heure = timeEl.text().trim();

        // Event name - get from tooltip or direct text
        const tooltipText = $li.find('.tooltip').contents().filter((_, node) => node.nodeType === 3).text().trim();
        const eventName = decodeHtmlEntities(tooltipText || liText.replace(heure, '').replace('»', '').trim());

        // epr_id IS the event id on LiveFFN
        const eventId = eprId;

        // Type de tour from typId
        const typeTour = getTypeTourFromTypId(typId);

        // Participants info
        const tooltipB = $li.find('.tooltip b');
        const tooltipHtml = tooltipB.html() || '';
        const nbSeriesMatch = tooltipHtml.match(/(\d+)\s*s[eé]ries?/);
        const nbParticipantsMatch = tooltipHtml.match(/(\d+)\s*participant/);

        const event: LiveFFNEvent = {
          id: eventId,
          heure,
          nom: eventName,
          genre: determineGenre(eventName),
          typeTour,
          typId,
          eprId,
          catId,
          numEpreuve,
          nbSeries: nbSeriesMatch ? parseInt(nbSeriesMatch[1], 10) : undefined,
          nbParticipants: nbParticipantsMatch ? parseInt(nbParticipantsMatch[1], 10) : undefined,
        };
        epreuves.push(event);
        items.push({ kind: 'sport', label: eventName, epreuve: event, sessionNumero: numero });
      }
    });

    sessions.push({
      numero,
      date,
      ouverturePortes,
      epreuves,
      eventsNonSportifs,
      items,
    });
  });

  return sessions;
}

function getTypeTourFromTypId(typId: number): string {
  switch (typId) {
    case 11: return 'Finale A';
    case 12: return 'Finale B';
    case 13: return 'Finale C';
    case 14: return 'Finale D';
    case 60: return 'Séries';
    case 61: return 'Série finale';
    case 62: return 'Premières séries';
    default: return 'Séries';
  }
}

/**
 * Parse event results page.
 */
export function parseEventResults(html: string, eventId: number): {
  name: string;
  gender: Genre;
  rounds: { name: string; typId: number; results: LiveFFNRaceResult[] }[];
} {
  const $ = cheerio.load(html);

  // Find event name from the first epreuve row
  let eventName = '';
  let gender: Genre = 'M';

  const rounds: { name: string; typId: number; results: LiveFFNRaceResult[] }[] = [];
  let currentRound: { name: string; typId: number; results: LiveFFNRaceResult[] } | null = null;

  $('table.tableau tr').each((_, row) => {
    const $row = $(row);
    const $td = $row.find('td');

    // Event header row (colspan=11)
    if ($td.length === 1 && $td.attr('colspan') === '11') {
      // Push previous round
      if (currentRound && currentRound.results.length > 0) {
        rounds.push(currentRound);
      }

      const headerText = decodeHtmlEntities($td.text().trim());
      // "100 Nage Libre Messieurs - Finale A   (Dimanche 28 Juin 2026 - 18h52)"
      const nameMatch = headerText.split('  (')[0].trim();
      const roundMatch = headerText.match(/-\s*(.+?)\s*(?:\(|$)/);

      if (!eventName) {
        eventName = nameMatch.replace(/\s*-\s*(Finale\s+\w|S[eé]ries).*/, '').trim();
        gender = determineGenre(eventName);
      }

      const roundName = roundMatch ? roundMatch[1].trim() : 'Séries';
      currentRound = { name: roundName, typId: 0, results: [] };
      return;
    }

    // Separator row
    if ($td.length === 1 && $td.attr('colspan') === '10') return;

    // Empty row
    if ($td.length === 0 || ($td.length === 1 && !$td.text().trim())) return;

    // Result row
    if ($row.hasClass('survol') && currentRound) {
      const place = $row.find('td.place').text().trim().replace('.', '');
      const $nameLink = $row.find('td:nth-child(2) a');
      const swimmerName = decodeHtmlEntities($nameLink.text().trim());
      const iuf = extractIufFromUrl($nameLink.attr('href'));
      const birthYearText = $row.find('td:nth-child(3)').text().trim();
      const nationality = $row.find('td:nth-child(4)').text().trim();
      const $clubLink = $row.find('td:nth-child(5) a');
      const clubName = decodeHtmlEntities($clubLink.text().trim());
      const clubId = extractStructureFromUrl($clubLink.attr('href'));

      // Time parsing
      const $timeTd = $row.find('td.temps');
      const timeText = $timeTd.text().trim();
      const $timeLink = $timeTd.find('a');

      // Split data from tooltip
      const splits: LiveFFNSplit[] = [];
      const splitHtml = $timeLink.find('b[id="splitAutre"]').html() || $timeLink.find('b').html() || '';
      const $splitDoc = cheerio.load(`<table>${splitHtml}</table>`);
      $splitDoc('tr').each((_, splitRow) => {
        const $cells = $splitDoc(splitRow).find('td');
        if ($cells.length >= 3) {
          const distText = $cells.eq(0).text().trim().replace(':', '').replace('m', '').trim();
          const dist = parseInt(distText, 10);
          if (!isNaN(dist)) {
            splits.push({
              distance: dist,
              splitTime: $cells.eq(1).text().trim(),
              lapTime: $cells.eq(2).text().trim(),
              cumulativeTime: $cells.eq(3).text().trim() || undefined,
            });
          }
        }
      });

      // Reaction time
      const reactionText = $row.find('td.reaction').text().trim();

      // Points
      const pointsText = $row.find('td.points').text().trim();

      // Remark
      const remark = $row.find('td.rem').text().trim() || undefined;

      const swimmer: LiveFFNSwimmer | undefined = swimmerName ? {
        iuf: iuf ?? 0,
        ...parseSwimmerName(swimmerName),
        fullName: swimmerName,
        birthYear: parseInt(birthYearText, 10) || 0,
        nationality: nationality || 'FRA',
        clubId: clubId ?? 0,
        clubName: clubName || '',
      } : undefined;

      const result: LiveFFNRaceResult = {
        eventId,
        eventName: eventName || '',
        round: currentRound.name,
        place: place || '---',
        time: timeText || '--:--.--',
        reactionTime: reactionText || undefined,
        points: pointsText ? parseInt(pointsText, 10) || undefined : undefined,
        splits: splits.length > 0 ? splits : undefined,
        remark: remark || undefined,
        swimmer,
      };

      currentRound.results.push(result);
    }

    // Pole line
    if ($td.length >= 5 && $td.first().attr('colspan') === '4' && $td.last().hasClass('pole')) {
      // Pole info - not a result row
    }
  });

  // Push last round
  if (currentRound !== null && (currentRound as { results: LiveFFNRaceResult[] }).results.length > 0) {
    rounds.push(currentRound as { name: string; typId: number; results: LiveFFNRaceResult[] });
  }

  return {
    name: eventName,
    gender,
    rounds,
  };
}

/**
 * Parse start list for a specific event.
 */
export function parseStartList(html: string, eventId: number): {
  eventName: string;
  entries: { rank: number; swimmer: Partial<LiveFFNSwimmer>; entryTime: string; heat?: number; lane?: number }[];
} {
  const $ = cheerio.load(html);
  const entries: { rank: number; swimmer: Partial<LiveFFNSwimmer>; entryTime: string; heat?: number; lane?: number }[] = [];

  // Get event name from the first epreuve row
  let eventName = '';
  const $epreuveRow = $('td.epreuve').first();
  if ($epreuveRow.length) {
    eventName = decodeHtmlEntities($epreuveRow.text().trim());
  }

  $('table.tableau tr.survol').each((_, row) => {
    const $row = $(row);
    const place = parseInt($row.find('td.place').text().trim().replace('.', ''), 10);
    const $nameLink = $row.find('td:nth-child(2) a');
    const swimmerName = decodeHtmlEntities($nameLink.text().trim());
    const iuf = extractIufFromUrl($nameLink.attr('href'));
    const birthYearText = $row.find('td:nth-child(3)').text().trim();
    const nationality = $row.find('td:nth-child(4)').text().trim();
    const $clubLink = $row.find('td:nth-child(5) a');
    const clubName = decodeHtmlEntities($clubLink.text().trim());
    const clubId = extractStructureFromUrl($clubLink.attr('href'));
    const entryTime = $row.find('td.temps').text().trim();

    entries.push({
      rank: isNaN(place) ? entries.length + 1 : place,
      swimmer: {
        iuf: iuf ?? 0,
        ...parseSwimmerName(swimmerName),
        fullName: swimmerName,
        birthYear: parseInt(birthYearText, 10) || 0,
        nationality: nationality || 'FRA',
        clubId: clubId ?? 0,
        clubName: clubName || '',
      },
      entryTime,
    });
  });

  return { eventName, entries };
}

/**
 * Parse swimmer details page (results).
 */
export function parseSwimmerResults(html: string): {
  swimmer: Partial<LiveFFNSwimmer>;
  club: Partial<LiveFFNClub>;
  results: LiveFFNRaceResult[];
} {
  const $ = cheerio.load(html);
  const results: LiveFFNRaceResult[] = [];

  // Header info: "GABALI Cedric (2004) FRA - CN MARSEILLE"
  //              "CALAIS OREFICE Mathias (2011) FRA - CN MARSEILLE"
  const headerText = decodeHtmlEntities($('td.resStructureIndividu1, td.resStructureIndividu2').first().text().trim());
  const headerMatch = headerText.match(/(.+?)\s*\((\d{4})\)\s*(\w{3})\s*-\s*(.+)/);
  let club: Partial<LiveFFNClub> = {};

  if (headerMatch) {
    const fullNamePart = headerMatch[1].trim();
    const parsed = parseFrenchName(fullNamePart);
    swimmer = {
      lastName: parsed.lastName,
      firstName: parsed.firstName,
      fullName: fullNamePart,
      birthYear: parseInt(headerMatch[2], 10),
      nationality: headerMatch[3],
      clubName: headerMatch[4].trim(),
    };
    club = { name: headerMatch[4].trim() };
  }

  // Club info in h2
  const clubHeaderText = decodeHtmlEntities($('h2').first().text().trim());
  // Could contain structure code, region, department

  $('table.tableau tr.survol').each((_, row) => {
    const $row = $(row);

    // Place
    const placeText = $row.find('td.resStructureDetailPlace').text().trim() || '---';

    // Event link
    const $eventLink = $row.find('td:nth-child(2) a');
    const eventFullName = decodeHtmlEntities($eventLink.text().trim());
    const eventHref = $eventLink.attr('href') || '';
    const eventIdMatch = eventHref.match(/epreuve=(\d+)/);
    const eventId = eventIdMatch ? parseInt(eventIdMatch[1], 10) : 0;

    // Split event name and round
    // "100 Nage Libre Messieurs Finale A"
    // "100 Brasse Dames Finale D U15 & Moins"  (age-group suffix)
    const roundMatch = eventFullName.match(/\s+(Finale\s+\w|S[eé]ries|S[eé]rie\s+finale|Premi[eè]res\s+s[eé]ries)(?:\s+U\d+(?:\s*&.*)?)?$/i);
    const round = roundMatch ? roundMatch[1].trim() : 'Séries';
    const eventName = eventFullName.replace(roundMatch?.[0] || '', '').trim();

    // Time
    const $timeTd = $row.find('td.temps, td.temps_sans_tps_passage');
    let timeText = $timeTd.text().trim();
    let remark: string | undefined;

    // Parse splits from tooltip, and extract clean main time
    const splits: LiveFFNSplit[] = [];
    const $timeLink = $timeTd.find('a');
    const splitHtml = $timeLink.find('b[id="splitAutre"]').html() || '';

    if (splitHtml) {
      // The <a> tag contains the main time as direct text + the <b> with splits.
      // Clone the <a>, remove <b> children, then get the remaining (clean) text.
      const cleanTime = $timeLink.clone().children('b').remove().end().text().trim();
      if (cleanTime) timeText = cleanTime;

      // Parse split table HTML
      const $splitDoc = cheerio.load(`<table>${splitHtml}</table>`);
      $splitDoc('tr').each((_, splitRow) => {
        const $cells = $splitDoc(splitRow).find('td');
        if ($cells.length >= 3) {
          const distText = $cells.eq(0).text().trim().replace(':', '').replace('m', '').trim();
          const dist = parseInt(distText, 10);
          if (!isNaN(dist)) {
            splits.push({
              distance: dist,
              splitTime: $cells.eq(1).text().trim(),
              lapTime: $cells.eq(2).text().trim(),
              cumulativeTime: $cells.eq(3).text().trim() || undefined,
            });
          }
        }
      });
    } else if (timeText.includes('\t')) {
      // Fallback: parse tab-separated text
      const parts = timeText.split('\t');
      timeText = parts[0].trim();
      for (let i = 1; i < parts.length; i++) {
        const part = parts[i].trim();
        const bracketMatch = part.match(/^\[([\d.]+)\]$/);
        if (bracketMatch && splits.length > 0) {
          splits[splits.length - 1].cumulativeTime = bracketMatch[1];
          continue;
        }
        const splitMatch = part.match(/^(\d+)\s*m\s*:\s*([\d.]+)\s*\(([\d.]+)\)/i);
        if (splitMatch) {
          splits.push({
            distance: parseInt(splitMatch[1], 10),
            splitTime: splitMatch[2],
            lapTime: splitMatch[3],
          });
        }
      }
    }

    // Detect DQ/DNS/DSQ/Forfait/Abandon in the time cell
    const dqMatch = timeText.match(/^(DNS|DSQ|DQ|Forfait|Abandon)(?:\s+(.+))?$/i);
    if (dqMatch) {
      // Extract full reason from tooltip <b> element (e.g. "Forfait déclaré")
      const $tooltipB = $timeTd.find('a.tooltip b');
      const tooltipReason = $tooltipB.text().trim();
      remark = tooltipReason || dqMatch[2] || dqMatch[1];
      timeText = '--:--.--';
    }

    if (!timeText) timeText = '--:--.--';

    // Reaction
    const reactionText = $row.find('td.reaction').text().trim();

    // Points
    const pointsText = $row.find('td.points').text().trim();

    // Remark (from td.rem if not already set by DQ detection)
    if (!remark) {
      remark = $row.find('td.rem').text().trim() || undefined;
    }

    results.push({
      eventId,
      eventName,
      round,
      place: placeText,
      time: timeText,
      splits: splits.length > 0 ? splits : undefined,
      reactionTime: reactionText || undefined,
      points: pointsText ? parseInt(pointsText, 10) || undefined : undefined,
      remark,
    });
  });

  return { swimmer, club, results };
}

/**
 * Parse club details page.
 */
export function parseClubDetails(html: string): {
  club: Partial<LiveFFNClub>;
  swimmers: { swimmer: Partial<LiveFFNSwimmer>; results: LiveFFNRaceResult[] }[];
} {
  const $ = cheerio.load(html);
  // Extract club info from h2
  const h2Text = decodeHtmlEntities($('h2').first().text().trim());
  const codeMatch = h2Text.match(/Code de la structure\s*:\s*(\d+)/);
  const regionMatch = h2Text.match(/R[ée]gion\s*:\s*(.+?)\s*\((\d+)\)/);
  const deptMatch = h2Text.match(/D[ée]partement\s*:\s*(.+?)\s*\((\d+)\)/);

  const club: Partial<LiveFFNClub> = {
    name: h2Text.split('\n')[0].trim(),
    federationCode: codeMatch ? codeMatch[1] : undefined,
    region: regionMatch ? regionMatch[1].trim() : undefined,
    regionCode: regionMatch ? parseInt(regionMatch[2], 10) : undefined,
    department: deptMatch ? deptMatch[1].trim() : undefined,
    departmentCode: deptMatch ? parseInt(deptMatch[2], 10) : undefined,
  };

  // Swimmers with results are structured similarly to parseSwimmerResults
  // but grouped per competition
  const swimmers: { swimmer: Partial<LiveFFNSwimmer>; results: LiveFFNRaceResult[] }[] = [];

  // For now, collect individual swimmer blocks
  $('td.resStructureIndividu1, td.resStructureIndividu2').each((_, td) => {
    const headerText = decodeHtmlEntities($(td).text().trim());
    const headerMatch = headerText.match(/(.+?)\s*\((\d{4})\)\s*(\w{3})\s*-\s*(.+)/);
      const fullNamePart = headerMatch[1].trim();
      const parsed = parseFrenchName(fullNamePart);
      const swimmerData: Partial<LiveFFNSwimmer> = {
        lastName: parsed.lastName,
        firstName: parsed.firstName,
        fullName: fullNamePart,
        birthYear: parseInt(headerMatch[2], 10),
        nationality: headerMatch[3],
        clubName: headerMatch[4].trim(),
      };
      swimmers.push({ swimmer: swimmerData, results: [] });
    }
  });

  return { club, swimmers };
}
