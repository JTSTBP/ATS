# Manual candidate sources

Add Candidate offers Shine, Naukri, LinkedIn and Other. The form and API use the same rules:

| Source | Required fields |
| --- | --- |
| Shine / Naukri | Email, phone number, CV/resume |
| LinkedIn / Other | Candidate name, LinkedIn profile |

Remaining fields are optional; any provided email, phone or LinkedIn URL must be valid.
The source is stored as `contactSource` without replacing the existing upload-origin
`sourceType`. Source metadata is retained when converting a sourced profile to lineup.
Existing candidates are not relabelled automatically. Legacy edits retain the previous
name/email/phone requirements until a source is chosen; new sourced profiles keep their
source-specific validation on edit. An existing resume satisfies the resume requirement.

LinkedIn/Other profiles without an email can be saved but remain ineligible for email
sequences until an address is added. Removing or changing an email stops unsent messages
instead of redirecting an existing sequence to an unchecked address. Sent and in-flight
messages retain their original recipient.
