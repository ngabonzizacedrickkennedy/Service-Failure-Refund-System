import json
import threading
from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.orm import Session
from config import settings
from database import get_db
from messaging.consumer import handle_worker_cv_submitted
from schemas import WorkerRateRequest, WorkerRatingResponse, PenalizeWorkerRequest
from services import rating_service
from messaging.producer import publish_event
from redis_cache import cache_get, cache_set, cache_delete

router = APIRouter(prefix="/api/ai/rating", tags=["Rating"])

_RATING_TTL = 600  # 10 minutes


@router.post("/internal/rate-cv/{worker_id}", status_code=202)
def trigger_cv_rating(
    worker_id: str,
    x_internal_key: str = Header(...),
):
    """Called directly by the Java service after a CV is saved. Triggers rating in background."""
    if x_internal_key != settings.internal_api_key:
        raise HTTPException(status_code=403, detail="Forbidden")
    threading.Thread(
        target=handle_worker_cv_submitted,
        args=(worker_id,),
        daemon=True,
    ).start()
    print(f"[AI HTTP] CV rating triggered for worker {worker_id}")
    return {"message": "Rating triggered", "worker_id": worker_id}


@router.post("/rate-worker", response_model=WorkerRatingResponse)
def rate_worker(request: WorkerRateRequest, db: Session = Depends(get_db)):
    try:
        rating = rating_service.rate_worker(request.model_dump(), db)
        # Refresh the cache entry for this worker after re-rating
        cache_delete(f"rating:{rating.worker_id}")
        publish_event("worker-rating-generated", f"{rating.worker_id}:{rating.overall_score:.2f}")
        return WorkerRatingResponse(
            worker_id=rating.worker_id,
            worker_name=rating.worker_name,
            specialization=rating.specialization,
            cv_score=rating.cv_score,
            experience_score=rating.experience_score,
            projects_score=rating.projects_score,
            ratings_score=rating.ratings_score,
            failure_score=rating.failure_score,
            overall_score=rating.overall_score,
            reasoning=rating.reasoning or "",
            completed_projects=rating.completed_projects,
            past_failures=rating.past_failures,
            updated_at=rating.updated_at,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/worker/{worker_id}", response_model=WorkerRatingResponse)
def get_worker_rating(worker_id: str, db: Session = Depends(get_db)):
    cached = cache_get(f"rating:{worker_id}")
    if cached:
        return WorkerRatingResponse(**cached)

    rating = rating_service.get_rating(worker_id, db)
    if not rating:
        raise HTTPException(status_code=404, detail="No AI rating found for this worker.")

    response = WorkerRatingResponse(
        worker_id=rating.worker_id,
        worker_name=rating.worker_name,
        specialization=rating.specialization,
        cv_score=rating.cv_score,
        experience_score=rating.experience_score,
        projects_score=rating.projects_score,
        ratings_score=rating.ratings_score,
        failure_score=rating.failure_score,
        overall_score=rating.overall_score,
        reasoning=rating.reasoning or "",
        completed_projects=rating.completed_projects,
        past_failures=rating.past_failures,
        updated_at=rating.updated_at,
    )
    cache_set(f"rating:{worker_id}", json.loads(response.model_dump_json()), ttl=_RATING_TTL)
    return response


@router.post("/penalize")
def penalize_worker(request: PenalizeWorkerRequest, db: Session = Depends(get_db)):
    rating = rating_service.apply_failure_penalty(request.worker_id, request.severity, db)
    if not rating:
        raise HTTPException(status_code=404, detail="Worker rating not found.")
    # Invalidate cache so the next GET returns updated score
    cache_delete(f"rating:{request.worker_id}")
    publish_event("failure-penalty-applied", f"{request.worker_id}:{request.claim_id}")
    return {"message": "Penalty applied.", "new_overall_score": rating.overall_score}
