import re

from fastapi import HTTPException, status

from app.auth.models import CurrentUser, UserRole
from app.db.patient_repository import PatientRepository
from app.db.supabase import SupabaseAuthGateway, SupabaseDataClient
from app.db.user_repository import UserRepository
from app.schemas.auth import (
    DoctorLicenseCheckResponse,
    SessionBootstrapRequest,
    SessionBootstrapResponse,
)


class AuthService:
    def __init__(
        self,
        auth_gateway: SupabaseAuthGateway,
        user_repository: UserRepository,
        patient_repository: PatientRepository,
    ) -> None:
        self.auth_gateway = auth_gateway
        self.user_repository = user_repository
        self.patient_repository = patient_repository

    async def authenticate(self, *, access_token: str, data_client: SupabaseDataClient) -> CurrentUser:
        auth_user = await self.auth_gateway.get_user(access_token)
        profile = await self.user_repository.get_profile_by_auth_user_id(
            data_client=data_client,
            auth_user_id=auth_user["id"],
        )

        role_value = (
            (profile or {}).get("role")
            or (auth_user.get("app_metadata") or {}).get("role")
            or (auth_user.get("user_metadata") or {}).get("role")
            or ""
        ).lower()
        if role_value not in {UserRole.PATIENT.value, UserRole.DOCTOR.value}:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User role is missing or unsupported.",
            )

        patient = None
        if role_value == UserRole.PATIENT.value:
            patient = await self.patient_repository.get_patient_by_user_id(
                data_client=data_client,
                user_id=(profile or {}).get("id") or auth_user["id"],
            )

        display_name = (
            (profile or {}).get("full_name")
            or (auth_user.get("user_metadata") or {}).get("name")
            or auth_user.get("email")
            or "User"
        )

        return CurrentUser(
            auth_user_id=auth_user["id"],
            profile_id=(profile or {}).get("id") or auth_user["id"],
            patient_id=patient.get("id") if patient else None,
            vital_id=patient.get("vital_id") if patient else None,
            name=display_name,
            email=auth_user.get("email") or "",
            role=UserRole(role_value),
            license_number=(profile or {}).get("license_number"),
            license_verified=bool((profile or {}).get("license_verified")),
            access_token=access_token,
            raw_claims=auth_user,
        )

    async def check_doctor_license(
        self,
        *,
        license_number: str,
    ) -> DoctorLicenseCheckResponse:
        normalized = self.normalize_license_number(license_number)
        if not self.is_valid_license_number(normalized):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Enter a valid licence number, for example MED-20458.",
            )

        return DoctorLicenseCheckResponse(
            license_number=normalized,
            license_verified=True,
            message="Licence number verified. Doctor access is unlocked.",
        )

    async def bootstrap_session(
        self,
        *,
        current_user: CurrentUser,
        payload: SessionBootstrapRequest,
        data_client: SupabaseDataClient,
        service_data_client: SupabaseDataClient | None,
    ) -> SessionBootstrapResponse:
        if payload.role != current_user.role:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Bootstrap role must match the authenticated user's role.",
            )

        if service_data_client is None:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=(
                    "Session bootstrap requires FastAPI to load a valid "
                    "SUPABASE_SERVICE_ROLE_KEY at runtime. Start the backend "
                    "with its own .env file (for this repo, fast api hackathon/.env) "
                    "or export the key before registering users."
                ),
            )

        write_client = service_data_client
        auth_claims = current_user.raw_claims
        metadata = auth_claims.get("user_metadata") or {}

        full_name = (
            payload.full_name
            or metadata.get("name")
            or current_user.name
            or current_user.email
        )
        profile_payload = {
            "id": current_user.auth_user_id,
            "role": current_user.role.value,
            "full_name": full_name,
        }

        if current_user.role == UserRole.DOCTOR:
            if not payload.license_number:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Doctor licence number is required.",
                )
            license_result = await self.check_doctor_license(
                license_number=payload.license_number,
            )
            profile_payload["license_number"] = license_result.license_number
            profile_payload["license_verified"] = license_result.license_verified
        else:
            profile_payload["license_number"] = None
            profile_payload["license_verified"] = False

        profile = await self.patient_repository.upsert_profile(
            data_client=write_client,
            payload=profile_payload,
        )
        if not profile:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Unable to provision the user profile.",
            )

        patient = None
        if current_user.role == UserRole.PATIENT:
            patient = await self.patient_repository.get_patient_by_user_id(
                data_client=data_client,
                user_id=current_user.auth_user_id,
            )
            patient_payload = {
                "user_id": current_user.auth_user_id,
                "vital_id": patient.get("vital_id") if patient else self._generate_vital_id(current_user.auth_user_id),
                "blood_group": payload.blood_group,
                "dob": payload.dob,
                "emergency_contact": payload.emergency_contact,
                "insurance_provider": payload.insurance_provider,
                "allergies": payload.allergies or None,
                "conditions": payload.conditions or None,
                "vaccinations": payload.vaccinations or None,
            }
            patient_payload = {
                key: value
                for key, value in patient_payload.items()
                if value is not None
            }

            if patient:
                patient = await self.patient_repository.update_patient(
                    data_client=write_client,
                    patient_id=patient["id"],
                    payload=patient_payload,
                )
            else:
                patient = await self.patient_repository.create_patient(
                    data_client=write_client,
                    payload=patient_payload,
                )

            if not patient:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Unable to provision the patient record.",
                )

        refreshed = await self.authenticate(
            access_token=current_user.access_token,
            data_client=data_client,
        )
        return SessionBootstrapResponse(
            user_id=refreshed.auth_user_id,
            profile_id=refreshed.profile_id,
            patient_id=refreshed.patient_id,
            vital_id=refreshed.vital_id,
            name=refreshed.name,
            email=refreshed.email,
            role=refreshed.role,
            license_number=refreshed.license_number,
            license_verified=refreshed.license_verified,
        )

    def normalize_license_number(self, value: str) -> str:
        return re.sub(r"\s+", "", value.strip().upper())

    def is_valid_license_number(self, value: str) -> bool:
        return bool(re.fullmatch(r"[A-Z]{2,6}-?\d{4,10}", value))

    def _generate_vital_id(self, seed: str) -> str:
        normalized = "".join(ch for ch in seed.upper() if ch.isalnum())
        suffix = (normalized[-8:] or "PATIENT").rjust(8, "0")
        return f"VID-{suffix}"
