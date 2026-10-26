export const ELVORA_BRAND_NAME = 'ELVORA';
export const ELVORA_TAGLINE = 'Tech for a Brighter you';

/**
 * Returns a clean, standalone, high-resolution SVG string of the Elvora
 * luxury gold & obsidian heraldic emblem. Suitable for <link rel="icon">
 * and external vector embeds.
 */
export function getElvoraLogoSvgMarkup(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
    <defs>
      <linearGradient id="elv-gold-linear" x1="8" y1="8" x2="56" y2="56" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stop-color="#FFF5C0" />
        <stop offset="25%" stop-color="#EBC65F" />
        <stop offset="50%" stop-color="#D9A934" />
        <stop offset="78%" stop-color="#B38217" />
        <stop offset="100%" stop-color="#7A5308" />
      </linearGradient>
      <linearGradient id="elv-gold-bright" x1="16" y1="16" x2="48" y2="48" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stop-color="#FFFFFF" />
        <stop offset="40%" stop-color="#FFE082" />
        <stop offset="100%" stop-color="#D49D24" />
      </linearGradient>
      <radialGradient id="elv-obsidian-core" cx="32" cy="28" r="30" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stop-color="#1E190F" />
        <stop offset="60%" stop-color="#0E0C07" />
        <stop offset="100%" stop-color="#050403" />
      </radialGradient>
      <filter id="elv-glow" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" dy="1" stdDeviation="1.5" flood-color="#D9A934" flood-opacity="0.35" />
      </filter>
    </defs>

    <!-- Outer Precision Chamfered Obsidian Medallion -->
    <rect x="3" y="3" width="58" height="58" rx="16" fill="url(#elv-obsidian-core)" stroke="url(#elv-gold-linear)" stroke-width="1.75" />

    <!-- Inset Fine Milled Bezel Ring -->
    <rect x="7" y="7" width="50" height="50" rx="12" fill="none" stroke="url(#elv-gold-linear)" stroke-width="0.75" stroke-opacity="0.5" stroke-dasharray="2 1" />

    <!-- Cardinal Astronomical Ticks (Precision Timepiece motif) -->
    <circle cx="32" cy="5.25" r="0.9" fill="#EBC65F" />
    <circle cx="32" cy="58.75" r="0.9" fill="#EBC65F" />
    <circle cx="5.25" cy="32" r="0.9" fill="#EBC65F" />
    <circle cx="58.75" cy="32" r="0.9" fill="#EBC65F" />

    <!-- Central Precision Faceted "E" Monogram (Tech + Luminescence) -->
    <!-- Left Vertical Spine -->
    <path d="M17 18.5 C17 17.67 17.67 17 18.5 17 H23.5 C24.33 17 25 17.67 25 18.5 V45.5 C25 46.33 24.33 47 23.5 47 H18.5 C17.67 47 17 46.33 17 45.5 Z" fill="url(#elv-gold-linear)" filter="url(#elv-glow)" />

    <!-- Top Aerodynamic Tier -->
    <path d="M25 17 H43.5 C44.5 17 45.2 17.8 44.8 18.7 L41.5 24 H25 V17 Z" fill="url(#elv-gold-bright)" />
    <!-- Top Chamfer Highlight -->
    <polygon points="25,17 43.5,17 41.5,20 25,20" fill="#FFFBE6" opacity="0.6" />

    <!-- Middle Precision Beam Tier (Interlocking Chevron) -->
    <path d="M25 28.5 H37.5 L40.5 32 L37.5 35.5 H25 V28.5 Z" fill="url(#elv-gold-linear)" />
    <polygon points="25,28.5 37.5,28.5 39,30.5 25,30.5" fill="#FFFBE6" opacity="0.5" />

    <!-- Bottom Architectural Tier -->
    <path d="M25 40 H41.5 L44.8 45.3 C45.2 46.2 44.5 47 43.5 47 H25 V40 Z" fill="url(#elv-gold-bright)" />
    <polygon points="25,44.5 43.5,47 25,47" fill="#7A5308" opacity="0.5" />

    <!-- Radiant Prism Facet (The 'Brighter You' Luminescence Beam) -->
    <polygon points="24,37 32,23 35,23 27,37" fill="url(#elv-gold-bright)" opacity="0.9" />

    <!-- Cardinal Radiant Starburst at (46, 28) -->
    <g transform="translate(46, 27)">
      <path d="M0 -5 L1.2 -1.2 L5 0 L1.2 1.2 L0 5 L-1.2 1.2 L-5 0 L-1.2 -1.2 Z" fill="url(#elv-gold-bright)" filter="url(#elv-glow)" />
      <circle cx="0" cy="0" r="1" fill="#FFFFFF" />
    </g>
  </svg>`;
}

/**
 * Returns an inline SVG data URI safe for <link rel="icon"> or <img> tags.
 */
export function getElvoraLogoSvgDataUri(): string {
  const markup = getElvoraLogoSvgMarkup().replace(/[\n\r\t]/g, ' ').replace(/\s+/g, ' ');
  return `data:image/svg+xml;utf8,${encodeURIComponent(markup)}`;
}
