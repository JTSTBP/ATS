const { test } = require('node:test');
const assert = require('node:assert/strict');
const { calculatePayroll } = require('../services/payrollCalculator');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const base = { doj: '2026-01-20', periodNumber: 1, salary: 30000 };

test('DOJ starts consecutive 30-day periods across months and leap years', () => {
  assert.equal(calculatePayroll(base).periodEnd, '2026-02-18');
  assert.equal(calculatePayroll({ ...base, periodNumber: 2 }).periodStart, '2026-02-19');
  assert.equal(calculatePayroll({ ...base, doj: '2024-02-01' }).periodEnd, '2024-03-01');
});

test('counts approved overlapping leave days within the period, including half days', () => {
  const leaves = [
    { status: 'Approved', fromDate: '2026-01-18', toDate: '2026-01-21' },
    { status: 'Approved', fromDate: '2026-01-21', toDate: '2026-01-21' },
    { status: 'Approved', fromDate: '2026-02-18', toDate: '2026-02-18', leaveCategory: 'Half Day' },
    { status: 'Pending', fromDate: '2026-02-01', toDate: '2026-02-04' },
    { status: 'Rejected', fromDate: '2026-02-05', toDate: '2026-02-07' },
    { status: 'Approved', fromDate: '2026-02-19', toDate: '2026-02-22' },
  ];
  const result = calculatePayroll({ ...base, leaves });
  assert.equal(result.leaveDays, 2.5);
  assert.equal(result.deduction, 2500);
  assert.equal(result.netPay, 27500);
  assert.equal(calculatePayroll({ ...base, leaves, deductionDays: 0 }).netPay, 30000);
  assert.equal(calculatePayroll({ ...base, leaves, deductionDays: 3 }).netPay, 27000);
});

test('rounds money to cents and rejects invalid inputs instead of guessing', () => {
  assert.equal(calculatePayroll({ ...base, salary: 1000, deductionDays: 1 }).netPay, 966.67);
  assert.equal(calculatePayroll({ ...base, deductionDays: 30 }).netPay, 0);
  for (const override of [{ salary: -1 }, { salary: NaN }, { salary: '30000' }, { salary: 1.234 }, { deductionDays: 31 }, { deductionDays: -1 }, { deductionDays: 0.25 }, { periodNumber: 0 }, { periodNumber: 1.5 }, { doj: null }, { doj: '2026-02-30' }]) {
    assert.throws(() => calculatePayroll({ ...base, ...override }));
  }
});

test('payroll API authenticates and allows only Admin and Finance', () => {
  let middleware;
  const protect = () => {};
  const router = { use(...args) { middleware = args; }, get() {}, post() {} };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../routes/Payrollroutes.js'), 'utf8'), {
    module: { exports: {} }, require(name) {
      if (name === 'express') return { Router: () => router };
      if (name === '../middleware/authMiddleware') return { protect };
      return {};
    },
  });
  assert.equal(middleware[0], protect);
  for (const designation of ['Admin', 'Finance', 'Recruiter', 'Mentor', 'Manager']) {
    let allowed = false;
    const response = { status(code) { this.code = code; return this; }, json() {} };
    middleware[1]({ user: { designation, isAdmin: true } }, response, () => { allowed = true; });
    assert.equal(allowed, ['Admin', 'Finance'].includes(designation));
    if (!allowed) assert.equal(response.code, 403);
  }
  let allowed = false;
  middleware[1]({ user: { designation: 'Admin', isDisabled: true } }, { status() { return this; }, json() {} }, () => { allowed = true; });
  assert.equal(allowed, false);
});
