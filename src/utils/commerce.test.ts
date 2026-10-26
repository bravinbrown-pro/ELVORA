import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_BUSINESS_NAME,
  ELVORA_BRAND_MOTTO,
  advanceOrderInState,
  calculateCartTotals,
  computeAiRetailPrice,
  computeExactArrivalInfo,
  createInitialStoreState,
  getBuyerSuggestions,
  processVerifiedOrder,
  validateCheckoutInput,
  validateInquiryInput,
  validatePhoneInput,
  validateReviewInput,
} from './commerce';

test('computeAiRetailPrice marks up Alibaba cost into 1.75x-2.0x range (e.g. $400 -> $700-$800)', () => {
  const earpodsPricing = computeAiRetailPrice(400, 1.9, 10);
  assert.ok(earpodsPricing.retailPrice >= 700 && earpodsPricing.retailPrice <= 800);
  assert.equal(earpodsPricing.retailPrice, 760);
  assert.ok((earpodsPricing.originalPrice ?? 0) > earpodsPricing.retailPrice);
  assert.equal(earpodsPricing.grossMarginUsd, 360);

  // Even if low multiplier passed, AI enforces >= 1.75x markup above Alibaba cost
  const floorCheck = computeAiRetailPrice(400, 1.1);
  assert.equal(floorCheck.retailPrice, 700);
});

test('calculateCartTotals always includes positive local delivery cost and applies Black Friday promo code', () => {
  const state = createInitialStoreState();
  assert.equal(state.ownerConfig.merchantName, DEFAULT_BUSINESS_NAME);
  assert.ok(state.products.length >= 12);

  // Signature Gold Earpods ($760 from $400 Alibaba cost) + mandatory local delivery > $0
  const earpodsTotals = calculateCartTotals(
    [{ productId: 'prod_buds_gold_02', quantity: 1 }],
    state.products,
    'express_city'
  );
  assert.equal(earpodsTotals.subtotalUsd, 760);
  assert.ok(earpodsTotals.deliveryFeeUsd > 0);
  assert.equal(earpodsTotals.totalUsd, 760 + earpodsTotals.deliveryFeeUsd);
  assert.match(earpodsTotals.exactArrivalLabel, /at \d{1,2}:\d{2} (AM|PM)/);

  // Applying BLACKFRIDAY promo code gives 10% off merchandise while preserving local delivery fee
  const holidayTotals = calculateCartTotals(
    [{ productId: 'prod_combo_01', quantity: 1 }],
    state.products,
    'standard_metro',
    'blackfriday',
    'black_friday'
  );
  assert.equal(holidayTotals.appliedPromoCode, 'BLACKFRIDAY');
  assert.equal(holidayTotals.promoDiscountUsd, 27.9);
  assert.ok(holidayTotals.deliveryFeeUsd > 0);
});

test('computeExactArrivalInfo returns exact clock time inside courier operating hours', () => {
  const refDate = new Date(2026, 9, 25, 13, 10, 0);
  const express = computeExactArrivalInfo('express_city', refDate);
  assert.match(express.exactTimeLabel, /Today at \d{1,2}:\d{2} PM/);
  assert.ok(new Date(express.arrivalIso).getTime() > refDate.getTime());

  // Late-night orders roll cleanly to 8:45 AM morning courier wave instead of 1:30 AM
  const lateNight = new Date(2026, 9, 25, 22, 40, 0);
  const nextMorning = computeExactArrivalInfo('express_city', lateNight);
  assert.match(nextMorning.exactTimeLabel, /Tomorrow at 8:45 AM/);
  assert.equal(nextMorning.shortDayClockLabel, '8:45 AM Tomorrow');
});

test('getBuyerSuggestions returns combos and holiday discounts', () => {
  const state = createInitialStoreState();
  const combos = getBuyerSuggestions(state.products, 'combo_bundles');
  assert.ok(combos.length >= 2);
  assert.ok(combos.every((c) => c.product.category === 'Combos' || c.product.isCombo));

  const deals = getBuyerSuggestions(state.products, 'holiday_discounts');
  assert.ok(deals.length >= 2);
  assert.ok(deals.every((d) => (d.product.discountPercent ?? 0) > 0));
});

test('validateCheckoutInput, validateReviewInput, and validateInquiryInput reject invalid inputs', () => {
  const emptyErrors = validateCheckoutInput(
    {
      customerName: '',
      customerPhone: '',
      deliveryAddress: '',
      deliveryZone: 'express_city',
      paymentMethod: 'mobile_money',
      paymentRef: '',
    },
    []
  );

  assert.ok(emptyErrors.cart);
  assert.ok(emptyErrors.customerName);
  assert.ok(emptyErrors.customerPhone);
  assert.ok(emptyErrors.deliveryAddress);
  assert.ok(emptyErrors.paymentRef);

  assert.ok(validatePhoneInput('abc'));
  assert.equal(validatePhoneInput('+254 712 890 450'), undefined);

  assert.ok(
    validateReviewInput({
      productId: '',
      authorName: 'A',
      rating: 5,
      comment: 'Short',
    })
  );
  assert.equal(
    validateReviewInput({
      productId: 'prod_combo_01',
      authorName: 'Sarah K.',
      rating: 5,
      comment: 'Arrived right on time with amazing sound quality!',
    }),
    undefined
  );

  assert.ok(
    validateInquiryInput({
      senderName: '',
      contactInfo: '12',
      topic: 'delivery',
      message: 'hi',
    })
  );
  assert.equal(
    validateInquiryInput({
      senderName: 'Peter Omondi',
      contactInfo: '+254 720 111 222',
      topic: 'combos',
      message: 'Need 3 Earpods + Smartwatch combos delivered tomorrow.',
    }),
    undefined
  );
});

test('processVerifiedOrder confirms payment + delivery fee to owner phone, records exact arrival time, and logs $0 Free Alibaba Freight OEM order', () => {
  const initial = createInitialStoreState();
  const initialStock = initial.products.find((p) => p.id === 'prod_anc_01')!.stockRemaining;

  const result = processVerifiedOrder(
    initial,
    {
      customerName: 'Nadia Mwangi',
      customerPhone: '+254 701 234 567',
      deliveryAddress: 'Lavington James Gichuru Road, House 12',
      deliveryZone: 'express_city',
      paymentMethod: 'mobile_money',
      paymentRef: 'mpesa-775210',
    },
    [{ productId: 'prod_anc_01', quantity: 2 }],
    { orderCodeSuffix: '9104', nowIso: '2026-10-25T13:00:00.000Z' }
  );

  assert.equal(result.order.orderCode, 'ELV-9104');
  assert.ok(result.order.deliveryFeeUsd > 0);
  assert.equal(result.order.totalUsd, 378 + result.order.deliveryFeeUsd);
  assert.equal(result.order.ownerPayoutPhone, initial.ownerConfig.payoutPhone);
  assert.equal(result.order.logoImprint, ELVORA_BRAND_MOTTO);
  assert.match(result.order.etaLabel, /at \d{1,2}:\d{2} (AM|PM)/);

  const updatedProd = result.nextState.products.find((p) => p.id === 'prod_anc_01')!;
  assert.equal(updatedProd.stockRemaining, initialStock - 2);

  assert.equal(result.oemOrdersCreated.length, 1);
  assert.equal(result.oemOrdersCreated[0].alibabaShippingCostUsd, 0);
  assert.ok((result.oemOrdersCreated[0].freightSavedUsd ?? 0) > 0);
  assert.equal(result.aiPostsCreated.length, 1);
  assert.equal(result.aiPostsCreated[0].stockRemaining, initialStock - 2);
});

test('advanceOrderInState progresses real-time delivery stages through to delivered', () => {
  const initial = createInitialStoreState();
  const step1 = advanceOrderInState(initial, 'ELV-8488');
  assert.equal(step1.orders.find((o) => o.orderCode === 'ELV-8488')?.status, 'local_hub');

  const step2 = advanceOrderInState(step1, 'ELV-8488');
  assert.equal(step2.orders.find((o) => o.orderCode === 'ELV-8488')?.status, 'out_for_delivery');

  const step3 = advanceOrderInState(step2, 'ELV-8488');
  assert.equal(step3.orders.find((o) => o.orderCode === 'ELV-8488')?.status, 'delivered');
});
