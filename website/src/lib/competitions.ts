export type TypeNage = 'crawl' | 'dos' | 'brass' | 'pap';

export interface Epreuve {
  heure: string;
  nage: string;
  typeNage: TypeNage;
  tempsEngagement: string;
  nouveauTemps?: string;
}

export interface Competition {
  id: number;
  lieu: string;
  date: string;
  nage: string;
  typeNage: TypeNage;
  schedule: {
    ouverturePortes: string;
    debutEpreuves: string;
    engagements: string;
    epreuves: Epreuve[];
    pause: string;
    remiseRecompenses: string;
  };
}

export const nageCouleurs: Record<TypeNage, string> = {
  crawl: '#2563EB',
  dos: '#059669',
  brass: '#D97706',
  pap: '#DB2777',
};

export const nageCouleursCSS: Record<TypeNage, string> = {
  crawl: 'bg-crawl',
  dos: 'bg-dos',
  brass: 'bg-brass',
  pap: 'bg-pap',
};

export const nageLabels: Record<TypeNage, string> = {
  crawl: 'Crawl',
  dos: 'Dos',
  brass: 'Brasse',
  pap: 'Papillon',
};

export const competitions: Competition[] = [
  {
    id: 1,
    lieu: 'Chalon-sur-Saône',
    date: '15 mars 2026',
    nage: '100 m nage libre',
    typeNage: 'crawl',
    schedule: {
      ouverturePortes: '08:00',
      debutEpreuves: '08:45',
      engagements: '08:30',
      epreuves: [
        { heure: '09:00', nage: '100 m nage libre', typeNage: 'crawl', tempsEngagement: '55.20' },
        { heure: '09:45', nage: '50 m dos', typeNage: 'dos', tempsEngagement: '32.50' },
        { heure: '10:30', nage: '200 m brasse', typeNage: 'brass', tempsEngagement: '2:45.30' },
      ],
      pause: '15 min',
      remiseRecompenses: '12:00',
    },
  },
  {
    id: 2,
    lieu: 'Mâcon',
    date: '22 mars 2026',
    nage: '50 m dos',
    typeNage: 'dos',
    schedule: {
      ouverturePortes: '07:30',
      debutEpreuves: '08:15',
      engagements: '08:00',
      epreuves: [
        { heure: '08:30', nage: '50 m dos', typeNage: 'dos', tempsEngagement: '31.80' },
        { heure: '09:15', nage: '100 m crawl', typeNage: 'crawl', tempsEngagement: '58.40' },
        { heure: '10:00', nage: '50 m brasse', typeNage: 'brass', tempsEngagement: '36.20' },
        { heure: '10:45', nage: '100 m 4 nages', typeNage: 'pap', tempsEngagement: '1:12.50' },
      ],
      pause: '20 min',
      remiseRecompenses: '12:30',
    },
  },
  {
    id: 3,
    lieu: 'Dijon',
    date: '5 avril 2026',
    nage: '200 m 4 nages',
    typeNage: 'pap',
    schedule: {
      ouverturePortes: '08:00',
      debutEpreuves: '08:30',
      engagements: '08:15',
      epreuves: [
        { heure: '08:45', nage: '200 m 4 nages', typeNage: 'pap', tempsEngagement: '2:30.00' },
        { heure: '09:30', nage: '100 m dos', typeNage: 'dos', tempsEngagement: '1:10.20' },
        { heure: '10:15', nage: '50 m papillon', typeNage: 'pap', tempsEngagement: '29.80' },
      ],
      pause: '10 min',
      remiseRecompenses: '11:45',
    },
  },
  {
    id: 4,
    lieu: 'Le Creusot',
    date: '19 avril 2026',
    nage: '100 m brasse',
    typeNage: 'brass',
    schedule: {
      ouverturePortes: '08:30',
      debutEpreuves: '09:00',
      engagements: '08:45',
      epreuves: [
        { heure: '09:15', nage: '100 m brasse', typeNage: 'brass', tempsEngagement: '1:12.40' },
        { heure: '10:00', nage: '200 m crawl', typeNage: 'crawl', tempsEngagement: '2:15.00' },
        { heure: '11:00', nage: '50 m dos', typeNage: 'dos', tempsEngagement: '33.50' },
      ],
      pause: '25 min',
      remiseRecompenses: '13:00',
    },
  },
];
