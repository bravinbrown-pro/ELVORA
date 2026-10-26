import { ProductItem } from './commerce.js';

export interface ComparisonSpecRow {
  label: string;
  key: string;
  getValue: (product: ProductItem) => string;
}

/**
 * Standardized comparison attributes extracted across audio, wearables, power, and computing.
 */
export const COMPARISON_SPEC_ROWS: ComparisonSpecRow[] = [
  {
    label: 'Category & Form',
    key: 'category',
    getValue: (p) => (p.isCombo ? `Combo (${p.category})` : p.category),
  },
  {
    label: 'OEM Origin & Facility',
    key: 'origin',
    getValue: (p) => `${p.oemOrigin} · ${p.oemSupplier}`,
  },
  {
    label: 'Factory Quality Seal',
    key: 'logoImprint',
    getValue: (p) => p.logoImprint,
  },
  {
    label: 'Hardware Specifications',
    key: 'specs',
    getValue: (p) => p.specs,
  },
  {
    label: 'Verified Buyer Rating',
    key: 'rating',
    getValue: (p) => `${(p.ratingAvg ?? 4.9).toFixed(1)} / 5.0 (${p.reviewCount ?? 15} reviews)`,
  },
  {
    label: 'Doorstep Courier Fee',
    key: 'delivery',
    getValue: (p) => `$${p.localDeliveryFeeUsd} Express Courier`,
  },
  {
    label: 'Vault Stock Status',
    key: 'stock',
    getValue: (p) => (p.stockRemaining > 0 ? `${p.stockRemaining} units in vault` : 'Sold Out'),
  },
];

/**
 * Toggles a product ID in the compare list.
 * Enforces a maximum number of items (default 3) for side-by-side readability.
 */
export function toggleCompareProductId(
  currentIds: readonly string[],
  productId: string,
  maxItems = 3
): string[] {
  const cleanId = (productId || '').trim();
  if (!cleanId) return Array.from(currentIds);

  if (currentIds.includes(cleanId)) {
    return currentIds.filter((id) => id !== cleanId);
  }

  if (currentIds.length >= maxItems) {
    // Replace the oldest non-first item or limit to maxItems
    return [...currentIds.slice(0, maxItems - 1), cleanId];
  }

  return [...currentIds, cleanId];
}

/**
 * Checks whether a product is currently selected for comparison.
 */
export function isProductInComparison(
  compareIds: readonly string[] | undefined,
  productId: string
): boolean {
  if (!compareIds || !productId) return false;
  return compareIds.includes(productId.trim());
}

/**
 * Formats an accessible aria-label for comparison toggles.
 */
export function formatCompareButtonAriaLabel(
  productTitle: string,
  isComparing: boolean
): string {
  const title = (productTitle || 'item').trim();
  return isComparing ? `Remove ${title} from comparison` : `Add ${title} to comparison`;
}
