alter table public.profiles
  add column if not exists license_number text,
  add column if not exists license_verified boolean not null default false;

alter table public.patients
  add column if not exists vital_id text;

create unique index if not exists idx_patients_vital_id_unique
  on public.patients (vital_id)
  where vital_id is not null;

alter table public.treatment_history
  add column if not exists doctor_name text,
  add column if not exists added_by text not null default 'doctor';

alter table public.medical_history
  add column if not exists added_by text not null default 'doctor';

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'treatment_history'
      and column_name = 'doctor_id'
      and is_nullable = 'NO'
  ) then
    alter table public.treatment_history
      alter column doctor_id drop not null;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'treatment_history_added_by_check'
  ) then
    alter table public.treatment_history
      add constraint treatment_history_added_by_check
      check (added_by in ('patient', 'doctor'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'medical_history_added_by_check'
  ) then
    alter table public.medical_history
      add constraint medical_history_added_by_check
      check (added_by in ('patient', 'doctor'));
  end if;
end $$;
