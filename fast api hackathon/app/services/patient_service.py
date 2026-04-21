import asyncio
from datetime import date
from typing import Any
from uuid import uuid4

from fastapi import HTTPException, UploadFile, status

from app.ai.provider import ClinicalAIProvider
from app.auth.models import CurrentUser, UserRole
from app.core.config import Settings
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
    PrescriptionCommitRequest,
    PrescriptionDocumentItem,
    PrescriptionFeatureStatus,
    PrescriptionFollowUpCandidate,
    PrescriptionMedicationCandidate,
    PrescriptionNoteCandidate,
    PrescriptionPreviewResponse,
    PrescriptionTreatmentCandidate,
    PatientMedicalHistoryCreateRequest,
    PatientDashboardResponse,
    PatientFullProfileResponse,
    PatientIdentityResponse,
    PatientIdentityUpdateRequest,
    PatientTreatmentHistoryCreateRequest,
    PatientProfileItem,
    TreatmentHistoryItem,
)
from app.services.ocr_service import OCRService
from app.services.prescription_storage_service import PrescriptionStorageService
from app.utils.datetime import utc_now_iso


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
        provider: ClinicalAIProvider,
        settings: Settings,
        ocr_service: OCRService,
        prescription_storage_service: PrescriptionStorageService,
    ) -> None:
        self.user_repository = user_repository
        self.patient_repository = patient_repository
        self.alert_repository = alert_repository
        self.insight_repository = insight_repository
        self.consultation_repository = consultation_repository
        self.treatment_repository = treatment_repository
        self.medical_history_repository = medical_history_repository
        self.visibility_repository = visibility_repository
        self.provider = provider
        self.settings = settings
        self.ocr_service = ocr_service
        self.prescription_storage_service = prescription_storage_service

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
            prescriptions=[self._shape_prescription(row) for row in bundle["prescriptions"]],
            prescription_feature=self._get_prescription_feature_status(),
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
            prescriptions=[self._shape_prescription(row) for row in bundle["prescriptions"]],
            prescription_feature=self._get_prescription_feature_status(),
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
            prescriptions=identity.prescriptions,
            prescription_feature=identity.prescription_feature,
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

    async def preview_patient_prescription(
        self,
        *,
        current_user: CurrentUser,
        upload: UploadFile,
        data_client: SupabaseDataClient,
        service_data_client: SupabaseDataClient | None,
    ) -> PrescriptionPreviewResponse:
        self._require_patient_self_access(current_user=current_user)
        feature = self._get_prescription_feature_status()
        self._ensure_prescription_feature_enabled(feature)

        filename = upload.filename or "prescription"
        mime_type = upload.content_type or ""
        if mime_type not in self._allowed_prescription_mime_types():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only JPG, PNG, and PDF prescription uploads are supported.",
            )

        content = await upload.read()
        if not content:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="The uploaded prescription file was empty.",
            )
        if len(content) > self.settings.prescription_upload_max_bytes:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="The uploaded prescription file is larger than the configured upload limit.",
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

        profile = await self.user_repository.get_profile_by_id(
            data_client=data_client,
            profile_id=patient.get("user_id") or "",
        )
        latest_record = await self.patient_repository.get_latest_medical_record(
            data_client=data_client,
            patient_id=current_user.patient_id,
        )

        prescription_id = str(uuid4())
        storage_path = self.prescription_storage_service.build_storage_path(
            patient_id=current_user.patient_id,
            prescription_id=prescription_id,
            filename=filename,
        )
        write_client = service_data_client or data_client

        created = await self.patient_repository.create_prescription(
            data_client=write_client,
            payload={
                "id": prescription_id,
                "patient_id": current_user.patient_id,
                "original_filename": filename,
                "mime_type": mime_type,
                "size_bytes": len(content),
                "storage_bucket": self.prescription_storage_service.bucket,
                "storage_path": storage_path,
                "upload_status": "processing",
                "review_status": "pending_review",
            },
        )
        if not created:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Unable to create the prescription upload record.",
            )

        try:
            await self.prescription_storage_service.upload_document(
                storage_path=storage_path,
                mime_type=mime_type,
                content=content,
            )
            ocr_result = await self.ocr_service.extract_text(
                filename=filename,
                mime_type=mime_type,
                content=content,
            )
            extraction = await self.provider.extract_prescription_structured_data(
                ocr_text=ocr_result["raw_text"],
                patient_context=self._build_prescription_patient_context(
                    patient=patient,
                    profile=profile or {},
                    latest_record=latest_record,
                ),
            )
        except HTTPException as exc:
            await self._mark_prescription_failed(
                data_client=write_client,
                prescription_id=prescription_id,
                message=exc.detail if isinstance(exc.detail, str) else "Prescription processing failed.",
            )
            raise

        preview = self._build_prescription_preview(
            prescription_row=created,
            raw_text=ocr_result["raw_text"],
            extraction=extraction,
        )
        updated = await self.patient_repository.update_prescription(
            data_client=write_client,
            prescription_id=prescription_id,
            payload={
                "upload_status": "review_ready",
                "review_status": "pending_review",
                "ocr_text": preview.raw_text,
                "ocr_confidence": ocr_result.get("confidence"),
                "ocr_warnings": preview.warnings,
                "extraction_payload": {
                    "medications": [item.model_dump(mode="json") for item in preview.medications],
                    "treatments": [item.model_dump(mode="json") for item in preview.treatments],
                    "notes": [item.model_dump(mode="json") for item in preview.notes],
                    "follow_up": preview.follow_up.model_dump(mode="json") if preview.follow_up else None,
                    "warnings": preview.warnings,
                },
                "error_message": None,
            },
        )
        if updated:
            preview.prescription = self._shape_prescription(updated)

        return preview

    async def commit_patient_prescription(
        self,
        *,
        current_user: CurrentUser,
        payload: PrescriptionCommitRequest,
        data_client: SupabaseDataClient,
        service_data_client: SupabaseDataClient | None,
    ) -> PatientIdentityResponse:
        self._require_patient_self_access(current_user=current_user)

        feature = self._get_prescription_feature_status()
        self._ensure_prescription_feature_enabled(feature)

        existing = await self.patient_repository.get_prescription_by_id(
            data_client=data_client,
            prescription_id=payload.prescription_id,
        )
        self._assert_patient_owned_row(
            row=existing,
            row_name="Prescription upload",
            patient_id=current_user.patient_id,
        )

        write_client = service_data_client or data_client
        latest_record = await self.patient_repository.get_latest_medical_record(
            data_client=data_client,
            patient_id=current_user.patient_id,
        )

        included_medications = [item for item in payload.medications if item.include and item.name.strip()]
        included_treatments = [item.text.strip() for item in payload.treatments if item.include and item.text.strip()]
        included_notes = [item.text.strip() for item in payload.notes if item.include and item.text.strip()]
        follow_up = payload.follow_up if payload.follow_up and payload.follow_up.include else None

        if included_medications:
            medication_snapshot = [self._format_medication_candidate(item) for item in included_medications]
            created_record = await self.patient_repository.create_medical_record(
                data_client=write_client,
                payload={
                    "patient_id": current_user.patient_id,
                    "doctor_id": current_user.profile_id,
                    "visit_date": date.today().isoformat(),
                    "diagnosis": latest_record.get("diagnosis") if latest_record else None,
                    "prescription": ", ".join(medication_snapshot),
                    "notes": latest_record.get("notes") if latest_record else None,
                    "blood_pressure": latest_record.get("blood_pressure") if latest_record else None,
                    "heart_rate": latest_record.get("heart_rate") if latest_record else None,
                    "oxygen_saturation": latest_record.get("oxygen_saturation") if latest_record else None,
                    "temperature": latest_record.get("temperature") if latest_record else None,
                    "height_cm": latest_record.get("height_cm") if latest_record else None,
                    "weight_kg": latest_record.get("weight_kg") if latest_record else None,
                    "medications": medication_snapshot,
                },
            )
            if not created_record:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Unable to save the reviewed medication snapshot.",
                )

        if included_treatments or included_notes:
            created_treatment = await self.treatment_repository.create_entry(
                data_client=write_client,
                payload={
                    "patient_id": current_user.patient_id,
                    "doctor_id": None,
                    "doctor_name": follow_up.provider if follow_up else None,
                    "specialty": "Prescription Review",
                    "diagnosis": "Prescription upload review",
                    "treatment": "\n".join(included_treatments) or None,
                    "notes": "\n".join(included_notes) or None,
                    "follow_up_date": follow_up.scheduled_date if follow_up else None,
                    "added_by": "patient",
                },
            )
            if not created_treatment:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Unable to save the reviewed treatment history entry.",
                )

        if follow_up and follow_up.scheduled_date:
            created_consultation = await self.consultation_repository.create_entry(
                data_client=write_client,
                payload={
                    "patient_id": current_user.patient_id,
                    "doctor_id": None,
                    "title": follow_up.title or "Follow-up Visit",
                    "scheduled_at": self._follow_up_date_to_timestamp(follow_up.scheduled_date),
                    "mode": "In Person",
                    "status": "Pending",
                    "specialist": follow_up.provider,
                },
            )
            if not created_consultation:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Unable to save the reviewed follow-up entry.",
                )

        await self.patient_repository.update_prescription(
            data_client=write_client,
            prescription_id=payload.prescription_id,
            payload={
                "upload_status": "review_ready",
                "review_status": "committed",
                "reviewed_at": utc_now_iso(),
                "committed_at": utc_now_iso(),
                "review_payload": payload.model_dump(mode="json"),
                "error_message": None,
            },
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
        return await self._load_patient_bundle(patient=patient, data_client=data_client)

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
        profile, medical_records, alerts, ai_insights, consultations, treatment_history, medical_history, visibility, prescriptions = await asyncio.gather(
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
            self._optional_rows(
                self.patient_repository.list_prescriptions(
                    data_client=data_client,
                    patient_id=patient["id"],
                )
            ),
        )

        return {
            "patient": patient,
            "profile": profile or {},
            "records": medical_records,
            "medical_records": medical_records,
            "alerts": alerts,
            "ai_insights": ai_insights,
            "consultations": consultations,
            "treatment_history": treatment_history,
            "medical_history": medical_history,
            "prescriptions": prescriptions,
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

    def _shape_prescription(self, row: dict[str, Any]) -> PrescriptionDocumentItem:
        return PrescriptionDocumentItem(
            id=str(row["id"]),
            patient_id=row.get("patient_id"),
            original_filename=row.get("original_filename") or "Prescription",
            mime_type=row.get("mime_type") or "application/octet-stream",
            size_bytes=int(row.get("size_bytes") or 0),
            storage_bucket=row.get("storage_bucket"),
            storage_path=row.get("storage_path"),
            upload_status=row.get("upload_status"),
            review_status=row.get("review_status"),
            created_at=row.get("created_at"),
            reviewed_at=row.get("reviewed_at"),
            committed_at=row.get("committed_at"),
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

    def _get_prescription_feature_status(self) -> PrescriptionFeatureStatus:
        if self.settings.prescription_feature_enabled:
            return PrescriptionFeatureStatus(
                enabled=True,
                reason=None,
                max_file_size_bytes=self.settings.prescription_upload_max_bytes,
                allowed_mime_types=self._allowed_prescription_mime_types(),
            )

        reason = "Prescription upload is unavailable because OCR or backend storage is not configured."
        if not self.settings.has_prescription_storage:
            reason = "Prescription upload is unavailable because backend storage is not configured."
        elif not self.settings.has_ocr_api:
            reason = "Prescription upload is unavailable because OCR is not configured."

        return PrescriptionFeatureStatus(
            enabled=False,
            reason=reason,
            max_file_size_bytes=self.settings.prescription_upload_max_bytes,
            allowed_mime_types=self._allowed_prescription_mime_types(),
        )

    async def _mark_prescription_failed(
        self,
        *,
        data_client: SupabaseDataClient,
        prescription_id: str,
        message: str,
    ) -> None:
        await self.patient_repository.update_prescription(
            data_client=data_client,
            prescription_id=prescription_id,
            payload={
                "upload_status": "failed",
                "review_status": "failed",
                "error_message": message,
            },
        )

    def _build_prescription_patient_context(
        self,
        *,
        patient: dict[str, Any],
        profile: dict[str, Any],
        latest_record: dict[str, Any] | None,
    ) -> dict[str, Any]:
        return {
            "patient_id": str(patient["id"]),
            "full_name": profile.get("full_name"),
            "blood_group": patient.get("blood_group"),
            "conditions": self._to_list(patient.get("conditions")),
            "allergies": self._to_list(patient.get("allergies")),
            "existing_medications": self._to_list(
                (latest_record or {}).get("medications") or (latest_record or {}).get("prescription")
            ),
        }

    def _build_prescription_preview(
        self,
        *,
        prescription_row: dict[str, Any],
        raw_text: str,
        extraction: dict[str, Any],
    ) -> PrescriptionPreviewResponse:
        medications = [
            PrescriptionMedicationCandidate(**item)
            for item in extraction.get("medications", [])
            if isinstance(item, dict) and str(item.get("name") or "").strip()
        ]
        treatments = [
            PrescriptionTreatmentCandidate(**item)
            for item in extraction.get("treatments", [])
            if isinstance(item, dict) and str(item.get("text") or "").strip()
        ]
        notes = [
            PrescriptionNoteCandidate(**item)
            for item in extraction.get("notes", [])
            if isinstance(item, dict) and str(item.get("text") or "").strip()
        ]

        raw_follow_up = extraction.get("follow_up")
        follow_up = (
            PrescriptionFollowUpCandidate(**raw_follow_up)
            if isinstance(raw_follow_up, dict) and any(raw_follow_up.values())
            else None
        )
        warnings = [
            str(item).strip()
            for item in extraction.get("warnings", [])
            if str(item).strip()
        ]

        return PrescriptionPreviewResponse(
            prescription=self._shape_prescription(prescription_row),
            raw_text=raw_text,
            medications=medications,
            treatments=treatments,
            notes=notes,
            follow_up=follow_up,
            warnings=warnings,
        )

    def _ensure_prescription_feature_enabled(
        self,
        feature: PrescriptionFeatureStatus,
    ) -> None:
        if feature.enabled:
            return
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=feature.reason or "Prescription upload is unavailable in this environment.",
        )

    def _allowed_prescription_mime_types(self) -> list[str]:
        return ["image/jpeg", "image/png", "application/pdf"]

    def _format_medication_candidate(
        self,
        candidate: PrescriptionMedicationCandidate,
    ) -> str:
        parts = [candidate.name.strip()]
        if candidate.dosage:
            parts.append(candidate.dosage.strip())
        if candidate.instructions:
            parts.append(candidate.instructions.strip())
        return " ".join(part for part in parts if part)

    def _follow_up_date_to_timestamp(self, scheduled_date: str) -> str:
        return f"{scheduled_date}T09:00:00+00:00"

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
