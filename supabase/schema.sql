create table if not exists employees (
  id uuid primary key default gen_random_uuid(),
  employee_code text unique not null,
  full_name text not null,
  department text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists attendance (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references employees(id),
  work_date date not null,
  time_in timestamptz,
  time_out timestamptz,
  time_in_lat double precision,
  time_in_lng double precision,
  time_in_accuracy double precision,
  time_out_lat double precision,
  time_out_lng double precision,
  time_out_accuracy double precision,
  total_hours numeric(8,2) not null default 0,
  status text not null default 'Present',
  created_at timestamptz not null default now()
);

create index if not exists attendance_employee_date_idx
  on attendance(employee_id, work_date);

alter table employees enable row level security;
alter table attendance enable row level security;

-- Production policies should be connected to your real Supabase Auth user IDs.
-- Do not use open policies in production.
