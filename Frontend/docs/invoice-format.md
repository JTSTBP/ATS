# Invoice format

Invoice previews, PDF downloads and email attachments use `Backend/utils/pdfGenerator.js` as the single renderer. The live Finance preview embeds the generated PDF instead of maintaining a separate HTML invoice layout.

The format follows the supplied invoice: A4, Helvetica, the boxed invoice/address header, six-column candidate table, existing GST totals and rounding, amount in words, bank details, Sarun sign-off, Note box and address/website footer. The user-supplied logo and signature/stamp are embedded from `Backend/assets/invoice/`, using repository-relative paths. The logo fits above the invoice header and the signature sits beside the bank details. The reference PDF itself is not stored in the repository.

The preview waits 400ms after input settles, cancels stale requests, releases browser object URLs and offers Retry when generation fails. Preview requests use unique temporary filenames and clean up generated files when the response closes, including cancelled requests. Preview generation does not save invoice records or send emails.

Validation:

- From Backend: `node --test tests/invoiceFormat.test.js`
- From Frontend: run the Finance browser checks in `tests/browser/README.md`, then `npm run build`.
- The base layout was verified against the reference PDF. The supplied logo and signature/stamp are added without changing invoice fields or totals.
