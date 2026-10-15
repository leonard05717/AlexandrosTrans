# BusTrack HRIS — Progress

## Session startup review
- The previous repository work in this conversation was on `leonard05717/AlexandrosTrans`: the README was updated with general startup rules.
- The repository was previously found to contain only a starter README, with no application implementation confirmed.
- This project request names the application **BusTrack HRIS**. Treat that as the app/project name for the requirements below; repository naming can be confirmed separately if needed.
- `PROGRESS.md` did not exist when checked at the start of this task, so this file is being created as the project memory required by the user.

## Step 1 — Plan
**Status: done — stack and operating choices approved on 2026-10-15. Route draft prepared for review before Step 2.**

### Approved decisions
- Stack: React + Vite.
- Bus assignment: admin assigns buses and routes to drivers/conductors.
- Payroll periods: 1st–15th and 16th–last day of each month.
- Overtime basis: elapsed time from shift start to shift end; overtime begins after 9 hours.
- Route plan: prepare a draft PITX ↔ MOA stop list/path for review.
- Other approved direction: Supabase Postgres/Auth/Realtime, Leaflet/OpenStreetMap, mobile-first geolocation, and role-based access remain the proposed implementation choices.

### Draft route proposal — NOT YET APPROVED
Official PITX route information lists MOA service via a modern jeepney route, and route references for PITX-to-MOA mention the City of Dreams/DFA/MOA corridor. The exact operator path and stop sequence for this app have not been confirmed. Treat the following as a reviewable product draft, not an official transit schedule or verified route geometry.

**PITX → MOA (draft ordered waypoints)**
1. PITX terminal (start)
2. City of Dreams / Aseana area (candidate waypoint)
3. DFA / Macapagal Boulevard area (candidate waypoint)
4. SMX Convention Center / MOA complex (candidate waypoint)
5. MOA South Wing / transport bay (candidate endpoint)
6. MOA North Wing / designated MOA pickup point (candidate endpoint, if this is the intended service endpoint)

**MOA → PITX:** reverse the approved waypoint order, using the actual safe/legal return-road geometry and designated pickup/drop-off bays.

**Route implementation notes**
- These are draft landmarks, not confirmed official stops. Some are alternatives/endpoints rather than stops that a bus must serve.
- Use actual road-following polyline geometry (not straight lines between pins) once the exact route is approved.
- Confirm whether the bus should terminate at one MOA bay or serve multiple MOA stops, and whether City of Dreams and DFA are actual passenger stops or only navigation waypoints.
- Source references: PITX official transport guide https://pitx.ph/passengers-guide/transport/ and PITX routes guide https://pitx.ph/routes-guide/. These establish PITX–MOA service context but do not confirm the complete stop sequence proposed above.

### Approved stack
- React + Vite for the mobile-first web app. Use Supabase Auth/Database policies and server-side/Edge Function checks where privileged operations are needed.
- Supabase Postgres, Auth, and Realtime for data and authentication.
- Leaflet + OpenStreetMap for passenger and admin maps.
- Browser Geolocation API for driver/conductor/inspector location sharing.
- Supabase Row Level Security (RLS) and server-side role checks for authorization.

### Proposed folder structure
```
app/
  (public)/page.tsx                 # Passenger route/map dashboard
  (auth)/login/page.tsx             # Staff login
  (staff)/shift/page.tsx            # Driver/conductor/inspector shift controls
  (admin)/dashboard/page.tsx        # Admin live map and on-duty list
  (admin)/history/page.tsx          # Activity search and trail replay
  (admin)/payroll/page.tsx          # Payroll summaries and CSV export
  (admin)/settings/page.tsx         # Editable payroll rates and system settings
  api/                              # Server-side endpoints where needed
components/
  maps/
  auth/
  shifts/
  payroll/
  ui/
lib/
  supabase/
  auth/
  payroll/
  routes/
types/
supabase/
  migrations/
  seed.sql
public/
PROGRESS.md
memory/
  PROJECT_MEMORY.md
```

### Proposed database schema
- **profiles**: `id` (matches Supabase Auth user UUID), `full_name`, `role` (driver/conductor/inspector/admin), `active`, timestamps.
- **buses**: `id`, `bus_code`, `plate_number`, `active`, timestamps.
- **routes**: `id`, `route_code`, `name`, `direction`, `stops`/route geometry (prefer normalized route_stops below), `active`.
- **route_stops**: `id`, `route_id`, `stop_name`, `latitude`, `longitude`, `stop_order`.
- **shifts**: `id`, `user_id`, `role_snapshot`, `bus_id`, `route_id`, `started_at`, `ended_at`, `start_latitude`, `start_longitude`, `end_latitude`, `end_longitude`, timestamps.
- **location_pings**: `id`, `shift_id`, `user_id`, `bus_id`, `route_id`, `latitude`, `longitude`, `recorded_at`, optional `accuracy_meters`. Store pings only during an active shift.
- **payroll_records**: `id`, `user_id`, `shift_id`, `regular_hours`, `overtime_minutes`, `base_pay_php`, `overtime_pay_php`, `total_pay_php`, `rate_snapshot`, `period_start`, `period_end`, `created_at`.
- **settings**: `key`, `value` (JSON), `updated_by`, `updated_at`; editable only by admin.
- **audit_logs** (recommended): `id`, `actor_user_id`, `action`, `entity_type`, `entity_id`, `details` (JSON), `created_at`, for sensitive admin changes.

### Security and behavior decisions proposed
- Passenger dashboard is public and does not require login; do not collect passenger personal data.
- Only authenticated staff can submit location pings, and only for their own active shift. Admin can read operational records and edit settings.
- Driver/conductor accounts associate with a bus; inspector selects one of the two route directions when starting a shift. Confirm whether drivers/conductors also need to select a bus/route at shift start or have assignments made by admin.
- Send GPS pings every 5–10 seconds during an active shift, with visible handling for permission denied, inaccurate GPS, and offline/retry states.
- Use database/server timestamps for shift start/end. Payroll uses elapsed time; overtime minutes are prorated at the configured overtime rate.
- Default payroll settings: base pay PHP 700 for a 9-hour shift; overtime PHP 86/hour after 9 hours. Store rates in settings and snapshot the applied rates on each payroll record.
- Default passenger routes: PITX → MOA and MOA → PITX. Exact stop list and route geometry need confirmation or a source to avoid inventing the route.

### Open questions to resolve before Step 2
1. Review and approve/correct the draft PITX ↔ MOA stops and endpoint choice above.
2. Confirm whether the route should include both MOA South Wing and North Wing or use only one designated terminal/bay.
3. Confirm whether City of Dreams and DFA are passenger stops or navigation-only waypoints.
4. Exact road geometry and live ETA remain unverified until the route is approved and encoded.

**Next step:** Step 1 decisions are approved, but Step 2 is blocked pending review of the draft route endpoints/stop sequence. Do not initialize the app or create database tables until those route details are confirmed.
