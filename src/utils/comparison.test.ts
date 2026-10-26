import test from 'node:test';
import assert from 'node:assert/strict';
import {
  COMPARISON_SPEC_ROWS,
  toggleCompareProductId,
  isProductInComparison,
  formatCompareButtonAriaLabel,
} from './comparison.js';
import { ProductItem } from './commerce.js';

const mockProduct: ProductItem = {
  id: 'prod_buds_01',
  title: 'Elvora Executive Earpods Pro',
  category: 'Audio',
  price: 149,
  originalPrice: 179,
  discountPercent: 17,
  oemCost: 65,
  alibabaFreeShipping: true,
  localDeliveryFeeUsd: 10,
  stockRemaining: 24,
  imageKey: 'tws_earbuds',
  specs: 'Planar magnetic drivers, 42h battery, gold-plated contacts',
  oemSupplier: 'Shenzhen Acoustic Precision Ltd.',
  oemOrigin: 'Shenzhen, CN',
  logoImprint: 'Laser-Etched Gold Elvora Mark',
  isPublished: true,
  updatedAtIso: '2026-10-25T00:00:00.000Z',
};

test('toggleCompareProductId adds missing product and removes existing product', () => {
  const empty: string[] = [];
  const one = toggleCompareProductId(empty, 'prod_buds_01');
  assert.deepEqual(one, ['prod_buds_01']);

  const two = toggleCompareProductId(one, 'prod_watch_01');
  assert.deepEqual(two, ['prod_buds_01', 'prod_watch_01']);

  const withoutBuds = toggleCompareProductId(two, 'prod_buds_01');
  assert.deepEqual(withoutBuds, ['prod_watch_01']);
});

test('toggleCompareProductId caps at maxItems', () => {
  const three = ['prod_01', 'prod_02', 'prod_03'];
  const replaced = toggleCompareProductId(three, 'prod_04', 3);
  assert.equal(replaced.length, 3);
  assert.ok(replaced.includes('prod_04'));
});

test('isProductInComparison returns correct boolean state', () => {
  const list = ['prod_01', 'prod_02'];
  assert.equal(isProductInComparison(list, 'prod_01'), true);
  assert.equal(isProductInComparison(list, 'prod_03'), false);
  assert.equal(isProductInComparison(undefined, 'prod_01'), false);
});

test('formatCompareButtonAriaLabel outputs clear accessible descriptions', () => {
  assert.equal(
    formatCompareButtonAriaLabel('Elvora Earpods Pro', false),
    'Add Elvora Earpods Pro to comparison'
  );
  assert.equal(
    formatCompareButtonAriaLabel('Elvora Earpods Pro', true),
    'Remove Elvora Earpods Pro from comparison'
  );
});

test('COMPARISON_SPEC_ROWS extracts attributes from ProductItem cleanly', () => {
  assert.ok(COMPARISON_SPEC_ROWS.length >= 6);
  const originRow = COMPARISON_SPEC_ROWS.find((r) => r.key === 'origin');
  assert.ok(originRow);
  assert.equal(originRow.getValue(mockProduct), 'Shenzhen, CN · Shenzhen Acoustic Precision Ltd.');
});
