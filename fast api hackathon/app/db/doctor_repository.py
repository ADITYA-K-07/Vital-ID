from app.db.supabase import SupabaseDataClient


class DoctorRepository:
    async def get_assigned_patient_ids(
        self,
        data_client: SupabaseDataClient,
        doctor_id: str,
    ) -> list[str]:
        rows = await data_client.select_rows(
            "doctor_patient_assignments",
            columns="patient_id",
            filters={"doctor_id": f"eq.{doctor_id}"},
        )
        return [row["patient_id"] for row in rows if row.get("patient_id")]

    async def is_patient_assigned(
        self,
        data_client: SupabaseDataClient,
        doctor_id: str,
        patient_id: str,
    ) -> bool:
        row = await data_client.select_one(
            "doctor_patient_assignments",
            columns="patient_id",
            filters={
                "doctor_id": f"eq.{doctor_id}",
                "patient_id": f"eq.{patient_id}",
            },
        )
        return row is not None
