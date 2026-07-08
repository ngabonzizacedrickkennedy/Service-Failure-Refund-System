from groq_client import chat_json
from models import WorkerRating
from sqlalchemy.orm import Session
import json
from datetime import datetime


def rate_worker(data: dict, db: Session) -> WorkerRating:
    specialization = data.get('specialization', 'Not specified')
    credentials = data.get('additional_credentials') or 'None provided'

    prompt = f"""You are an AI evaluator for a professional service platform called SSFRS (Smart Service Failure Refund System).
Analyze this worker profile and generate a fair, strict rating.

WORKER PROFILE:
- Declared Specialization / Job Title: {specialization}
- Years of Experience: {data.get('years_of_experience', 0)} years
- CV Content / Credentials: {credentials}
- Successfully Completed Projects on platform: {data.get('completed_projects', 0)}
- Past Failures / Claims Filed Against Them: {data.get('past_failures', 0)}

━━━ STEP 1: SPECIALIZATION ALIGNMENT CHECK (do this first) ━━━
Read the CV Content carefully and determine whether it genuinely describes someone working in "{specialization}".
Ask yourself: Does this CV describe skills, tools, tasks, projects, or training that belong to a "{specialization}" professional?

Classify the match as one of:
  • STRONG MATCH   — CV content clearly belongs to "{specialization}" (cv_score: 6.0–10.0)
  • PARTIAL MATCH  — CV content is loosely related or in the same general industry (cv_score: 3.0–5.9)
  • MISMATCH       — CV content describes a completely different profession (cv_score: 0.0–2.0)
  • NO CV PROVIDED — credentials field is empty or says "None provided" (cv_score: 2.5)

Examples of MISMATCH (these must score 0.0–2.0):
  - Declared: "Software Engineer", CV contains: bricklaying, concrete, construction site work
  - Declared: "Plumber", CV contains: graphic design, Photoshop, UI/UX portfolios
  - Declared: "Electrician", CV contains: accounting, bookkeeping, tax filing
  - Declared: "Chef", CV contains: Python programming, backend APIs, DevOps

━━━ STEP 2: SCORE ALL CRITERIA ━━━
After the alignment check, score each of the following (0.0 to 10.0):

1. cv_score         — Reflects BOTH alignment (Step 1 result) AND depth/quality of credentials within the specialization.
                      A MISMATCH caps this at 2.0 regardless of how detailed the CV is.
2. experience_score — Years of professional experience declared (assume it's in the declared field).
3. projects_score   — Number of successfully completed projects on the platform.
4. ratings_score    — Estimated client satisfaction proxy (use completed vs failure ratio).
5. failure_score    — Starts at 10.0, subtract 1.5 per past failure (minimum 0.0).

OVERALL SCORE formula (weighted):
overall = (cv_score * 0.20) + (experience_score * 0.25) + (projects_score * 0.25) + (ratings_score * 0.15) + (failure_score * 0.15)

━━━ STEP 3: WRITE REASONING ━━━
Address the worker directly (second-person "you / your").
- If MISMATCH: Lead with this as the critical issue. Be direct but professional.
- If STRONG/PARTIAL match: Summarise what is good and what could be improved.
- Always end with a specific, actionable recommendation.
- Length: 3–5 sentences.

Respond ONLY with valid JSON, no markdown, no explanation outside JSON:
{{
  "cv_score": <float 0-10>,
  "experience_score": <float 0-10>,
  "projects_score": <float 0-10>,
  "ratings_score": <float 0-10>,
  "failure_score": <float 0-10>,
  "overall_score": <float 0-10>,
  "reasoning": "<3-5 sentences addressed to the worker>"
}}"""

    result = chat_json(prompt)

    existing = db.query(WorkerRating).filter(WorkerRating.worker_id == data["worker_id"]).first()
    if existing:
        existing.cv_score = result["cv_score"]
        existing.experience_score = result["experience_score"]
        existing.projects_score = result["projects_score"]
        existing.ratings_score = result["ratings_score"]
        existing.failure_score = result["failure_score"]
        existing.overall_score = result["overall_score"]
        existing.reasoning = result["reasoning"]
        existing.completed_projects = data.get("completed_projects", existing.completed_projects)
        existing.past_failures = data.get("past_failures", existing.past_failures)
        existing.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(existing)
        return existing
    else:
        rating = WorkerRating(
            worker_id=data["worker_id"],
            worker_name=data.get("worker_name", ""),
            worker_email=data.get("worker_email", ""),
            specialization=data.get("specialization", ""),
            cv_score=result["cv_score"],
            experience_score=result["experience_score"],
            projects_score=result["projects_score"],
            ratings_score=result["ratings_score"],
            failure_score=result["failure_score"],
            overall_score=result["overall_score"],
            reasoning=result["reasoning"],
            completed_projects=data.get("completed_projects", 0),
            past_failures=data.get("past_failures", 0),
        )
        db.add(rating)
        db.commit()
        db.refresh(rating)
        return rating


def get_rating(worker_id: str, db: Session) -> WorkerRating | None:
    return db.query(WorkerRating).filter(WorkerRating.worker_id == worker_id).first()


def apply_failure_penalty(worker_id: str, severity: str, db: Session) -> WorkerRating | None:
    rating = get_rating(worker_id, db)
    if not rating:
        return None

    penalty = 2.0 if severity == "SEVERE" else 1.5
    rating.failure_score = max(0.0, rating.failure_score - penalty)
    rating.past_failures += 1
    rating.overall_score = (
        rating.cv_score * 0.20
        + rating.experience_score * 0.25
        + rating.projects_score * 0.25
        + rating.ratings_score * 0.15
        + rating.failure_score * 0.15
    )
    rating.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(rating)
    return rating
