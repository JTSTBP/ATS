const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizeLinkedinProfile } = require('../services/candidateLinkedin');

test('candidate LinkedIn is optional and normalizes a valid profile URL', () => {
  assert.equal(normalizeLinkedinProfile(undefined), '');
  assert.equal(normalizeLinkedinProfile(''), '');
  assert.equal(normalizeLinkedinProfile(' https://www.linkedin.com/in/candidate '), 'https://www.linkedin.com/in/candidate');
});

test('candidate LinkedIn rejects unsafe links and lookalike domains', () => {
  for (const value of ['javascript:alert(1)', 'https://linkedin.com.evil.test/in/person', 'https://user:password@linkedin.com/in/person', 'http://linkedin.com/in/person', {}, 'https://linkedin.com:8443/in/person']) {
    assert.equal(normalizeLinkedinProfile(value), null);
  }
});
