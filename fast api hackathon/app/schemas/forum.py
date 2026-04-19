from pydantic import BaseModel, Field


class ForumCaseCreateRequest(BaseModel):
    title: str
    symptoms: str | None = None
    description: str
    specialty: str | None = None
    status: str = "Shared"


class ForumCaseItem(BaseModel):
    id: str
    doctor_id: str
    author_name: str
    title: str
    symptoms: str | None = None
    description: str
    specialty: str | None = None
    status: str = "Shared"
    created_at: str | None = None


class ForumCasesResponse(BaseModel):
    cases: list[ForumCaseItem] = Field(default_factory=list)


class ForumCommentCreateRequest(BaseModel):
    comment: str


class ForumCommentItem(BaseModel):
    id: str
    case_id: str
    doctor_id: str
    author_name: str
    comment: str
    created_at: str | None = None


class ForumCommentsResponse(BaseModel):
    comments: list[ForumCommentItem] = Field(default_factory=list)


class ForumMatchedDoctorItem(BaseModel):
    name: str
    specialty: str
    hospital: str
    country: str
    reason: str


class ForumSimilarCaseItem(BaseModel):
    case_id: str
    title: str
    specialty: str
    description: str
    resolution: str


class ForumCaseMatchResponse(BaseModel):
    matched_doctors: list[ForumMatchedDoctorItem] = Field(default_factory=list)
    similar_cases: list[ForumSimilarCaseItem] = Field(default_factory=list)
