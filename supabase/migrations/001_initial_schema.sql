create extension if not exists pgcrypto;

create type public.staff_role as enum ('driver', 'conductor', 'inspector', 'admin');
create type public.route_direction as enum ('pitx_to_moa', 'moa_to_pitx');

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role public.staff_role not null default 'inspector',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.buses (
  id uuid primary key default gen_random_uuid(),
  bus_code text not null unique,
  plate_number text unique,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.routes (
  id uuid primary key default gen_random_uuid(),
  route_code text not null unique,
  name text not null,
  direction public.route_direction not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.route_stops (
  id uuid primary key default gen_random_uuid(),
  route_id uuid not null references public.routes(id) on delete cascade,
  stop_name text not null,
  latitude double precision,
  longitude double precision,
  stop_order integer not null,
  is_passenger_stop boolean not null default true,
  waypoint_type text not null default 'stop' check (waypoint_type in ('stop', 'navigation_waypoint', 'terminal')),
  created_at timestamptz not null default now(),
  unique (route_id, stop_order),
  check ((latitude is null and longitude is null) or (latitude between -90 and 90 and longitude between -180 and 180))
);

create table public.shifts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id),
  role_snapshot public.staff_role not null,
  bus_id uuid references public.buses(id),
  route_id uuid references public.routes(id),
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  start_latitude double precision,
  start_longitude double precision,
  end_latitude double precision,
  end_longitude double precision,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ended_at is null or ended_at >= started_at),
  check ((start_latitude is null and start_longitude is null) or (start_latitude between -90 and 90 and start_longitude between -180 and 180)),
  check ((end_latitude is null and end_longitude is null) or (end_latitude between -90 and 90 and end_longitude between -180 and 180))
);

create unique index one_open_shift_per_user on public.shifts(user_id) where ended_at is null;
create index shifts_started_at_idx on public.shifts(started_at desc);
create index shifts_bus_route_idx on public.shifts(bus_id, route_id);

create table public.location_pings (
  id bigint generated always as identity primary key,
  shift_id uuid not null references public.shifts(id) on delete cascade,
  user_id uuid not null references public.profiles(id),
  bus_id uuid references public.buses(id),
  route_id uuid references public.routes(id),
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  accuracy_meters double precision check (accuracy_meters is null or accuracy_meters >= 0),
  recorded_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index location_pings_shift_time_idx on public.location_pings(shift_id, recorded_at desc);
create index location_pings_recorded_at_idx on public.location_pings(recorded_at desc);

create table public.settings (
  key text primary key,
  value jsonb not null,
  updated_by uuid references public.profiles(id),
  updated_at timestamptz not null default now()
);

create table public.payroll_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id),
  shift_id uuid not null unique references public.shifts(id),
  regular_hours numeric(8,2) not null default 9 check (regular_hours >= 0),
  overtime_minutes integer not null default 0 check (overtime_minutes >= 0),
  base_pay_php numeric(12,2) not null default 700 check (base_pay_php >= 0),
  overtime_pay_php numeric(12,2) not null default 0 check (overtime_pay_php >= 0),
  total_pay_php numeric(12,2) not null default 700 check (total_pay_php >= 0),
  rate_snapshot jsonb not null default '{"base_pay_php":700,"base_shift_hours":9,"overtime_hourly_php":86}'::jsonb,
  period_start date not null,
  period_end date not null,
  created_at timestamptz not null default now(),
  check (period_end >= period_start)
);
create index payroll_period_idx on public.payroll_records(period_start, period_end);
create index payroll_user_period_idx on public.payroll_records(user_id, period_start, period_end);

create table public.audit_logs (
  id bigint generated always as identity primary key,
  actor_user_id uuid references public.profiles(id),
  action text not null,
  entity_type text not null,
  entity_id text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create trigger profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger buses_updated_at before update on public.buses for each row execute function public.set_updated_at();
create trigger routes_updated_at before update on public.routes for each row execute function public.set_updated_at();
create trigger shifts_updated_at before update on public.shifts for each row execute function public.set_updated_at();

-- SECURITY: roles are stored in profiles. This helper avoids recursive RLS policy queries.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin' and active = true
  );
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

alter table public.profiles enable row level security;
alter table public.buses enable row level security;
alter table public.routes enable row level security;
alter table public.route_stops enable row level security;
alter table public.shifts enable row level security;
alter table public.location_pings enable row level security;
alter table public.settings enable row level security;
alter table public.payroll_records enable row level security;
alter table public.audit_logs enable row level security;

create policy "staff can read own profile; admin can read all" on public.profiles
for select to authenticated using (id = (select auth.uid()) or (select public.is_admin()));
create policy "admin manages profiles" on public.profiles
for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "authenticated staff can read active buses" on public.buses
for select to authenticated using (active = true or (select public.is_admin()));
create policy "admin manages buses" on public.buses
for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "authenticated users can read active routes" on public.routes
for select to authenticated using (active = true or (select public.is_admin()));
create policy "authenticated users can read route stops" on public.route_stops
for select to authenticated using (exists (select 1 from public.routes r where r.id = route_id and (r.active = true or (select public.is_admin()))));
create policy "admin manages routes" on public.routes
for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "admin manages route stops" on public.route_stops
for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "staff read own shifts; admin reads all" on public.shifts
for select to authenticated using (user_id = (select auth.uid()) or (select public.is_admin()));
create policy "staff start own shift" on public.shifts
for insert to authenticated with check (user_id = (select auth.uid()) and role_snapshot in ('driver','conductor','inspector') and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.active = true and p.role = role_snapshot));
create policy "staff end own shift; admin manages shifts" on public.shifts
for update to authenticated using (user_id = (select auth.uid()) or (select public.is_admin())) with check (user_id = (select auth.uid()) or (select public.is_admin()));

create policy "staff read own location trail; admin reads all" on public.location_pings
for select to authenticated using (user_id = (select auth.uid()) or (select public.is_admin()));
create policy "staff submit own active-shift location" on public.location_pings
for insert to authenticated with check (
  user_id = (select auth.uid())
  and exists (
    select 1 from public.shifts s
    where s.id = shift_id and s.user_id = (select auth.uid())
      and s.ended_at is null
  )
);

create policy "authenticated read settings; admin edits settings" on public.settings
for select to authenticated using (true);
create policy "admin manages settings" on public.settings
for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "staff read own payroll; admin reads all" on public.payroll_records
for select to authenticated using (user_id = (select auth.uid()) or (select public.is_admin()));
create policy "admin manages payroll" on public.payroll_records
for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "admin reads audit logs" on public.audit_logs
for select to authenticated using ((select public.is_admin()));
create policy "authenticated admin inserts audit logs" on public.audit_logs
for insert to authenticated with check ((select public.is_admin()) and actor_user_id = (select auth.uid()));

insert into public.settings(key, value) values
  ('payroll', '{"base_pay_php":700,"base_shift_hours":9,"overtime_hourly_php":86,"periods":["1-15","16-end"]}'::jsonb),
  ('location', '{"ping_interval_seconds":10}'::jsonb)
on conflict (key) do nothing;

-- Create the first admin profile manually after creating the auth user, using the Supabase
-- SQL editor as project owner. Never expose a service-role key in the browser.
