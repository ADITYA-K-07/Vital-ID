-- Fix recursive RLS checks that queried public.profiles from inside
-- policies on public.profiles and other tables.
-- Safe to re-run.

create or replace function public.is_doctor_viewer()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'doctor'
  );
$$;

revoke all on function public.is_doctor_viewer() from public;
grant execute on function public.is_doctor_viewer() to authenticated;

drop policy if exists "profiles_self_or_doctors_select" on public.profiles;
create policy "profiles_self_or_doctors_select"
on public.profiles
for select
to authenticated
using (
  id = auth.uid()
  or public.is_doctor_viewer()
);

drop policy if exists "patients_self_or_doctors_select" on public.patients;
create policy "patients_self_or_doctors_select"
on public.patients
for select
to authenticated
using (
  user_id = auth.uid()
  or public.is_doctor_viewer()
);

drop policy if exists "medical_records_self_or_doctors_select" on public.medical_records;
create policy "medical_records_self_or_doctors_select"
on public.medical_records
for select
to authenticated
using (
  exists (
    select 1
    from public.patients patient
    where patient.id = medical_records.patient_id
      and patient.user_id = auth.uid()
  )
  or public.is_doctor_viewer()
);

drop policy if exists "medical_records_doctors_insert" on public.medical_records;
create policy "medical_records_doctors_insert"
on public.medical_records
for insert
to authenticated
with check (public.is_doctor_viewer());

drop policy if exists "alerts_self_or_doctors_select" on public.alerts;
create policy "alerts_self_or_doctors_select"
on public.alerts
for select
to authenticated
using (
  exists (
    select 1
    from public.patients patient
    where patient.id = alerts.patient_id
      and patient.user_id = auth.uid()
  )
  or public.is_doctor_viewer()
);

drop policy if exists "alerts_doctors_insert" on public.alerts;
create policy "alerts_doctors_insert"
on public.alerts
for insert
to authenticated
with check (public.is_doctor_viewer());

drop policy if exists "restricted_records_self_or_doctors_select" on public.restricted_records;
create policy "restricted_records_self_or_doctors_select"
on public.restricted_records
for select
to authenticated
using (
  exists (
    select 1
    from public.patients patient
    where patient.id = restricted_records.patient_id
      and patient.user_id = auth.uid()
  )
  or public.is_doctor_viewer()
);

drop policy if exists "restricted_records_doctors_insert" on public.restricted_records;
create policy "restricted_records_doctors_insert"
on public.restricted_records
for insert
to authenticated
with check (public.is_doctor_viewer());

drop policy if exists "ai_insights_self_or_doctors_select" on public.ai_insights;
create policy "ai_insights_self_or_doctors_select"
on public.ai_insights
for select
to authenticated
using (
  exists (
    select 1
    from public.patients patient
    where patient.id = ai_insights.patient_id
      and patient.user_id = auth.uid()
  )
  or public.is_doctor_viewer()
);

drop policy if exists "ai_insights_doctors_insert" on public.ai_insights;
create policy "ai_insights_doctors_insert"
on public.ai_insights
for insert
to authenticated
with check (public.is_doctor_viewer());

drop policy if exists "cases_doctors_select" on public.cases;
create policy "cases_doctors_select"
on public.cases
for select
to authenticated
using (public.is_doctor_viewer());

drop policy if exists "cases_doctors_insert" on public.cases;
create policy "cases_doctors_insert"
on public.cases
for insert
to authenticated
with check (public.is_doctor_viewer());

drop policy if exists "comments_doctors_select" on public.comments;
create policy "comments_doctors_select"
on public.comments
for select
to authenticated
using (public.is_doctor_viewer());

drop policy if exists "comments_doctors_insert" on public.comments;
create policy "comments_doctors_insert"
on public.comments
for insert
to authenticated
with check (public.is_doctor_viewer());

drop policy if exists "consultations_self_or_doctors_select" on public.consultations;
create policy "consultations_self_or_doctors_select"
on public.consultations
for select
to authenticated
using (
  exists (
    select 1
    from public.patients patient
    where patient.id = consultations.patient_id
      and patient.user_id = auth.uid()
  )
  or public.is_doctor_viewer()
);

drop policy if exists "consultations_doctors_insert" on public.consultations;
create policy "consultations_doctors_insert"
on public.consultations
for insert
to authenticated
with check (public.is_doctor_viewer());

drop policy if exists "treatment_history_self_or_doctors_select" on public.treatment_history;
create policy "treatment_history_self_or_doctors_select"
on public.treatment_history
for select
to authenticated
using (
  exists (
    select 1
    from public.patients patient
    where patient.id = treatment_history.patient_id
      and patient.user_id = auth.uid()
  )
  or public.is_doctor_viewer()
);

drop policy if exists "treatment_history_doctors_insert" on public.treatment_history;
create policy "treatment_history_doctors_insert"
on public.treatment_history
for insert
to authenticated
with check (public.is_doctor_viewer());

drop policy if exists "medical_history_self_or_doctors_select" on public.medical_history;
create policy "medical_history_self_or_doctors_select"
on public.medical_history
for select
to authenticated
using (
  exists (
    select 1
    from public.patients patient
    where patient.id = medical_history.patient_id
      and patient.user_id = auth.uid()
  )
  or public.is_doctor_viewer()
);

drop policy if exists "medical_history_doctors_insert" on public.medical_history;
create policy "medical_history_doctors_insert"
on public.medical_history
for insert
to authenticated
with check (public.is_doctor_viewer());

drop policy if exists "visibility_self_or_doctors_select" on public.patient_visibility_settings;
create policy "visibility_self_or_doctors_select"
on public.patient_visibility_settings
for select
to authenticated
using (
  exists (
    select 1
    from public.patients patient
    where patient.id = patient_visibility_settings.patient_id
      and patient.user_id = auth.uid()
  )
  or public.is_doctor_viewer()
);

drop policy if exists "visibility_doctors_insert" on public.patient_visibility_settings;
create policy "visibility_doctors_insert"
on public.patient_visibility_settings
for insert
to authenticated
with check (public.is_doctor_viewer());

drop policy if exists "visibility_doctors_update" on public.patient_visibility_settings;
create policy "visibility_doctors_update"
on public.patient_visibility_settings
for update
to authenticated
using (public.is_doctor_viewer())
with check (public.is_doctor_viewer());
