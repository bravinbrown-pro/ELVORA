import { useId } from 'react';
import { ELVORA_BRAND_NAME, ELVORA_TAGLINE } from '../utils/logo';

export type ElvoraLogoSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface ElvoraEmblemProps {
  size?: ElvoraLogoSize;
  className?: string;
  withGlow?: boolean;
  interactive?: boolean;
  'aria-label'?: string;
}

export interface ElvoraBrandLockupProps {
  showMotto?: boolean;
  businessName?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  align?: 'start' | 'center';
}

/**
 * Ultra-Premium Precision Gold & Obsidian Geometric Emblem for ELVORA.
 * Features a chamfered black titanium medallion, dual-milled gold bezel,
 * faceted 3D "E" monogram, and an 8-point diamond starburst.
 */
export function ElvoraEmblem({
  size = 'md',
  className = '',
  withGlow = true,
  interactive = true,
  'aria-label': ariaLabel = 'Elvora Emblem',
}: ElvoraEmblemProps) {
  const reactId = useId().replace(/:/g, '_');
  const goldLinearId = `elv_gold_linear_${reactId}`;
  const goldBrightId = `elv_gold_bright_${reactId}`;
  const goldRimId = `elv_gold_rim_${reactId}`;
  const obsidianCoreId = `elv_obsidian_core_${reactId}`;
  const glowFilterId = `elv_glow_${reactId}`;

  const dimensionClasses: Record<ElvoraLogoSize, string> = {
    xs: 'h-6 w-6',
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16',
  };

  const selectedSize = dimensionClasses[size] || dimensionClasses.md;
  const hoverClass = interactive
    ? 'transition-all duration-300 ease-out hover:scale-105 hover:brightness-110 active:scale-95 group-hover:scale-105'
    : '';

  return (
    <div
      data-always-dark="true"
      className={`relative inline-flex items-center justify-center shrink-0 ${selectedSize} ${hoverClass} ${className}`}
      aria-label={ariaLabel}
      role="img"
    >
      <svg
        viewBox="0 0 64 64"
        className="h-full w-full select-none drop-shadow-[0_4px_12px_rgba(235,198,95,0.25)]"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Imperial Burnished Gold Gradient */}
          <linearGradient id={goldLinearId} x1="4" y1="4" x2="60" y2="60" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFFBF0" />
            <stop offset="20%" stopColor="#F7E298" />
            <stop offset="45%" stopColor="#DCA836" />
            <stop offset="75%" stopColor="#A87B19" />
            <stop offset="100%" stopColor="#5E4004" />
          </linearGradient>

          {/* Polished Platinum Champagne Highlight */}
          <linearGradient id={goldBrightId} x1="16" y1="12" x2="52" y2="52" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="30%" stopColor="#FFF3C2" />
            <stop offset="70%" stopColor="#E0B642" />
            <stop offset="100%" stopColor="#9C6F12" />
          </linearGradient>

          {/* Outer Gold Rim Gradient */}
          <linearGradient id={goldRimId} x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFF2BF" stopOpacity="0.95" />
            <stop offset="50%" stopColor="#DCA836" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#7A5308" stopOpacity="0.95" />
          </linearGradient>

          {/* Deep Obsidian Titanium Radial Gradient */}
          <radialGradient id={obsidianCoreId} cx="32" cy="24" r="34" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#1C1812" />
            <stop offset="50%" stopColor="#0F0C08" />
            <stop offset="85%" stopColor="#060504" />
            <stop offset="100%" stopColor="#020202" />
          </radialGradient>

          {/* Gold Ambient Glow Filter */}
          {withGlow && (
            <filter id={glowFilterId} x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#F5CE5A" floodOpacity="0.5" />
            </filter>
          )}
        </defs>

        {/* Outer Faceted Titanium Medallion Body */}
        <circle
          cx="32"
          cy="32"
          r="29.5"
          fill={`url(#${obsidianCoreId})`}
          stroke={`url(#${goldRimId})`}
          strokeWidth="1.8"
        />

        {/* Inset Precision Milled Bezel Ring */}
        <circle
          cx="32"
          cy="32"
          r="25"
          fill="none"
          stroke={`url(#${goldLinearId})`}
          strokeWidth="0.8"
          strokeOpacity="0.6"
          strokeDasharray="3 1.5"
        />

        {/* Outer 12 Horology Compass/Notch Points */}
        <circle cx="32" cy="4.5" r="1.2" fill="#FFF2BF" />
        <circle cx="32" cy="59.5" r="1.2" fill="#DCA836" />
        <circle cx="4.5" cy="32" r="1.2" fill="#F7E298" />
        <circle cx="59.5" cy="32" r="1.2" fill="#F7E298" />

        {/* --- Central Geometric Faceted "E" Monogram & Starburst --- */}
        {/* Geometric Hexagonal Star Framework Shadow */}
        <path
          d="M32 12 L46 20 L46 44 L32 52 L18 44 L18 20 Z"
          fill="none"
          stroke={`url(#${goldLinearId})`}
          strokeWidth="1.2"
          strokeOpacity="0.4"
        />

        {/* Main "E" Monogram Facets */}
        {/* Left Vertical Pillar */}
        <path
          d="M20 18 H26 V46 H20 C18.9 46 18 45.1 18 44 V20 C18 18.9 18.9 18 20 18 Z"
          fill={`url(#${goldLinearId})`}
          filter={withGlow ? `url(#${glowFilterId})` : undefined}
        />
        {/* Top Arm with Beveled Angle */}
        <path
          d="M26 18 H43 C44.1 18 44.8 19.1 44.3 20.1 L41.5 25 H26 V18 Z"
          fill={`url(#${goldBrightId})`}
        />
        {/* Middle Arm with Prism Point */}
        <path
          d="M26 29.5 H38 L41 32 L38 34.5 H26 V29.5 Z"
          fill={`url(#${goldLinearId})`}
        />
        {/* Bottom Arm with Beveled Angle */}
        <path
          d="M26 39 H41.5 L44.3 43.9 C44.8 44.9 44.1 46 43 46 H26 V39 Z"
          fill={`url(#${goldBrightId})`}
        />

        {/* Specular Edge Highlights on "E" */}
        <path d="M19 19 V45" stroke="#FFFFFF" strokeWidth="0.8" strokeOpacity="0.6" />
        <polygon points="26,18 43,18 41.5,20.5 26,20.5" fill="#FFFFFF" fillOpacity="0.7" />

        {/* Central 8-Point Diamond Starburst Luminescence */}
        <g transform="translate(32, 32)">
          <path
            d="M0 -11 L2 -3 L10 0 L2 3 L0 11 L-2 3 L-10 0 L-2 -3 Z"
            fill={`url(#${goldBrightId})`}
            filter={withGlow ? `url(#${glowFilterId})` : undefined}
          />
          <path
            d="M0 -6 L1.2 -1.8 L6 0 L1.2 1.8 L0 6 L-1.2 1.8 L-6 0 L-1.2 -1.8 Z"
            fill="#FFFFFF"
          />
          <circle cx="0" cy="0" r="1.5" fill="#FFFFFF" />
        </g>
      </svg>
    </div>
  );
}

/**
 * Premium Wordmark Typography for ELVORA
 */
export function ElvoraWordmark({
  size = 'md',
  showTagline = true,
  taglineText,
  className = '',
}: {
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
  taglineText?: string;
  className?: string;
}) {
  const titleClasses =
    size === 'lg'
      ? 'text-2xl sm:text-3xl tracking-[0.28em]'
      : size === 'sm'
        ? 'text-sm sm:text-base tracking-[0.2em]'
        : 'text-lg sm:text-xl tracking-[0.24em]';

  const subtitleClasses =
    size === 'lg'
      ? 'text-xs tracking-[0.22em] mt-1'
      : size === 'sm'
        ? 'text-[10px] tracking-[0.14em] mt-0.5'
        : 'text-[11px] tracking-[0.18em] mt-0.5';

  return (
    <div className={`flex flex-col select-none ${className}`}>
      <span
        className={`font-display font-bold leading-none uppercase bg-gradient-to-r from-[#FFFBF0] via-[#F7E298] to-[#DCA836] bg-clip-text text-transparent drop-shadow-sm ${titleClasses}`}
      >
        {ELVORA_BRAND_NAME}
      </span>
      {showTagline && (
        <span
          className={`font-sans font-medium uppercase text-[#A89874] ${subtitleClasses}`}
        >
          {taglineText || ELVORA_TAGLINE}
        </span>
      )}
    </div>
  );
}

/**
 * Full Premium Architectural Brand Emblem + Wordmark lockup for ELVORA.
 */
export function ElvoraBrandEmblem({
  showMotto = true,
  businessName,
  size = 'md',
  className = '',
  align = 'start',
}: ElvoraBrandLockupProps) {
  const mottoString = businessName
    ? `${ELVORA_TAGLINE} · ${businessName.replace(/\.$/, '')}`
    : ELVORA_TAGLINE;

  const gapClasses = size === 'lg' ? 'gap-3.5' : size === 'sm' ? 'gap-2.5' : 'gap-3';
  const alignClasses = align === 'center' ? 'items-center text-center' : 'items-center text-left';

  return (
    <div className={`inline-flex ${alignClasses} ${gapClasses} group ${className}`}>
      <ElvoraEmblem size={size} interactive={true} />
      <ElvoraWordmark
        size={size === 'lg' ? 'lg' : size === 'sm' ? 'sm' : 'md'}
        showTagline={showMotto}
        taglineText={mottoString}
      />
    </div>
  );
}

/**
 * High-Fidelity 8K Studio Image Logo for ELVORA.
 * Uses generated luxury 3D emblem graphics for hero splash and header branding.
 */
export function ElvoraImageLogo({
  size = 'md',
  className = '',
  variant = 'main',
}: {
  size?: ElvoraLogoSize;
  className?: string;
  variant?: 'main' | 'heraldic';
}) {
  const dimensionClasses: Record<ElvoraLogoSize, string> = {
    xs: 'h-6 w-6',
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16',
  };

  const selectedSize = dimensionClasses[size] || dimensionClasses.md;
  const src = variant === 'main' 
    ? '/src/assets/images/elvora_luxury_logo_monogram_1793005704202.jpg'
    : '/src/assets/images/elvora_luxury_logo_heraldic_1793005704335.jpg';

  return (
    <div className={`relative overflow-hidden rounded-xl border border-[#DCA836]/40 bg-black/60 shadow-[0_0_15px_rgba(220,168,54,0.2)] transition-all duration-300 hover:border-[#F7E298] hover:shadow-[0_0_22px_rgba(247,226,152,0.35)] ${selectedSize} ${className}`}>
      <img
        src={src}
        alt="Elvora Premium Luxury Logo"
        className="h-full w-full object-cover transition-transform duration-500 hover:scale-110"
        referrerPolicy="no-referrer"
      />
    </div>
  );
}

/**
 * Hallmark Seal Badge for Official Order Certificates & Receipt Verification
 */
export function ElvoraHallmarkBadge({
  label = 'Official Elvora OEM Seal',
  className = '',
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div
      className={`inline-flex items-center gap-2 rounded-lg border border-[#DCA836]/40 bg-[#120F09] px-3 py-1.5 text-xs text-[#F7E298] shadow-sm ${className}`}
    >
      <ElvoraImageLogo size="xs" variant="heraldic" className="rounded-full shrink-0" />
      <span className="font-display font-semibold tracking-wider text-[11px] uppercase">{label}</span>
    </div>
  );
}

