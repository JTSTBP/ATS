# Admin candidate design

The November 5 ZIP and the user's close-up screenshot are the visual references. Candidate cards use Inter body text and Plus Jakarta Sans names, with 48px avatars, 18px names, 13px contact text, a single shaded role summary, right-aligned controls and one footer strip. Sizes follow the reference HTML at native scale; the admin shell's padding is applied only once. Cards adapt to their available width, with stacked footer details on mobile. Forms and source upload use Plus Jakarta Sans throughout, white fields, 13px input text, and 22px page titles.

Candidate presentation reads each job's dynamic field labels case-insensitively, including CTC, notice period, experience and location. Missing values use a dash. AI scores are shown only when supplied by the candidate data; no sample score is inserted. Last action uses the latest update, status-history or comment timestamp.

The paginated candidate API returns statusCounts for all other active filters, before applying the selected status. The selected status still applies to candidate rows and pagination. This keeps the tab counts stable when switching statuses. The response also includes updatedAt for the last-action indicator.

Existing candidate actions remain connected, including conditional joining/selection fields, stage transitions, comments, deletion and resume preview. Pagination supports 10, 25 or 50 rows.

Save as Draft stores fields in sessionStorage under the current user and candidate ID. Restore Draft is explicit. Drafts last for the browser tab session; newly selected resume files must be reattached. Successful submission clears the draft. Drafts do not create backend candidate records.

Verification commands:

- Frontend: `node --test tests/candidatePresentation.test.cjs`
- Backend: `node --test tests/candidateStatusCounts.test.js tests/candidateSourceRoutes.test.js`
- Frontend: `npm run build`
- Browser checks with intercepted test data covered layouts, type sizes, editing/comments, drafts and 320/768/1024/1440px overflow. Finance regression scripts and their run instructions are in `tests/browser/`.

The live read-only candidate API was checked for total/count consistency and updatedAt. Live uploads and database mutations were not exercised. The repository-wide TypeScript check continues to report errors across existing modules.

Finance candidate forms select a client before a job role. Roles are filtered by client and display Active (Open/Active) or Inactive with their original Closed/On Hold status. Changing client clears the previous job and its fields, keeps personal notes, and requires a role if a client is selected. Editing restores the existing client and role. Browser checks cover these cases and mobile overflow.
