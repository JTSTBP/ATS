# Recruiter dashboard targets

- Reference: stitch_recruiter_performance_target_dashboard.zip (visual reference only).
- Employee DOJ (`dateOfJoining`, falling back to `joinDate`) anchors consecutive 30-day cycles; target is 7 Joined candidates whose actual joining date falls in that cycle. No candidate retention waiting period.
- Daily IST target: 5 line-ups submitted that day and explicitly approved by an assigned/team mentor. Pending/rejected submissions do not count. Reviews are final and atomic.
- Daily sourcing target: 50 nonduplicate candidate additions through Follow-ups, deduplicated by candidate ID. Creation activity preserves sourcing credit after conversion.
- No fabricated forecasts, probabilities, BGV, notifications or AI confidence. Pace projection is explicitly arithmetic, with live offers, follow-ups and joining tracker.
- Missing employee DOJ displays a setup message; never silently substitutes account creation date.
- Dashboard refreshes on visibility and every minute. Existing candidate, requirement, follow-up and reports pages remain accessible.
- Deployment is authorized only after explicit user approval; user authorized publishing the latest changes on 9 November 2026.

Validation: pure date/count tests, authenticated route scoping/approval tests, focused frontend lint, production build, browser fixture checks. No production records modified for validation.
