create table if not exists public.prescriptions (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients (id) on delete cascade,
  original_filename text not null,
  mime_type text not null,
  size_bytes bigint not null,
  storage_bucket text not null,
  storage_path text not null,
  upload_status text not null default 'uploaded',
  review_status text not null default 'pending_review',
  ocr_text text,
  ocr_confidence numeric,
  ocr_warnings jsonb not null default '[]'::jsonb,
  extraction_payload jsonb not null default '{}'::jsonb,
  review_payload jsonb not null default '{}'::jsonb,
  error_message text,
  reviewed_at timestamptz,
  committed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_prescriptions_patient_id_created_at
  on public.prescriptions (patient_id, created_at desc);

alter table public.prescriptions enable row level security;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'consultations'
      and column_name = 'doctor_id'
      and is_nullable = 'NO'
  ) then
    alter table public.consultations
      alter column doctor_id drop not null;
  end if;
end $$;

drop policy if exists "prescriptions_self_or_doctors_select" on public.prescriptions;
create policy "prescriptions_self_or_doctors_select"
on public.prescriptions
for select
to authenticated
using (
  exists (
    select 1
    from public.patients patient
    where patient.id = prescriptions.patient_id
      and patient.user_id = auth.uid()
  )
  or public.is_doctor_viewer()
);

drop policy if exists "prescriptions_patients_insert" on public.prescriptions;
create policy "prescriptions_patients_insert"
on public.prescriptions
for insert
to authenticated
with check (
  exists (
    select 1
    from public.patients patient
    where patient.id = prescriptions.patient_id
      and patient.user_id = auth.uid()
  )
);

drop policy if exists "prescriptions_patients_update" on public.prescriptions;
create policy "prescriptions_patients_update"
on public.prescriptions
for update
to authenticated
using (
  exists (
    select 1
    from public.patients patient
    where patient.id = prescriptions.patient_id
      and patient.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.patients patient
    where patient.id = prescriptions.patient_id
      and patient.user_id = auth.uid()
  )
);
