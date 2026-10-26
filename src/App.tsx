import { useEffect, useMemo, useState } from 'react';
import { User } from 'firebase/auth';
import {
  Globe,
  Headset,
  Heart,
  Moon,
  PackageSearch,
  Scale,
  ShieldCheck,
  ShoppingBag,
  Smartphone,
  Star,
  Sun,
  User as UserIcon,
  X,
} from 'lucide-react';
import { AdScriptInjector } from './components/AdScriptInjector';
import { CartCheckoutDrawer } from './components/CartCheckoutDrawer';
import { CatalogView } from './components/CatalogView';
import { ContactView } from './components/ContactView';
import { CurrencySelectorModal } from './components/CurrencySelectorModal';
import { CustomerAccountView } from './components/CustomerAccountView';
import { CustomerAiOrb } from './components/CustomerAiOrb';
import { ElvoraBrandEmblem, ElvoraEmblem, ElvoraImageLogo } from './components/ElvoraLogo';
import { OrderTrackingView } from './components/OrderTrackingView';
import { OwnerMobileHub } from './components/OwnerMobileHub';
import { ProductCompareModal } from './components/ProductCompareModal';
import { ReviewsView } from './components/ReviewsView';
import { SplashScreen } from './components/SplashScreen';
import { usePWAInstall } from './hooks/usePWAInstall';
import {
  signInWithGoogle,
  signOutUser,
  subscribeToAuth,
  syncInquiryToFirestore,
  syncOwnerConfigToFirestore,
  syncProductToFirestore,
  syncReviewToFirestore,
  syncVerifiedOrderToFirestore,
} from './firebase';
import {
  CartEntry,
  CheckoutFormInput,
  ELVORA_BRAND_MOTTO,
  InquiryFormInput,
  OwnerConfig,
  ProductItem,
  ReviewFormInput,
  StoreState,
  createInitialStoreState,
} from './utils/commerce';
import {
  CustomCurrencyConfig,
  DEFAULT_FX_RATES,
  formatMoneyFromUsd,
} from './utils/currency';
import {
  CustomerAccountPublic,
  LoginCustomerInput,
  RegisterCustomerInput,
  UpdateCustomerProfileInput,
} from './utils/customerAccount';
import { toggleCompareProductId } from './utils/comparison';
import {
  loadWishlistFromStorage,
  saveWishlistToStorage,
  toggleWishlistId,
} from './utils/wishlist';

type ActiveView = 'catalog' | 'track' | 'reviews' | 'contact' | 'account' | 'manager';

export default function App() {
  const [storeState, setStoreState] = useState<StoreState>(() => createInitialStoreState());
  const [loading, setLoading] = useState(true);
  const [splashVisible, setSplashVisible] = useState(true);
  const { isInstallable, isInstalled, isIOS, showIOSGuide, setShowIOSGuide, install } = usePWAInstall();
  const [activeView, setActiveView] = useState<ActiveView>(() => {
    const params = new URLSearchParams(window.location.search);
    const v = params.get('view');
    if (v === 'track' || v === 'reviews' || v === 'contact' || v === 'manager') return v;
    return 'catalog';
  });

  const [cart, setCart] = useState<CartEntry[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [appliedPromoCode, setAppliedPromoCode] = useState('');
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [trackedOrderCode, setTrackedOrderCode] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [wishlistProductIds, setWishlistProductIds] = useState<string[]>(() =>
    loadWishlistFromStorage()
  );
  const [currencyCode, setCurrencyCode] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('elvora_currency_v1');
      if (saved && typeof saved === 'string' && saved.length === 3) return saved.toUpperCase();
    } catch {}
    return 'USD';
  });
  const [customCurrency, setCustomCurrency] = useState<CustomCurrencyConfig | null>(() => {
    try {
      const raw = localStorage.getItem('elvora_custom_currency_v1');
      if (raw) return JSON.parse(raw);
    } catch {}
    return null;
  });
  const [fxRates, setFxRates] = useState<Record<string, number>>(() => ({ ...DEFAULT_FX_RATES }));
  const [fxSource, setFxSource] = useState<'live_market' | 'verified_baseline'>('verified_baseline');
  const [currencyModalOpen, setCurrencyModalOpen] = useState(false);

  const [customer, setCustomer] = useState<CustomerAccountPublic | null>(null);
  const [compareProductIds, setCompareProductIds] = useState<string[]>([]);
  const [compareModalOpen, setCompareModalOpen] = useState(false);
  const isMerchantOwner = currentUser?.emailVerified && currentUser?.email === 'bravinbrown8@gmail.com';
  const [ownerUnlocked, setOwnerUnlocked] = useState<boolean>(() => {
    try {
      return localStorage.getItem('elvora_owner_unlocked') === 'true';
    } catch {
      return false;
    }
  });

  const canSeeOwnerHub = ownerUnlocked || isMerchantOwner;
  const [ownerModalOpen, setOwnerModalOpen] = useState(false);
  const [ownerPinInput, setOwnerPinInput] = useState('');
  const [ownerPinError, setOwnerPinError] = useState<string | null>(null);

  const [bannerNotice, setBannerNotice] = useState<string | null>(null);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      const saved = localStorage.getItem('elvora_theme_v1');
      if (saved === 'light' || saved === 'dark') return saved;
    } catch {
      // Ignore storage read errors
    }
    return 'dark';
  });

  const formatPrice = (amountUsd: number) =>
    formatMoneyFromUsd(amountUsd, currencyCode, fxRates, customCurrency);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.add('no-theme-transition');
    root.dataset.theme = theme;
    try {
      localStorage.setItem('elvora_theme_v1', theme);
    } catch {
      // Ignore storage write errors
    }
    const frameId = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        root.classList.remove('no-theme-transition');
      });
    });
    return () => window.cancelAnimationFrame(frameId);
  }, [theme]);

  useEffect(() => {
    const unsub = subscribeToAuth((user) => {
      setCurrentUser(user);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    saveWishlistToStorage(wishlistProductIds);
  }, [wishlistProductIds]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [activeView]);

  useEffect(() => {
    let active = true;
    fetch('/api/state')
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('Failed to load state'))))
      .then((data: StoreState) => {
        if (active) {
          setStoreState(data);
        }
      })
      .catch(() => {
        // Seed state already initialized
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    // Load Live/Baseline Foreign Exchange Rates
    fetch('/api/fx-rates')
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        if (active && data && data.rates) {
          setFxRates(data.rates);
          if (data.source) setFxSource(data.source);
        }
      })
      .catch(() => {});

    // Restore Verified Customer Session
    const token = localStorage.getItem('elvora_cust_token');
    if (token) {
      fetch('/api/customers/me', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => (res.ok ? res.json() : Promise.reject()))
        .then((data) => {
          if (active && data && data.customer) {
            setCustomer(data.customer);
            if (data.customer.currencyCode) {
              setCurrencyCode(data.customer.currencyCode);
            }
          }
        })
        .catch(() => {
          localStorage.removeItem('elvora_cust_token');
        });
    }

    // Duration of splash screen
    const splashTimer = setTimeout(() => {
      setSplashVisible(false);
    }, 1200);

    return () => {
      active = false;
      clearTimeout(splashTimer);
    };
  }, []);

  const showToast = (msg: string) => {
    setBannerNotice(msg);
    setTimeout(() => {
      setBannerNotice((current) => (current === msg ? null : current));
    }, 4500);
  };

  const totalBagCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleToggleWishlist = (productId: string) => {
    setWishlistProductIds((prev) => {
      const next = toggleWishlistId(prev, productId);
      const isNowWishlisted = next.includes(productId);
      const targetProd = storeState.products.find((p) => p.id === productId);
      const itemTitle = targetProd ? targetProd.title : 'Item';
      showToast(
        isNowWishlisted
          ? `Saved ${itemTitle} to your Wishlist.`
          : `Removed ${itemTitle} from your Wishlist.`
      );
      return next;
    });
  };

  const handleMoveAllWishlistToBag = () => {
    const inStock = storeState.products.filter(
      (p) => wishlistProductIds.includes(p.id) && p.stockRemaining > 0
    );
    if (inStock.length === 0) {
      showToast('No wishlisted items are currently available to add.');
      return;
    }

    setCart((prev) => {
      const updated = [...prev];
      for (const prod of inStock) {
        const existing = updated.find((i) => i.productId === prod.id);
        if (existing) {
          existing.quantity = Math.min(prod.stockRemaining, existing.quantity + 1);
        } else {
          updated.push({ productId: prod.id, quantity: 1 });
        }
      }
      return updated;
    });

    setCartOpen(true);
    showToast(`Added ${inStock.length} wishlist models to your shopping bag.`);
  };

  const handleToggleCompare = (productId: string) => {
    setCompareProductIds((prev) => {
      const next = toggleCompareProductId(prev, productId, 3);
      const isComparing = next.includes(productId);
      const prod = storeState.products.find((p) => p.id === productId);
      const title = prod ? prod.title : 'Device';
      showToast(
        isComparing
          ? `Added ${title} to comparison matrix (${next.length}/3).`
          : `Removed ${title} from comparison matrix.`
      );
      return next;
    });
  };

  const handleSelectCurrency = (code: string, custom?: CustomCurrencyConfig | null) => {
    setCurrencyCode(code);
    try {
      localStorage.setItem('elvora_currency_v1', code);
    } catch {}

    if (custom) {
      setCustomCurrency(custom);
      try {
        localStorage.setItem('elvora_custom_currency_v1', JSON.stringify(custom));
      } catch {}
    } else {
      setCustomCurrency(null);
      try {
        localStorage.removeItem('elvora_custom_currency_v1');
      } catch {}
    }

    showToast(`Currency updated to ${code}. Prices recalculated instantly.`);
  };

  const handleCustomerRegister = async (input: RegisterCustomerInput) => {
    const res = await fetch('/api/customers/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to register customer account.');
    }
    if (data.token) {
      localStorage.setItem('elvora_cust_token', data.token);
    }
    setCustomer(data.customer);
    setCurrencyCode(data.customer.currencyCode);
    showToast(`Welcome to Elvora Electronics, ${data.customer.fullName}.`);
  };

  const handleCustomerLogin = async (input: LoginCustomerInput) => {
    const res = await fetch('/api/customers/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Invalid email/phone or password.');
    }
    if (data.token) {
      localStorage.setItem('elvora_cust_token', data.token);
    }
    setCustomer(data.customer);
    setCurrencyCode(data.customer.currencyCode);
    showToast(`Welcome back, ${data.customer.fullName}.`);
  };

  const handleCustomerUpdateProfile = async (input: UpdateCustomerProfileInput) => {
    const token = localStorage.getItem('elvora_cust_token');
    const res = await fetch('/api/customers/profile', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token ? `Bearer ${token}` : '',
      },
      body: JSON.stringify(input),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to update customer profile.');
    }
    setCustomer(data.customer);
    setCurrencyCode(data.customer.currencyCode);
    showToast('Customer profile & currency preference saved.');
  };

  const handleCustomerLogout = async () => {
    const token = localStorage.getItem('elvora_cust_token');
    if (token) {
      void fetch('/api/customers/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
      localStorage.removeItem('elvora_cust_token');
    }
    setCustomer(null);
    showToast('Signed out of your customer account.');
  };

  const handleAddToCart = (product: ProductItem, quantity = 1, openDrawer = true) => {
    if (product.stockRemaining <= 0) return;

    setCart((prev) => {
      const existing = prev.find((i) => i.productId === product.id);
      if (existing) {
        const capped = Math.min(product.stockRemaining, existing.quantity + quantity);
        return prev.map((i) =>
          i.productId === product.id ? { ...i, quantity: capped } : i
        );
      }
      return [
        ...prev,
        { productId: product.id, quantity: Math.min(product.stockRemaining, quantity) },
      ];
    });

    if (openDrawer) {
      setCartOpen(true);
    } else {
      showToast(`Added ${product.title} to your bag.`);
    }
  };

  const handleUpdateCartQty = (productId: string, nextQty: number) => {
    if (nextQty <= 0) {
      setCart((prev) => prev.filter((item) => item.productId !== productId));
      return;
    }
    const product = storeState.products.find((p) => p.id === productId);
    const maxStock = product ? product.stockRemaining : nextQty;
    setCart((prev) =>
      prev.map((item) =>
        item.productId === productId
          ? { ...item, quantity: Math.min(maxStock, nextQty) }
          : item
      )
    );
  };

  const handleApplyPromoCode = (code: string) => {
    setAppliedPromoCode(code.trim().toUpperCase());
    showToast(`Holiday code ${code.toUpperCase()} applied to your bag.`);
  };

  const handleSubmitOrder = async (checkout: CheckoutFormInput) => {
    setSubmittingOrder(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checkout, cart }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Unable to verify payment.');
      }

      setStoreState(data.state);
      setCart([]);
      setCartOpen(false);
      setTrackedOrderCode(data.order.orderCode);
      setActiveView('track');

      if (currentUser?.emailVerified) {
        void syncVerifiedOrderToFirestore(data.order).catch(() => {});
      }

      showToast(
        `Order ${data.order.orderCode} confirmed to ${data.order.ownerPayoutPhone}. Exact arrival: ${data.order.etaLabel}.`
      );
    } finally {
      setSubmittingOrder(false);
    }
  };

  const handleSaveSettings = async (patch: Partial<OwnerConfig>) => {
    const res = await fetch('/api/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to save settings.');
    }
    setStoreState(data.state);
    if (currentUser?.emailVerified) {
      void syncOwnerConfigToFirestore(data.ownerConfig).catch(() => {});
    }
    showToast(`Saved settings for ${data.ownerConfig.merchantName}.`);
  };

  const handleSourceOemProduct = async (
    templateId: string,
    batchUnits: number,
    freeShippingOnly: boolean
  ) => {
    const res = await fetch('/api/ai/source-product', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ templateId, batchUnits, freeShippingOnly }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to source Alibaba OEM product.');
    }
    setStoreState(data.state);
    if (currentUser?.emailVerified) {
      void syncProductToFirestore(data.product).catch(() => {});
    }
    showToast(
      `AI ordered ${batchUnits} units of ${data.product.title} at $${data.product.price} retail and posted it live.`
    );
  };

  const handleAskAiAssistant = async (prompt: string): Promise<{ reply: string }> => {
    const res = await fetch('/api/ai/assistant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'AI Manager unavailable.');
    }
    if (data.state) {
      setStoreState(data.state);
    }
    return { reply: data.reply };
  };

  const handleAdvanceOrder = async (orderId: string) => {
    const res = await fetch(`/api/orders/${encodeURIComponent(orderId)}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const data = await res.json();
    if (res.ok && data.state) {
      setStoreState(data.state);
      showToast(`Advanced ${orderId} delivery stage.`);
    }
  };

  const handleAdjustStock = async (
    productId: string,
    nextStock: number,
    postUpdate: boolean
  ) => {
    const res = await fetch(`/api/products/${encodeURIComponent(productId)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stockRemaining: nextStock, postUpdate }),
    });
    const data = await res.json();
    if (res.ok && data.state) {
      setStoreState(data.state);
      showToast(`Updated ${data.product.title}: ${data.product.stockRemaining} remaining.`);
    }
  };

  const handleSubmitReview = async (input: ReviewFormInput) => {
    const res = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Unable to post review.');
    }
    setStoreState(data.state);
    if (currentUser?.emailVerified) {
      void syncReviewToFirestore(data.review).catch(() => {});
    }
    showToast(`Published your ${data.review.rating}-star review for ${data.review.productTitle}.`);
  };

  const handleSubmitInquiry = async (input: InquiryFormInput) => {
    const res = await fetch('/api/inquiries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Unable to send message.');
    }
    setStoreState(data.state);
    if (currentUser?.emailVerified) {
      void syncInquiryToFirestore(data.inquiry).catch(() => {});
    }
    showToast(`Message sent to ${storeState.ownerConfig.merchantName}.`);
  };

  const handleResolveInquiry = async (inquiryId: string) => {
    const res = await fetch(`/api/inquiries/${encodeURIComponent(inquiryId)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'resolved' }),
    });
    const data = await res.json();
    if (res.ok && data.state) {
      setStoreState(data.state);
      showToast('Marked customer inquiry as resolved.');
    }
  };

  const navItems: { id: ActiveView; label: string }[] = useMemo(() => {
    const list: { id: ActiveView; label: string }[] = [
      { id: 'catalog', label: 'Catalog' },
      { id: 'track', label: 'Track Order' },
      { id: 'reviews', label: 'Reviews' },
      { id: 'contact', label: 'Contact' },
      {
        id: 'account',
        label: customer ? customer.fullName.split(' ')[0] : 'Account',
      },
    ];
    if (canSeeOwnerHub) {
      list.push({ id: 'manager', label: 'Owner Hub' });
    }
    return list;
  }, [customer, canSeeOwnerHub]);

  return (
    <>
      <AdScriptInjector
        scriptSnippet={storeState.ownerConfig.adScriptSnippet}
        isEnabled={storeState.ownerConfig.adScriptEnabled}
      />
      {splashVisible && <SplashScreen onDismiss={() => setSplashVisible(false)} />}
      <div className={`min-h-screen bg-[var(--elv-bg)] text-[var(--elv-text-body)] flex flex-col ${splashVisible ? 'opacity-0' : 'opacity-100 transition-opacity duration-1000'}`}>
        {/* Strict 3-Zone Top Bar Contract (52px on mobile to respect 15% sticky cap) */}
      <header className="sticky top-0 z-30 h-[52px] md:h-16 border-b border-[var(--elv-border)] bg-[var(--elv-header)] backdrop-blur-md">
        <div className="mx-auto flex h-full max-w-7xl items-center justify-between gap-4 sm:gap-8 px-4 sm:px-6 lg:px-8">
          {/* Zone 1: Premium Luxury Brand Lockup */}
          <a
            href="#catalog"
            onClick={(e) => {
              e.preventDefault();
              setActiveView('catalog');
            }}
            className="group inline-flex items-center gap-3 whitespace-nowrap shrink-0 transition-transform duration-300 hover:scale-[1.02] active:scale-[0.98]"
            aria-label="Elvora luxury electronics home"
          >
            <ElvoraImageLogo size="sm" className="rounded-xl shadow-[0_0_12px_rgba(220,168,54,0.3)] group-hover:shadow-[0_0_18px_rgba(247,226,152,0.45)]" />
            <div className="flex flex-col">
              <span className="font-display text-lg font-bold tracking-[0.24em] bg-gradient-to-r from-[#FFFBF0] via-[#F7E298] to-[#DCA836] bg-clip-text text-transparent drop-shadow-sm">
                ELVORA
              </span>
              <span className="hidden sm:block text-[9px] font-semibold tracking-[0.2em] text-[#A89874] uppercase -mt-0.5">
                HAUTE TECH
              </span>
            </div>
          </a>

          {/* Zone 2: Clean Single-Line Navigation Links */}
          <nav
            aria-label="Primary navigation"
            className="hidden md:flex items-center gap-6 lg:gap-7 text-sm font-medium text-[var(--elv-text-muted)]"
          >
            {navItems.map((nav) => (
              <button
                key={nav.id}
                type="button"
                onClick={() => setActiveView(nav.id)}
                className={`py-1 transition-colors whitespace-nowrap shrink-0 ${
                  activeView === nav.id
                    ? 'text-[var(--elv-text-gold)] underline underline-offset-8 decoration-2'
                    : 'hover:text-[var(--elv-text-strong)]'
                }`}
              >
                {nav.label}
              </button>
            ))}
          </nav>

          {/* Zone 3: Global Currency Switcher, Wishlist & Shopping Bag */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            {/* Global Multi-Country Currency Switcher */}
            <button
              type="button"
              onClick={() => setCurrencyModalOpen(true)}
              aria-label={`Currency ${currencyCode}. Click to switch global currency.`}
              className="elv-btn-outline inline-flex min-h-[38px] md:min-h-[40px] items-center gap-1.5 rounded-lg px-2.5 sm:px-3 py-1.5 md:py-2 text-xs font-semibold whitespace-nowrap shrink-0 transition-colors"
            >
              <Globe className="h-3.5 w-3.5 text-[var(--elv-text-gold)] shrink-0" aria-hidden="true" />
              <span className="font-mono text-xs">{currencyCode}</span>
            </button>

            {/* Quick Wishlist Access */}
            <button
              type="button"
              onClick={() => {
                setActiveView('catalog');
              }}
              aria-label={`Wishlist with ${wishlistProductIds.length} saved electronics`}
              className="elv-btn-outline inline-flex min-h-[38px] md:min-h-[40px] items-center gap-1.5 rounded-lg px-2.5 sm:px-3 py-1.5 md:py-2 text-xs font-semibold whitespace-nowrap shrink-0 transition-colors"
            >
              <Heart
                className={`h-3.5 w-3.5 shrink-0 transition-colors ${
                  wishlistProductIds.length > 0
                    ? 'fill-[#ecc55c] text-[#ecc55c]'
                    : 'text-[var(--elv-text-muted)]'
                }`}
                aria-hidden="true"
              />
              <span className="hidden sm:inline font-mono">Wishlist</span>
              <span className="font-mono text-[11px] text-[var(--elv-text-gold)]">
                ({wishlistProductIds.length})
              </span>
            </button>

            {/* Primary Action: Shopping Bag */}
            <button
              type="button"
              onClick={() => setCartOpen(true)}
              aria-label={`Open shopping bag with ${totalBagCount} items`}
              className="elv-btn-gold inline-flex min-h-[38px] md:min-h-[40px] items-center gap-2 rounded-lg px-3.5 md:px-4 py-1.5 md:py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
            >
              <ShoppingBag className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span className="font-mono tabular-nums">Bag ({totalBagCount})</span>
            </button>
          </div>
        </div>
      </header>

      {/* Non-intrusive Action Feedback Banner */}
      {bannerNotice && (
        <div
          role="status"
          aria-live="polite"
          className="border-b border-[var(--elv-border-strong)] bg-[var(--elv-promo-bg)] px-4 py-2.5 text-center text-xs font-semibold text-[var(--elv-text-gold)]"
        >
          {bannerNotice}
        </div>
      )}

      {/* Main Content Container */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 sm:px-6 lg:px-8">
        {/* Business Identity & Appearance Theme Bar (Black/Gold Dark vs Ivory/Black/Gold Light) */}
        <div className="flex items-center justify-between gap-4 border-b border-[var(--elv-border)] py-3">
          <p className="truncate text-xs text-[var(--elv-text-muted)]">
            <strong className="font-semibold text-[var(--elv-text-gold)]">
              {storeState.ownerConfig.merchantName}
            </strong>{' '}
            · {ELVORA_BRAND_MOTTO} · Tap or drag the round gold AI button anytime.
          </p>

          <div
            role="group"
            aria-label="Appearance theme"
            className="elv-panel inline-flex items-center gap-1 rounded-lg p-1 shrink-0"
          >
            <button
              type="button"
              aria-pressed={theme === 'light'}
              onClick={() => setTheme('light')}
              className={`inline-flex min-h-[32px] items-center gap-1.5 rounded-md px-3 py-1 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                theme === 'light'
                  ? 'elv-btn-gold'
                  : 'text-[var(--elv-text-body)] hover:text-[var(--elv-text-strong)]'
              }`}
            >
              <Sun className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Light</span>
            </button>
            <button
              type="button"
              aria-pressed={theme === 'dark'}
              onClick={() => setTheme('dark')}
              className={`inline-flex min-h-[32px] items-center gap-1.5 rounded-md px-3 py-1 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                theme === 'dark'
                  ? 'elv-btn-gold'
                  : 'text-[var(--elv-text-body)] hover:text-[var(--elv-text-strong)]'
              }`}
            >
              <Moon className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Dark</span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="py-24 text-center text-sm text-[var(--elv-text-muted)]">
            Loading {storeState.ownerConfig.merchantName} electronics vault...
          </div>
        ) : (
          <>
            {activeView === 'catalog' && (
              <CatalogView
                products={storeState.products}
                posts={storeState.aiPosts}
                reviews={storeState.reviews}
                advertisements={storeState.ownerConfig.advertisements ?? storeState.advertisements}
                adsEnabled={storeState.ownerConfig.adsEnabled ?? true}
                businessName={storeState.ownerConfig.merchantName}
                ownerPhone={storeState.ownerConfig.payoutPhone}
                activeCampaignId={storeState.ownerConfig.activeHolidayCampaign}
                appliedPromoCode={appliedPromoCode}
                totalOrdersCount={storeState.orders.length}
                wishlistProductIds={wishlistProductIds}
                compareProductIds={compareProductIds}
                formatPrice={formatPrice}
                activeCurrencyCode={currencyCode}
                onToggleWishlist={handleToggleWishlist}
                onToggleCompare={handleToggleCompare}
                onOpenCompareModal={() => setCompareModalOpen(true)}
                onMoveAllWishlistToBag={handleMoveAllWishlistToBag}
                onOpenCurrencyModal={() => setCurrencyModalOpen(true)}
                onApplyPromoCode={handleApplyPromoCode}
                onAddToCart={handleAddToCart}
                onNavigateTrack={() => setActiveView('track')}
                onNavigateReviews={() => setActiveView('reviews')}
              />
            )}

            {activeView === 'track' && (
              <OrderTrackingView
                orders={storeState.orders}
                businessName={storeState.ownerConfig.merchantName}
                initialOrderCode={trackedOrderCode}
                formatPrice={formatPrice}
                onBackToCatalog={() => setActiveView('catalog')}
              />
            )}

            {activeView === 'reviews' && (
              <ReviewsView
                reviews={storeState.reviews}
                products={storeState.products}
                businessName={storeState.ownerConfig.merchantName}
                onSubmitReview={handleSubmitReview}
                onAddToCart={handleAddToCart}
              />
            )}

            {activeView === 'contact' && (
              <ContactView
                ownerConfig={storeState.ownerConfig}
                onSubmitInquiry={handleSubmitInquiry}
              />
            )}

            {activeView === 'account' && (
              <CustomerAccountView
                customer={customer}
                orders={storeState.orders}
                businessName={storeState.ownerConfig.merchantName}
                activeCurrencyCode={currencyCode}
                formatPrice={formatPrice}
                onRegister={handleCustomerRegister}
                onLogin={handleCustomerLogin}
                onUpdateProfile={handleCustomerUpdateProfile}
                onLogout={handleCustomerLogout}
                onGoogleSignIn={async () => {
                  try {
                    await signInWithGoogle();
                    showToast('Signed in with Google.');
                  } catch {
                    showToast('Google Sign-In canceled.');
                  }
                }}
                onOpenCurrencyModal={() => setCurrencyModalOpen(true)}
                onTrackOrder={(code) => {
                  setTrackedOrderCode(code);
                  setActiveView('track');
                }}
                onBrowseCatalog={() => setActiveView('catalog')}
              />
            )}

            {activeView === 'manager' && (
              <OwnerMobileHub
                state={storeState}
                currentUser={currentUser}
                onGoogleSignIn={async () => {
                  try {
                    await signInWithGoogle();
                    showToast('Signed in and synced with Cloud Firestore.');
                  } catch {
                    showToast('Google Sign-In popup closed.');
                  }
                }}
                onGoogleSignOut={async () => {
                  await signOutUser();
                  showToast('Signed out.');
                }}
                onSaveSettings={handleSaveSettings}
                onSourceOemProduct={handleSourceOemProduct}
                onAskAiAssistant={handleAskAiAssistant}
                onAdvanceOrder={handleAdvanceOrder}
                onAdjustStock={handleAdjustStock}
                onResolveInquiry={handleResolveInquiry}
                onLockOwnerSession={() => {
                  setOwnerUnlocked(false);
                  localStorage.removeItem('elvora_owner_unlocked');
                  setActiveView('catalog');
                  showToast('Owner session locked. Hub is now hidden.');
                }}
              />
            )}
          </>
        )}
      </main>

      {/* Quiet Minimalist Footer with Official Business Name & Contact Links */}
      <footer className="border-t border-[var(--elv-border)] bg-[var(--elv-surface)] py-10 mb-14 md:mb-0">
        <div className="mx-auto flex max-w-7xl flex-col md:flex-row items-start md:items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
          <ElvoraBrandEmblem
            showMotto={true}
            businessName={storeState.ownerConfig.merchantName}
            size="sm"
          />
          <div className="flex flex-wrap items-center gap-4 text-xs text-[var(--elv-text-muted)]">
            <button
              type="button"
              onClick={() => setActiveView('reviews')}
              className="hover:text-[var(--elv-text-gold)] underline underline-offset-4"
            >
              Customer Reviews ({storeState.reviews.length})
            </button>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={() => setActiveView('contact')}
              className="hover:text-[var(--elv-text-gold)] underline underline-offset-4"
            >
              Contact Us ({storeState.ownerConfig.payoutPhone})
            </button>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={() => setActiveView('account')}
              className="hover:text-[var(--elv-text-gold)] underline underline-offset-4"
            >
              {customer ? `Account (${customer.fullName.split(' ')[0]})` : 'Customer Sign In'}
            </button>
            {!isInstalled && (isInstallable || isIOS) && (
              <>
                <span aria-hidden="true">·</span>
                <button
                  type="button"
                  onClick={install}
                  className="font-semibold text-[var(--elv-text-gold)] animate-pulse hover:underline"
                >
                  {isIOS ? 'Add to Home Screen' : 'Install App'}
                </button>
              </>
            )}
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={() => {
                if (ownerUnlocked) {
                  setActiveView('manager');
                } else {
                  setOwnerModalOpen(true);
                }
              }}
              className="hover:text-[var(--elv-text-gold)] underline underline-offset-4 font-mono text-[11px]"
            >
              {ownerUnlocked ? 'Owner Hub' : 'Owner Portal'}
            </button>
            <span aria-hidden="true">·</span>
            <span>
              © {new Date().getFullYear()} {storeState.ownerConfig.merchantName}
            </span>
          </div>
        </div>
      </footer>

      {/* Mobile Fixed Thumb-Zone Bottom Tab Bar */}
      <nav
        aria-label="Mobile bottom navigation"
        className={`fixed bottom-0 left-0 right-0 z-40 grid h-14 ${ownerUnlocked ? 'grid-cols-5' : 'grid-cols-4'} items-center border-t border-[var(--elv-border)] bg-[var(--elv-header)] backdrop-blur-md md:hidden`}
      >
        <button
          type="button"
          onClick={() => setActiveView('catalog')}
          className={`flex h-full flex-col items-center justify-center border-t-2 text-[10px] font-medium transition-colors ${
            activeView === 'catalog'
              ? 'border-[var(--elv-text-gold)] text-[var(--elv-text-gold)]'
              : 'border-transparent text-[var(--elv-text-muted)]'
          }`}
        >
          <ShoppingBag className="h-4 w-4" aria-hidden="true" />
          <span className="mt-0.5">Shop</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveView('track')}
          className={`flex h-full flex-col items-center justify-center border-t-2 text-[10px] font-medium transition-colors ${
            activeView === 'track'
              ? 'border-[var(--elv-text-gold)] text-[var(--elv-text-gold)]'
              : 'border-transparent text-[var(--elv-text-muted)]'
          }`}
        >
          <PackageSearch className="h-4 w-4" aria-hidden="true" />
          <span className="mt-0.5">Track</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveView('reviews')}
          className={`flex h-full flex-col items-center justify-center border-t-2 text-[10px] font-medium transition-colors ${
            activeView === 'reviews'
              ? 'border-[var(--elv-text-gold)] text-[var(--elv-text-gold)]'
              : 'border-transparent text-[var(--elv-text-muted)]'
          }`}
        >
          <Star className="h-4 w-4" aria-hidden="true" />
          <span className="mt-0.5">Reviews</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveView('account')}
          className={`flex h-full flex-col items-center justify-center border-t-2 text-[10px] font-medium transition-colors ${
            activeView === 'account'
              ? 'border-[var(--elv-text-gold)] text-[var(--elv-text-gold)]'
              : 'border-transparent text-[var(--elv-text-muted)]'
          }`}
        >
          <UserIcon className="h-4 w-4" aria-hidden="true" />
          <span className="mt-0.5">{customer ? 'Account' : 'Sign In'}</span>
        </button>

        {ownerUnlocked && (
          <button
            type="button"
            onClick={() => setActiveView('manager')}
            className={`flex h-full flex-col items-center justify-center border-t-2 text-[10px] font-medium transition-colors ${
              activeView === 'manager'
                ? 'border-[var(--elv-text-gold)] text-[var(--elv-text-gold)]'
                : 'border-transparent text-[var(--elv-text-muted)]'
            }`}
          >
            <Smartphone className="h-4 w-4" aria-hidden="true" />
            <span className="mt-0.5">Owner</span>
          </button>
        )}
      </nav>

      {/* Owner Access Passcode Modal */}
      {ownerModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="owner-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
        >
          <div className="elv-card w-full max-w-md rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl border border-[var(--elv-text-gold)]/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="h-5 w-5 text-[var(--elv-text-gold)]" aria-hidden="true" />
                <h2 id="owner-modal-title" className="font-display text-lg font-bold text-[var(--elv-text-strong)]">
                  Store Owner Access Portal
                </h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  setOwnerModalOpen(false);
                  setOwnerPinInput('');
                  setOwnerPinError(null);
                }}
                className="p-1.5 text-[var(--elv-text-muted)] hover:text-[var(--elv-text-strong)] rounded-lg"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <p className="text-xs text-[var(--elv-text-muted)]">
              Enter your store owner PIN or passphrase to securely unlock the Owner Hub and manage orders, inventory, and merchant settings.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const clean = ownerPinInput.trim().toLowerCase();
                if (clean === 'elvora2026' || clean === 'elvora' || clean === storeState.ownerConfig.payoutPhone.toLowerCase()) {
                  setOwnerUnlocked(true);
                  localStorage.setItem('elvora_owner_unlocked', 'true');
                  setOwnerModalOpen(false);
                  setOwnerPinInput('');
                  setOwnerPinError(null);
                  setActiveView('manager');
                  showToast('Owner Hub unlocked successfully.');
                } else {
                  setOwnerPinError('Incorrect owner passcode. Try elvora2026');
                }
              }}
              className="space-y-4"
            >
              <div>
                <label htmlFor="owner-pin" className="block text-xs font-medium text-[var(--elv-text-body)] mb-1.5">
                  Owner Passcode
                </label>
                <input
                  id="owner-pin"
                  type="password"
                  value={ownerPinInput}
                  onChange={(e) => {
                    setOwnerPinInput(e.target.value);
                    if (ownerPinError) setOwnerPinError(null);
                  }}
                  placeholder="Enter passcode (e.g. elvora2026)"
                  className="elv-input min-h-[44px] w-full rounded-lg px-3.5 text-sm font-mono"
                  autoFocus
                />
                {ownerPinError && (
                  <p role="alert" className="mt-1 text-xs font-medium text-[var(--elv-text-gold)]">
                    {ownerPinError}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setOwnerModalOpen(false);
                    setOwnerPinInput('');
                    setOwnerPinError(null);
                  }}
                  className="elv-btn-outline flex-1 min-h-[44px] rounded-lg px-4 py-2 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="elv-btn-gold flex-1 min-h-[44px] rounded-lg px-4 py-2 text-xs font-semibold"
                >
                  Unlock Owner Hub
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Round & Movable Customer Shopping AI Concierge */}
      <CustomerAiOrb
        ownerPhone={storeState.ownerConfig.payoutPhone}
        businessName={storeState.ownerConfig.merchantName}
        onSuggestedAction={(action) => {
          if (action === 'open_bag') {
            setCartOpen(true);
          } else if (action === 'track_order') {
            setActiveView('track');
          } else if (action === 'open_reviews') {
            setActiveView('reviews');
          } else if (action === 'open_contact') {
            setActiveView('contact');
          } else {
            setActiveView('catalog');
          }
        }}
      />

      {/* Slide-Over Cart & Prepaid Checkout Drawer */}
      <CartCheckoutDrawer
        isOpen={cartOpen}
        cart={cart}
        products={storeState.products}
        businessName={storeState.ownerConfig.merchantName}
        ownerPayoutPhone={storeState.ownerConfig.payoutPhone}
        activeCampaignId={storeState.ownerConfig.activeHolidayCampaign}
        appliedPromoCode={appliedPromoCode}
        submitting={submittingOrder}
        formatPrice={formatPrice}
        customer={customer}
        onPromoCodeChange={setAppliedPromoCode}
        onAddSuggestedProduct={(prod) => handleAddToCart(prod, 1, true)}
        onClose={() => setCartOpen(false)}
        onUpdateQty={handleUpdateCartQty}
        onSubmitOrder={handleSubmitOrder}
      />

      {/* Global Multi-Country Currency Selector Modal */}
      <CurrencySelectorModal
        isOpen={currencyModalOpen}
        activeCurrencyCode={currencyCode}
        customCurrency={customCurrency}
        fxRates={fxRates}
        fxSource={fxSource}
        onSelectCurrency={handleSelectCurrency}
        onClose={() => setCurrencyModalOpen(false)}
      />

      {/* iOS Safari PWA Install Guide */}
      {showIOSGuide && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
        >
          <div className="elv-card w-full max-w-sm rounded-2xl p-6 sm:p-8 space-y-5 shadow-2xl border border-[var(--elv-text-gold)]/30 text-center">
            <ElvoraBrandEmblem size="sm" align="center" showMotto={false} className="mx-auto" />
            
            <div className="space-y-2">
              <h3 className="font-display text-lg font-bold text-[var(--elv-text-strong)]">
                Install Elvora on iPhone
              </h3>
              <p className="text-xs text-[var(--elv-text-muted)] leading-relaxed">
                Add Elvora to your home screen for a premium standalone experience and exact arrival notifications.
              </p>
            </div>

            <div className="elv-panel rounded-xl p-4 text-left space-y-3 border border-[var(--elv-border-strong)]">
              <div className="flex items-center gap-3 text-xs text-[var(--elv-text-body)]">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--elv-text-gold)] text-[var(--elv-bg)] font-bold text-[10px]">1</span>
                <span>Tap the <strong>Share</strong> button in Safari.</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-[var(--elv-text-body)]">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--elv-text-gold)] text-[var(--elv-bg)] font-bold text-[10px]">2</span>
                <span>Scroll down and tap <strong>Add to Home Screen</strong>.</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowIOSGuide(false)}
              className="elv-btn-gold w-full min-h-[44px] rounded-lg px-4 py-2 text-xs font-semibold"
            >
              Got it, thanks
            </button>
          </div>
        </div>
      )}

      {/* Side-by-Side Model Specifications Comparison Modal */}
      <ProductCompareModal
        isOpen={compareModalOpen}
        comparedProducts={storeState.products.filter((p) =>
          compareProductIds.includes(p.id)
        )}
        allProducts={storeState.products}
        formatPrice={formatPrice}
        onClose={() => setCompareModalOpen(false)}
        onRemoveProduct={handleToggleCompare}
        onClearAll={() => setCompareProductIds([])}
        onSelectProductToCompare={handleToggleCompare}
        onAddToCart={handleAddToCart}
      />
    </div>
    </>
  );
}

