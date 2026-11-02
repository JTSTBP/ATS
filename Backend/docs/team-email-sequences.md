# Mentor and manager email sequences

Mentors and managers use **Follow-ups → Team email sequences** to select a client and position,
choose or create a sequence template, select contacts, and queue the batch. Templates
are reusable per client and contain one to five email steps. Existing named requirement
sequences are also offered for the team's open requirements. The existing daytime
schedule sends at most one step per sequence per day.

## Ownership and permissions

- Recruiters add contacts and connect their own mailbox through their profile or Emails tab.
- A mentor's team includes direct and secondary recruiter reportees. A manager's team also
  includes recruiters reporting to their active direct/secondary mentors. Unrelated teams
  cannot start or stop each other's sequences. Admin and Finance cannot initiate batches.
- Email matching trims surrounding whitespace and ignores case. Within a client, the
  earliest contact creation date/time owns the address across all requirements. Record ID
  breaks exact timestamp ties. Source-to-lineup conversion preserves the original date
  for new conversions. Legacy converted records without an original timestamp hold the
  address for review rather than guessing ownership; native lineup records use their
  recorded creation date.
- The earliest owner is checked across the entire client, even if outside the actor's
  team. An address owned outside the team is skipped without exposing that owner's details.
- If the earliest recruiter is disabled or has no usable Microsoft 365 connection with
  Mail.Read consent, skip the contact. A later duplicate never takes over the address.
- Recruiter credentials stay on the server. Each message uses the owning recruiter's
  current mailbox and profile signature; `initiatedBy` records the mentor/manager actor.

## Duplicate prevention and failures

`ClientEmailDispatch` has a unique `(clientId, email)` index. It is the permanent claim
for that client/address, so repeated clicks, simultaneous batches, and overlapping team
access cannot enroll it again. Completion, stop, suppression and reply detection do not
remove the claim. A different client can enroll the address separately. Historical sent
emails and currently scheduled/pending messages for the client's requirements also block
enrollment, including emails created before this feature.

The preview is recalculated at submission; submitted recipients and sender IDs are never
trusted. A batch accepts up to 500 contact IDs and returns a result for every selected
contact. The preview supports clients with up to 10,000 combined contact records and
fails explicitly above that limit rather than deduplicating an incomplete set.

All steps are saved as generated before publishing them to the worker. The worker requires
a matching queued dispatch and checks suppression and replies before each send. A failed
or interrupted preparation retains its claim and holds unsent steps. Administrators must
investigate these records before making any manual repair; automatic retries never create
a second sequence. Stop affects unsent steps; messages already submitted cannot be recalled.

## Transition and setup

Old candidate-level email Send and Start endpoints reject new sends and direct users to
the team screen. On its next run the worker holds legacy sequences without a client
dispatch using `team_email_approval_required`; it preserves sent history. Contacts without
previous sends can then be selected from the team screen after the worker has held those
legacy steps. Existing unsubscribe links, shared suppression and reply-stop rules remain.

Configure the existing Microsoft application, stable JWT secret, public HTTPS backend URL
and token encryption key as described in [microsoft-email.md](microsoft-email.md). Ensure
the ClientEmailDispatch unique indexes exist before enabling batch starts (the start route
waits for model initialization). No production email batch or data migration is run as
part of implementing or testing this feature.

Verification: `node --test tests/*.test.js` from Backend; `npm run build` and
`npm run typecheck` from Frontend. Browser checks use intercepted test responses, never
real recipient addresses or mailbox credentials.

Unsubscribe URLs prefer `PUBLIC_BASE_URL` or `BACKEND_PUBLIC_URL`. When both are absent,
the server uses the origin of the configured `MICROSOFT_REDIRECT_URI`, provided it points
to `/api/microsoft-mail/callback`. HTTPS and the signing secret are still required;
the frontend URL is never used as an implicit backend address.

## Position selection

A position is required before selecting contacts or starting a batch. The preview only
shows contacts from that position, and requirement-specific templates belong to the
selected position. Saved client-level templates can be reused for a selected position.
The server validates that the position is open and accessible in the selected client,
and rejects a batch containing any contact from another position before queuing emails.
Changing the client or position clears recipient and template selections. Ownership and
previous-contact checks still run across all positions for the client; filtering the
preview never gives a later duplicate ownership of an email address.
