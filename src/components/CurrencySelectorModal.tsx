import { FormEvent, useMemo, useState } from 'react';
import { Check, Globe, PlusCircle, Search, X } from 'lucide-react';
import {
  COUNTRY_CURRENCIES,
  CustomCurrencyConfig,
  formatMoneyFromUsd,
  getCurrencyMeta,
  getExchangeRateSummary,
  searchCountryCurrencies,
  validateCustomCurrencyInput,
} from '../utils/currency';

interface CurrencySelectorModalProps {
  isOpen: boolean;
  activeCurrencyCode: string;
  customCurrency: CustomCurrencyConfig | null;
  fxRates: Record<string, number>;
  fxSource: 'live_market' | 'verified_baseline';
  onSelectCurrency: (code: string, custom?: CustomCurrencyConfig | null) => void;
  onClose: () => void;
}

const FEATURED_CODES = ['USD', 'CNY', 'SAR', 'KES', 'TZS'];

export function CurrencySelectorModal({
  isOpen,
  activeCurrencyCode,
  customCurrency,
  fxRates,
  fxSource,
  onSelectCurrency,
  onClose,
}: CurrencySelectorModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customCode, setCustomCode] = useState(customCurrency?.code ?? '');
  const [customSymbol, setCustomSymbol] = useState(customCurrency?.symbol ?? '');
  const [customCountry, setCustomCountry] = useState(customCurrency?.countryName ?? '');
  const [customRate, setCustomRate] = useState(
    customCurrency ? String(customCurrency.ratePerUsd) : ''
  );
  const [customDecimals, setCustomDecimals] = useState<0 | 2>(customCurrency?.decimals ?? 2);
  const [customError, setCustomError] = useState<string | null>(null);

  const featuredCurrencies = useMemo(
    () =>
      FEATURED_CODES.map((code) => COUNTRY_CURRENCIES.find((c) => c.code === code)!).filter(
        Boolean
      ),
    []
  );

  const filteredCurrencies = useMemo(
    () => searchCountryCurrencies(searchQuery),
    [searchQuery]
  );

  if (!isOpen) return null;

  const activeMeta = getCurrencyMeta(activeCurrencyCode, customCurrency);
  const sample100Formatted = formatMoneyFromUsd(
    100,
    activeCurrencyCode,
    fxRates,
    customCurrency
  );
  const rateSummary = getExchangeRateSummary(activeCurrencyCode, fxRates, customCurrency);

  const handleCustomSubmit = (e: FormEvent) => {
    e.preventDefault();
    const numericRate = Number(customRate);
    const err = validateCustomCurrencyInput({
      code: customCode,
      countryName: customCountry,
      ratePerUsd: numericRate,
    });
    if (err) {
      setCustomError(err);
      return;
    }

    const cleanCode = customCode.trim().toUpperCase();
    const cleanSymbol = customSymbol.trim() ? `${customSymbol.trim()} ` : `${cleanCode} `;
    const config: CustomCurrencyConfig = {
      code: cleanCode,
      symbol: cleanSymbol.trimEnd() === '$' || cleanSymbol.trimEnd() === '€' || cleanSymbol.trimEnd() === '£' || cleanSymbol.trimEnd() === '¥'
        ? cleanSymbol.trim()
        : `${cleanSymbol.trim()} `,
      countryName: customCountry.trim(),
      ratePerUsd: numericRate,
      decimals: customDecimals,
    };
    setCustomError(null);
    onSelectCurrency(cleanCode, config);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="currency-modal-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-6"
    >
      <div className="elv-card relative flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl sm:rounded-2xl shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[var(--elv-border)] px-6 py-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <Globe className="h-5 w-5 text-[var(--elv-text-gold)] shrink-0" aria-hidden="true" />
            <div className="min-w-0">
              <h2
                id="currency-modal-title"
                className="truncate font-display text-lg font-bold text-[var(--elv-text-strong)]"
              >
                Country &amp; Convertible Currency System
              </h2>
              <p className="truncate text-xs text-[var(--elv-text-muted)]">
                Converts all electronics, combos, holiday discounts &amp; local delivery costs automatically
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close currency converter"
            className="elv-btn-outline flex min-h-[42px] min-w-[42px] items-center justify-center rounded-lg shrink-0"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Active Rate Summary */}
          <div className="elv-panel flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl px-4 py-3 text-xs">
            <div className="space-y-0.5">
              <p className="font-semibold text-[var(--elv-text-gold)]">
                Active Currency: {activeMeta.code} · {activeMeta.countryName}
              </p>
              <p className="text-[var(--elv-text-muted)]">
                {rateSummary} · {fxSource === 'live_market' ? 'Live FX Feed' : 'Verified FX Rate'}
              </p>
            </div>
            <p className="font-mono font-semibold text-[var(--elv-text-strong)] tabular-nums">
              $100.00 USD = {sample100Formatted}
            </p>
          </div>

          {/* Featured Global Markets: USA, China, Saudi Arabia, Kenya, Tanzania */}
          <div className="space-y-2.5">
            <h3 className="font-display text-xs font-semibold uppercase tracking-wider text-[var(--elv-text-muted)]">
              Featured Markets (1-Tap Switch)
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              {featuredCurrencies.map((item) => {
                const isSelected =
                  activeCurrencyCode.toUpperCase() === item.code && !customCurrency;
                return (
                  <button
                    key={item.code}
                    type="button"
                    onClick={() => {
                      onSelectCurrency(item.code, null);
                      onClose();
                    }}
                    className={`flex flex-col items-start justify-between rounded-xl border p-3 text-left transition-colors ${
                      isSelected
                        ? 'border-[var(--elv-text-gold)] bg-[var(--elv-surface-alt)] text-[var(--elv-text-strong)]'
                        : 'border-[var(--elv-border)] bg-[var(--elv-surface)] hover:border-[var(--elv-border-strong)]'
                    }`}
                  >
                    <div className="flex w-full items-center justify-between gap-1">
                      <span className="font-mono text-xs font-bold text-[var(--elv-text-gold)]">
                        {item.code}
                      </span>
                      {isSelected && (
                        <Check
                          className="h-3.5 w-3.5 text-[var(--elv-text-gold)] shrink-0"
                          aria-hidden="true"
                        />
                      )}
                    </div>
                    <span className="mt-1 truncate w-full text-xs font-semibold text-[var(--elv-text-strong)]">
                      {item.countryName.replace(' (USA)', '')}
                    </span>
                    <span className="mt-0.5 font-mono text-[11px] text-[var(--elv-text-muted)] tabular-nums">
                      {formatMoneyFromUsd(100, item.code, fxRates)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Search All Countries */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label
                htmlFor="currency-country-search"
                className="font-display text-xs font-semibold uppercase tracking-wider text-[var(--elv-text-muted)]"
              >
                All Supported Countries ({COUNTRY_CURRENCIES.length} Currencies)
              </label>

              <button
                type="button"
                onClick={() => setShowCustomForm((prev) => !prev)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--elv-text-gold)] underline underline-offset-4 hover:text-[var(--elv-text-strong)] whitespace-nowrap"
              >
                <PlusCircle className="h-3.5 w-3.5" aria-hidden="true" />
                <span>
                  {showCustomForm
                    ? 'Hide Custom Country Rate'
                    : 'Add Any Other Country Currency'}
                </span>
              </button>
            </div>

            {/* Optional Any-Country Custom Currency Converter */}
            {showCustomForm && (
              <form
                onSubmit={handleCustomSubmit}
                noValidate
                className="elv-panel rounded-xl p-4 space-y-4"
              >
                <div>
                  <h4 className="font-display text-sm font-semibold text-[var(--elv-text-strong)]">
                    Custom Any-Country Currency Converter
                  </h4>
                  <p className="text-xs text-[var(--elv-text-muted)]">
                    Don&apos;t see your local currency below? Enter any country&apos;s 3-letter ISO
                    code and rate per 1 USD to convert the entire store.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label
                      htmlFor="custom-currency-country"
                      className="block text-xs font-medium text-[var(--elv-text-body)] mb-1"
                    >
                      Country Name
                    </label>
                    <input
                      id="custom-currency-country"
                      type="text"
                      value={customCountry}
                      onChange={(e) => {
                        setCustomCountry(e.target.value);
                        if (customError) setCustomError(null);
                      }}
                      placeholder="e.g. Zambia"
                      className="elv-input min-h-[42px] w-full rounded-lg px-3 text-xs"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="custom-currency-code"
                      className="block text-xs font-medium text-[var(--elv-text-body)] mb-1"
                    >
                      3-Letter Code
                    </label>
                    <input
                      id="custom-currency-code"
                      type="text"
                      maxLength={3}
                      value={customCode}
                      onChange={(e) => {
                        setCustomCode(e.target.value.toUpperCase());
                        if (customError) setCustomError(null);
                      }}
                      placeholder="e.g. ZMW"
                      className="elv-input min-h-[42px] w-full rounded-lg px-3 font-mono text-xs uppercase"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="custom-currency-symbol"
                      className="block text-xs font-medium text-[var(--elv-text-body)] mb-1"
                    >
                      Symbol (Optional)
                    </label>
                    <input
                      id="custom-currency-symbol"
                      type="text"
                      maxLength={6}
                      value={customSymbol}
                      onChange={(e) => setCustomSymbol(e.target.value)}
                      placeholder="e.g. ZK"
                      className="elv-input min-h-[42px] w-full rounded-lg px-3 font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="custom-currency-rate"
                      className="block text-xs font-medium text-[var(--elv-text-body)] mb-1"
                    >
                      Rate per 1 USD
                    </label>
                    <input
                      id="custom-currency-rate"
                      type="number"
                      step="any"
                      min="0.0001"
                      value={customRate}
                      onChange={(e) => {
                        setCustomRate(e.target.value);
                        if (customError) setCustomError(null);
                      }}
                      placeholder="e.g. 27.5"
                      className="elv-input min-h-[42px] w-full rounded-lg px-3 font-mono text-xs"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs">
                    <label htmlFor="custom-currency-decimals" className="text-[var(--elv-text-muted)]">
                      Decimal Places:
                    </label>
                    <select
                      id="custom-currency-decimals"
                      value={customDecimals}
                      onChange={(e) => setCustomDecimals(Number(e.target.value) === 0 ? 0 : 2)}
                      className="elv-input min-h-[36px] rounded-lg px-2.5 text-xs"
                    >
                      <option value={2}>2 decimals (e.g. 275.00)</option>
                      <option value={0}>Whole units (e.g. 275)</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="elv-btn-gold min-h-[40px] rounded-lg px-4 py-2 text-xs font-semibold whitespace-nowrap"
                  >
                    Apply Custom Country Currency
                  </button>
                </div>

                {customError && (
                  <p role="alert" className="text-xs font-medium text-[var(--elv-text-gold)]">
                    {customError}
                  </p>
                )}
              </form>
            )}

            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--elv-text-muted)]"
                aria-hidden="true"
              />
              <input
                id="currency-country-search"
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search country or currency (China, USA, Saudi Arabia, Kenya, Tanzania, UAE, Nigeria, UK...)"
                className="elv-input min-h-[44px] w-full rounded-lg pl-10 pr-4 text-sm"
              />
            </div>

            {filteredCurrencies.length === 0 ? (
              <div className="elv-panel rounded-xl p-6 text-center space-y-2">
                <p className="text-sm font-semibold text-[var(--elv-text-strong)]">
                  No preset match for &ldquo;{searchQuery}&rdquo;
                </p>
                <p className="text-xs text-[var(--elv-text-muted)]">
                  Click &ldquo;Add Any Other Country Currency&rdquo; above to enter your country&apos;s
                  exact ISO code and rate.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {filteredCurrencies.map((option) => {
                  const isSelected =
                    activeCurrencyCode.toUpperCase() === option.code && !customCurrency;
                  return (
                    <button
                      key={`${option.countryName}-${option.code}`}
                      type="button"
                      onClick={() => {
                        onSelectCurrency(option.code, null);
                        onClose();
                      }}
                      className={`flex items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5 text-left transition-colors ${
                        isSelected
                          ? 'border-[var(--elv-text-gold)] bg-[var(--elv-surface-alt)]'
                          : 'border-[var(--elv-border)] bg-[var(--elv-surface)] hover:border-[var(--elv-border-strong)]'
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-[var(--elv-text-strong)]">
                          {option.countryName}
                        </p>
                        <p className="truncate text-[11px] text-[var(--elv-text-muted)]">
                          {option.currencyName} ({option.symbol.trim()})
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="block font-mono text-xs font-bold text-[var(--elv-text-gold)]">
                          {option.code}
                        </span>
                        <span className="block font-mono text-[10px] text-[var(--elv-text-muted)] tabular-nums">
                          1$ = {formatMoneyFromUsd(1, option.code, fxRates)}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
