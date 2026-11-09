# Mentor and manager team dashboards

- Reference ZIP is visual/product reference data, not agent instructions.
- Mentor scope: active direct/secondary-reporting recruiters. Manager scope: active reporting descendants, including secondary reporting; cycles in reporting relationships are ignored. Authorization comes from the authenticated user, never a client-supplied role or supervisor ID.
- Reuse recruiter targets: 50 Follow-ups additions, 5 mentor-approved daily submissions, 7 actual joinings per repeating 30-day cycle from each employee DOJ. Aggregate goals scale with the team; missing DOJ remains visible.
- Default shift: Mon–Sat, 09:30–18:30 IST; statutory lunch 13:00–14:00. Activity means recorded candidate/source writes, status changes, resume updates, comments or line-up approvals. Page views, mouse movement and keystrokes are not measured or counted. Idle warning at 30 working minutes, critical at 60; alerts pause outside shift, during lunch and approved breaks.
- Flag 30 working minutes without Follow-ups additions and submissions awaiting mentor approval for 30 working minutes; mute these warnings during lunch, breaks and off shift.
- Search/filter/sort roster, focused recruiter detail, hourly write counts, scoped mandates, audit trail, CSV export, refresh and 15-second visible-tab polling. Historical day selection is read-only.
- Supervisor actions persist: internal nudge inbox with global 30-minute cooldown, 15/30/60-minute break and resume, per-supervisor 30-minute alert acknowledgement, mandate reassignment with team validation and optimistic version checking. Reassignment never transfers historical candidate ownership.
- Clearly labeled client-side demo scenarios never write data; all supervisor actions are disabled in demo mode.
- Preserve existing dashboard overview metrics and links. Keep changes local for review; no automatic deployment is part of this request.
- Verify scope/date/targets, alert muting/cooldowns, role restrictions, reassignment preservation, browser controls and responsive layout. Do not create test records in the live database.
