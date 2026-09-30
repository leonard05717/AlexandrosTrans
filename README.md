## Session Start Rules (MANDATORY)

Before doing ANY work, follow these steps in order:

1. **Read `MEMORY.md` first.**
2. **Read `README.md`.**
3. **Review the work log / task history.**
4. **Check recent git history and actual project state.**
5. **Summarize before starting when a task is ambiguous.**

## Project

AlexandrosTrans time attendance prototype.

### Current stack
- React 19
- Vite 8
- Browser Geolocation API
- OpenStreetMap embedded map
- LocalStorage prototype persistence
- Supabase/PostgreSQL schema prepared in `supabase/schema.sql`

### Features
- Time In and Time Out buttons
- GPS capture at each attendance action
- GPS map showing the latest attendance location
- Saturday-to-Friday weekly period
- Days worked and total hours report
- GPS audit trail
- Responsive desktop/mobile layout

### Run locally

```bash
npm install
npm run dev
```

### Production next steps

1. Add Supabase Auth.
2. Replace LocalStorage with Supabase attendance inserts/updates.
3. Apply Row Level Security policies based on authenticated employee IDs.
4. Store employee profiles in `employees`.
5. Add an HR/Admin dashboard for all employees.
6. Add server-side weekly report queries.
7. Consider a production map provider if advanced markers/geocoding are required.

### Privacy

The prototype records GPS only when the employee presses Time In or Time Out. It does not continuously track location.
