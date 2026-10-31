const test = require('node:test');
const assert = require('node:assert/strict');
const { selectClientContacts } = require('../services/teamEmailSequences');

const contact = (id, recruiterId, email, createdAt, requirementId = 'job') => ({ _id: id, recruiterId, email, createdAt, requirementId, name: id });
const plan = contacts => selectClientContacts({ contacts, teamIds: ['a', 'b'], mailboxErrors: new Map(), suppressed: new Set(), contacted: new Set() });

test('client batch keeps the earliest email owner across requirements and normalizes duplicates', () => {
  const rows = plan([contact('later', 'b', ' PERSON@example.com ', '2026-10-02', 'other-job'), contact('first', 'a', 'person@example.com', '2026-10-01')]);
  assert.equal(rows.find(row => row.candidateId === 'first').eligible, true);
  assert.match(rows.find(row => row.candidateId === 'later').reason, /Duplicate/);
  assert.equal(rows.filter(row => row.eligible).length, 1);
  // Different clients are planned independently.
  assert.equal(plan([contact('other-client', 'b', 'person@example.com', '2026-10-03')])[0].eligible, true);
});

test('ownership ties use stable record IDs, and missing mailbox never transfers ownership', () => {
  const contacts = [contact('02', 'b', 'p@example.com', '2026-10-01'), contact('01', 'a', 'p@example.com', '2026-10-01')];
  const rows = selectClientContacts({ contacts, teamIds: ['a', 'b'], mailboxErrors: new Map([['a', 'Mailbox connection needed']]), suppressed: new Set(), contacted: new Set() });
  assert.equal(rows.filter(row => row.eligible).length, 0);
  assert.equal(rows.find(row => row.candidateId === '01').reason, 'Mailbox connection needed');
  assert.match(rows.find(row => row.candidateId === '02').reason, /Duplicate/);
});

test('another team earliest owner is not exposed and cannot be bypassed by selecting a later contact', () => {
  const rows = plan([contact('hidden', 'outside', 'p@example.com', '2026-10-01'), contact('visible', 'a', 'p@example.com', '2026-10-02')]);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].eligible, false);
  assert.match(rows[0].reason, /outside your team/);
  assert.equal(JSON.stringify(rows).includes('hidden'), false);
});

test('previous client contact, suppression, invalid emails and closed requirements are skipped', () => {
  const contacts = [contact('sent', 'a', 'sent@example.com', '2026-10-01'), contact('blocked', 'a', 'blocked@example.com', '2026-10-01'), contact('invalid', 'a', 'bad', '2026-10-01'), { ...contact('closed', 'b', 'closed@example.com', '2026-10-01'), closed: true }];
  const rows = selectClientContacts({ contacts, teamIds: ['a', 'b'], mailboxErrors: new Map(), suppressed: new Set(['blocked@example.com']), contacted: new Set(['sent@example.com']) });
  assert.equal(rows.filter(row => row.eligible).length, 0);
  assert.match(rows[0].reason, /Already/);
  assert.match(rows[1].reason, /suppressed/);
  assert.match(rows[2].reason, /Invalid/);
  assert.match(rows[3].reason, /closed/);
});

test('missing original timestamps hold an address instead of assigning a possibly incorrect recruiter', () => {
  const rows = plan([{ ...contact('converted', 'a', 'p@example.com', '2026-10-03'), uncertainDate: true }, contact('later', 'b', 'p@example.com', '2026-10-02')]);
  assert.equal(rows.filter(row => row.eligible).length, 0);
  assert.match(rows[1].reason, /creation time needs review/);
});
