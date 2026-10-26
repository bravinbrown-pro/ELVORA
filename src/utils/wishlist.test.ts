import test from 'node:test';
import assert from 'node:assert/strict';
import {
  WISHLIST_STORAGE_KEY,
  toggleWishlistId,
  isProductInWishlist,
  loadWishlistFromStorage,
  saveWishlistToStorage,
  formatWishlistButtonAriaLabel,
} from './wishlist.js';

test('toggleWishlistId adds missing item and removes existing item without duplicates', () => {
  const initial: string[] = [];
  const withOne = toggleWishlistId(initial, 'prod_earpods_pro');
  assert.deepEqual(withOne, ['prod_earpods_pro']);

  const withTwo = toggleWishlistId(withOne, 'prod_chrono_watch');
  assert.deepEqual(withTwo, ['prod_earpods_pro', 'prod_chrono_watch']);

  const withoutFirst = toggleWishlistId(withTwo, 'prod_earpods_pro');
  assert.deepEqual(withoutFirst, ['prod_chrono_watch']);

  // Toggling empty string does not mutate or add blanks
  const afterEmpty = toggleWishlistId(withoutFirst, '   ');
  assert.deepEqual(afterEmpty, ['prod_chrono_watch']);
});

test('isProductInWishlist correctly returns true only when product ID is present', () => {
  const list = ['prod_earpods_pro', 'prod_chrono_watch'];
  assert.equal(isProductInWishlist(list, 'prod_earpods_pro'), true);
  assert.equal(isProductInWishlist(list, 'prod_chrono_watch'), true);
  assert.equal(isProductInWishlist(list, 'prod_powerbank_gold'), false);
  assert.equal(isProductInWishlist([], 'prod_earpods_pro'), false);
  assert.equal(isProductInWishlist(undefined, 'prod_earpods_pro'), false);
});

test('formatWishlistButtonAriaLabel provides clear accessible button names', () => {
  assert.equal(
    formatWishlistButtonAriaLabel('Elvora Earpods Pro', false),
    'Add Elvora Earpods Pro to wishlist'
  );
  assert.equal(
    formatWishlistButtonAriaLabel('Elvora Earpods Pro', true),
    'Remove Elvora Earpods Pro from wishlist'
  );
  assert.equal(formatWishlistButtonAriaLabel('', false), 'Add item to wishlist');
});

test('loadWishlistFromStorage and saveWishlistToStorage handle valid data and corruption', () => {
  const memoryStore: Record<string, string> = {};
  const mockStorage = {
    getItem: (key: string) => memoryStore[key] ?? null,
    setItem: (key: string, value: string) => {
      memoryStore[key] = value;
    },
  };

  // Initially empty
  assert.deepEqual(loadWishlistFromStorage(mockStorage), []);

  // Save items
  const saved = saveWishlistToStorage(['prod_earpods_pro', 'prod_combo_bundle'], mockStorage);
  assert.equal(saved, true);
  assert.equal(
    memoryStore[WISHLIST_STORAGE_KEY],
    JSON.stringify(['prod_earpods_pro', 'prod_combo_bundle'])
  );

  // Reload items
  assert.deepEqual(loadWishlistFromStorage(mockStorage), [
    'prod_earpods_pro',
    'prod_combo_bundle',
  ]);

  // Corrupted JSON recovery
  memoryStore[WISHLIST_STORAGE_KEY] = '{not-valid-json';
  assert.deepEqual(loadWishlistFromStorage(mockStorage), []);

  // Non-array JSON recovery
  memoryStore[WISHLIST_STORAGE_KEY] = '{"some": "object"}';
  assert.deepEqual(loadWishlistFromStorage(mockStorage), []);
});
