const normalizeEmail = value => String(value || '').trim().toLowerCase();
const id = value => String(value?._id || value || '');

function selectClientContacts({ contacts, teamIds, mailboxErrors, suppressed, contacted }) {
  const team = new Set(teamIds.map(id));
  const owners = new Map();
  const uncertainEmails = new Set(contacts.filter(contact => contact.uncertainDate || !contact.createdAt || !Number.isFinite(new Date(contact.createdAt).getTime())).map(contact => normalizeEmail(contact.email)));
  const ordered = [...contacts].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt) || id(a._id).localeCompare(id(b._id)));
  for (const contact of ordered) {
    const email = normalizeEmail(contact.email);
    if (email && !owners.has(email)) owners.set(email, contact);
  }
  return contacts.filter(contact => team.has(id(contact.recruiterId))).map(contact => {
    const email = normalizeEmail(contact.email);
    const owner = owners.get(email);
    let reason = '';
    if (!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email)) reason = 'Invalid or missing email';
    else if (uncertainEmails.has(email)) reason = 'Original contact creation time needs review';
    else if (!team.has(id(owner.recruiterId))) reason = 'Earliest contact belongs outside your team';
    else if (id(owner._id) !== id(contact._id)) reason = 'Duplicate email — an earlier contact owns this address';
    else if (contact.closed) reason = 'Requirement is closed';
    else if (contacted.has(email)) reason = 'Already enrolled or contacted for this client';
    else if (suppressed.has(email)) reason = 'Email is suppressed';
    else reason = mailboxErrors.get(id(contact.recruiterId)) || '';
    return { candidateId: id(contact._id), requirementId: id(contact.requirementId), name: contact.name || 'Unnamed contact', email, recruiterId: id(contact.recruiterId), createdAt: contact.createdAt, eligible: !reason, reason };
  });
}

module.exports = { selectClientContacts, normalizeEmail, id };
