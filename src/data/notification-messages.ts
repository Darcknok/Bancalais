export type NotificationType = 'reminder' | 'result' | 'pb' | 'coach' | 'invite' | 'system';

export type NotificationChannel = {
  channelName: string;
  channelDescription: string;
  androidChannelId: string;
};

export type RaceReminderTemplate = {
  title: string;
  body: (eventName: string) => string;
  channel: NotificationChannel;
  type: NotificationType;
};

export type RaceReminderCustomTemplate = {
  title: (minutes: number) => string;
  body: (eventName: string, minutes: number) => string;
  channel: NotificationChannel;
  type: NotificationType;
};

export type NewResultTemplate = {
  title: string;
  body: (eventName: string, time: string) => string;
  channel: NotificationChannel;
  type: NotificationType;
};

export type ResultWithPbTemplate = {
  title: string;
  body: (eventName: string, time: string, previousTime: string) => string;
  channel: NotificationChannel;
  type: NotificationType;
};

export type CoachAnnouncementTemplate = {
  title: string;
  body: (message: string, coachName: string) => string;
  channel: NotificationChannel;
  type: NotificationType;
};

export type ClubInvitationTemplate = {
  title: (clubName: string) => string;
  body: (clubName: string) => string;
  channel: NotificationChannel;
  type: NotificationType;
};

export type SystemNotificationTemplate = {
  title: (subject: string) => string;
  body: (message: string) => string;
  channel: NotificationChannel;
  type: NotificationType;
};

export type NotificationMessages = {
  raceReminder: RaceReminderTemplate;
  raceReminderCustom: RaceReminderCustomTemplate;
  newResult: NewResultTemplate;
  resultWithPb: ResultWithPbTemplate;
  coachAnnouncement: CoachAnnouncementTemplate;
  clubInvitation: ClubInvitationTemplate;
  systemNotification: SystemNotificationTemplate;
};

export const notificationMessages: NotificationMessages = {
  raceReminder: {
    title: 'Rappel course dans 10 min',
    body: (eventName: string) =>
      `Votre course ${eventName} commence dans 10 minutes ! Rendez-vous au bord du bassin.`,
    channel: {
      channelName: 'Rappels de course',
      channelDescription: 'Notifications de rappel avant le début d\'une course',
      androidChannelId: 'race-reminders',
    },
    type: 'reminder',
  },

  raceReminderCustom: {
    title: (minutes: number) =>
      `Rappel course dans ${minutes} min`,
    body: (eventName: string, minutes: number) =>
      `Votre course ${eventName} commence dans ${minutes} minutes ! Rendez-vous au bord du bassin.`,
    channel: {
      channelName: 'Rappels de course',
      channelDescription: 'Notifications de rappel avant le début d\'une course',
      androidChannelId: 'race-reminders',
    },
    type: 'reminder',
  },

  newResult: {
    title: 'Nouveau résultat disponible',
    body: (eventName: string, time: string) =>
      `${eventName} : ${time}. Consultez votre résultat dans l\'application.`,
    channel: {
      channelName: 'Résultats',
      channelDescription: 'Notifications de nouveaux résultats de course',
      androidChannelId: 'race-results',
    },
    type: 'result',
  },

  resultWithPb: {
    title: 'Nouveau record personnel !',
    body: (eventName: string, time: string, previousTime: string) =>
      `Félicitations ! Vous battez votre record sur ${eventName} avec ${time} (ancien record : ${previousTime}).`,
    channel: {
      channelName: 'Résultats',
      channelDescription: 'Notifications de nouveaux résultats de course',
      androidChannelId: 'race-results',
    },
    type: 'pb',
  },

  coachAnnouncement: {
    title: 'Message du coach',
    body: (message: string, coachName: string) =>
      `${coachName} : ${message}`,
    channel: {
      channelName: 'Annonces du club',
      channelDescription: 'Annonces et communications des entraîneurs',
      androidChannelId: 'coach-announcements',
    },
    type: 'coach',
  },

  clubInvitation: {
    title: (clubName: string) =>
      `Invitation à rejoindre ${clubName}`,
    body: (clubName: string) =>
      `Vous avez été invité(e) à rejoindre le club ${clubName} sur Bancalais Natation. Répondez à l'invitation depuis l'application.`,
    channel: {
      channelName: 'Invitations',
      channelDescription: 'Notifications d\'invitation à rejoindre un club',
      androidChannelId: 'club-invites',
    },
    type: 'invite',
  },

  systemNotification: {
    title: (subject: string) => subject,
    body: (message: string) => message,
    channel: {
      channelName: 'Système',
      channelDescription: 'Notifications importantes de l\'application',
      androidChannelId: 'system-notifications',
    },
    type: 'system',
  },
};
