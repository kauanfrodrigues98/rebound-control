import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatDate, formatCalendarDate } from '../app/utils/date.ts';
import { billingDate } from '../app/utils/billing.ts';
test('contract and invoice calendar dates preserve their day without timezone shifts', () => {
  assert.equal(formatDate('2026-10-04'), '04/10/2026');
  assert.equal(billingDate('2026-10-04'), '04/10/2026');
  assert.equal(formatCalendarDate('2026-10-04T00:00:00Z'), null);
});
