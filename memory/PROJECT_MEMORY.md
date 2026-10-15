# BusTrack HRIS — Project Memory

This folder stores durable project notes. The authoritative step-by-step checklist and latest status live in the root `PROGRESS.md`.

## Memory rules
1. Keep `PROGRESS.md` in the project root as project memory.
2. At the start of each session, read `PROGRESS.md` and review recent actions before doing anything else.
3. Summarize what is done, partially done, and next.
4. Resume from the next incomplete step; do not redo completed work unless fixing a bug.
5. After each step, update `PROGRESS.md` with step number, status (done / partial / blocked), files changed, decisions made, and open issues.
6. If `PROGRESS.md` is missing or unclear, say so and ask before guessing.

## Product
**BusTrack HRIS** is a real-time bus tracking system for passengers plus an HRIS for attendance and payroll for the admin/owner.

### Roles
- Driver and conductor: sign in and share the bus's live GPS location during a shift.
- Inspector: sign in, select PITX → MOA or MOA → PITX, and share live GPS location.
- Admin/owner: sign in to a dashboard with a live map of buses and inspectors.
- Passenger: no login; select a route and view buses in real time, with ETA if feasible.

### History and payroll
- Record each shift's user, role, bus, route, start/end times, and location trail.
- Search activity by date, person, bus, and route.
- Inspector payroll defaults: PHP 700 for a 9-hour shift; PHP 86/hour overtime beyond 9 hours, prorated by the minute. Formula: total = 700 + (overtime_hours × 86).
- Admin can edit rates in settings, see daily/weekly/semi-monthly summaries, and export CSV.

### Selected technology
React + Vite; Supabase Postgres/Auth/Realtime; Leaflet with OpenStreetMap; browser Geolocation API; role-based access control.

### Required implementation sequence
1. Plan: confirm stack, folder structure, and schema; show plan for approval.
2. Setup: initialize project, environment variables, and database tables.
3. Auth and roles: driver/conductor/inspector/admin login and protected routes.
4. Routes: seed PITX → MOA and MOA → PITX with stops and path.
5. Shift start/end: record start/end time, role, bus, route.
6. Live location: GPS pings every 5–10 seconds on shift; handle denied/offline states.
7. Passenger dashboard: live map filtered by route/direction.
8. Admin dashboard: live map and on-duty list.
9. History: filters and location trail replay.
10. Payroll: base/overtime calculations, editable rates, summaries, CSV.
11. Testing: all roles; exactly 9h, 9h 30m, and 11h payroll cases; GPS failures.
12. Polish/deploy: mobile responsiveness, security review, deployment instructions.

No application implementation has been confirmed yet. Do not claim features are built until code and tests verify them.


## Approved decisions (2026-10-15)
- Stack selected: React + Vite.
- Admin assigns buses and routes to drivers/conductors.
- Payroll periods: 1st–15th and 16th–last day of each month.
- Overtime is calculated from elapsed shift time, starting after 9 hours.
- Approved route: PITX ↔ MOA, with MOA South Wing / transport bay as the sole MOA endpoint. City of Dreams/Aseana and DFA/Macapagal are navigation-only waypoints, not passenger stops. Exact road geometry still requires verification.

## Current status
- Step 1 plan choices are approved.
- Route decision confirmed on 2026-10-15: MOA South Wing only; City of Dreams/Aseana and DFA/Macapagal are navigation-only waypoints; no MOA North Wing endpoint.
- Step 2 is now in progress. Exact legal road geometry is still unverified; do not represent it as official or calculate dependable ETA until verified.
