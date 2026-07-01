import Link from 'next/link';

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto">
      <div className="bg-text text-background">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            <div className="md:col-span-2 space-y-4">
              <Link href="/" className="flex items-center gap-2 font-bold text-lg tracking-tight">
                <span className="w-8 h-8 rounded-full bg-background text-text flex items-center justify-center text-sm font-bold">
                  B
                </span>
                Bancalais Natation
              </Link>
              <p className="text-sm text-text-secondary max-w-sm">
                Bancalais Natation est l&apos;application des nageurs, faite par des nageurs.
                Suivez vos comp&eacute;titions, organisez votre planning, et restez connect&eacute;
                avec votre coach — le tout depuis votre t&eacute;l&eacute;phone.
              </p>
            </div>

            <div className="space-y-4">
              <h4 className="text-xs uppercase tracking-[0.2em] font-semibold text-text-secondary">
                Navigation
              </h4>
              <div className="flex flex-col gap-2">
                {[
                  { href: '/', label: 'Accueil' },
                  { href: '/competitions', label: 'Compétitions' },
                  { href: '/app', label: 'L\'App' },
                  { href: '/contact', label: 'Contact' },
                ].map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    className="text-sm text-text-secondary hover:text-background transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]"
                  >
                    {l.label}
                  </Link>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-xs uppercase tracking-[0.2em] font-semibold text-text-secondary">
                T&eacute;l&eacute;charger
              </h4>
              <div className="flex flex-col gap-2">
                <span className="text-sm text-text-secondary">
                  Application mobile
                </span>
                <span className="text-sm text-text-secondary">
                  Disponible sur iOS et Android
                </span>
              </div>
            </div>
          </div>

          <div className="mt-16 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-text-secondary">
            <p>&copy; {year} Bancalais Natation. Tous droits r&eacute;serv&eacute;s.</p>
            <p>Fait par des nageurs, pour les nageurs</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
