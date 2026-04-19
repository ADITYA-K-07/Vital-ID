-- Merge the original Supabase schema with the dashboard/frontend needs.
-- Safe to re-run: every change is guarded with IF NOT EXISTS.

alter table public.patients
  add column if not exists dob date,
  add column if not exists emergency_contact text,
  add column if not exists insurance_provider text;

alter table public.medical_records
  add column if not exists visit_date date default current_date,
  add column if not exists blood_pressure text,
  add column if not exists heart_rate integer,
  add column if not exists oxygen_saturation integer,
  add column if not exists temperature text,
  add column if not exists height_cm integer,
  add column if not exists weight_kg integer,
  add column if not exists medications text[];

alter table public.cases
  add column if not exists specialty text,
  add column if not exists status text default 'Shared';

alter table public.ai_insights
  add column if not exists payload jsonb default '{}'::jsonb,
  add column if not exists doctor_id uuid references public.profiles (id) on delete set null,
  add column if not exists source text default 'mock';

create table if not exists public.consultations (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients (id) on delete cascade,
  doctor_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  scheduled_at timestamptz not null,
  mode text not null default 'Virtual',
  status text not null default 'Scheduled',
  created_at timestamptz not null default now()
);

create table if not exists public.treatment_history (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients (id) on delete cascade,
  doctor_id uuid not null references public.profiles (id) on delete cascade,
  specialty text,
  diagnosis text,
  treatment text,
  notes text,
  follow_up_date date,
  created_at timestamptz not null default now()
);

create table if not exists public.medical_history (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients (id) on delete cascade,
  event_type text not null default 'Diagnosis',
  title text not null,
  description text,
  facility text,
  doctor_name text,
  event_date date,
  created_at timestamptz not null default now()
);

create table if not exists public.patient_visibility_settings (
  patient_id uuid primary key references public.patients (id) on delete cascade,
  show_allergies boolean not null default true,
  show_medications boolean not null default true,
  show_conditions boolean not null default true,
  show_vitals boolean not null default true,
  show_medical_history boolean not null default true,
  show_treatment_history boolean not null default true,
  show_psychological_info boolean not null default false,
  show_emergency_contact boolean not null default true,
  show_insurance boolean not null default true,
  psychological_info text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_patients_user_id on public.patients (user_id);
create index if not exists idx_medical_records_patient_id_created_at on public.medical_records (patient_id, created_at desc);
create index if not exists idx_alerts_patient_id_created_at on public.alerts (patient_id, created_at desc);
create index if not exists idx_ai_insights_patient_id_created_at on public.ai_insights (patient_id, created_at desc);
create index if not exists idx_cases_created_at on public.cases (created_at desc);
create index if not exists idx_comments_case_id_created_at on public.comments (case_id, created_at asc);
create index if not exists idx_consultations_patient_id_scheduled_at on public.consultations (patient_id, scheduled_at asc);
create index if not exists idx_treatment_history_patient_id_created_at on public.treatment_history (patient_id, created_at desc);
create index if not exists idx_medical_history_patient_id_event_date on public.medical_history (patient_id, event_date desc);
