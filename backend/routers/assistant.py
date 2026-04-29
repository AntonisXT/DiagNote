from fastapi import APIRouter, Depends, Header
from fastapi_clerk_auth import HTTPAuthorizationCredentials  # type: ignore

from backend.dependencies import clerk_guard
from backend.schemas import AssistantIn
from backend.services import llm_service

router = APIRouter(prefix="/api", tags=["assistant"])


@router.post("/assistant")
def global_assistant(
    data: AssistantIn,
    creds: HTTPAuthorizationCredentials = Depends(clerk_guard),
    x_openai_key: str | None = Header(default=None),
):
    messages = [{"role": m.role, "content": m.content} for m in data.messages]
    return llm_service.stream_assistant(messages, api_key=x_openai_key)
