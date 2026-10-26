import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Deterministic Red-Team Security Evaluator for Elvora's Firestore Rules.
 * Verifies structural invariants in firestore.rules / DRAFT_firestore.rules
 * AND simulates all 12 "Dirty Dozen" adversarial payloads against the exact
 * validation & authorization predicates mirrored from the ruleset.
 */

const rulesPath = fs.existsSync(path.resolve('firestore.rules'))
  ? path.resolve('firestore.rules')
  : path.resolve('DRAFT_firestore.rules');

const rulesSource = fs.readFileSync(rulesPath, 'utf8');
const blueprint = JSON.parse(fs.readFileSync(path.resolve('firebase-blueprint.json'), 'utf8'));

interface AuthCtx {
  uid: string;
  email: string;
  email_verified: boolean;
}

interface EvalEnv {
  nowMs: number;
  auth: AuthCtx | null;
  dbBefore: Record<string, Record<string, unknown>>;
  dbAfter: Record<string, Record<string, unknown>>;
}

const ID_REGEX = /^[a-zA-Z0-9_\-]+$/;
const ORDER_CODE_REGEX = /^ELV-[0-9A-Z]+$/;
const PHONE_REGEX = /^\+?[0-9 \-()]{7,24}$/;

function isValidId(id: unknown): boolean {
  return typeof id === 'string' && id.length >= 1 && id.length <= 128 && ID_REGEX.test(id);
}

function isVerifiedUser(auth: AuthCtx | null): boolean {
  return auth !== null && auth.email_verified === true;
}

function isAdmin(env: EvalEnv): boolean {
  if (!isVerifiedUser(env.auth) || !env.auth) return false;
  return Boolean(env.dbBefore[`/admins/${env.auth.uid}`]) || env.auth.email === 'bravinbrown8@gmail.com';
}

function hasExactKeys(data: Record<string, unknown>, allowed: string[]): boolean {
  const keys = Object.keys(data);
  return allowed.every((k) => keys.includes(k)) && keys.every((k) => allowed.includes(k));
}

function affectedKeysOnly(
  incoming: Record<string, unknown>,
  existing: Record<string, unknown>,
  allowedDiff: string[]
): boolean {
  const allKeys = new Set([...Object.keys(incoming), ...Object.keys(existing)]);
  for (const key of allKeys) {
    if (incoming[key] !== existing[key] && !allowedDiff.includes(key)) {
      return false;
    }
  }
  return true;
}

function isValidProduct(data: Record<string, unknown>, auth: AuthCtx | null): boolean {
  const keys = [
    'title', 'category', 'price', 'oemCost', 'stockRemaining',
    'imageKey', 'specs', 'oemSupplier', 'logoImprint',
    'isPublished', 'ownerEmail', 'createdAt', 'updatedAt'
  ];
  if (!hasExactKeys(data, keys) || !auth) return false;
  return (
    typeof data.title === 'string' && data.title.length >= 3 && data.title.length <= 120 &&
    typeof data.category === 'string' && ['Combos', 'Audio', 'Wearables', 'Power', 'Computing'].includes(data.category) &&
    typeof data.price === 'number' && data.price > 0 && data.price <= 100000 &&
    typeof data.oemCost === 'number' && data.oemCost >= 0 && data.oemCost <= 100000 &&
    typeof data.stockRemaining === 'number' && Number.isInteger(data.stockRemaining) && data.stockRemaining >= 0 && data.stockRemaining <= 100000 &&
    typeof data.imageKey === 'string' && data.imageKey.length >= 2 && data.imageKey.length <= 64 && ID_REGEX.test(data.imageKey) &&
    typeof data.specs === 'string' && data.specs.length >= 5 && data.specs.length <= 320 &&
    typeof data.oemSupplier === 'string' && data.oemSupplier.length >= 3 && data.oemSupplier.length <= 120 &&
    typeof data.logoImprint === 'string' && data.logoImprint.length >= 5 && data.logoImprint.length <= 80 &&
    typeof data.isPublished === 'boolean' &&
    typeof data.ownerEmail === 'string' && data.ownerEmail === auth.email &&
    typeof data.createdAt === 'number' &&
    typeof data.updatedAt === 'number'
  );
}

function isValidOrder(data: Record<string, unknown>): boolean {
  const keys = [
    'orderCode', 'buyerId', 'itemTitle', 'itemImageKey', 'quantity',
    'totalUsd', 'deliveryZone', 'paymentMethod', 'paymentRef',
    'oemOrderRef', 'logoImprint', 'status', 'createdAt', 'updatedAt'
  ];
  if (!hasExactKeys(data, keys)) return false;
  return (
    typeof data.orderCode === 'string' && data.orderCode.length >= 6 && data.orderCode.length <= 24 && ORDER_CODE_REGEX.test(data.orderCode) &&
    typeof data.buyerId === 'string' && isValidId(data.buyerId) &&
    typeof data.itemTitle === 'string' && data.itemTitle.length >= 3 && data.itemTitle.length <= 140 &&
    typeof data.itemImageKey === 'string' && data.itemImageKey.length >= 2 && data.itemImageKey.length <= 64 && ID_REGEX.test(data.itemImageKey) &&
    typeof data.quantity === 'number' && Number.isInteger(data.quantity) && data.quantity >= 1 && data.quantity <= 100 &&
    typeof data.totalUsd === 'number' && data.totalUsd > 0 && data.totalUsd <= 500000 &&
    typeof data.deliveryZone === 'string' && ['express_city', 'standard_metro', 'hub_pickup'].includes(data.deliveryZone) &&
    typeof data.paymentMethod === 'string' && ['mobile_money', 'card_gateway', 'instant_bank'].includes(data.paymentMethod) &&
    typeof data.paymentRef === 'string' && data.paymentRef.length >= 4 && data.paymentRef.length <= 64 && ID_REGEX.test(data.paymentRef) &&
    typeof data.oemOrderRef === 'string' && data.oemOrderRef.length >= 4 && data.oemOrderRef.length <= 64 && ID_REGEX.test(data.oemOrderRef) &&
    typeof data.logoImprint === 'string' && data.logoImprint.length >= 5 && data.logoImprint.length <= 80 &&
    typeof data.status === 'string' && ['payment_confirmed', 'oem_branding', 'local_hub', 'out_for_delivery', 'delivered'].includes(data.status) &&
    typeof data.createdAt === 'number' &&
    typeof data.updatedAt === 'number'
  );
}

function isValidOwnerSetting(data: Record<string, unknown>, auth: AuthCtx | null): boolean {
  const keys = ['ownerUid', 'payoutPhone', 'merchantName', 'autoOrderOem', 'autoPostFeed', 'createdAt', 'updatedAt'];
  if (!hasExactKeys(data, keys) || !auth) return false;
  return (
    typeof data.ownerUid === 'string' && isValidId(data.ownerUid) && data.ownerUid === auth.uid &&
    typeof data.payoutPhone === 'string' && PHONE_REGEX.test(data.payoutPhone) &&
    typeof data.merchantName === 'string' && data.merchantName.length >= 2 && data.merchantName.length <= 80 &&
    typeof data.autoOrderOem === 'boolean' &&
    typeof data.autoPostFeed === 'boolean' &&
    typeof data.createdAt === 'number' &&
    typeof data.updatedAt === 'number'
  );
}

function isValidReview(data: Record<string, unknown>, auth: AuthCtx | null): boolean {
  const keys = ['productId', 'productTitle', 'authorUid', 'authorName', 'rating', 'comment', 'isPublic', 'createdAt'];
  if (!hasExactKeys(data, keys) || !auth) return false;
  return (
    typeof data.productId === 'string' && data.productId.length >= 2 && data.productId.length <= 64 && ID_REGEX.test(data.productId) &&
    typeof data.productTitle === 'string' && data.productTitle.length >= 3 && data.productTitle.length <= 120 &&
    typeof data.authorUid === 'string' && isValidId(data.authorUid) && data.authorUid === auth.uid &&
    typeof data.authorName === 'string' && data.authorName.length >= 2 && data.authorName.length <= 80 &&
    typeof data.rating === 'number' && Number.isInteger(data.rating) && data.rating >= 1 && data.rating <= 5 &&
    typeof data.comment === 'string' && data.comment.length >= 8 && data.comment.length <= 400 &&
    typeof data.isPublic === 'boolean' &&
    typeof data.createdAt === 'number'
  );
}

function isValidSupportInquiry(data: Record<string, unknown>): boolean {
  const keys = ['senderUid', 'senderName', 'contactInfo', 'topic', 'message', 'status', 'createdAt', 'updatedAt'];
  if (!hasExactKeys(data, keys)) return false;
  return (
    typeof data.senderUid === 'string' && isValidId(data.senderUid) &&
    typeof data.senderName === 'string' && data.senderName.length >= 2 && data.senderName.length <= 80 &&
    typeof data.contactInfo === 'string' && data.contactInfo.length >= 5 && data.contactInfo.length <= 120 &&
    typeof data.topic === 'string' && ['delivery', 'combos', 'payment', 'warranty'].includes(data.topic) &&
    typeof data.message === 'string' && data.message.length >= 8 && data.message.length <= 500 &&
    typeof data.status === 'string' && ['open', 'resolved'].includes(data.status) &&
    typeof data.createdAt === 'number' &&
    typeof data.updatedAt === 'number'
  );
}

function isValidCustomerProfile(data: Record<string, unknown>, auth: AuthCtx | null): boolean {
  const keys = ['uid', 'displayName', 'countryName', 'currencyCode', 'createdAt', 'updatedAt'];
  if (!hasExactKeys(data, keys) || !auth) return false;
  return (
    typeof data.uid === 'string' && isValidId(data.uid) && data.uid === auth.uid &&
    typeof data.displayName === 'string' && data.displayName.length >= 2 && data.displayName.length <= 80 &&
    typeof data.countryName === 'string' && data.countryName.length >= 2 && data.countryName.length <= 60 &&
    typeof data.currencyCode === 'string' && /^[A-Z]{3}$/.test(data.currencyCode) &&
    typeof data.createdAt === 'number' &&
    typeof data.updatedAt === 'number'
  );
}

function evaluateRule(
  op: 'get' | 'list' | 'create' | 'update',
  docPath: string,
  env: EvalEnv,
  incomingData?: Record<string, unknown>
): 'ALLOWED' | 'PERMISSION_DENIED' {
  const segments = docPath.split('/').filter(Boolean);

  if (segments[0] === 'admins' && segments.length === 2) {
    if (op === 'create' || op === 'update' || op === 'list') return 'PERMISSION_DENIED';
  }

  if (segments[0] === 'products' && segments.length === 2) {
    const productId = segments[1];
    if (op === 'create' && incomingData) {
      const ok =
        isVerifiedUser(env.auth) &&
        isValidId(productId) &&
        isValidProduct(incomingData, env.auth) &&
        incomingData.createdAt === env.nowMs &&
        incomingData.updatedAt === env.nowMs &&
        isAdmin(env);
      return ok ? 'ALLOWED' : 'PERMISSION_DENIED';
    }
    if (op === 'update' && incomingData) {
      const existing = env.dbBefore[docPath];
      if (!existing) return 'PERMISSION_DENIED';
      const ok =
        isVerifiedUser(env.auth) &&
        isValidId(productId) &&
        isValidProduct(incomingData, env.auth) &&
        incomingData.createdAt === existing.createdAt &&
        incomingData.ownerEmail === existing.ownerEmail &&
        incomingData.updatedAt === env.nowMs &&
        isAdmin(env) &&
        affectedKeysOnly(incomingData, existing, ['price', 'stockRemaining', 'isPublished', 'specs', 'updatedAt']);
      return ok ? 'ALLOWED' : 'PERMISSION_DENIED';
    }
  }

  if (segments[0] === 'ownerSettings' && segments.length === 2) {
    const settingId = segments[1];
    if (op === 'create' && incomingData) {
      const ok =
        isVerifiedUser(env.auth) &&
        settingId === 'config' &&
        isValidOwnerSetting(incomingData, env.auth) &&
        incomingData.createdAt === env.nowMs &&
        incomingData.updatedAt === env.nowMs &&
        isAdmin(env);
      return ok ? 'ALLOWED' : 'PERMISSION_DENIED';
    }
  }

  if (segments[0] === 'orders' && segments.length === 2) {
    const orderId = segments[1];
    if (op === 'list') {
      const existing = env.dbBefore[docPath];
      const ok =
        Boolean(existing) &&
        isVerifiedUser(env.auth) &&
        (existing.buyerId === env.auth?.uid || env.auth?.email === 'bravinbrown8@gmail.com');
      return ok ? 'ALLOWED' : 'PERMISSION_DENIED';
    }
    if (op === 'create' && incomingData) {
      const ok =
        isVerifiedUser(env.auth) &&
        isValidId(orderId) &&
        isValidOrder(incomingData) &&
        incomingData.buyerId === env.auth?.uid &&
        incomingData.status === 'payment_confirmed' &&
        incomingData.createdAt === env.nowMs &&
        incomingData.updatedAt === env.nowMs &&
        Boolean(env.dbAfter[`/orders/${orderId}/private/shipping`]);
      return ok ? 'ALLOWED' : 'PERMISSION_DENIED';
    }
    if (op === 'update' && incomingData) {
      const existing = env.dbBefore[docPath];
      if (!existing) return 'PERMISSION_DENIED';
      const ok =
        isVerifiedUser(env.auth) &&
        isValidId(orderId) &&
        isValidOrder(incomingData) &&
        incomingData.buyerId === existing.buyerId &&
        incomingData.orderCode === existing.orderCode &&
        incomingData.createdAt === existing.createdAt &&
        incomingData.updatedAt === env.nowMs &&
        isAdmin(env) &&
        affectedKeysOnly(incomingData, existing, ['status', 'oemOrderRef', 'updatedAt']);
      return ok ? 'ALLOWED' : 'PERMISSION_DENIED';
    }
  }

  if (segments[0] === 'orders' && segments[2] === 'private' && segments.length === 4) {
    const orderId = segments[1];
    const detailId = segments[3];
    if (op === 'get') {
      const existing = env.dbBefore[docPath];
      const parent = env.dbBefore[`/orders/${orderId}`];
      const ok =
        Boolean(existing) &&
        Boolean(parent) &&
        isVerifiedUser(env.auth) &&
        isValidId(orderId) &&
        isValidId(detailId) &&
        ((existing.buyerId === env.auth?.uid && parent.buyerId === env.auth?.uid) || isAdmin(env));
      return ok ? 'ALLOWED' : 'PERMISSION_DENIED';
    }
  }

  if (segments[0] === 'reviews' && segments.length === 2) {
    const reviewId = segments[1];
    if (op === 'create' && incomingData) {
      const ok =
        isVerifiedUser(env.auth) &&
        isValidId(reviewId) &&
        isValidReview(incomingData, env.auth) &&
        incomingData.isPublic === true &&
        incomingData.createdAt === env.nowMs &&
        Boolean(env.dbBefore[`/products/${incomingData.productId}`]);
      return ok ? 'ALLOWED' : 'PERMISSION_DENIED';
    }
  }

  if (segments[0] === 'inquiries' && segments.length === 2) {
    const inquiryId = segments[1];
    if (op === 'get' || op === 'list') {
      const existing = env.dbBefore[docPath];
      const ok =
        Boolean(existing) &&
        isVerifiedUser(env.auth) &&
        (op === 'list' || isValidId(inquiryId)) &&
        (existing.senderUid === env.auth?.uid || isAdmin(env));
      return ok ? 'ALLOWED' : 'PERMISSION_DENIED';
    }
    if (op === 'create' && incomingData) {
      const ok =
        isVerifiedUser(env.auth) &&
        isValidId(inquiryId) &&
        isValidSupportInquiry(incomingData) &&
        incomingData.senderUid === env.auth?.uid &&
        incomingData.status === 'open' &&
        incomingData.createdAt === env.nowMs &&
        incomingData.updatedAt === env.nowMs;
      return ok ? 'ALLOWED' : 'PERMISSION_DENIED';
    }
  }

  if (segments[0] === 'customerProfiles' && segments.length === 2) {
    const userId = segments[1];
    if (op === 'get') {
      const ok =
        isVerifiedUser(env.auth) &&
        isValidId(userId) &&
        (env.auth?.uid === userId || isAdmin(env));
      return ok ? 'ALLOWED' : 'PERMISSION_DENIED';
    }
    if (op === 'create' && incomingData) {
      const ok =
        isVerifiedUser(env.auth) &&
        isValidId(userId) &&
        env.auth?.uid === userId &&
        isValidCustomerProfile(incomingData, env.auth) &&
        incomingData.createdAt === env.nowMs &&
        incomingData.updatedAt === env.nowMs &&
        Boolean(env.dbAfter[`/customerProfiles/${userId}/private/contact`]);
      return ok ? 'ALLOWED' : 'PERMISSION_DENIED';
    }
  }

  if (segments[0] === 'customerProfiles' && segments[2] === 'private' && segments.length === 4) {
    const userId = segments[1];
    const detailId = segments[3];
    if (op === 'get') {
      const existing = env.dbBefore[docPath];
      const parent = env.dbBefore[`/customerProfiles/${userId}`];
      const ok =
        Boolean(existing) &&
        Boolean(parent) &&
        isVerifiedUser(env.auth) &&
        isValidId(userId) &&
        isValidId(detailId) &&
        ((env.auth?.uid === userId && existing.uid === env.auth?.uid && parent.uid === env.auth?.uid) || isAdmin(env));
      return ok ? 'ALLOWED' : 'PERMISSION_DENIED';
    }
  }

  return 'PERMISSION_DENIED';
}

const NOW = 1792962000000;
const ADMIN_AUTH: AuthCtx = { uid: 'uid_owner_1', email: 'bravinbrown8@gmail.com', email_verified: true };
const BUYER_AUTH: AuthCtx = { uid: 'uid_buyer_1', email: 'shopper@example.com', email_verified: true };
const ATTACKER_AUTH: AuthCtx = { uid: 'uid_attacker_9', email: 'attacker@example.com', email_verified: true };

const VALID_PRODUCT = {
  title: 'Elvora Executive Combo: Earpods Pro + Chrono X1 Smartwatch',
  category: 'Combos',
  price: 279,
  oemCost: 148,
  stockRemaining: 14,
  imageKey: 'combo_earpods_watch',
  specs: '2-in-1 Matched Black & Gold Bundle, Titanium Smartwatch + Spatial ANC Earpods',
  oemSupplier: 'Guangzhou SmartBundle OEM Group',
  logoImprint: 'ELVORA Tech for a Brighter you',
  isPublished: true,
  ownerEmail: 'bravinbrown8@gmail.com',
  createdAt: NOW,
  updatedAt: NOW,
};

const VALID_ORDER = {
  orderCode: 'ELV-9001',
  buyerId: 'uid_buyer_1',
  itemTitle: 'Elvora Studio Pro ANC Headphones',
  itemImageKey: 'anc_headphones',
  quantity: 1,
  totalUsd: 201,
  deliveryZone: 'express_city',
  paymentMethod: 'mobile_money',
  paymentRef: 'MPESA-884120',
  oemOrderRef: 'ALI-OEM-4401',
  logoImprint: 'ELVORA Tech for a Brighter you',
  status: 'payment_confirmed',
  createdAt: NOW,
  updatedAt: NOW,
};

test('Static audit: rules_version 2, default-deny safety net, and blueprint parity across all 11 paths', () => {
  assert.match(rulesSource, /rules_version\s*=\s*'2';/);
  assert.match(rulesSource, /match\s+\/\{document=\*\*\}\s*\{\s*allow\s+read,\s*write:\s*if\s*false;/);

  const blueprintPaths = Object.keys(blueprint.firestore);
  assert.equal(blueprintPaths.length, 11);
  assert.match(rulesSource, /match \/products\/\{productId\}/);
  assert.match(rulesSource, /match \/orders\/\{orderId\}/);
  assert.match(rulesSource, /match \/private\/\{detailId\}/);
  assert.match(rulesSource, /match \/ownerSettings\/\{settingId\}/);
  assert.match(rulesSource, /match \/aiPosts\/\{postId\}/);
  assert.match(rulesSource, /match \/reviews\/\{reviewId\}/);
  assert.match(rulesSource, /match \/inquiries\/\{inquiryId\}/);
  assert.match(rulesSource, /match \/customerProfiles\/\{userId\}/);
  assert.match(rulesSource, /match \/admins\/\{adminId\}/);
  assert.match(rulesSource, /match \/test\/\{testId\}/);
});

test('Customer Account PII Isolation & Atomic Batch Check on /customerProfiles', () => {
  const env: EvalEnv = {
    nowMs: NOW,
    auth: ATTACKER_AUTH,
    dbBefore: {
      '/customerProfiles/uid_buyer_1': {
        uid: 'uid_buyer_1',
        displayName: 'Amara Okafor',
        countryName: 'Kenya',
        currencyCode: 'KES',
        createdAt: NOW,
        updatedAt: NOW,
      },
      '/customerProfiles/uid_buyer_1/private/contact': {
        uid: 'uid_buyer_1',
        email: 'shopper@example.com',
        phone: '+254711000111',
        defaultAddress: '14 Riverside Drive, Westlands',
        createdAt: NOW,
        updatedAt: NOW,
      },
    },
    dbAfter: {},
  };

  // Attacker blocked from reading victim's isolated PII contact doc
  assert.equal(evaluateRule('get', '/customerProfiles/uid_buyer_1/private/contact', env), 'PERMISSION_DENIED');
  // Owner allowed via Master Gate
  assert.equal(evaluateRule('get', '/customerProfiles/uid_buyer_1/private/contact', { ...env, auth: BUYER_AUTH }), 'ALLOWED');
  // Orphaned customerProfile create without atomic private/contact subdoc denied
  assert.equal(
    evaluateRule(
      'create',
      '/customerProfiles/uid_buyer_1',
      { nowMs: NOW, auth: BUYER_AUTH, dbBefore: {}, dbAfter: {} },
      {
        uid: 'uid_buyer_1',
        displayName: 'Amara Okafor',
        countryName: 'Kenya',
        currencyCode: 'KES',
        createdAt: NOW,
        updatedAt: NOW,
      }
    ),
    'PERMISSION_DENIED'
  );
});

test('Dirty Dozen #1: Shadow field injection on Combo product create returns PERMISSION_DENIED', () => {
  const env: EvalEnv = { nowMs: NOW, auth: ADMIN_AUTH, dbBefore: {}, dbAfter: {} };
  const shadowPayload = { ...VALID_PRODUCT, isFeaturedHack: true };
  assert.equal(evaluateRule('create', '/products/prod_combo_01', env, shadowPayload), 'PERMISSION_DENIED');
  assert.equal(evaluateRule('create', '/products/prod_combo_01', env, VALID_PRODUCT), 'ALLOWED');
});

test('Dirty Dozen #2: Unverified admin email spoof returns PERMISSION_DENIED', () => {
  const spoofAuth: AuthCtx = { uid: 'uid_spoof', email: 'bravinbrown8@gmail.com', email_verified: false };
  const env: EvalEnv = { nowMs: NOW, auth: spoofAuth, dbBefore: {}, dbAfter: {} };
  const settingPayload = {
    ownerUid: 'uid_spoof',
    payoutPhone: '+254712345678',
    merchantName: 'Elvora Goldline Electronics Ltd.',
    autoOrderOem: true,
    autoPostFeed: true,
    createdAt: NOW,
    updatedAt: NOW,
  };
  assert.equal(evaluateRule('create', '/ownerSettings/config', env, settingPayload), 'PERMISSION_DENIED');
});

test('Dirty Dozen #3: Cross-user PII read on /orders/{id}/private/shipping and /inquiries/{id} returns PERMISSION_DENIED', () => {
  const env: EvalEnv = {
    nowMs: NOW,
    auth: ATTACKER_AUTH,
    dbBefore: {
      '/orders/ord_101': VALID_ORDER,
      '/orders/ord_101/private/shipping': {
        buyerId: 'uid_buyer_1',
        customerName: 'Amara Okafor',
        customerPhone: '+254711000111',
        deliveryAddress: '14 Riverside Drive, Westlands',
        ownerPayoutPhone: '+254712345678',
        createdAt: NOW,
      },
      '/inquiries/inq_101': {
        senderUid: 'uid_buyer_1',
        senderName: 'Amara Okafor',
        contactInfo: '+254711000111',
        topic: 'delivery',
        message: 'When will Rider #14 reach Westlands?',
        status: 'open',
        createdAt: NOW,
        updatedAt: NOW,
      },
    },
    dbAfter: {},
  };
  assert.equal(evaluateRule('get', '/orders/ord_101/private/shipping', env), 'PERMISSION_DENIED');
  assert.equal(evaluateRule('get', '/inquiries/inq_101', env), 'PERMISSION_DENIED');
  assert.equal(evaluateRule('get', '/orders/ord_101/private/shipping', { ...env, auth: BUYER_AUTH }), 'ALLOWED');
  assert.equal(evaluateRule('get', '/inquiries/inq_101', { ...env, auth: BUYER_AUTH }), 'ALLOWED');
});

test('Dirty Dozen #4: Orphaned order or review create without parent reference returns PERMISSION_DENIED', () => {
  const envMissingSubdoc: EvalEnv = { nowMs: NOW, auth: BUYER_AUTH, dbBefore: {}, dbAfter: {} };
  assert.equal(evaluateRule('create', '/orders/ord_102', envMissingSubdoc, VALID_ORDER), 'PERMISSION_DENIED');

  const orphanReview = {
    productId: 'prod_nonexistent',
    productTitle: 'Ghost Earpods',
    authorUid: 'uid_buyer_1',
    authorName: 'Buyer One',
    rating: 5,
    comment: 'Great sound clarity and fast local courier.',
    isPublic: true,
    createdAt: NOW,
  };
  assert.equal(evaluateRule('create', '/reviews/rev_1', envMissingSubdoc, orphanReview), 'PERMISSION_DENIED');

  const envWithProduct: EvalEnv = {
    nowMs: NOW,
    auth: BUYER_AUTH,
    dbBefore: { '/products/prod_combo_01': VALID_PRODUCT },
    dbAfter: {},
  };
  assert.equal(
    evaluateRule('create', '/reviews/rev_1', envWithProduct, {
      ...orphanReview,
      productId: 'prod_combo_01',
    }),
    'ALLOWED'
  );
});

test('Dirty Dozen #5: Identity spoofing on order or review create returns PERMISSION_DENIED', () => {
  const env: EvalEnv = {
    nowMs: NOW,
    auth: ATTACKER_AUTH,
    dbBefore: { '/products/prod_combo_01': VALID_PRODUCT },
    dbAfter: { '/orders/ord_103/private/shipping': { buyerId: 'uid_buyer_1' } },
  };
  assert.equal(evaluateRule('create', '/orders/ord_103', env, VALID_ORDER), 'PERMISSION_DENIED');
  assert.equal(
    evaluateRule('create', '/reviews/rev_spoof', env, {
      productId: 'prod_combo_01',
      productTitle: 'Elvora Executive Combo',
      authorUid: 'uid_buyer_1',
      authorName: 'Spoofed Buyer',
      rating: 5,
      comment: 'Spoofed author UID attempt.',
      isPublic: true,
      createdAt: NOW,
    }),
    'PERMISSION_DENIED'
  );
});

test('Dirty Dozen #6: Oversized or malformed document ID returns PERMISSION_DENIED', () => {
  const env: EvalEnv = {
    nowMs: NOW,
    auth: BUYER_AUTH,
    dbBefore: {},
    dbAfter: { [`/orders/${'x'.repeat(200)}/private/shipping`]: { buyerId: 'uid_buyer_1' } },
  };
  assert.equal(evaluateRule('create', `/orders/${'x'.repeat(200)}`, env, VALID_ORDER), 'PERMISSION_DENIED');
});

test('Dirty Dozen #7: Value poisoning on product update returns PERMISSION_DENIED', () => {
  const env: EvalEnv = {
    nowMs: NOW + 5000,
    auth: ADMIN_AUTH,
    dbBefore: { '/products/prod_1': VALID_PRODUCT },
    dbAfter: {},
  };
  const poisonedUpdate = {
    ...VALID_PRODUCT,
    stockRemaining: 'unlimited' as unknown as number,
    updatedAt: NOW + 5000,
  };
  assert.equal(evaluateRule('update', '/products/prod_1', env, poisonedUpdate), 'PERMISSION_DENIED');
});

test('Dirty Dozen #8: Client timestamp forgery on order create returns PERMISSION_DENIED', () => {
  const env: EvalEnv = {
    nowMs: NOW,
    auth: BUYER_AUTH,
    dbBefore: {},
    dbAfter: { '/orders/ord_105/private/shipping': { buyerId: 'uid_buyer_1' } },
  };
  const forgedOrder = { ...VALID_ORDER, createdAt: NOW - 3600000 };
  assert.equal(evaluateRule('create', '/orders/ord_105', env, forgedOrder), 'PERMISSION_DENIED');
});

test('Dirty Dozen #9: Non-admin status mutation on delivered order returns PERMISSION_DENIED', () => {
  const deliveredOrder = { ...VALID_ORDER, status: 'delivered' };
  const env: EvalEnv = {
    nowMs: NOW + 10000,
    auth: BUYER_AUTH,
    dbBefore: { '/orders/ord_106': deliveredOrder },
    dbAfter: {},
  };
  const reopenedOrder = { ...deliveredOrder, status: 'out_for_delivery', updatedAt: NOW + 10000 };
  assert.equal(evaluateRule('update', '/orders/ord_106', env, reopenedOrder), 'PERMISSION_DENIED');
});

test('Dirty Dozen #10: Immutable createdAt or ownerEmail mutation returns PERMISSION_DENIED', () => {
  const env: EvalEnv = {
    nowMs: NOW + 5000,
    auth: ADMIN_AUTH,
    dbBefore: { '/products/prod_1': VALID_PRODUCT },
    dbAfter: {},
  };
  const mutatedCreatedAt = { ...VALID_PRODUCT, createdAt: NOW + 5000, updatedAt: NOW + 5000 };
  assert.equal(evaluateRule('update', '/products/prod_1', env, mutatedCreatedAt), 'PERMISSION_DENIED');
});

test('Dirty Dozen #11: Self-assigned admin privilege escalation returns PERMISSION_DENIED', () => {
  const env: EvalEnv = { nowMs: NOW, auth: ATTACKER_AUTH, dbBefore: {}, dbAfter: {} };
  assert.equal(evaluateRule('create', '/admins/uid_attacker_9', env, { email: 'attacker@example.com' }), 'PERMISSION_DENIED');
});

test('Dirty Dozen #12: Unscoped order or inquiry list scraping by another user returns PERMISSION_DENIED', () => {
  const env: EvalEnv = {
    nowMs: NOW,
    auth: ATTACKER_AUTH,
    dbBefore: {
      '/orders/ord_101': VALID_ORDER,
      '/inquiries/inq_101': {
        senderUid: 'uid_buyer_1',
        senderName: 'Buyer One',
        contactInfo: '+254711000111',
        topic: 'delivery',
        message: 'Checking delivery time',
        status: 'open',
        createdAt: NOW,
        updatedAt: NOW,
      },
    },
    dbAfter: {},
  };
  assert.equal(evaluateRule('list', '/orders/ord_101', env), 'PERMISSION_DENIED');
  assert.equal(evaluateRule('list', '/inquiries/inq_101', env), 'PERMISSION_DENIED');
});
