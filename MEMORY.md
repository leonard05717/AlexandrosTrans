# MEMORY

## Project Overview
- AlexandrosTrans is a React/Vite time-attendance prototype.
- Attendance records are currently stored in browser LocalStorage.
- GPS is captured only on Time In and Time Out.
- Work weeks run from Saturday through Friday.
- Supabase/PostgreSQL schema is prepared for production migration.

## Conventions
- React components use `.jsx`.
- Reusable attendance/location logic lives under `src/services/`.
- Work-week calculations live under `src/utils/`.
- Supabase database definitions live under `supabase/`.
- Lint with oxlint; build with Vite.

## Completed Tasks
- [x] 2026-09-30: Created the initial AlexandrosTrans time-attendance UI and GPS/weekly-report prototype.
- [x] 2026-09-30: Added production-oriented Supabase attendance schema.
- [x] 2026-09-30: Added responsive styling and project documentation.
- [x] 2026-09-30: Uploaded the requested Time In/Time Out, GPS map, Saturday-to-Friday report, GPS audit trail, services, utility, and schema code.

## Latest Task
- Task: Upload the online Time In/Time Out system design and code.
- Status: Completed
- Files touched: `src/App.jsx`, `src/App.css`, `src/index.css`, `src/services/attendanceService.js`, `src/services/locationService.js`, `src/utils/weeklyPeriod.js`, `supabase/schema.sql`, `README.md`, `MEMORY.md`
- Next step: Run `npm install`, `npm run lint`, and `npm run build` in a local checkout, then connect Supabase Auth/database for production use.

## Pending / Backlog
- [ ] Connect Supabase Auth.
- [ ] Replace LocalStorage attendance persistence with Supabase.
- [ ] Add HR/Admin employee-wide dashboard.
- [ ] Add production Row Level Security policies.
- [ ] Add report export (CSV/PDF).

## Known Issues / Notes
- GPS requires HTTPS or localhost and user permission.
- The OpenStreetMap iframe is suitable for this prototype; advanced production maps may use Leaflet, Mapbox, or Google Maps.
- The prototype does not continuously track employees.
