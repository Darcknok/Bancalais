/**
 * CHAT DÉSACTIVÉ POUR LE MOMENT.
 * Données mockées conservées pour réactivation future.
 */
export type ChatUser = {
  id: number;
  prenom: string;
  nom: string;
  role: 'swimmer' | 'coach';
  clubId: number;
};

export type ChatGroup = {
  id: number;
  name: string;
  clubId: number;
  coachId: number;
  memberIds: number[];
};

export type ChatMessage = {
  id: number;
  senderId: number;
  content: string;
  clubId: number;
  groupId?: number;
  pinned: boolean;
  mentions: number[];
  createdAt: string;
};

export type Club = {
  id: number;
  name: string;
  city: string;
  referralCode: string;
};

export const clubs: Club[] = [
  { id: 1, name: 'CN Bancalais', city: 'Chalon-sur-Saône', referralCode: 'CNB-2026' },
  { id: 2, name: 'CN Mâcon', city: 'Mâcon', referralCode: 'CNM-2026' },
  { id: 3, name: 'Dauphins Dijonnais', city: 'Dijon', referralCode: 'DAUPH-2026' },
  { id: 4, name: 'Stade Laurentin Natation', city: 'Saint-Laurent-du-Var', referralCode: 'SLN-2026' },
];

export const chatUsers: ChatUser[] = [
  { id: 1, prenom: 'Mathias', nom: 'Durand', role: 'swimmer', clubId: 1 },
  { id: 2, prenom: 'Pierre', nom: 'Lefèvre', role: 'coach', clubId: 1 },
  { id: 3, prenom: 'Sophie', nom: 'Moreau', role: 'coach', clubId: 1 },
  { id: 4, prenom: 'Lucas', nom: 'Petit', role: 'swimmer', clubId: 1 },
  { id: 5, prenom: 'Emma', nom: 'Bernard', role: 'swimmer', clubId: 1 },
  { id: 6, prenom: 'Hugo', nom: 'Roux', role: 'swimmer', clubId: 2 },
  { id: 7, prenom: 'Marc', nom: 'Dubois', role: 'coach', clubId: 2 },
  { id: 8, prenom: 'Chloé', nom: 'Lambert', role: 'swimmer', clubId: 2 },
  { id: 9, prenom: 'Léa', nom: 'Michel', role: 'swimmer', clubId: 3 },
  { id: 10, prenom: 'Thomas', nom: 'Garcia', role: 'coach', clubId: 3 },
  { id: 11, prenom: 'Jules', nom: 'Mossers', role: 'coach', clubId: 4 },
  { id: 12, prenom: 'Camille', nom: 'Renaud', role: 'swimmer', clubId: 4 },
  { id: 13, prenom: 'Antoine', nom: 'Leroy', role: 'swimmer', clubId: 4 },
];

export const chatGroups: ChatGroup[] = [
  { id: 1, name: 'Compétition', clubId: 1, coachId: 2, memberIds: [1, 4, 5] },
  { id: 2, name: 'Perfectionnement', clubId: 1, coachId: 3, memberIds: [1, 5] },
  { id: 3, name: 'Départemental', clubId: 2, coachId: 7, memberIds: [6, 8] },
  { id: 4, name: 'Groupe Régional', clubId: 3, coachId: 10, memberIds: [9] },
  { id: 5, name: 'Groupe Compétition', clubId: 4, coachId: 11, memberIds: [12, 13] },
];

export const chatMessages: ChatMessage[] = [
  {
    id: 1, senderId: 2, content: 'Bienvenue à tous pour la nouvelle saison ! Les entraînements reprennent lundi à 17h.',
    clubId: 1, pinned: true, mentions: [], createdAt: '2026-03-01T08:00:00',
  },
  {
    id: 2, senderId: 2, content: '@Mathias pense à apporter ta licence pour mercredi.',
    clubId: 1, pinned: false, mentions: [1], createdAt: '2026-03-02T10:30:00',
  },
  {
    id: 3, senderId: 1, content: 'Message reçu coach ! Je l\'apporte mercredi.',
    clubId: 1, pinned: false, mentions: [], createdAt: '2026-03-02T11:00:00',
  },
  {
    id: 4, senderId: 3, content: 'Nouveaux lots de maillots arrivés. Passez les voir au secrétariat.',
    clubId: 1, pinned: false, mentions: [], createdAt: '2026-03-03T14:00:00',
  },
  {
    id: 5, senderId: 4, content: 'Quelqu\'un a vu les résultats du meeting de Chalon ?',
    clubId: 1, pinned: false, mentions: [], createdAt: '2026-03-04T09:15:00',
  },
  {
    id: 6, senderId: 2, content: 'Rappel : déplacement à Dijon samedi 8h devant le club.',
    clubId: 1, pinned: true, mentions: [], createdAt: '2026-03-05T07:00:00',
  },
  {
    id: 7, senderId: 5, content: 'Super compétition hier ! Merci à tous.',
    clubId: 1, pinned: false, mentions: [], createdAt: '2026-03-10T18:30:00',
  },
  {
    id: 8, senderId: 2, content: '📋 Planning mis à jour pour ce trimestre : séances supplémentaires le samedi matin.',
    clubId: 1, groupId: 1, pinned: true, mentions: [], createdAt: '2026-03-06T09:00:00',
  },
  {
    id: 9, senderId: 3, content: 'Séance technique ce jeudi : travaillons les coulées et les virages.',
    clubId: 1, groupId: 2, pinned: false, mentions: [], createdAt: '2026-03-07T11:00:00',
  },
  {
    id: 10, senderId: 1, content: 'Merci pour les conseils coach, le virage était bien meilleur aujourd\'hui.',
    clubId: 1, groupId: 2, pinned: false, mentions: [3], createdAt: '2026-03-08T19:00:00',
  },
  {
    id: 11, senderId: 7, content: 'Entraînement annulé ce mercredi cause travaux à la piscine.',
    clubId: 2, pinned: true, mentions: [], createdAt: '2026-03-04T06:00:00',
  },
  {
    id: 12, senderId: 6, content: 'Dommage pour l\'entraînement... On se rattrape samedi ?',
    clubId: 2, pinned: false, mentions: [], createdAt: '2026-03-04T08:00:00',
  },
  {
    id: 13, senderId: 10, content: 'Inscriptions pour le championnat régional ouvertes jusqu\'au 15 avril.',
    clubId: 3, pinned: true, mentions: [], createdAt: '2026-03-20T09:00:00',
  },
  {
    id: 14, senderId: 9, content: 'Je suis partante pour le régional !',
    clubId: 3, pinned: false, mentions: [], createdAt: '2026-03-21T14:00:00',
  },
  {
    id: 15, senderId: 10, content: 'Nouveau record du club pour Léa sur 200m papillon 🎉 Félicitations !',
    clubId: 3, pinned: true, mentions: [9], createdAt: '2026-03-22T16:00:00',
  },
  {
    id: 16, senderId: 11, content: 'Bienvenue au Stade Laurentin Natation ! La saison commence fort, premiers entraînements demain à 16h.',
    clubId: 4, pinned: true, mentions: [], createdAt: '2026-04-01T08:00:00',
  },
  {
    id: 17, senderId: 11, content: '@Camille pense à confirmer ta présence pour le meeting de Nice.',
    clubId: 4, pinned: false, mentions: [12], createdAt: '2026-04-02T10:00:00',
  },
  {
    id: 18, senderId: 12, content: 'Coach, j\'ai un problème avec ma nouvelle combinaison, elle est trop serrée au niveau des épaules.',
    clubId: 4, pinned: false, mentions: [], createdAt: '2026-04-02T14:30:00',
  },
  {
    id: 19, senderId: 13, content: 'Super Séance hier ! Les exercices de culbute m\'ont bien aidé.',
    clubId: 4, pinned: false, mentions: [], createdAt: '2026-04-03T09:15:00',
  },
  {
    id: 20, senderId: 11, content: '📋 Rappel : séance supplémentaire ce samedi 10h pour préparer le départemental.',
    clubId: 4, groupId: 5, pinned: true, mentions: [], createdAt: '2026-04-04T07:00:00',
  },
];

export function getUser(id: number): ChatUser | undefined {
  return chatUsers.find(u => u.id === id);
}

export function getUsersByClub(clubId: number): ChatUser[] {
  return chatUsers.filter(u => u.clubId === clubId);
}

export function getClub(id: number): Club | undefined {
  return clubs.find(c => c.id === id);
}

export function getGroupsByClub(clubId: number): ChatGroup[] {
  return chatGroups.filter(g => g.clubId === clubId);
}

export function getMessagesByClub(clubId: number, groupId?: number): ChatMessage[] {
  if (groupId) return chatMessages.filter(m => m.clubId === clubId && m.groupId === groupId);
  return chatMessages.filter(m => m.clubId === clubId && !m.groupId);
}

export function getGroupParticipants(group: ChatGroup): ChatUser[] {
  return group.memberIds.map(id => getUser(id)).filter(Boolean) as ChatUser[];
}

export function getClubByReferralCode(code: string): Club | undefined {
  return clubs.find(c => c.referralCode === code);
}
