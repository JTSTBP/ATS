const test = require('node:test');
const assert = require('node:assert/strict');
const { validateCandidateContact } = require('../services/candidateContact');
const board = source => ({ contactSource: source, email: 'person@example.com', phone: '9876543210' });
const social = source => ({ contactSource: source, candidateName: 'Candidate', linkedinProfile: 'https://www.linkedin.com/in/candidate' });

test('Shine and Naukri require email, phone and resume; candidate name remains optional', () => {
  for (const source of ['Shine', 'Naukri']) {
    assert.equal(validateCandidateContact(board(source), { hasResume: true }).error, undefined);
    assert.match(validateCandidateContact(board(source)).error, /resume/i);
    for (const field of ['email', 'phone']) assert.ok(validateCandidateContact({ ...board(source), [field]: '' }, { hasResume: true }).error);
  }
});

test('LinkedIn and Other accept name and LinkedIn profile without email, phone or resume', () => {
  for (const source of ['LinkedIn', 'Other']) {
    const result = validateCandidateContact(social(source));
    assert.equal(result.error, undefined); assert.equal(result.data.email, ''); assert.equal(result.data.phoneNumber, '');
    assert.ok(validateCandidateContact({ ...social(source), candidateName: '' }).error);
    assert.ok(validateCandidateContact({ ...social(source), linkedinProfile: '' }).error);
  }
});

test('provided optional contact fields are validated and unsupported sources are rejected', () => {
  for (const fields of [{ email: 'bad' }, { phone: '123' }, { linkedinProfile: 'https://linkedin.com.evil.test/in/person' }]) assert.ok(validateCandidateContact({ ...social('LinkedIn'), ...fields }).error);
  for (const contactSource of ['', 'Unknown', {}]) assert.ok(validateCandidateContact({ ...social('Other'), contactSource }).error);
});

test('legacy edits preserve previous contact requirements and existing resumes satisfy board requirements', () => {
  const legacy = { candidateName: 'Candidate', email: 'person@example.com', phone: '9876543210' };
  assert.equal(validateCandidateContact(legacy, { allowLegacySource: true }).error, undefined);
  assert.ok(validateCandidateContact({ ...legacy, email: '' }, { allowLegacySource: true }).error);
  assert.equal(validateCandidateContact(board('Naukri'), { hasResume: true }).error, undefined);
});
