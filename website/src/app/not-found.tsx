import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center px-6 text-center">
      <span className="text-8xl font-bold tracking-tight text-text-secondary">404</span>
      <h1 className="mt-4 text-2xl font-bold tracking-tight">Page introuvable</h1>
      <p className="mt-2 text-text-secondary max-w-sm">
        La page que vous recherchez n&apos;existe pas ou a &eacute;t&eacute; d&eacute;plac&eacute;e.
      </p>
      <Link
        href="/"
        className="group mt-8 inline-flex items-center gap-2 rounded-full bg-text text-background px-6 py-3 text-sm font-medium tracking-wide transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:opacity-90"
      >
        Retour &agrave; l&apos;accueil
        <span className="inline-flex w-8 h-8 rounded-full bg-white/10 items-center justify-center transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </span>
      </Link>
    </div>
  );
}
