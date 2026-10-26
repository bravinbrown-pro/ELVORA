export interface CountryCurrencyOption {
  code: string;
  symbol: string;
  currencyName: string;
  countryName: string;
  region: 'Featured' | 'Africa' | 'Middle East' | 'Asia-Pacific' | 'Europe' | 'Americas';
  defaultRatePerUsd: number;
  decimals: 0 | 2;
  phonePrefix: string;
}

export interface CustomCurrencyConfig {
  code: string;
  symbol: string;
  countryName: string;
  ratePerUsd: number;
  decimals: 0 | 2;
}

/**
 * Comprehensive multi-country currency directory with deterministic baseline rates per 1 USD.
 * Highlights USA, China, Saudi Arabia, Kenya, and Tanzania first as requested,
 * followed by major African, Middle Eastern, Asian, European, and American currencies.
 */
export const COUNTRY_CURRENCIES: CountryCurrencyOption[] = [
  // Featured Global Markets
  {
    code: 'USD',
    symbol: '$',
    currencyName: 'US Dollar',
    countryName: 'United States (USA)',
    region: 'Featured',
    defaultRatePerUsd: 1,
    decimals: 2,
    phonePrefix: '+1',
  },
  {
    code: 'CNY',
    symbol: '¥',
    currencyName: 'Chinese Yuan Renminbi',
    countryName: 'China',
    region: 'Featured',
    defaultRatePerUsd: 7.24,
    decimals: 2,
    phonePrefix: '+86',
  },
  {
    code: 'SAR',
    symbol: 'SAR ',
    currencyName: 'Saudi Riyal',
    countryName: 'Saudi Arabia',
    region: 'Featured',
    defaultRatePerUsd: 3.75,
    decimals: 2,
    phonePrefix: '+966',
  },
  {
    code: 'KES',
    symbol: 'KSh ',
    currencyName: 'Kenyan Shilling',
    countryName: 'Kenya',
    region: 'Featured',
    defaultRatePerUsd: 129.0,
    decimals: 0,
    phonePrefix: '+254',
  },
  {
    code: 'TZS',
    symbol: 'TSh ',
    currencyName: 'Tanzanian Shilling',
    countryName: 'Tanzania',
    region: 'Featured',
    defaultRatePerUsd: 2680.0,
    decimals: 0,
    phonePrefix: '+255',
  },

  // Africa
  {
    code: 'UGX',
    symbol: 'USh ',
    currencyName: 'Ugandan Shilling',
    countryName: 'Uganda',
    region: 'Africa',
    defaultRatePerUsd: 3690.0,
    decimals: 0,
    phonePrefix: '+256',
  },
  {
    code: 'RWF',
    symbol: 'FRw ',
    currencyName: 'Rwandan Franc',
    countryName: 'Rwanda',
    region: 'Africa',
    defaultRatePerUsd: 1385.0,
    decimals: 0,
    phonePrefix: '+250',
  },
  {
    code: 'ETB',
    symbol: 'Br ',
    currencyName: 'Ethiopian Birr',
    countryName: 'Ethiopia',
    region: 'Africa',
    defaultRatePerUsd: 124.0,
    decimals: 0,
    phonePrefix: '+251',
  },
  {
    code: 'NGN',
    symbol: '₦',
    currencyName: 'Nigerian Naira',
    countryName: 'Nigeria',
    region: 'Africa',
    defaultRatePerUsd: 1620.0,
    decimals: 0,
    phonePrefix: '+234',
  },
  {
    code: 'GHS',
    symbol: 'GH₵',
    currencyName: 'Ghanaian Cedi',
    countryName: 'Ghana',
    region: 'Africa',
    defaultRatePerUsd: 15.8,
    decimals: 2,
    phonePrefix: '+233',
  },
  {
    code: 'ZAR',
    symbol: 'R ',
    currencyName: 'South African Rand',
    countryName: 'South Africa',
    region: 'Africa',
    defaultRatePerUsd: 17.85,
    decimals: 2,
    phonePrefix: '+27',
  },
  {
    code: 'EGP',
    symbol: 'E£ ',
    currencyName: 'Egyptian Pound',
    countryName: 'Egypt',
    region: 'Africa',
    defaultRatePerUsd: 49.2,
    decimals: 2,
    phonePrefix: '+20',
  },
  {
    code: 'MAD',
    symbol: 'MAD ',
    currencyName: 'Moroccan Dirham',
    countryName: 'Morocco',
    region: 'Africa',
    defaultRatePerUsd: 9.85,
    decimals: 2,
    phonePrefix: '+212',
  },
  {
    code: 'XOF',
    symbol: 'CFA ',
    currencyName: 'West African CFA Franc',
    countryName: 'Senegal / Côte d’Ivoire',
    region: 'Africa',
    defaultRatePerUsd: 604.0,
    decimals: 0,
    phonePrefix: '+221',
  },

  // Middle East
  {
    code: 'AED',
    symbol: 'AED ',
    currencyName: 'UAE Dirham',
    countryName: 'United Arab Emirates',
    region: 'Middle East',
    defaultRatePerUsd: 3.67,
    decimals: 2,
    phonePrefix: '+971',
  },
  {
    code: 'QAR',
    symbol: 'QAR ',
    currencyName: 'Qatari Riyal',
    countryName: 'Qatar',
    region: 'Middle East',
    defaultRatePerUsd: 3.64,
    decimals: 2,
    phonePrefix: '+974',
  },
  {
    code: 'KWD',
    symbol: 'KWD ',
    currencyName: 'Kuwaiti Dinar',
    countryName: 'Kuwait',
    region: 'Middle East',
    defaultRatePerUsd: 0.31,
    decimals: 2,
    phonePrefix: '+965',
  },
  {
    code: 'OMR',
    symbol: 'OMR ',
    currencyName: 'Omani Rial',
    countryName: 'Oman',
    region: 'Middle East',
    defaultRatePerUsd: 0.38,
    decimals: 2,
    phonePrefix: '+968',
  },

  // Europe
  {
    code: 'EUR',
    symbol: '€',
    currencyName: 'Euro',
    countryName: 'Eurozone (Germany / France / Italy)',
    region: 'Europe',
    defaultRatePerUsd: 0.92,
    decimals: 2,
    phonePrefix: '+49',
  },
  {
    code: 'GBP',
    symbol: '£',
    currencyName: 'British Pound',
    countryName: 'United Kingdom',
    region: 'Europe',
    defaultRatePerUsd: 0.79,
    decimals: 2,
    phonePrefix: '+44',
  },
  {
    code: 'CHF',
    symbol: 'CHF ',
    currencyName: 'Swiss Franc',
    countryName: 'Switzerland',
    region: 'Europe',
    defaultRatePerUsd: 0.87,
    decimals: 2,
    phonePrefix: '+41',
  },
  {
    code: 'SEK',
    symbol: 'kr ',
    currencyName: 'Swedish Krona',
    countryName: 'Sweden',
    region: 'Europe',
    defaultRatePerUsd: 10.55,
    decimals: 2,
    phonePrefix: '+46',
  },
  {
    code: 'TRY',
    symbol: '₺',
    currencyName: 'Turkish Lira',
    countryName: 'Turkey',
    region: 'Europe',
    defaultRatePerUsd: 34.2,
    decimals: 2,
    phonePrefix: '+90',
  },

  // Asia-Pacific
  {
    code: 'INR',
    symbol: '₹',
    currencyName: 'Indian Rupee',
    countryName: 'India',
    region: 'Asia-Pacific',
    defaultRatePerUsd: 84.1,
    decimals: 0,
    phonePrefix: '+91',
  },
  {
    code: 'JPY',
    symbol: '¥',
    currencyName: 'Japanese Yen',
    countryName: 'Japan',
    region: 'Asia-Pacific',
    defaultRatePerUsd: 152.0,
    decimals: 0,
    phonePrefix: '+81',
  },
  {
    code: 'KRW',
    symbol: '₩',
    currencyName: 'South Korean Won',
    countryName: 'South Korea',
    region: 'Asia-Pacific',
    defaultRatePerUsd: 1380.0,
    decimals: 0,
    phonePrefix: '+82',
  },
  {
    code: 'SGD',
    symbol: 'S$',
    currencyName: 'Singapore Dollar',
    countryName: 'Singapore',
    region: 'Asia-Pacific',
    defaultRatePerUsd: 1.32,
    decimals: 2,
    phonePrefix: '+65',
  },
  {
    code: 'HKD',
    symbol: 'HK$',
    currencyName: 'Hong Kong Dollar',
    countryName: 'Hong Kong',
    region: 'Asia-Pacific',
    defaultRatePerUsd: 7.78,
    decimals: 2,
    phonePrefix: '+852',
  },
  {
    code: 'MYR',
    symbol: 'RM ',
    currencyName: 'Malaysian Ringgit',
    countryName: 'Malaysia',
    region: 'Asia-Pacific',
    defaultRatePerUsd: 4.35,
    decimals: 2,
    phonePrefix: '+60',
  },
  {
    code: 'IDR',
    symbol: 'Rp ',
    currencyName: 'Indonesian Rupiah',
    countryName: 'Indonesia',
    region: 'Asia-Pacific',
    defaultRatePerUsd: 15650.0,
    decimals: 0,
    phonePrefix: '+62',
  },
  {
    code: 'PHP',
    symbol: '₱',
    currencyName: 'Philippine Peso',
    countryName: 'Philippines',
    region: 'Asia-Pacific',
    defaultRatePerUsd: 58.1,
    decimals: 0,
    phonePrefix: '+63',
  },
  {
    code: 'PKR',
    symbol: 'Rs ',
    currencyName: 'Pakistani Rupee',
    countryName: 'Pakistan',
    region: 'Asia-Pacific',
    defaultRatePerUsd: 278.0,
    decimals: 0,
    phonePrefix: '+92',
  },
  {
    code: 'AUD',
    symbol: 'A$',
    currencyName: 'Australian Dollar',
    countryName: 'Australia',
    region: 'Asia-Pacific',
    defaultRatePerUsd: 1.51,
    decimals: 2,
    phonePrefix: '+61',
  },

  // Americas
  {
    code: 'CAD',
    symbol: 'C$',
    currencyName: 'Canadian Dollar',
    countryName: 'Canada',
    region: 'Americas',
    defaultRatePerUsd: 1.39,
    decimals: 2,
    phonePrefix: '+1',
  },
  {
    code: 'BRL',
    symbol: 'R$',
    currencyName: 'Brazilian Real',
    countryName: 'Brazil',
    region: 'Americas',
    defaultRatePerUsd: 5.7,
    decimals: 2,
    phonePrefix: '+55',
  },
  {
    code: 'MXN',
    symbol: 'MX$',
    currencyName: 'Mexican Peso',
    countryName: 'Mexico',
    region: 'Americas',
    defaultRatePerUsd: 19.9,
    decimals: 2,
    phonePrefix: '+52',
  },
];

export const DEFAULT_FX_RATES: Record<string, number> = COUNTRY_CURRENCIES.reduce(
  (acc, item) => {
    acc[item.code] = item.defaultRatePerUsd;
    return acc;
  },
  {} as Record<string, number>
);

export function getCurrencyMeta(
  currencyCode: string,
  customCurrency?: CustomCurrencyConfig | null
): {
  code: string;
  symbol: string;
  currencyName: string;
  countryName: string;
  decimals: 0 | 2;
  defaultRatePerUsd: number;
} {
  const cleanCode = (currencyCode || 'USD').trim().toUpperCase();
  if (customCurrency && customCurrency.code.trim().toUpperCase() === cleanCode) {
    return {
      code: cleanCode,
      symbol: customCurrency.symbol || `${cleanCode} `,
      currencyName: `${customCurrency.countryName} (${cleanCode})`,
      countryName: customCurrency.countryName,
      decimals: customCurrency.decimals,
      defaultRatePerUsd: customCurrency.ratePerUsd > 0 ? customCurrency.ratePerUsd : 1,
    };
  }

  const found = COUNTRY_CURRENCIES.find((c) => c.code === cleanCode);
  if (found) {
    return found;
  }

  return {
    code: cleanCode,
    symbol: `${cleanCode} `,
    currencyName: cleanCode,
    countryName: cleanCode,
    decimals: 2,
    defaultRatePerUsd: 1,
  };
}

export function getEffectiveRatePerUsd(
  currencyCode: string,
  liveRates?: Record<string, number>,
  customCurrency?: CustomCurrencyConfig | null
): number {
  const cleanCode = (currencyCode || 'USD').trim().toUpperCase();
  if (cleanCode === 'USD') return 1;

  if (customCurrency && customCurrency.code.trim().toUpperCase() === cleanCode) {
    return customCurrency.ratePerUsd > 0 ? customCurrency.ratePerUsd : 1;
  }

  const fromLive = liveRates?.[cleanCode];
  if (typeof fromLive === 'number' && Number.isFinite(fromLive) && fromLive > 0) {
    return fromLive;
  }

  const fallback = DEFAULT_FX_RATES[cleanCode];
  return typeof fallback === 'number' && fallback > 0 ? fallback : 1;
}

export function convertUsdAmount(
  amountUsd: number,
  currencyCode: string,
  liveRates?: Record<string, number>,
  customCurrency?: CustomCurrencyConfig | null
): number {
  const safeUsd = Number.isFinite(amountUsd) ? amountUsd : 0;
  const meta = getCurrencyMeta(currencyCode, customCurrency);
  const rate = getEffectiveRatePerUsd(currencyCode, liveRates, customCurrency);
  const raw = safeUsd * rate;
  return meta.decimals === 0 ? Math.round(raw) : Number(raw.toFixed(2));
}

export function formatMoneyFromUsd(
  amountUsd: number,
  currencyCode: string = 'USD',
  liveRates?: Record<string, number>,
  customCurrency?: CustomCurrencyConfig | null
): string {
  const meta = getCurrencyMeta(currencyCode, customCurrency);
  const converted = convertUsdAmount(amountUsd, meta.code, liveRates, customCurrency);
  const isNegative = converted < 0;
  const absVal = Math.abs(converted);

  const formattedNum = absVal.toLocaleString('en-US', {
    minimumFractionDigits: meta.decimals,
    maximumFractionDigits: meta.decimals,
  });

  return `${isNegative ? '-' : ''}${meta.symbol}${formattedNum}`;
}

export function getExchangeRateSummary(
  currencyCode: string,
  liveRates?: Record<string, number>,
  customCurrency?: CustomCurrencyConfig | null
): string {
  const meta = getCurrencyMeta(currencyCode, customCurrency);
  if (meta.code === 'USD') {
    return 'Base Currency: USD ($) · United States';
  }
  const rate = getEffectiveRatePerUsd(meta.code, liveRates, customCurrency);
  const formattedRate = rate.toLocaleString('en-US', {
    minimumFractionDigits: rate >= 50 ? 0 : 2,
    maximumFractionDigits: rate >= 50 ? 2 : 4,
  });
  return `1 USD = ${formattedRate} ${meta.code} · ${meta.countryName}`;
}

export function searchCountryCurrencies(query: string): CountryCurrencyOption[] {
  const q = query.trim().toLowerCase();
  if (!q) return COUNTRY_CURRENCIES;

  return COUNTRY_CURRENCIES.filter(
    (item) =>
      item.countryName.toLowerCase().includes(q) ||
      item.currencyName.toLowerCase().includes(q) ||
      item.code.toLowerCase().includes(q) ||
      item.region.toLowerCase().includes(q) ||
      item.symbol.trim().toLowerCase().includes(q)
  );
}

export function validateCustomCurrencyInput(input: {
  code: string;
  countryName: string;
  ratePerUsd: number;
}): string | undefined {
  const cleanCode = input.code.trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(cleanCode)) {
    return 'Enter a valid 3-letter ISO currency code (e.g. ZMW, BWP, DZD).';
  }
  const cleanCountry = input.countryName.trim();
  if (cleanCountry.length < 2 || cleanCountry.length > 60) {
    return 'Enter the country name (2–60 characters).';
  }
  if (!Number.isFinite(input.ratePerUsd) || input.ratePerUsd <= 0 || input.ratePerUsd > 1000000) {
    return 'Enter a positive exchange rate per 1 USD (e.g. 27.50).';
  }
  return undefined;
}
