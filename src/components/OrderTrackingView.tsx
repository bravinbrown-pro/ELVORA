import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Check, Clock, Package, Search, Truck } from 'lucide-react';
import {
  DELIVERY_ZONE_META,
  ORDER_STATUS_STEPS,
  OrderRecord,
  PAYMENT_METHOD_META,
} from '../utils/commerce';
import { ProductMedia } from './ProductMedia';
import { ElvoraEmblem } from './ElvoraLogo';

interface OrderTrackingViewProps {
  orders: OrderRecord[];
  businessName: string;
  initialOrderCode?: string | null;
  formatPrice?: (usd: number) => string;
  onBackToCatalog: () => void;
}

export function OrderTrackingView({
  orders,
  businessName,
  initialOrderCode,
  formatPrice,
  onBackToCatalog,
}: OrderTrackingViewProps) {
  const [lookupInput, setLookupInput] = useState(initialOrderCode ?? orders[0]?.orderCode ?? '');
  const [selectedCode, setSelectedCode] = useState(
    initialOrderCode ?? orders[0]?.orderCode ?? ''
  );

  useEffect(() => {
    if (initialOrderCode) {
      setSelectedCode(initialOrderCode);
      setLookupInput(initialOrderCode);
    }
  }, [initialOrderCode]);

  const activeOrder = useMemo(() => {
    const normalized = selectedCode.trim().toUpperCase();
    return (
      orders.find((o) => o.orderCode.toUpperCase() === normalized) ??
      (initialOrderCode
        ? orders.find((o) => o.orderCode.toUpperCase() === initialOrderCode.toUpperCase())
        : undefined) ??
      orders[0]
    );
  }, [orders, selectedCode, initialOrderCode]);

  const handleLookup = (e: FormEvent) => {
    e.preventDefault();
    if (lookupInput.trim()) {
      setSelectedCode(lookupInput.trim().toUpperCase());
    }
  };

  const currentStageIndex = activeOrder
    ? ORDER_STATUS_STEPS.findIndex((s) => s.status === activeOrder.status)
    : -1;

  const displayPrice = (val: number) => (formatPrice ? formatPrice(val) : `$${val.toFixed(2)}`);

  return (
    <div className="space-y-10 py-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-[var(--elv-border)] pb-6">
        <div className="flex items-start gap-4">
          <ElvoraEmblem size="md" interactive={false} />
          <div>
            <p className="text-xs font-medium text-[var(--elv-text-gold)]">
              {businessName} · Official Dispatch Telemetry
            </p>
            <h1 className="mt-1 font-display text-2xl sm:text-3xl font-bold text-[var(--elv-text-strong)]">
              Real-Time Order &amp; Exact Arrival Tracking
            </h1>
            <p className="mt-1 text-sm text-[var(--elv-text-muted)]">
              Track verified payment settlement, custom Alibaba OEM quality inspection, and exact
              scheduled doorstep arrival time.
            </p>
          </div>
        </div>

        <form onSubmit={handleLookup} className="flex items-center gap-2">
          <label htmlFor="order-code-search" className="sr-only">
            Enter Elvora Order Code
          </label>
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--elv-text-muted)]"
              aria-hidden="true"
            />
            <input
              id="order-code-search"
              type="text"
              value={lookupInput}
              onChange={(e) => setLookupInput(e.target.value)}
              placeholder="e.g. ELV-8492"
              className="elv-input min-h-[44px] w-44 sm:w-52 rounded-lg pl-9 pr-3 font-mono text-sm uppercase"
            />
          </div>
          <button
            type="submit"
            className="elv-btn-gold min-h-[44px] rounded-lg px-4 py-2 text-xs font-semibold whitespace-nowrap shrink-0"
          >
            Track Order
          </button>
        </form>
      </div>

      {/* Quick Order Switcher */}
      {orders.length > 0 && (
        <div
          className="flex items-center gap-2 overflow-x-auto pb-1"
          role="group"
          aria-label="Recent orders"
        >
          {orders.map((order) => {
            const isSelected = activeOrder?.orderCode === order.orderCode;
            return (
              <button
                key={order.id}
                type="button"
                onClick={() => {
                  setSelectedCode(order.orderCode);
                  setLookupInput(order.orderCode);
                }}
                className={`min-h-[42px] rounded-lg px-3.5 py-2 font-mono text-xs transition-colors whitespace-nowrap shrink-0 ${
                  isSelected ? 'elv-btn-gold font-semibold' : 'elv-btn-outline'
                }`}
              >
                {order.orderCode} · {displayPrice(order.totalUsd)}
              </button>
            );
          })}
        </div>
      )}

      {!activeOrder ? (
        <div className="elv-card rounded-2xl p-12 text-center space-y-4">
          <Package className="mx-auto h-8 w-8 text-[var(--elv-text-gold)]" aria-hidden="true" />
          <p className="font-display text-lg font-semibold text-[var(--elv-text-strong)]">
            No orders found
          </p>
          <button
            type="button"
            onClick={onBackToCatalog}
            className="elv-btn-gold inline-flex min-h-[44px] items-center justify-center rounded-lg px-5 py-2 text-xs font-semibold"
          >
            Explore Electronics Catalog
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left 8 Columns: 5-Stage Progress Pipeline & Live Timeline */}
          <div className="lg:col-span-8 elv-card space-y-8 rounded-2xl p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--elv-border)] pb-6">
              <div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--elv-text-muted)]">
                  <span className="font-mono font-semibold text-[var(--elv-text-gold)]">
                    {activeOrder.orderCode}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{PAYMENT_METHOD_META[activeOrder.paymentMethod].label}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono">{activeOrder.paymentRef}</span>
                </div>
                <h2 className="mt-1.5 font-display text-xl sm:text-2xl font-bold text-[var(--elv-text-strong)]">
                  {ORDER_STATUS_STEPS[currentStageIndex]?.label ?? 'Order Confirmed'}
                </h2>
              </div>

              <div className="elv-panel rounded-xl px-4 py-3 text-left sm:text-right">
                <p className="inline-flex items-center gap-1.5 text-xs text-[var(--elv-text-muted)]">
                  <Clock className="h-3.5 w-3.5 text-[var(--elv-text-gold)]" aria-hidden="true" />
                  <span>Exact Scheduled Arrival</span>
                </p>
                <p className="mt-0.5 text-sm font-bold text-[var(--elv-text-gold)]">
                  {activeOrder.etaLabel}
                </p>
              </div>
            </div>

            {/* 5-Step Progress Indicator */}
            <ol
              className="grid grid-cols-1 sm:grid-cols-5 gap-3"
              aria-label="Order fulfillment stages"
            >
              {ORDER_STATUS_STEPS.map((step, index) => {
                const completed = index <= currentStageIndex;
                const isCurrent = index === currentStageIndex;
                return (
                  <li
                    key={step.status}
                    className={`rounded-xl border p-3.5 transition-colors ${
                      isCurrent
                        ? 'border-[var(--elv-text-gold)] bg-[var(--elv-surface-alt)] text-[var(--elv-text-strong)]'
                        : completed
                          ? 'border-[var(--elv-border-strong)] bg-[var(--elv-surface)] text-[var(--elv-text-body)]'
                          : 'border-[var(--elv-border)] opacity-60 text-[var(--elv-text-muted)]'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span>0{index + 1}</span>
                      {completed && (
                        <Check
                          className="h-3.5 w-3.5 text-[var(--elv-text-gold)]"
                          aria-hidden="true"
                        />
                      )}
                    </div>
                    <p className="mt-2 text-xs font-semibold leading-snug">{step.shortLabel}</p>
                    <p className="mt-0.5 text-[11px] text-[var(--elv-text-muted)]">
                      {isCurrent ? 'Current Stage' : completed ? 'Completed' : 'Upcoming'}
                    </p>
                  </li>
                );
              })}
            </ol>

            {/* Detailed Courier & OEM Metadata */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 border-y border-[var(--elv-border)] py-6 text-xs">
              <div className="space-y-1.5">
                <p className="text-[var(--elv-text-muted)]">Local Delivery Destination</p>
                <p className="font-semibold text-[var(--elv-text-strong)]">
                  {activeOrder.customerName}
                </p>
                <p className="text-[var(--elv-text-body)]">{activeOrder.deliveryAddress}</p>
                <p className="font-mono text-[var(--elv-text-muted)]">
                  {activeOrder.customerPhone}
                </p>
              </div>
              <div className="space-y-1.5">
                <p className="text-[var(--elv-text-muted)]">Merchant &amp; OEM Verification</p>
                <p className="font-semibold text-[var(--elv-text-strong)]">{businessName}</p>
                <p className="text-[var(--elv-text-gold)]">{activeOrder.logoImprint}</p>
                <p className="font-mono text-[var(--elv-text-muted)]">
                  Alibaba Batch: {activeOrder.oemOrderRef} · Paid to {activeOrder.ownerPayoutPhone}
                </p>
              </div>
            </div>

            {/* Chronological Event Log */}
            <div className="space-y-4">
              <h3 className="font-display text-sm font-semibold text-[var(--elv-text-strong)]">
                Live Verification &amp; Courier Log
              </h3>
              <ul className="space-y-4">
                {[...activeOrder.timeline].reverse().map((event, idx) => (
                  <li
                    key={`${event.status}-${idx}`}
                    className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 border-b border-[var(--elv-border)] pb-3 last:border-b-0"
                  >
                    <div>
                      <p className="text-sm font-semibold text-[var(--elv-text-strong)]">
                        {event.label}
                      </p>
                      <p className="mt-0.5 text-xs text-[var(--elv-text-body)]">{event.detail}</p>
                    </div>
                    <time className="font-mono text-[11px] text-[var(--elv-text-muted)] tabular-nums shrink-0">
                      {new Date(event.timestampIso).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </time>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right 4 Columns: Ordered Hardware & Verified Receipt */}
          <div className="lg:col-span-4 elv-card space-y-6 rounded-2xl p-6">
            <div className="flex items-center gap-2 text-sm font-semibold text-[var(--elv-text-strong)]">
              <Truck className="h-4 w-4 text-[var(--elv-text-gold)]" aria-hidden="true" />
              <span>{activeOrder.courierName}</span>
            </div>

            <ul className="divide-y divide-[var(--elv-border)] border-y border-[var(--elv-border)]">
              {activeOrder.items.map((item) => (
                <li key={item.productId} className="flex items-center gap-3.5 py-4">
                  <div className="h-14 w-16 shrink-0 overflow-hidden rounded-lg border border-[var(--elv-border)]">
                    <ProductMedia
                      imageKey={item.imageKey}
                      alt={item.title}
                      aspectClass="h-full w-full"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-[var(--elv-text-strong)]">
                      {item.title}
                    </p>
                    <p className="font-mono text-xs text-[var(--elv-text-muted)] tabular-nums">
                      Qty {item.quantity} × {displayPrice(item.unitPrice)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-[var(--elv-text-muted)]">
                <span>Delivery Tier</span>
                <span className="text-[var(--elv-text-body)] text-right">
                  {DELIVERY_ZONE_META[activeOrder.deliveryZone].label}
                </span>
              </div>
              <div className="flex justify-between text-[var(--elv-text-muted)]">
                <span>Merchandise Subtotal</span>
                <span className="font-mono tabular-nums text-[var(--elv-text-body)]">
                  {displayPrice(activeOrder.subtotalUsd)}
                </span>
              </div>
              {(activeOrder.discountSavedUsd ?? 0) > 0 && (
                <div className="flex justify-between text-[var(--elv-text-gold)]">
                  <span>
                    Holiday Promo
                    {activeOrder.promoCodeApplied ? ` (${activeOrder.promoCodeApplied})` : ''}
                  </span>
                  <span className="font-mono tabular-nums">
                    -{displayPrice(activeOrder.discountSavedUsd ?? 0)}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-[var(--elv-text-muted)]">
                <span>Local Delivery Cost</span>
                <span className="font-mono tabular-nums text-[var(--elv-text-strong)]">
                  +{displayPrice(activeOrder.deliveryFeeUsd)}
                </span>
              </div>
              <div className="flex justify-between border-t border-[var(--elv-border)] pt-3 text-sm font-semibold text-[var(--elv-text-strong)]">
                <span>Verified Paid</span>
                <span className="font-mono tabular-nums text-[var(--elv-text-gold)]">
                  {displayPrice(activeOrder.totalUsd)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

