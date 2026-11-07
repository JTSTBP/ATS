# Finance browser regression checks

Start the frontend on `http://127.0.0.1:5173`. From `Frontend`, run:

```text
npx @playwright/cli -s=finance-check open http://127.0.0.1:5173
npx @playwright/cli -s=finance-check run-code --filename tests/browser/finance-invoice-candidates.js
npx @playwright/cli -s=finance-check run-code --filename tests/browser/finance-client-job-selection.js
npx @playwright/cli -s=finance-check close
```

Use this dedicated browser session: the scripts intercept API requests and seed sample sign-in data in that session. They do not create live candidates or invoices. Screenshots are written to `output/`.

The invoice check covers new candidate visibility, candidate-name variants, refreshing after returning from another tab, keeping invoice entries, preview names and adding rows. The client/job check covers client-first selection, per-client role filtering, Active/Inactive labels, clearing a stale role when changing clients, preserving notes and restoring an existing candidate's selections.
