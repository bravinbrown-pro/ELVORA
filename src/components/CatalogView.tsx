import { useMemo, useState } from 'react';
import {
  ArrowRight,
  Check,
  Globe,
  Heart,
  Minus,
  Plus,
  Scale,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Tag,
  Truck,
  X,
} from 'lucide-react';
import {
  AiProductPost,
  BuyerSuggestionIntent,
  CustomerReview,
  ELVORA_BRAND_MOTTO,
  ElectronicsCategory,
  HOLIDAY_CAMPAIGNS,
  HolidayCampaignId,
  MerchantAdvertisement,
  ProductItem,
  computeExactArrivalInfo,
  getBuyerSuggestions,
} from '../utils/commerce';
import {
  formatCompareButtonAriaLabel,
  isProductInComparison,
} from '../utils/comparison';
import {
  formatWishlistButtonAriaLabel,
  isProductInWishlist,
} from '../utils/wishlist';
import { AdSpotlight } from './AdSpotlight';
import { ElvoraBrandEmblem, ElvoraImageLogo } from './ElvoraLogo';
import { LiveDropsView } from './LiveDropsView';
import { ProductMedia } from './ProductMedia';

interface CatalogViewProps {
  products: ProductItem[];
  posts: AiProductPost[];
  reviews: CustomerReview[];
  advertisements?: MerchantAdvertisement[];
  adsEnabled?: boolean;
  businessName: string;
  ownerPhone: string;
  activeCampaignId: HolidayCampaignId;
  appliedPromoCode: string;
  totalOrdersCount: number;
  wishlistProductIds?: string[];
  compareProductIds?: string[];
  formatPrice?: (usdAmount: number) => string;
  activeCurrencyCode?: string;
  onToggleWishlist?: (productId: string) => void;
  onToggleCompare?: (productId: string) => void;
  onOpenCompareModal?: () => void;
  onMoveAllWishlistToBag?: () => void;
  onOpenCurrencyModal?: () => void;
  onApplyPromoCode: (code: string) => void;
  onAddToCart: (product: ProductItem, quantity?: number, openDrawer?: boolean) => void;
  onNavigateTrack: () => void;
  onNavigateReviews: () => void;
}

const CATEGORIES: ('All' | ElectronicsCategory)[] = [
  'All',
  'Combos',
  'Audio',
  'Wearables',
  'Power',
  'Computing',
];

const SUGGESTION_TABS: { id: BuyerSuggestionIntent; label: string }[] = [
  { id: 'top_picks', label: 'Top Picks for You' },
  { id: 'combo_bundles', label: 'Combo Bundles' },
  { id: 'holiday_discounts', label: 'Holiday Deals' },
  { id: 'work_power', label: 'Work & Power' },
  { id: 'audio_fitness', label: 'Audio & Fitness' },
];

type SortOption = 'featured' | 'discount_desc' | 'price_asc' | 'price_desc' | 'stock_desc';

export function CatalogView({
  products,
  posts,
  reviews,
  advertisements = [],
  adsEnabled = true,
  businessName,
  ownerPhone,
  activeCampaignId,
  appliedPromoCode,
  totalOrdersCount,
  wishlistProductIds = [],
  compareProductIds = [],
  formatPrice,
  activeCurrencyCode = 'USD',
  onToggleWishlist = () => {},
  onToggleCompare = () => {},
  onOpenCompareModal = () => {},
  onMoveAllWishlistToBag = () => {},
  onOpenCurrencyModal = () => {},
  onApplyPromoCode,
  onAddToCart,
  onNavigateTrack,
  onNavigateReviews,
}: CatalogViewProps) {
  const [catalogMode, setCatalogMode] = useState<'storefront' | 'drops'>('storefront');
  const [promoDismissed, setPromoDismissed] = useState(false);
  const [suggestionIntent, setSuggestionIntent] =
    useState<BuyerSuggestionIntent>('top_picks');
  const [selectedCategory, setSelectedCategory] = useState<'All' | ElectronicsCategory>('All');
  const [discountsOnly, setDiscountsOnly] = useState(false);
  const [wishlistOnly, setWishlistOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('featured');
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);
  const [detailQty, setDetailQty] = useState(1);

  const displayPrice = (usd: number) =>
    formatPrice ? formatPrice(usd) : `$${usd.toFixed(2)}`;

  const campaign = HOLIDAY_CAMPAIGNS[activeCampaignId] ?? HOLIDAY_CAMPAIGNS.black_friday;
  const expressArrival = useMemo(() => computeExactArrivalInfo('express_city'), []);

  const publishedProducts = useMemo(
    () => products.filter((p) => p.isPublished),
    [products]
  );

  const buyerSuggestions = useMemo(
    () => getBuyerSuggestions(publishedProducts, suggestionIntent),
    [publishedProducts, suggestionIntent]
  );

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = publishedProducts.filter((item) => {
      const catMatch =
        selectedCategory === 'All'
          ? true
          : selectedCategory === 'Combos'
            ? Boolean(item.isCombo || item.category === 'Combos')
            : item.category === selectedCategory;
      const saleMatch = !discountsOnly || (item.discountPercent ?? 0) > 0;
      const wishlistMatch =
        !wishlistOnly || isProductInWishlist(wishlistProductIds, item.id);
      const textMatch =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.specs.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        (item.comboItems ?? []).some((ci) => ci.toLowerCase().includes(q));
      return catMatch && saleMatch && wishlistMatch && textMatch;
    });

    if (sortBy === 'discount_desc') {
      return [...list].sort((a, b) => (b.discountPercent ?? 0) - (a.discountPercent ?? 0));
    }
    if (sortBy === 'price_asc') {
      return [...list].sort((a, b) => a.price - b.price);
    }
    if (sortBy === 'price_desc') {
      return [...list].sort((a, b) => b.price - a.price);
    }
    if (sortBy === 'stock_desc') {
      return [...list].sort((a, b) => b.stockRemaining - a.stockRemaining);
    }
    return list;
  }, [publishedProducts, selectedCategory, discountsOnly, wishlistOnly, wishlistProductIds, searchQuery, sortBy]);

  const totalUnitsAvailable = useMemo(
    () => publishedProducts.reduce((sum, p) => sum + p.stockRemaining, 0),
    [publishedProducts]
  );

  const pdpSuggestions = useMemo(() => {
    if (!selectedProduct) return [];
    return getBuyerSuggestions(publishedProducts, 'combo_bundles', [selectedProduct.id]).slice(
      0,
      2
    );
  }, [publishedProducts, selectedProduct]);

  const pdpReviews = useMemo(() => {
    if (!selectedProduct) return [];
    return reviews.filter((r) => r.productId === selectedProduct.id).slice(0, 2);
  }, [reviews, selectedProduct]);

  const openProductDetail = (item: ProductItem) => {
    setSelectedProduct(item);
    setDetailQty(1);
  };

  const isCampaignApplied =
    appliedPromoCode.trim().toUpperCase() === campaign.promoCode.toUpperCase();

  return (
    <div className="space-y-14 pb-16">
      {/* Slim Dismissible Holiday Offer Strip (<= 40px height on desktop, non-sticky) */}
      {!promoDismissed && (
        <div
          role="region"
          aria-label="Holiday promotional offer"
          className="mt-4 flex min-h-[38px] flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--elv-border-strong)] bg-[var(--elv-promo-bg)] px-4 py-1.5 text-xs"
        >
          <div className="flex flex-wrap items-center gap-2 text-[var(--elv-text-strong)]">
            <Tag className="h-3.5 w-3.5 text-[var(--elv-text-gold)] shrink-0" aria-hidden="true" />
            <span className="font-medium">{campaign.headline}</span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onApplyPromoCode(campaign.promoCode)}
              className="elv-btn-gold rounded-md px-3 py-1 font-mono text-[11px] font-semibold transition-colors whitespace-nowrap"
            >
              {isCampaignApplied
                ? `${campaign.promoCode} Applied (-${campaign.extraDiscountPercent}%)`
                : `Apply ${campaign.promoCode}`}
            </button>
            <button
              type="button"
              onClick={() => setPromoDismissed(true)}
              aria-label="Dismiss holiday offer banner"
              className="p-1 text-[var(--elv-text-muted)] hover:text-[var(--elv-text-strong)]"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}

      {/* Shopper Custom / Merchant Advertisement Banner */}
      <AdSpotlight advertisements={advertisements} adsEnabled={adsEnabled} />

      {/* Section 1: Storefront Split Hero + 4-Metric Proof Row */}
      <section className="pt-4 sm:pt-6" aria-labelledby="hero-heading">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
          <div className="lg:col-span-6 elv-card flex flex-col justify-between rounded-2xl p-6 sm:p-10">
            <div className="space-y-5">
              <div className="flex items-center gap-4">
                <ElvoraImageLogo size="lg" className="rounded-2xl shadow-[0_0_30px_rgba(236,197,92,0.15)]" />
                <ElvoraBrandEmblem showMotto={true} businessName={businessName} size="md" />
              </div>

              <h1
                id="hero-heading"
                className="font-display text-[clamp(2.1rem,3.6vw,3.35rem)] font-bold leading-[1.08] tracking-tight text-[var(--elv-text-strong)]"
              >
                Black &amp; gold OEM electronics, delivered at an exact hour.
              </h1>

              <p className="max-w-[60ch] text-base leading-relaxed text-[var(--elv-text-body)]">
                Operated by{' '}
                <strong className="font-semibold text-[var(--elv-text-strong)]">
                  {businessName.replace(/\.$/, '')}
                </strong>
                . Shop {publishedProducts.length} custom{' '}
                <strong className="font-semibold text-[var(--elv-text-gold)]">
                  {ELVORA_BRAND_MOTTO}
                </strong>{' '}
                devices, matched Earpods + Smartwatch combos, and Black Friday markdowns—with
                itemized local courier fees and exact arrival scheduling.
              </p>
            </div>

            <div className="mt-8 space-y-5">
              <div className="flex flex-wrap items-center gap-3">
                <a
                  href="#electronics-catalog"
                  className="elv-btn-gold inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg px-6 py-2.5 text-sm font-semibold transition-transform duration-150 active:scale-[0.99] whitespace-nowrap shrink-0"
                >
                  <span>Shop {publishedProducts.length} Electronics &amp; Combos</span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </a>
                <button
                  type="button"
                  onClick={onNavigateTrack}
                  className="elv-btn-outline inline-flex min-h-[44px] items-center justify-center rounded-lg px-5 py-2.5 text-sm font-medium transition-colors duration-150 whitespace-nowrap shrink-0"
                >
                  Track Local Delivery
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[var(--elv-text-muted)]">
                <span className="font-medium text-[var(--elv-text-gold)]">
                  Next Express Arrival: {expressArrival.exactTimeLabel}
                </span>
                <span aria-hidden="true">·</span>
                <span>Local Delivery from $5–$18</span>
                <span aria-hidden="true">·</span>
                <button
                  type="button"
                  onClick={onNavigateReviews}
                  className="underline underline-offset-4 hover:text-[var(--elv-text-strong)]"
                >
                  {reviews.length} Verified Buyer Reviews
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 overflow-hidden rounded-2xl border border-[var(--elv-border)] bg-[#0b0906]">
            <div className="relative h-full min-h-[280px] sm:min-h-[360px]">
              <ProductMedia
                imageKey="combo_earpods_watch"
                alt="Elvora Executive Black and Gold Earpods Pro and Chrono X1 Smartwatch Combo"
                aspectClass="h-full w-full"
                className="h-full w-full"
              />
              <div
                data-always-dark="true"
                className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/55 to-transparent p-6 sm:p-8"
              >
                <p className="text-xs font-medium text-[#ecc55c]">
                  {campaign.title} · Featured 2-in-1 Hardware Combo
                </p>
                <p className="mt-1 font-display text-lg font-semibold text-[#f7e2ab]">
                  Executive Earpods Pro + Chrono X1 Smartwatch · $279 (+$12 Delivery)
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Full-Width 4-Column Quantitative Proof Bar */}
        <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-px overflow-hidden rounded-xl border border-[var(--elv-border)] bg-[var(--elv-border)]">
          <div className="bg-[var(--elv-surface)] p-5">
            <p className="text-xs text-[var(--elv-text-muted)]">Catalog &amp; Vault Stock</p>
            <p className="mt-1 font-mono text-xl font-semibold text-[var(--elv-text-gold)] tabular-nums">
              {publishedProducts.length} models · {totalUnitsAvailable} units
            </p>
          </div>
          <div className="bg-[var(--elv-surface)] p-5">
            <p className="text-xs text-[var(--elv-text-muted)]">Next Express Arrival</p>
            <p className="mt-1 font-mono text-lg sm:text-xl font-semibold text-[var(--elv-text-strong)] tabular-nums truncate">
              {expressArrival.shortDayClockLabel}
            </p>
          </div>
          <div className="bg-[var(--elv-surface)] p-5">
            <p className="text-xs text-[var(--elv-text-muted)]">Fulfilled &amp; Rated</p>
            <p className="mt-1 inline-flex items-center gap-1.5 font-mono text-xl font-semibold text-[var(--elv-text-strong)] tabular-nums">
              <span>{totalOrdersCount} orders · 4.9</span>
              <Star className="h-4 w-4 fill-current text-[var(--elv-text-gold)] shrink-0" aria-hidden="true" />
            </p>
          </div>
          <div className="bg-[var(--elv-surface)] p-5">
            <p className="text-xs text-[var(--elv-text-muted)]">{businessName}</p>
            <p className="mt-1 font-mono text-sm sm:text-base font-semibold text-[var(--elv-text-gold)] tabular-nums truncate">
              {ownerPhone}
            </p>
          </div>
        </div>
      </section>

      {/* Section 2: Personalized Buyer Suggestions + Full Catalog / Live Drops */}
      <section id="electronics-catalog" className="space-y-10" aria-labelledby="catalog-heading">
        {/* Workspace Mode Switcher: Catalog vs AI Live Stock Drops */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--elv-border)] pb-5">
          <div>
            <h2
              id="catalog-heading"
              className="font-display text-2xl sm:text-3xl font-bold text-[var(--elv-text-strong)]"
            >
              Electronics &amp; Combo Vault
            </h2>
            <p className="mt-1 text-sm text-[var(--elv-text-muted)]">
              AI-curated OEM pricing, combo savings, and exact doorstep arrival scheduling.
            </p>
          </div>

          <div
            role="group"
            aria-label="Storefront view mode"
            className="elv-panel inline-flex items-center gap-1 rounded-lg p-1 shrink-0"
          >
            <button
              type="button"
              onClick={() => setCatalogMode('storefront')}
              className={`min-h-[38px] rounded-md px-3.5 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                catalogMode === 'storefront'
                  ? 'elv-btn-gold'
                  : 'text-[var(--elv-text-body)] hover:text-[var(--elv-text-strong)]'
              }`}
            >
              All Electronics ({publishedProducts.length})
            </button>
            <button
              type="button"
              onClick={() => setCatalogMode('drops')}
              className={`min-h-[38px] rounded-md px-3.5 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                catalogMode === 'drops'
                  ? 'elv-btn-gold'
                  : 'text-[var(--elv-text-body)] hover:text-[var(--elv-text-strong)]'
              }`}
            >
              AI Live Stock Drops ({posts.length})
            </button>
          </div>
        </div>

        {catalogMode === 'drops' ? (
          <LiveDropsView posts={posts} products={products} onAddToCart={onAddToCart} />
        ) : (
          <>
            {/* Smart Suggestions for Buyers */}
            <div className="elv-card rounded-2xl p-6 space-y-5">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-center gap-2.5">
                  <Sparkles
                    className="h-4 w-4 text-[var(--elv-text-gold)] shrink-0"
                    aria-hidden="true"
                  />
                  <div>
                    <h3 className="font-display text-base sm:text-lg font-bold text-[var(--elv-text-strong)]">
                      Smart Suggestions for Buyers
                    </h3>
                    <p className="text-xs text-[var(--elv-text-muted)]">
                      Tailored electronics &amp; combo recommendations based on value, daily workflow,
                      and holiday savings.
                    </p>
                  </div>
                </div>

                <div
                  role="group"
                  aria-label="Buyer suggestion preferences"
                  className="elv-panel flex items-center gap-1 overflow-x-auto rounded-lg p-1"
                >
                  {SUGGESTION_TABS.map((tab) => {
                    const active = suggestionIntent === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setSuggestionIntent(tab.id)}
                        className={`min-h-[36px] rounded-md px-3 py-1 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                          active
                            ? 'elv-btn-gold'
                            : 'text-[var(--elv-text-body)] hover:text-[var(--elv-text-strong)]'
                        }`}
                      >
                        {tab.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {buyerSuggestions.map(({ product, reason }) => (
                  <div
                    key={product.id}
                    className="elv-panel flex items-center justify-between gap-3 rounded-xl p-3.5"
                  >
                    <button
                      type="button"
                      onClick={() => openProductDetail(product)}
                      className="flex items-center gap-3 min-w-0 text-left"
                    >
                      <div className="h-14 w-16 shrink-0 overflow-hidden rounded-lg border border-[var(--elv-border)]">
                        <ProductMedia
                          imageKey={product.imageKey}
                          alt={product.title}
                          aspectClass="h-full w-full"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-display text-xs font-semibold text-[var(--elv-text-strong)]">
                          {product.title}
                        </p>
                        <p className="truncate text-[11px] text-[var(--elv-text-muted)]">
                          {reason}
                        </p>
                        <p className="mt-0.5 font-mono text-xs font-semibold text-[var(--elv-text-gold)] tabular-nums">
                          ${product.price}{' '}
                          {product.originalPrice && (
                            <span className="line-through text-[var(--elv-text-muted)] font-normal">
                              ${product.originalPrice}
                            </span>
                          )}{' '}
                          · +${product.localDeliveryFeeUsd} delivery
                        </p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => onAddToCart(product, 1, true)}
                      aria-label={`Add suggested ${product.title} to bag`}
                      className="elv-btn-gold min-h-[38px] rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap shrink-0"
                    >
                      + Bag
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Category, Discount, Search & Sort Controls */}
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div
                  role="group"
                  aria-label="Filter electronics by category"
                  className="elv-panel flex items-center gap-1 overflow-x-auto rounded-lg p-1"
                >
                  {CATEGORIES.map((category) => {
                    const active = selectedCategory === category;
                    return (
                      <button
                        key={category}
                        type="button"
                        onClick={() => setSelectedCategory(category)}
                        className={`min-h-[40px] px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors duration-150 whitespace-nowrap shrink-0 ${
                          active
                            ? 'elv-btn-gold'
                            : 'text-[var(--elv-text-body)] hover:text-[var(--elv-text-strong)]'
                        }`}
                      >
                        {category === 'All' ? 'All Models' : category}
                      </button>
                    );
                  })}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    aria-pressed={discountsOnly}
                    onClick={() => setDiscountsOnly((prev) => !prev)}
                    className={`min-h-[42px] rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                      discountsOnly ? 'elv-btn-gold' : 'elv-btn-outline'
                    }`}
                  >
                    On Sale &amp; Holiday Offers
                  </button>

                  <button
                    type="button"
                    aria-pressed={wishlistOnly}
                    onClick={() => setWishlistOnly((prev) => !prev)}
                    className={`min-h-[42px] inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                      wishlistOnly ? 'elv-btn-gold' : 'elv-btn-outline'
                    }`}
                  >
                    <Heart
                      className={`h-3.5 w-3.5 ${
                        wishlistOnly ? 'fill-current text-current' : 'text-[var(--elv-text-gold)]'
                      }`}
                      aria-hidden="true"
                    />
                    <span>Wishlist ({wishlistProductIds.length})</span>
                  </button>

                  {wishlistOnly && wishlistProductIds.length > 0 && (
                    <button
                      type="button"
                      onClick={onMoveAllWishlistToBag}
                      className="elv-btn-gold inline-flex min-h-[42px] items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold whitespace-nowrap shrink-0"
                    >
                      <ShoppingBag className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Move to Bag</span>
                    </button>
                  )}

                  {compareProductIds.length > 0 && (
                    <button
                      type="button"
                      onClick={onOpenCompareModal}
                      className="elv-btn-outline inline-flex min-h-[42px] items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold whitespace-nowrap shrink-0 text-[var(--elv-text-gold)] border-[#ecc55c]/60 bg-[#ecc55c]/10"
                    >
                      <Scale className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Compare ({compareProductIds.length})</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Global Product Search Bar & Sort Dropdown */}
              <div className="elv-card rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative flex-1">
                  <label htmlFor="global-product-search" className="block text-xs font-semibold text-[var(--elv-text-strong)] mb-1.5">
                    Global Product Search Bar (Filter by Product Name or Category Description)
                  </label>
                  <div className="relative">
                    <Search
                      className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--elv-text-gold)]"
                      aria-hidden="true"
                    />
                    <input
                      id="global-product-search"
                      type="search"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search electronics by name, category, or spec description (e.g. earpods, audio, smartwatch)..."
                      className="elv-input min-h-[46px] w-full rounded-xl pl-10 pr-10 text-sm font-medium"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        aria-label="Clear search query"
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[var(--elv-text-muted)] hover:text-[var(--elv-text-strong)]"
                      >
                        <X className="h-4 w-4" aria-hidden="true" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 shrink-0 pt-2 md:pt-6">
                  <span className="font-mono text-xs text-[var(--elv-text-muted)] whitespace-nowrap">
                    Showing <strong className="text-[var(--elv-text-gold)] font-semibold">{filteredProducts.length}</strong> of {publishedProducts.length}
                  </span>

                  <div className="flex items-center gap-2">
                    <label
                      htmlFor="catalog-sort"
                      className="text-xs text-[var(--elv-text-muted)] whitespace-nowrap"
                    >
                      Sort
                    </label>
                    <select
                      id="catalog-sort"
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as SortOption)}
                      className="elv-input min-h-[44px] rounded-lg px-3 text-sm"
                    >
                      <option value="featured">Featured ({filteredProducts.length})</option>
                      <option value="discount_desc">Biggest Discount</option>
                      <option value="price_asc">Price: Low to High</option>
                      <option value="price_desc">Price: High to Low</option>
                      <option value="stock_desc">Stock Remaining</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Uniform 3-Column Product Grid */}
            {filteredProducts.length === 0 ? (
              <div className="elv-card rounded-2xl p-12 text-center">
                <p className="font-display text-lg font-semibold text-[var(--elv-text-strong)]">
                  {wishlistOnly
                    ? 'Your wishlist is currently empty'
                    : 'No matching electronics found'}
                </p>
                <p className="mt-2 text-sm text-[var(--elv-text-muted)]">
                  {wishlistOnly
                    ? 'Tap the heart icon on any device or combo in the catalog to save it for later.'
                    : 'Try clearing your search or disabling filters.'}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory('All');
                    setDiscountsOnly(false);
                    setWishlistOnly(false);
                    setSearchQuery('');
                  }}
                  className="elv-btn-gold mt-5 inline-flex min-h-[44px] items-center justify-center rounded-lg px-5 py-2 text-xs font-semibold whitespace-nowrap"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                {filteredProducts.map((product) => {
                  const outOfStock = product.stockRemaining <= 0;
                  const isWishlisted = isProductInWishlist(wishlistProductIds, product.id);
                  const isComparing = isProductInComparison(compareProductIds, product.id);
                  return (
                    <article
                      key={product.id}
                      className="elv-card group flex flex-col justify-between overflow-hidden rounded-2xl transition-all duration-500 ease-out hover:-translate-y-2 hover:border-[#ecc55c]/40 hover:shadow-[0_20px_50px_-12px_rgba(236,197,92,0.3)] hover:ring-1 hover:ring-[#ecc55c]/20"
                    >
                      <div>
                        <div className="relative">
                          {/* Hardware Model Comparison Button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              onToggleCompare(product.id);
                            }}
                            aria-pressed={isComparing}
                            aria-label={formatCompareButtonAriaLabel(product.title, isComparing)}
                            className={`absolute top-3 left-3 z-10 inline-flex min-h-[38px] items-center gap-1.5 rounded-xl border px-2.5 py-1 text-xs font-semibold backdrop-blur-md transition-all duration-200 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--elv-text-gold)] ${
                              isComparing
                                ? 'border-[#ecc55c]/60 bg-black/85 text-[#ecc55c] shadow-[0_0_12px_rgba(236,197,92,0.25)]'
                                : 'border-white/15 bg-black/60 text-[var(--elv-text-muted)] hover:border-[#ecc55c]/50 hover:bg-black/85 hover:text-[#ecc55c]'
                            }`}
                          >
                            <Scale className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                            <span>{isComparing ? 'Comparing' : 'Compare'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => openProductDetail(product)}
                            aria-label={`Inspect ${product.title}`}
                            className="block w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--elv-text-gold)]"
                          >
                            <ProductMedia
                              imageKey={product.imageKey}
                              alt={product.title}
                              aspectClass="aspect-[4/3]"
                            />
                          </button>

                          {/* Heart Icon Button on Product Card */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              onToggleWishlist(product.id);
                            }}
                            aria-pressed={isWishlisted}
                            aria-label={formatWishlistButtonAriaLabel(product.title, isWishlisted)}
                            className={`absolute top-3 right-3 z-10 flex min-h-[40px] min-w-[40px] items-center justify-center rounded-xl border backdrop-blur-md transition-all duration-200 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--elv-text-gold)] ${
                              isWishlisted
                                ? 'border-[#ecc55c]/60 bg-black/85 text-[#ecc55c] shadow-[0_0_14px_rgba(236,197,92,0.35)]'
                                : 'border-white/15 bg-black/60 text-[var(--elv-text-muted)] hover:border-[#ecc55c]/50 hover:bg-black/85 hover:text-[#ecc55c]'
                            }`}
                          >
                            <Heart
                              className={`h-4 w-4 transition-transform duration-200 ${
                                isWishlisted
                                  ? 'fill-[#ecc55c] scale-110 text-[#ecc55c]'
                                  : 'text-current'
                              }`}
                              aria-hidden="true"
                            />
                          </button>
                        </div>

                        <div className="p-6 space-y-2.5">
                          {/* Clean Unboxed Metadata (Zero Static Pills) */}
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[var(--elv-text-muted)]">
                            <span className="uppercase tracking-wider font-semibold text-[var(--elv-text-gold)]">
                              {product.isCombo ? 'Combo Bundle' : product.category}
                            </span>
                            {(product.discountPercent ?? 0) > 0 && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className="font-semibold text-[var(--elv-text-strong)]">
                                  Save {product.discountPercent}%
                                </span>
                              </>
                            )}
                            <span aria-hidden="true">·</span>
                            <span className="inline-flex items-center gap-1 font-mono tabular-nums">
                              <Star className="h-3 w-3 fill-current text-[var(--elv-text-gold)] shrink-0" aria-hidden="true" />
                              <span>{(product.ratingAvg ?? 4.9).toFixed(1)} ({product.reviewCount ?? 12})</span>
                            </span>
                            <span aria-hidden="true">·</span>
                            <span className="font-mono tabular-nums text-[var(--elv-text-strong)]">
                              {outOfStock
                                ? 'Sold Out'
                                : `${product.stockRemaining} left`}
                            </span>
                          </div>

                          <h3 className="font-display text-base font-semibold text-[var(--elv-text-strong)] leading-snug">
                            <button
                              type="button"
                              onClick={() => openProductDetail(product)}
                              className="text-left hover:underline focus:outline-none"
                            >
                              {product.title}
                            </button>
                          </h3>

                          {product.comboItems && product.comboItems.length > 0 && (
                            <p className="text-xs font-medium text-[var(--elv-text-gold)]">
                              Combo Includes: {product.comboItems.join(' + ')}
                            </p>
                          )}

                          <p className="text-xs leading-relaxed text-[var(--elv-text-body)] line-clamp-2">
                            {product.specs}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-3 border-t border-[var(--elv-border)] px-6 py-4">
                        <div className="flex items-baseline justify-between gap-2">
                          <div className="flex items-baseline gap-2">
                            <span className="font-mono text-lg font-bold text-[var(--elv-text-gold)] tabular-nums">
                              {displayPrice(product.price)}
                            </span>
                            {product.originalPrice && (
                              <span className="font-mono text-xs line-through text-[var(--elv-text-muted)] tabular-nums">
                                {displayPrice(product.originalPrice)}
                              </span>
                            )}
                          </div>
                          <span className="font-mono text-[11px] text-[var(--elv-text-muted)] tabular-nums">
                            +{displayPrice(product.localDeliveryFeeUsd)} delivery
                          </span>
                        </div>

                        <p className="text-[11px] text-[var(--elv-text-muted)]">
                          Express arrives <strong className="text-[var(--elv-text-strong)]">{expressArrival.exactTimeLabel}</strong>
                        </p>

                        <div className="flex items-center gap-2 pt-0.5">
                          <button
                            type="button"
                            onClick={() => openProductDetail(product)}
                            aria-label={`Details for ${product.title}`}
                            className="elv-btn-outline min-h-[42px] rounded-lg px-3.5 py-2 text-xs font-medium transition-colors whitespace-nowrap shrink-0"
                          >
                            Specs
                          </button>
                          <button
                            type="button"
                            disabled={outOfStock}
                            onClick={() => onAddToCart(product, 1, true)}
                            aria-label={`Add ${product.title} to bag`}
                            className="elv-btn-gold flex-1 min-h-[42px] rounded-lg px-4 py-2 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40 whitespace-nowrap"
                          >
                            {outOfStock ? 'Sold Out' : 'Add to Bag'}
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </>
        )}
      </section>

      {/* Section 3: OEM Craftsmanship, AI Pricing & Exact Local Delivery */}
      <section
        className="border-t border-[var(--elv-border)] pt-14"
        aria-labelledby="oem-architecture-heading"
      >
        <div className="max-w-2xl">
          <h2
            id="oem-architecture-heading"
            className="font-display text-2xl font-bold text-[var(--elv-text-strong)]"
          >
            How {businessName} Direct Fulfillment Works
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[var(--elv-text-muted)]">
            Every order settles directly to our verified merchant line, triggers autonomous
            Alibaba Free-Shipping OEM replenishment, and dispatches with an exact doorstep arrival
            clock time.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10">
          <div className="space-y-3 border-t border-[var(--elv-border)] pt-5">
            <p className="font-mono text-xs text-[var(--elv-text-gold)]">
              01. Verified Prepaid Settlement
            </p>
            <h3 className="font-display text-lg font-semibold text-[var(--elv-text-strong)]">
              Direct Payment + Itemized Delivery
            </h3>
            <p className="text-sm leading-relaxed text-[var(--elv-text-body)]">
              Pay via Instant Mobile Money, 3D-Secure Card, or Bank Transfer with transparent local
              delivery fees ($5–$18) and instant confirmation to {ownerPhone}.
            </p>
          </div>

          <div className="space-y-3 border-t border-[var(--elv-border)] pt-5">
            <p className="font-mono text-xs text-[var(--elv-text-gold)]">
              02. Custom Alibaba OEM Hardware
            </p>
            <h3 className="font-display text-lg font-semibold text-[var(--elv-text-strong)]">
              {ELVORA_BRAND_MOTTO}
            </h3>
            <p className="text-sm leading-relaxed text-[var(--elv-text-body)]">
              Elvora AI prioritizes verified Alibaba factories offering free inbound freight to
              keep combo and holiday prices sharp while maintaining signature gold-trim quality.
            </p>
          </div>

          <div className="space-y-3 border-t border-[var(--elv-border)] pt-5">
            <p className="font-mono text-xs text-[var(--elv-text-gold)]">
              03. Exact Clock Doorstep Arrival
            </p>
            <h3 className="font-display text-lg font-semibold text-[var(--elv-text-strong)]">
              Scheduled to the Minute
            </h3>
            <p className="text-sm leading-relaxed text-[var(--elv-text-body)]">
              Know the exact time your rider arrives ({expressArrival.exactTimeLabel} for Same-Day
              Express) and track all 5 fulfillment stages live.
            </p>
          </div>
        </div>
      </section>

      {/* Contiguous Product Detail Modal (PDP) */}
      {selectedProduct && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="pdp-modal-title"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-6"
        >
          <div className="elv-card relative w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--elv-border)] pb-4">
              <span className="text-xs font-medium text-[var(--elv-text-gold)]">
                {selectedProduct.isCombo ? 'Combo Bundle' : selectedProduct.category} ·{' '}
                {selectedProduct.oemOrigin} · {businessName}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onToggleWishlist(selectedProduct.id)}
                  aria-pressed={isProductInWishlist(wishlistProductIds, selectedProduct.id)}
                  aria-label={formatWishlistButtonAriaLabel(
                    selectedProduct.title,
                    isProductInWishlist(wishlistProductIds, selectedProduct.id)
                  )}
                  className={`elv-btn-outline inline-flex min-h-[42px] items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                    isProductInWishlist(wishlistProductIds, selectedProduct.id)
                      ? 'border-[#ecc55c]/60 text-[#ecc55c] bg-[#ecc55c]/10'
                      : 'text-[var(--elv-text-muted)] hover:text-[#ecc55c]'
                  }`}
                >
                  <Heart
                    className={`h-4 w-4 ${
                      isProductInWishlist(wishlistProductIds, selectedProduct.id)
                        ? 'fill-[#ecc55c] text-[#ecc55c]'
                        : 'text-current'
                    }`}
                    aria-hidden="true"
                  />
                  <span>
                    {isProductInWishlist(wishlistProductIds, selectedProduct.id)
                      ? 'Saved in Wishlist'
                      : 'Add to Wishlist'}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedProduct(null)}
                  aria-label="Close product details"
                  className="elv-btn-outline flex min-h-[42px] min-w-[42px] items-center justify-center rounded-lg"
                >
                  <X className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              <div className="md:col-span-6 space-y-4">
                <div className="overflow-hidden rounded-xl border border-[var(--elv-border)]">
                  <ProductMedia
                    imageKey={selectedProduct.imageKey}
                    alt={selectedProduct.title}
                    aspectClass="aspect-[4/3]"
                  />
                </div>

                {/* Buyer Reviews Excerpt */}
                <div className="elv-panel rounded-xl p-4 space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="inline-flex items-center gap-1 font-semibold text-[var(--elv-text-gold)]">
                      <Star className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
                      <span>
                        {(selectedProduct.ratingAvg ?? 4.9).toFixed(1)} / 5.0 (
                        {selectedProduct.reviewCount ?? 15} reviews)
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedProduct(null);
                        onNavigateReviews();
                      }}
                      className="underline text-[var(--elv-text-strong)]"
                    >
                      See All / Write Review
                    </button>
                  </div>
                  {pdpReviews.length > 0 ? (
                    pdpReviews.map((r) => (
                      <p key={r.id} className="text-xs text-[var(--elv-text-body)]">
                        &ldquo;{r.comment}&rdquo; —{' '}
                        <span className="text-[var(--elv-text-muted)]">{r.authorName}</span>
                      </p>
                    ))
                  ) : (
                    <p className="text-xs text-[var(--elv-text-muted)]">
                      Verified buyers praise the matte-black &amp; gold OEM build and punctual
                      courier arrival.
                    </p>
                  )}
                </div>
              </div>

              <div className="md:col-span-6 space-y-5">
                <div>
                  <h2
                    id="pdp-modal-title"
                    className="font-display text-2xl font-bold text-[var(--elv-text-strong)]"
                  >
                    {selectedProduct.title}
                  </h2>
                  <div className="mt-2 flex flex-wrap items-baseline gap-2.5">
                    <span className="font-mono text-2xl font-bold text-[var(--elv-text-gold)] tabular-nums">
                      {displayPrice(selectedProduct.price)}
                    </span>
                    {selectedProduct.originalPrice && (
                      <span className="font-mono text-sm line-through text-[var(--elv-text-muted)] tabular-nums">
                        {displayPrice(selectedProduct.originalPrice)}
                      </span>
                    )}
                    <span className="font-mono text-xs text-[var(--elv-text-muted)]">
                      + {displayPrice(selectedProduct.localDeliveryFeeUsd)} local delivery
                    </span>
                  </div>
                </div>

                {selectedProduct.comboItems && selectedProduct.comboItems.length > 0 && (
                  <div className="elv-panel rounded-xl p-3.5 text-xs">
                    <p className="font-semibold text-[var(--elv-text-gold)]">
                      Matched Combo Contents:
                    </p>
                    <p className="mt-1 text-[var(--elv-text-strong)]">
                      {selectedProduct.comboItems.join(' + ')}
                    </p>
                  </div>
                )}

                <p className="text-sm leading-relaxed text-[var(--elv-text-body)]">
                  {selectedProduct.specs}
                </p>

                <div className="space-y-2 border-y border-[var(--elv-border)] py-4 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[var(--elv-text-muted)]">Exact Express Arrival:</span>
                    <span className="font-semibold text-[var(--elv-text-gold)]">
                      {expressArrival.exactTimeLabel}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[var(--elv-text-muted)]">Factory Branding:</span>
                    <span className="font-medium text-[var(--elv-text-strong)]">
                      {selectedProduct.logoImprint}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[var(--elv-text-muted)]">Amount Remaining:</span>
                    <span className="font-mono font-semibold text-[var(--elv-text-strong)] tabular-nums">
                      {selectedProduct.stockRemaining} units
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="elv-panel inline-flex items-center rounded-lg">
                    <button
                      type="button"
                      onClick={() => setDetailQty((q) => Math.max(1, q - 1))}
                      aria-label="Decrease quantity"
                      className="flex min-h-[44px] min-w-[44px] items-center justify-center text-[var(--elv-text-strong)]"
                    >
                      <Minus className="h-4 w-4" aria-hidden="true" />
                    </button>
                    <span className="w-10 text-center font-mono text-sm font-semibold text-[var(--elv-text-strong)] tabular-nums">
                      {detailQty}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setDetailQty((q) => Math.min(selectedProduct.stockRemaining, q + 1))
                      }
                      aria-label="Increase quantity"
                      className="flex min-h-[44px] min-w-[44px] items-center justify-center text-[var(--elv-text-strong)]"
                    >
                      <Plus className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>

                  <button
                    type="button"
                    disabled={selectedProduct.stockRemaining <= 0}
                    onClick={() => {
                      onAddToCart(selectedProduct, detailQty, true);
                      setSelectedProduct(null);
                    }}
                    className="elv-btn-gold flex-1 min-h-[44px] rounded-lg px-5 py-2.5 text-sm font-semibold disabled:opacity-40 whitespace-nowrap"
                  >
                    Add {detailQty} to Bag · {displayPrice(selectedProduct.price * detailQty)}
                  </button>
                </div>

                {pdpSuggestions.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <p className="text-xs font-semibold text-[var(--elv-text-muted)]">
                      Suggested Combo Upgrade:
                    </p>
                    {pdpSuggestions.slice(0, 1).map(({ product: sug }) => (
                      <div
                        key={sug.id}
                        className="elv-panel flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-xs"
                      >
                        <span className="truncate text-[var(--elv-text-strong)]">
                          {sug.title} ({displayPrice(sug.price)})
                        </span>
                        <button
                          type="button"
                          onClick={() => setSelectedProduct(sug)}
                          className="font-semibold text-[var(--elv-text-gold)] underline whitespace-nowrap"
                        >
                          View Combo
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-4 text-xs text-[var(--elv-text-muted)]">
                  <span className="inline-flex items-center gap-1.5">
                    <ShieldCheck
                      className="h-4 w-4 text-[var(--elv-text-gold)]"
                      aria-hidden="true"
                    />
                    <span>Prepaid Verified</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Truck className="h-4 w-4 text-[var(--elv-text-gold)]" aria-hidden="true" />
                    <span>Exact Doorstep Time</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Check className="h-4 w-4 text-[var(--elv-text-gold)]" aria-hidden="true" />
                    <span>OEM Quality Seal</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Bottom Comparison Trigger Bar */}
      {compareProductIds.length > 0 && (
        <aside
          aria-label="Product comparison floating bar"
          className="fixed bottom-16 md:bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3.5 rounded-full border border-[#ecc55c]/60 bg-black/95 px-5 py-2.5 shadow-[0_4px_24px_rgba(0,0,0,0.85)] backdrop-blur-md"
        >
          <div className="flex items-center gap-2">
            <Scale className="h-4 w-4 text-[var(--elv-text-gold)] shrink-0" aria-hidden="true" />
            <span className="text-xs font-semibold text-[var(--elv-text-strong)] whitespace-nowrap">
              {compareProductIds.length} {compareProductIds.length === 1 ? 'Model' : 'Models'} Selected
            </span>
          </div>
          <button
            type="button"
            onClick={onOpenCompareModal}
            className="elv-btn-gold inline-flex min-h-[32px] items-center rounded-full px-3.5 py-1 text-xs font-semibold whitespace-nowrap"
          >
            Compare Matrix
          </button>
        </aside>
      )}
    </div>
  );
}

