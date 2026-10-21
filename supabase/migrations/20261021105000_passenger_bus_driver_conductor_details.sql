create or replace view public.passenger_bus_locations as
select distinct on (lp.bus_id)
  lp.bus_id,
  b.bus_code,
  r.name as route_name,
  r.direction::text as direction,
  lp.latitude,
  lp.longitude,
  lp.recorded_at,
  s.started_at as trip_started_at,
  p.full_name as driver_name,
  s.conductor_name
from public.location_pings lp
join public.shifts s on s.id = lp.shift_id and s.ended_at is null
join public.buses b on b.id = lp.bus_id and b.active = true
left join public.routes r on r.id = lp.route_id
left join public.profiles p on p.id = s.user_id
where lp.bus_id is not null
order by lp.bus_id, lp.recorded_at desc;
