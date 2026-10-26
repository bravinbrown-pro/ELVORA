import test from 'node:test';
import assert from 'node:assert/strict';
import {
  COUNTRY_CURRENCIES,
  convertUsdAmount,
  formatMoneyFromUsd,
  getExchangeRateSummary,
  searchCountryCurrencies,
  validateCustomCurrencyInput,
} from './currency';
import {
  validateCustomerLogin,
  validateCustomerProfileUpdate,
  validateCustomerRegistration,
} from './customerAccount';

test('converts and formats prices accurately for USA, China, Saudi Arabia, Kenya, Tanzania, and custom countries', () => {
  // USA (USD)
  assert.equal(formatMoneyFromUsd(760, 'USD'), '$760.00');
  assert.equal(convertUsdAmount(279, 'USD'), 279);

  // China (CNY: 7.24)
  assert.equal(convertUsdAmount(100, 'CNY'), 724);
  assert.equal(formatMoneyFromUsd(100, 'CNY'), '¥724.00');

  // Saudi Arabia (SAR: 3.75)
  assert.equal(convertUsdAmount(760, 'SAR'), 2850);
  assert.equal(formatMoneyFromUsd(760, 'SAR'), 'SAR 2,850.00');

  // Kenya (KES: 129.0, 0 decimals)
  assert.equal(convertUsdAmount(760, 'KES'), 98040);
  assert.equal(formatMoneyFromUsd(760, 'KES'), 'KSh 98,040');

  // Tanzania (TZS: 2680.0, 0 decimals)
  assert.equal(convertUsdAmount(100, 'TZS'), 268000);
  assert.equal(formatMoneyFromUsd(100, 'TZS'), 'TSh 268,000');

  // Custom Country Currency (e.g. Zambia ZMW)
  const customZmw = {
    code: 'ZMW',
    symbol: 'ZK ',
    countryName: 'Zambia',
    ratePerUsd: 27.5,
    decimals: 2 as const,
  };
  assert.equal(formatMoneyFromUsd(100, 'ZMW', undefined, customZmw), 'ZK 2,750.00');
  assert.match(getExchangeRateSummary('TZS'), /1 USD = 2,680 TZS · Tanzania/);
});

test('searchCountryCurrencies finds China, USA, Saudi Arabia, Kenya, Tanzania, and global regions', () => {
  assert.ok(COUNTRY_CURRENCIES.length >= 30);
  assert.equal(searchCountryCurrencies('china')[0].code, 'CNY');
  assert.equal(searchCountryCurrencies('saudi')[0].code, 'SAR');
  assert.equal(searchCountryCurrencies('kenya')[0].code, 'KES');
  assert.equal(searchCountryCurrencies('tanzania')[0].code, 'TZS');
  assert.equal(searchCountryCurrencies('united states')[0].code, 'USD');

  assert.equal(
    validateCustomCurrencyInput({ code: 'BWP', countryName: 'Botswana', ratePerUsd: 13.6 }),
    undefined
  );
  assert.ok(
    validateCustomCurrencyInput({ code: 'INVALID', countryName: 'X', ratePerUsd: -5 })
  );
});

test('customer account registration, login, and profile update validators enforce strict constraints', () => {
  assert.ok(
    validateCustomerRegistration({
      fullName: '',
      email: 'bad-email',
      phone: '123',
      password: '123',
      countryName: '',
      currencyCode: 'US',
      defaultAddress: '',
    })
  );

  assert.equal(
    validateCustomerRegistration({
      fullName: 'Fatima Al-Harbi',
      email: 'fatima@riyadh-tech.sa',
      phone: '+966 50 123 4567',
      password: 'GoldElvora2026',
      countryName: 'Saudi Arabia',
      currencyCode: 'SAR',
      defaultAddress: 'Olaya Towers, King Fahd Road, Riyadh',
    }),
    undefined
  );

  assert.ok(validateCustomerLogin({ identifier: '', password: '12' }));
  assert.equal(
    validateCustomerLogin({ identifier: 'fatima@riyadh-tech.sa', password: 'GoldElvora2026' }),
    undefined
  );

  assert.equal(
    validateCustomerProfileUpdate({
      fullName: 'Baraka Nyerere',
      phone: '+255 754 880 112',
      countryName: 'Tanzania',
      currencyCode: 'TZS',
      defaultAddress: 'Masaki Peninsula, Haile Selassie Rd, Dar es Salaam',
    }),
    undefined
  );
});
