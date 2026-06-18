'use client';

import { useState } from 'react';
import Image from 'next/image';
import Chat from './Chat';
import type { PublicVerticalConfig } from '@/lib/vertical';
import { lighten } from '@/lib/color';

/**
 * Mobile: hero image fills the top of the page with a dark gradient overlay
 * and the header (logo + brand + book button + theme toggle) sits ON the
 * gradient in dark styling. White (or dark, theme-driven) chat panel below.
 *
 * Desktop: image is a sticky left third with a diagonal clip-path; the chat
 * panel takes the right two thirds with its own themed header on top.
 */
export default function SplitLanding({ config }: { config: PublicVerticalConfig }) {
  const [theme, setTheme] = useState<'light' | 'dark'>(
    config.theme === 'dark' ? 'dark' : 'light',
  );
  const onLight = theme === 'light';

  const panelClass = onLight ? 'bg-white' : 'bg-black';
  const borderClass = onLight ? 'border-black/10' : 'border-white/10';
  const titleClass = onLight ? 'text-black' : 'text-white';
  const toggleClass = onLight
    ? 'text-neutral-800 hover:text-black hover:bg-black/5'
    : 'text-white/60 hover:text-white hover:bg-white/10';
  const logoSrc = onLight ? config.logoPath : config.logoDark;

  const sunSvg = (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
  const moonSvg = (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
  const toggleIcon = onLight ? moonSvg : sunSvg;
  const toggleAria = onLight ? 'Switch to dark theme' : 'Switch to light theme';
  const onToggle = () => setTheme(onLight ? 'dark' : 'light');

  // Desktop versions of the book button + theme toggle (themed per panel).
  const desktopBookButton = (
    <a
      href={config.bookingUrl}
      target="_blank"
      rel="noopener noreferrer"
      style={{ backgroundColor: lighten(config.accentColor, 0.4) }}
      className="inline-flex items-center justify-center text-center rounded-lg px-3 py-2 text-sm font-medium text-black hover:opacity-90 transition whitespace-nowrap"
    >
      Book A Free Discovery Call
    </a>
  );
  const desktopThemeButton = (
    <button
      type="button"
      onClick={onToggle}
      aria-label={toggleAria}
      className={`shrink-0 rounded-md p-2 transition ${toggleClass}`}
    >
      {toggleIcon}
    </button>
  );

  return (
    <main className="min-h-screen flex flex-col md:flex-row bg-black overflow-x-hidden max-w-[100vw]">
      {/* MOBILE-ONLY HERO BLOCK: image + dark gradient + overlaid dark header */}
      <div className="relative w-full h-[45vh] min-h-[280px] bg-black md:hidden">
        {config.heroImage ? (
          <Image
            src={config.heroImage}
            alt=""
            fill
            priority
            quality={90}
            sizes="100vw"
            className="object-cover"
          />
        ) : null}
        {/* Dark gradient: black at the top where the header sits, fades to transparent into the image */}
        <div className="absolute inset-x-0 top-0 h-3/4 bg-gradient-to-b from-black via-black/70 to-transparent z-10 pointer-events-none" />
        {/* Overlaid header in dark styling */}
        <header className="absolute inset-x-0 top-0 z-20 px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex flex-col gap-1 min-w-0">
              <Image
                src={config.logoDark}
                alt={config.brandName}
                width={140}
                height={42}
                priority
                className="h-8 w-auto shrink-0"
              />
              <span className="text-base font-semibold tracking-tight text-white truncate min-w-0">
                {config.brandName}
              </span>
            </div>
            <div className="ml-auto flex items-center gap-2 shrink-0">
              <a
                href={config.bookingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex flex-col items-center justify-center text-center rounded-lg px-3 py-2 text-xs font-medium text-white leading-tight border border-white/40 bg-white/10 backdrop-blur-sm hover:bg-white/20 transition"
              >
                <span>Book A Free</span>
                <span>Discovery Call</span>
              </a>
              <button
                type="button"
                onClick={onToggle}
                aria-label={toggleAria}
                className="shrink-0 rounded-md p-2 text-white/80 hover:text-white hover:bg-white/10 transition"
              >
                {toggleIcon}
              </button>
            </div>
          </div>
        </header>
      </div>

      {/* DESKTOP-ONLY HERO ASIDE: sticky left third with diagonal clip-path */}
      <aside className="hidden md:block bg-black md:sticky md:top-0 md:self-start md:h-screen md:w-1/3">
        <div className="relative h-full w-full">
          {config.heroImage ? (
            <Image
              src={config.heroImage}
              alt=""
              fill
              priority
              quality={90}
              sizes="33vw"
              className="object-cover md:[clip-path:polygon(50%_0,100%_0,100%_100%,0_100%,0_50%)]"
            />
          ) : null}
        </div>
      </aside>

      {/* CHAT PANEL: full width on mobile (under the hero block), right two-thirds on desktop */}
      <section className={`flex flex-col flex-1 md:min-h-screen md:w-2/3 min-w-0 max-w-full ${panelClass}`}>
        {/* Desktop-only header inside the chat panel (mobile uses the overlaid header above) */}
        <header className={`hidden md:flex sticky top-0 z-20 border-b ${borderClass} ${panelClass} px-4 sm:px-10 py-4 items-center gap-3`}>
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 min-w-0">
            <Image
              src={logoSrc}
              alt={config.brandName}
              width={140}
              height={42}
              priority
              className="h-8 sm:h-10 w-auto shrink-0"
            />
            <span className={`text-base sm:text-xl font-semibold tracking-tight ${titleClass} truncate min-w-0`}>
              {config.brandName}
            </span>
          </div>
          <div className="ml-auto flex items-center gap-2 sm:gap-3 shrink-0">
            {desktopBookButton}
            {desktopThemeButton}
          </div>
        </header>
        <Chat config={config} theme={theme} />
      </section>
    </main>
  );
}
