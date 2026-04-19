from pydantic import BaseModel, Field

from app.auth.models import UserRole


class DoctorLicenseCheckRequest(BaseModel):
    license_number: str


class DoctorLicenseCheckResponse(BaseModel):
    license_number: str
    license_verified: bool
    message: str


class SessionBootstrapRequest(BaseModel):
    role: UserRole
    full_name: str | None = None
    blood_group: str | None = None
    dob: str | None = None
    emergency_contact: str | None = None
    insurance_provider: str | None = None
    allergies: list[str] = Field(default_factory=list)
    conditions: list[str] = Field(default_factory=list)
    vaccinations: list[str] = Field(default_factory=list)
    license_number: str | None = None


class SessionBootstrapResponse(BaseModel):
    user_id: str
    profile_id: str
    patient_id: str | None = None
    vital_id: str | None = None
    name: str
    email: str
    role: UserRole
    license_number: str | None = None
    license_verified: bool = False
