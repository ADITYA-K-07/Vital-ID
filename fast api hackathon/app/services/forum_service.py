from fastapi import HTTPException, status

from app.auth.models import CurrentUser
from app.ai.provider import ClinicalAIProvider
from app.db.case_repository import CaseRepository
from app.db.comment_repository import CommentRepository
from app.db.supabase import SupabaseDataClient
from app.db.user_repository import UserRepository
from app.schemas.forum import (
    ForumCaseCreateRequest,
    ForumCaseItem,
    ForumCaseMatchResponse,
    ForumCasesResponse,
    ForumCommentCreateRequest,
    ForumCommentItem,
    ForumCommentsResponse,
)


class ForumService:
    def __init__(
        self,
        case_repository: CaseRepository,
        comment_repository: CommentRepository,
        user_repository: UserRepository,
        provider: ClinicalAIProvider,
    ) -> None:
        self.case_repository = case_repository
        self.comment_repository = comment_repository
        self.user_repository = user_repository
        self.provider = provider

    async def list_cases(
        self,
        *,
        data_client: SupabaseDataClient,
    ) -> ForumCasesResponse:
        cases = await self.case_repository.list_cases(data_client=data_client)
        profiles = await self.user_repository.get_profiles_by_ids(
            data_client=data_client,
            profile_ids=[case.get("doctor_id") for case in cases if case.get("doctor_id")],
        )
        profile_map = {profile["id"]: profile for profile in profiles}
        return ForumCasesResponse(
            cases=[
                ForumCaseItem(
                    id=str(case["id"]),
                    doctor_id=case.get("doctor_id") or "",
                    author_name=(profile_map.get(case.get("doctor_id"), {}) or {}).get("full_name") or "Verified clinician",
                    title=case.get("title") or "Untitled case",
                    symptoms=case.get("symptoms"),
                    description=case.get("description") or "",
                    specialty=case.get("specialty"),
                    status=case.get("status") or "Shared",
                    created_at=case.get("created_at"),
                )
                for case in cases
            ]
        )

    async def create_case(
        self,
        *,
        current_user: CurrentUser,
        data_client: SupabaseDataClient,
        payload: ForumCaseCreateRequest,
    ) -> ForumCaseItem:
        created = await self.case_repository.create_case(
            data_client=data_client,
            payload={
                "doctor_id": current_user.profile_id,
                "title": payload.title,
                "symptoms": payload.symptoms,
                "description": payload.description,
                "specialty": payload.specialty,
                "status": payload.status,
            },
        )
        if not created:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Unable to create case.",
            )

        return ForumCaseItem(
            id=str(created["id"]),
            doctor_id=current_user.profile_id,
            author_name=current_user.name,
            title=created.get("title") or payload.title,
            symptoms=created.get("symptoms"),
            description=created.get("description") or payload.description,
            specialty=created.get("specialty") or payload.specialty,
            status=created.get("status") or payload.status,
            created_at=created.get("created_at"),
        )

    async def list_comments(
        self,
        *,
        data_client: SupabaseDataClient,
        case_id: str,
    ) -> ForumCommentsResponse:
        comments = await self.comment_repository.list_comments(data_client=data_client, case_id=case_id)
        profiles = await self.user_repository.get_profiles_by_ids(
            data_client=data_client,
            profile_ids=[comment.get("doctor_id") for comment in comments if comment.get("doctor_id")],
        )
        profile_map = {profile["id"]: profile for profile in profiles}
        return ForumCommentsResponse(
            comments=[
                ForumCommentItem(
                    id=str(comment["id"]),
                    case_id=comment.get("case_id") or case_id,
                    doctor_id=comment.get("doctor_id") or "",
                    author_name=(profile_map.get(comment.get("doctor_id"), {}) or {}).get("full_name") or "Verified clinician",
                    comment=comment.get("comment") or "",
                    created_at=comment.get("created_at"),
                )
                for comment in comments
            ]
        )

    async def create_comment(
        self,
        *,
        current_user: CurrentUser,
        data_client: SupabaseDataClient,
        case_id: str,
        payload: ForumCommentCreateRequest,
    ) -> ForumCommentItem:
        case = await self.case_repository.get_case_by_id(data_client=data_client, case_id=case_id)
        if not case:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Case not found.",
            )

        created = await self.comment_repository.create_comment(
            data_client=data_client,
            payload={
                "case_id": case_id,
                "doctor_id": current_user.profile_id,
                "comment": payload.comment,
            },
        )
        if not created:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Unable to create comment.",
            )

        return ForumCommentItem(
            id=str(created["id"]),
            case_id=case_id,
            doctor_id=current_user.profile_id,
            author_name=current_user.name,
            comment=created.get("comment") or payload.comment,
            created_at=created.get("created_at"),
        )

    async def match_case(
        self,
        *,
        payload: ForumCaseCreateRequest,
    ) -> ForumCaseMatchResponse:
        return await self.provider.match_forum_case(
            title=payload.title,
            specialty=payload.specialty or "General Medicine",
            description=payload.description,
        )
