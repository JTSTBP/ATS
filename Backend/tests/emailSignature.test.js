const test = require('node:test');
const assert = require('node:assert/strict');
const { withProfileSignature } = require('../services/emailSignature');

test('adds profile details to HTML and plain text without exposing other profile fields', () => {
  const result = withProfileSignature({ text: 'Hello', html: '<p>Hello</p>' }, { name: 'Jane & Co', email: 'jane@example.com', phone: '+91 9876543210', whatsappLink: 'https://wa.me/919876543210', linkedinLink: 'https://www.linkedin.com/in/jane', dateOfBirth: 'private', appPassword: 'secret' });
  assert.match(result.html, /Jane &amp; Co/);
  assert.match(result.html, /href="https:\/\/wa.me\/919876543210"/);
  assert.match(result.text, /jane@example.com\n\+91 9876543210/);
  assert.match(result.text, /LinkedIn: https:\/\/www.linkedin.com\/in\/jane/);
  assert.doesNotMatch(result.html + result.text, /private|secret|undefined/);
});

test('omits missing fields and unsafe links and escapes HTML', () => {
  const result = withProfileSignature({ text: 'Hello' }, { name: '<img src=x>', email: 'jane@example.com', phoneNumber: { official: '1234567' }, whatsappLink: 'javascript:alert(1)', linkedinLink: 'https://evil.test' });
  assert.match(result.html, /&lt;img src=x&gt;/);
  assert.match(result.text, /1234567/);
  assert.doesNotMatch(result.html, /<img|javascript:|evil.test|WhatsApp|LinkedIn/);
});

test('replaces built-in template footer and previously generated signatures', () => {
  const user = { name: 'Jane', email: 'jane@example.com' };
  const message = { text: 'Hello\n\nRegards,\nOld Name\nJobs Territory Recruitment Team', html: '<p>Hello</p><p style="color:gray">Regards,<br/><strong>Old Name</strong><br/><span>Jobs Territory Recruitment Team</span></p>' };
  const once = withProfileSignature(message, user);
  const twice = withProfileSignature(once, { ...user, name: 'Updated Name' });
  assert.equal((twice.html.match(/data-ats-signature/g) || []).length, 1);
  assert.doesNotMatch(twice.html + twice.text, /Old Name|Jobs Territory Recruitment Team|\nJane\n/);
  assert.match(twice.text, /Updated Name/);
});
