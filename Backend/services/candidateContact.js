const { normalizeLinkedinProfile } = require('./candidateLinkedin');
const sources = ['Shine', 'Naukri', 'LinkedIn', 'Other'];

function validateCandidateContact(body = {}, { hasResume = false, allowLegacySource = false } = {}) {
  if (body.contactSource != null && typeof body.contactSource !== 'string') return { error: 'Select a valid candidate source' };
  const contactSource = body.contactSource || null;
  if ((!contactSource && !allowLegacySource) || (contactSource && !sources.includes(contactSource))) return { error: 'Select a valid candidate source' };
  for (const field of ['candidateName', 'email', 'phone']) if (body[field] != null && typeof body[field] !== 'string') return { error: 'Candidate contact fields must be text' };
  const name = (body.candidateName || '').trim();
  const email = (body.email || '').trim();
  const phoneNumber = (body.phone || '').trim();
  const linkedinProfile = normalizeLinkedinProfile(body.linkedinProfile ?? '');
  const jobBoard = ['Shine', 'Naukri'].includes(contactSource);
  const social = ['LinkedIn', 'Other'].includes(contactSource);
  if ((social || !contactSource) && !name) return { error: 'Candidate name is required' };
  if ((jobBoard || !contactSource) && (!email || !phoneNumber)) return { error: 'Email and phone number are required for this source' };
  if (jobBoard && !hasResume) return { error: 'CV/resume is required for Shine and Naukri candidates' };
  if (social && !linkedinProfile) return { error: 'A valid LinkedIn profile link is required for LinkedIn and Other candidates' };
  if (linkedinProfile === null) return { error: 'Enter a valid HTTPS LinkedIn profile link' };
  if (email && !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email)) return { error: 'Invalid candidate email' };
  if (phoneNumber && !/^\d{10,15}$/.test(phoneNumber.replace(/\D/g, ''))) return { error: 'Enter a valid phone number' };
  return { data: { name, email, phoneNumber, linkedinProfile, contactSource } };
}
module.exports = { validateCandidateContact };
