alter table public.shifts
  add column if not exists conductor_name text,
  add column if not exists conductor_email text;

comment on column public.shifts.conductor_name is 'Conductor name entered by the driver when starting a shift.';
comment on column public.shifts.conductor_email is 'Conductor email entered by the driver when starting a shift.';
