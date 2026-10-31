const test = require('node:test');
const assert = require('node:assert/strict');
const { validateEmailSequences, getEmailSequences, selectEmailSequence } = require('../services/emailSequences');
const make = (name, count) => Array.from({ length: count }, (_, i) => ({ channel: 'EMAIL', sequenceName: name, label: `Email ${i}`, subject: 'Role', body: 'Hello' }));
test('multiple named sequences allow five emails each and select only the requested sequence', () => {
  const templates = [...make('Outreach', 5), ...make('Interview', 5), { channel: 'WHATSAPP', body: 'Hello' }];
  assert.equal(validateEmailSequences(templates), true);
  assert.equal(getEmailSequences(templates).length, 2);
  assert.equal(selectEmailSequence(templates, 'interview').templates.length, 5);
  assert.equal(selectEmailSequence(templates, 'interview').name, 'Interview');
  assert.throws(() => selectEmailSequence(templates, 'missing'));
});
test('legacy emails stay in Default; names are normalized for limits', () => {
  assert.equal(selectEmailSequence(make(undefined, 3)).name, 'Default');
  assert.throws(() => validateEmailSequences([...make('A', 5), ...make(' a ', 1)]));
  assert.throws(() => validateEmailSequences(make('A', 6)));
  assert.throws(() => validateEmailSequences(make(' ', 1)));
  assert.throws(() => validateEmailSequences([{ ...make('A', 1)[0], subject: '' }]));
});
