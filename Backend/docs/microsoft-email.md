# Microsoft follow-up email setup

The Profile screen and Follow-ups → Emails screen contain **Connect Outlook / Microsoft 365**.
Direct messages and scheduled sequences use Microsoft Graph after connection. Gmail and other
existing SMTP accounts continue to use their saved app passwords.

## One-time administrator setup

1. Create an application in Microsoft Entra **App registrations**. For both work accounts and
   personal Outlook/Hotmail accounts, choose **Accounts in any organizational directory and
   personal Microsoft accounts**. Use `common` for the tenant setting below.
2. Add a **Web** platform redirect URI matching the backend callback exactly, for example
   `http://localhost:5000/api/microsoft-mail/callback`. Substitute your actual backend port.
   Production must use HTTPS. Do not register this as a single-page application redirect.
3. Add delegated Microsoft Graph permissions **User.Read**, **Mail.Send**, and **Mail.Read**. The sign-in flow
   also requests **offline_access** so scheduled messages can send without another login.
   Some organizations require an administrator to grant consent.
4. Create a client secret and put its **value**, not its ID, in the backend environment.
5. Generate a separate token encryption key:

   ```sh
   node -e "process.stdout.write(require('crypto').randomBytes(32).toString('base64'))"
   ```

6. Configure these environment variables on the backend:

   ```dotenv
   MICROSOFT_CLIENT_ID=<application-client-id>
   MICROSOFT_CLIENT_SECRET=<client-secret-value>
   MICROSOFT_TENANT_ID=common
   MICROSOFT_REDIRECT_URI=https://your-backend.example/api/microsoft-mail/callback
   MICROSOFT_TOKEN_ENCRYPTION_KEY=<32-byte-base64-key>
   FRONTEND_URL=https://your-frontend.example
   PUBLIC_BASE_URL=https://your-backend.example
   ```

   For local development, localhost HTTP URLs are allowed. `FRONTEND_URL` must match the
   frontend's origin exactly, including port. Keep the encryption key stable across deployments
   and identical across workers/servers; changing it requires users to connect again. Never put
   these secrets into frontend `VITE_` variables or commit them to Git.
7. Restart the backend. Sign in to ATS, open Profile or Follow-ups → Emails, click **Connect**,
   and sign in using the Microsoft mailbox matching the ATS user's saved email address.

## Named sequences, replies and suppression

- Create multiple named sequences in the requirement editor. Each name groups at most five
  email steps, in their displayed order. Existing templates belong to **Default**. If a legacy
  requirement contains more than five emails, give the additional emails a different sequence
  name before saving. WhatsApp templates remain separate direct messages.
- In Follow-ups → Emails, select a candidate and sequence, then start it. A candidate email
  can have only one active sequence per recruiter mailbox, including across requirements.
  Existing daytime scheduling remains in effect (one step per sequence per day).
- New automatic sequences require the matching Microsoft mailbox with delegated **Mail.Read**.
  Existing users must **Reconnect** and approve the new permission; an Entra administrator may
  need to grant tenant consent. The app does not grant permissions in your tenant itself.
- Reply detection polls Graph and checks again before each follow-up. It matches the candidate
  response against the sequence's Sent Items conversation or message references. Any incoming
  response in that thread, including automatic/out-of-office replies or replies from another
  address, stops remaining steps. Unrelated emails and the recruiter's own sent copies do not.
  Only identifiers, sender/recipient and
  headers are read; message bodies are not fetched or stored. Retain the sequence messages in
  Sent Items. Missing correlation, denied consent, and failed checks hold follow-ups and show
  a check error. Replies received after the last check or a send already in progress cannot
  retract that send. Legacy scheduled sequences continue their existing behavior; stop and
  restart them as a named sequence to enable reply detection.
- The shared suppression list blocks addresses across all recruiters and requirements,
  including direct candidate emails. Recruiters can record declined, unsubscribed, bounced
  or manually blocked addresses. Only Admin can remove a suppression. Removal never restarts
  stopped email steps. Bounce handling is manual; delivery acceptance is not delivery proof.
- Each new sequence email includes a signed unsubscribe link. **PUBLIC_BASE_URL** must be the
  publicly reachable HTTPS backend origin; **JWT_SECRET** must be set and stable. The link's
  GET displays confirmation and only POST adds the suppression, avoiding email-link scanners
  unsubscribing candidates. Links expire after 180 days; candidates can still ask the sender
  to record their unsubscribe. No production DNS or environment settings are changed by this code.
- Admin's Follow-ups report includes email-step totals (sent/queued/pending/failed/stopped),
  latest 100 steps, reply/check/stop reasons, and latest 200 shared suppressions. It uses date
  and recruiter filters; the candidate report retains its requirement/client/mentor filters.
- These are additive Mongoose fields and two new collections, EmailSuppression and
  EmailEnrollment. Ensure their unique indexes (email and key) are created in production
  before enabling sequences. No historical messages or templates are deleted by deployment.

Graph reference: https://learn.microsoft.com/en-us/graph/api/user-list-messages
and https://learn.microsoft.com/en-us/graph/api/resources/message

## Behavior

- A connected Microsoft account uses its own mailbox through Graph, including scheduled emails.
- Microsoft refresh tokens are encrypted in the user record, excluded from normal user queries,
  and never sent to the frontend. Access tokens remain in memory only for the sending request.
- Sign-in uses PKCE and a single-use state that expires after ten minutes.
- Connecting a different mailbox is rejected. An ATS profile email change requires reconnection.
- Disconnecting removes stored Microsoft credentials. Pending sequences need a valid connection
  when their next message sends; the app does not silently use the server's email account.
- A Graph `202 Accepted` response means Microsoft accepted the message, not confirmed delivery.
- This feature does not change the email behavior of invoices or other non-follow-up modules.

## Verification

Run `node --test tests/microsoftMail.test.js` from `Backend`. Tests mock Microsoft and the database;
they do not send live emails. After configuration, connect an account and send one follow-up to
an address you control to check actual delivery and the sender address.

References: [Microsoft authorization code flow](https://learn.microsoft.com/en-us/entra/identity-platform/v2-oauth2-auth-code-flow),
[Graph sendMail](https://learn.microsoft.com/en-us/graph/api/user-sendmail?view=graph-rest-1.0).

## Follow-up sequence timing

Each sequence sends at most one email per IST calendar day. The first email sends immediately when started between 9 AM and 8:15 PM; otherwise it starts at a varied daytime on the next eligible date. Later steps use different times between 9 AM and 8:15 PM IST, on consecutive calendar days. Dates are saved on drafts, so refreshing does not change the timetable. The worker does not start sends at or after 8:30 PM IST and defers additional overdue steps to following days. Legacy EMAIL_SEQUENCE_INTERVAL_MINUTES is no longer used. A sleeping server can delay processing until it resumes. Varying times does not guarantee inbox placement. New named sequences use Microsoft Graph polling with Mail.Read consent for reply tracking; opt-outs use signed confirmation links and the shared suppression list. Polling runs about once a minute while the server is running, with another check before each follow-up.
