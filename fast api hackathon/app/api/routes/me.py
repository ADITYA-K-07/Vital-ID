from fastapi import APIRouter, Depends

from app.auth.dependencies import get_current_user
from app.auth.models import CurrentUser
from app.schemas.me import MeResponse

router = APIRouter(tags=["identity"])


@router.get("/me", response_model=MeResponse)
async def get_me(current_user: CurrentUser = Depends(get_current_user)) -> MeResponse:
    return MeResponse(
        user_id=current_user.auth_user_id,
        profile_id=current_user.profile_id,
        patient_id=current_user.patient_id,
        name=current_user.name,
        email=current_user.email,
        role=current_user.role,
    )
