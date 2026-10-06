import { isFinancialDocumentPath } from '../server/utils/financial-api.ts'
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { minorAmount, safeFinancialUrl, maskedMoneyDigits } from '../app/utils/billing.ts'
test('financial inputs preserve minor units without floating-point rounding', () => {
  assert.equal(minorAmount('123,45'), 12345)
  assert.equal(minorAmount('0.01'), 1)
  assert.equal(minorAmount('123', 'JPY'), 123)
  for (const input of [
    '1.234',
    '-1',
    '0',
    '1e3',
    '1,234.56',
    '90071992547409.92',
  ])
    assert.throws(() => minorAmount(input))
  assert.throws(() => minorAmount('1.2', 'JPY'))
})
test('financial links reject executable and insecure schemes', () => {
  for (const value of [
    'javascript:alert(1)',
    'http://example.com',
    'https://user:password@example.com',
  ])
    assert.equal(safeFinancialUrl(value), null)
  assert.equal(
    safeFinancialUrl('https://example.com/boleto'),
    'https://example.com/boleto',
  )
})

test('PDF proxy recognizes both customer and administrative receipt routes', () => {
  assert.equal(isFinancialDocumentPath('receipts/test-id'), true)
  assert.equal(
    isFinancialDocumentPath('customers/customer-id/receipts/test-id'),
    true,
  )
  assert.equal(
    isFinancialDocumentPath('customers/customer-id/receipts/test-id/details'),
    false,
  )
})

test('masked currency keeps Brazilian grouping and exact minor units', () => {
  assert.equal(maskedMoneyDigits('123456'), '1.234,56');
  assert.equal(minorAmount('1.234,56'), 123456);
  assert.equal(minorAmount('R$ 1.234,56'), 123456);
  assert.equal(minorAmount('0,00', 'BRL', true), 0);
  assert.throws(() => minorAmount('0,00'));
  assert.equal(maskedMoneyDigits('1234', 'JPY'), '1.234');
  assert.equal(minorAmount('1.234', 'JPY'), 1234);
  assert.equal(maskedMoneyDigits(''), '');
  assert.throws(() => minorAmount('1.23,45'));
});
