# BusTrack HRIS — Progress

## Session startup review
- The previous repository work in this conversation was on `leonard05717/AlexandrosTrans`: the README was updated with general startup rules.
- The repository was previously found to contain only a starter README, with no application implementation confirmed.
- This project request names the application **BusTrack HRIS**. Treat that as the app/project name for the requirements below; repository naming can be confirmed separately if needed.
- `PROGRESS.md` did not exist when checked at the start of this task, so this file is being created as the project memory required by the user.

## Step 1 — Plan
**Status: partial — awaiting user approval.**

### Proposed stack
- Next.js App Router + TypeScript for the mobile-first web app and protected server routes.
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
1. Confirm the proposed stack and plan, or specify React/Vite instead of Next.js.
2. Confirm whether driver/conductor bus and route assignments are admin-managed or selected at shift start.
3. Provide/approve the exact stops and path for both directions (or approve preparing a draft route for review).
4. Confirm payroll periods: “semi-monthly” means 1st–15th and 16th–month-end unless you prefer another schedule.
5. Confirm whether the 9-hour base shift includes breaks, and whether overtime starts strictly after 9 elapsed hours.

**Next step:** Wait for approval of Step 1. Do not initialize the app or create database tables until the plan is approved.
