import { FormEvent, useEffect, useState } from 'react';
import { Clock, Lock, Minus, Plus, Tag, Trash2, X } from 'lucide-react';
import {
  CartEntry,
  CheckoutFormInput,
  DELIVERY_ZONE_META,
  DeliveryZone,
  HOLIDAY_CAMPAIGNS,
  HolidayCampaignId,
  PAYMENT_METHOD_META,
  PaymentMethod,
  ProductItem,
  ValidationErrors,
  calculateCartTotals,
  computeExactArrivalInfo,
  getBuyerSuggestions,
  validateCheckoutInput,
} from '../utils/commerce';
import { CustomerAccountPublic } from '../utils/customerAccount';
import { ProductMedia } from './ProductMedia';
import { ElvoraEmblem } from './ElvoraLogo';

interface CartCheckoutDrawerProps {
  isOpen: boolean;
  cart: CartEntry[];
  products: ProductItem[];
  businessName: string;
  ownerPayoutPhone: string;
  activeCampaignId: HolidayCampaignId;
  appliedPromoCode: string;
  submitting: boolean;
  formatPrice?: (amountUsd: number) => string;
  customer?: CustomerAccountPublic | null;
  onPromoCodeChange: (code: string) => void;
  onAddSuggestedProduct: (product: ProductItem) => void;
  onClose: () => void;
  onUpdateQty: (productId: string, nextQty: number) => void;
  onSubmitOrder: (checkout: CheckoutFormInput) => Promise<void>;
}

export function CartCheckoutDrawer({
  isOpen,
  cart,
  products,
  businessName,
  ownerPayoutPhone,
  activeCampaignId,
  appliedPromoCode,
  submitting,
  formatPrice,
  customer,
  onPromoCodeChange,
  onAddSuggestedProduct,
  onClose,
  onUpdateQty,
  onSubmitOrder,
}: CartCheckoutDrawerProps) {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryZone, setDeliveryZone] = useState<DeliveryZone>('express_city');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('mobile_money');
  const [paymentRef, setPaymentRef] = useState('');
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);

  const displayPrice = (usd: number) => (formatPrice ? formatPrice(usd) : `$${usd.toFixed(2)}`);

  useEffect(() => {
    if (customer) {
      if (customer.fullName && !customerName) setCustomerName(customer.fullName);
      if (customer.phone && !customerPhone) setCustomerPhone(customer.phone);
      if (customer.defaultAddress && !deliveryAddress) setDeliveryAddress(customer.defaultAddress);
    }
  }, [customer]);

  if (!isOpen) return null;

  const activeCampaign = HOLIDAY_CAMPAIGNS[activeCampaignId] ?? HOLIDAY_CAMPAIGNS.black_friday;
  const totals = calculateCartTotals(
    cart,
    products,
    deliveryZone,
    appliedPromoCode,
    activeCampaignId
  );

  const detailedItems = cart
    .map((entry) => {
      const product = products.find((p) => p.id === entry.productId);
      return product ? { product, quantity: entry.quantity } : null;
    })
    .filter((item): item is { product: ProductItem; quantity: number } => item !== null);

  const cartIds = cart.map((c) => c.productId);
  const bagSuggestion = getBuyerSuggestions(products, 'combo_bundles', cartIds)[0];

  const generateInstantRef = () => {
    const prefix =
      paymentMethod === 'mobile_money'
        ? 'MPESA'
        : paymentMethod === 'card_gateway'
          ? 'AUTH'
          : 'EFT';
    const code = `${prefix}-${Math.floor(100000 + Math.random() * 899999)}`;
    setPaymentRef(code);
    setErrors((prev) => ({ ...prev, paymentRef: undefined }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setServerError(null);

    const payload: CheckoutFormInput = {
      customerName,
      customerPhone,
      deliveryAddress,
      deliveryZone,
      paymentMethod,
      paymentRef,
      promoCode: appliedPromoCode.trim() || undefined,
    };

    const validation = validateCheckoutInput(payload, cart);
    if (Object.keys(validation).length > 0) {
      setErrors(validation);
      return;
    }

    setErrors({});
    try {
      await onSubmitOrder(payload);
      setCustomerName('');
      setCustomerPhone('');
      setDeliveryAddress('');
      setPaymentRef('');
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Payment confirmation failed.');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="checkout-drawer-title"
      className="fixed inset-0 z-50 flex justify-end bg-black/75 backdrop-blur-sm"
    >
      <div className="flex h-full w-full max-w-lg flex-col border-l border-[var(--elv-border-strong)] bg-[var(--elv-surface)] text-[var(--elv-text-body)] shadow-2xl">
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-[var(--elv-border)] px-6 py-4">
          <div className="flex items-center gap-3">
            <ElvoraEmblem size="sm" interactive={false} />
            <div>
              <h2
                id="checkout-drawer-title"
                className="font-display text-lg font-bold text-[var(--elv-text-strong)]"
              >
                Shopping Bag &amp; Prepaid Checkout
              </h2>
              <p className="text-xs text-[var(--elv-text-muted)]">
                {businessName} · Paid to {ownerPayoutPhone}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close shopping bag"
            className="elv-btn-outline flex min-h-[42px] min-w-[42px] items-center justify-center rounded-lg"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {detailedItems.length === 0 ? (
            <div className="py-16 text-center space-y-4">
              <p className="font-display text-lg font-semibold text-[var(--elv-text-strong)]">
                Your Elvora bag is empty
              </p>
              <p className="text-sm text-[var(--elv-text-muted)]">
                Explore custom OEM electronics, Earpods + Smartwatch combos, and Black Friday deals.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="elv-btn-gold inline-flex min-h-[44px] items-center justify-center rounded-lg px-5 py-2 text-xs font-semibold"
              >
                Browse Electronics &amp; Combos
              </button>
            </div>
          ) : (
            <>
              {/* Exact Arrival Banner */}
              <div className="elv-panel flex items-center justify-between gap-2 rounded-xl px-4 py-3 text-xs">
                <div className="flex items-center gap-2">
                  <Clock
                    className="h-4 w-4 text-[var(--elv-text-gold)] shrink-0"
                    aria-hidden="true"
                  />
                  <span className="text-[var(--elv-text-body)]">Exact Scheduled Arrival:</span>
                </div>
                <span className="font-semibold text-[var(--elv-text-gold)]">
                  {totals.exactArrivalLabel}
                </span>
              </div>

              {/* Itemized Cart */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-[var(--elv-text-muted)]">
                  <span>Selected Items ({totals.totalUnits})</span>
                  <span>Local Delivery Fee: +{displayPrice(totals.deliveryFeeUsd)}</span>
                </div>

                <ul className="divide-y divide-[var(--elv-border)] border-y border-[var(--elv-border)]">
                  {detailedItems.map(({ product, quantity }) => (
                    <li key={product.id} className="flex items-center gap-4 py-4">
                      <div className="h-16 w-20 shrink-0 overflow-hidden rounded-lg border border-[var(--elv-border)]">
                        <ProductMedia
                          imageKey={product.imageKey}
                          alt={product.title}
                          aspectClass="h-full w-full"
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate font-display text-sm font-semibold text-[var(--elv-text-strong)]">
                          {product.title}
                        </p>
                        <p className="mt-0.5 font-mono text-xs text-[var(--elv-text-gold)] tabular-nums">
                          {displayPrice(product.price)} each · {product.stockRemaining} left
                        </p>

                        <div className="mt-2 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => onUpdateQty(product.id, quantity - 1)}
                            aria-label={`Decrease quantity of ${product.title}`}
                            className="elv-btn-outline flex h-9 w-9 min-h-[36px] min-w-[36px] items-center justify-center rounded"
                          >
                            <Minus className="h-3.5 w-3.5" aria-hidden="true" />
                          </button>
                          <span className="w-7 text-center font-mono text-xs font-semibold text-[var(--elv-text-strong)] tabular-nums">
                            {quantity}
                          </span>
                          <button
                            type="button"
                            disabled={quantity >= product.stockRemaining}
                            onClick={() => onUpdateQty(product.id, quantity + 1)}
                            aria-label={`Increase quantity of ${product.title}`}
                            className="elv-btn-outline flex h-9 w-9 min-h-[36px] min-w-[36px] items-center justify-center rounded disabled:opacity-40"
                          >
                            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onUpdateQty(product.id, 0)}
                            aria-label={`Remove ${product.title} from bag`}
                            className="ml-auto flex h-9 w-9 items-center justify-center rounded text-[var(--elv-text-muted)] hover:text-[var(--elv-text-strong)]"
                          >
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Holiday Promo Code Box */}
              <div className="elv-panel rounded-xl p-3.5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="inline-flex items-center gap-1.5 font-semibold text-[var(--elv-text-strong)]">
                    <Tag className="h-3.5 w-3.5 text-[var(--elv-text-gold)]" aria-hidden="true" />
                    <span>Holiday Offer Code</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => onPromoCodeChange(activeCampaign.promoCode)}
                    className="font-mono text-[11px] font-semibold text-[var(--elv-text-gold)] underline"
                  >
                    Tap for {activeCampaign.promoCode} (-{activeCampaign.extraDiscountPercent}%)
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <label htmlFor="checkout-promo-code" className="sr-only">
                    Holiday promo code
                  </label>
                  <input
                    id="checkout-promo-code"
                    type="text"
                    value={appliedPromoCode}
                    onChange={(e) => onPromoCodeChange(e.target.value)}
                    placeholder={`e.g. ${activeCampaign.promoCode}`}
                    className="elv-input min-h-[40px] flex-1 rounded-lg px-3 font-mono text-xs uppercase"
                  />
                  {totals.appliedPromoCode && (
                    <span className="font-mono text-xs font-semibold text-[var(--elv-text-gold)] whitespace-nowrap">
                      -{displayPrice(totals.promoDiscountUsd)} saved
                    </span>
                  )}
                </div>
              </div>

              {/* Complementary Bag Suggestion */}
              {bagSuggestion && (
                <div className="elv-panel flex items-center justify-between gap-3 rounded-xl p-3.5">
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold text-[var(--elv-text-gold)]">
                      Suggested Bundle Add-On
                    </p>
                    <p className="truncate text-xs font-medium text-[var(--elv-text-strong)]">
                      {bagSuggestion.product.title} ({displayPrice(bagSuggestion.product.price)})
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onAddSuggestedProduct(bagSuggestion.product)}
                    className="elv-btn-outline min-h-[36px] rounded-lg px-3 py-1 text-xs font-semibold whitespace-nowrap shrink-0"
                  >
                    + Add
                  </button>
                </div>
              )}

              {/* Validated Prepaid Checkout Form */}
              <form
                id="elvora-checkout-form"
                onSubmit={handleSubmit}
                noValidate
                className="space-y-5"
              >
                <div className="space-y-4">
                  <h3 className="font-display text-sm font-semibold text-[var(--elv-text-strong)]">
                    1. Local Delivery &amp; Exact Arrival Option
                  </h3>

                  <div>
                    <label
                      htmlFor="checkout-name"
                      className="block text-xs font-medium text-[var(--elv-text-body)] mb-1.5"
                    >
                      Recipient Full Name
                    </label>
                    <input
                      id="checkout-name"
                      type="text"
                      value={customerName}
                      onChange={(e) => {
                        setCustomerName(e.target.value);
                        if (errors.customerName) setErrors({ ...errors, customerName: undefined });
                      }}
                      placeholder="e.g. Nadia Mwangi"
                      className="elv-input min-h-[44px] w-full rounded-lg px-3.5 text-sm"
                    />
                    {errors.customerName && (
                      <p role="alert" className="mt-1 text-xs font-medium text-[var(--elv-text-gold)]">
                        {errors.customerName}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="checkout-phone"
                      className="block text-xs font-medium text-[var(--elv-text-body)] mb-1.5"
                    >
                      Customer Contact Phone
                    </label>
                    <input
                      id="checkout-phone"
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => {
                        setCustomerPhone(e.target.value);
                        if (errors.customerPhone)
                          setErrors({ ...errors, customerPhone: undefined });
                      }}
                      placeholder="e.g. +254 701 234 567"
                      className="elv-input min-h-[44px] w-full rounded-lg px-3.5 text-sm"
                    />
                    {errors.customerPhone && (
                      <p role="alert" className="mt-1 text-xs font-medium text-[var(--elv-text-gold)]">
                        {errors.customerPhone}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="checkout-address"
                      className="block text-xs font-medium text-[var(--elv-text-body)] mb-1.5"
                    >
                      Street &amp; Neighborhood Address
                    </label>
                    <input
                      id="checkout-address"
                      type="text"
                      value={deliveryAddress}
                      onChange={(e) => {
                        setDeliveryAddress(e.target.value);
                        if (errors.deliveryAddress)
                          setErrors({ ...errors, deliveryAddress: undefined });
                      }}
                      placeholder="e.g. 14 Riverside Drive, Westlands"
                      className="elv-input min-h-[44px] w-full rounded-lg px-3.5 text-sm"
                    />
                    {errors.deliveryAddress && (
                      <p role="alert" className="mt-1 text-xs font-medium text-[var(--elv-text-gold)]">
                        {errors.deliveryAddress}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="checkout-zone"
                      className="block text-xs font-medium text-[var(--elv-text-body)] mb-1.5"
                    >
                      Courier Tier (Delivery Cost &amp; Exact Arrival Time)
                    </label>
                    <select
                      id="checkout-zone"
                      value={deliveryZone}
                      onChange={(e) => setDeliveryZone(e.target.value as DeliveryZone)}
                      className="elv-input min-h-[44px] w-full rounded-lg px-3.5 text-xs sm:text-sm"
                    >
                      {(Object.keys(DELIVERY_ZONE_META) as DeliveryZone[]).map((z) => {
                        const zoneTotals = calculateCartTotals(
                          cart,
                          products,
                          z,
                          appliedPromoCode,
                          activeCampaignId
                        );
                        const arrival = computeExactArrivalInfo(z);
                        return (
                          <option key={z} value={z}>
                            {DELIVERY_ZONE_META[z].label} (+${zoneTotals.deliveryFeeUsd} · Arrives{' '}
                            {arrival.exactTimeLabel})
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>

                {/* Secure Payment Gateway */}
                <div className="space-y-4 border-t border-[var(--elv-border)] pt-5">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-sm font-semibold text-[var(--elv-text-strong)]">
                      2. Secure Prepaid Settlement
                    </h3>
                    <span className="text-xs text-[var(--elv-text-muted)]">Prepaid Only</span>
                  </div>

                  <p className="text-xs leading-relaxed text-[var(--elv-text-muted)]">
                    Send{' '}
                    <strong className="font-mono text-[var(--elv-text-gold)]">
                      ${totals.totalUsd.toFixed(2)}
                    </strong>{' '}
                    (includes ${totals.deliveryFeeUsd.toFixed(2)} local courier fee) to{' '}
                    <strong className="font-mono text-[var(--elv-text-strong)]">
                      {ownerPayoutPhone}
                    </strong>
                    . AI confirms your payment reference immediately and schedules arrival for{' '}
                    <strong className="text-[var(--elv-text-gold)]">
                      {totals.exactArrivalLabel}
                    </strong>
                    .
                  </p>

                  <div className="grid grid-cols-1 gap-2">
                    {(Object.keys(PAYMENT_METHOD_META) as PaymentMethod[]).map((method) => {
                      const active = paymentMethod === method;
                      const meta = PAYMENT_METHOD_META[method];
                      return (
                        <button
                          key={method}
                          type="button"
                          onClick={() => setPaymentMethod(method)}
                          className={`flex min-h-[48px] flex-col items-start rounded-lg border px-4 py-2.5 text-left transition-colors ${
                            active
                              ? 'border-[var(--elv-text-gold)] bg-[var(--elv-surface-alt)] text-[var(--elv-text-strong)]'
                              : 'border-[var(--elv-border)] text-[var(--elv-text-muted)] hover:border-[var(--elv-border-strong)]'
                          }`}
                        >
                          <span className="text-xs font-semibold">{meta.label}</span>
                          <span className="text-[11px] text-[var(--elv-text-muted)]">
                            {meta.description}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label
                        htmlFor="checkout-payment-ref"
                        className="text-xs font-medium text-[var(--elv-text-body)]"
                      >
                        Transaction / Mobile Money Reference
                      </label>
                      <button
                        type="button"
                        onClick={generateInstantRef}
                        className="text-xs font-semibold text-[var(--elv-text-gold)] underline"
                      >
                        Authorize Instant Pay
                      </button>
                    </div>
                    <input
                      id="checkout-payment-ref"
                      type="text"
                      value={paymentRef}
                      onChange={(e) => {
                        setPaymentRef(e.target.value);
                        if (errors.paymentRef) setErrors({ ...errors, paymentRef: undefined });
                      }}
                      placeholder={PAYMENT_METHOD_META[paymentMethod].refPlaceholder}
                      className="elv-input min-h-[44px] w-full rounded-lg px-3.5 font-mono text-sm uppercase"
                    />
                    {errors.paymentRef && (
                      <p role="alert" className="mt-1 text-xs font-medium text-[var(--elv-text-gold)]">
                        {errors.paymentRef}
                      </p>
                    )}
                  </div>
                </div>

                {errors.cart && (
                  <p role="alert" className="text-xs font-medium text-[var(--elv-text-gold)]">
                    {errors.cart}
                  </p>
                )}

                {serverError && (
                  <p
                    role="alert"
                    className="elv-panel rounded-lg p-3 text-xs font-medium text-[var(--elv-text-gold)]"
                  >
                    {serverError}
                  </p>
                )}
              </form>
            </>
          )}
        </div>

        {/* Sticky Checkout Summary Footer */}
        {detailedItems.length > 0 && (
          <div className="border-t border-[var(--elv-border)] bg-[var(--elv-surface)] px-6 py-4 space-y-3">
            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-[var(--elv-text-muted)]">
                <span>Merchandise Subtotal</span>
                <span className="font-mono tabular-nums text-[var(--elv-text-body)]">
                  {displayPrice(totals.subtotalUsd)}
                </span>
              </div>
              {totals.promoDiscountUsd > 0 && (
                <div className="flex justify-between text-[var(--elv-text-gold)]">
                  <span>Holiday Promo ({totals.appliedPromoCode})</span>
                  <span className="font-mono tabular-nums">
                    -{displayPrice(totals.promoDiscountUsd)}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-[var(--elv-text-muted)]">
                <span>Local Delivery Cost ({DELIVERY_ZONE_META[deliveryZone].label})</span>
                <span className="font-mono tabular-nums text-[var(--elv-text-strong)]">
                  +{displayPrice(totals.deliveryFeeUsd)}
                </span>
              </div>
              <div className="flex justify-between pt-1.5 text-sm font-semibold text-[var(--elv-text-strong)]">
                <span>Total Prepaid Amount</span>
                <span className="font-mono tabular-nums text-[var(--elv-text-gold)]">
                  {displayPrice(totals.totalUsd)}
                </span>
              </div>
            </div>

            <button
              type="submit"
              form="elvora-checkout-form"
              disabled={submitting}
              className="elv-btn-gold flex min-h-[48px] w-full items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-semibold transition-colors disabled:opacity-50 whitespace-nowrap"
            >
              <Lock className="h-4 w-4" aria-hidden="true" />
              <span>
                {submitting
                  ? 'AI Verifying Payment & Scheduling Courier...'
                  : `Verify Payment & Order · ${displayPrice(totals.totalUsd)}`}
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

