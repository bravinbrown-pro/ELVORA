export const WISHLIST_STORAGE_KEY = 'elvora_wishlist_ids';

/**
 * Toggles a product ID inside a wishlist ID list.
 * If present, removes it; if absent, adds it.
 * Guarantees no duplicate entries and preserves order.
 */
export function toggleWishlistId(currentIds: readonly string[], productId: string): string[] {
  const cleanId = (productId || '').trim();
  if (!cleanId) {
    return Array.from(currentIds);
  }

  const exists = currentIds.includes(cleanId);
  if (exists) {
    return currentIds.filter((id) => id !== cleanId);
  }

  return [...currentIds, cleanId];
}

/**
 * Checks whether a given product ID is present in the wishlist array.
 */
export function isProductInWishlist(wishlistIds: readonly string[] | undefined, productId: string): boolean {
  if (!wishlistIds || !productId) return false;
  return wishlistIds.includes(productId.trim());
}

/**
 * Safely loads wishlist product IDs from localStorage.
 * Resilient against SSR, disabled storage, and corrupted JSON.
 */
export function loadWishlistFromStorage(storage?: Pick<Storage, 'getItem'>): string[] {
  try {
    const target = storage || (typeof window !== 'undefined' ? window.localStorage : undefined);
    if (!target) return [];

    const raw = target.getItem(WISHLIST_STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return Array.from(
      new Set(
        parsed
          .filter((item): item is string => typeof item === 'string')
          .map((item) => item.trim())
          .filter(Boolean)
      )
    );
  } catch {
    return [];
  }
}

/**
 * Safely saves wishlist product IDs to localStorage.
 * Handles storage quota exceptions and non-browser runtimes gracefully.
 */
export function saveWishlistToStorage(
  wishlistIds: readonly string[],
  storage?: Pick<Storage, 'setItem'>
): boolean {
  try {
    const target = storage || (typeof window !== 'undefined' ? window.localStorage : undefined);
    if (!target) return false;

    const clean = Array.from(
      new Set(wishlistIds.filter((id) => typeof id === 'string' && id.trim().length > 0))
    );

    target.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(clean));
    return true;
  } catch {
    return false;
  }
}

/**
 * Generates an accessible aria-label for the product card Heart button.
 */
export function formatWishlistButtonAriaLabel(productTitle: string, isWishlisted: boolean): string {
  const name = (productTitle || 'item').trim();
  return isWishlisted ? `Remove ${name} from wishlist` : `Add ${name} to wishlist`;
}
