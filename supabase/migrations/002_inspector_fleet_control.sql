-- Inspector fleet visibility and secure active-shift route control.
-- Run after the initial schema and Ternate–MOA route setup.

create or replace function public.is_fleet_inspector()
returns boolean language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'inspector' and active = true);
$$;
revoke all on function public.is_fleet_inspector() from public;
revoke all on function public.is_fleet_inspector() from anon;
grant execute on function public.is_fleet_inspector() to authenticated;

create policy "inspectors read fleet profiles" on public.profiles
for select to authenticated using ((select public.is_fleet_inspector()));

create policy "inspectors read active fleet shifts" on public.shifts
for select to authenticated using ((select public.is_fleet_inspector()) and ended_at is null);

create policy "inspectors read fleet GPS" on public.location_pings
for select to authenticated using ((select public.is_fleet_inspector()));

create or replace function public.inspector_update_active_shift(p_shift_id uuid, p_bus_id uuid, p_route_id uuid)
returns jsonb language plpgsql security definer set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_shift_id uuid;
  v_old_bus_id uuid;
  v_old_route_id uuid;
begin
  if not exists (select 1 from public.profiles where id = v_actor and active = true and role in ('inspector', 'admin')) then
    raise exception using errcode = '42501', message = 'Active inspector or administrator access required.';
  end if;
  if not exists (select 1 from public.buses where id = p_bus_id and active = true) then
    raise exception using errcode = '22023', message = 'Choose an active bus.';
  end if;
  if not exists (select 1 from public.routes where id = p_route_id and active = true) then
    raise exception using errcode = '22023', message = 'Choose an active route.';
  end if;
  select id, bus_id, route_id into v_shift_id, v_old_bus_id, v_old_route_id
  from public.shifts where id = p_shift_id and ended_at is null for update;
  if v_shift_id is null then
    raise exception using errcode = 'P0002', message = 'That shift is no longer active.';
  end if;
  update public.shifts set bus_id = p_bus_id, route_id = p_route_id, updated_at = now()
  where id = v_shift_id and ended_at is null;
  insert into public.audit_logs(actor_user_id, action, entity_type, entity_id, details)
  values (v_actor, 'active_shift_route_changed', 'shift', v_shift_id::text,
    jsonb_build_object('old_bus_id', v_old_bus_id, 'new_bus_id', p_bus_id, 'old_route_id', v_old_route_id, 'new_route_id', p_route_id));
  return jsonb_build_object('shift_id', v_shift_id, 'bus_id', p_bus_id, 'route_id', p_route_id);
end;
$$;
revoke all on function public.inspector_update_active_shift(uuid, uuid, uuid) from public;
revoke all on function public.inspector_update_active_shift(uuid, uuid, uuid) from anon;
grant execute on function public.inspector_update_active_shift(uuid, uuid, uuid) to authenticated;
