from pydantic import BaseModel, Field

from app.schemas.ai import UrgencyLevel


class DemoAnalyzeRequest(BaseModel):
    patient_name: str = Field(default="Rahul Mehta", min_length=1, max_length=120)
    age: int = Field(default=62, ge=0, le=120)
    diagnosis: str = Field(default="Hypertension", max_length=240)
    notes: str = Field(
        default="Patient reports dizziness and shortness of breath for two days after a blood pressure spike.",
        max_length=2000,
    )
    doctor_notes: str = Field(
        default="Schedule cardiology review if symptoms persist and verify home monitoring logs.",
        max_length=2000,
    )
    alert_message: str | None = Field(
        default="Home BP upload crossed the configured threshold.",
        max_length=500,
    )
    alert_severity: UrgencyLevel = UrgencyLevel.HIGH
    has_prescriptions: bool = True
    medication_name: str = Field(default="Amlodipine 5 mg", max_length=240)
