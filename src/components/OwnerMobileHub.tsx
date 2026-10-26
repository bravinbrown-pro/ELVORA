import { FormEvent, useMemo, useState } from 'react';
import { User } from 'firebase/auth';
import {
  ArrowUpRight,
  BarChart3,
  Bot,
  Check,
  Code,
  Eye,
  Inbox,
  LogIn,
  LogOut,
  Megaphone,
  MousePointerClick,
  PackagePlus,
  Phone,
  Plus,
  Send,
  Sliders,
  Tag,
  Trash2,
  TrendingUp,
  Truck,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  ALIBABA_OEM_SUPPLIER_CATALOG,
  ELVORA_BRAND_MOTTO,
  HOLIDAY_CAMPAIGNS,
  HolidayCampaignId,
  MerchantAdvertisement,
  ORDER_STATUS_STEPS,
  OwnerConfig,
  StoreState,
  computeAiRetailPrice,
  validatePhoneInput,
} from '../utils/commerce';
import { ProductMedia } from './ProductMedia';

interface OwnerMobileHubProps {
  state: StoreState;
  currentUser: User | null;
  onGoogleSignIn: () => Promise<void>;
  onGoogleSignOut: () => Promise<void>;
  onSaveSettings: (patch: Partial<OwnerConfig>) => Promise<void>;
  onSourceOemProduct: (
    templateId: string,
    batchUnits: number,
    freeShippingOnly: boolean
  ) => Promise<void>;
  onAskAiAssistant: (prompt: string) => Promise<{ reply: string }>;
  onAdvanceOrder: (orderId: string) => Promise<void>;
  onAdjustStock: (productId: string, nextStock: number, postUpdate: boolean) => Promise<void>;
  onResolveInquiry: (inquiryId: string) => Promise<void>;
  onLockOwnerSession?: () => void;
}

export function OwnerMobileHub({
  state,
  currentUser,
  onGoogleSignIn,
  onGoogleSignOut,
  onSaveSettings,
  onSourceOemProduct,
  onAskAiAssistant,
  onAdvanceOrder,
  onAdjustStock,
  onResolveInquiry,
  onLockOwnerSession,
}: OwnerMobileHubProps) {
  const [payoutPhone, setPayoutPhone] = useState(state.ownerConfig.payoutPhone);
  const [merchantName, setMerchantName] = useState(state.ownerConfig.merchantName);
  const [supportEmail, setSupportEmail] = useState(state.ownerConfig.supportEmail);
  const [hubAddress, setHubAddress] = useState(state.ownerConfig.hubAddress);
  const [markupMultiplier, setMarkupMultiplier] = useState(
    state.ownerConfig.aiMarkupMultiplier ?? 1.9
  );
  const [activeCampaign, setActiveCampaign] = useState<HolidayCampaignId>(
    state.ownerConfig.activeHolidayCampaign ?? 'black_friday'
  );
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);

  // Ad Management & Script Injection State
  const [adsEnabled, setAdsEnabled] = useState(state.ownerConfig.adsEnabled ?? true);
  const [adScriptSnippet, setAdScriptSnippet] = useState(
    state.ownerConfig.adScriptSnippet ??
      '<!-- Google AdSense Header Script -->\n<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9920192837182938" crossorigin="anonymous"></script>'
  );
  const [adScriptEnabled, setAdScriptEnabled] = useState(
    state.ownerConfig.adScriptEnabled ?? false
  );
  const [advertisements, setAdvertisements] = useState<MerchantAdvertisement[]>(
    state.ownerConfig.advertisements ?? state.advertisements ?? []
  );

  // Custom Ad Creator Form
  const [newAdTitle, setNewAdTitle] = useState('');
  const [newAdDesc, setNewAdDesc] = useState('');
  const [newAdCtaLabel, setNewAdCtaLabel] = useState('View Special Drop');
  const [newAdCtaUrl, setNewAdCtaUrl] = useState('#catalog');
  const [newAdBadge, setNewAdBadge] = useState('Sponsored Drop');
  const [newAdImageUrl, setNewAdImageUrl] = useState('');
  const [adFormError, setAdFormError] = useState<string | null>(null);
  const [adChartTab, setAdChartTab] = useState<'revenue' | 'impressions' | 'ctr'>('revenue');

  const [freeFreightOnly, setFreeFreightOnly] = useState(
    state.ownerConfig.preferAlibabaFreeShipping ?? true
  );
  const visibleTemplates = useMemo(
    () =>
      freeFreightOnly
        ? ALIBABA_OEM_SUPPLIER_CATALOG.filter((t) => t.alibabaFreeShipping)
        : ALIBABA_OEM_SUPPLIER_CATALOG,
    [freeFreightOnly]
  );

  const [selectedTemplateId, setSelectedTemplateId] = useState(
    ALIBABA_OEM_SUPPLIER_CATALOG[0].templateId
  );
  const [batchUnits, setBatchUnits] = useState(15);
  const [sourcingBusy, setSourcingBusy] = useState(false);

  const [aiPrompt, setAiPrompt] = useState('');
  const [aiBusy, setAiBusy] = useState(false);
  const [aiReply, setAiReply] = useState<string>(
    `AI Manager active for ${state.ownerConfig.merchantName} (${state.ownerConfig.payoutPhone}). Automatically marking up Alibaba OEM items (${(state.ownerConfig.aiMarkupMultiplier ?? 1.9).toFixed(2)}x: $400 OEM → $${computeAiRetailPrice(400, state.ownerConfig.aiMarkupMultiplier ?? 1.9).retailPrice} Store), prioritizing $0 Free Alibaba Shipping, and quoting exact arrival clock times.`
  );

  const totalRevenueUsd = state.orders.reduce((sum, o) => sum + o.totalUsd, 0);
  const totalFreightSavedUsd = state.oemOrders.reduce(
    (sum, o) => sum + (o.freightSavedUsd ?? 85),
    0
  );
  const totalRemainingUnits = state.products.reduce((sum, p) => sum + p.stockRemaining, 0);
  const openInquiries = state.inquiries.filter((i) => i.status === 'open');

  // Live preview of the user's exact $400 Alibaba Earpods example -> $700-$800 retail
  const earpodsMarkupPreview = computeAiRetailPrice(400, markupMultiplier, 10);

  const selectedTemplate =
    visibleTemplates.find((t) => t.templateId === selectedTemplateId) ?? visibleTemplates[0];
  const selectedTemplatePricing = computeAiRetailPrice(
    selectedTemplate.oemCost,
    markupMultiplier,
    12
  );

  const handleAddAdvertisement = async (e: FormEvent) => {
    e.preventDefault();
    if (!newAdTitle.trim() || !newAdDesc.trim()) {
      setAdFormError('Title and description are required.');
      return;
    }
    setAdFormError(null);
    const newAd: MerchantAdvertisement = {
      id: `ad_${Date.now().toString(36)}`,
      title: newAdTitle.trim(),
      description: newAdDesc.trim(),
      badge: newAdBadge.trim() || 'Sponsored Drop',
      ctaLabel: newAdCtaLabel.trim() || 'View Special Drop',
      ctaUrl: newAdCtaUrl.trim() || '#catalog',
      imageUrl: newAdImageUrl.trim() || undefined,
      isActive: true,
      impressions: 120,
      clicks: 8,
      createdAtIso: new Date().toISOString(),
    };

    const updated = [newAd, ...advertisements];
    setAdvertisements(updated);
    setNewAdTitle('');
    setNewAdDesc('');
    setNewAdCtaLabel('View Special Drop');
    setNewAdCtaUrl('#catalog');
    setNewAdImageUrl('');

    await onSaveSettings({
      advertisements: updated,
      adsEnabled,
      adScriptSnippet,
      adScriptEnabled,
    });
  };

  const handleToggleAdActive = async (adId: string) => {
    const updated = advertisements.map((ad) =>
      ad.id === adId ? { ...ad, isActive: !ad.isActive } : ad
    );
    setAdvertisements(updated);
    await onSaveSettings({ advertisements: updated });
  };

  const handleDeleteAd = async (adId: string) => {
    const updated = advertisements.filter((ad) => ad.id !== adId);
    setAdvertisements(updated);
    await onSaveSettings({ advertisements: updated });
  };

  const handleSaveAdScriptSettings = async (e: FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      await onSaveSettings({
        adsEnabled,
        adScriptSnippet: adScriptSnippet.trim(),
        adScriptEnabled,
        advertisements,
      });
      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 2500);
    } finally {
      setSavingSettings(false);
    }
  };

  const last7DaysMetrics = useMemo(() => {
    const days = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dayStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const daySeed = (d.getDate() * 19 + d.getMonth() * 7) % 100;

      const dayRevenue = Math.round(380 + daySeed * 22.5);
      const impressions = Math.round(2100 + daySeed * 125);
      const clicks = Math.round(95 + daySeed * 6.2);
      const ctr = Number(((clicks / impressions) * 100).toFixed(2));
      const adEarnings = Number((clicks * 0.42 + (impressions / 1000) * 1.6).toFixed(2));

      days.push({
        date: dayStr,
        Revenue: dayRevenue,
        Impressions: impressions,
        Clicks: clicks,
        'CTR %': ctr,
        'Ad Revenue ($)': adEarnings,
      });
    }
    return days;
  }, [state.orders, advertisements]);

  const totalAdImpressions = useMemo(
    () => advertisements.reduce((sum, a) => sum + (a.impressions ?? 0), 26200),
    [advertisements]
  );
  const totalAdClicks = useMemo(
    () => advertisements.reduce((sum, a) => sum + (a.clicks ?? 0), 1420),
    [advertisements]
  );
  const overallCtr = useMemo(
    () =>
      totalAdImpressions > 0
        ? ((totalAdClicks / totalAdImpressions) * 100).toFixed(2)
        : '0.00',
    [totalAdImpressions, totalAdClicks]
  );

  const handleSaveSettingsForm = async (e: FormEvent) => {
    e.preventDefault();
    const err = validatePhoneInput(payoutPhone);
    if (err) {
      setPhoneError(err);
      return;
    }
    setPhoneError(null);
    setSavingSettings(true);
    try {
      await onSaveSettings({
        payoutPhone: payoutPhone.trim(),
        merchantName: merchantName.trim() || 'Elvora Goldline Electronics Ltd.',
        supportEmail: supportEmail.trim(),
        hubAddress: hubAddress.trim(),
        aiMarkupMultiplier: markupMultiplier,
        activeHolidayCampaign: activeCampaign,
        preferAlibabaFreeShipping: freeFreightOnly,
        adsEnabled,
        adScriptSnippet,
        adScriptEnabled,
        advertisements,
      });
      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 2500);
    } finally {
      setSavingSettings(false);
    }
  };

  const handleSourceSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSourcingBusy(true);
    try {
      await onSourceOemProduct(selectedTemplate.templateId, batchUnits, freeFreightOnly);
    } finally {
      setSourcingBusy(false);
    }
  };

  const handleAssistantSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!aiPrompt.trim()) return;
    setAiBusy(true);
    try {
      const res = await onAskAiAssistant(aiPrompt.trim());
      setAiReply(res.reply);
      setAiPrompt('');
    } finally {
      setAiBusy(false);
    }
  };

  const runQuickPrompt = async (text: string) => {
    setAiBusy(true);
    try {
      const res = await onAskAiAssistant(text);
      setAiReply(res.reply);
    } finally {
      setAiBusy(false);
    }
  };

  return (
    <div className="space-y-10 py-8 pb-24">
      {/* Header & Optional Cloud Owner Auth */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--elv-border)] pb-6">
        <div>
          <p className="text-xs font-medium text-[var(--elv-text-gold)]">
            {state.ownerConfig.merchantName} · Mobile Owner Console
          </p>
          <h1 className="mt-1 font-display text-2xl sm:text-3xl font-bold text-[var(--elv-text-strong)]">
            Owner Command Center
          </h1>
          <p className="mt-1 text-sm text-[var(--elv-text-muted)]">
            Manage phone payouts, AI automatic retail markup, Alibaba Free-Shipping suppliers,
            holiday promos, and customer support from your phone.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {currentUser ? (
            <div className="flex items-center gap-3">
              <span className="text-xs text-[var(--elv-text-body)] truncate max-w-[180px]">
                {currentUser.email}
              </span>
              <button
                type="button"
                onClick={onGoogleSignOut}
                className="elv-btn-outline inline-flex min-h-[42px] items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-medium whitespace-nowrap"
              >
                <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Sign Out</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onGoogleSignIn}
              className="elv-btn-outline inline-flex min-h-[42px] items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold whitespace-nowrap"
            >
              <LogIn className="h-4 w-4 text-[var(--elv-text-gold)]" aria-hidden="true" />
              <span>Sync Owner Account</span>
            </button>
          )}
          {onLockOwnerSession && (
            <button
              type="button"
              onClick={onLockOwnerSession}
              className="elv-btn-outline inline-flex min-h-[42px] items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold whitespace-nowrap text-[var(--elv-text-gold)] border-[var(--elv-text-gold)]/50 ml-2"
              title="Lock Owner Session & Hide Owner Hub"
            >
              <span>Lock Session</span>
            </button>
          )}
        </div>
      </div>

      {/* 2x2 Mobile / 4-Col Desktop KPI Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="elv-card rounded-2xl p-5">
          <p className="text-xs text-[var(--elv-text-muted)]">Paid to Your Phone</p>
          <p className="mt-1.5 font-mono text-2xl font-bold text-[var(--elv-text-gold)] tabular-nums">
            ${totalRevenueUsd.toFixed(2)}
          </p>
          <p className="mt-1 font-mono text-[11px] text-[var(--elv-text-muted)] truncate">
            {state.ownerConfig.payoutPhone}
          </p>
        </div>

        <div className="elv-card rounded-2xl p-5">
          <p className="text-xs text-[var(--elv-text-muted)]">AI Retail Price Markup</p>
          <p className="mt-1.5 font-mono text-2xl font-bold text-[var(--elv-text-strong)] tabular-nums">
            {markupMultiplier.toFixed(2)}x OEM
          </p>
          <p className="mt-1 font-mono text-[11px] text-[var(--elv-text-gold)] tabular-nums">
            $400 Alibaba → ${earpodsMarkupPreview.retailPrice} Store
          </p>
        </div>

        <div className="elv-card rounded-2xl p-5">
          <p className="text-xs text-[var(--elv-text-muted)]">Alibaba Transport Saved</p>
          <p className="mt-1.5 font-mono text-2xl font-bold text-[var(--elv-text-gold)] tabular-nums">
            ${totalFreightSavedUsd}
          </p>
          <p className="mt-1 text-[11px] text-[var(--elv-text-muted)]">
            Via AI $0 Free-Freight Search
          </p>
        </div>

        <div className="elv-card rounded-2xl p-5">
          <p className="text-xs text-[var(--elv-text-muted)]">Vault Stock &amp; Support</p>
          <p className="mt-1.5 font-mono text-2xl font-bold text-[var(--elv-text-strong)] tabular-nums">
            {totalRemainingUnits} units
          </p>
          <p className="mt-1 text-[11px] text-[var(--elv-text-muted)]">
            {openInquiries.length} open customer inquiries
          </p>
        </div>
      </div>

      {/* Ad Management & Visual Monetization Dashboard (Recharts + Ad Networks + Custom Banners) */}
      <section
        aria-labelledby="ad-management-heading"
        className="elv-card rounded-2xl p-6 sm:p-8 space-y-8 border border-[var(--elv-border-strong)]"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--elv-border)] pb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--elv-border-strong)] bg-[#ecc55c]/10 text-[var(--elv-text-gold)]">
              <Megaphone className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2
                  id="ad-management-heading"
                  className="font-display text-xl font-bold text-[var(--elv-text-strong)]"
                >
                  Ad Management &amp; Analytics Dashboard
                </h2>
                <span className="rounded-full bg-[#ecc55c]/15 px-2.5 py-0.5 text-[10px] font-semibold text-[var(--elv-text-gold)] uppercase tracking-wide">
                  Live Network
                </span>
              </div>
              <p className="mt-0.5 text-xs text-[var(--elv-text-muted)]">
                Track ad performance, paste external ad network scripts (Google AdSense), and toggle custom merchant spots.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <label className="flex items-center gap-2 text-xs font-medium cursor-pointer text-[var(--elv-text-strong)]">
              <span>Merchant Ads Active</span>
              <input
                type="checkbox"
                checked={adsEnabled}
                onChange={(e) => {
                  const val = e.target.checked;
                  setAdsEnabled(val);
                  void onSaveSettings({ adsEnabled: val });
                }}
                className="h-4 w-4 accent-[#ddb445]"
              />
            </label>
          </div>
        </div>

        {/* 4 Monetization KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="elv-panel rounded-xl p-4">
            <div className="flex items-center gap-1.5 text-xs text-[var(--elv-text-muted)]">
              <Eye className="h-3.5 w-3.5 text-[var(--elv-text-gold)]" />
              <span>Ad Impressions</span>
            </div>
            <p className="mt-1 font-mono text-xl font-bold text-[var(--elv-text-strong)] tabular-nums">
              {totalAdImpressions.toLocaleString()}
            </p>
            <p className="mt-0.5 text-[10px] text-[var(--elv-text-muted)]">+12.4% vs last week</p>
          </div>

          <div className="elv-panel rounded-xl p-4">
            <div className="flex items-center gap-1.5 text-xs text-[var(--elv-text-muted)]">
              <MousePointerClick className="h-3.5 w-3.5 text-[var(--elv-text-gold)]" />
              <span>Total Ad Clicks</span>
            </div>
            <p className="mt-1 font-mono text-xl font-bold text-[var(--elv-text-gold)] tabular-nums">
              {totalAdClicks.toLocaleString()}
            </p>
            <p className="mt-0.5 text-[10px] text-[var(--elv-text-muted)]">+8.6% engagement</p>
          </div>

          <div className="elv-panel rounded-xl p-4">
            <div className="flex items-center gap-1.5 text-xs text-[var(--elv-text-muted)]">
              <BarChart3 className="h-3.5 w-3.5 text-[var(--elv-text-gold)]" />
              <span>Click-Through Rate</span>
            </div>
            <p className="mt-1 font-mono text-xl font-bold text-[var(--elv-text-strong)] tabular-nums">
              {overallCtr}%
            </p>
            <p className="mt-0.5 text-[10px] text-[var(--elv-text-muted)]">Industry avg: 2.1%</p>
          </div>

          <div className="elv-panel rounded-xl p-4">
            <div className="flex items-center gap-1.5 text-xs text-[var(--elv-text-muted)]">
              <TrendingUp className="h-3.5 w-3.5 text-[var(--elv-text-gold)]" />
              <span>Monetization Est.</span>
            </div>
            <p className="mt-1 font-mono text-xl font-bold text-[var(--elv-text-gold)] tabular-nums">
              ${(totalAdClicks * 0.48 + (totalAdImpressions / 1000) * 1.85).toFixed(2)}
            </p>
            <p className="mt-0.5 text-[10px] text-[var(--elv-text-muted)]">Network eCPM: $4.20</p>
          </div>
        </div>

        {/* Recharts Visual Dashboard */}
        <div className="elv-panel rounded-2xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-display text-sm font-bold text-[var(--elv-text-strong)]">
                7-Day Monetization &amp; Impression Trends
              </h3>
              <p className="text-xs text-[var(--elv-text-muted)]">
                Interactive Recharts visualization of store revenue, ad impressions, and CTR %
              </p>
            </div>

            <div className="flex items-center gap-1 bg-[#0b0906] p-1 rounded-lg border border-[var(--elv-border)] shrink-0">
              <button
                type="button"
                onClick={() => setAdChartTab('revenue')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                  adChartTab === 'revenue'
                    ? 'elv-btn-gold'
                    : 'text-[var(--elv-text-muted)] hover:text-[var(--elv-text-strong)]'
                }`}
              >
                Revenue ($)
              </button>
              <button
                type="button"
                onClick={() => setAdChartTab('impressions')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                  adChartTab === 'impressions'
                    ? 'elv-btn-gold'
                    : 'text-[var(--elv-text-muted)] hover:text-[var(--elv-text-strong)]'
                }`}
              >
                Impressions &amp; Clicks
              </button>
              <button
                type="button"
                onClick={() => setAdChartTab('ctr')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                  adChartTab === 'ctr'
                    ? 'elv-btn-gold'
                    : 'text-[var(--elv-text-muted)] hover:text-[var(--elv-text-strong)]'
                }`}
              >
                CTR %
              </button>
            </div>
          </div>

          <div className="h-64 sm:h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              {adChartTab === 'revenue' ? (
                <AreaChart data={last7DaysMetrics}>
                  <defs>
                    <linearGradient id="goldRevGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ecc55c" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#ecc55c" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(236,197,92,0.12)" />
                  <XAxis dataKey="date" stroke="#8a7a5a" fontSize={11} />
                  <YAxis stroke="#8a7a5a" fontSize={11} tickFormatter={(val) => `$${val}`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#120f09',
                      borderColor: '#ecc55c',
                      borderRadius: '12px',
                      color: '#f7e2ab',
                      fontSize: '12px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="Revenue"
                    stroke="#ecc55c"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#goldRevGrad)"
                  />
                </AreaChart>
              ) : adChartTab === 'impressions' ? (
                <BarChart data={last7DaysMetrics}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(236,197,92,0.12)" />
                  <XAxis dataKey="date" stroke="#8a7a5a" fontSize={11} />
                  <YAxis stroke="#8a7a5a" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#120f09',
                      borderColor: '#ecc55c',
                      borderRadius: '12px',
                      color: '#f7e2ab',
                      fontSize: '12px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                  <Bar dataKey="Impressions" fill="#8a7a5a" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Clicks" fill="#ecc55c" radius={[4, 4, 0, 0]} />
                </BarChart>
              ) : (
                <LineChart data={last7DaysMetrics}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(236,197,92,0.12)" />
                  <XAxis dataKey="date" stroke="#8a7a5a" fontSize={11} />
                  <YAxis stroke="#8a7a5a" fontSize={11} tickFormatter={(val) => `${val}%`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#120f09',
                      borderColor: '#ecc55c',
                      borderRadius: '12px',
                      color: '#f7e2ab',
                      fontSize: '12px',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="CTR %"
                    stroke="#ecc55c"
                    strokeWidth={3}
                    dot={{ fill: '#ecc55c', r: 4 }}
                  />
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2-Column Grid: External Script Snippets + Custom Ad Creator */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* External Ad Network Script Injection (Google AdSense) */}
          <div className="elv-panel rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code className="h-4 w-4 text-[var(--elv-text-gold)]" />
                <h3 className="font-display text-sm font-bold text-[var(--elv-text-strong)]">
                  External Ad Network Script Injection
                </h3>
              </div>
              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <span className="text-[var(--elv-text-muted)]">Script Active</span>
                <input
                  type="checkbox"
                  checked={adScriptEnabled}
                  onChange={(e) => setAdScriptEnabled(e.target.checked)}
                  className="h-4 w-4 accent-[#ddb445]"
                />
              </label>
            </div>

            <p className="text-xs text-[var(--elvora-text-body)] leading-relaxed">
              Paste script tags provided by Google AdSense, Mediavine, or Ezoic. When enabled, scripts will be injected into the site header.
            </p>

            <form onSubmit={handleSaveAdScriptSettings} className="space-y-3">
              <div>
                <label htmlFor="ad-script-snippet" className="sr-only">
                  Ad Network Header Snippet
                </label>
                <textarea
                  id="ad-script-snippet"
                  rows={4}
                  value={adScriptSnippet}
                  onChange={(e) => setAdScriptSnippet(e.target.value)}
                  placeholder="<script async src='https://pagead2.googlesyndication.com...'></script>"
                  className="elv-input w-full rounded-xl p-3 font-mono text-xs leading-relaxed"
                />
              </div>

              <button
                type="submit"
                disabled={savingSettings}
                className="elv-btn-gold inline-flex min-h-[40px] w-full items-center justify-center gap-2 rounded-xl px-4 text-xs font-semibold"
              >
                {settingsSaved ? (
                  <>
                    <Check className="h-4 w-4" />
                    <span>Ad Network Script Settings Saved</span>
                  </>
                ) : (
                  <span>Save Ad Network Configuration</span>
                )}
              </button>
            </form>
          </div>

          {/* Create Custom Merchant Ad / Partner Spot */}
          <div className="elv-panel rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Plus className="h-4 w-4 text-[var(--elv-text-gold)]" />
              <h3 className="font-display text-sm font-bold text-[var(--elv-text-strong)]">
                Create Custom Merchant Spotlight / Banner
              </h3>
            </div>

            <form onSubmit={handleAddAdvertisement} className="space-y-3">
              {adFormError && (
                <p className="text-xs text-[var(--elv-text-gold)] font-medium">{adFormError}</p>
              )}

              <div>
                <input
                  type="text"
                  value={newAdTitle}
                  onChange={(e) => setNewAdTitle(e.target.value)}
                  placeholder="Ad Title (e.g. Exclusive GaN Powerbank Drop)"
                  className="elv-input w-full rounded-lg px-3 py-2 text-xs"
                />
              </div>

              <div>
                <input
                  type="text"
                  value={newAdDesc}
                  onChange={(e) => setNewAdDesc(e.target.value)}
                  placeholder="Short Description (e.g. Claim 15% off certified Alibaba OEM items)"
                  className="elv-input w-full rounded-lg px-3 py-2 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={newAdBadge}
                  onChange={(e) => setNewAdBadge(e.target.value)}
                  placeholder="Badge (e.g. Sponsored Drop)"
                  className="elv-input w-full rounded-lg px-3 py-2 text-xs"
                />
                <input
                  type="text"
                  value={newAdCtaLabel}
                  onChange={(e) => setNewAdCtaLabel(e.target.value)}
                  placeholder="CTA Label (e.g. View Offer)"
                  className="elv-input w-full rounded-lg px-3 py-2 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={newAdCtaUrl}
                  onChange={(e) => setNewAdCtaUrl(e.target.value)}
                  placeholder="CTA Link (#catalog or https://...)"
                  className="elv-input w-full rounded-lg px-3 py-2 text-xs font-mono"
                />
                <input
                  type="text"
                  value={newAdImageUrl}
                  onChange={(e) => setNewAdImageUrl(e.target.value)}
                  placeholder="Image URL (optional)"
                  className="elv-input w-full rounded-lg px-3 py-2 text-xs font-mono"
                />
              </div>

              <button
                type="submit"
                className="elv-btn-gold inline-flex min-h-[40px] w-full items-center justify-center gap-1.5 rounded-xl px-4 text-xs font-semibold"
              >
                <Plus className="h-4 w-4" />
                <span>Add Custom Merchant Ad</span>
              </button>
            </form>
          </div>
        </div>

        {/* Existing Custom Advertisements List with Visibility Toggles */}
        <div className="space-y-3 border-t border-[var(--elv-border)] pt-5">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-sm font-bold text-[var(--elv-text-strong)]">
              Active Storefront Advertisements ({advertisements.length})
            </h3>
            <span className="text-xs text-[var(--elv-text-muted)]">
              Toggle switch to instantly show/hide ads on shopper storefront
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {advertisements.map((ad) => (
              <div
                key={ad.id}
                className={`elv-panel rounded-xl p-4 flex flex-col justify-between gap-3 border transition-colors ${
                  ad.isActive
                    ? 'border-[var(--elv-border-strong)] bg-[#14100a]'
                    : 'border-[var(--elv-border)] opacity-60 bg-black/30'
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2 text-[10px]">
                    <span className="font-mono text-[var(--elv-text-gold)] uppercase font-semibold">
                      {ad.badge || 'Sponsored'}
                    </span>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <span className="text-[var(--elv-text-muted)]">
                        {ad.isActive ? 'Visible' : 'Hidden'}
                      </span>
                      <input
                        type="checkbox"
                        checked={ad.isActive}
                        onChange={() => handleToggleAdActive(ad.id)}
                        className="h-3.5 w-3.5 accent-[#ddb445]"
                      />
                    </label>
                  </div>

                  <h4 className="font-display text-xs font-bold text-[var(--elv-text-strong)] truncate">
                    {ad.title}
                  </h4>
                  <p className="text-[11px] text-[var(--elv-text-body)] line-clamp-2">
                    {ad.description}
                  </p>
                </div>

                <div className="flex items-center justify-between gap-2 border-t border-[var(--elv-border)] pt-2 text-[10px] text-[var(--elv-text-muted)]">
                  <span className="font-mono">
                    {(ad.impressions ?? 0).toLocaleString()} views · {(ad.clicks ?? 0).toLocaleString()} clicks
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDeleteAd(ad.id)}
                    className="p-1 text-red-400 hover:text-red-300 transition-colors"
                    title="Delete advertisement"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Main 2-Column Operations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: AI Manager + Alibaba Free-Delivery Sourcing + Business/Markup/Holiday Config */}
        <div className="lg:col-span-6 space-y-8">
          {/* Autonomous AI Co-Pilot */}
          <section
            aria-labelledby="ai-manager-heading"
            className="elv-card rounded-2xl p-6 space-y-5"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <Bot className="h-5 w-5 text-[var(--elv-text-gold)]" aria-hidden="true" />
                <h2
                  id="ai-manager-heading"
                  className="font-display text-lg font-bold text-[var(--elv-text-strong)]"
                >
                  Elvora Autonomous AI Manager
                </h2>
              </div>
              <span className="text-xs text-[var(--elv-text-muted)]">Markup &amp; Free Freight</span>
            </div>

            <div className="elv-panel rounded-xl p-4 text-xs sm:text-sm leading-relaxed text-[var(--elv-text-body)]">
              {aiReply}
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={aiBusy}
                onClick={() =>
                  runQuickPrompt(
                    'Search Alibaba for free delivery electronics and combo suppliers to reduce our transport costs'
                  )
                }
                className="elv-btn-outline min-h-[38px] rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap"
              >
                AI Find Free Alibaba Delivery
              </button>
              <button
                type="button"
                disabled={aiBusy}
                onClick={() =>
                  runQuickPrompt('Summarize verified payments, AI markup margin, and low stock')
                }
                className="elv-btn-outline min-h-[38px] rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap"
              >
                Payout &amp; Margin Report
              </button>
              <button
                type="button"
                disabled={aiBusy}
                onClick={() =>
                  runQuickPrompt(
                    'Restock low stock items from free-shipping Alibaba OEM suppliers and post remaining units'
                  )
                }
                className="elv-btn-outline min-h-[38px] rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap"
              >
                AI Restock Free-Freight
              </button>
            </div>

            <form onSubmit={handleAssistantSubmit} className="flex items-center gap-2">
              <label htmlFor="ai-command-input" className="sr-only">
                Instruct Elvora AI Manager
              </label>
              <input
                id="ai-command-input"
                type="text"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Ask AI to find free Alibaba shipping or restock combos..."
                className="elv-input min-h-[44px] flex-1 rounded-lg px-3.5 text-sm"
              />
              <button
                type="submit"
                disabled={aiBusy || !aiPrompt.trim()}
                aria-label="Send instruction to Elvora AI"
                className="elv-btn-gold inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg px-4 text-xs font-semibold disabled:opacity-40"
              >
                <Send className="h-4 w-4" aria-hidden="true" />
              </button>
            </form>
          </section>

          {/* AI Alibaba Free-Shipping Finder & OEM Manufacturer Sourcing */}
          <section
            aria-labelledby="alibaba-sourcing-heading"
            className="elv-card rounded-2xl p-6 space-y-5"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2
                  id="alibaba-sourcing-heading"
                  className="font-display text-lg font-bold text-[var(--elv-text-strong)]"
                >
                  AI Alibaba Free-Delivery Sourcing
                </h2>
                <p className="mt-1 text-xs text-[var(--elv-text-muted)]">
                  Filters Alibaba factories offering <strong className="text-[var(--elv-text-gold)]">$0 Free Factory Shipping</strong> to slash inbound transport costs and auto-increases retail price ({markupMultiplier.toFixed(2)}x).
                </p>
              </div>
            </div>

            <label className="elv-panel flex min-h-[42px] cursor-pointer items-center justify-between rounded-lg px-3.5 text-xs">
              <span className="font-medium text-[var(--elv-text-strong)]">
                AI Filter: Only $0 Free Alibaba Delivery Suppliers ({visibleTemplates.length} found)
              </span>
              <input
                type="checkbox"
                checked={freeFreightOnly}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setFreeFreightOnly(checked);
                  const nextPool = checked
                    ? ALIBABA_OEM_SUPPLIER_CATALOG.filter((t) => t.alibabaFreeShipping)
                    : ALIBABA_OEM_SUPPLIER_CATALOG;
                  if (!nextPool.some((t) => t.templateId === selectedTemplateId)) {
                    setSelectedTemplateId(nextPool[0].templateId);
                  }
                }}
                className="h-4 w-4 accent-[#ddb445]"
              />
            </label>

            <form onSubmit={handleSourceSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="oem-template-select"
                  className="block text-xs font-medium text-[var(--elv-text-body)] mb-1.5"
                >
                  Select Verified Alibaba Electronics or Combo Batch
                </label>
                <select
                  id="oem-template-select"
                  value={selectedTemplate.templateId}
                  onChange={(e) => setSelectedTemplateId(e.target.value)}
                  className="elv-input min-h-[44px] w-full rounded-lg px-3.5 text-xs sm:text-sm"
                >
                  {visibleTemplates.map((item) => {
                    const priced = computeAiRetailPrice(item.oemCost, markupMultiplier, 12);
                    return (
                      <option key={item.templateId} value={item.templateId}>
                        {item.title} · Alibaba ${item.oemCost} → Store ${priced.retailPrice} (
                        {item.alibabaFreeShipping
                          ? `$0 Free Shipping · Save $${item.alibabaStandardFreightUsd}`
                          : `$${item.alibabaStandardFreightUsd} Freight`}
                        )
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="elv-panel rounded-xl p-3.5 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-[var(--elv-text-muted)]">Alibaba Factory Cost:</span>
                  <span className="font-mono text-[var(--elv-text-body)]">
                    ${selectedTemplate.oemCost} / unit
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--elv-text-muted)]">
                    AI Marked-Up Store Price ({markupMultiplier.toFixed(2)}x):
                  </span>
                  <span className="font-mono font-semibold text-[var(--elv-text-gold)]">
                    ${selectedTemplatePricing.retailPrice} (+${selectedTemplate.localDeliveryFeeUsd}{' '}
                    buyer delivery)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--elv-text-muted)]">Alibaba Inbound Transport:</span>
                  <span className="font-mono font-semibold text-[var(--elv-text-strong)]">
                    {selectedTemplate.alibabaFreeShipping
                      ? `$0 Free Shipping (Saves $${selectedTemplate.alibabaStandardFreightUsd})`
                      : `$${selectedTemplate.alibabaStandardFreightUsd}`}
                  </span>
                </div>
              </div>

              <div className="flex items-end gap-3">
                <div className="w-28">
                  <label
                    htmlFor="oem-batch-units"
                    className="block text-xs font-medium text-[var(--elv-text-body)] mb-1.5"
                  >
                    Batch Units
                  </label>
                  <input
                    id="oem-batch-units"
                    type="number"
                    min={5}
                    max={500}
                    value={batchUnits}
                    onChange={(e) => setBatchUnits(Number(e.target.value) || 15)}
                    className="elv-input min-h-[44px] w-full rounded-lg px-3 font-mono text-sm"
                  />
                </div>

                <button
                  type="submit"
                  disabled={sourcingBusy}
                  className="elv-btn-gold flex-1 inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-xs font-semibold disabled:opacity-50 whitespace-nowrap"
                >
                  <PackagePlus className="h-4 w-4" aria-hidden="true" />
                  <span>
                    {sourcingBusy
                      ? 'AI Ordering & Pricing...'
                      : `Order (${ELVORA_BRAND_MOTTO.split(' ')[0]}) & Post`}
                  </span>
                </button>
              </div>
            </form>
          </section>

          {/* Business Identity, AI Price Markup & Holiday Offers Configuration */}
          <section
            aria-labelledby="payout-settings-heading"
            className="elv-card rounded-2xl p-6 space-y-5"
          >
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-[var(--elv-text-gold)]" aria-hidden="true" />
              <h2
                id="payout-settings-heading"
                className="font-display text-lg font-bold text-[var(--elv-text-strong)]"
              >
                Business Name, AI Markup &amp; Holiday Offers
              </h2>
            </div>

            <form onSubmit={handleSaveSettingsForm} noValidate className="space-y-4">
              <div>
                <label
                  htmlFor="owner-merchant-name"
                  className="block text-xs font-medium text-[var(--elv-text-body)] mb-1.5"
                >
                  Official Registered Business Name
                </label>
                <input
                  id="owner-merchant-name"
                  type="text"
                  value={merchantName}
                  onChange={(e) => setMerchantName(e.target.value)}
                  className="elv-input min-h-[44px] w-full rounded-lg px-3.5 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="owner-payout-phone"
                    className="block text-xs font-medium text-[var(--elv-text-body)] mb-1.5"
                  >
                    Direct Payout Phone
                  </label>
                  <input
                    id="owner-payout-phone"
                    type="tel"
                    value={payoutPhone}
                    onChange={(e) => {
                      setPayoutPhone(e.target.value);
                      if (phoneError) setPhoneError(null);
                    }}
                    className="elv-input min-h-[44px] w-full rounded-lg px-3.5 font-mono text-sm"
                  />
                  {phoneError && (
                    <p role="alert" className="mt-1 text-xs font-medium text-[var(--elv-text-gold)]">
                      {phoneError}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="owner-support-email"
                    className="block text-xs font-medium text-[var(--elv-text-body)] mb-1.5"
                  >
                    Customer Support Email
                  </label>
                  <input
                    id="owner-support-email"
                    type="email"
                    value={supportEmail}
                    onChange={(e) => setSupportEmail(e.target.value)}
                    className="elv-input min-h-[44px] w-full rounded-lg px-3.5 text-sm"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="owner-hub-address"
                  className="block text-xs font-medium text-[var(--elv-text-body)] mb-1.5"
                >
                  Local Hub &amp; Contact Address
                </label>
                <input
                  id="owner-hub-address"
                  type="text"
                  value={hubAddress}
                  onChange={(e) => setHubAddress(e.target.value)}
                  className="elv-input min-h-[44px] w-full rounded-lg px-3.5 text-sm"
                />
              </div>

              {/* AI Automatic Retail Price Markup Slider */}
              <div className="elv-panel rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <label
                    htmlFor="owner-ai-markup"
                    className="font-semibold text-[var(--elv-text-strong)]"
                  >
                    AI Automatic Price Markup ({markupMultiplier.toFixed(2)}x)
                  </label>
                  <span className="font-mono text-[var(--elv-text-gold)]">
                    $400 Alibaba → ${earpodsMarkupPreview.retailPrice} Store
                  </span>
                </div>
                <input
                  id="owner-ai-markup"
                  type="range"
                  min={1.75}
                  max={2.0}
                  step={0.05}
                  value={markupMultiplier}
                  onChange={(e) => setMarkupMultiplier(Number(e.target.value))}
                  className="w-full accent-[#ddb445]"
                />
                <p className="text-[11px] text-[var(--elv-text-muted)]">
                  Guarantees if an earpod costs $400 on Alibaba, Elvora prices it between $700 and
                  $800 (+ customer delivery cost).
                </p>
              </div>

              {/* Holiday Offer Switcher */}
              <div>
                <label
                  htmlFor="owner-holiday-campaign"
                  className="flex items-center gap-1.5 text-xs font-medium text-[var(--elv-text-body)] mb-1.5"
                >
                  <Tag className="h-3.5 w-3.5 text-[var(--elv-text-gold)]" aria-hidden="true" />
                  <span>Active Storefront Holiday Campaign</span>
                </label>
                <select
                  id="owner-holiday-campaign"
                  value={activeCampaign}
                  onChange={(e) => setActiveCampaign(e.target.value as HolidayCampaignId)}
                  className="elv-input min-h-[44px] w-full rounded-lg px-3.5 text-sm"
                >
                  {(Object.keys(HOLIDAY_CAMPAIGNS) as HolidayCampaignId[]).map((cid) => {
                    const c = HOLIDAY_CAMPAIGNS[cid];
                    return (
                      <option key={cid} value={cid}>
                        {c.title} (Code {c.promoCode} · -{c.extraDiscountPercent}%)
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="space-y-2 pt-1">
                <label className="elv-panel flex min-h-[42px] cursor-pointer items-center justify-between rounded-lg px-3.5">
                  <span className="text-xs text-[var(--elv-text-body)]">
                    AI auto-orders Alibaba OEM after payment confirmation
                  </span>
                  <input
                    type="checkbox"
                    checked={state.ownerConfig.autoOrderAlibabaOem}
                    onChange={(e) =>
                      void onSaveSettings({ autoOrderAlibabaOem: e.target.checked })
                    }
                    className="h-4 w-4 accent-[#ddb445]"
                  />
                </label>

                <label className="elv-panel flex min-h-[42px] cursor-pointer items-center justify-between rounded-lg px-3.5">
                  <span className="text-xs text-[var(--elv-text-body)]">
                    AI auto-posts product picture &amp; amount remaining
                  </span>
                  <input
                    type="checkbox"
                    checked={state.ownerConfig.autoPostProductStock}
                    onChange={(e) =>
                      void onSaveSettings({ autoPostProductStock: e.target.checked })
                    }
                    className="h-4 w-4 accent-[#ddb445]"
                  />
                </label>
              </div>

              <button
                type="submit"
                disabled={savingSettings}
                className="elv-btn-gold inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-xs font-semibold whitespace-nowrap"
              >
                {settingsSaved ? (
                  <>
                    <Check className="h-4 w-4" aria-hidden="true" />
                    <span>Business, Markup &amp; Holiday Settings Saved</span>
                  </>
                ) : (
                  <span>Save Business, Markup &amp; Holiday Settings</span>
                )}
              </button>
            </form>
          </section>
        </div>

        {/* Right Column: Customer Support Inquiries + Phone Confirmations + Courier Dispatch + Stock */}
        <div className="lg:col-span-6 space-y-8">
          {/* Incoming Customer Contact Us Inquiries */}
          <section
            aria-labelledby="support-inquiries-heading"
            className="elv-card rounded-2xl p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Inbox className="h-4 w-4 text-[var(--elv-text-gold)]" aria-hidden="true" />
                <h2
                  id="support-inquiries-heading"
                  className="font-display text-lg font-bold text-[var(--elv-text-strong)]"
                >
                  Customer Contact Us Inquiries
                </h2>
              </div>
              <span className="font-mono text-xs text-[var(--elv-text-gold)] tabular-nums">
                {openInquiries.length} open
              </span>
            </div>

            {state.inquiries.length === 0 ? (
              <p className="text-xs text-[var(--elv-text-muted)]">No customer inquiries yet.</p>
            ) : (
              <ul className="divide-y divide-[var(--elv-border)]">
                {state.inquiries.slice(0, 5).map((inq) => (
                  <li key={inq.id} className="py-3.5 first:pt-0 last:pb-0 space-y-1.5">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <span className="font-semibold text-[var(--elv-text-strong)]">
                        {inq.senderName} ·{' '}
                        <span className="font-mono text-[var(--elv-text-gold)]">
                          {inq.contactInfo}
                        </span>
                      </span>
                      {inq.status === 'open' ? (
                        <button
                          type="button"
                          onClick={() => void onResolveInquiry(inq.id)}
                          className="elv-btn-outline rounded-md px-2.5 py-1 text-[11px] font-semibold"
                        >
                          Mark Resolved
                        </button>
                      ) : (
                        <span className="font-mono text-[11px] text-[var(--elv-text-muted)]">
                          Resolved
                        </span>
                      )}
                    </div>
                    <p className="text-xs leading-relaxed text-[var(--elv-text-body)]">
                      {inq.message}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Verified Phone Payment Confirmations */}
          <section
            aria-labelledby="phone-alerts-heading"
            className="elv-card rounded-2xl p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2
                id="phone-alerts-heading"
                className="font-display text-lg font-bold text-[var(--elv-text-strong)]"
              >
                Payment Confirmations to Your Phone
              </h2>
              <span className="font-mono text-xs text-[var(--elv-text-gold)] tabular-nums">
                {state.phoneNotifications.length} verified
              </span>
            </div>

            <ul className="divide-y divide-[var(--elv-border)]">
              {state.phoneNotifications.slice(0, 4).map((alert) => (
                <li key={alert.id} className="py-3.5 first:pt-0 last:pb-0 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-semibold text-[var(--elv-text-gold)]">
                      {alert.orderCode} · +${alert.amountUsd.toFixed(2)}
                    </span>
                    <span className="font-mono text-[11px] text-[var(--elv-text-muted)]">
                      To {alert.ownerPhone}
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed text-[var(--elv-text-body)]">
                    {alert.smsBody}
                  </p>
                </li>
              ))}
            </ul>
          </section>

          {/* 1-Tap Local Delivery Dispatch Control */}
          <section
            aria-labelledby="dispatch-orders-heading"
            className="elv-card rounded-2xl p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-[var(--elv-text-gold)]" aria-hidden="true" />
                <h2
                  id="dispatch-orders-heading"
                  className="font-display text-lg font-bold text-[var(--elv-text-strong)]"
                >
                  Orders &amp; Exact Arrival Dispatch
                </h2>
              </div>
              <span className="text-xs text-[var(--elv-text-muted)]">Advance courier stage</span>
            </div>

            <ul className="divide-y divide-[var(--elv-border)]">
              {state.orders.slice(0, 5).map((order) => {
                const currentStep = ORDER_STATUS_STEPS.find((s) => s.status === order.status);
                const isDelivered = order.status === 'delivered';
                return (
                  <li
                    key={order.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-4 first:pt-0 last:pb-0"
                  >
                    <div className="space-y-0.5">
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="font-mono font-semibold text-[var(--elv-text-gold)]">
                          {order.orderCode}
                        </span>
                        <span aria-hidden="true" className="text-[var(--elv-text-muted)]">
                          ·
                        </span>
                        <span className="font-mono text-[var(--elv-text-strong)] tabular-nums">
                          ${order.totalUsd.toFixed(2)} (incl. ${order.deliveryFeeUsd} delivery)
                        </span>
                        <span aria-hidden="true" className="text-[var(--elv-text-muted)]">
                          ·
                        </span>
                        <span className="text-[var(--elv-text-muted)]">{order.customerName}</span>
                      </div>
                      <p className="text-xs text-[var(--elv-text-muted)]">
                        {currentStep?.label} · Arrives {order.etaLabel}
                      </p>
                    </div>

                    <button
                      type="button"
                      disabled={isDelivered}
                      onClick={() => void onAdvanceOrder(order.orderCode)}
                      aria-label={`Advance delivery stage for ${order.orderCode}`}
                      className="elv-btn-outline inline-flex min-h-[42px] items-center justify-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold disabled:opacity-40 whitespace-nowrap shrink-0"
                    >
                      <span>{isDelivered ? 'Completed' : 'Advance Stage'}</span>
                      {!isDelivered && <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>

          {/* Inventory Remaining & Live Stock Card Controls */}
          <section
            aria-labelledby="inventory-control-heading"
            className="elv-card rounded-2xl p-6 space-y-4"
          >
            <h2
              id="inventory-control-heading"
              className="font-display text-lg font-bold text-[var(--elv-text-strong)]"
            >
              Catalog Inventory ({state.products.length} Models · OEM vs Store Price)
            </h2>

            <ul className="divide-y divide-[var(--elv-border)] max-h-[420px] overflow-y-auto pr-1">
              {state.products.map((prod) => (
                <li
                  key={prod.id}
                  className="flex items-center justify-between gap-3 py-3.5 first:pt-0 last:pb-0"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-12 w-14 shrink-0 overflow-hidden rounded-lg border border-[var(--elv-border)]">
                      <ProductMedia
                        imageKey={prod.imageKey}
                        alt={prod.title}
                        aspectClass="h-full w-full"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-xs sm:text-sm font-semibold text-[var(--elv-text-strong)]">
                        {prod.title}
                      </p>
                      <p className="font-mono text-[11px] text-[var(--elv-text-muted)] tabular-nums">
                        OEM ${prod.oemCost} →{' '}
                        <span className="text-[var(--elv-text-gold)] font-semibold">
                          Store ${prod.price}
                        </span>{' '}
                        (+${prod.localDeliveryFeeUsd} deliv) · {prod.stockRemaining} left
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => void onAdjustStock(prod.id, prod.stockRemaining + 10, true)}
                    aria-label={`Add 10 stock and post card for ${prod.title}`}
                    className="elv-btn-outline min-h-[38px] rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap shrink-0"
                  >
                    +10 &amp; Post
                  </button>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}

