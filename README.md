# BusTrack HRIS

A mobile-first bus tracking and HR attendance/payroll web application. The implementation is being built sequentially; see [PROGRESS.md](./PROGRESS.md) for the authoritative status and [project memory](./memory/PROJECT_MEMORY.md) for durable decisions.

## Current stack

- React + Vite
- Supabase Postgres, Auth, and Realtime
- Leaflet / OpenStreetMap for maps
- Browser Geolocation API
- Lucide icons

## Local development

1. Install Node.js (LTS).
2. Clone this repository and open its root folder.
3. Install dependencies:
   ```bash
   npm install
   ```
4. Copy `.env.example` to `.env.local` and fill in your Supabase project URL and anon/publishable key:
   ```env
   VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
   VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_PUBLISHABLE_OR_ANON_KEY
   ```
5. Run the app:
   ```bash
   npm run dev
   ```
6. Create the database by running `supabase/migrations/001_initial_schema.sql` in the Supabase SQL Editor, then run `supabase/seed.sql`.

**Security:** never put a Supabase service-role key in frontend environment variables or commit real secrets to GitHub.

## Approved route decision

- PITX ↔ MOA South Wing / transport bay.
- City of Dreams/Aseana and DFA/Macapagal are navigation-only waypoints, not passenger stops.
- MOA North Wing is not part of this approved route.
- Exact road geometry and coordinates remain to be verified; the draft must not be treated as official route geometry.

## Current implementation status

The React/Vite scaffold and initial SQL schema are committed. The schema has not yet been run against a live Supabase project, and an npm build has not yet been verified. See [PROGRESS.md](./PROGRESS.md) for next steps.

## Project startup rules

Before doing anything else, review your recent actions in this conversation and the earlier actions stored in memory. Then:

1. Summarize what has been completed so far, in order.
2. Identify the last step finished and any step left partially done.
3. Flag anything missing, conflicting, or unclear in the record.
4. Follow the sequential process from the next incomplete step. Do not redo completed steps unless you find an error.
5. Briefly state where you are resuming and why, then continue.

If the memory or history is incomplete, tell me what's missing and ask before guessing.
