import threading
from typing import Optional
from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel

from config import settings
from messaging.consumer import (
    handle_worker_cv_submitted,
    handle_claim_filed,
    handle_worker_claim_response,
)

router = APIRouter(prefix="/api/internal/events", tags=["Internal Events"])


def _verify_key(key: Optional[str]) -> None:
    if not settings.internal_api_key or key != settings.internal_api_key:
        raise HTTPException(status_code=403, detail="Invalid internal API key")


class WorkerCvSubmittedRequest(BaseModel):
    workerId: str


class ClaimFiledRequest(BaseModel):
    claimId: str
    projectId: str
    workerId: str


class WorkerClaimResponseRequest(BaseModel):
    claimId: str
    workerId: str


@router.post("/worker-cv-submitted")
def worker_cv_submitted(
    body: WorkerCvSubmittedRequest,
    x_internal_key: Optional[str] = Header(None, alias="X-Internal-Key"),
):
    _verify_key(x_internal_key)
    threading.Thread(
        target=handle_worker_cv_submitted, args=(body.workerId,), daemon=True
    ).start()
    return {"status": "accepted"}


@router.post("/claim-filed")
def claim_filed(
    body: ClaimFiledRequest,
    x_internal_key: Optional[str] = Header(None, alias="X-Internal-Key"),
):
    _verify_key(x_internal_key)
    payload = f"{body.claimId}:{body.projectId}:{body.workerId}"
    threading.Thread(target=handle_claim_filed, args=(payload,), daemon=True).start()
    return {"status": "accepted"}


@router.post("/worker-claim-response")
def worker_claim_response(
    body: WorkerClaimResponseRequest,
    x_internal_key: Optional[str] = Header(None, alias="X-Internal-Key"),
):
    _verify_key(x_internal_key)
    payload = f"{body.claimId}:{body.workerId}"
    threading.Thread(
        target=handle_worker_claim_response, args=(payload,), daemon=True
    ).start()
    return {"status": "accepted"}
