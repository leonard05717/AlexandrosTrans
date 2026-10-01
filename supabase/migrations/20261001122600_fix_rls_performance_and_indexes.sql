-- AlexTranspo: RLS performance/security cleanup
-- Applied to Supabase project kpzkjielasziitnpszsn on 2026-10-01.
-- This migration consolidates duplicate SELECT policies and uses
-- (select auth.uid()) so auth is evaluated once per query.

create index if not exists issue_reports_user_id_idx
  on public.issue_reports(user_id);

drop policy if exists admin_read_all_attendance on public.attendance;
drop policy if exists attendance_read_own on public.attendance;
create policy attendance_select_access on public.attendance
for select to authenticated
using (
  employee_id in (
    select e.id from public.employees e
    where e.user_id = (select auth.uid())
  )
  or exists (
    select 1 from public.admin_access a
    where a.user_id = (select auth.uid())
  )
);

drop policy if exists attendance_insert_own on public.attendance;
create policy attendance_insert_own on public.attendance
for insert to authenticated
with check (
  employee_id in (
    select e.id from public.employees e
    where e.user_id = (select auth.uid())
  )
);

drop policy if exists attendance_update_own on public.attendance;
create policy attendance_update_own on public.attendance
for update to authenticated
using (
  employee_id in (
    select e.id from public.employees e
    where e.user_id = (select auth.uid())
  )
)
with check (
  employee_id in (
    select e.id from public.employees e
    where e.user_id = (select auth.uid())
  )
);

drop policy if exists admin_read_all_auth_activity on public.auth_activity;
drop policy if exists auth_activity_read_own on public.auth_activity;
create policy auth_activity_select_access on public.auth_activity
for select to authenticated
using (
  user_id = (select auth.uid())
  or exists (
    select 1 from public.admin_access a
    where a.user_id = (select auth.uid())
  )
);

drop policy if exists auth_activity_insert_own on public.auth_activity;
create policy auth_activity_insert_own on public.auth_activity
for insert to authenticated
with check (user_id = (select auth.uid()));

drop policy if exists admin_read_all_employees on public.employees;
drop policy if exists employees_read_own on public.employees;
create policy employees_select_access on public.employees
for select to authenticated
using (
  user_id = (select auth.uid())
  or exists (
    select 1 from public.admin_access a
    where a.user_id = (select auth.uid())
  )
);

drop policy if exists admin_read_all_issue_reports on public.issue_reports;
drop policy if exists issue_reports_read_own on public.issue_reports;
create policy issue_reports_select_access on public.issue_reports
for select to authenticated
using (
  user_id = (select auth.uid())
  or exists (
    select 1 from public.admin_access a
    where a.user_id = (select auth.uid())
  )
);

drop policy if exists live_locations_admin_read on public.live_locations;
drop policy if exists live_locations_read_own on public.live_locations;
create policy live_locations_select_access on public.live_locations
for select to authenticated
using (
  exists (
    select 1 from public.admin_access a
    where a.user_id = (select auth.uid())
  )
  or (select auth.uid()) = (
    select e.user_id from public.employees e
    where e.id = live_locations.employee_id
  )
);
