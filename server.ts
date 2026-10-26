import dotenv from 'dotenv';
import express from 'express';
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import {
  ALIBABA_OEM_SUPPLIER_CATALOG,
  CustomerReview,
  DELIVERY_ZONE_META,
  ELVORA_BRAND_MOTTO,
  HOLIDAY_CAMPAIGNS,
  HolidayCampaignId,
  InquiryFormInput,
  OrderStatus,
  ProductItem,
  ReviewFormInput,
  StoreState,
  SupportInquiry,
  advanceOrderInState,
  computeAiRetailPrice,
  computeExactArrivalInfo,
  createInitialStoreState,
  processVerifiedOrder,
  validateCheckoutInput,
  validateInquiryInput,
  validatePhoneInput,
  validateReviewInput,
} from './src/utils/commerce';
import {
  CustomCurrencyConfig,
  DEFAULT_FX_RATES,
  formatMoneyFromUsd,
  getCurrencyMeta,
  getExchangeRateSummary,
} from './src/utils/currency';
import {
  CustomerAccountPublic,
  LoginCustomerInput,
  RegisterCustomerInput,
  UpdateCustomerProfileInput,
  validateCustomerLogin,
  validateCustomerProfileUpdate,
  validateCustomerRegistration,
} from './src/utils/customerAccount';

dotenv.config();

const PORT = 3000;
const DATA_DIR = path.resolve('.data');
const STATE_FILE = path.join(DATA_DIR, 'elvora-store.json');
const CUSTOMERS_FILE = path.join(DATA_DIR, 'elvora-customers.json');

interface StoredCustomerRecord extends CustomerAccountPublic {
  passwordSalt: string;
  passwordHash: string;
}

interface CustomersStoreFile {
  accounts: StoredCustomerRecord[];
  sessions: Record<string, string>; // token -> accountId
}

function hashPassword(password: string, salt: string): string {
  return scryptSync(password, salt, 64).toString('hex');
}

function verifyPassword(password: string, salt: string, expectedHashHex: string): boolean {
  const actualBuf = scryptSync(password, salt, 64);
  const expectedBuf = Buffer.from(expectedHashHex, 'hex');
  if (actualBuf.length !== expectedBuf.length) return false;
  return timingSafeEqual(actualBuf, expectedBuf);
}

function toPublicCustomer(rec: StoredCustomerRecord): CustomerAccountPublic {
  return {
    id: rec.id,
    fullName: rec.fullName,
    email: rec.email,
    phone: rec.phone,
    countryName: rec.countryName,
    currencyCode: rec.currencyCode,
    defaultAddress: rec.defaultAddress,
    authProvider: rec.authProvider,
    createdAtIso: rec.createdAtIso,
    updatedAtIso: rec.updatedAtIso,
  };
}

function createInitialCustomersStore(): CustomersStoreFile {
  const nowIso = '2026-10-25T12:00:00.000Z';
  const salt1 = 'elvora_seed_salt_ke_01';
  const salt2 = 'elvora_seed_salt_sa_02';
  return {
    accounts: [
      {
        id: 'cust_amara_ke',
        fullName: 'Amara Okafor',
        email: 'amara@elvora.shop',
        phone: '+254 711 234 567',
        countryName: 'Kenya',
        currencyCode: 'KES',
        defaultAddress: '14 Riverside Drive, Westlands, Nairobi',
        authProvider: 'elvora_account',
        passwordSalt: salt1,
        passwordHash: hashPassword('elvora2026', salt1),
        createdAtIso: nowIso,
        updatedAtIso: nowIso,
      },
      {
        id: 'cust_tariq_sa',
        fullName: 'Tariq Al-Mansoor',
        email: 'tariq@elvora.shop',
        phone: '+966 50 412 8890',
        countryName: 'Saudi Arabia',
        currencyCode: 'SAR',
        defaultAddress: '88 King Fahd Road, Olaya District, Riyadh',
        authProvider: 'elvora_account',
        passwordSalt: salt2,
        passwordHash: hashPassword('elvora2026', salt2),
        createdAtIso: nowIso,
        updatedAtIso: nowIso,
      },
    ],
    sessions: {},
  };
}

function loadCustomersStore(): CustomersStoreFile {
  try {
    if (fs.existsSync(CUSTOMERS_FILE)) {
      const raw = fs.readFileSync(CUSTOMERS_FILE, 'utf8');
      const parsed = JSON.parse(raw) as Partial<CustomersStoreFile>;
      if (parsed && Array.isArray(parsed.accounts) && parsed.sessions) {
        return parsed as CustomersStoreFile;
      }
    }
  } catch (err) {
    console.warn('Reinitializing customer store after read error:', err);
  }
  const fresh = createInitialCustomersStore();
  saveCustomersStore(fresh);
  return fresh;
}

function saveCustomersStore(store: CustomersStoreFile): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(CUSTOMERS_FILE, JSON.stringify(store, null, 2), 'utf8');
}

function normalizePhoneDigits(phone: string): string {
  return phone.replace(/[^0-9+]/g, '');
}

let cachedFxRates: {
  rates: Record<string, number>;
  source: 'live_market' | 'verified_baseline';
  updatedAtIso: string;
  fetchedAtMs: number;
} = {
  rates: { ...DEFAULT_FX_RATES },
  source: 'verified_baseline',
  updatedAtIso: new Date().toISOString(),
  fetchedAtMs: 0,
};

async function getLatestFxRates() {
  const now = Date.now();
  // Refresh live market rates every 30 minutes
  if (now - cachedFxRates.fetchedAtMs < 30 * 60 * 1000 && cachedFxRates.fetchedAtMs > 0) {
    return cachedFxRates;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);
    const response = await fetch('https://open.er-api.com/v6/latest/USD', {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = (await response.json()) as {
        result?: string;
        rates?: Record<string, number>;
      };
      if (data && data.rates && typeof data.rates === 'object') {
        const merged: Record<string, number> = { ...DEFAULT_FX_RATES };
        for (const [code, val] of Object.entries(data.rates)) {
          if (typeof val === 'number' && Number.isFinite(val) && val > 0) {
            merged[code.toUpperCase()] = val;
          }
        }
        cachedFxRates = {
          rates: merged,
          source: 'live_market',
          updatedAtIso: new Date().toISOString(),
          fetchedAtMs: now,
        };
        return cachedFxRates;
      }
    }
  } catch {
    // Offline or sandboxed container: gracefully use deterministic baseline rates
  }

  cachedFxRates = {
    ...cachedFxRates,
    fetchedAtMs: now,
  };
  return cachedFxRates;
}

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.trim() === '') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function loadStoreState(): StoreState {
  const freshSeed = createInitialStoreState();
  try {
    if (fs.existsSync(STATE_FILE)) {
      const raw = fs.readFileSync(STATE_FILE, 'utf8');
      const parsed = JSON.parse(raw) as Partial<StoreState>;

      // Upgrade legacy state from earlier versions if missing expanded 14-item catalog, reviews, inquiries, or AI markup fields
      if (
        !parsed ||
        !Array.isArray(parsed.products) ||
        parsed.products.length < 12 ||
        !Array.isArray(parsed.reviews) ||
        !Array.isArray(parsed.inquiries) ||
        !parsed.ownerConfig?.activeHolidayCampaign
      ) {
        const mergedConfig = {
          ...freshSeed.ownerConfig,
          payoutPhone: parsed?.ownerConfig?.payoutPhone ?? freshSeed.ownerConfig.payoutPhone,
        };
        const upgraded: StoreState = {
          ...freshSeed,
          ownerConfig: mergedConfig,
        };
        saveStoreState(upgraded);
        return upgraded;
      }

      return parsed as StoreState;
    }
  } catch (err) {
    console.warn('Reinitializing store state after read error:', err);
  }
  saveStoreState(freshSeed);
  return freshSeed;
}

function saveStoreState(state: StoreState): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf8');
}

async function generateAiOrderPostCaption(params: {
  orderCode: string;
  productTitle: string;
  stockRemaining: number;
  priceUsd: number;
  deliveryFeeUsd: number;
  exactArrivalLabel: string;
  ownerPhone: string;
  totalPaidUsd: number;
}): Promise<string | undefined> {
  const ai = getGeminiClient();
  if (!ai) return undefined;

  try {
    const timeoutPromise = new Promise<null>((resolve) =>
      setTimeout(() => resolve(null), 3500)
    );
    const genPromise = ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `Write a crisp 2-sentence live inventory & payment verification update for ${ELVORA_BRAND_MOTTO}.
Order ${params.orderCode} payment of $${params.totalPaidUsd.toFixed(2)} (incl. $${params.deliveryFeeUsd.toFixed(2)} local delivery) confirmed to owner phone ${params.ownerPhone}, with exact doorstep arrival scheduled for ${params.exactArrivalLabel}.
Announce that ${params.productTitle} ($${params.priceUsd}) now has ${params.stockRemaining} units remaining. Plain text only, no hashtags or emojis.`,
      config: {
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        systemInstruction:
          'You are the autonomous AI Operations Manager for Elvora Goldline Electronics Ltd. ("ELVORA Tech for a Brighter you"). Keep responses under 45 words, factual, sleek, and plain text.',
      },
    });

    const response = await Promise.race([genPromise, timeoutPromise]);
    const text = response?.text?.trim();
    if (text && text.length >= 10 && text.length <= 300) {
      return text;
    }
  } catch (err) {
    console.warn(
      'Gemini caption fallback used:',
      err instanceof Error ? err.message : String(err)
    );
  }
  return undefined;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  let storeState = loadStoreState();
  let customersStore = loadCustomersStore();

  function getAuthenticatedCustomer(req: express.Request): StoredCustomerRecord | null {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
    if (!token) return null;
    const accountId = customersStore.sessions[token];
    if (!accountId) return null;
    return customersStore.accounts.find((a) => a.id === accountId) ?? null;
  }

  app.get('/api/state', (_req, res) => {
    res.json(storeState);
  });

  app.get('/api/fx-rates', async (_req, res) => {
    const fx = await getLatestFxRates();
    res.json({
      base: 'USD',
      rates: fx.rates,
      source: fx.source,
      updatedAtIso: fx.updatedAtIso,
    });
  });

  // Customer Account Registration, Login, Session & Profile Preferences
  app.post('/api/customers/register', (req, res) => {
    const input = (req.body ?? {}) as RegisterCustomerInput;
    const validationErr = validateCustomerRegistration(input);
    if (validationErr) {
      res.status(400).json({ error: validationErr });
      return;
    }

    const cleanEmail = input.email.trim().toLowerCase();
    const cleanPhoneNorm = normalizePhoneDigits(input.phone);

    const duplicate = customersStore.accounts.find(
      (a) =>
        a.email.toLowerCase() === cleanEmail ||
        normalizePhoneDigits(a.phone) === cleanPhoneNorm
    );
    if (duplicate) {
      res.status(409).json({
        error: 'An account with this email or phone number already exists. Please log in instead.',
      });
      return;
    }

    const nowIso = new Date().toISOString();
    const salt = randomBytes(16).toString('hex');
    const passwordHash = hashPassword(input.password, salt);
    const id = `cust_${Date.now().toString(36)}_${randomBytes(3).toString('hex')}`;

    const newRecord: StoredCustomerRecord = {
      id,
      fullName: input.fullName.trim(),
      email: cleanEmail,
      phone: input.phone.trim(),
      countryName: input.countryName.trim(),
      currencyCode: input.currencyCode.trim().toUpperCase(),
      defaultAddress: input.defaultAddress.trim(),
      authProvider: 'elvora_account',
      passwordSalt: salt,
      passwordHash,
      createdAtIso: nowIso,
      updatedAtIso: nowIso,
    };

    const token = `elv_tok_${randomBytes(24).toString('hex')}`;
    customersStore = {
      accounts: [newRecord, ...customersStore.accounts],
      sessions: {
        ...customersStore.sessions,
        [token]: newRecord.id,
      },
    };
    saveCustomersStore(customersStore);

    res.status(201).json({
      token,
      customer: toPublicCustomer(newRecord),
    });
  });

  app.post('/api/customers/login', (req, res) => {
    const input = (req.body ?? {}) as LoginCustomerInput;
    const validationErr = validateCustomerLogin(input);
    if (validationErr) {
      res.status(400).json({ error: validationErr });
      return;
    }

    const rawId = input.identifier.trim();
    const lowerId = rawId.toLowerCase();
    const digitsId = normalizePhoneDigits(rawId);

    const matched = customersStore.accounts.find(
      (a) =>
        a.email.toLowerCase() === lowerId ||
        (digitsId.length >= 7 && normalizePhoneDigits(a.phone) === digitsId)
    );

    if (!matched || !verifyPassword(input.password, matched.passwordSalt, matched.passwordHash)) {
      res.status(401).json({
        error: 'Invalid email/phone or password. Please check your credentials and try again.',
      });
      return;
    }

    const token = `elv_tok_${randomBytes(24).toString('hex')}`;
    customersStore = {
      ...customersStore,
      sessions: {
        ...customersStore.sessions,
        [token]: matched.id,
      },
    };
    saveCustomersStore(customersStore);

    res.json({
      token,
      customer: toPublicCustomer(matched),
    });
  });

  app.get('/api/customers/me', (req, res) => {
    const customer = getAuthenticatedCustomer(req);
    if (!customer) {
      res.status(401).json({ error: 'Not signed in.' });
      return;
    }
    res.json({ customer: toPublicCustomer(customer) });
  });

  app.patch('/api/customers/me', (req, res) => {
    const current = getAuthenticatedCustomer(req);
    if (!current) {
      res.status(401).json({ error: 'Please log in to update your account profile.' });
      return;
    }

    const patch = (req.body ?? {}) as UpdateCustomerProfileInput;
    const validationErr = validateCustomerProfileUpdate(patch);
    if (validationErr) {
      res.status(400).json({ error: validationErr });
      return;
    }

    const updatedRecord: StoredCustomerRecord = {
      ...current,
      fullName: patch.fullName.trim(),
      phone: patch.phone.trim(),
      countryName: patch.countryName.trim(),
      currencyCode: patch.currencyCode.trim().toUpperCase(),
      defaultAddress: patch.defaultAddress.trim(),
      updatedAtIso: new Date().toISOString(),
    };

    customersStore = {
      ...customersStore,
      accounts: customersStore.accounts.map((a) =>
        a.id === current.id ? updatedRecord : a
      ),
    };
    saveCustomersStore(customersStore);

    res.json({ customer: toPublicCustomer(updatedRecord) });
  });

  app.post('/api/customers/logout', (req, res) => {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
    if (token && customersStore.sessions[token]) {
      const nextSessions = { ...customersStore.sessions };
      delete nextSessions[token];
      customersStore = {
        ...customersStore,
        sessions: nextSessions,
      };
      saveCustomersStore(customersStore);
    }
    res.json({ ok: true });
  });

  app.post('/api/orders', async (req, res) => {
    try {
      const { checkout, cart } = req.body ?? {};
      const authedCustomer = getAuthenticatedCustomer(req);
      const enrichedCheckout = {
        ...(checkout ?? {
          customerName: '',
          customerPhone: '',
          deliveryAddress: '',
          deliveryZone: 'express_city',
          paymentMethod: 'mobile_money',
          paymentRef: '',
        }),
        customerAccountId:
          authedCustomer?.id ?? checkout?.customerAccountId ?? undefined,
      };
      const validationErrors = validateCheckoutInput(
        enrichedCheckout,
        Array.isArray(cart) ? cart : []
      );

      if (Object.keys(validationErrors).length > 0) {
        res
          .status(400)
          .json({ error: Object.values(validationErrors)[0], validationErrors });
        return;
      }

      const firstCart = cart[0];
      const targetProd = storeState.products.find((p) => p.id === firstCart?.productId);
      const exactArrival = computeExactArrivalInfo(checkout.deliveryZone);
      let customAiCaption: string | undefined;

      if (targetProd && storeState.ownerConfig.autoPostProductStock) {
        const projectedRemaining = Math.max(
          0,
          targetProd.stockRemaining - firstCart.quantity
        );
        customAiCaption = await generateAiOrderPostCaption({
          orderCode: 'VERIFIED',
          productTitle: targetProd.title,
          stockRemaining: projectedRemaining,
          priceUsd: targetProd.price,
          deliveryFeeUsd: targetProd.localDeliveryFeeUsd,
          exactArrivalLabel: exactArrival.exactTimeLabel,
          ownerPhone: storeState.ownerConfig.payoutPhone,
          totalPaidUsd:
            targetProd.price * firstCart.quantity + targetProd.localDeliveryFeeUsd,
        });
      }

      const result = processVerifiedOrder(storeState, enrichedCheckout, cart, {
        customAiCaption,
      });

      storeState = result.nextState;
      saveStoreState(storeState);

      res.status(201).json({
        order: result.order,
        phoneAlert: result.phoneAlert,
        oemOrdersCreated: result.oemOrdersCreated,
        aiPostsCreated: result.aiPostsCreated,
        state: storeState,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to process order.';
      res.status(400).json({ error: message });
    }
  });

  app.patch('/api/orders/:orderId/status', (req, res) => {
    const { orderId } = req.params;
    const { status } = req.body as { status?: OrderStatus };
    storeState = advanceOrderInState(storeState, orderId, status);
    saveStoreState(storeState);
    const updated = storeState.orders.find(
      (o) => o.id === orderId || o.orderCode === orderId
    );
    if (!updated) {
      res.status(404).json({ error: 'Order not found.' });
      return;
    }
    res.json({ order: updated, state: storeState });
  });

  app.patch('/api/products/:productId', (req, res) => {
    const { productId } = req.params;
    const { price, stockRemaining, postUpdate } = req.body as {
      price?: number;
      stockRemaining?: number;
      postUpdate?: boolean;
    };

    const existing = storeState.products.find((p) => p.id === productId);
    if (!existing) {
      res.status(404).json({ error: 'Product not found.' });
      return;
    }

    const nextPrice =
      typeof price === 'number' && price > 0 && price <= 100000
        ? Number(price.toFixed(2))
        : existing.price;
    const nextStock =
      typeof stockRemaining === 'number' &&
      Number.isInteger(stockRemaining) &&
      stockRemaining >= 0 &&
      stockRemaining <= 100000
        ? stockRemaining
        : existing.stockRemaining;

    const nowIso = new Date().toISOString();
    const updatedProduct: ProductItem = {
      ...existing,
      price: nextPrice,
      stockRemaining: nextStock,
      updatedAtIso: nowIso,
    };

    const nextProducts = storeState.products.map((p) =>
      p.id === productId ? updatedProduct : p
    );

    const nextPosts = [...storeState.aiPosts];
    if (postUpdate) {
      nextPosts.unshift({
        id: `post_manual_${Date.now()}`,
        productId: updatedProduct.id,
        productTitle: updatedProduct.title,
        category: updatedProduct.category,
        imageKey: updatedProduct.imageKey,
        priceUsd: updatedProduct.price,
        stockRemaining: updatedProduct.stockRemaining,
        oemSupplier: updatedProduct.oemSupplier,
        logoImprint: ELVORA_BRAND_MOTTO,
        ownerPhoneConfirmed: storeState.ownerConfig.payoutPhone,
        caption: `Live inventory update from Elvora AI: ${updatedProduct.title} (${ELVORA_BRAND_MOTTO}) available at $${updatedProduct.price} (+$${updatedProduct.localDeliveryFeeUsd} local delivery) — ${updatedProduct.stockRemaining} units remaining.`,
        createdAtIso: nowIso,
      });
    }

    storeState = {
      ...storeState,
      products: nextProducts,
      aiPosts: nextPosts,
    };
    saveStoreState(storeState);
    res.json({ product: updatedProduct, state: storeState });
  });

  app.patch('/api/settings', (req, res) => {
    const {
      payoutPhone,
      merchantName,
      supportEmail,
      hubAddress,
      aiMarkupMultiplier,
      activeHolidayCampaign,
      preferAlibabaFreeShipping,
      autoOrderAlibabaOem,
      autoPostProductStock,
      adsEnabled,
      adScriptSnippet,
      adScriptEnabled,
      advertisements,
    } = req.body ?? {};

    if (typeof payoutPhone === 'string') {
      const phoneErr = validatePhoneInput(payoutPhone);
      if (phoneErr) {
        res.status(400).json({ error: phoneErr });
        return;
      }
    }

    if (
      typeof merchantName === 'string' &&
      (merchantName.trim().length < 2 || merchantName.trim().length > 80)
    ) {
      res
        .status(400)
        .json({ error: 'Business name must be between 2 and 80 characters.' });
      return;
    }

    const validCampaigns: HolidayCampaignId[] = [
      'black_friday',
      'cyber_monday',
      'festive_gold',
      'standard',
    ];

    const nextMultiplier =
      typeof aiMarkupMultiplier === 'number' && !Number.isNaN(aiMarkupMultiplier)
        ? Math.min(2.0, Math.max(1.75, Number(aiMarkupMultiplier.toFixed(2))))
        : storeState.ownerConfig.aiMarkupMultiplier;

    const nextAds = Array.isArray(advertisements)
      ? advertisements
      : storeState.ownerConfig.advertisements ?? storeState.advertisements;

    storeState = {
      ...storeState,
      advertisements: nextAds,
      ownerConfig: {
        ...storeState.ownerConfig,
        payoutPhone:
          typeof payoutPhone === 'string'
            ? payoutPhone.trim()
            : storeState.ownerConfig.payoutPhone,
        merchantName:
          typeof merchantName === 'string'
            ? merchantName.trim()
            : storeState.ownerConfig.merchantName,
        supportEmail:
          typeof supportEmail === 'string' && supportEmail.trim().length >= 5
            ? supportEmail.trim().slice(0, 120)
            : storeState.ownerConfig.supportEmail,
        hubAddress:
          typeof hubAddress === 'string' && hubAddress.trim().length >= 5
            ? hubAddress.trim().slice(0, 200)
            : storeState.ownerConfig.hubAddress,
        aiMarkupMultiplier: nextMultiplier,
        activeHolidayCampaign: validCampaigns.includes(activeHolidayCampaign)
          ? activeHolidayCampaign
          : storeState.ownerConfig.activeHolidayCampaign,
        preferAlibabaFreeShipping:
          typeof preferAlibabaFreeShipping === 'boolean'
            ? preferAlibabaFreeShipping
            : storeState.ownerConfig.preferAlibabaFreeShipping,
        autoOrderAlibabaOem:
          typeof autoOrderAlibabaOem === 'boolean'
            ? autoOrderAlibabaOem
            : storeState.ownerConfig.autoOrderAlibabaOem,
        autoPostProductStock:
          typeof autoPostProductStock === 'boolean'
            ? autoPostProductStock
            : storeState.ownerConfig.autoPostProductStock,
        adsEnabled:
          typeof adsEnabled === 'boolean'
            ? adsEnabled
            : storeState.ownerConfig.adsEnabled ?? true,
        adScriptSnippet:
          typeof adScriptSnippet === 'string'
            ? adScriptSnippet.slice(0, 5000)
            : storeState.ownerConfig.adScriptSnippet ?? '',
        adScriptEnabled:
          typeof adScriptEnabled === 'boolean'
            ? adScriptEnabled
            : storeState.ownerConfig.adScriptEnabled ?? false,
        advertisements: nextAds,
        updatedAtIso: new Date().toISOString(),
      },
    };
    saveStoreState(storeState);
    res.json({ ownerConfig: storeState.ownerConfig, state: storeState });
  });

  // Track ad click / impression
  app.post('/api/ads/:adId/click', (req, res) => {
    const { adId } = req.params;
    const currentAds = storeState.ownerConfig.advertisements ?? storeState.advertisements ?? [];
    const updatedAds = currentAds.map((ad) => {
      if (ad.id === adId) {
        return {
          ...ad,
          clicks: (ad.clicks ?? 0) + 1,
          impressions: (ad.impressions ?? 0) + 1,
        };
      }
      return ad;
    });

    storeState = {
      ...storeState,
      advertisements: updatedAds,
      ownerConfig: {
        ...storeState.ownerConfig,
        advertisements: updatedAds,
      },
    };
    saveStoreState(storeState);
    res.json({ state: storeState });
  });

  // Verified Buyer Reviews endpoint
  app.post('/api/reviews', (req, res) => {
    const input = (req.body ?? {}) as ReviewFormInput;
    const err = validateReviewInput(input);
    if (err) {
      res.status(400).json({ error: err });
      return;
    }

    const product = storeState.products.find((p) => p.id === input.productId);
    if (!product) {
      res.status(404).json({ error: 'Selected electronics item was not found.' });
      return;
    }

    const nowIso = new Date().toISOString();
    const cleanedOrderCode = input.verifiedOrderCode?.trim().toUpperCase();
    const matchedOrder = cleanedOrderCode
      ? storeState.orders.find((o) => o.orderCode.toUpperCase() === cleanedOrderCode)
      : undefined;

    const newReview: CustomerReview = {
      id: `rev_${Date.now().toString(36)}`,
      productId: product.id,
      productTitle: product.title,
      authorName: input.authorName.trim(),
      rating: Math.min(5, Math.max(1, Math.round(input.rating))),
      comment: input.comment.trim(),
      verifiedOrderCode: matchedOrder
        ? matchedOrder.orderCode
        : cleanedOrderCode && /^ELV-[0-9A-Z]+$/.test(cleanedOrderCode)
          ? cleanedOrderCode
          : undefined,
      arrivalFeedback: matchedOrder
        ? `Verified arrival: ${matchedOrder.etaLabel}`
        : 'Verified Elvora Doorstep Delivery',
      createdAtIso: nowIso,
    };

    const nextProducts = storeState.products.map((p) => {
      if (p.id !== product.id) return p;
      const prevCount = p.reviewCount ?? 1;
      const prevAvg = p.ratingAvg ?? 5.0;
      const nextCount = prevCount + 1;
      const nextAvg = Number(
        ((prevAvg * prevCount + newReview.rating) / nextCount).toFixed(1)
      );
      return {
        ...p,
        reviewCount: nextCount,
        ratingAvg: nextAvg,
        updatedAtIso: nowIso,
      };
    });

    storeState = {
      ...storeState,
      products: nextProducts,
      reviews: [newReview, ...storeState.reviews],
    };
    saveStoreState(storeState);

    res.status(201).json({ review: newReview, state: storeState });
  });

  // Contact Us Support Inquiry endpoints
  app.post('/api/inquiries', (req, res) => {
    const input = (req.body ?? {}) as InquiryFormInput;
    const err = validateInquiryInput(input);
    if (err) {
      res.status(400).json({ error: err });
      return;
    }

    const validTopics = ['delivery', 'combos', 'payment', 'warranty'] as const;
    const topic = validTopics.includes(input.topic) ? input.topic : 'delivery';
    const nowIso = new Date().toISOString();

    const inquiry: SupportInquiry = {
      id: `inq_${Date.now().toString(36)}`,
      senderName: input.senderName.trim(),
      contactInfo: input.contactInfo.trim(),
      topic,
      orderCode: input.orderCode?.trim()
        ? input.orderCode.trim().toUpperCase().slice(0, 24)
        : undefined,
      message: input.message.trim(),
      status: 'open',
      createdAtIso: nowIso,
    };

    storeState = {
      ...storeState,
      inquiries: [inquiry, ...storeState.inquiries],
    };
    saveStoreState(storeState);

    res.status(201).json({ inquiry, state: storeState });
  });

  app.patch('/api/inquiries/:inquiryId', (req, res) => {
    const { inquiryId } = req.params;
    const { status } = req.body as { status?: 'open' | 'resolved' };
    const nextStatus = status === 'open' ? 'open' : 'resolved';

    const exists = storeState.inquiries.some((i) => i.id === inquiryId);
    if (!exists) {
      res.status(404).json({ error: 'Support inquiry not found.' });
      return;
    }

    storeState = {
      ...storeState,
      inquiries: storeState.inquiries.map((inq) =>
        inq.id === inquiryId ? { ...inq, status: nextStatus } : inq
      ),
    };
    saveStoreState(storeState);
    res.json({ state: storeState });
  });

  // AI Alibaba Free-Shipping Search & Transport Cost Optimizer
  app.get('/api/ai/alibaba-free-shipping', (_req, res) => {
    const freeFreightSuppliers = ALIBABA_OEM_SUPPLIER_CATALOG.filter(
      (item) => item.alibabaFreeShipping
    ).map((item) => {
      const pricing = computeAiRetailPrice(
        item.oemCost,
        storeState.ownerConfig.aiMarkupMultiplier,
        12
      );
      return {
        ...item,
        aiComputedPrice: pricing.retailPrice,
        aiCompareAtPrice: pricing.originalPrice,
        unitMarginUsd: pricing.grossMarginUsd,
        inboundFreightSavedUsd: item.alibabaStandardFreightUsd,
      };
    });

    const totalSavedSoFar = storeState.oemOrders.reduce(
      (sum, o) => sum + (o.freightSavedUsd ?? 0),
      0
    );

    res.json({
      freeFreightSuppliers,
      totalSavedSoFar,
      multiplier: storeState.ownerConfig.aiMarkupMultiplier,
    });
  });

  // AI Alibaba OEM Sourcing with automatic 1.75x-2.0x retail markup & free-shipping preference
  app.post('/api/ai/source-product', async (req, res) => {
    const { templateId, batchUnits, freeShippingOnly } = req.body as {
      templateId?: string;
      batchUnits?: number;
      freeShippingOnly?: boolean;
    };

    const candidatePool =
      freeShippingOnly || storeState.ownerConfig.preferAlibabaFreeShipping
        ? ALIBABA_OEM_SUPPLIER_CATALOG.filter((t) => t.alibabaFreeShipping)
        : ALIBABA_OEM_SUPPLIER_CATALOG;

    const template =
      ALIBABA_OEM_SUPPLIER_CATALOG.find((t) => t.templateId === templateId) ??
      candidatePool[0] ??
      ALIBABA_OEM_SUPPLIER_CATALOG[0];

    const units =
      typeof batchUnits === 'number' && batchUnits >= 5 && batchUnits <= 500
        ? Math.floor(batchUnits)
        : template.initialBatchUnits;

    // Enforce AI Automatic Retail Markup (e.g., $400 Alibaba -> $700-$800 retail)
    const aiPricing = computeAiRetailPrice(
      template.oemCost,
      storeState.ownerConfig.aiMarkupMultiplier,
      12
    );
    const retailPrice = aiPricing.retailPrice;
    const inboundShippingUsd = template.alibabaFreeShipping
      ? 0
      : template.alibabaStandardFreightUsd;
    const freightSavedUsd = template.alibabaFreeShipping
      ? template.alibabaStandardFreightUsd
      : 0;

    let refinedSpecs = template.specs;
    let launchCaption = `AI sourced ${units} units of ${template.title} from ${template.oemSupplier} (${template.alibabaFreeShipping ? `$0 Free Alibaba Shipping — saved $${freightSavedUsd} inbound freight` : `$${inboundShippingUsd} freight`}). Auto-priced at $${retailPrice} (+$${template.localDeliveryFeeUsd} local delivery) — ${units} units remaining.`;

    const ai = getGeminiClient();
    if (ai) {
      try {
        const timeoutPromise = new Promise<null>((resolve) =>
          setTimeout(() => resolve(null), 4000)
        );
        const response = await Promise.race([
          ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: `Prepare an Alibaba OEM product launch for ${storeState.ownerConfig.merchantName}:
Product: ${template.title}
Category: ${template.category}
Supplier: ${template.oemSupplier}
Alibaba OEM Unit Cost: $${template.oemCost}
AI Marked-Up Store Price: $${retailPrice} (Customer Local Delivery Fee: +$${template.localDeliveryFeeUsd})
Alibaba Inbound Shipping: ${template.alibabaFreeShipping ? `$0 Free Factory Shipping (Saved $${freightSavedUsd})` : `$${inboundShippingUsd}`}
Units ordered: ${units}
Custom Logo Imprint: "${ELVORA_BRAND_MOTTO}"
Return concise technical specs (max 140 chars) and a sleek 2-sentence product drop announcement mentioning $${retailPrice} price, +$${template.localDeliveryFeeUsd} local delivery, and exact ${units} units remaining.`,
            config: {
              thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  specs: {
                    type: Type.STRING,
                    description: 'Concise technical specs separated by middle dots.',
                  },
                  caption: {
                    type: Type.STRING,
                    description: 'Sleek 2-sentence launch announcement stating units remaining.',
                  },
                },
                required: ['specs', 'caption'],
              },
            },
          }),
          timeoutPromise,
        ]);
        if (response?.text) {
          const parsed = JSON.parse(response.text.trim()) as {
            specs?: string;
            caption?: string;
          };
          if (parsed.specs && parsed.specs.length >= 10 && parsed.specs.length <= 300) {
            refinedSpecs = parsed.specs;
          }
          if (
            parsed.caption &&
            parsed.caption.length >= 10 &&
            parsed.caption.length <= 300
          ) {
            launchCaption = parsed.caption;
          }
        }
      } catch (err) {
        console.warn(
          'Gemini OEM launch fallback used:',
          err instanceof Error ? err.message : String(err)
        );
      }
    }

    const nowIso = new Date().toISOString();
    const existingIdx = storeState.products.findIndex((p) => p.title === template.title);
    let targetProduct: ProductItem;

    const nextProducts = [...storeState.products];
    if (existingIdx >= 0) {
      targetProduct = {
        ...nextProducts[existingIdx],
        price: retailPrice,
        originalPrice: aiPricing.originalPrice,
        discountPercent: aiPricing.appliedDiscountPercent,
        alibabaFreeShipping: template.alibabaFreeShipping,
        localDeliveryFeeUsd: template.localDeliveryFeeUsd,
        stockRemaining: nextProducts[existingIdx].stockRemaining + units,
        specs: refinedSpecs,
        updatedAtIso: nowIso,
      };
      nextProducts[existingIdx] = targetProduct;
    } else {
      targetProduct = {
        id: `prod_${Date.now().toString(36)}`,
        title: template.title,
        category: template.category,
        price: retailPrice,
        originalPrice: aiPricing.originalPrice,
        discountPercent: aiPricing.appliedDiscountPercent,
        oemCost: template.oemCost,
        alibabaFreeShipping: template.alibabaFreeShipping,
        localDeliveryFeeUsd: template.localDeliveryFeeUsd,
        isCombo: template.isCombo,
        comboItems: template.comboItems,
        holidayTag: 'AI New Drop',
        ratingAvg: 4.9,
        reviewCount: 6,
        stockRemaining: units,
        imageKey: template.imageKey,
        specs: refinedSpecs,
        oemSupplier: template.oemSupplier,
        oemOrigin: template.oemOrigin,
        logoImprint: ELVORA_BRAND_MOTTO,
        isPublished: true,
        updatedAtIso: nowIso,
      };
      nextProducts.unshift(targetProduct);
    }

    const oemOrderRef = `ALI-OEM-${Math.floor(1000 + (Date.now() % 9000))}`;
    const newOemOrder = {
      id: `oem_${Date.now().toString(36)}`,
      oemOrderRef,
      supplierName: template.oemSupplier,
      productTitle: targetProduct.title,
      imageKey: targetProduct.imageKey,
      unitsOrdered: units,
      unitCostUsd: template.oemCost,
      alibabaShippingCostUsd: inboundShippingUsd,
      freightSavedUsd,
      aiRetailUnitPriceUsd: retailPrice,
      totalCostUsd: Number((units * template.oemCost + inboundShippingUsd).toFixed(2)),
      logoImprint: ELVORA_BRAND_MOTTO,
      triggerReason: 'AI New OEM Catalog Launch' as const,
      status: 'Submitted to Alibaba Factory' as const,
      createdAtIso: nowIso,
    };

    const newPost = {
      id: `post_${Date.now().toString(36)}`,
      productId: targetProduct.id,
      productTitle: targetProduct.title,
      category: targetProduct.category,
      imageKey: targetProduct.imageKey,
      priceUsd: targetProduct.price,
      stockRemaining: targetProduct.stockRemaining,
      oemSupplier: targetProduct.oemSupplier,
      logoImprint: ELVORA_BRAND_MOTTO,
      ownerPhoneConfirmed: storeState.ownerConfig.payoutPhone,
      caption: launchCaption,
      createdAtIso: nowIso,
    };

    storeState = {
      ...storeState,
      products: nextProducts,
      oemOrders: [newOemOrder, ...storeState.oemOrders],
      aiPosts: [newPost, ...storeState.aiPosts],
    };
    saveStoreState(storeState);

    res.status(201).json({
      product: targetProduct,
      oemOrder: newOemOrder,
      aiPost: newPost,
      state: storeState,
    });
  });

  // Owner Mobile AI Assistant (Pricing Markup, Alibaba Free-Shipping Search, Restocking, Stock Bulletins)
  app.post('/api/ai/assistant', async (req, res) => {
    const { prompt } = req.body as { prompt?: string };
    if (!prompt || !prompt.trim()) {
      res.status(400).json({ error: 'Enter an instruction for the Elvora AI Manager.' });
      return;
    }

    const userPrompt = prompt.trim();
    const totalRevenue = storeState.orders.reduce((sum, o) => sum + o.totalUsd, 0);
    const totalFreightSaved = storeState.oemOrders.reduce(
      (sum, o) => sum + (o.freightSavedUsd ?? 0),
      0
    );
    const lowStockItems = storeState.products.filter((p) => p.stockRemaining <= 12);
    const freeFreightCatalog = ALIBABA_OEM_SUPPLIER_CATALOG.filter(
      (t) => t.alibabaFreeShipping
    );

    let replyText = '';
    let executedAction:
      | 'none'
      | 'restock_low'
      | 'post_all_stock'
      | 'find_free_shipping'
      | 'reprice_catalog' = 'none';

    const ai = getGeminiClient();
    if (ai) {
      try {
        const inventorySummary = storeState.products
          .slice(0, 8)
          .map(
            (p) =>
              `${p.title} (Alibaba $${p.oemCost} -> Store $${p.price} + $${p.localDeliveryFeeUsd} delivery, ${p.stockRemaining} left)`
          )
          .join('; ');

        const freeSuppliersSummary = freeFreightCatalog
          .map(
            (t) =>
              `${t.title} from ${t.oemSupplier} ($${t.oemCost} OEM cost, $0 Free Alibaba Freight saving $${t.alibabaStandardFreightUsd})`
          )
          .join('; ');

        const timeoutPromise = new Promise<null>((resolve) =>
          setTimeout(() => resolve(null), 4000)
        );
        const response = await Promise.race([
          ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: `Store Owner Instruction (sent from phone): "${userPrompt}"
Current Store Snapshot (${storeState.ownerConfig.merchantName}):
- Owner Payout Phone: ${storeState.ownerConfig.payoutPhone}
- Verified Revenue Paid to Owner: $${totalRevenue.toFixed(2)} across ${storeState.orders.length} orders
- Inbound Alibaba Transport Saved via Free-Shipping Suppliers: $${totalFreightSaved.toFixed(0)}
- AI Retail Markup Multiplier: ${storeState.ownerConfig.aiMarkupMultiplier}x (e.g., $400 Alibaba -> $${Math.round(400 * storeState.ownerConfig.aiMarkupMultiplier)} Store + customer delivery fee)
- Active Holiday Campaign: ${HOLIDAY_CAMPAIGNS[storeState.ownerConfig.activeHolidayCampaign].title} (Code ${HOLIDAY_CAMPAIGNS[storeState.ownerConfig.activeHolidayCampaign].promoCode})
- Verified $0 Free-Delivery Alibaba Suppliers: ${freeSuppliersSummary}
- Inventory Sample: ${inventorySummary}

Choose one action:
- "find_free_shipping" if the owner asks to search Alibaba for free delivery / zero shipping suppliers to cut transport costs.
- "reprice_catalog" if the owner asks to re-verify or apply automatic AI price markup across products.
- "restock_low" if the owner asks to restock or reorder low stock items from Alibaba free-shipping factories.
- "post_all_stock" if the owner asks to post pictures/remaining stock updates.
- "none" for general reports.
Provide a concise operational response tailored for reading on a phone screen (max 75 words).`,
            config: {
              thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  reply: {
                    type: Type.STRING,
                    description: 'Direct operational response to the store owner.',
                  },
                  action: {
                    type: Type.STRING,
                    description:
                      'One of: none, restock_low, post_all_stock, find_free_shipping, reprice_catalog',
                  },
                },
                required: ['reply', 'action'],
              },
            },
          }),
          timeoutPromise,
        ]);

        if (response?.text) {
          const parsed = JSON.parse(response.text.trim()) as {
            reply?: string;
            action?: string;
          };
          replyText = parsed.reply ?? '';
          if (
            parsed.action === 'restock_low' ||
            parsed.action === 'post_all_stock' ||
            parsed.action === 'find_free_shipping' ||
            parsed.action === 'reprice_catalog'
          ) {
            executedAction = parsed.action;
          }
        }
      } catch (err) {
        console.warn(
          'Gemini assistant fallback:',
          err instanceof Error ? err.message : String(err)
        );
      }
    }

    const lower = userPrompt.toLowerCase();
    if (executedAction === 'none') {
      if (lower.includes('free') && (lower.includes('ship') || lower.includes('delivery') || lower.includes('transport') || lower.includes('alibaba'))) {
        executedAction = 'find_free_shipping';
      } else if (lower.includes('markup') || lower.includes('price') || lower.includes('700')) {
        executedAction = 'reprice_catalog';
      } else if (lower.includes('restock') || lower.includes('reorder')) {
        executedAction = 'restock_low';
      } else if (
        lower.includes('post') &&
        (lower.includes('stock') || lower.includes('pic') || lower.includes('remaining'))
      ) {
        executedAction = 'post_all_stock';
      }
    }

    const nowIso = new Date().toISOString();

    if (executedAction === 'find_free_shipping') {
      const topDeals = freeFreightCatalog
        .slice(0, 4)
        .map(
          (t) =>
            `${t.title} ($${t.oemCost} OEM → $${computeAiRetailPrice(t.oemCost, storeState.ownerConfig.aiMarkupMultiplier).retailPrice} Store, saves $${t.alibabaStandardFreightUsd} freight)`
        )
        .join('; ');
      if (!replyText) {
        replyText = `Found ${freeFreightCatalog.length} verified Alibaba OEM suppliers offering $0 Free Factory Delivery to cut our inbound transport costs (total saved so far: $${totalFreightSaved}): ${topDeals}.`;
      }
    } else if (executedAction === 'reprice_catalog') {
      const mult = storeState.ownerConfig.aiMarkupMultiplier;
      const repricedProducts = storeState.products.map((p) => {
        const calc = computeAiRetailPrice(p.oemCost, mult, p.discountPercent ?? 0);
        return {
          ...p,
          price: calc.retailPrice,
          originalPrice: calc.originalPrice,
          updatedAtIso: nowIso,
        };
      });
      storeState = {
        ...storeState,
        products: repricedProducts,
      };
      saveStoreState(storeState);
      if (!replyText) {
        const sample400 = computeAiRetailPrice(400, mult).retailPrice;
        replyText = `AI repriced all ${repricedProducts.length} electronics items at ${mult}x above Alibaba OEM cost (a $400 Alibaba earpod now retails at $${sample400} + local customer delivery fee).`;
      }
    } else if (executedAction === 'restock_low') {
      const targetList =
        lowStockItems.length > 0 ? lowStockItems.slice(0, 3) : [storeState.products[0]];
      const updatedProducts = storeState.products.map((p) => {
        if (targetList.some((t) => t.id === p.id)) {
          return { ...p, stockRemaining: p.stockRemaining + 15, updatedAtIso: nowIso };
        }
        return p;
      });
      const newOem = targetList.map((t, i) => ({
        id: `oem_ai_${Date.now()}_${i}`,
        oemOrderRef: `ALI-OEM-${Math.floor(2000 + (Date.now() % 7000))}-${i + 1}`,
        supplierName: t.oemSupplier,
        productTitle: t.title,
        imageKey: t.imageKey,
        unitsOrdered: 15,
        unitCostUsd: t.oemCost,
        alibabaShippingCostUsd: 0,
        freightSavedUsd: 90,
        aiRetailUnitPriceUsd: t.price,
        totalCostUsd: 15 * t.oemCost,
        logoImprint: ELVORA_BRAND_MOTTO,
        triggerReason: 'AI Low-Stock Auto-Replenish' as const,
        status: 'Submitted to Alibaba Factory' as const,
        createdAtIso: nowIso,
      }));
      const newPosts = targetList.map((t, i) => {
        const updatedP = updatedProducts.find((up) => up.id === t.id)!;
        return {
          id: `post_ai_${Date.now()}_${i}`,
          productId: updatedP.id,
          productTitle: updatedP.title,
          category: updatedP.category,
          imageKey: updatedP.imageKey,
          priceUsd: updatedP.price,
          stockRemaining: updatedP.stockRemaining,
          oemSupplier: updatedP.oemSupplier,
          logoImprint: ELVORA_BRAND_MOTTO,
          ownerPhoneConfirmed: storeState.ownerConfig.payoutPhone,
          caption: `AI placed $0 Free-Freight Alibaba OEM batch (+15 units stamped "${ELVORA_BRAND_MOTTO}") for ${updatedP.title}. Live stock: ${updatedP.stockRemaining} remaining at $${updatedP.price} (+$${updatedP.localDeliveryFeeUsd} delivery).`,
          createdAtIso: nowIso,
        };
      });

      storeState = {
        ...storeState,
        products: updatedProducts,
        oemOrders: [...newOem, ...storeState.oemOrders],
        aiPosts: [...newPosts, ...storeState.aiPosts],
      };
      saveStoreState(storeState);

      if (!replyText) {
        replyText = `Ordered +15 units each via $0 Free Alibaba Shipping for ${targetList.map((t) => t.title).join(', ')} (saving $${targetList.length * 90} inbound transport) and posted updated remaining stock cards.`;
      }
    } else if (executedAction === 'post_all_stock') {
      const leadProduct = storeState.products[0];
      const newPost = {
        id: `post_ai_${Date.now()}`,
        productId: leadProduct.id,
        productTitle: leadProduct.title,
        category: leadProduct.category,
        imageKey: leadProduct.imageKey,
        priceUsd: leadProduct.price,
        stockRemaining: leadProduct.stockRemaining,
        oemSupplier: leadProduct.oemSupplier,
        logoImprint: ELVORA_BRAND_MOTTO,
        ownerPhoneConfirmed: storeState.ownerConfig.payoutPhone,
        caption: `Fresh stock bulletin: ${leadProduct.title} (${ELVORA_BRAND_MOTTO}) — $${leadProduct.price} (+$${leadProduct.localDeliveryFeeUsd} local delivery) · ${leadProduct.stockRemaining} units remaining.`,
        createdAtIso: nowIso,
      };
      storeState = {
        ...storeState,
        aiPosts: [newPost, ...storeState.aiPosts],
      };
      saveStoreState(storeState);
      if (!replyText) {
        replyText = `Published live product card for ${leadProduct.title} showing studio photo, $${leadProduct.price} price, +$${leadProduct.localDeliveryFeeUsd} delivery, and ${leadProduct.stockRemaining} units remaining.`;
      }
    } else if (!replyText) {
      replyText = `${storeState.ownerConfig.merchantName}: $${totalRevenue.toFixed(2)} confirmed to ${storeState.ownerConfig.payoutPhone} across ${storeState.orders.length} orders, $${totalFreightSaved} saved via Free Alibaba Shipping, and AI retail markup active at ${storeState.ownerConfig.aiMarkupMultiplier}x ($400 OEM -> $${Math.round(400 * storeState.ownerConfig.aiMarkupMultiplier)} Store).`;
    }

    res.json({
      reply: replyText,
      executedAction,
      state: storeState,
    });
  });

  // Customer Shopping Concierge AI (Multi-Currency + Exact Arrival Clock Time + Delivery Costs + Combos + Holiday Promos)
  app.post('/api/ai/customer-chat', async (req, res) => {
    const { message, history, currencyCode, customCurrency } = req.body as {
      message?: string;
      history?: { role: string; text: string }[];
      currencyCode?: string;
      customCurrency?: CustomCurrencyConfig | null;
    };

    if (!message || !message.trim()) {
      res.status(400).json({ error: 'Please type a question so I can help.' });
      return;
    }

    const cleanMsg = message.trim();
    const activeCode = (currencyCode || 'USD').trim().toUpperCase();
    const fxSnapshot = await getLatestFxRates();
    const fmt = (usd: number) =>
      formatMoneyFromUsd(usd, activeCode, fxSnapshot.rates, customCurrency);
    const currencyMeta = getCurrencyMeta(activeCode, customCurrency);
    const rateNote = getExchangeRateSummary(activeCode, fxSnapshot.rates, customCurrency);

    const now = new Date();
    const expressEta = computeExactArrivalInfo('express_city', now);
    const metroEta = computeExactArrivalInfo('standard_metro', now);
    const hubEta = computeExactArrivalInfo('hub_pickup', now);
    const activeHoliday = HOLIDAY_CAMPAIGNS[storeState.ownerConfig.activeHolidayCampaign];

    const publishedProducts = storeState.products.filter((p) => p.isPublished);
    const catalogContext = publishedProducts
      .map(
        (p) =>
          `- ${p.title} [${p.category}${p.isCombo ? ', COMBO BUNDLE' : ''}]: ${fmt(p.price)}${p.originalPrice ? ` (was ${fmt(p.originalPrice)}, save ${p.discountPercent}%)` : ''} + ${fmt(p.localDeliveryFeeUsd)} local delivery, ${p.stockRemaining} units remaining.`
      )
      .join('\n');

    const matchedCode = cleanMsg.toUpperCase().match(/ELV-[0-9A-Z]+/)?.[0];
    const matchedOrder = matchedCode
      ? storeState.orders.find((o) => o.orderCode.toUpperCase() === matchedCode)
      : undefined;

    let reply = '';
    let suggestedAction:
      | 'open_bag'
      | 'track_order'
      | 'browse_catalog'
      | 'open_reviews'
      | 'open_contact'
      | 'open_account'
      | 'none' = 'none';

    const ai = getGeminiClient();
    if (ai) {
      try {
        const recentHistory = Array.isArray(history)
          ? history
              .map((h) => `${h.role === 'user' ? 'Customer' : 'Concierge'}: ${h.text}`)
              .join('\n')
          : '';

        const timeoutPromise = new Promise<null>((resolve) =>
          setTimeout(() => resolve(null), 4000)
        );
        const response = await Promise.race([
          ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: `Recent Conversation:\n${recentHistory}\n\nCustomer Question: "${cleanMsg}"\n\nLive Store Facts (${storeState.ownerConfig.merchantName}):
- Brand: ELVORA ("${ELVORA_BRAND_MOTTO}") — Official Business: ${storeState.ownerConfig.merchantName}, located at ${storeState.ownerConfig.hubAddress}, phone ${storeState.ownerConfig.payoutPhone}, email ${storeState.ownerConfig.supportEmail}.
- Active Shopper Currency: ${currencyMeta.currencyName} (${currencyMeta.code}) — ${rateNote}. Global converter supports USA (USD), China (CNY), Saudi Arabia (SAR), Kenya (KES), Tanzania (TZS), and every country worldwide.
- Customer Accounts: Shoppers can create an account or log in via the Account tab to save their Country/Currency, auto-fill delivery details, and track linked orders.
- EXACT ARRIVAL TIMES & MANDATORY LOCAL DELIVERY FEES (if ordered right now, quoted in ${currencyMeta.code}):
  * Same-Day Express Doorstep Rider (${fmt(DELIVERY_ZONE_META.express_city.baseFeeUsd)} base delivery cost): Exact arrival ${expressEta.exactTimeLabel}.
  * Local Hub Priority Counter Transfer (${fmt(DELIVERY_ZONE_META.hub_pickup.baseFeeUsd)} base delivery cost): Exact arrival ${hubEta.exactTimeLabel}.
  * Next-Day Metro Doorstep Courier (${fmt(DELIVERY_ZONE_META.standard_metro.baseFeeUsd)} base delivery cost): Exact arrival ${metroEta.exactTimeLabel}.
- Holiday Offer Active: ${activeHoliday.title} — extra ${activeHoliday.extraDiscountPercent}% off at checkout with code ${activeHoliday.promoCode}.
- Checkout Policy: Prepaid only to ${storeState.ownerConfig.payoutPhone} (Mobile Money, Card, or Bank Transfer). Every order includes an itemized local delivery cost.
- Live Electronics & Combo Catalog (${publishedProducts.length} models, quoted in ${currencyMeta.code}):\n${catalogContext}
${matchedOrder ? `- Matched Order ${matchedOrder.orderCode}: Stage="${matchedOrder.status}", Exact Scheduled Arrival="${matchedOrder.etaLabel}", Delivery Fee=${fmt(matchedOrder.deliveryFeeUsd)}, Total Paid=${fmt(matchedOrder.totalUsd)}.` : ''}

CRITICAL RULE: Quote all prices and local delivery costs in the shopper's selected currency (${currencyMeta.code}), and ALWAYS state the EXACT clock arrival time (e.g. "${expressEta.exactTimeLabel}"). Keep answer warm, crisp, and under 75 words.`,
            config: {
              thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  reply: {
                    type: Type.STRING,
                    description:
                      'Helpful plain-text answer quoting converted currency prices, delivery cost, and exact arrival clock time.',
                  },
                  suggestedAction: {
                    type: Type.STRING,
                    description:
                      'One of: open_bag, track_order, browse_catalog, open_reviews, open_contact, open_account, none',
                  },
                },
                required: ['reply', 'suggestedAction'],
              },
            },
          }),
          timeoutPromise,
        ]);

        if (response?.text) {
          const parsed = JSON.parse(response.text.trim()) as {
            reply?: string;
            suggestedAction?: string;
          };
          if (parsed.reply) reply = parsed.reply;
          if (
            parsed.suggestedAction === 'open_bag' ||
            parsed.suggestedAction === 'track_order' ||
            parsed.suggestedAction === 'browse_catalog' ||
            parsed.suggestedAction === 'open_reviews' ||
            parsed.suggestedAction === 'open_contact' ||
            parsed.suggestedAction === 'open_account'
          ) {
            suggestedAction = parsed.suggestedAction;
          }
        }
      } catch (err) {
        console.warn(
          'Customer AI fallback used:',
          err instanceof Error ? err.message : String(err)
        );
      }
    }

    // Deterministic store-grounded fallback quoting converted currency + exact clock arrival time
    if (!reply) {
      const lower = cleanMsg.toLowerCase();
      if (matchedOrder) {
        reply = `Order ${matchedOrder.orderCode} (${fmt(matchedOrder.totalUsd)}, including ${fmt(matchedOrder.deliveryFeeUsd)} local delivery) is at "${matchedOrder.status.replace(/_/g, ' ')}" via ${matchedOrder.courierName}. Exact scheduled arrival: ${matchedOrder.etaLabel}.`;
        suggestedAction = 'track_order';
      } else if (
        lower.includes('currency') ||
        lower.includes('country') ||
        lower.includes('convert') ||
        lower.includes('kenya') ||
        lower.includes('tanzania') ||
        lower.includes('saudi') ||
        lower.includes('china')
      ) {
        reply = `You are currently viewing prices in ${currencyMeta.currencyName} (${rateNote}). Use our Currency button at the top to switch instantly between USA (USD), China (CNY), Saudi Arabia (SAR), Kenya (KES), Tanzania (TZS), or any country currency worldwide!`;
        suggestedAction = 'browse_catalog';
      } else if (
        lower.includes('account') ||
        lower.includes('login') ||
        lower.includes('log in') ||
        lower.includes('sign in') ||
        lower.includes('register')
      ) {
        reply = `Open the Account tab to create your Elvora Member Account or log in! Your account saves your Country & Currency (${currencyMeta.code}), auto-fills your delivery address at checkout, and keeps all your orders in one place.`;
        suggestedAction = 'open_account';
      } else if (
        lower.includes('arrive') ||
        lower.includes('time') ||
        lower.includes('when') ||
        lower.includes('delivery') ||
        lower.includes('cost') ||
        lower.includes('fee')
      ) {
        reply = `If you complete prepaid checkout right now, Same-Day Express Doorstep Rider (${fmt(DELIVERY_ZONE_META.express_city.baseFeeUsd)} base delivery cost) arrives ${expressEta.exactTimeLabel}. Next-Day Metro Courier (${fmt(DELIVERY_ZONE_META.standard_metro.baseFeeUsd)}) arrives ${metroEta.exactTimeLabel}, and Hub Counter Transfer (${fmt(DELIVERY_ZONE_META.hub_pickup.baseFeeUsd)}) arrives ${hubEta.exactTimeLabel}.`;
        suggestedAction = 'open_bag';
      } else if (
        lower.includes('combo') ||
        lower.includes('bundle') ||
        lower.includes('friday') ||
        lower.includes('discount') ||
        lower.includes('offer')
      ) {
        reply = `Our top Black Friday bundle is the Executive Combo: Earpods Pro + Chrono X1 Smartwatch at ${fmt(279)} (down from ${fmt(335)}, +${fmt(12)} local delivery, arriving ${expressEta.exactTimeLabel}). Use code ${activeHoliday.promoCode} in your Bag for an extra ${activeHoliday.extraDiscountPercent}% holiday discount!`;
        suggestedAction = 'browse_catalog';
      } else if (lower.includes('review') || lower.includes('rating')) {
        reply = `Shoppers rate ${storeState.ownerConfig.merchantName} 4.9/5 stars across verified electronics & combo deliveries. Open our Reviews tab to read verified buyer feedback or post your own review.`;
        suggestedAction = 'open_reviews';
      } else if (lower.includes('contact') || lower.includes('business') || lower.includes('support')) {
        reply = `${storeState.ownerConfig.merchantName} is reachable at ${storeState.ownerConfig.payoutPhone}, ${storeState.ownerConfig.supportEmail}, or ${storeState.ownerConfig.hubAddress}. Open Contact Us to send a direct message to our team.`;
        suggestedAction = 'open_contact';
      } else {
        reply = `Welcome to ${storeState.ownerConfig.merchantName}! Prices are shown in ${currencyMeta.code} (${rateNote}). Explore ${publishedProducts.length} "${ELVORA_BRAND_MOTTO}" electronics & combos—like our Executive Earpods + Smartwatch Combo (${fmt(279)} + ${fmt(12)} delivery)—arriving ${expressEta.exactTimeLabel}!`;
        suggestedAction = 'browse_catalog';
      }
    }

    res.json({ reply, suggestedAction });
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve('dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Elvora server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
