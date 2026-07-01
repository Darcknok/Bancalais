'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { ThemeToggle } from './theme-toggle';

const links = [
  { href: '/', label: 'Accueil' },
  { href: '/club', label: 'À propos' },

  { href: '/app', label: 'L\'App' },
  { href: '/contact', label: 'Contact' },
];

export function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 py-4 px-4">
      <nav
        className={`mx-auto w-max rounded-full transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] ${
          scrolled
            ? 'bg-background/80 backdrop-blur-2xl shadow-[0_4px_20px_rgba(28,25,23,0.06)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)]'
            : 'bg-background/60 backdrop-blur-xl'
        }`}
      >
        <div className="flex items-center gap-1 px-4 py-2">
          <Link
            href="/"
            className="flex items-center gap-2 mr-4 font-bold tracking-tight text-sm"
          >
            <span className="w-7 h-7 rounded-full bg-text text-background flex items-center justify-center text-xs font-bold">
              B
            </span>
            <span className="hidden sm:inline">Bancalais</span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3 py-1.5 text-xs font-medium tracking-wide text-text-secondary hover:text-text rounded-full hover:bg-background-element transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-1 ml-2">
            <ThemeToggle />
            <Link
              href="/connexion"
              className="hidden md:inline-flex items-center gap-2 rounded-full bg-text text-background px-4 py-1.5 text-xs font-medium tracking-wide hover:opacity-90 transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]"
            >
              Connexion
            </Link>
            <button
              onClick={() => setOpen(!open)}
              className="md:hidden relative w-10 h-10 flex items-center justify-center rounded-full hover:bg-background-element transition-all duration-700"
              aria-label="Menu"
            >
              <div className="relative w-5 h-4">
                <span
                  className={`absolute left-0 top-0 h-[2px] w-full bg-text rounded-full transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                    open ? 'rotate-45 top-1/2 -translate-y-1/2' : ''
                  }`}
                />
                <span
                  className={`absolute left-0 top-1/2 -translate-y-1/2 h-[2px] bg-text rounded-full transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                    open ? 'opacity-0 w-0' : 'w-full'
                  }`}
                />
                <span
                  className={`absolute left-0 bottom-0 h-[2px] bg-text rounded-full transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                    open ? '-rotate-45 bottom-1/2 translate-y-1/2' : 'w-full'
                  }`}
                />
              </div>
            </button>
          </div>
        </div>
      </nav>

      {open && (
        <div
          className="fixed inset-0 z-[-1] backdrop-blur-3xl bg-background/90 flex flex-col items-center justify-center gap-8"
          onClick={() => setOpen(false)}
        >
          <div className="flex flex-col items-center gap-6" onClick={(e) => e.stopPropagation()}>
            {links.map((link, i) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="text-3xl font-bold tracking-tight text-text hover:text-text-secondary transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]"
                style={{
                  animation: `fade-up 0.6s ease-[cubic-bezier(0.32,0.72,0,1)] ${i * 0.1}s forwards`,
                  opacity: 0,
                }}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/connexion"
              onClick={() => setOpen(false)}
              className="mt-4 rounded-full bg-text text-background px-8 py-3 text-sm font-medium tracking-wide hover:opacity-90 transition-all duration-700"
              style={{
                animation: `fade-up 0.6s ease-[cubic-bezier(0.32,0.72,0,1)] ${links.length * 0.1}s forwards`,
                opacity: 0,
              }}
            >
              Connexion
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
