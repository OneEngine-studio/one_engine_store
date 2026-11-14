import React from 'react';

export type Icon3DKind = 'rocket' | 'target' | 'puzzle' | 'gear' | 'user' | 'controller' | 'trophy' | 'bolt';

/** Card colours that go with each icon: [from, to]. */
export const ICON3D_TINT: Record<Icon3DKind, [string, string]> = {
  rocket: ['#6B2126', '#2D1012'],
  target: ['#7A2A2E', '#321316'],
  puzzle: ['#8C2F34', '#3A1417'],
  gear: ['#5E1A1F', '#24100F'],
  user: ['#9A3338', '#3F161A'],
  controller: ['#BB3B3B', '#5A1C20'],
  trophy: ['#843036', '#34161A'],
  bolt: ['#A53232', '#451A1D'],
};

const Gloss: React.FC<{ d: string }> = ({ d }) => <path d={d} fill="url(#i3-gloss)" />;

/** Glossy, soft-lit 3D-style icons drawn in SVG. Decorative; give the parent an accessible name. */
export const Icon3D: React.FC<{ kind: Icon3DKind; className?: string }> = ({ kind, className }) => (
  <svg viewBox="0 0 64 64" className={className} aria-hidden="true" style={{ filter: 'drop-shadow(0 6px 8px rgba(0,0,0,0.38))' }}>
    <defs>
      <linearGradient id="i3-gloss" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#fff" stopOpacity="0.75" />
        <stop offset="1" stopColor="#fff" stopOpacity="0" />
      </linearGradient>
      <linearGradient id="i3-white" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#FFFFFF" />
        <stop offset="1" stopColor="#C9D0EE" />
      </linearGradient>
      <linearGradient id="i3-red" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#F08A8A" />
        <stop offset="1" stopColor="#BB3B3B" />
      </linearGradient>
      <linearGradient id="i3-blue" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#D9625F" />
        <stop offset="1" stopColor="#7A1F25" />
      </linearGradient>
      <linearGradient id="i3-orange" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#F27A78" />
        <stop offset="1" stopColor="#A53232" />
      </linearGradient>
      <linearGradient id="i3-teal" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#FFFFFF" />
        <stop offset="1" stopColor="#CDAEB0" />
      </linearGradient>
      <linearGradient id="i3-pink" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#F5A3A3" />
        <stop offset="1" stopColor="#BB3B3B" />
      </linearGradient>
      <linearGradient id="i3-purple" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#B04048" />
        <stop offset="1" stopColor="#4A1217" />
      </linearGradient>
      <linearGradient id="i3-gold" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#FFFFFF" />
        <stop offset="1" stopColor="#D8A0A2" />
      </linearGradient>
      <linearGradient id="i3-flame" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#FFE2D0" />
        <stop offset="1" stopColor="#E25A5A" />
      </linearGradient>
    </defs>

    {kind === 'rocket' && (
      <g transform="rotate(38 32 32)">
        <path d="M27 44q5 20 10 0z" fill="url(#i3-flame)" />
        <path d="M23 34 13 47l10-3z" fill="url(#i3-red)" />
        <path d="M41 34 51 47l-10-3z" fill="url(#i3-red)" />
        <path d="M32 5c11 8 13 23 10 38H22C19 28 21 13 32 5z" fill="url(#i3-white)" />
        <path d="M32 5c5 4 8 9 9.6 15H22.4C24 14 27 9 32 5z" fill="url(#i3-red)" />
        <circle cx="32" cy="29" r="6.5" fill="#3A1417" />
        <circle cx="32" cy="29" r="4.6" fill="url(#i3-blue)" />
        <circle cx="30.3" cy="27.3" r="1.5" fill="#fff" opacity="0.85" />
        <path d="M26 14c1-3 3-6 6-8-3 4-4 9-4 13z" fill="#fff" opacity="0.55" />
      </g>
    )}

    {kind === 'target' && (
      <g>
        <circle cx="29" cy="35" r="23" fill="#4A1217" />
        <circle cx="29" cy="35" r="21" fill="url(#i3-blue)" />
        <circle cx="29" cy="35" r="15" fill="url(#i3-white)" />
        <circle cx="29" cy="35" r="10" fill="url(#i3-blue)" />
        <circle cx="29" cy="35" r="5" fill="url(#i3-white)" />
        <Gloss d="M12 28a19 19 0 0 1 28-12 21 21 0 0 0-26 17z" />
        <path d="M29 35 53 10" stroke="#F3E3E3" strokeWidth="3" strokeLinecap="round" />
        <path d="M53 10l1-7 5 5zM47 13l-1-6 8 1zM50 16l7 1-1 6z" fill="url(#i3-red)" />
      </g>
    )}

    {kind === 'puzzle' && (
      <g>
        <rect x="13" y="22" width="36" height="32" rx="9" fill="url(#i3-orange)" />
        <circle cx="31" cy="20" r="8" fill="url(#i3-orange)" />
        <circle cx="51" cy="38" r="8" fill="url(#i3-orange)" />
        <Gloss d="M16 26c2-4 8-4 14-4l4 1c-4 0-8 3-10 8l-8 0z" />
        <path d="M13 46c3 6 12 8 22 8h6c6 0 8-4 8-8-6 4-20 4-36 0z" fill="#5A1C20" opacity="0.4" />
      </g>
    )}

    {kind === 'gear' && (
      <g>
        {Array.from({ length: 8 }).map((_, i) => (
          <rect key={i} x="27" y="5" width="10" height="14" rx="3" fill="url(#i3-teal)" transform={`rotate(${i * 45} 32 32)`} />
        ))}
        <circle cx="32" cy="32" r="21" fill="url(#i3-teal)" />
        <circle cx="32" cy="32" r="9" fill="#4A1217" />
        <circle cx="32" cy="32" r="7" fill="#2A1113" />
        <Gloss d="M14 28c1-9 8-15 17-15-6 4-9 9-10 16z" />
      </g>
    )}

    {kind === 'user' && (
      <g>
        <circle cx="32" cy="32" r="25" fill="url(#i3-pink)" />
        <circle cx="32" cy="25" r="9" fill="#FFEDED" />
        <path d="M14 51c2-11 10-16 18-16s16 5 18 16c-5 6-11 8-18 8s-13-2-18-8z" fill="#FFEDED" />
        <Gloss d="M13 26C15 14 24 8 35 8c-9 3-17 9-19 20z" />
      </g>
    )}

    {kind === 'controller' && (
      <g>
        <path d="M14 22h36c7 0 11 7 12 18 .6 6-3 11-8 8l-8-7H18l-8 7c-5 3-8-2-8-8 1-11 5-18 12-18z" transform="translate(0 2)" fill="url(#i3-white)" />
        <rect x="16" y="29" width="4.4" height="13" rx="1.6" fill="#BB3B3B" />
        <rect x="11.7" y="33.3" width="13" height="4.4" rx="1.6" fill="#BB3B3B" />
        <circle cx="44" cy="31" r="3" fill="url(#i3-red)" />
        <circle cx="50" cy="37" r="3" fill="url(#i3-orange)" />
        <Gloss d="M14 25c2-2 5-3 10-3h16c-8 0-16 1-26 6z" />
      </g>
    )}

    {kind === 'trophy' && (
      <g>
        <path d="M20 8h24v14c0 9-5 15-12 15S20 31 20 22z" fill="url(#i3-gold)" />
        <path d="M20 12H9c0 10 4 15 12 16M44 12h11c0 10-4 15-12 16" fill="none" stroke="url(#i3-gold)" strokeWidth="4" strokeLinecap="round" />
        <rect x="28" y="36" width="8" height="9" fill="#B97476" />
        <rect x="19" y="45" width="26" height="9" rx="3" fill="url(#i3-gold)" />
        <Gloss d="M22 10h8c-4 4-6 10-6 16-2-4-2-10-2-16z" />
      </g>
    )}

    {kind === 'bolt' && (
      <g>
        <path d="M37 4 13 36h15l-4 24 27-34H35z" fill="url(#i3-orange)" />
        <Gloss d="M37 4 17 31h10l6-12z" />
      </g>
    )}
  </svg>
);
