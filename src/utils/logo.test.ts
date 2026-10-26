import test from 'node:test';
import assert from 'node:assert/strict';
import { getElvoraLogoSvgDataUri, ELVORA_BRAND_NAME, ELVORA_TAGLINE } from '../utils/logo';

test('Elvora brand name and tagline constants are defined and high-end', () => {
  assert.equal(ELVORA_BRAND_NAME, 'ELVORA');
  assert.equal(ELVORA_TAGLINE, 'Tech for a Brighter you');
});

test('getElvoraLogoSvgDataUri returns valid standalone SVG data URI for favicon and asset tags', () => {
  const uri = getElvoraLogoSvgDataUri();
  assert.ok(uri.startsWith('data:image/svg+xml;utf8,') || uri.startsWith('data:image/svg+xml;base64,'));
  assert.ok(uri.includes('viewBox'));
  assert.ok(uri.includes('ELVORA') || uri.includes('polygon') || uri.includes('path'));
});
