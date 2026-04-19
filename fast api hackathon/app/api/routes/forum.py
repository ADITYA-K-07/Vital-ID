from fastapi import APIRouter, Depends

from app.auth.dependencies import require_roles
from app.auth.models import CurrentUser, UserRole
from app.db.supabase import SupabaseDataClient, get_request_data_client
from app.schemas.forum import (
    ForumCaseCreateRequest,
    ForumCaseItem,
    ForumCasesResponse,
    ForumCommentCreateRequest,
    ForumCommentItem,
    ForumCommentsResponse,
)
from app.services.dependencies import get_forum_service
from app.services.forum_service import ForumService

router = APIRouter(tags=["forum"])


@router.get("/forum/cases", response_model=ForumCasesResponse)
async def list_cases(
    current_user: CurrentUser = Depends(require_roles(UserRole.DOCTOR)),
    data_client: SupabaseDataClient = Depends(get_request_data_client),
    forum_service: ForumService = Depends(get_forum_service),
) -> ForumCasesResponse:
    return await forum_service.list_cases(data_client=data_client)


@router.post("/forum/cases", response_model=ForumCaseItem)
async def create_case(
    payload: ForumCaseCreateRequest,
    current_user: CurrentUser = Depends(require_roles(UserRole.DOCTOR)),
    data_client: SupabaseDataClient = Depends(get_request_data_client),
    forum_service: ForumService = Depends(get_forum_service),
) -> ForumCaseItem:
    return await forum_service.create_case(
        current_user=current_user,
        data_client=data_client,
        payload=payload,
    )


@router.get("/forum/cases/{case_id}/comments", response_model=ForumCommentsResponse)
async def list_comments(
    case_id: str,
    current_user: CurrentUser = Depends(require_roles(UserRole.DOCTOR)),
    data_client: SupabaseDataClient = Depends(get_request_data_client),
    forum_service: ForumService = Depends(get_forum_service),
) -> ForumCommentsResponse:
    return await forum_service.list_comments(
        data_client=data_client,
        case_id=case_id,
    )


@router.post("/forum/cases/{case_id}/comments", response_model=ForumCommentItem)
async def create_comment(
    case_id: str,
    payload: ForumCommentCreateRequest,
    current_user: CurrentUser = Depends(require_roles(UserRole.DOCTOR)),
    data_client: SupabaseDataClient = Depends(get_request_data_client),
    forum_service: ForumService = Depends(get_forum_service),
) -> ForumCommentItem:
    return await forum_service.create_comment(
        current_user=current_user,
        data_client=data_client,
        case_id=case_id,
        payload=payload,
    )
