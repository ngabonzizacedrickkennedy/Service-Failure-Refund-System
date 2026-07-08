from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from schemas import RankCandidatesRequest, RankCandidatesResponse, RankedCandidate
from services import matching_service
from messaging.producer import publish_event

router = APIRouter(prefix="/api/ai/matching", tags=["Matching"])


@router.post("/rank-candidates", response_model=RankCandidatesResponse)
def rank_candidates(request: RankCandidatesRequest, db: Session = Depends(get_db)):
    try:
        project = {
            "project_id": request.project_id,
            "title": request.title,
            "scope_of_work": request.scope_of_work,
            "required_skills": request.required_skills,
        }
        workers = [w.model_dump() for w in request.workers]
        ranked = matching_service.rank_candidates(project, workers, db)

        candidates = [
            RankedCandidate(
                worker_id=r["worker_id"],
                worker_name=r["worker_name"],
                worker_email=r["worker_email"],
                specialization=r["specialization"],
                years_of_experience=r["years_of_experience"],
                rating_score=r["rating_score"],
                match_score=r["match_score"],
                match_reasoning=r["match_reasoning"],
            )
            for r in ranked
        ]

        publish_event("ranked-candidate-list-produced", request.project_id)
        return RankCandidatesResponse(project_id=request.project_id, ranked_workers=candidates)
    except Exception as e:
        print(f"[Matching] rank-candidates failed for project {request.project_id}: {type(e).__name__}: {e}")
        return RankCandidatesResponse(project_id=request.project_id, ranked_workers=[])
