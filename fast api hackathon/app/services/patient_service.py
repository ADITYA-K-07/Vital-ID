import asyncio
from typing import Any

from fastapi import HTTPException, status

from app.auth.models import CurrentUser, UserRole
from app.db.alert_repository import AlertRepository
from app.db.consultation_repository import ConsultationRepository
from app.db.insight_repository import InsightRepository
from app.db.medical_history_repository import MedicalHistoryRepository
from app.db.patient_repository import PatientRepository
from app.db.supabase import SupabaseDataClient
from app.db.treatment_repository import TreatmentRepository
from app.db.user_repository import UserRepository
from app.db.visibility_repository import VisibilityRepository
from app.schemas.ai import RiskItem, StoredAIInsightItem
from app.schemas.alerts import AlertItem
from app.schemas.patient import (
    ConsultationItem,
    DoctorDiagnosisCreateRequest,
    DoctorTreatmentCreateRequest,
    FieldPermissions,
    MedicalHistoryItem,
    MedicalRecordItem,
    PatientMedicalHistoryCreateRequest,
    PatientDashboardResponse,
    PatientFullProfileResponse,
    PatientIdentityResponse,
    PatientIdentityUpdateRequest,
    PatientTreatmentHistoryCreateRequest,
    PatientProfileItem,
    TreatmentHistoryItem,
)


class PatientService:
    def __init__(
        self,
        user_repository: UserRepository,
        patient_repository: PatientRepository,
        alert_repository: AlertRepository,
        insight_repository: InsightRepository,
        consultation_repository: ConsultationRepository,
        treatment_repository: TreatmentRepository,
        medical_history_repository: MedicalHistoryRepository,
        visibility_repository: VisibilityRepository,
    ) -> None:
        self.user_repository = user_repository
        self.patient_repository = patient_repository
        self.alert_repository = alert_repository
        self.insight_repository = insight_repository
        self.consultation_repository = consultation_repository
        self.treatment_repository = treatment_repository
        self.medical_history_repository = medical_history_repository
        self.visibility_repository = visibility_repository

    async def get_full_profile(
        self,
        *,
        current_user: CurrentUser,
        patient_id: str,
        data_client: SupabaseDataClient,
    ) -> PatientFullProfileResponse:
        patient = await self._resolve_patient_for_request(
            current_user=current_user,
            patient_id=patient_id,
            data_client=data_client,
        )
        bundle = await self._load_patient_bundle(patient=patient, data_client=data_client)
        doctor_names = await self._load_doctor_names(bundle=bundle, data_client=data_client)

        return PatientFullProfileResponse(
            patient=self._shape_profile(patient=bundle["patient"], profile=bundle["profile"]),
            medical_records=[self._shape_record(row) for row in bundle["medical_records"]],
            alerts=[self._shape_alert(row) for row in bundle["alerts"]],
            ai_insights=[self._shape_insight(row) for row in bundle["ai_insights"]],
            consultations=[
                self._shape_consultation(row, doctor_names)
                for row in bundle["consultations"]
            ],
            treatment_history=[
                self._shape_treatment(row, doctor_names)
                for row in bundle["treatment_history"]
            ],
            medical_history=[self._shape_history(row) for row in bundle["medical_history"]],
            field_permissions=self._shape_permissions(bundle["visibility"]),
        )

    async def lookup_patient(
        self,
        *,
        current_user: CurrentUser,
        identifier: str,
        data_client: SupabaseDataClient,
    ) -> PatientFullProfileResponse:
        if current_user.role != UserRole.DOCTOR:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only doctors can look up other patients.",
            )

        patient = await self.patient_repository.find_patient_by_identifier(
            data_client=data_client,
            identifier=identifier,
        )
        if not patient:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Patient record was not found.",
            )

        return await self.get_full_profile(
            current_user=current_user,
            patient_id=str(patient["id"]),
            data_client=data_client,
        )

    async def get_my_identity(
        self,
        *,
        current_user: CurrentUser,
        data_client: SupabaseDataClient,
    ) -> PatientIdentityResponse:
        if current_user.role != UserRole.PATIENT or not current_user.patient_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only patients can access their own identity view.",
            )

        patient = await self.patient_repository.get_patient_by_id(
            data_client=data_client,
            patient_id=current_user.patient_id,
        )
        if not patient:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Patient record was not found.",
            )

        bundle = await self._load_patient_bundle(patient=patient, data_client=data_client)
        doctor_names = await self._load_doctor_names(bundle=bundle, data_client=data_client)

        return PatientIdentityResponse(
            profile=self._shape_profile(patient=bundle["patient"], profile=bundle["profile"]),
            consultations=[
                self._shape_consultation(row, doctor_names)
                for row in bundle["consultations"]
            ],
            medical_records=[self._shape_record(row) for row in bundle["medical_records"]],
            treatment_history=[
                self._shape_treatment(row, doctor_names)
                for row in bundle["treatment_history"]
            ],
            medical_history=[self._shape_history(row) for row in bundle["medical_history"]],
            field_permissions=self._shape_permissions(bundle["visibility"]),
            alerts=[self._shape_alert(row) for row in bundle["alerts"]],
            psychological_info=bundle["visibility"].get("psychological_info") if bundle["visibility"] else None,
            ai_insights=[self._shape_insight(row) for row in bundle["ai_insights"]],
        )

    async def get_patient_dashboard(
        self,
        *,
        current_user: CurrentUser,
        data_client: SupabaseDataClient,
    ) -> PatientDashboardResponse:
        identity = await self.get_my_identity(current_user=current_user, data_client=data_client)
        return PatientDashboardResponse(
            profile=identity.profile,
            consultations=identity.consultations,
            medical_records=identity.medical_records,
            treatment_history=identity.treatment_history,
            medical_history=identity.medical_history,
            field_permissions=identity.field_permissions,
            alerts=identity.alerts,
            psychological_info=identity.psychological_info,
        )

    async def update_my_identity(
        self,
        *,
        current_user: CurrentUser,
        payload: PatientIdentityUpdateRequest,
        data_client: SupabaseDataClient,
    ) -> PatientIdentityResponse:
        if current_user.role != UserRole.PATIENT or not current_user.patient_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only patients can update their own identity snapshot.",
            )

        patient_updates = {
            key: value
            for key, value in {
                "age": payload.age,
                "weight": payload.weight,
                "height": payload.height,
                "blood_group": payload.blood_group,
                "allergies": payload.allergies or None,
                "conditions": payload.conditions or None,
                "vaccinations": payload.vaccinations or None,
                "dob": payload.dob,
                "emergency_contact": payload.emergency_contact,
                "insurance_provider": payload.insurance_provider,
            }.items()
            if value is not None
        }
        if patient_updates:
            await self.patient_repository.update_patient(
                data_client=data_client,
                patient_id=current_user.patient_id,
                payload=patient_updates,
            )

        profile_updates = {
            key: value
            for key, value in {"full_name": payload.full_name}.items()
            if value is not None
        }
        if profile_updates:
            await self.patient_repository.update_profile(
                data_client=data_client,
                profile_id=current_user.profile_id,
                payload=profile_updates,
            )

        record_payload = {
            key: value
            for key, value in {
                "patient_id": current_user.patient_id,
                "doctor_id": current_user.profile_id,
                "diagnosis": payload.diagnosis,
                "prescription": payload.prescription,
                "notes": payload.notes,
                "blood_pressure": payload.blood_pressure,
                "heart_rate": payload.heart_rate,
                "oxygen_saturation": payload.oxygen_saturation,
                "temperature": payload.temperature,
                "height_cm": payload.height_cm,
                "weight_kg": payload.weight_kg,
                "medications": payload.medications or None,
            }.items()
            if value is not None
        }
        if len(record_payload) > 3:
            await self.patient_repository.create_medical_record(
                data_client=data_client,
                payload=record_payload,
            )

        return await self.get_my_identity(current_user=current_user, data_client=data_client)

    async def create_doctor_diagnosis(
        self,
        *,
        current_user: CurrentUser,
        patient_id: str,
        payload: DoctorDiagnosisCreateRequest,
        data_client: SupabaseDataClient,
        service_data_client: SupabaseDataClient | None,
    ) -> PatientFullProfileResponse:
        patient = await self._resolve_patient_for_request(
            current_user=current_user,
            patient_id=patient_id,
            data_client=data_client,
        )
        write_client = service_data_client or data_client
        created = await self.patient_repository.create_medical_record(
            data_client=write_client,
            payload={
                "patient_id": str(patient["id"]),
                "doctor_id": current_user.profile_id,
                "diagnosis": payload.diagnosis,
                "notes": payload.diagnosis,
            },
        )
        if not created:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Unable to create diagnosis record.",
            )

        return await self.get_full_profile(
            current_user=current_user,
            patient_id=str(patient["id"]),
            data_client=data_client,
        )

    async def create_doctor_treatment(
        self,
        *,
        current_user: CurrentUser,
        patient_id: str,
        payload: DoctorTreatmentCreateRequest,
        data_client: SupabaseDataClient,
        service_data_client: SupabaseDataClient | None,
    ) -> PatientFullProfileResponse:
        patient = await self._resolve_patient_for_request(
            current_user=current_user,
            patient_id=patient_id,
            data_client=data_client,
        )
        write_client = service_data_client or data_client
        created = await self.treatment_repository.create_entry(
            data_client=write_client,
            payload={
                "patient_id": str(patient["id"]),
                "doctor_id": current_user.profile_id,
                "treatment": payload.treatment,
                "notes": payload.treatment,
                "added_by": "doctor",
            },
        )
        if not created:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Unable to create treatment record.",
            )

        return await self.get_full_profile(
            current_user=current_user,
            patient_id=str(patient["id"]),
            data_client=data_client,
        )

    async def create_patient_treatment_history(
        self,
        *,
        current_user: CurrentUser,
        payload: PatientTreatmentHistoryCreateRequest,
        data_client: SupabaseDataClient,
        service_data_client: SupabaseDataClient | None,
    ) -> PatientIdentityResponse:
        self._require_patient_self_access(current_user=current_user)

        write_client = service_data_client or data_client
        created = await self.treatment_repository.create_entry(
            data_client=write_client,
            payload={
                "patient_id": current_user.patient_id,
                "doctor_id": None,
                "doctor_name": payload.doctor_name,
                "specialty": payload.specialty,
                "diagnosis": payload.diagnosis,
                "treatment": payload.treatment,
                "notes": payload.notes,
                "follow_up_date": payload.follow_up_date,
                "added_by": "patient",
            },
        )
        if not created:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Unable to save treatment history entry.",
            )

        return await self.get_my_identity(current_user=current_user, data_client=data_client)

    async def delete_patient_treatment_history(
        self,
        *,
        current_user: CurrentUser,
        treatment_id: str,
        data_client: SupabaseDataClient,
        service_data_client: SupabaseDataClient | None,
    ) -> PatientIdentityResponse:
        self._require_patient_self_access(current_user=current_user)

        existing = await self.treatment_repository.get_by_id(
            data_client=data_client,
            treatment_id=treatment_id,
        )
        self._assert_patient_owned_row(
            row=existing,
            row_name="Treatment history entry",
            patient_id=current_user.patient_id,
        )
        if existing.get("added_by") != "patient":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Patients can only delete their own self-authored entries.",
            )

        write_client = service_data_client or data_client
        await self.treatment_repository.delete_entry(
            data_client=write_client,
            treatment_id=treatment_id,
        )
        return await self.get_my_identity(current_user=current_user, data_client=data_client)

    async def create_patient_medical_history(
        self,
        *,
        current_user: CurrentUser,
        payload: PatientMedicalHistoryCreateRequest,
        data_client: SupabaseDataClient,
        service_data_client: SupabaseDataClient | None,
    ) -> PatientIdentityResponse:
        self._require_patient_self_access(current_user=current_user)

        write_client = service_data_client or data_client
        created = await self.medical_history_repository.create_entry(
            data_client=write_client,
            payload={
                "patient_id": current_user.patient_id,
                "event_type": payload.event_type,
                "title": payload.title,
                "description": payload.description,
                "facility": payload.facility,
                "doctor_name": payload.doctor_name,
                "event_date": payload.event_date,
                "added_by": "patient",
            },
        )
        if not created:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Unable to save medical history entry.",
            )

        return await self.get_my_identity(current_user=current_user, data_client=data_client)

    async def delete_patient_medical_history(
        self,
        *,
        current_user: CurrentUser,
        history_id: str,
        data_client: SupabaseDataClient,
        service_data_client: SupabaseDataClient | None,
    ) -> PatientIdentityResponse:
        self._require_patient_self_access(current_user=current_user)

        existing = await self.medical_history_repository.get_by_id(
            data_client=data_client,
            history_id=history_id,
        )
        self._assert_patient_owned_row(
            row=existing,
            row_name="Medical history entry",
            patient_id=current_user.patient_id,
        )
        if existing.get("added_by") != "patient":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Patients can only delete their own self-authored entries.",
            )

        write_client = service_data_client or data_client
        await self.medical_history_repository.delete_entry(
            data_client=write_client,
            history_id=history_id,
        )
        return await self.get_my_identity(current_user=current_user, data_client=data_client)

    async def load_patient_bundle(
        self,
        *,
        current_user: CurrentUser,
        patient_id: str,
        data_client: SupabaseDataClient,
    ) -> dict[str, Any]:
        patient = await self._resolve_patient_for_request(
            current_user=current_user,
            patient_id=patient_id,
            data_client=data_client,
        )
        bundle = await self._load_patient_bundle(patient=patient, data_client=data_client)
        # The AI layer expects a stable bundle shape.
        bundle["prescriptions"] = []
        return bundle

    async def _resolve_patient_for_request(
        self,
        *,
        current_user: CurrentUser,
        patient_id: str,
        data_client: SupabaseDataClient,
    ) -> dict[str, Any]:
        if current_user.role == UserRole.PATIENT and current_user.patient_id != patient_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Patients can only access their own record.",
            )

        patient = await self.patient_repository.get_patient_by_id(
            data_client=data_client,
            patient_id=patient_id,
        )
        if not patient:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Patient record was not found.",
            )
        return patient

    async def _load_patient_bundle(
        self,
        *,
        patient: dict[str, Any],
        data_client: SupabaseDataClient,
    ) -> dict[str, Any]:
        profile, medical_records, alerts, ai_insights, consultations, treatment_history, medical_history, visibility = await asyncio.gather(
            self.user_repository.get_profile_by_id(
                data_client=data_client,
                profile_id=patient.get("user_id") or "",
            ),
            self.patient_repository.get_medical_records(
                data_client=data_client,
                patient_id=patient["id"],
            ),
            self.alert_repository.get_patient_alerts(
                data_client=data_client,
                patient_id=patient["id"],
            ),
            self.insight_repository.get_recent_insights(
                data_client=data_client,
                patient_id=patient["id"],
                limit=10,
            ),
            self._optional_rows(
                self.consultation_repository.list_for_patient(
                    data_client=data_client,
                    patient_id=patient["id"],
                )
            ),
            self._optional_rows(
                self.treatment_repository.list_for_patient(
                    data_client=data_client,
                    patient_id=patient["id"],
                )
            ),
            self._optional_rows(
                self.medical_history_repository.list_for_patient(
                    data_client=data_client,
                    patient_id=patient["id"],
                )
            ),
            self._optional_one(
                self.visibility_repository.get_for_patient(
                    data_client=data_client,
                    patient_id=patient["id"],
                )
            ),
        )

        return {
            "patient": patient,
            "profile": profile or {},
            "medical_records": medical_records,
            "alerts": alerts,
            "ai_insights": ai_insights,
            "consultations": consultations,
            "treatment_history": treatment_history,
            "medical_history": medical_history,
            "visibility": visibility,
        }

    async def _optional_rows(self, awaitable: Any) -> list[dict[str, Any]]:
        try:
            return await awaitable
        except HTTPException as exc:
            if exc.status_code == status.HTTP_502_BAD_GATEWAY:
                return []
            raise

    async def _optional_one(self, awaitable: Any) -> dict[str, Any] | None:
        try:
            return await awaitable
        except HTTPException as exc:
            if exc.status_code == status.HTTP_502_BAD_GATEWAY:
                return None
            raise

    async def _load_doctor_names(
        self,
        *,
        bundle: dict[str, Any],
        data_client: SupabaseDataClient,
    ) -> dict[str, str]:
        doctor_ids = {
            row.get("doctor_id")
            for row in [*bundle["consultations"], *bundle["treatment_history"], *bundle["medical_records"]]
            if row.get("doctor_id")
        }
        profiles = await self.user_repository.get_profiles_by_ids(
            data_client=data_client,
            profile_ids=[doctor_id for doctor_id in doctor_ids if doctor_id],
        )
        return {
            profile["id"]: profile.get("full_name") or "Doctor"
            for profile in profiles
        }

    def _shape_profile(
        self,
        *,
        patient: dict[str, Any],
        profile: dict[str, Any],
    ) -> PatientProfileItem:
        return PatientProfileItem(
            id=str(patient["id"]),
            user_id=patient.get("user_id"),
            vital_id=patient.get("vital_id"),
            full_name=profile.get("full_name") or "Unknown patient",
            role=(profile.get("role") or "patient").title(),
            age=patient.get("age"),
            weight=patient.get("weight"),
            height=patient.get("height"),
            blood_group=patient.get("blood_group"),
            allergies=self._to_list(patient.get("allergies")),
            conditions=self._to_list(patient.get("conditions")),
            vaccinations=self._to_list(patient.get("vaccinations")),
            dob=patient.get("dob"),
            emergency_contact=patient.get("emergency_contact"),
            insurance_provider=patient.get("insurance_provider"),
            created_at=patient.get("created_at"),
        )

    def _shape_record(self, row: dict[str, Any]) -> MedicalRecordItem:
        medications = row.get("medications")
        if medications is None and row.get("prescription"):
            medications = [row.get("prescription")]
        return MedicalRecordItem(
            id=str(row["id"]),
            patient_id=row.get("patient_id"),
            doctor_id=row.get("doctor_id"),
            diagnosis=row.get("diagnosis"),
            prescription=row.get("prescription"),
            notes=row.get("notes"),
            visit_date=row.get("visit_date") or row.get("created_at"),
            created_at=row.get("created_at"),
            blood_pressure=row.get("blood_pressure"),
            heart_rate=row.get("heart_rate"),
            oxygen_saturation=row.get("oxygen_saturation"),
            temperature=row.get("temperature"),
            height_cm=row.get("height_cm"),
            weight_kg=row.get("weight_kg"),
            medications=self._to_list(medications),
        )

    def _shape_alert(self, row: dict[str, Any]) -> AlertItem:
        severity = (row.get("priority") or row.get("severity") or "low").lower()
        status = row.get("status") or ("read" if row.get("is_read") else "unread")
        return AlertItem(
            id=str(row["id"]),
            patient_id=row.get("patient_id"),
            title=row.get("title") or "Alert",
            message=row.get("description") or row.get("message") or "",
            severity=severity,
            status=status,
            created_at=row.get("created_at"),
            is_read=row.get("is_read"),
        )

    def _shape_insight(self, row: dict[str, Any]) -> StoredAIInsightItem:
        payload = row.get("payload") if isinstance(row.get("payload"), dict) else {}
        raw_risks = payload.get("risks") or []
        risks = [
            risk if isinstance(risk, RiskItem) else RiskItem(**risk)
            for risk in raw_risks
            if isinstance(risk, dict)
        ]
        return StoredAIInsightItem(
            id=str(row["id"]),
            patient_id=row.get("patient_id") or "",
            summary=payload.get("summary") or row.get("insight") or "",
            risks=risks,
            recommendations=payload.get("recommendations") or [],
            urgency_level=payload.get("urgency_level") or "low",
            source=row.get("source") or row.get("type"),
            kind=row.get("type"),
            created_at=row.get("created_at"),
        )

    def _shape_consultation(
        self,
        row: dict[str, Any],
        doctor_names: dict[str, str],
    ) -> ConsultationItem:
        doctor_id = row.get("doctor_id")
        return ConsultationItem(
            id=str(row["id"]),
            title=row.get("title") or "Consultation",
            scheduled_at=row.get("scheduled_at") or row.get("created_at") or "",
            mode=row.get("mode") or "Virtual",
            status=row.get("status") or "Scheduled",
            doctor_id=doctor_id,
            specialist=row.get("specialist") or doctor_names.get(doctor_id),
        )

    def _shape_treatment(
        self,
        row: dict[str, Any],
        doctor_names: dict[str, str],
    ) -> TreatmentHistoryItem:
        doctor_id = row.get("doctor_id")
        return TreatmentHistoryItem(
            id=str(row["id"]),
            doctor_id=doctor_id,
            doctor_name=row.get("doctor_name") or doctor_names.get(doctor_id),
            specialty=row.get("specialty"),
            diagnosis=row.get("diagnosis"),
            treatment=row.get("treatment"),
            notes=row.get("notes"),
            follow_up_date=row.get("follow_up_date"),
            added_by=row.get("added_by"),
            created_at=row.get("created_at"),
        )

    def _shape_history(self, row: dict[str, Any]) -> MedicalHistoryItem:
        return MedicalHistoryItem(
            id=str(row["id"]),
            event_type=row.get("event_type") or "Diagnosis",
            title=row.get("title") or "Medical history item",
            description=row.get("description"),
            facility=row.get("facility"),
            doctor_name=row.get("doctor_name"),
            event_date=row.get("event_date"),
            added_by=row.get("added_by"),
            created_at=row.get("created_at"),
        )

    def _shape_permissions(self, row: dict[str, Any] | None) -> FieldPermissions:
        defaults = FieldPermissions()
        if not row:
            return defaults
        return FieldPermissions(
            show_allergies=row.get("show_allergies", defaults.show_allergies),
            show_medications=row.get("show_medications", defaults.show_medications),
            show_conditions=row.get("show_conditions", defaults.show_conditions),
            show_vitals=row.get("show_vitals", defaults.show_vitals),
            show_medical_history=row.get("show_medical_history", defaults.show_medical_history),
            show_treatment_history=row.get("show_treatment_history", defaults.show_treatment_history),
            show_psychological_info=row.get("show_psychological_info", defaults.show_psychological_info),
            show_emergency_contact=row.get("show_emergency_contact", defaults.show_emergency_contact),
            show_insurance=row.get("show_insurance", defaults.show_insurance),
        )

    def _to_list(self, value: Any) -> list[str]:
        if value is None:
            return []
        if isinstance(value, list):
            return [str(item) for item in value if str(item).strip()]
        if isinstance(value, str):
            return [item.strip() for item in value.split(",") if item.strip()]
        return [str(value)]

    def _require_patient_self_access(self, *, current_user: CurrentUser) -> None:
        if current_user.role != UserRole.PATIENT or not current_user.patient_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only patients can manage their own history entries.",
            )

    def _assert_patient_owned_row(
        self,
        *,
        row: dict[str, Any] | None,
        row_name: str,
        patient_id: str | None,
    ) -> None:
        if not row:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"{row_name} was not found.",
            )
        if row.get("patient_id") != patient_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"{row_name} does not belong to the current patient.",
            )
