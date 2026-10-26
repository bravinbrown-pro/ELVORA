export type ElectronicsCategory =
  | 'Combos'
  | 'Audio'
  | 'Wearables'
  | 'Power'
  | 'Computing';

export type ProductImageKey =
  | 'hero_flagship'
  | 'anc_headphones'
  | 'smartwatch_ultra'
  | 'gan_powerbank'
  | 'tws_earbuds'
  | 'combo_earpods_watch'
  | 'computing_oled_suite'
  | 'audio_soundbar_speaker'
  | 'power_solar_station';

export type DeliveryZone = 'express_city' | 'standard_metro' | 'hub_pickup';

export type PaymentMethod = 'mobile_money' | 'card_gateway' | 'instant_bank';

export type OrderStatus =
  | 'payment_confirmed'
  | 'oem_branding'
  | 'local_hub'
  | 'out_for_delivery'
  | 'delivered';

export type HolidayCampaignId =
  | 'black_friday'
  | 'cyber_monday'
  | 'festive_gold'
  | 'standard';

export type BuyerSuggestionIntent =
  | 'top_picks'
  | 'combo_bundles'
  | 'holiday_discounts'
  | 'work_power'
  | 'audio_fitness';

export const ELVORA_BRAND_MOTTO = 'ELVORA Tech for a Brighter you';
export const DEFAULT_BUSINESS_NAME = 'Elvora Goldline Electronics Ltd.';

export interface HolidayCampaignMeta {
  id: HolidayCampaignId;
  title: string;
  promoCode: string;
  extraDiscountPercent: number;
  headline: string;
}

export const HOLIDAY_CAMPAIGNS: Record<HolidayCampaignId, HolidayCampaignMeta> = {
  black_friday: {
    id: 'black_friday',
    title: 'Black Friday Gold Vault Event',
    promoCode: 'BLACKFRIDAY',
    extraDiscountPercent: 10,
    headline:
      'Black Friday Gold Event: Up to 20% off OEM Electronics & Combos + extra 10% at checkout with code BLACKFRIDAY.',
  },
  cyber_monday: {
    id: 'cyber_monday',
    title: 'Cyber Monday Tech Drop',
    promoCode: 'CYBERGOLD',
    extraDiscountPercent: 12,
    headline:
      'Cyber Monday Tech Drop: Extra 12% off Ultrabooks, GaN Stations & Audio Combos with code CYBERGOLD.',
  },
  festive_gold: {
    id: 'festive_gold',
    title: 'Festive Holiday Gift Combos',
    promoCode: 'HOLIDAY15',
    extraDiscountPercent: 15,
    headline:
      'Festive Holiday Offer: Save 15% on Earpods + Smartwatch Gift Combos with code HOLIDAY15.',
  },
  standard: {
    id: 'standard',
    title: 'Standard Direct Pricing',
    promoCode: 'ELVORAVIP',
    extraDiscountPercent: 5,
    headline:
      'Direct OEM Hardware Pricing · Stamped ELVORA Tech for a Brighter you · Tracked Doorstep Courier.',
  },
};

export interface ProductItem {
  id: string;
  title: string;
  category: ElectronicsCategory;
  price: number;
  originalPrice?: number;
  discountPercent?: number;
  oemCost: number;
  alibabaFreeShipping?: boolean;
  localDeliveryFeeUsd: number;
  isCombo?: boolean;
  comboItems?: string[];
  holidayTag?: string;
  ratingAvg?: number;
  reviewCount?: number;
  stockRemaining: number;
  imageKey: ProductImageKey;
  specs: string;
  oemSupplier: string;
  oemOrigin: string;
  logoImprint: string;
  isPublished: boolean;
  updatedAtIso: string;
}

export interface CartEntry {
  productId: string;
  quantity: number;
}

export interface OrderLineItem {
  productId: string;
  title: string;
  imageKey: ProductImageKey;
  unitPrice: number;
  quantity: number;
  remainingAfterOrder: number;
}

export interface TrackingEvent {
  status: OrderStatus;
  label: string;
  detail: string;
  timestampIso: string;
}

export interface OrderRecord {
  id: string;
  orderCode: string;
  customerAccountId?: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  deliveryZone: DeliveryZone;
  deliveryFeeUsd: number;
  discountSavedUsd?: number;
  promoCodeApplied?: string;
  subtotalUsd: number;
  totalUsd: number;
  paidCurrencyCode?: string;
  paidAmountFormatted?: string;
  paymentMethod: PaymentMethod;
  paymentRef: string;
  ownerPayoutPhone: string;
  paymentConfirmedAtIso: string;
  oemOrderRef: string;
  oemSupplier: string;
  logoImprint: string;
  courierName: string;
  etaLabel: string;
  expectedArrivalIso?: string;
  status: OrderStatus;
  items: OrderLineItem[];
  timeline: TrackingEvent[];
  createdAtIso: string;
  updatedAtIso: string;
}

export interface AlibabaOemOrder {
  id: string;
  oemOrderRef: string;
  supplierName: string;
  productTitle: string;
  imageKey: ProductImageKey;
  unitsOrdered: number;
  unitCostUsd: number;
  alibabaShippingCostUsd?: number;
  freightSavedUsd?: number;
  aiRetailUnitPriceUsd?: number;
  totalCostUsd: number;
  logoImprint: string;
  triggerReason:
    | 'Customer Payment Verified'
    | 'AI Low-Stock Auto-Replenish'
    | 'AI New OEM Catalog Launch';
  linkedOrderCode?: string;
  status:
    | 'Submitted to Alibaba Factory'
    | 'Laser Branding QC'
    | 'Air Freight to Local Hub';
  createdAtIso: string;
}

export interface PhonePaymentNotification {
  id: string;
  orderCode: string;
  ownerPhone: string;
  amountUsd: number;
  paymentMethodLabel: string;
  paymentRef: string;
  smsBody: string;
  confirmedByAi: boolean;
  createdAtIso: string;
}

export interface AiProductPost {
  id: string;
  productId: string;
  productTitle: string;
  category: ElectronicsCategory;
  imageKey: ProductImageKey;
  priceUsd: number;
  stockRemaining: number;
  oemSupplier: string;
  logoImprint: string;
  ownerPhoneConfirmed: string;
  linkedOrderCode?: string;
  caption: string;
  createdAtIso: string;
}

export interface CustomerReview {
  id: string;
  productId: string;
  productTitle: string;
  authorName: string;
  rating: number;
  comment: string;
  verifiedOrderCode?: string;
  arrivalFeedback?: string;
  createdAtIso: string;
}

export interface SupportInquiry {
  id: string;
  senderName: string;
  contactInfo: string;
  topic: 'delivery' | 'combos' | 'payment' | 'warranty';
  orderCode?: string;
  message: string;
  status: 'open' | 'resolved';
  createdAtIso: string;
}

export interface MerchantAdvertisement {
  id: string;
  title: string;
  description: string;
  ctaLabel: string;
  ctaUrl: string;
  imageUrl?: string;
  badge?: string;
  isActive: boolean;
  impressions?: number;
  clicks?: number;
  createdAtIso: string;
}

export interface OwnerConfig {
  merchantName: string;
  supportEmail: string;
  hubAddress: string;
  ownerEmail: string;
  payoutPhone: string;
  aiMarkupMultiplier: number;
  activeHolidayCampaign: HolidayCampaignId;
  preferAlibabaFreeShipping: boolean;
  autoOrderAlibabaOem: boolean;
  autoPostProductStock: boolean;
  adsEnabled?: boolean;
  adScriptSnippet?: string;
  adScriptEnabled?: boolean;
  advertisements: MerchantAdvertisement[];
  updatedAtIso: string;
}

export interface StoreState {
  products: ProductItem[];
  orders: OrderRecord[];
  oemOrders: AlibabaOemOrder[];
  phoneNotifications: PhonePaymentNotification[];
  aiPosts: AiProductPost[];
  reviews: CustomerReview[];
  inquiries: SupportInquiry[];
  advertisements: MerchantAdvertisement[];
  ownerConfig: OwnerConfig;
}

export interface CheckoutFormInput {
  customerAccountId?: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  deliveryZone: DeliveryZone;
  paymentMethod: PaymentMethod;
  paymentRef: string;
  promoCode?: string;
  paidCurrencyCode?: string;
  paidAmountFormatted?: string;
}

export interface ValidationErrors {
  customerName?: string;
  customerPhone?: string;
  deliveryAddress?: string;
  paymentRef?: string;
  cart?: string;
}

export interface ReviewFormInput {
  productId: string;
  authorName: string;
  rating: number;
  verifiedOrderCode?: string;
  comment: string;
}

export interface InquiryFormInput {
  senderName: string;
  contactInfo: string;
  topic: 'delivery' | 'combos' | 'payment' | 'warranty';
  orderCode?: string;
  message: string;
}

export interface OemSupplierTemplate {
  templateId: string;
  title: string;
  category: ElectronicsCategory;
  oemCost: number;
  suggestedPrice: number;
  compareAtPrice?: number;
  localDeliveryFeeUsd: number;
  alibabaFreeShipping: boolean;
  alibabaStandardFreightUsd: number;
  initialBatchUnits: number;
  isCombo?: boolean;
  comboItems?: string[];
  imageKey: ProductImageKey;
  specs: string;
  oemSupplier: string;
  oemOrigin: string;
}

/**
 * AI Automatic Retail Markup Engine:
 * Ensures Elvora store prices are NEVER the same as Alibaba factory prices.
 * Example: Alibaba cost $400 -> AI automatically prices between $700 and $800 (default 1.90x = $760),
 * plus a separate customer local delivery fee.
 */
export function computeAiRetailPrice(
  oemCostUsd: number,
  multiplier: number = 1.9,
  discountPercent: number = 0
): {
  retailPrice: number;
  originalPrice?: number;
  appliedDiscountPercent: number;
  grossMarginUsd: number;
  markupRatio: number;
} {
  const safeCost = Math.max(1, oemCostUsd);
  // Clamp AI markup strictly inside [1.75x, 2.00x] so $400 -> $700..$800
  const clampedMult = Math.min(2.0, Math.max(1.75, multiplier));
  const targetSelling = Math.round(safeCost * clampedMult);

  const cleanDiscount =
    discountPercent > 0 && discountPercent <= 35 ? Math.round(discountPercent) : 0;

  if (cleanDiscount > 0) {
    const compareAt = Math.round(targetSelling / (1 - cleanDiscount / 100));
    return {
      retailPrice: targetSelling,
      originalPrice: compareAt,
      appliedDiscountPercent: cleanDiscount,
      grossMarginUsd: Number((targetSelling - safeCost).toFixed(2)),
      markupRatio: Number((targetSelling / safeCost).toFixed(2)),
    };
  }

  return {
    retailPrice: targetSelling,
    appliedDiscountPercent: 0,
    grossMarginUsd: Number((targetSelling - safeCost).toFixed(2)),
    markupRatio: Number((targetSelling / safeCost).toFixed(2)),
  };
}

export const DELIVERY_ZONE_META: Record<
  DeliveryZone,
  {
    label: string;
    baseFeeUsd: number;
    perExtraUnitUsd: number;
    transitMinutes: number;
    courier: string;
  }
> = {
  express_city: {
    label: 'Same-Day Express Doorstep Rider',
    baseFeeUsd: 12,
    perExtraUnitUsd: 3,
    transitMinutes: 165, // 2h 45m exact clock arrival
    courier: 'Elvora Goldline Dispatch · Rider #14',
  },
  standard_metro: {
    label: 'Next-Day Metro Doorstep Courier',
    baseFeeUsd: 8,
    perExtraUnitUsd: 2,
    transitMinutes: 1320, // ~22 hours exact clock arrival
    courier: 'Elvora Metro Logistics Van #07',
  },
  hub_pickup: {
    label: 'Local Hub Priority Counter Transfer',
    baseFeeUsd: 5,
    perExtraUnitUsd: 1,
    transitMinutes: 210, // 3h 30m exact clock arrival
    courier: 'Elvora Central Hub Desk',
  },
};

/**
 * Computes the EXACT clock arrival timestamp and human-readable clock string
 * so shoppers and the AI Concierge always know the exact arrival time.
 */
export function computeExactArrivalInfo(
  zone: DeliveryZone,
  referenceDate: Date = new Date()
): {
  arrivalIso: string;
  exactTimeLabel: string;
  clockOnly: string;
  shortDayClockLabel: string;
  minutesFromNow: number;
} {
  const meta = DELIVERY_ZONE_META[zone];
  const arrivalMs = referenceDate.getTime() + meta.transitMinutes * 60 * 1000;
  const arrivalDate = new Date(arrivalMs);

  // Round to nearest 5 minutes for clean courier scheduling precision
  const mins = arrivalDate.getMinutes();
  const roundedMins = Math.ceil(mins / 5) * 5;
  arrivalDate.setMinutes(roundedMins, 0, 0);

  // Respect local courier dispatch hours (8:00 AM – 9:45 PM)
  const morningSlotMinutes =
    zone === 'express_city' ? 45 : zone === 'hub_pickup' ? 15 : 150; // 8:45 AM, 8:15 AM, or 10:30 AM
  const hr = arrivalDate.getHours();
  const min = arrivalDate.getMinutes();
  if (hr >= 22 || (hr === 21 && min > 45)) {
    arrivalDate.setDate(arrivalDate.getDate() + 1);
    arrivalDate.setHours(8, 0, 0, 0);
    arrivalDate.setMinutes(morningSlotMinutes, 0, 0);
  } else if (hr < 8) {
    arrivalDate.setHours(8, 0, 0, 0);
    arrivalDate.setMinutes(morningSlotMinutes, 0, 0);
  }

  const clockOnly = arrivalDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  const sameCalendarDay =
    arrivalDate.getFullYear() === referenceDate.getFullYear() &&
    arrivalDate.getMonth() === referenceDate.getMonth() &&
    arrivalDate.getDate() === referenceDate.getDate();

  const tomorrowCheck = new Date(referenceDate);
  tomorrowCheck.setDate(referenceDate.getDate() + 1);
  const isTomorrow =
    arrivalDate.getFullYear() === tomorrowCheck.getFullYear() &&
    arrivalDate.getMonth() === tomorrowCheck.getMonth() &&
    arrivalDate.getDate() === tomorrowCheck.getDate();

  const shortDate = arrivalDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  const dayPrefix = sameCalendarDay
    ? 'Today'
    : isTomorrow
      ? 'Tomorrow'
      : arrivalDate.toLocaleDateString('en-US', { weekday: 'short' });

  const effectiveMinutes = Math.max(
    30,
    Math.round((arrivalDate.getTime() - referenceDate.getTime()) / 60000)
  );

  return {
    arrivalIso: arrivalDate.toISOString(),
    exactTimeLabel: `${dayPrefix} at ${clockOnly} (${shortDate})`,
    clockOnly,
    shortDayClockLabel: `${clockOnly} ${dayPrefix}`,
    minutesFromNow: effectiveMinutes,
  };
}

export const PAYMENT_METHOD_META: Record<
  PaymentMethod,
  { label: string; description: string; refPlaceholder: string }
> = {
  mobile_money: {
    label: 'Instant Mobile Money',
    description: 'Direct mobile transfer confirmed immediately to owner phone',
    refPlaceholder: 'e.g. MPESA-948210',
  },
  card_gateway: {
    label: 'Secure Card Gateway',
    description: '3D-Secure Visa / Mastercard instant settlement',
    refPlaceholder: 'e.g. AUTH-773190',
  },
  instant_bank: {
    label: 'Instant Bank Transfer',
    description: 'Real-time EFT verified prior to dispatch',
    refPlaceholder: 'e.g. EFT-552019',
  },
};

export const ORDER_STATUS_STEPS: {
  status: OrderStatus;
  label: string;
  shortLabel: string;
}[] = [
  {
    status: 'payment_confirmed',
    label: 'Payment Verified to Owner Phone',
    shortLabel: 'Paid',
  },
  {
    status: 'oem_branding',
    label: 'Alibaba OEM Branding & QC',
    shortLabel: 'OEM QC',
  },
  {
    status: 'local_hub',
    label: 'Arrived at Local Delivery Hub',
    shortLabel: 'Local Hub',
  },
  {
    status: 'out_for_delivery',
    label: 'Out for Local Delivery',
    shortLabel: 'In Transit',
  },
  {
    status: 'delivered',
    label: 'Delivered & Signed',
    shortLabel: 'Delivered',
  },
];

export const ALIBABA_OEM_SUPPLIER_CATALOG: OemSupplierTemplate[] = [
  {
    templateId: 'oem_master_earpods_400',
    title: 'Elvora Signature Gold Earpods Master Edition',
    category: 'Audio',
    oemCost: 400,
    suggestedPrice: 760,
    compareAtPrice: 840,
    localDeliveryFeeUsd: 12,
    alibabaFreeShipping: true,
    alibabaStandardFreightUsd: 95,
    initialBatchUnits: 12,
    imageKey: 'tws_earbuds',
    specs:
      'Dual-Driver Beryllium + Planar Acoustics · Gold-Trim CNC Case · -50dB Lossless ANC · 48h Battery',
    oemSupplier: 'Shenzhen Goldline Acoustics OEM Ltd. (Alibaba Free-Freight Verified)',
    oemOrigin: 'Shenzhen, CN',
  },
  {
    templateId: 'oem_combo_earpods_watch',
    title: 'Elvora Executive Combo: Earpods Pro + Chrono X1 Smartwatch',
    category: 'Combos',
    oemCost: 148,
    suggestedPrice: 279,
    compareAtPrice: 335,
    localDeliveryFeeUsd: 14,
    alibabaFreeShipping: true,
    alibabaStandardFreightUsd: 78,
    initialBatchUnits: 15,
    isCombo: true,
    comboItems: ['Elvora Pulse Pods Pro', 'Elvora Chrono X1 Gold-Crown Smartwatch'],
    imageKey: 'combo_earpods_watch',
    specs:
      '2-in-1 Matched Black & Gold Gift Box · Titanium AMOLED GPS Smartwatch + Active ANC Wireless Earpods',
    oemSupplier: 'Guangzhou SmartBundle OEM Group (Alibaba Free-Freight Verified)',
    oemOrigin: 'Guangzhou, CN',
  },
  {
    templateId: 'oem_aerobook_14',
    title: 'Elvora AeroBook 14 2.8K OLED Ultrabook',
    category: 'Computing',
    oemCost: 415,
    suggestedPrice: 779,
    compareAtPrice: 860,
    localDeliveryFeeUsd: 18,
    alibabaFreeShipping: true,
    alibabaStandardFreightUsd: 140,
    initialBatchUnits: 10,
    imageKey: 'computing_oled_suite',
    specs:
      '14" 2.8K 120Hz OLED · Gold-Chamfer Anodized Black Chassis · 16GB LPDDR5X · 1TB NVMe SSD',
    oemSupplier: 'Shenzhen Precision Compute OEM Ltd. (Alibaba Free-Freight Verified)',
    oemOrigin: 'Shenzhen, CN',
  },
  {
    templateId: 'oem_titan_300w_station',
    title: 'Elvora Titan 300W Portable GaN Power Station',
    category: 'Power',
    oemCost: 156,
    suggestedPrice: 295,
    compareAtPrice: 340,
    localDeliveryFeeUsd: 16,
    alibabaFreeShipping: true,
    alibabaStandardFreightUsd: 110,
    initialBatchUnits: 16,
    imageKey: 'power_solar_station',
    specs:
      '300W Pure Sine AC + 140W USB-C PD 3.1 · Amber-Gold Live Runtime Display · LiFePO4 3,000 Cycles',
    oemSupplier: 'Dongguan GaN Power Tech Co. (Alibaba Free-Freight Verified)',
    oemOrigin: 'Dongguan, CN',
  },
  {
    templateId: 'oem_soundbar_gold',
    title: 'Elvora Acoustic Goldline Studio Soundbar & Sub',
    category: 'Audio',
    oemCost: 142,
    suggestedPrice: 269,
    compareAtPrice: 310,
    localDeliveryFeeUsd: 15,
    alibabaFreeShipping: false,
    alibabaStandardFreightUsd: 64,
    initialBatchUnits: 14,
    imageKey: 'audio_soundbar_speaker',
    specs:
      'Dolby Atmos Spatial Array · Brushed Champagne-Gold Trim · HDMI eARC + Bluetooth 5.4 LDAC',
    oemSupplier: 'Foshan Hi-Fi Acoustic Factory (Alibaba Verified)',
    oemOrigin: 'Foshan, CN',
  },
  {
    templateId: 'oem_slate_pro_tablet',
    title: 'Elvora Slate Pro 12.9" 120Hz AMOLED Tablet',
    category: 'Computing',
    oemCost: 255,
    suggestedPrice: 479,
    compareAtPrice: 540,
    localDeliveryFeeUsd: 14,
    alibabaFreeShipping: true,
    alibabaStandardFreightUsd: 88,
    initialBatchUnits: 12,
    imageKey: 'computing_oled_suite',
    specs:
      '12.9" Tandem AMOLED · Magnetic Gold-Trim Stylus Included · 256GB UFS 4.0 · Quad Speakers',
    oemSupplier: 'Shenzhen Precision Compute OEM Ltd. (Alibaba Free-Freight Verified)',
    oemOrigin: 'Shenzhen, CN',
  },
];

const PHONE_REGEX = /^\+?[0-9 \-()]{7,24}$/;
const REF_REGEX = /^[a-zA-Z0-9_\-]{4,64}$/;

export function validatePhoneInput(phone: string): string | undefined {
  const trimmed = phone.trim();
  if (!trimmed) {
    return 'Phone number is required.';
  }
  if (!PHONE_REGEX.test(trimmed)) {
    return 'Enter a valid phone number (7–24 digits, optional + country code).';
  }
  return undefined;
}

export function validateCheckoutInput(
  input: CheckoutFormInput,
  cart: CartEntry[]
): ValidationErrors {
  const errors: ValidationErrors = {};

  if (!cart || cart.length === 0) {
    errors.cart = 'Your bag is empty. Add at least one electronics item before paying.';
  }

  const name = input.customerName.trim();
  if (name.length < 2 || name.length > 100) {
    errors.customerName = 'Enter the recipient full name (2–100 characters).';
  }

  const phoneErr = validatePhoneInput(input.customerPhone);
  if (phoneErr) {
    errors.customerPhone = phoneErr;
  }

  const addr = input.deliveryAddress.trim();
  if (addr.length < 5 || addr.length > 240) {
    errors.deliveryAddress = 'Enter a complete local delivery street and area address.';
  }

  const ref = input.paymentRef.trim();
  if (!ref) {
    errors.paymentRef = 'Enter the payment confirmation code to verify settlement.';
  } else if (!REF_REGEX.test(ref)) {
    errors.paymentRef =
      'Confirmation code must be 4–64 letters, numbers, or hyphens (no spaces).';
  }

  return errors;
}

export function validateReviewInput(input: ReviewFormInput): string | undefined {
  if (!input.productId || !input.productId.trim()) {
    return 'Select the electronics item or combo you are reviewing.';
  }
  const author = input.authorName.trim();
  if (author.length < 2 || author.length > 80) {
    return 'Enter your name (2–80 characters).';
  }
  if (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5) {
    return 'Select a rating between 1 and 5 stars.';
  }
  const comment = input.comment.trim();
  if (comment.length < 8 || comment.length > 400) {
    return 'Write a helpful review between 8 and 400 characters.';
  }
  return undefined;
}

export function validateInquiryInput(input: InquiryFormInput): string | undefined {
  const name = input.senderName.trim();
  if (name.length < 2 || name.length > 80) {
    return 'Enter your full name (2–80 characters).';
  }
  const contact = input.contactInfo.trim();
  if (contact.length < 5 || contact.length > 120) {
    return 'Enter a valid phone number or email address so we can reply.';
  }
  const msg = input.message.trim();
  if (msg.length < 8 || msg.length > 500) {
    return 'Enter your message or question (8–500 characters).';
  }
  return undefined;
}

/**
 * Calculates subtotal, holiday promo discount, and mandatory customer local delivery fee.
 * Every non-empty order ALWAYS includes a positive local delivery cost (> $0).
 */
export function calculateCartTotals(
  cart: CartEntry[],
  products: ProductItem[],
  deliveryZone: DeliveryZone,
  promoCode?: string,
  activeCampaignId: HolidayCampaignId = 'black_friday'
): {
  subtotalUsd: number;
  promoDiscountUsd: number;
  appliedPromoCode?: string;
  deliveryFeeUsd: number;
  totalUsd: number;
  totalUnits: number;
  exactArrivalLabel: string;
  arrivalIso: string;
} {
  let subtotalUsd = 0;
  let totalUnits = 0;
  let maxItemHandlingUsd = 0;

  for (const entry of cart) {
    const product = products.find((p) => p.id === entry.productId);
    if (product && entry.quantity > 0) {
      subtotalUsd += product.price * entry.quantity;
      totalUnits += entry.quantity;
      const itemHandling = Math.max(0, (product.localDeliveryFeeUsd ?? 10) - 8);
      if (itemHandling > maxItemHandlingUsd) {
        maxItemHandlingUsd = itemHandling;
      }
    }
  }

  const zoneMeta = DELIVERY_ZONE_META[deliveryZone];
  const extraUnits = Math.max(0, totalUnits - 1);
  const deliveryFeeUsd =
    totalUnits === 0
      ? 0
      : Number(
          (
            zoneMeta.baseFeeUsd +
            maxItemHandlingUsd +
            extraUnits * zoneMeta.perExtraUnitUsd
          ).toFixed(2)
        );

  let promoDiscountUsd = 0;
  let appliedPromoCode: string | undefined;
  const cleanedCode = promoCode?.trim().toUpperCase();

  if (cleanedCode && subtotalUsd > 0) {
    const matchedCampaign = Object.values(HOLIDAY_CAMPAIGNS).find(
      (c) => c.promoCode === cleanedCode
    );
    const activeMeta = HOLIDAY_CAMPAIGNS[activeCampaignId];
    const pct = matchedCampaign
      ? matchedCampaign.extraDiscountPercent
      : cleanedCode === activeMeta.promoCode
        ? activeMeta.extraDiscountPercent
        : 0;
    if (pct > 0) {
      promoDiscountUsd = Number(((subtotalUsd * pct) / 100).toFixed(2));
      appliedPromoCode = cleanedCode;
    }
  }

  const netMerchandise = Math.max(1, subtotalUsd - promoDiscountUsd);
  const arrival = computeExactArrivalInfo(deliveryZone);

  return {
    subtotalUsd: Number(subtotalUsd.toFixed(2)),
    promoDiscountUsd,
    appliedPromoCode,
    deliveryFeeUsd,
    totalUsd: Number((netMerchandise + deliveryFeeUsd).toFixed(2)),
    totalUnits,
    exactArrivalLabel: arrival.exactTimeLabel,
    arrivalIso: arrival.arrivalIso,
  };
}

/**
 * Curated Buyer Suggestions engine for personalized discovery & cross-sell.
 */
export function getBuyerSuggestions(
  products: ProductItem[],
  intent: BuyerSuggestionIntent,
  excludeProductIds: string[] = []
): { product: ProductItem; reason: string }[] {
  const available = products.filter(
    (p) => p.isPublished && p.stockRemaining > 0 && !excludeProductIds.includes(p.id)
  );

  if (intent === 'combo_bundles') {
    return available
      .filter((p) => p.isCombo || p.category === 'Combos')
      .slice(0, 3)
      .map((product) => ({
        product,
        reason: product.originalPrice
          ? `Bundle & save $${product.originalPrice - product.price} vs buying separately`
          : 'Matched Black & Gold hardware bundle',
      }));
  }

  if (intent === 'holiday_discounts') {
    return available
      .filter((p) => (p.discountPercent ?? 0) > 0 || p.holidayTag)
      .sort((a, b) => (b.discountPercent ?? 0) - (a.discountPercent ?? 0))
      .slice(0, 3)
      .map((product) => ({
        product,
        reason: `${product.holidayTag ?? 'Holiday Deal'} · Save ${product.discountPercent ?? 12}% today`,
      }));
  }

  if (intent === 'work_power') {
    return available
      .filter((p) => p.category === 'Computing' || p.category === 'Power')
      .slice(0, 3)
      .map((product) => ({
        product,
        reason: 'Executive workstation & uninterrupted GaN backup',
      }));
  }

  if (intent === 'audio_fitness') {
    return available
      .filter((p) => p.category === 'Audio' || p.category === 'Wearables' || p.isCombo)
      .slice(0, 3)
      .map((product) => ({
        product,
        reason: 'Daily commute ANC audio & titanium biometric tracking',
      }));
  }

  // top_picks: 1 flagship combo + 1 discounted audio + 1 power/computing bestseller
  return available.slice(0, 3).map((product) => ({
    product,
    reason: product.isCombo
      ? 'Most popular 2-in-1 Combo value pack'
      : product.discountPercent
        ? `Featured ${product.discountPercent}% Holiday Markdown`
        : 'Top-rated Elvora Goldline hardware',
  }));
}

export function getNextOrderStatus(current: OrderStatus): OrderStatus {
  const idx = ORDER_STATUS_STEPS.findIndex((s) => s.status === current);
  if (idx < 0 || idx >= ORDER_STATUS_STEPS.length - 1) {
    return 'delivered';
  }
  return ORDER_STATUS_STEPS[idx + 1].status;
}

export function advanceOrderInState(
  state: StoreState,
  orderId: string,
  targetStatus?: OrderStatus,
  nowIso: string = new Date().toISOString()
): StoreState {
  const nextOrders = state.orders.map((order) => {
    if (order.id !== orderId && order.orderCode !== orderId) return order;
    const nextStatus = targetStatus ?? getNextOrderStatus(order.status);
    if (nextStatus === order.status) return order;

    const stepMeta = ORDER_STATUS_STEPS.find((s) => s.status === nextStatus)!;
    const detailMap: Record<OrderStatus, string> = {
      payment_confirmed: `Payment confirmed to owner phone ${order.ownerPayoutPhone}.`,
      oem_branding: `Alibaba factory verified "${order.logoImprint}" custom laser branding.`,
      local_hub: `Cleared local hub inspection; assigned to ${order.courierName}.`,
      out_for_delivery: `${order.courierName} en route to ${order.deliveryAddress} — Exact arrival: ${order.etaLabel}.`,
      delivered: `Handed over to ${order.customerName} after prepaid verification.`,
    };

    return {
      ...order,
      status: nextStatus,
      updatedAtIso: nowIso,
      timeline: [
        ...order.timeline,
        {
          status: nextStatus,
          label: stepMeta.label,
          detail: detailMap[nextStatus],
          timestampIso: nowIso,
        },
      ],
    };
  });

  return {
    ...state,
    orders: nextOrders,
  };
}

export function processVerifiedOrder(
  state: StoreState,
  input: CheckoutFormInput,
  cart: CartEntry[],
  options?: {
    nowIso?: string;
    orderCodeSuffix?: string;
    customAiCaption?: string;
  }
): {
  nextState: StoreState;
  order: OrderRecord;
  phoneAlert: PhonePaymentNotification;
  oemOrdersCreated: AlibabaOemOrder[];
  aiPostsCreated: AiProductPost[];
} {
  const errors = validateCheckoutInput(input, cart);
  const firstError = Object.values(errors)[0];
  if (firstError) {
    throw new Error(firstError);
  }

  const nowDate = options?.nowIso ? new Date(options.nowIso) : new Date();
  const nowIso = nowDate.toISOString();
  const suffix =
    options?.orderCodeSuffix ??
    String(
      Math.floor(1000 + (((Date.now() % 8999) + state.orders.length * 17) % 9000))
    );
  const orderCode = `ELV-${suffix}`;
  const oemOrderRef = `ALI-OEM-${suffix}`;

  const updatedProducts = state.products.map((p) => ({ ...p }));
  const lineItems: OrderLineItem[] = [];

  for (const entry of cart) {
    const prod = updatedProducts.find((p) => p.id === entry.productId);
    if (!prod) {
      throw new Error(`Product ${entry.productId} does not exist.`);
    }
    if (entry.quantity > prod.stockRemaining) {
      throw new Error(
        `Only ${prod.stockRemaining} units of ${prod.title} remaining in stock.`
      );
    }
    prod.stockRemaining -= entry.quantity;
    prod.updatedAtIso = nowIso;
    lineItems.push({
      productId: prod.id,
      title: prod.title,
      imageKey: prod.imageKey,
      unitPrice: prod.price,
      quantity: entry.quantity,
      remainingAfterOrder: prod.stockRemaining,
    });
  }

  const totals = calculateCartTotals(
    cart,
    state.products,
    input.deliveryZone,
    input.promoCode,
    state.ownerConfig.activeHolidayCampaign
  );
  const arrivalInfo = computeExactArrivalInfo(input.deliveryZone, nowDate);
  const zoneMeta = DELIVERY_ZONE_META[input.deliveryZone];
  const payMeta = PAYMENT_METHOD_META[input.paymentMethod];
  const primaryProduct = updatedProducts.find((p) => p.id === lineItems[0].productId)!;
  const ownerPhone = state.ownerConfig.payoutPhone;

  const newOrder: OrderRecord = {
    id: `ord_${suffix.toLowerCase()}`,
    orderCode,
    customerAccountId: input.customerAccountId,
    customerName: input.customerName.trim(),
    customerPhone: input.customerPhone.trim(),
    deliveryAddress: input.deliveryAddress.trim(),
    deliveryZone: input.deliveryZone,
    deliveryFeeUsd: totals.deliveryFeeUsd,
    discountSavedUsd: totals.promoDiscountUsd,
    promoCodeApplied: totals.appliedPromoCode,
    subtotalUsd: totals.subtotalUsd,
    totalUsd: totals.totalUsd,
    paidCurrencyCode: input.paidCurrencyCode || 'USD',
    paidAmountFormatted: input.paidAmountFormatted,
    paymentMethod: input.paymentMethod,
    paymentRef: input.paymentRef.trim().toUpperCase(),
    ownerPayoutPhone: ownerPhone,
    paymentConfirmedAtIso: nowIso,
    oemOrderRef,
    oemSupplier: primaryProduct.oemSupplier,
    logoImprint: ELVORA_BRAND_MOTTO,
    courierName: zoneMeta.courier,
    etaLabel: arrivalInfo.exactTimeLabel,
    expectedArrivalIso: arrivalInfo.arrivalIso,
    status: 'payment_confirmed',
    items: lineItems,
    timeline: [
      {
        status: 'payment_confirmed',
        label: 'Payment Verified to Owner Phone',
        detail: `AI verified $${totals.totalUsd.toFixed(2)} (incl. $${totals.deliveryFeeUsd.toFixed(2)} local delivery) via ${payMeta.label} (${input.paymentRef.trim().toUpperCase()}) to ${ownerPhone}. Scheduled arrival: ${arrivalInfo.exactTimeLabel}.`,
        timestampIso: nowIso,
      },
    ],
    createdAtIso: nowIso,
    updatedAtIso: nowIso,
  };

  const phoneAlert: PhonePaymentNotification = {
    id: `sms_${suffix.toLowerCase()}`,
    orderCode,
    ownerPhone,
    amountUsd: totals.totalUsd,
    paymentMethodLabel: payMeta.label,
    paymentRef: input.paymentRef.trim().toUpperCase(),
    smsBody: `${state.ownerConfig.merchantName.toUpperCase()} PAYOUT CONFIRMED: $${totals.totalUsd.toFixed(2)} received to ${ownerPhone} (${payMeta.label} · Ref ${input.paymentRef.trim().toUpperCase()}) for ${orderCode}. Exact customer arrival: ${arrivalInfo.exactTimeLabel}.`,
    confirmedByAi: true,
    createdAtIso: nowIso,
  };

  const oemOrdersCreated: AlibabaOemOrder[] = [];
  const aiPostsCreated: AiProductPost[] = [];

  for (const item of lineItems) {
    const prod = updatedProducts.find((p) => p.id === item.productId)!;

    if (state.ownerConfig.autoOrderAlibabaOem) {
      const replenishQty =
        prod.stockRemaining <= 5 ? Math.max(15, item.quantity * 5) : item.quantity;
      const isLowStockRestock = prod.stockRemaining <= 5;
      if (isLowStockRestock) {
        prod.stockRemaining += replenishQty;
      }

      const freeAlibabaFreight = prod.alibabaFreeShipping !== false;
      const shippingCost = freeAlibabaFreight ? 0 : 45;
      const freightSaved = freeAlibabaFreight ? 85 : 0;

      oemOrdersCreated.push({
        id: `oem_${suffix.toLowerCase()}_${prod.id}`,
        oemOrderRef: `${oemOrderRef}-${prod.id.slice(-2).toUpperCase()}`,
        supplierName: prod.oemSupplier,
        productTitle: prod.title,
        imageKey: prod.imageKey,
        unitsOrdered: replenishQty,
        unitCostUsd: prod.oemCost,
        alibabaShippingCostUsd: shippingCost,
        freightSavedUsd: freightSaved,
        aiRetailUnitPriceUsd: prod.price,
        totalCostUsd: Number((replenishQty * prod.oemCost + shippingCost).toFixed(2)),
        logoImprint: ELVORA_BRAND_MOTTO,
        triggerReason: isLowStockRestock
          ? 'AI Low-Stock Auto-Replenish'
          : 'Customer Payment Verified',
        linkedOrderCode: orderCode,
        status: 'Submitted to Alibaba Factory',
        createdAtIso: nowIso,
      });
    }

    if (state.ownerConfig.autoPostProductStock) {
      const defaultCaption =
        options?.customAiCaption ??
        `Payment for ${orderCode} confirmed to ${ownerPhone}. ${prod.title} (${ELVORA_BRAND_MOTTO}) priced at $${prod.price} (+$${prod.localDeliveryFeeUsd} local delivery) — ${prod.stockRemaining} units remaining in vault.`;

      aiPostsCreated.push({
        id: `post_${suffix.toLowerCase()}_${prod.id}`,
        productId: prod.id,
        productTitle: prod.title,
        category: prod.category,
        imageKey: prod.imageKey,
        priceUsd: prod.price,
        stockRemaining: prod.stockRemaining,
        oemSupplier: prod.oemSupplier,
        logoImprint: prod.logoImprint,
        ownerPhoneConfirmed: ownerPhone,
        linkedOrderCode: orderCode,
        caption: defaultCaption,
        createdAtIso: nowIso,
      });
    }
  }

  return {
    nextState: {
      ...state,
      products: updatedProducts,
      orders: [newOrder, ...state.orders],
      oemOrders: [...oemOrdersCreated, ...state.oemOrders],
      phoneNotifications: [phoneAlert, ...state.phoneNotifications],
      aiPosts: [...aiPostsCreated, ...state.aiPosts],
    },
    order: newOrder,
    phoneAlert,
    oemOrdersCreated,
    aiPostsCreated,
  };
}

export function createInitialStoreState(): StoreState {
  const baseTime = '2026-10-25T12:00:00.000Z';
  const ownerPhone = '+254 712 890 450';

  const products: ProductItem[] = [
    {
      id: 'prod_combo_01',
      title: 'Elvora Executive Combo: Earpods Pro + Chrono X1 Smartwatch',
      category: 'Combos',
      price: 279,
      originalPrice: 335,
      discountPercent: 17,
      oemCost: 148,
      alibabaFreeShipping: true,
      localDeliveryFeeUsd: 12,
      isCombo: true,
      comboItems: ['Pulse Pods Pro Wireless', 'Chrono X1 Gold-Crown Smartwatch'],
      holidayTag: 'Black Friday Combo',
      ratingAvg: 4.9,
      reviewCount: 42,
      stockRemaining: 14,
      imageKey: 'combo_earpods_watch',
      specs:
        'Matched Black & Champagne-Gold Bundle · Titanium Sapphire GPS Smartwatch + Spatial ANC Wireless Earpods',
      oemSupplier: 'Guangzhou SmartBundle OEM Group (Alibaba Free-Freight Verified)',
      oemOrigin: 'Guangzhou, CN',
      logoImprint: ELVORA_BRAND_MOTTO,
      isPublished: true,
      updatedAtIso: baseTime,
    },
    {
      id: 'prod_buds_gold_02',
      title: 'Elvora Signature Gold Earpods Master Edition',
      category: 'Audio',
      price: 760,
      originalPrice: 845,
      discountPercent: 10,
      oemCost: 400,
      alibabaFreeShipping: true,
      localDeliveryFeeUsd: 12,
      holidayTag: 'Black Friday Offer',
      ratingAvg: 5.0,
      reviewCount: 19,
      stockRemaining: 11,
      imageKey: 'tws_earbuds',
      specs:
        'Reference Beryllium + Planar Dual Drivers · 24K Gold-Plated Acoustic Chamber · -50dB Lossless ANC · CNC Case',
      oemSupplier: 'Shenzhen Goldline Acoustics OEM Ltd. (Alibaba Free-Freight Verified)',
      oemOrigin: 'Shenzhen, CN',
      logoImprint: ELVORA_BRAND_MOTTO,
      isPublished: true,
      updatedAtIso: baseTime,
    },
    {
      id: 'prod_anc_01',
      title: 'Elvora Studio Pro ANC Headphones',
      category: 'Audio',
      price: 189,
      originalPrice: 225,
      discountPercent: 16,
      oemCost: 98,
      alibabaFreeShipping: true,
      localDeliveryFeeUsd: 12,
      holidayTag: 'Black Friday Deal',
      ratingAvg: 4.9,
      reviewCount: 64,
      stockRemaining: 18,
      imageKey: 'anc_headphones',
      specs:
        '48dB Hybrid Active Noise Cancellation · 60h Battery · Anodized Matte Black & Gold Trim · USB-C Lossless',
      oemSupplier: 'Shenzhen Acoustics OEM Co. (Alibaba Free-Freight Verified)',
      oemOrigin: 'Shenzhen, CN',
      logoImprint: ELVORA_BRAND_MOTTO,
      isPublished: true,
      updatedAtIso: baseTime,
    },
    {
      id: 'prod_watch_02',
      title: 'Elvora Chrono X1 Gold-Crown Smartwatch',
      category: 'Wearables',
      price: 245,
      oemCost: 130,
      alibabaFreeShipping: true,
      localDeliveryFeeUsd: 10,
      ratingAvg: 4.8,
      reviewCount: 38,
      stockRemaining: 12,
      imageKey: 'smartwatch_ultra',
      specs:
        '1.95" Sapphire AMOLED · Brushed Gold Crown · Dual-Band GPS · 14-Day Battery · 5ATM Titanium Case',
      oemSupplier: 'Guangzhou Precision Wearables Ltd. (Alibaba Free-Freight Verified)',
      oemOrigin: 'Guangzhou, CN',
      logoImprint: ELVORA_BRAND_MOTTO,
      isPublished: true,
      updatedAtIso: baseTime,
    },
    {
      id: 'prod_laptop_06',
      title: 'Elvora AeroBook 14 2.8K OLED Ultrabook',
      category: 'Computing',
      price: 779,
      originalPrice: 880,
      discountPercent: 11,
      oemCost: 415,
      alibabaFreeShipping: true,
      localDeliveryFeeUsd: 18,
      holidayTag: 'Holiday Deal',
      ratingAvg: 4.9,
      reviewCount: 27,
      stockRemaining: 9,
      imageKey: 'computing_oled_suite',
      specs:
        '14" 2.8K 120Hz OLED · Gold-Chamfer Anodized Black Aluminum · 16GB LPDDR5X · 1TB PCIe 4.0 SSD',
      oemSupplier: 'Shenzhen Precision Compute OEM Ltd. (Alibaba Free-Freight Verified)',
      oemOrigin: 'Shenzhen, CN',
      logoImprint: ELVORA_BRAND_MOTTO,
      isPublished: true,
      updatedAtIso: baseTime,
    },
    {
      id: 'prod_power_07',
      title: 'Elvora Titan 300W Portable GaN Power Station',
      category: 'Power',
      price: 295,
      originalPrice: 345,
      discountPercent: 14,
      oemCost: 156,
      alibabaFreeShipping: true,
      localDeliveryFeeUsd: 16,
      holidayTag: 'Black Friday Deal',
      ratingAvg: 4.9,
      reviewCount: 31,
      stockRemaining: 16,
      imageKey: 'power_solar_station',
      specs:
        '300W AC Outlet + Dual 140W USB-C PD 3.1 · Amber-Gold Live Wattage Display · 56h Router/Laptop Backup',
      oemSupplier: 'Dongguan GaN Power Tech Co. (Alibaba Free-Freight Verified)',
      oemOrigin: 'Dongguan, CN',
      logoImprint: ELVORA_BRAND_MOTTO,
      isPublished: true,
      updatedAtIso: baseTime,
    },
    {
      id: 'prod_combo_05',
      title: 'Elvora Creator Rig Combo: AeroBook 14 + Studio ANC + GaN Core',
      category: 'Combos',
      price: 949,
      originalPrice: 1140,
      discountPercent: 17,
      oemCost: 510,
      alibabaFreeShipping: true,
      localDeliveryFeeUsd: 18,
      isCombo: true,
      comboItems: ['AeroBook 14 OLED', 'Studio Pro ANC Headphones', 'Volt 140W GaN Core'],
      holidayTag: 'Black Friday Bundle',
      ratingAvg: 5.0,
      reviewCount: 15,
      stockRemaining: 7,
      imageKey: 'hero_flagship',
      specs:
        '3-Piece Executive Workstation Bundle · 14" OLED Laptop + Hybrid ANC Headphones + 140W GaN Power Bank',
      oemSupplier: 'Shenzhen Precision Compute OEM Ltd. (Alibaba Free-Freight Verified)',
      oemOrigin: 'Shenzhen, CN',
      logoImprint: ELVORA_BRAND_MOTTO,
      isPublished: true,
      updatedAtIso: baseTime,
    },
    {
      id: 'prod_speaker_09',
      title: 'Elvora Acoustic Goldline Studio Soundbar & Sub',
      category: 'Audio',
      price: 269,
      originalPrice: 315,
      discountPercent: 15,
      oemCost: 142,
      alibabaFreeShipping: true,
      localDeliveryFeeUsd: 15,
      holidayTag: 'Festive Audio Offer',
      ratingAvg: 4.8,
      reviewCount: 23,
      stockRemaining: 13,
      imageKey: 'audio_soundbar_speaker',
      specs:
        'Spatial Cinema Soundbar + Wireless Studio Monitor · Champagne-Gold Acoustic Trim · HDMI eARC + LDAC',
      oemSupplier: 'Foshan Hi-Fi Acoustic Factory (Alibaba Free-Freight Verified)',
      oemOrigin: 'Foshan, CN',
      logoImprint: ELVORA_BRAND_MOTTO,
      isPublished: true,
      updatedAtIso: baseTime,
    },
    {
      id: 'prod_power_03',
      title: 'Elvora Volt 140W GaN Power Core',
      category: 'Power',
      price: 98,
      oemCost: 52,
      alibabaFreeShipping: true,
      localDeliveryFeeUsd: 10,
      ratingAvg: 4.8,
      reviewCount: 51,
      stockRemaining: 27,
      imageKey: 'gan_powerbank',
      specs:
        '27,600mAh Airline-Safe · 140W PD 3.1 Laptop Fast Charge · Smart Digital Remaining Display',
      oemSupplier: 'Dongguan GaN Power Tech Co. (Alibaba Free-Freight Verified)',
      oemOrigin: 'Dongguan, CN',
      logoImprint: ELVORA_BRAND_MOTTO,
      isPublished: true,
      updatedAtIso: baseTime,
    },
    {
      id: 'prod_combo_10',
      title: 'Elvora Commuter Combo: Pulse Earpods + 140W GaN Power Core',
      category: 'Combos',
      price: 165,
      originalPrice: 198,
      discountPercent: 17,
      oemCost: 88,
      alibabaFreeShipping: true,
      localDeliveryFeeUsd: 12,
      isCombo: true,
      comboItems: ['Pulse Pods Pro Wireless', 'Volt 140W GaN Power Core'],
      holidayTag: 'Combo Saver',
      ratingAvg: 4.9,
      reviewCount: 29,
      stockRemaining: 19,
      imageKey: 'combo_earpods_watch',
      specs:
        'All-Day Travel Combo · Graphene ANC Wireless Earpods + 27,600mAh 140W Fast-Charge Power Core',
      oemSupplier: 'Dongguan GaN Power Tech Co. (Alibaba Free-Freight Verified)',
      oemOrigin: 'Dongguan, CN',
      logoImprint: ELVORA_BRAND_MOTTO,
      isPublished: true,
      updatedAtIso: baseTime,
    },
    {
      id: 'prod_tablet_11',
      title: 'Elvora Slate Pro 12.9" 120Hz AMOLED Tablet',
      category: 'Computing',
      price: 479,
      originalPrice: 545,
      discountPercent: 12,
      oemCost: 255,
      alibabaFreeShipping: true,
      localDeliveryFeeUsd: 14,
      ratingAvg: 4.8,
      reviewCount: 21,
      stockRemaining: 10,
      imageKey: 'computing_oled_suite',
      specs:
        '12.9" 120Hz Tandem AMOLED · Magnetic Gold-Trim Stylus · 256GB Storage · 10,200mAh Fast-Charge Battery',
      oemSupplier: 'Shenzhen Precision Compute OEM Ltd. (Alibaba Free-Freight Verified)',
      oemOrigin: 'Shenzhen, CN',
      logoImprint: ELVORA_BRAND_MOTTO,
      isPublished: true,
      updatedAtIso: baseTime,
    },
    {
      id: 'prod_buds_04',
      title: 'Elvora Pulse Pods Pro Wireless',
      category: 'Audio',
      price: 118,
      oemCost: 62,
      alibabaFreeShipping: true,
      localDeliveryFeeUsd: 10,
      ratingAvg: 4.7,
      reviewCount: 47,
      stockRemaining: 24,
      imageKey: 'tws_earbuds',
      specs:
        '11mm Graphene Drivers · Spatial Audio · 6-Mic AI Clear Call · Matte-Black CNC Charging Case',
      oemSupplier: 'Shenzhen Acoustics OEM Co. (Alibaba Free-Freight Verified)',
      oemOrigin: 'Shenzhen, CN',
      logoImprint: ELVORA_BRAND_MOTTO,
      isPublished: true,
      updatedAtIso: baseTime,
    },
    {
      id: 'prod_hub_13',
      title: 'Elvora HyperDock 12-in-1 Gold-Trim Thunderbolt Hub',
      category: 'Computing',
      price: 129,
      oemCost: 68,
      alibabaFreeShipping: true,
      localDeliveryFeeUsd: 10,
      ratingAvg: 4.8,
      reviewCount: 33,
      stockRemaining: 22,
      imageKey: 'computing_oled_suite',
      specs:
        'Dual 4K 60Hz HDMI + DisplayPort · 100W PD Pass-Through · 2.5Gb Ethernet · SD 4.0 Card Reader',
      oemSupplier: 'Shenzhen Precision Compute OEM Ltd. (Alibaba Free-Freight Verified)',
      oemOrigin: 'Shenzhen, CN',
      logoImprint: ELVORA_BRAND_MOTTO,
      isPublished: true,
      updatedAtIso: baseTime,
    },
    {
      id: 'prod_watch_band_14',
      title: 'Elvora Horizon Smart Audio Fitness Band',
      category: 'Wearables',
      price: 139,
      originalPrice: 165,
      discountPercent: 16,
      oemCost: 74,
      alibabaFreeShipping: true,
      localDeliveryFeeUsd: 10,
      holidayTag: 'Holiday Gift Pick',
      ratingAvg: 4.7,
      reviewCount: 26,
      stockRemaining: 20,
      imageKey: 'smartwatch_ultra',
      specs:
        'Continuous SpO2 & ECG Readiness · Curved AMOLED · Brushed Gold Clasp · 18-Day Endurance',
      oemSupplier: 'Guangzhou Precision Wearables Ltd. (Alibaba Free-Freight Verified)',
      oemOrigin: 'Guangzhou, CN',
      logoImprint: ELVORA_BRAND_MOTTO,
      isPublished: true,
      updatedAtIso: baseTime,
    },
    {
      id: 'prod_combo_15',
      title: 'Elvora Fitness Gold Combo: Chrono X1 Smartwatch + GaN Power Core',
      category: 'Combos',
      price: 309,
      originalPrice: 365,
      discountPercent: 15,
      oemCost: 164,
      alibabaFreeShipping: true,
      localDeliveryFeeUsd: 12,
      isCombo: true,
      comboItems: ['Chrono X1 Gold-Crown Smartwatch', 'Volt 140W GaN Power Core'],
      holidayTag: 'Black Friday Combo',
      ratingAvg: 4.9,
      reviewCount: 18,
      stockRemaining: 15,
      imageKey: 'combo_earpods_watch',
      specs:
        'Endurance Athlete & Travel Bundle · Sapphire GPS Smartwatch + 27,600mAh 140W Fast-Charge Core',
      oemSupplier: 'Guangzhou SmartBundle OEM Group (Alibaba Free-Freight Verified)',
      oemOrigin: 'Guangzhou, CN',
      logoImprint: ELVORA_BRAND_MOTTO,
      isPublished: true,
      updatedAtIso: baseTime,
    },
    {
      id: 'prod_power_16',
      title: 'Elvora Goldline 165W Desktop GaN Charging Hub',
      category: 'Power',
      price: 119,
      originalPrice: 142,
      discountPercent: 16,
      oemCost: 63,
      alibabaFreeShipping: true,
      localDeliveryFeeUsd: 10,
      holidayTag: 'Black Friday Deal',
      ratingAvg: 4.8,
      reviewCount: 22,
      stockRemaining: 25,
      imageKey: 'gan_powerbank',
      specs:
        '4-Port USB-C + 2-Port USB-A Desktop GaN Station · Gold-Anodized Bezel · Real-Time Wattage Meter',
      oemSupplier: 'Dongguan GaN Power Tech Co. (Alibaba Free-Freight Verified)',
      oemOrigin: 'Dongguan, CN',
      logoImprint: ELVORA_BRAND_MOTTO,
      isPublished: true,
      updatedAtIso: baseTime,
    },
  ];

  const orders: OrderRecord[] = [
    {
      id: 'ord_8492',
      orderCode: 'ELV-8492',
      customerName: 'David Kimani',
      customerPhone: '+254 722 419 803',
      deliveryAddress: '14 Riverside Drive, Suite 4B, Westlands',
      deliveryZone: 'express_city',
      deliveryFeeUsd: 15,
      subtotalUsd: 287,
      totalUsd: 302,
      paymentMethod: 'mobile_money',
      paymentRef: 'MPESA-884120',
      ownerPayoutPhone: ownerPhone,
      paymentConfirmedAtIso: '2026-10-25T13:15:00.000Z',
      oemOrderRef: 'ALI-OEM-8492',
      oemSupplier: 'Shenzhen Acoustics OEM Co. (Alibaba Free-Freight Verified)',
      logoImprint: ELVORA_BRAND_MOTTO,
      courierName: 'Elvora Goldline Dispatch · Rider #14',
      etaLabel: 'Today at 5:55 PM (Oct 25)',
      expectedArrivalIso: '2026-10-25T17:55:00.000Z',
      status: 'out_for_delivery',
      items: [
        {
          productId: 'prod_anc_01',
          title: 'Elvora Studio Pro ANC Headphones',
          imageKey: 'anc_headphones',
          unitPrice: 189,
          quantity: 1,
          remainingAfterOrder: 18,
        },
        {
          productId: 'prod_power_03',
          title: 'Elvora Volt 140W GaN Power Core',
          imageKey: 'gan_powerbank',
          unitPrice: 98,
          quantity: 1,
          remainingAfterOrder: 27,
        },
      ],
      timeline: [
        {
          status: 'payment_confirmed',
          label: 'Payment Verified to Owner Phone',
          detail: `AI confirmed $302.00 (incl. $15.00 local delivery) via Instant Mobile Money (MPESA-884120) settled to ${ownerPhone}.`,
          timestampIso: '2026-10-25T13:15:00.000Z',
        },
        {
          status: 'oem_branding',
          label: 'Alibaba OEM Branding & QC',
          detail: `Verified "${ELVORA_BRAND_MOTTO}" custom laser imprint from Shenzhen Free-Freight batch.`,
          timestampIso: '2026-10-25T13:42:00.000Z',
        },
        {
          status: 'local_hub',
          label: 'Arrived at Local Delivery Hub',
          detail: 'Dispatched from Central Fulfillment Vault with tamper-evident seal.',
          timestampIso: '2026-10-25T14:30:00.000Z',
        },
        {
          status: 'out_for_delivery',
          label: 'Out for Local Delivery',
          detail:
            'Rider #14 en route to 14 Riverside Drive, Westlands — Exact arrival Today at 5:55 PM.',
          timestampIso: '2026-10-25T15:00:00.000Z',
        },
      ],
      createdAtIso: '2026-10-25T13:15:00.000Z',
      updatedAtIso: '2026-10-25T15:00:00.000Z',
    },
    {
      id: 'ord_8488',
      orderCode: 'ELV-8488',
      customerName: 'Grace Achieng',
      customerPhone: '+254 733 502 119',
      deliveryAddress: 'Kilimani Argwings Kodhek Rd, Apt 9C',
      deliveryZone: 'standard_metro',
      deliveryFeeUsd: 12,
      subtotalUsd: 279,
      totalUsd: 291,
      paymentMethod: 'card_gateway',
      paymentRef: 'AUTH-610492',
      ownerPayoutPhone: ownerPhone,
      paymentConfirmedAtIso: '2026-10-25T11:05:00.000Z',
      oemOrderRef: 'ALI-OEM-8488',
      oemSupplier: 'Guangzhou SmartBundle OEM Group (Alibaba Free-Freight Verified)',
      logoImprint: ELVORA_BRAND_MOTTO,
      courierName: 'Elvora Metro Logistics Van #07',
      etaLabel: 'Tomorrow at 2:30 PM (Oct 26)',
      expectedArrivalIso: '2026-10-26T14:30:00.000Z',
      status: 'oem_branding',
      items: [
        {
          productId: 'prod_combo_01',
          title: 'Elvora Executive Combo: Earpods Pro + Chrono X1 Smartwatch',
          imageKey: 'combo_earpods_watch',
          unitPrice: 279,
          quantity: 1,
          remainingAfterOrder: 14,
        },
      ],
      timeline: [
        {
          status: 'payment_confirmed',
          label: 'Payment Verified to Owner Phone',
          detail: `AI confirmed $291.00 (incl. $12.00 local delivery) via Secure Card Gateway (AUTH-610492) notified to ${ownerPhone}.`,
          timestampIso: '2026-10-25T11:05:00.000Z',
        },
        {
          status: 'oem_branding',
          label: 'Alibaba OEM Branding & QC',
          detail: `Manufacturer order ALI-OEM-8488 stamped with "${ELVORA_BRAND_MOTTO}" ($0 Free Alibaba Shipping).`,
          timestampIso: '2026-10-25T11:20:00.000Z',
        },
      ],
      createdAtIso: '2026-10-25T11:05:00.000Z',
      updatedAtIso: '2026-10-25T11:20:00.000Z',
    },
  ];

  const oemOrders: AlibabaOemOrder[] = [
    {
      id: 'oem_8492_01',
      oemOrderRef: 'ALI-OEM-8492-01',
      supplierName: 'Shenzhen Goldline Acoustics OEM Ltd. (Alibaba Free-Freight Verified)',
      productTitle: 'Elvora Signature Gold Earpods Master Edition',
      imageKey: 'tws_earbuds',
      unitsOrdered: 5,
      unitCostUsd: 400,
      alibabaShippingCostUsd: 0,
      freightSavedUsd: 95,
      aiRetailUnitPriceUsd: 760,
      totalCostUsd: 2000,
      logoImprint: ELVORA_BRAND_MOTTO,
      triggerReason: 'AI New OEM Catalog Launch',
      status: 'Air Freight to Local Hub',
      createdAtIso: '2026-10-25T10:15:05.000Z',
    },
    {
      id: 'oem_8488_02',
      oemOrderRef: 'ALI-OEM-8488-02',
      supplierName: 'Guangzhou SmartBundle OEM Group (Alibaba Free-Freight Verified)',
      productTitle: 'Elvora Executive Combo: Earpods Pro + Chrono X1 Smartwatch',
      imageKey: 'combo_earpods_watch',
      unitsOrdered: 10,
      unitCostUsd: 148,
      alibabaShippingCostUsd: 0,
      freightSavedUsd: 78,
      aiRetailUnitPriceUsd: 279,
      totalCostUsd: 1480,
      logoImprint: ELVORA_BRAND_MOTTO,
      triggerReason: 'Customer Payment Verified',
      linkedOrderCode: 'ELV-8488',
      status: 'Laser Branding QC',
      createdAtIso: '2026-10-25T11:05:08.000Z',
    },
  ];

  const phoneNotifications: PhonePaymentNotification[] = [
    {
      id: 'sms_8492',
      orderCode: 'ELV-8492',
      ownerPhone,
      amountUsd: 302,
      paymentMethodLabel: 'Instant Mobile Money',
      paymentRef: 'MPESA-884120',
      smsBody: `ELVORA GOLDLINE PAYOUT CONFIRMED: $302.00 settled to ${ownerPhone} (Ref MPESA-884120) for ELV-8492. Exact courier arrival: Today at 5:55 PM.`,
      confirmedByAi: true,
      createdAtIso: '2026-10-25T13:15:02.000Z',
    },
    {
      id: 'sms_8488',
      orderCode: 'ELV-8488',
      ownerPhone,
      amountUsd: 291,
      paymentMethodLabel: 'Secure Card Gateway',
      paymentRef: 'AUTH-610492',
      smsBody: `ELVORA GOLDLINE PAYOUT CONFIRMED: $291.00 settled to ${ownerPhone} (Ref AUTH-610492) for ELV-8488. Exact courier arrival: Tomorrow at 2:30 PM.`,
      confirmedByAi: true,
      createdAtIso: '2026-10-25T11:05:03.000Z',
    },
  ];

  const aiPosts: AiProductPost[] = [
    {
      id: 'post_combo_exec',
      productId: 'prod_combo_01',
      productTitle: 'Elvora Executive Combo: Earpods Pro + Chrono X1 Smartwatch',
      category: 'Combos',
      imageKey: 'combo_earpods_watch',
      priceUsd: 279,
      stockRemaining: 14,
      oemSupplier: 'Guangzhou SmartBundle OEM Group (Alibaba Free-Freight Verified)',
      logoImprint: ELVORA_BRAND_MOTTO,
      ownerPhoneConfirmed: ownerPhone,
      linkedOrderCode: 'ELV-8488',
      caption: `Black Friday Combo Drop: Earpods Pro + Chrono X1 Smartwatch bundle ($279, save $56 + $12 local delivery) — 14 combo sets remaining in vault.`,
      createdAtIso: '2026-10-25T11:05:12.000Z',
    },
    {
      id: 'post_gold_earpods',
      productId: 'prod_buds_gold_02',
      productTitle: 'Elvora Signature Gold Earpods Master Edition',
      category: 'Audio',
      imageKey: 'tws_earbuds',
      priceUsd: 760,
      stockRemaining: 11,
      oemSupplier: 'Shenzhen Goldline Acoustics OEM Ltd. (Alibaba Free-Freight Verified)',
      logoImprint: ELVORA_BRAND_MOTTO,
      ownerPhoneConfirmed: ownerPhone,
      caption: `AI sourced with $0 Free Alibaba Freight and auto-priced at $760 (+$12 local delivery). Custom "${ELVORA_BRAND_MOTTO}" edition — 11 units remaining.`,
      createdAtIso: '2026-10-25T10:15:10.000Z',
    },
  ];

  const reviews: CustomerReview[] = [
    {
      id: 'rev_01',
      productId: 'prod_combo_01',
      productTitle: 'Elvora Executive Combo: Earpods Pro + Chrono X1 Smartwatch',
      authorName: 'Daniel Mwangi · Nairobi',
      rating: 5,
      verifiedOrderCode: 'ELV-8410',
      arrivalFeedback: 'Delivered in 2 hrs 35 mins (5 mins ahead of AI estimate)',
      comment:
        'Bought the Earpods + Chrono X1 Smartwatch Black Friday combo. Both arrived in a matte-black & gold box right at 4:15 PM exactly as the AI Concierge promised. Battery life on the watch easily passes 12 days.',
      createdAtIso: '2026-10-24T16:40:00.000Z',
    },
    {
      id: 'rev_02',
      productId: 'prod_buds_gold_02',
      productTitle: 'Elvora Signature Gold Earpods Master Edition',
      authorName: 'Amina Hassan · Westlands',
      rating: 5,
      verifiedOrderCode: 'ELV-8395',
      arrivalFeedback: 'Same-day rider arrived at 3:10 PM sharp',
      comment:
        'Audiophile clarity is unreal—the planar + beryllium drivers rival studio monitors twice the price, and the brushed gold accents on the matte-black case look bespoke.',
      createdAtIso: '2026-10-23T14:20:00.000Z',
    },
    {
      id: 'rev_03',
      productId: 'prod_power_07',
      productTitle: 'Elvora Titan 300W Portable GaN Power Station',
      authorName: 'Kelvin Ochieng · Kilimani',
      rating: 5,
      verifiedOrderCode: 'ELV-8362',
      arrivalFeedback: 'Delivered Next-Day at 2:25 PM',
      comment:
        'Kept two laptops and our studio router running through an 8-hour outage without breaking a sweat. The golden wattage screen tells you exact hours remaining.',
      createdAtIso: '2026-10-22T11:15:00.000Z',
    },
    {
      id: 'rev_04',
      productId: 'prod_laptop_06',
      productTitle: 'Elvora AeroBook 14 2.8K OLED Ultrabook',
      authorName: 'Faith Njoroge · Lavington',
      rating: 5,
      verifiedOrderCode: 'ELV-8340',
      arrivalFeedback: 'Same-day express courier in 2h 40m',
      comment:
        'Prepaid via Mobile Money, got instant confirmation, and the 120Hz OLED display with subtle gold chamfered edges feels ultra-luxury.',
      createdAtIso: '2026-10-20T09:50:00.000Z',
    },
  ];

  const inquiries: SupportInquiry[] = [
    {
      id: 'inq_01',
      senderName: 'Brian Otieno',
      contactInfo: '+254 711 390 224',
      topic: 'combos',
      message:
        'Can we order 5 sets of the Executive Earpods + Smartwatch Combo for our corporate holiday team gifts?',
      status: 'open',
      createdAtIso: '2026-10-25T09:30:00.000Z',
    },
  ];

  const advertisements: MerchantAdvertisement[] = [
    {
      id: 'ad_01',
      title: 'Elvora OEM Vault Partnership',
      description: 'Custom OEM electronics & custom laser logo branding direct from verified free-freight factories.',
      badge: 'Merchant Feature',
      ctaLabel: 'Learn More',
      ctaUrl: '#contact',
      imageUrl: '/src/assets/images/elvora_premium_logo_main_1793003111098.jpg',
      isActive: true,
      impressions: 4820,
      clicks: 294,
      createdAtIso: baseTime,
    },
    {
      id: 'ad_02',
      title: 'Google AdSense Header Network',
      description: 'Automated header ad network banner powered by Google AdSense & Elvora Publisher Ad Engine.',
      badge: 'Ad Network',
      ctaLabel: 'View Network Rates',
      ctaUrl: '#manager',
      isActive: true,
      impressions: 12450,
      clicks: 612,
      createdAtIso: baseTime,
    },
    {
      id: 'ad_03',
      title: '2-in-1 Executive Holiday Bundle',
      description: 'Get $56 off when pairing Earpods Pro with Chrono X1 Smartwatch during Black Friday.',
      badge: 'Sponsored Drop',
      ctaLabel: 'Shop Bundle',
      ctaUrl: '#electronics-catalog',
      imageUrl: '/src/assets/images/elvora_premium_logo_heraldic_1793003110831.jpg',
      isActive: true,
      impressions: 8930,
      clicks: 520,
      createdAtIso: baseTime,
    },
  ];

  return {
    products,
    orders,
    oemOrders,
    phoneNotifications,
    aiPosts,
    reviews,
    inquiries,
    advertisements,
    ownerConfig: {
      merchantName: DEFAULT_BUSINESS_NAME,
      supportEmail: 'concierge@elvora-goldline.com',
      hubAddress: 'Elvora Goldline Vault, 4th Floor, Delta Corner, Westlands',
      ownerEmail: 'bravinbrown8@gmail.com',
      payoutPhone: ownerPhone,
      aiMarkupMultiplier: 1.9,
      activeHolidayCampaign: 'black_friday',
      preferAlibabaFreeShipping: true,
      autoOrderAlibabaOem: true,
      autoPostProductStock: true,
      adsEnabled: true,
      adScriptSnippet: '<!-- Google AdSense Header Script -->\n<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9920192837182938" crossorigin="anonymous"></script>',
      adScriptEnabled: false,
      advertisements: [...advertisements],
      updatedAtIso: baseTime,
    },
  };
}
