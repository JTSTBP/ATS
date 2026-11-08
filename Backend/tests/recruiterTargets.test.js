const test = require('node:test');
const assert = require('node:assert/strict');
const { targetWindow, calculateTargets, istDay } = require('../services/recruiterTargets');
test('DOJ cycles cross calendar months and roll on day 31', () => {
  assert.deepEqual(targetWindow('2026-10-20', '2026-11-18T10:00Z'), { start: '2026-10-20', end: '2026-11-18', elapsed: 30, daysLeft: 1, cycle: 1 });
  assert.equal(targetWindow('2026-10-20', '2026-11-19T10:00Z').start, '2026-11-19');
  assert.equal(targetWindow(null), null);
  assert.equal(targetWindow('2027-01-01', '2026-11-08'), null);
});
test('daily reset uses IST and includes both cycle endpoints', () => {
  assert.equal(istDay('2026-11-08T18:30:00Z'), '2026-11-09');
  const result = calculateTargets({ doj: '2026-10-20', now: '2026-11-08T18:29:59Z', candidates: [
    { _id: 'a', createdAt: '2026-11-07T18:30Z', status: 'Joined', joiningDate: '2026-10-20', lineupApproval: { status: 'Approved' } },
    { _id: 'b', createdAt: '2026-11-08T18:30Z', status: 'Joined', joiningDate: '2026-11-09' },
    { _id: 'c', createdAt: '2026-11-08T09:00Z', status: 'Dropped', joiningDate: '2026-11-01' },
    { _id: 'd', createdAt: '2026-11-08T09:00Z', status: 'New', lineupApproval: { status: 'Rejected' } },
  ] });
  assert.equal(result.closures, 1); assert.equal(result.lineups, 3); assert.equal(result.approved, 1); assert.equal(result.pending, 1); assert.equal(result.rejected, 1);
});
test('source conversion keeps credit and logs do not double count additions', () => {
  const result = calculateTargets({ now: '2026-11-08T10:00Z', sources: [{ _id: 'a', createdAt: '2026-11-08', contactSource: 'LinkedIn' }], logs: [{ targetId: 'a', createdAt: '2026-11-08' }, { targetId: 'b', createdAt: '2026-11-08' }, { targetId: 'b', createdAt: '2026-11-08' }] });
  assert.equal(result.sourced, 2); assert.equal(result.sourceBreakdown.LinkedIn, 1);
});

test("legacy profiles without dates do not crash or count toward daily goals", () => {
 const result = calculateTargets({ candidates: [{ _id: "legacy", status: "New" }], sources: [{ _id: "legacy" }], logs: [{ targetId: "legacy" }], now: "2026-11-09T10:00Z" });
 assert.equal(result.lineups, 0); assert.equal(result.sourced, 0);
});
