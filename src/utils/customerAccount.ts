export interface CustomerAccountPublic {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  countryName: string;
  currencyCode: string;
  defaultAddress: string;
  authProvider: 'elvora_account' | 'google_cloud';
  createdAtIso: string;
  updatedAtIso: string;
}

export interface RegisterCustomerInput {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  countryName: string;
  currencyCode: string;
  defaultAddress: string;
}

export interface LoginCustomerInput {
  identifier: string; // email or phone number
  password: string;
}

export interface UpdateCustomerProfileInput {
  fullName: string;
  phone: string;
  countryName: string;
  currencyCode: string;
  defaultAddress: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_REGEX = /^\+?[0-9 \-()]{7,24}$/;
const CURRENCY_CODE_REGEX = /^[A-Z]{3}$/;

export function validateCustomerRegistration(
  input: RegisterCustomerInput
): string | undefined {
  const name = (input.fullName || '').trim();
  if (name.length < 2 || name.length > 80) {
    return 'Enter your full name (2–80 characters).';
  }

  const email = (input.email || '').trim().toLowerCase();
  if (!email || email.length > 120 || !EMAIL_REGEX.test(email)) {
    return 'Enter a valid email address (e.g. name@domain.com).';
  }

  const phone = (input.phone || '').trim();
  if (!phone || !PHONE_REGEX.test(phone)) {
    return 'Enter a valid phone number with optional country code (e.g. +254 712 000 111).';
  }

  const password = input.password || '';
  if (password.length < 6 || password.length > 128) {
    return 'Create a password between 6 and 128 characters.';
  }

  const country = (input.countryName || '').trim();
  if (country.length < 2 || country.length > 60) {
    return 'Select or enter your country (2–60 characters).';
  }

  const currency = (input.currencyCode || '').trim().toUpperCase();
  if (!CURRENCY_CODE_REGEX.test(currency)) {
    return 'Select a valid 3-letter currency code (e.g. USD, CNY, SAR, KES, TZS).';
  }

  const address = (input.defaultAddress || '').trim();
  if (address.length < 5 || address.length > 240) {
    return 'Enter your default local delivery street & city address (5–240 characters).';
  }

  return undefined;
}

export function validateCustomerLogin(input: LoginCustomerInput): string | undefined {
  const identifier = (input.identifier || '').trim();
  if (identifier.length < 4 || identifier.length > 120) {
    return 'Enter your registered email address or phone number.';
  }

  const password = input.password || '';
  if (password.length < 6 || password.length > 128) {
    return 'Enter your account password (at least 6 characters).';
  }

  return undefined;
}

export function validateCustomerProfileUpdate(
  input: UpdateCustomerProfileInput
): string | undefined {
  const name = (input.fullName || '').trim();
  if (name.length < 2 || name.length > 80) {
    return 'Full name must be between 2 and 80 characters.';
  }

  const phone = (input.phone || '').trim();
  if (!phone || !PHONE_REGEX.test(phone)) {
    return 'Enter a valid phone number (7–24 digits, optional + country code).';
  }

  const country = (input.countryName || '').trim();
  if (country.length < 2 || country.length > 60) {
    return 'Country name must be between 2 and 60 characters.';
  }

  const currency = (input.currencyCode || '').trim().toUpperCase();
  if (!CURRENCY_CODE_REGEX.test(currency)) {
    return 'Currency code must be 3 uppercase letters.';
  }

  const address = (input.defaultAddress || '').trim();
  if (address.length < 5 || address.length > 240) {
    return 'Default delivery address must be between 5 and 240 characters.';
  }

  return undefined;
}
