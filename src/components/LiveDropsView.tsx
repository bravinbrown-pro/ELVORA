import { AiProductPost, ProductItem, computeExactArrivalInfo } from '../utils/commerce';
import { ProductMedia } from './ProductMedia';

interface LiveDropsViewProps {
  posts: AiProductPost[];
  products: ProductItem[];
  onAddToCart: (product: ProductItem, quantity?: number, openDrawer?: boolean) => void;
}

export function LiveDropsView({ posts, products, onAddToCart }: LiveDropsViewProps) {
  const expressArrival = computeExactArrivalInfo('express_city');

  return (
    <div className="space-y-8 py-4 pb-12">
      <div className="border-b border-[var(--elv-border)] pb-5">
        <h2 className="font-display text-2xl sm:text-3xl font-bold text-[var(--elv-text-strong)]">
          AI Live Product &amp; Remaining Stock Feed
        </h2>
        <p className="mt-1.5 max-w-2xl text-sm text-[var(--elv-text-muted)]">
          Every time Elvora AI confirms a customer payment to the owner&apos;s phone or launches a
          new Alibaba OEM batch, it automatically posts the studio photograph, AI-marked-up retail
          price, local delivery cost, and exact units remaining.
        </p>
      </div>

      {posts.length === 0 ? (
        <div className="elv-card rounded-2xl p-12 text-center">
          <p className="font-display text-lg font-semibold text-[var(--elv-text-strong)]">
            No live stock bulletins posted yet
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {posts.map((post) => {
            const liveProduct = products.find((p) => p.id === post.productId);
            const currentRemaining = liveProduct
              ? liveProduct.stockRemaining
              : post.stockRemaining;
            const deliveryCost = liveProduct?.localDeliveryFeeUsd ?? 12;

            return (
              <article
                key={post.id}
                className="elv-card group flex flex-col justify-between overflow-hidden rounded-2xl transition-colors hover:border-[var(--elv-border-strong)]"
              >
                <div>
                  <ProductMedia
                    imageKey={post.imageKey}
                    alt={post.productTitle}
                    aspectClass="aspect-[4/3]"
                  />

                  <div className="p-6 space-y-3">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[var(--elv-text-muted)]">
                      <span className="uppercase tracking-wider text-[var(--elv-text-gold)]">
                        {post.category}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono font-semibold text-[var(--elv-text-strong)] tabular-nums">
                        {currentRemaining} remaining
                      </span>
                      {post.linkedOrderCode && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono text-[var(--elv-text-gold)]">
                            {post.linkedOrderCode} Verified
                          </span>
                        </>
                      )}
                    </div>

                    <h3 className="font-display text-lg font-semibold text-[var(--elv-text-strong)]">
                      {post.productTitle}
                    </h3>

                    <p className="text-xs leading-relaxed text-[var(--elv-text-body)]">
                      {post.caption}
                    </p>

                    <p className="text-[11px] text-[var(--elv-text-muted)]">
                      Arrives {expressArrival.exactTimeLabel} · Confirmed to{' '}
                      {post.ownerPhoneConfirmed}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-[var(--elv-border)] px-6 py-4">
                  <div>
                    <span className="block text-[11px] text-[var(--elv-text-muted)]">
                      Store Price + ${deliveryCost} Delivery
                    </span>
                    <span className="font-mono text-base font-semibold text-[var(--elv-text-gold)] tabular-nums">
                      ${post.priceUsd.toFixed(2)}
                    </span>
                  </div>

                  {liveProduct && (
                    <button
                      type="button"
                      disabled={liveProduct.stockRemaining <= 0}
                      onClick={() => onAddToCart(liveProduct, 1, true)}
                      aria-label={`Buy ${post.productTitle} from live drop`}
                      className="elv-btn-gold min-h-[44px] rounded-lg px-4 py-2 text-xs font-semibold transition-colors disabled:opacity-40 whitespace-nowrap shrink-0"
                    >
                      {liveProduct.stockRemaining <= 0 ? 'Sold Out' : 'Buy Now'}
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

