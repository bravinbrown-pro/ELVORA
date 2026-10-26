import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  Check,
  Clock,
  Globe,
  LogOut,
  MapPin,
  Package,
  ShieldCheck,
  UserCheck,
  UserPlus,
} from 'lucide-react';
import { ORDER_STATUS_STEPS, OrderRecord } from '../utils/commerce';
import { COUNTRY_CURRENCIES } from '../utils/currency';
import {
  CustomerAccountPublic,
  LoginCustomerInput,
  RegisterCustomerInput,
  UpdateCustomerProfileInput,
  validateCustomerLogin,
  validateCustomerProfileUpdate,
  validateCustomerRegistration,
} from '../utils/customerAccount';
import { ElvoraEmblem } from './ElvoraLogo';
import { ProductMedia } from './ProductMedia';

interface CustomerAccountViewProps {
  customer: CustomerAccountPublic | null;
  orders: OrderRecord[];
  businessName: string;
  activeCurrencyCode: string;
  formatPrice: (usdAmount: number) => string;
  onRegister: (input: RegisterCustomerInput) => Promise<void>;
  onLogin: (input: LoginCustomerInput) => Promise<void>;
  onUpdateProfile: (input: UpdateCustomerProfileInput) => Promise<void>;
  onLogout: () => Promise<void>;
  onGoogleSignIn: () => Promise<void>;
  onOpenCurrencyModal: () => void;
  onTrackOrder: (orderCode: string) => void;
  onBrowseCatalog: () => void;
}

function normalizePhoneDigits(phone: string): string {
  return phone.replace(/[^0-9+]/g, '');
}

export function CustomerAccountView({
  customer,
  orders,
  businessName,
  activeCurrencyCode,
  formatPrice,
  onRegister,
  onLogin,
  onUpdateProfile,
  onLogout,
  onGoogleSignIn,
  onOpenCurrencyModal,
  onTrackOrder,
  onBrowseCatalog,
}: CustomerAccountViewProps) {
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');

  // Login Form State
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);

  // Registration Form State
  const defaultCountryOption = useMemo(
    () =>
      COUNTRY_CURRENCIES.find((c) => c.code === activeCurrencyCode.toUpperCase()) ??
      COUNTRY_CURRENCIES[0],
    [activeCurrencyCode]
  );

  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regCountryName, setRegCountryName] = useState(defaultCountryOption.countryName);
  const [regCurrencyCode, setRegCurrencyCode] = useState(defaultCountryOption.code);
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regAddress, setRegAddress] = useState('');
  const [regError, setRegError] = useState<string | null>(null);
  const [regLoading, setRegLoading] = useState(false);

  // Signed-in Profile Edit State
  const [editName, setEditName] = useState(customer?.fullName ?? '');
  const [editPhone, setEditPhone] = useState(customer?.phone ?? '');
  const [editCountryName, setEditCountryName] = useState(customer?.countryName ?? 'Kenya');
  const [editCurrencyCode, setEditCurrencyCode] = useState(customer?.currencyCode ?? 'KES');
  const [editAddress, setEditAddress] = useState(customer?.defaultAddress ?? '');
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSavedNotice, setProfileSavedNotice] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    if (customer) {
      setEditName(customer.fullName);
      setEditPhone(customer.phone);
      setEditCountryName(customer.countryName);
      setEditCurrencyCode(customer.currencyCode);
      setEditAddress(customer.defaultAddress);
      setProfileError(null);
    }
  }, [customer]);

  const linkedOrders = useMemo(() => {
    if (!customer) return [];
    const custDigits = normalizePhoneDigits(customer.phone);
    return orders.filter((order) => {
      if (order.customerAccountId && order.customerAccountId === customer.id) {
        return true;
      }
      const orderDigits = normalizePhoneDigits(order.customerPhone);
      return custDigits.length >= 7 && orderDigits === custDigits;
    });
  }, [customer, orders]);

  const handleLoginSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    const payload: LoginCustomerInput = {
      identifier: loginIdentifier,
      password: loginPassword,
    };

    const err = validateCustomerLogin(payload);
    if (err) {
      setLoginError(err);
      return;
    }

    setLoginLoading(true);
    try {
      await onLogin(payload);
      setLoginPassword('');
    } catch (submitErr) {
      setLoginError(
        submitErr instanceof Error ? submitErr.message : 'Unable to log in right now.'
      );
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setRegError(null);

    const payload: RegisterCustomerInput = {
      fullName: regName,
      email: regEmail,
      phone: regPhone,
      password: regPassword,
      countryName: regCountryName,
      currencyCode: regCurrencyCode,
      defaultAddress: regAddress,
    };

    const err = validateCustomerRegistration(payload);
    if (err) {
      setRegError(err);
      return;
    }

    setRegLoading(true);
    try {
      await onRegister(payload);
      setRegPassword('');
    } catch (submitErr) {
      setRegError(
        submitErr instanceof Error ? submitErr.message : 'Unable to create your account.'
      );
    } finally {
      setRegLoading(false);
    }
  };

  const handleProfileSave = async (e: FormEvent) => {
    e.preventDefault();
    setProfileError(null);
    setProfileSavedNotice(null);

    const payload: UpdateCustomerProfileInput = {
      fullName: editName,
      phone: editPhone,
      countryName: editCountryName,
      currencyCode: editCurrencyCode,
      defaultAddress: editAddress,
    };

    const err = validateCustomerProfileUpdate(payload);
    if (err) {
      setProfileError(err);
      return;
    }

    setSavingProfile(true);
    try {
      await onUpdateProfile(payload);
      setProfileSavedNotice('Saved account details & synced currency across store.');
    } catch (saveErr) {
      setProfileError(
        saveErr instanceof Error ? saveErr.message : 'Unable to update profile.'
      );
    } finally {
      setSavingProfile(false);
    }
  };

  const selectedRegMeta = COUNTRY_CURRENCIES.find((c) => c.code === regCurrencyCode);

  if (!customer) {
    return (
      <div className="space-y-10 py-8 pb-20">
        <div className="flex items-start gap-4 border-b border-[var(--elv-border)] pb-6">
          <ElvoraEmblem size="md" interactive={false} />
          <div>
            <p className="text-xs font-medium text-[var(--elv-text-gold)]">
              {businessName} · Global Shopper Accounts
            </p>
            <h1 className="mt-1 font-display text-2xl sm:text-3xl font-bold text-[var(--elv-text-strong)]">
              Customer Account Login &amp; Registration
            </h1>
            <p className="mt-1.5 max-w-2xl text-sm text-[var(--elv-text-muted)]">
              Log in or create your personal Elvora account to save your country currency (USA, China,
              Saudi Arabia, Kenya, Tanzania &amp; 35+ countries), auto-fill local delivery details,
              and track every verified order.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left 7 Columns: Log In / Create Account Forms */}
          <div className="lg:col-span-7 elv-card rounded-2xl p-6 sm:p-8 space-y-6">
            <div
              role="group"
              aria-label="Customer authentication mode"
              className="elv-panel grid grid-cols-2 gap-1 rounded-xl p-1"
            >
              <button
                type="button"
                onClick={() => {
                  setAuthTab('login');
                  setLoginError(null);
                }}
                className={`inline-flex min-h-[42px] items-center justify-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-colors whitespace-nowrap ${
                  authTab === 'login'
                    ? 'elv-btn-gold'
                    : 'text-[var(--elv-text-body)] hover:text-[var(--elv-text-strong)]'
                }`}
              >
                <UserCheck className="h-4 w-4" aria-hidden="true" />
                <span>Log In</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthTab('register');
                  setRegError(null);
                }}
                className={`inline-flex min-h-[42px] items-center justify-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-colors whitespace-nowrap ${
                  authTab === 'register'
                    ? 'elv-btn-gold'
                    : 'text-[var(--elv-text-body)] hover:text-[var(--elv-text-strong)]'
                }`}
              >
                <UserPlus className="h-4 w-4" aria-hidden="true" />
                <span>Create Account</span>
              </button>
            </div>

            {authTab === 'login' ? (
              <form onSubmit={handleLoginSubmit} noValidate className="space-y-4">
                <div>
                  <label
                    htmlFor="account-login-identifier"
                    className="block text-xs font-medium text-[var(--elv-text-body)] mb-1.5"
                  >
                    Email Address or Registered Phone Number
                  </label>
                  <input
                    id="account-login-identifier"
                    type="text"
                    autoComplete="username"
                    value={loginIdentifier}
                    onChange={(e) => {
                      setLoginIdentifier(e.target.value);
                      if (loginError) setLoginError(null);
                    }}
                    placeholder="e.g. amara@elvora.shop or +254 711 234 567"
                    className="elv-input min-h-[44px] w-full rounded-lg px-3.5 text-sm"
                  />
                </div>

                <div>
                  <label
                    htmlFor="account-login-password"
                    className="block text-xs font-medium text-[var(--elv-text-body)] mb-1.5"
                  >
                    Account Password
                  </label>
                  <input
                    id="account-login-password"
                    type="password"
                    autoComplete="current-password"
                    value={loginPassword}
                    onChange={(e) => {
                      setLoginPassword(e.target.value);
                      if (loginError) setLoginError(null);
                    }}
                    placeholder="Enter your password"
                    className="elv-input min-h-[44px] w-full rounded-lg px-3.5 text-sm"
                  />
                </div>

                {loginError && (
                  <p role="alert" className="text-xs font-medium text-[var(--elv-text-gold)]">
                    {loginError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loginLoading}
                  className="elv-btn-gold flex min-h-[46px] w-full items-center justify-center rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50 whitespace-nowrap"
                >
                  {loginLoading ? 'Signing In...' : 'Log In to Elvora Account'}
                </button>

                {/* Quick Seeded Demo Account Helpers */}
                <div className="elv-panel rounded-xl p-3.5 space-y-2 text-xs">
                  <p className="text-[var(--elv-text-muted)]">
                    Want to preview a ready-made member account immediately?
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setLoginIdentifier('amara@elvora.shop');
                        setLoginPassword('elvora2026');
                        setLoginError(null);
                      }}
                      className="elv-btn-outline min-h-[36px] rounded-lg px-3 py-1 font-mono text-[11px] font-semibold whitespace-nowrap"
                    >
                      Fill Kenya Account (KES)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setLoginIdentifier('tariq@elvora.shop');
                        setLoginPassword('elvora2026');
                        setLoginError(null);
                      }}
                      className="elv-btn-outline min-h-[36px] rounded-lg px-3 py-1 font-mono text-[11px] font-semibold whitespace-nowrap"
                    >
                      Fill Saudi Account (SAR)
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              <form onSubmit={handleRegisterSubmit} noValidate className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="reg-full-name"
                      className="block text-xs font-medium text-[var(--elv-text-body)] mb-1.5"
                    >
                      Full Name
                    </label>
                    <input
                      id="reg-full-name"
                      type="text"
                      autoComplete="name"
                      value={regName}
                      onChange={(e) => {
                        setRegName(e.target.value);
                        if (regError) setRegError(null);
                      }}
                      placeholder="e.g. Neema Mwakasege"
                      className="elv-input min-h-[44px] w-full rounded-lg px-3.5 text-sm"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="reg-email"
                      className="block text-xs font-medium text-[var(--elv-text-body)] mb-1.5"
                    >
                      Email Address
                    </label>
                    <input
                      id="reg-email"
                      type="email"
                      autoComplete="email"
                      value={regEmail}
                      onChange={(e) => {
                        setRegEmail(e.target.value);
                        if (regError) setRegError(null);
                      }}
                      placeholder="e.g. neema@elvora.co.tz"
                      className="elv-input min-h-[44px] w-full rounded-lg px-3.5 text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="reg-country-currency"
                      className="block text-xs font-medium text-[var(--elv-text-body)] mb-1.5"
                    >
                      Country &amp; Preferred Currency
                    </label>
                    <select
                      id="reg-country-currency"
                      value={regCurrencyCode}
                      onChange={(e) => {
                        const chosen = COUNTRY_CURRENCIES.find((c) => c.code === e.target.value);
                        if (chosen) {
                          setRegCurrencyCode(chosen.code);
                          setRegCountryName(chosen.countryName);
                        }
                        if (regError) setRegError(null);
                      }}
                      className="elv-input min-h-[44px] w-full rounded-lg px-3 text-sm"
                    >
                      {COUNTRY_CURRENCIES.map((c) => (
                        <option key={`${c.countryName}-${c.code}`} value={c.code}>
                          {c.countryName} · {c.code} ({c.symbol.trim()})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="reg-phone"
                      className="block text-xs font-medium text-[var(--elv-text-body)] mb-1.5"
                    >
                      Mobile Phone Number
                    </label>
                    <input
                      id="reg-phone"
                      type="tel"
                      autoComplete="tel"
                      value={regPhone}
                      onChange={(e) => {
                        setRegPhone(e.target.value);
                        if (regError) setRegError(null);
                      }}
                      placeholder={`e.g. ${selectedRegMeta?.phonePrefix ?? '+255'} 754 882 109`}
                      className="elv-input min-h-[44px] w-full rounded-lg px-3.5 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="reg-address"
                    className="block text-xs font-medium text-[var(--elv-text-body)] mb-1.5"
                  >
                    Default Local Delivery Street &amp; City Address
                  </label>
                  <input
                    id="reg-address"
                    type="text"
                    autoComplete="street-address"
                    value={regAddress}
                    onChange={(e) => {
                      setRegAddress(e.target.value);
                      if (regError) setRegError(null);
                    }}
                    placeholder="e.g. Plot 42 Haile Selassie Rd, Masaki, Dar es Salaam"
                    className="elv-input min-h-[44px] w-full rounded-lg px-3.5 text-sm"
                  />
                </div>

                <div>
                  <label
                    htmlFor="reg-password"
                    className="block text-xs font-medium text-[var(--elv-text-body)] mb-1.5"
                  >
                    Create Password (6+ characters)
                  </label>
                  <input
                    id="reg-password"
                    type="password"
                    autoComplete="new-password"
                    value={regPassword}
                    onChange={(e) => {
                      setRegPassword(e.target.value);
                      if (regError) setRegError(null);
                    }}
                    placeholder="At least 6 characters"
                    className="elv-input min-h-[44px] w-full rounded-lg px-3.5 text-sm"
                  />
                </div>

                {regError && (
                  <p role="alert" className="text-xs font-medium text-[var(--elv-text-gold)]">
                    {regError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={regLoading}
                  className="elv-btn-gold flex min-h-[46px] w-full items-center justify-center rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50 whitespace-nowrap"
                >
                  {regLoading
                    ? 'Creating Your Elvora Account...'
                    : `Create Account & Shop in ${regCurrencyCode}`}
                </button>
              </form>
            )}

            <div className="border-t border-[var(--elv-border)] pt-5 space-y-3">
              <p className="text-center text-xs text-[var(--elv-text-muted)]">
                Or sign in with Google Cloud Sync
              </p>
              <button
                type="button"
                onClick={() => void onGoogleSignIn()}
                className="elv-btn-outline flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-colors whitespace-nowrap"
              >
                <span>Continue with Google Account</span>
              </button>
            </div>
          </div>

          {/* Right 5 Columns: Account & Multi-Currency Benefits */}
          <div className="lg:col-span-5 elv-card rounded-2xl p-6 sm:p-7 space-y-6">
            <div>
              <h2 className="font-display text-lg font-bold text-[var(--elv-text-strong)]">
                Why Create an Elvora Buyer Account?
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-[var(--elv-text-muted)]">
                Built for global shoppers across Africa, the Middle East, Asia, Europe, and the
                Americas.
              </p>
            </div>

            <div className="space-y-4 text-xs">
              <div className="flex items-start gap-3">
                <Globe
                  className="mt-0.5 h-4 w-4 text-[var(--elv-text-gold)] shrink-0"
                  aria-hidden="true"
                />
                <div>
                  <p className="font-semibold text-[var(--elv-text-strong)]">
                    Automatic Local Currency Conversion
                  </p>
                  <p className="mt-0.5 text-[var(--elv-text-body)]">
                    Save USD, CNY (China), SAR (Saudi Arabia), KES (Kenya), TZS (Tanzania), or any
                    country currency so prices and local courier costs always match your wallet.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin
                  className="mt-0.5 h-4 w-4 text-[var(--elv-text-gold)] shrink-0"
                  aria-hidden="true"
                />
                <div>
                  <p className="font-semibold text-[var(--elv-text-strong)]">
                    Instant Express Checkout Auto-Fill
                  </p>
                  <p className="mt-0.5 text-[var(--elv-text-body)]">
                    Your recipient name, phone number, and street address pre-populate inside the
                    bag drawer for faster same-day dispatch.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <ShieldCheck
                  className="mt-0.5 h-4 w-4 text-[var(--elv-text-gold)] shrink-0"
                  aria-hidden="true"
                />
                <div>
                  <p className="font-semibold text-[var(--elv-text-strong)]">
                    Linked Order &amp; Exact Arrival Vault
                  </p>
                  <p className="mt-0.5 text-[var(--elv-text-body)]">
                    View every verified order, payment reference, and exact doorstep arrival clock
                    time in one place.
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t border-[var(--elv-border)] pt-4 flex items-center justify-between gap-3 text-xs">
              <span className="text-[var(--elv-text-muted)]">
                Current Store Currency: <strong className="text-[var(--elv-text-gold)]">{activeCurrencyCode}</strong>
              </span>
              <button
                type="button"
                onClick={onOpenCurrencyModal}
                className="font-semibold text-[var(--elv-text-gold)] underline underline-offset-4 whitespace-nowrap"
              >
                Switch Currency ({formatPrice(100)})
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 py-8 pb-20">
      {/* Signed-In Member Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 border-b border-[var(--elv-border)] pb-6">
        <div className="flex items-start gap-4">
          <ElvoraEmblem size="md" interactive={false} />
          <div>
            <p className="text-xs font-medium text-[var(--elv-text-gold)]">
              {businessName} · Verified Buyer Account
            </p>
            <h1 className="mt-1 font-display text-2xl sm:text-3xl font-bold text-[var(--elv-text-strong)]">
              Welcome, {customer.fullName}
            </h1>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[var(--elv-text-muted)]">
              <span>{customer.email}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono">{customer.phone}</span>
              <span aria-hidden="true">·</span>
              <span className="font-semibold text-[var(--elv-text-gold)]">
                {customer.countryName} ({activeCurrencyCode})
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onOpenCurrencyModal}
            className="elv-btn-outline inline-flex min-h-[42px] items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold whitespace-nowrap"
          >
            <Globe className="h-3.5 w-3.5 text-[var(--elv-text-gold)]" aria-hidden="true" />
            <span>Currency: {activeCurrencyCode}</span>
          </button>

          <button
            type="button"
            onClick={() => void onLogout()}
            className="elv-btn-outline inline-flex min-h-[42px] items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold whitespace-nowrap"
          >
            <LogOut className="h-3.5 w-3.5 text-[var(--elv-text-gold)]" aria-hidden="true" />
            <span>Log Out</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left 5 Columns: Saved Profile, Country Currency & Default Delivery Address */}
        <section
          aria-labelledby="account-profile-heading"
          className="lg:col-span-5 elv-card rounded-2xl p-6 sm:p-7 space-y-5"
        >
          <div>
            <h2
              id="account-profile-heading"
              className="font-display text-lg font-bold text-[var(--elv-text-strong)]"
            >
              Saved Delivery &amp; Currency Preferences
            </h2>
            <p className="mt-1 text-xs text-[var(--elv-text-muted)]">
              Automatically fills your checkout bag and sets your default country currency.
            </p>
          </div>

          <form onSubmit={handleProfileSave} noValidate className="space-y-4">
            <div>
              <label
                htmlFor="profile-edit-name"
                className="block text-xs font-medium text-[var(--elv-text-body)] mb-1.5"
              >
                Full Name
              </label>
              <input
                id="profile-edit-name"
                type="text"
                value={editName}
                onChange={(e) => {
                  setEditName(e.target.value);
                  setProfileSavedNotice(null);
                }}
                className="elv-input min-h-[44px] w-full rounded-lg px-3.5 text-sm"
              />
            </div>

            <div>
              <label
                htmlFor="profile-edit-country"
                className="block text-xs font-medium text-[var(--elv-text-body)] mb-1.5"
              >
                Country &amp; Default Currency
              </label>
              <select
                id="profile-edit-country"
                value={editCurrencyCode}
                onChange={(e) => {
                  const chosen = COUNTRY_CURRENCIES.find((c) => c.code === e.target.value);
                  if (chosen) {
                    setEditCurrencyCode(chosen.code);
                    setEditCountryName(chosen.countryName);
                  } else {
                    setEditCurrencyCode(e.target.value);
                  }
                  setProfileSavedNotice(null);
                }}
                className="elv-input min-h-[44px] w-full rounded-lg px-3 text-sm"
              >
                {!COUNTRY_CURRENCIES.some((c) => c.code === editCurrencyCode) && (
                  <option value={editCurrencyCode}>
                    {editCountryName} · {editCurrencyCode}
                  </option>
                )}
                {COUNTRY_CURRENCIES.map((c) => (
                  <option key={`${c.countryName}-${c.code}`} value={c.code}>
                    {c.countryName} · {c.code} ({c.symbol.trim()})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="profile-edit-phone"
                className="block text-xs font-medium text-[var(--elv-text-body)] mb-1.5"
              >
                Contact Phone Number
              </label>
              <input
                id="profile-edit-phone"
                type="tel"
                value={editPhone}
                onChange={(e) => {
                  setEditPhone(e.target.value);
                  setProfileSavedNotice(null);
                }}
                className="elv-input min-h-[44px] w-full rounded-lg px-3.5 text-sm"
              />
            </div>

            <div>
              <label
                htmlFor="profile-edit-address"
                className="block text-xs font-medium text-[var(--elv-text-body)] mb-1.5"
              >
                Default Local Delivery Address
              </label>
              <input
                id="profile-edit-address"
                type="text"
                value={editAddress}
                onChange={(e) => {
                  setEditAddress(e.target.value);
                  setProfileSavedNotice(null);
                }}
                className="elv-input min-h-[44px] w-full rounded-lg px-3.5 text-sm"
              />
            </div>

            {profileError && (
              <p role="alert" className="text-xs font-medium text-[var(--elv-text-gold)]">
                {profileError}
              </p>
            )}

            {profileSavedNotice && (
              <p
                role="status"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--elv-text-gold)]"
              >
                <Check className="h-4 w-4" aria-hidden="true" />
                <span>{profileSavedNotice}</span>
              </p>
            )}

            <button
              type="submit"
              disabled={savingProfile}
              className="elv-btn-gold flex min-h-[44px] w-full items-center justify-center rounded-lg px-5 py-2.5 text-xs font-semibold transition-colors disabled:opacity-50 whitespace-nowrap"
            >
              {savingProfile ? 'Saving Preferences...' : 'Save Account Preferences'}
            </button>
          </form>
        </section>

        {/* Right 7 Columns: Linked Customer Orders */}
        <section
          aria-labelledby="account-orders-heading"
          className="lg:col-span-7 elv-card rounded-2xl p-6 sm:p-7 space-y-5"
        >
          <div className="flex items-center justify-between gap-4 border-b border-[var(--elv-border)] pb-4">
            <div>
              <h2
                id="account-orders-heading"
                className="font-display text-lg font-bold text-[var(--elv-text-strong)]"
              >
                My Linked Orders ({linkedOrders.length})
              </h2>
              <p className="mt-0.5 text-xs text-[var(--elv-text-muted)]">
                Prepaid hardware orders linked to your Elvora account or phone number.
              </p>
            </div>

            <button
              type="button"
              onClick={onBrowseCatalog}
              className="elv-btn-outline min-h-[38px] rounded-lg px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap shrink-0"
            >
              Shop More Electronics
            </button>
          </div>

          {linkedOrders.length === 0 ? (
            <div className="elv-panel rounded-xl p-8 text-center space-y-3">
              <Package className="mx-auto h-7 w-7 text-[var(--elv-text-gold)]" aria-hidden="true" />
              <p className="font-display text-base font-semibold text-[var(--elv-text-strong)]">
                No orders placed under this account yet
              </p>
              <p className="text-xs text-[var(--elv-text-muted)]">
                Your delivery address ({customer.defaultAddress}) and {activeCurrencyCode} currency
                are ready in your bag for instant checkout.
              </p>
              <button
                type="button"
                onClick={onBrowseCatalog}
                className="elv-btn-gold inline-flex min-h-[42px] items-center justify-center rounded-lg px-5 py-2 text-xs font-semibold whitespace-nowrap"
              >
                Explore Electronics &amp; Combos
              </button>
            </div>
          ) : (
            <ul className="space-y-6">
              {linkedOrders.map((order) => {
                const statusMeta = ORDER_STATUS_STEPS.find((s) => s.status === order.status);
                const orderDateStr = new Date(order.createdAtIso).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                });
                return (
                  <li
                    key={order.id}
                    className="elv-panel rounded-xl p-5 space-y-4 border border-[var(--elv-border)]"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--elv-border)] pb-3">
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="font-mono font-bold text-[var(--elv-text-gold)] text-sm">
                          {order.orderCode}
                        </span>
                        <span aria-hidden="true" className="text-[var(--elv-text-muted)]">
                          ·
                        </span>
                        <span className="inline-flex items-center gap-1 font-semibold text-[var(--elv-text-strong)] bg-[var(--elv-surface)] px-2.5 py-1 rounded-md border border-[var(--elv-border)]">
                          <span className="h-2 w-2 rounded-full bg-[var(--elv-text-gold)] animate-pulse" />
                          {statusMeta?.label ?? order.status}
                        </span>
                        <span aria-hidden="true" className="text-[var(--elv-text-muted)]">
                          ·
                        </span>
                        <span className="text-[var(--elv-text-muted)]">{orderDateStr}</span>
                      </div>

                      <span className="font-mono text-base font-bold text-[var(--elv-text-gold)] tabular-nums">
                        {formatPrice(order.totalUsd)}
                      </span>
                    </div>

                    {/* Detailed Itemized Products List */}
                    <ul className="divide-y divide-[var(--elv-border)]">
                      {order.items.map((item) => (
                        <li key={`${order.id}-${item.productId}`} className="flex items-center gap-3.5 py-3 first:pt-0 last:pb-0">
                          <div className="h-12 w-14 shrink-0 overflow-hidden rounded-lg border border-[var(--elv-border)]">
                            <ProductMedia
                              imageKey={item.imageKey}
                              alt={item.title}
                              aspectClass="h-full w-full"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-semibold text-[var(--elv-text-strong)]">
                              {item.title}
                            </p>
                            <p className="font-mono text-[11px] text-[var(--elv-text-muted)] tabular-nums">
                              Qty {item.quantity} × {formatPrice(item.unitPrice)}
                            </p>
                          </div>
                          <span className="font-mono text-xs font-semibold text-[var(--elv-text-strong)] tabular-nums shrink-0">
                            {formatPrice(item.unitPrice * item.quantity)}
                          </span>
                        </li>
                      ))}
                    </ul>

                    {/* Financial Subtotal & Delivery Summary */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 border-t border-[var(--elv-border)] pt-3 text-[11px] text-[var(--elv-text-muted)] font-mono">
                      <div>
                        <span>Subtotal: </span>
                        <span className="text-[var(--elv-text-body)] font-semibold">{formatPrice(order.subtotalUsd)}</span>
                      </div>
                      <div>
                        <span>Delivery: </span>
                        <span className="text-[var(--elv-text-body)] font-semibold">+{formatPrice(order.deliveryFeeUsd)}</span>
                      </div>
                      {order.discountSavedUsd ? (
                        <div className="text-[var(--elv-text-gold)]">
                          <span>Promo Saved: </span>
                          <span className="font-semibold">-{formatPrice(order.discountSavedUsd)}</span>
                        </div>
                      ) : (
                        <div />
                      )}
                      <div className="text-right sm:text-left">
                        <span>Courier: </span>
                        <span className="text-[var(--elv-text-strong)]">{order.courierName}</span>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-[var(--elv-border)] pt-3 text-xs">
                      <span className="inline-flex items-center gap-1.5 text-[var(--elv-text-muted)]">
                        <Clock
                          className="h-3.5 w-3.5 text-[var(--elv-text-gold)] shrink-0"
                          aria-hidden="true"
                        />
                        <span>
                          Exact Arrival ETA:{' '}
                          <strong className="text-[var(--elv-text-gold)]">
                            {order.etaLabel}
                          </strong>
                        </span>
                      </span>

                      <button
                        type="button"
                        onClick={() => onTrackOrder(order.orderCode)}
                        className="elv-btn-gold min-h-[38px] rounded-lg px-4 py-1.5 text-xs font-semibold whitespace-nowrap self-start sm:self-auto"
                      >
                        Track Live Delivery &amp; Receipt
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
