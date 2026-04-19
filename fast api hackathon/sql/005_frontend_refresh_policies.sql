drop policy if exists "treatment_history_patients_insert" on public.treatment_history;
create policy "treatment_history_patients_insert"
on public.treatment_history
for insert
to authenticated
with check (
  added_by = 'patient'
  and exists (
    select 1
    from public.patients patient
    where patient.id = treatment_history.patient_id
      and patient.user_id = auth.uid()
  )
);

drop policy if exists "treatment_history_patients_delete" on public.treatment_history;
create policy "treatment_history_patients_delete"
on public.treatment_history
for delete
to authenticated
using (
  added_by = 'patient'
  and exists (
    select 1
    from public.patients patient
    where patient.id = treatment_history.patient_id
      and patient.user_id = auth.uid()
  )
);

drop policy if exists "medical_history_patients_insert" on public.medical_history;
create policy "medical_history_patients_insert"
on public.medical_history
for insert
to authenticated
with check (
  added_by = 'patient'
  and exists (
    select 1
    from public.patients patient
    where patient.id = medical_history.patient_id
      and patient.user_id = auth.uid()
  )
);

drop policy if exists "medical_history_patients_delete" on public.medical_history;
create policy "medical_history_patients_delete"
on public.medical_history
for delete
to authenticated
using (
  added_by = 'patient'
  and exists (
    select 1
    from public.patients patient
    where patient.id = medical_history.patient_id
      and patient.user_id = auth.uid()
  )
);
