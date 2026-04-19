from fastapi import APIRouter, Depends

from app.auth.dependencies import require_roles
from app.auth.models import CurrentUser, UserRole
from app.db.supabase import SupabaseDataClient, get_request_data_client
from app.schemas.notes import NotesAnalyzeRequest, NotesAnalyzeResponse
from app.services.dependencies import get_notes_service
from app.services.notes_service import NotesService

router = APIRouter(tags=["notes"])


@router.post("/notes/analyze", response_model=NotesAnalyzeResponse)
async def analyze_notes(
    payload: NotesAnalyzeRequest,
    current_user: CurrentUser = Depends(require_roles(UserRole.DOCTOR)),
    data_client: SupabaseDataClient = Depends(get_request_data_client),
    notes_service: NotesService = Depends(get_notes_service),
) -> NotesAnalyzeResponse:
    return await notes_service.analyze_notes(
        current_user=current_user,
        data_client=data_client,
        payload=payload,
    )
