from pydantic import BaseModel, Field

from app.schemas.ai import StoredAIInsightItem
from app.schemas.alerts import AlertItem


class FieldPermissions(BaseModel):
    show_allergies: bool = True
    show_medications: bool = True
    show_conditions: bool = True
    show_vitals: bool = True
    show_medical_history: bool = True
    show_treatment_history: bool = True
    show_psychological_info: bool = False
    show_emergency_contact: bool = True
    show_insurance: bool = True


class PatientProfileItem(BaseModel):
    id: str
    user_id: str | None = None
    vital_id: str | None = None
    full_name: str
    role: str = "Patient"
    age: int | None = None
    weight: int | None = None
    height: int | None = None
    blood_group: str | None = None
    allergies: list[str] = Field(default_factory=list)
    conditions: list[str] = Field(default_factory=list)
    vaccinations: list[str] = Field(default_factory=list)
    dob: str | None = None
    emergency_contact: str | None = None
    insurance_provider: str | None = None
    created_at: str | None = None


class MedicalRecordItem(BaseModel):
    id: str
    patient_id: str | None = None
    doctor_id: str | None = None
    diagnosis: str | None = None
    prescription: str | None = None
    notes: str | None = None
    visit_date: str | None = None
    created_at: str | None = None
    blood_pressure: str | None = None
    heart_rate: int | None = None
    oxygen_saturation: int | None = None
    temperature: str | None = None
    height_cm: int | None = None
    weight_kg: int | None = None
    medications: list[str] = Field(default_factory=list)


class ConsultationItem(BaseModel):
    id: str
    title: str
    scheduled_at: str
    mode: str
    status: str
    doctor_id: str | None = None
    specialist: str | None = None


class TreatmentHistoryItem(BaseModel):
    id: str
    doctor_id: str | None = None
    doctor_name: str | None = None
    specialty: str | None = None
    diagnosis: str | None = None
    treatment: str | None = None
    notes: str | None = None
    follow_up_date: str | None = None
    added_by: str | None = None
    created_at: str | None = None


class MedicalHistoryItem(BaseModel):
    id: str
    event_type: str
    title: str
    description: str | None = None
    facility: str | None = None
    doctor_name: str | None = None
    event_date: str | None = None
    added_by: str | None = None
    created_at: str | None = None


class PrescriptionFeatureStatus(BaseModel):
    enabled: bool = False
    reason: str | None = None
    max_file_size_bytes: int = 0
    allowed_mime_types: list[str] = Field(default_factory=list)


class PrescriptionDocumentItem(BaseModel):
    id: str
    patient_id: str | None = None
    original_filename: str
    mime_type: str
    size_bytes: int
    storage_bucket: str | None = None
    storage_path: str | None = None
    upload_status: str | None = None
    review_status: str | None = None
    created_at: str | None = None
    reviewed_at: str | None = None
    committed_at: str | None = None


class PrescriptionMedicationCandidate(BaseModel):
    name: str
    dosage: str | None = None
    instructions: str | None = None
    include: bool = True


class PrescriptionTreatmentCandidate(BaseModel):
    text: str
    include: bool = True


class PrescriptionNoteCandidate(BaseModel):
    text: str
    include: bool = True


class PrescriptionFollowUpCandidate(BaseModel):
    title: str | None = None
    scheduled_date: str | None = None
    provider: str | None = None
    include: bool = True


class PrescriptionPreviewResponse(BaseModel):
    prescription: PrescriptionDocumentItem
    raw_text: str
    medications: list[PrescriptionMedicationCandidate] = Field(default_factory=list)
    treatments: list[PrescriptionTreatmentCandidate] = Field(default_factory=list)
    notes: list[PrescriptionNoteCandidate] = Field(default_factory=list)
    follow_up: PrescriptionFollowUpCandidate | None = None
    warnings: list[str] = Field(default_factory=list)


class PrescriptionCommitRequest(BaseModel):
    prescription_id: str
    medications: list[PrescriptionMedicationCandidate] = Field(default_factory=list)
    treatments: list[PrescriptionTreatmentCandidate] = Field(default_factory=list)
    notes: list[PrescriptionNoteCandidate] = Field(default_factory=list)
    follow_up: PrescriptionFollowUpCandidate | None = None


class PatientDashboardResponse(BaseModel):
    profile: PatientProfileItem
    consultations: list[ConsultationItem] = Field(default_factory=list)
    medical_records: list[MedicalRecordItem] = Field(default_factory=list)
    treatment_history: list[TreatmentHistoryItem] = Field(default_factory=list)
    medical_history: list[MedicalHistoryItem] = Field(default_factory=list)
    prescriptions: list[PrescriptionDocumentItem] = Field(default_factory=list)
    prescription_feature: PrescriptionFeatureStatus = Field(default_factory=PrescriptionFeatureStatus)
    field_permissions: FieldPermissions = Field(default_factory=FieldPermissions)
    alerts: list[AlertItem] = Field(default_factory=list)
    psychological_info: str | None = None


class PatientIdentityResponse(PatientDashboardResponse):
    ai_insights: list[StoredAIInsightItem] = Field(default_factory=list)


class PatientFullProfileResponse(BaseModel):
    patient: PatientProfileItem
    medical_records: list[MedicalRecordItem] = Field(default_factory=list)
    alerts: list[AlertItem] = Field(default_factory=list)
    ai_insights: list[StoredAIInsightItem] = Field(default_factory=list)
    consultations: list[ConsultationItem] = Field(default_factory=list)
    treatment_history: list[TreatmentHistoryItem] = Field(default_factory=list)
    medical_history: list[MedicalHistoryItem] = Field(default_factory=list)
    prescriptions: list[PrescriptionDocumentItem] = Field(default_factory=list)
    prescription_feature: PrescriptionFeatureStatus = Field(default_factory=PrescriptionFeatureStatus)
    field_permissions: FieldPermissions = Field(default_factory=FieldPermissions)


class PatientIdentityUpdateRequest(BaseModel):
    full_name: str | None = None
    dob: str | None = None
    emergency_contact: str | None = None
    insurance_provider: str | None = None
    age: int | None = None
    weight: int | None = None
    height: int | None = None
    blood_group: str | None = None
    allergies: list[str] = Field(default_factory=list)
    conditions: list[str] = Field(default_factory=list)
    vaccinations: list[str] = Field(default_factory=list)
    blood_pressure: str | None = None
    heart_rate: int | None = None
    oxygen_saturation: int | None = None
    temperature: str | None = None
    height_cm: int | None = None
    weight_kg: int | None = None
    medications: list[str] = Field(default_factory=list)
    diagnosis: str | None = None
    prescription: str | None = None
    notes: str | None = None


class DoctorDiagnosisCreateRequest(BaseModel):
    diagnosis: str


class DoctorTreatmentCreateRequest(BaseModel):
    treatment: str


class PatientTreatmentHistoryCreateRequest(BaseModel):
    diagnosis: str
    specialty: str | None = None
    treatment: str | None = None
    notes: str | None = None
    follow_up_date: str | None = None
    doctor_name: str | None = None


class PatientMedicalHistoryCreateRequest(BaseModel):
    event_type: str = "Diagnosis"
    title: str
    description: str | None = None
    facility: str | None = None
    doctor_name: str | None = None
    event_date: str
