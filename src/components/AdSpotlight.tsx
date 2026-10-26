import { useState } from 'react';
import { ArrowUpRight, Megaphone, Sparkles, Tag, X } from 'lucide-react';
import { MerchantAdvertisement } from '../utils/commerce';

interface AdSpotlightProps {
  advertisements: MerchantAdvertisement[];
  adsEnabled?: boolean;
  onAdClick?: (adId: string) => void;
}

export function AdSpotlight({ advertisements, adsEnabled = true, onAdClick }: AdSpotlightProps) {
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);

  if (!adsEnabled) return null;

  const activeAds = advertisements.filter(
    (ad) => ad.isActive && !dismissedIds.includes(ad.id)
  );

  if (activeAds.length === 0) return null;

  const primaryAd = activeAds[0];

  const handleAdClick = (ad: MerchantAdvertisement) => {
    if (onAdClick) {
      onAdClick(ad.id);
    } else {
      fetch(`/api/ads/${ad.id}/click`, { method: 'POST' }).catch(() => {});
    }

    if (ad.ctaUrl.startsWith('#')) {
      const target = document.querySelector(ad.ctaUrl);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
      }
    } else if (ad.ctaUrl.startsWith('http')) {
      window.open(ad.ctaUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div
      role="region"
      aria-label="Promotional partner spotlight"
      className="relative overflow-hidden rounded-2xl border border-[var(--elv-border-strong)] bg-gradient-to-r from-[#120f09] via-[#1c160c] to-[#080705] p-4 sm:p-5 shadow-xl transition-all duration-300 hover:border-[#ecc55c]/50"
    >
      {/* Background ambient lighting */}
      <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-[#ecc55c]/10 blur-2xl" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5 min-w-0">
          {primaryAd.imageUrl ? (
            <div className="h-12 w-12 sm:h-14 sm:w-14 shrink-0 overflow-hidden rounded-xl border border-[var(--elv-border)] bg-black/40">
              <img
                src={primaryAd.imageUrl}
                alt={primaryAd.title}
                className="h-full w-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
          ) : (
            <div className="flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-xl border border-[var(--elv-border-strong)] bg-[#ecc55c]/10 text-[var(--elv-text-gold)]">
              <Megaphone className="h-6 w-6" aria-hidden="true" />
            </div>
          )}

          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-[var(--elv-text-gold)] font-semibold">
                <Tag className="h-3 w-3 shrink-0" aria-hidden="true" />
                <span>{primaryAd.badge || 'Sponsored Partner'}</span>
              </span>
              <span className="text-[var(--elv-text-muted)]">·</span>
              <span className="text-[11px] text-[var(--elv-text-muted)]">Elvora Ad Network</span>
            </div>

            <h4 className="font-display text-sm sm:text-base font-bold text-[var(--elv-text-strong)] truncate">
              {primaryAd.title}
            </h4>
            <p className="text-xs text-[var(--elv-text-body)] line-clamp-2 leading-relaxed">
              {primaryAd.description}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
          <button
            type="button"
            onClick={() => handleAdClick(primaryAd)}
            className="elv-btn-gold inline-flex min-h-[40px] items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold whitespace-nowrap shadow-md transition-transform duration-150 active:scale-95"
          >
            <span>{primaryAd.ctaLabel || 'View Offer'}</span>
            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={() => setDismissedIds((prev) => [...prev, primaryAd.id])}
            aria-label="Dismiss ad notice"
            className="p-2 text-[var(--elv-text-muted)] hover:text-[var(--elv-text-strong)] transition-colors"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
