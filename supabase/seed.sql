-- Route anchors are approved, but precise stop coordinates and road geometry are intentionally
-- left unset until verified against the operator's legal route and designated bays.
insert into public.routes (route_code, name, direction, active)
values
  ('PITX-MOA', 'PITX to MOA South Wing', 'pitx_to_moa', true),
  ('MOA-PITX', 'MOA South Wing to PITX', 'moa_to_pitx', true)
on conflict (route_code) do update
set name = excluded.name,
    direction = excluded.direction,
    active = excluded.active;

-- Navigation-only waypoints (City of Dreams/Aseana and DFA/Macapagal) are not
-- passenger stops and are not inserted as route_stops in this initial seed.