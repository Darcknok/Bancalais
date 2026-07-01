'use client';

import { useState } from 'react';

export type AppScreen = 'accueil' | 'planning' | 'chat' | 'competition' | 'login';

interface MockEpreuve {
  nage: string;
  type_nage: string;
}

interface MockCompetition {
  id: number;
  lieu: string;
  date: string;
  epreuves: MockEpreuve[];
}

interface MockEvent {
  time: string;
  label: string;
  kind: string;
  type_nage?: string;
  temps?: string;
}

interface PhoneMockupProps {
  screen?: AppScreen;
  className?: string;
}

const Accent = '#0EA5E9';

const nageCouleurs: Record<string, string> = {
  crawl: '#2563EB',
  dos: '#059669',
  brass: '#D97706',
  pap: '#DB2777',
};

export function PhoneMockup({ screen = 'accueil', className = '' }: PhoneMockupProps) {
  const [activeTab, setActiveTab] = useState(screen === 'planning' ? 'planning' : screen === 'chat' ? 'chat' : 'accueil');

  const tabs = [
    { name: 'accueil', label: 'Accueil' },
    { name: 'planning', label: 'Planning' },
    { name: 'chat', label: 'Chat' },
    { name: 'notif', label: 'Activité' },
    { name: 'profil', label: 'Profil' },
  ];

  return (
    <div className={`flex flex-col w-full h-full ${className}`}
      style={{ backgroundColor: '#FAFAF8' }}
      >
        <div className="dark-theme-fix" style={{ display: 'contents' }}>
          {/* Dynamic island */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-5 bg-black rounded-b-2xl z-10" />

          {/* Accent bar */}
          <div className="absolute top-0 left-0 right-0 h-[3px] z-20" style={{ backgroundColor: Accent, opacity: 0.3 }} />

          {/* Header accent line */}
          <div className="h-[3px] shrink-0" style={{ backgroundColor: Accent, opacity: 0.3 }} />

          {/* Screen content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
              {activeTab === 'accueil' && <AccueilScreen />}
              {activeTab === 'planning' && <PlanningScreen />}
              {activeTab === 'chat' && <ChatScreen />}
              {activeTab === 'notif' && <NotifScreen />}
              {activeTab === 'profil' && <ProfilScreen />}
            </div>
          </div>

          {/* Tab bar */}
          <div className="px-4 shrink-0">
            <div className="flex items-center justify-between rounded-xl px-1 py-1.5 gap-0.5" style={{ backgroundColor: '#F5F2ED' }}>
              {tabs.map((tab) => {
                const isActive = activeTab === tab.name;
                return (
                  <button
                    key={tab.name}
                    onClick={() => setActiveTab(tab.name)}
                    className="flex flex-col items-center gap-0.5 py-1.5 w-14 rounded-lg transition-all duration-200"
                    style={isActive ? { backgroundColor: Accent + '12' } : {}}
                  >
                    <TabIcon name={tab.name} active={isActive} />
                    <span
                      className="text-[8px] font-semibold tracking-[0.2px] whitespace-nowrap"
                      style={{ color: isActive ? Accent : '#8C8882' }}
                    >
                      {tab.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
  );
}

function TabIcon({ name, active }: { name: string; active: boolean }) {
  const color = active ? Accent : '#8C8882';
  const s = { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: color, strokeWidth: 1.5, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

  switch (name) {
    case 'accueil':
      return (
        <svg {...s}>
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" fill={active ? color : 'none'} />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      );
    case 'planning':
      return (
        <svg {...s}>
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" fill={active ? color : 'none'} />
          <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      );
    case 'chat':
      return (
        <svg {...s}>
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" fill={active ? color : 'none'} />
        </svg>
      );
    case 'notif':
      return (
        <svg {...s}>
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" fill={active ? color : 'none'} />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
      );
    case 'profil':
      return (
        <svg {...s}>
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" fill={active ? color : 'none'} />
          <circle cx="12" cy="7" r="4" fill={active ? color : 'none'} />
        </svg>
      );
    default:
      return <svg {...s}><circle cx="12" cy="12" r="10" /></svg>;
  }
}

function AccueilScreen() {
  const competitions: MockCompetition[] = [
    { id: 1, lieu: 'Chalon-sur-Saône', date: '15 mars 2026', epreuves: [{ nage: '100 m nage libre', type_nage: 'crawl' }, { nage: '50 m dos', type_nage: 'dos' }, { nage: '200 m brasse', type_nage: 'brass' }] },
    { id: 2, lieu: 'Mâcon', date: '22 mars 2026', epreuves: [{ nage: '50 m dos', type_nage: 'dos' }, { nage: '100 m crawl', type_nage: 'crawl' }, { nage: '50 m brasse', type_nage: 'brass' }, { nage: '100 m 4 nages', type_nage: 'pap' }] },
    { id: 3, lieu: 'Dijon', date: '5 avril 2026', epreuves: [{ nage: '200 m 4 nages', type_nage: 'pap' }, { nage: '100 m dos', type_nage: 'dos' }, { nage: '50 m papillon', type_nage: 'pap' }] },
  ];

  return (
    <div className="p-4 space-y-4">
      <div className="pl-4">
        <div className="h-[3px] w-12 rounded-full mb-5" style={{ backgroundColor: Accent }} />
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-full flex items-center justify-center" style={{ backgroundColor: Accent + '12' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={Accent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
          </div>
          <div className="space-y-0.5">
            <p className="text-[11px] font-semibold" style={{ color: '#8C8882' }}>Bonjour, Mathias</p>
            <div className="flex items-center gap-2">
              <span className="text-[26px] font-extrabold tracking-tight" style={{ color: '#1C1917' }}>Bancalais</span>
              <div className="w-[7px] h-[7px] rounded-full mt-1" style={{ backgroundColor: Accent }} />
            </div>
            <span className="text-[10px] font-semibold tracking-[6px] uppercase" style={{ color: '#8C8882' }}>Natation</span>
          </div>
        </div>
      </div>

      <SearchBar />

      <SectionHeader label="Compétitions à venir" count={competitions.length} />

      <div className="space-y-3">
        {competitions.map((comp) => (
          <CompetitionRow key={comp.id} comp={comp} />
        ))}
      </div>
    </div>
  );
}

function SearchBar() {
  return (
    <div className="rounded-[20px] p-[1.5px]" style={{ backgroundColor: 'rgba(28,25,23,0.06)' }}>
      <div className="rounded-[18px] px-5 py-3 flex items-center gap-2" style={{ backgroundColor: '#F5F2ED' }}>
        <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: '#FAFAF8' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8C8882" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>
        <span className="text-[12px] font-medium" style={{ color: '#8C8882' }}>Rechercher une compétition…</span>
      </div>
    </div>
  );
}

function SectionHeader({ label, count }: { label: string; count: number }) {
  return (
    <div className="flex items-center gap-2 px-1">
      <div className="w-[26px] h-[26px] rounded-full flex items-center justify-center" style={{ backgroundColor: Accent + '12' }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={Accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      </div>
      <span className="text-[10px] font-semibold tracking-[1px] uppercase" style={{ color: '#8C8882' }}>{label}</span>
      <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(28,25,23,0.06)' }} />
      <div className="rounded-lg px-1.5 py-0.5" style={{ backgroundColor: 'rgba(28,25,23,0.06)' }}>
        <span className="text-[9px] font-bold" style={{ color: '#8C8882' }}>{count}</span>
      </div>
    </div>
  );
}

function CompetitionRow({ comp }: { comp: MockCompetition }) {
  return (
    <div className="rounded-[20px] p-[1.5px]" style={{ backgroundColor: Accent + '12' }}>
      <div className="rounded-[18px] p-4 space-y-2.5" style={{ backgroundColor: '#F5F2ED' }}>
        <div className="flex items-center justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#8C8882" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
              </svg>
              <span className="text-[14px] font-bold tracking-tight" style={{ color: '#1C1917' }}>{comp.lieu}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#8C8882" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <span className="text-[11px] font-medium" style={{ color: '#8C8882' }}>{comp.date}</span>
            </div>
          </div>
          <div className="w-7 h-7 rounded-full border flex items-center justify-center" style={{ borderColor: 'rgba(28,25,23,0.06)', backgroundColor: '#F5F2ED' }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#8C8882" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </div>
        </div>
        <div className="h-px" style={{ backgroundColor: 'rgba(28,25,23,0.06)' }} />
        <div className="flex flex-wrap gap-1">
          {(comp.epreuves ?? []).slice(0, 4).map((ep: MockEpreuve, i: number) => (
            <span
              key={i}
              className="text-[9px] font-bold tracking-[0.3px] px-2 py-0.5 rounded-[10px] border"
              style={{ borderColor: nageCouleurs[ep.type_nage] ?? Accent, backgroundColor: (nageCouleurs[ep.type_nage] ?? Accent) + '18', color: nageCouleurs[ep.type_nage] ?? Accent }}
            >
              {ep.nage}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function PlanningScreen() {
  const events: MockEvent[] = [
    { time: '08:00', label: 'Ouverture des portes', kind: 'event' },
    { time: '08:30', label: 'Engagements', kind: 'event' },
    { time: '09:00', label: '100 m nage libre', kind: 'race', type_nage: 'crawl', temps: '55.20' },
    { time: '09:45', label: '50 m dos', kind: 'race', type_nage: 'dos', temps: '32.50' },
    { time: '', label: 'Pause 15 min', kind: 'pause' },
    { time: '11:00', label: '200 m brasse', kind: 'race', type_nage: 'brass', temps: '2:45.30' },
    { time: '12:00', label: 'Remise des récompenses', kind: 'event' },
  ];

  return (
    <div className="p-4 space-y-3">
      <button className="flex items-center gap-1 text-[12px] font-medium" style={{ color: '#8C8882' }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Retour
      </button>

      <div className="rounded-[20px] p-[1.5px]" style={{ backgroundColor: Accent + '12' }}>
        <div className="rounded-[18px] p-4 flex items-center gap-2" style={{ backgroundColor: '#F5F2ED' }}>
          <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: Accent + '15' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={Accent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
            </svg>
          </div>
          <div className="space-y-0.5 flex-1">
            <span className="text-[16px] font-extrabold tracking-tight" style={{ color: '#1C1917' }}>Chalon-sur-Saône</span>
            <div className="flex items-center gap-2">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#8C8882" strokeWidth="1.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
              <span className="text-[11px] font-medium" style={{ color: '#8C8882' }}>15 mars 2026</span>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-2">
        {events.map((ev, i) => {
          if (ev.kind === 'pause') {
            return (
              <div key={i} className="flex items-center gap-2 py-3 pl-12">
                <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(28,25,23,0.06)' }} />
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#8C8882" strokeWidth="1.5"><path d="M18 8h1a4 4 0 0 1 0 8h-1" /><path d="M6 8H5a4 4 0 0 0 0 8h1" /><line x1="6" y1="12" x2="18" y2="12" /></svg>
                <span className="text-[10px] font-semibold tracking-[1.5px] uppercase" style={{ color: '#8C8882' }}>{ev.label}</span>
                <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(28,25,23,0.06)' }} />
              </div>
            );
          }

          return (
            <div key={i} className="flex mb-2.5">
              <div className="w-[52px] shrink-0 flex justify-center items-start pt-1.5">
                <div className="px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(28,25,23,0.06)' }}>
                  <span className="text-[11px] font-bold tabular-nums" style={{ color: '#8C8882' }}>{ev.time}</span>
                </div>
              </div>
              <div className="w-5 shrink-0 flex flex-col items-center">
                <div className="w-1 h-full" style={{ backgroundColor: 'rgba(28,25,23,0.06)' }} />
              </div>
              <div className="flex-1 pl-2 pb-3">
                {ev.kind === 'race' ? (
                  <RaceCard ev={ev} />
                ) : (
                  <EventCard ev={ev} />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RaceCard({ ev }: { ev: MockEvent }) {
  const typeNage = ev.type_nage ?? '';
  const color = typeNage ? (nageCouleurs[typeNage] ?? Accent) : Accent;
  return (
    <div className="rounded-[20px] p-[1.5px]" style={{ backgroundColor: 'rgba(28,25,23,0.06)' }}>
      <div className="rounded-[18px] p-3 space-y-2" style={{ backgroundColor: '#F5F2ED' }}>
        <div className="flex items-center gap-2">
          <div className="w-[22px] h-[22px] rounded-full flex items-center justify-center" style={{ backgroundColor: color + '20' }}>
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
          </div>
          <span className="text-[12px] font-semibold flex-1" style={{ color: '#1C1917' }}>{ev.label}</span>
          <div className="px-1.5 py-0.5 rounded" style={{ backgroundColor: color + '15' }}>
            <span className="text-[11px] font-bold tabular-nums" style={{ color }}>{ev.temps}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function EventCard({ ev }: { ev: MockEvent }) {
  return (
    <div className="rounded-[20px] p-[1.5px]" style={{ backgroundColor: 'rgba(28,25,23,0.06)' }}>
      <div className="rounded-[18px] p-3 flex items-center gap-2" style={{ backgroundColor: '#F5F2ED' }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8C8882" strokeWidth="1.5"><circle cx="12" cy="12" r="10" /></svg>
        <span className="text-[12px] font-medium" style={{ color: '#1C1917' }}>{ev.label}</span>
      </div>
    </div>
  );
}

function ChatScreen() {
  const messages = [
    { id: 1, sender: { prenom: 'Thomas', nom: 'Lefèvre', role: 'coach' }, content: 'Entraînement annulé ce soir, la piscine est fermée pour maintenance.', time: '14:30', pinned: false },
    { id: 2, sender: { prenom: 'Moi', nom: '', role: 'swimmer' }, content: 'Reçu, on fait quoi à la place ?', time: '14:32', pinned: false },
    { id: 3, sender: { prenom: 'Thomas', nom: 'Lefèvre', role: 'coach' }, content: 'Séance en salle à 18h, on travaille le gainage et la musculation.', time: '14:33', pinned: true },
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-3 pb-2 space-y-2 border-b" style={{ borderColor: 'rgba(28,25,23,0.06)' }}>
        <div className="h-[3px] w-12 rounded-full" style={{ backgroundColor: Accent }} />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: Accent }} />
            <span className="text-[17px] font-extrabold tracking-tight" style={{ color: '#1C1917' }}>CN Bancalais</span>
          </div>
          <div className="rounded px-1.5 py-1 border" style={{ borderColor: 'rgba(28,25,23,0.06)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8C8882" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-[10px] self-start" style={{ backgroundColor: 'rgba(28,25,23,0.06)' }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={Accent} strokeWidth="1.5"><circle cx="12" cy="12" r="10" /></svg>
          <span className="text-[11px] font-semibold" style={{ color: '#1C1917' }}>Fil général</span>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#8C8882" strokeWidth="2"><polyline points="6 9 12 15 18 9" /></svg>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.filter(m => m.pinned).map(m => (
          <div key={m.id} className="flex items-center gap-2 px-2.5 py-1.5 rounded border text-[11px]" style={{ borderColor: Accent + '20', backgroundColor: Accent + '08', color: '#8C8882' }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={Accent} strokeWidth="2"><line x1="12" y1="17" x2="12" y2="22" /><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z" /></svg>
            Épinglé : {m.sender.prenom} • {m.content.slice(0, 30)}…
          </div>
        ))}

        {messages.map(m => {
          const isCoach = m.sender.role === 'coach';
          const isMe = m.sender.prenom === 'Moi';
          return (
            <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[80%] rounded-[14px] p-3 space-y-1 ${isCoach ? 'border-l-2' : ''}`}
                style={{
                  backgroundColor: isCoach ? Accent + '10' : 'rgba(28,25,23,0.06)',
                  borderLeftColor: isCoach ? Accent : undefined,
                }}
              >
                <div className="flex items-center gap-1.5">
                  {isCoach && (
                    <span className="text-[8px] font-bold uppercase tracking-[0.5px] px-1.5 py-0.5 rounded" style={{ backgroundColor: Accent + '20', color: Accent }}>
                      Coach
                    </span>
                  )}
                  <span className="text-[11px]" style={{ color: isCoach ? Accent : '#8C8882', fontWeight: isCoach ? 700 : 600 }}>
                    {m.sender.prenom} {m.sender.nom ? m.sender.nom[0] + '.' : ''}
                  </span>
                  <span className="text-[10px] ml-auto" style={{ color: '#8C8882' }}>{m.time}</span>
                </div>
                <p className="text-[12px] font-medium leading-tight" style={{ color: '#1C1917' }}>{m.content}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-2 px-4 py-2 border-t" style={{ borderColor: 'rgba(28,25,23,0.06)' }}>
        <div className="flex-1 rounded-[14px] px-3.5 py-2.5" style={{ backgroundColor: 'rgba(28,25,23,0.06)' }}>
          <span className="text-[12px] font-medium" style={{ color: '#8C8882' }}>Envoyer un message…</span>
        </div>
        <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(28,25,23,0.06)' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8C8882" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
        </div>
      </div>
    </div>
  );
}

function NotifScreen() {
  const notifs = [
    { type: 'coach', text: 'Séance annulée ce soir', time: '14:30', read: false },
    { type: 'coach', text: 'Nouveau programme disponible', time: 'Hier', read: false },
    { type: 'system', text: 'Compétition ajoutée au calendrier', time: 'Hier', read: true },
    { type: 'reminder', text: 'Rappel : compétition samedi', time: 'Il y a 2 jours', read: true },
  ];

  return (
    <div className="p-4 space-y-4">
      <div className="pl-4">
        <div className="h-[3px] w-12 rounded-full mb-5" style={{ backgroundColor: Accent }} />
        <div className="flex items-center gap-2">
          <span className="text-[24px] font-bold tracking-tight" style={{ color: '#1C1917' }}>Activité</span>
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#EF4444' }} />
        </div>
      </div>

      <div className="space-y-2">
        {notifs.map((n, i) => (
          <div key={i} className="rounded-[20px] p-[1.5px]" style={{ backgroundColor: n.read ? 'rgba(28,25,23,0.03)' : Accent + '12' }}>
            <div className="rounded-[18px] p-4 flex items-start gap-3" style={{ backgroundColor: '#F5F2ED' }}>
              <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: n.type === 'coach' ? Accent + '15' : 'rgba(28,25,23,0.06)' }}>
                {n.type === 'coach' ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={Accent} strokeWidth="1.5"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
                ) : n.type === 'system' ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8C8882" strokeWidth="1.5"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8C8882" strokeWidth="1.5"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>
                )}
              </div>
              <div className="flex-1 space-y-0.5">
                <p className="text-[13px] font-medium" style={{ color: '#1C1917' }}>{n.text}</p>
                <p className="text-[10px]" style={{ color: '#8C8882' }}>{n.time}</p>
              </div>
              {!n.read && <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: Accent }} />}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProfilScreen() {
  return (
    <div className="p-4 space-y-4">
      <div className="pl-4">
        <div className="h-[3px] w-12 rounded-full mb-5" style={{ backgroundColor: Accent }} />
        <span className="text-[24px] font-bold tracking-tight" style={{ color: '#1C1917' }}>Profil</span>
      </div>

      <div className="rounded-[20px] p-[1.5px]" style={{ backgroundColor: 'rgba(28,25,23,0.06)' }}>
        <div className="rounded-[18px] p-6 flex flex-col items-center gap-3" style={{ backgroundColor: '#F5F2ED' }}>
          <div className="w-16 h-16 rounded-full flex items-center justify-center text-lg font-bold" style={{ backgroundColor: Accent + '15', color: Accent }}>
            M
          </div>
          <span className="text-[17px] font-bold tracking-tight" style={{ color: '#1C1917' }}>Mathias</span>
          <span className="text-[12px] font-medium" style={{ color: '#8C8882' }}>Nageur • CN Bancalais</span>
        </div>
      </div>

      <div className="rounded-[20px] p-[1.5px]" style={{ backgroundColor: 'rgba(28,25,23,0.06)' }}>
        <div className="rounded-[18px] p-4 space-y-3" style={{ backgroundColor: '#F5F2ED' }}>
          {[
            { icon: 'person', label: 'Mes informations' },
            { icon: 'trophy', label: 'Mes records' },
            { icon: 'bell', label: 'Notifications' },
            { icon: 'moon', label: 'Mode sombre' },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between py-1">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(28,25,23,0.06)' }}>
                  {item.icon === 'person' && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8C8882" strokeWidth="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>}
                  {item.icon === 'trophy' && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8C8882" strokeWidth="1.5"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5C7 4 6 9 6 9z" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5C17 4 18 9 18 9z" /><path d="M12 15v3" /><path d="M8 21h8" /><path d="M12 15a4 4 0 0 0 4-4V5H8v6a4 4 0 0 0 4 4z" /></svg>}
                  {item.icon === 'bell' && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8C8882" strokeWidth="1.5"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>}
                  {item.icon === 'moon' && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8C8882" strokeWidth="1.5"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>}
                </div>
                <span className="text-[13px] font-medium" style={{ color: '#1C1917' }}>{item.label}</span>
              </div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8C8882" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
            </div>
          ))}
        </div>
      </div>

      <button className="w-full py-3 rounded-[10px] text-[14px] font-bold" style={{ backgroundColor: '#1C1917', color: '#FAFAF8' }}>
        Se déconnecter
      </button>
    </div>
  );
}
