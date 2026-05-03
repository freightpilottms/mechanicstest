alter table public.scenarios
  add column if not exists signature text,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists locale text default 'en',
  add column if not exists language text default 'en',
  add column if not exists times_used integer not null default 0,
  add column if not exists year integer,
  add column if not exists power_kw integer,
  add column if not exists engine_code text,
  add column if not exists fuel_type text,
  add column if not exists induction text,
  add column if not exists timing_type text,
  add column if not exists has_start_stop boolean,
  add column if not exists has_dpf boolean,
  add column if not exists emission_standard text;

create index if not exists scenarios_signature_idx
  on public.scenarios (signature);

create index if not exists scenarios_locale_created_at_idx
  on public.scenarios (locale, created_at desc);

create index if not exists scenarios_times_used_idx
  on public.scenarios (times_used);

notify pgrst, 'reload schema';
