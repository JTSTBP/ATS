const { test } = require('node:test');
const assert = require('node:assert/strict');
let update;
let count = 1;
require.cache[require.resolve('../models/Users')] = { exports: {
  schema: { path: () => ({ cast: value => String(value) }) },
  countDocuments: async () => count,
  updateMany: async (filter, pipeline) => { update = { filter, pipeline }; },
} };
const { validateReportingMentors, syncReportingMentors } = require('../services/reportingMentors');

test('reporting mentor changes require admin rights, a Manager and valid mentors', async () => {
  const id = 'a'.repeat(24);
  await validateReportingMentors([id], 'Manager', { designation: 'Admin' });
  await assert.rejects(validateReportingMentors([id], 'Manager', { designation: 'Recruiter' }), { status: 403 });
  await assert.rejects(validateReportingMentors([id], 'Mentor', { designation: 'Admin' }), { status: 400 });
  await assert.rejects(validateReportingMentors([id, id], 'Manager', { designation: 'Admin' }), { status: 400 });
  await assert.rejects(validateReportingMentors(['invalid'], 'Manager', { designation: 'Admin' }), { status: 400 });
  count = 0;
  await assert.rejects(validateReportingMentors([id], 'Manager', { designation: 'Admin' }), { status: 400 });
  await validateReportingMentors([], 'Manager', { designation: 'Admin' });
});

// Evaluate the MongoDB expressions against fixtures without touching real users.
const evaluate = (value, doc) => {
  if (typeof value === 'string' && value.startsWith('$')) return doc[value.slice(1)];
  if (Array.isArray(value)) return value.map(item => evaluate(item, doc));
  if (!value || typeof value !== 'object') return value;
  const [operator, args] = Object.entries(value)[0];
  if (operator === '$cond') return evaluate(args[evaluate(args[0], doc) ? 1 : 2], doc);
  const values = evaluate(args, doc);
  switch (operator) {
    case '$eq': return values[0] === values[1];
    case '$ne': return values[0] !== values[1];
    case '$in': return values[1].includes(values[0]);
    case '$not': return !values[0];
    case '$and': return values.every(Boolean);
    case '$ifNull': return values[0] ?? values[1];
    case '$setUnion': return [...new Set(values.flat())];
    case '$setDifference': return values[0].filter(item => !values[1].includes(item));
    default: throw new Error(operator);
  }
};

test('selecting and removing reporting mentors preserves other manager relationships', async () => {
  await syncReportingMentors('manager', ['selected', 'primary']);
  assert.equal(update.filter.designation, 'Mentor');
  const apply = doc => Object.fromEntries(Object.entries(update.pipeline[0].$set).map(([key, value]) => [key, evaluate(value, doc)]));
  assert.deepEqual(apply({ _id: 'selected', reporter: 'other', secondary_managers: ['existing'] }), { reporter: 'other', secondary_managers: ['existing', 'manager'] });
  assert.deepEqual(apply({ _id: 'primary', reporter: 'manager', secondary_managers: ['existing'] }), { reporter: 'manager', secondary_managers: ['existing'] });
  assert.deepEqual(apply({ _id: 'removed', reporter: 'manager', secondary_managers: ['existing', 'manager'] }), { reporter: null, secondary_managers: ['existing'] });
  assert.deepEqual(apply({ _id: 'removed', reporter: 'other', secondary_managers: ['existing', 'manager'] }), { reporter: 'other', secondary_managers: ['existing'] });
  update = null;
  await syncReportingMentors('manager', undefined);
  assert.equal(update, null);
});
