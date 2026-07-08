import json
from datetime import datetime, timedelta
from groq_client import chat_json
from models import WorkerRating, ProjectMatchCache
from sqlalchemy.orm import Session

CACHE_TTL_MINUTES = 30


def _get_cached(project_id: str, db: Session) -> list[dict] | None:
    cached = db.query(ProjectMatchCache).filter(ProjectMatchCache.project_id == project_id).first()
    if cached and (datetime.utcnow() - cached.created_at) < timedelta(minutes=CACHE_TTL_MINUTES):
        print(f"[Matching] Cache hit for project {project_id} (age: {int((datetime.utcnow() - cached.created_at).total_seconds() / 60)}min)")
        return json.loads(cached.result_json)
    return None


def _store_cache(project_id: str, result: list[dict], db: Session):
    existing = db.query(ProjectMatchCache).filter(ProjectMatchCache.project_id == project_id).first()
    if existing:
        existing.result_json = json.dumps(result)
        existing.created_at = datetime.utcnow()
    else:
        db.add(ProjectMatchCache(project_id=project_id, result_json=json.dumps(result)))
    db.commit()


def invalidate_cache(project_id: str, db: Session):
    db.query(ProjectMatchCache).filter(ProjectMatchCache.project_id == project_id).delete()
    db.commit()


def _score_based_fallback(enriched: list[dict]) -> list[dict]:
    """Rank workers by their stored AI rating when Groq is unavailable."""
    output = [
        {
            "worker_id": w["worker_id"],
            "worker_name": w["worker_name"],
            "worker_email": w["worker_email"],
            "specialization": w["specialization"],
            "years_of_experience": w["years_of_experience"],
            "rating_score": w["ai_overall_score"],
            "match_score": round(w["ai_overall_score"] * 10, 2),
            "match_reasoning": "Ranked by AI rating score (AI matching temporarily unavailable).",
        }
        for w in enriched
    ]
    output.sort(key=lambda x: x["match_score"], reverse=True)
    return [w for w in output if w["match_score"] > 15]


def rank_candidates(project: dict, workers: list[dict], db: Session) -> list[dict]:
    if not workers:
        return []

    project_id = project.get("project_id")

    cached = _get_cached(project_id, db) if project_id else None
    if cached is not None:
        return cached

    enriched = []
    for w in workers:
        stored = db.query(WorkerRating).filter(WorkerRating.worker_id == w["worker_id"]).first()
        ai_score = stored.overall_score if stored else w.get("rating_score", 0.0)
        enriched.append({**w, "ai_overall_score": ai_score})

    workers_text = "\n".join([
        f"  Worker {i+1}: ID={w['worker_id']}, Name={w['worker_name']}, "
        f"Specialization={w['specialization']}, "
        f"Experience={w['years_of_experience']} years, "
        f"AI Overall Rating={w['ai_overall_score']:.2f}/10, "
        f"Credentials={w.get('additional_credentials') or 'None'}"
        for i, w in enumerate(enriched)
    ])

    prompt = f"""You are an AI matching engine for SSFRS — a professional service platform.
Your task is to rank workers for a project based on field relevance and quality.

PROJECT:
- Title: {project.get('title')}
- Required Skills: {project.get('required_skills')}
- Scope of Work: {project.get('scope_of_work')}

AVAILABLE WORKERS:
{workers_text}

STRICT RULES:
1. ONLY include workers whose specialization directly matches the project field. A software/IT worker must NOT appear for a construction project. A construction worker must NOT appear for a software project. Apply this rule firmly across all industries.
2. For workers who DO match the field, rank them by: specialization fit (most important), AI Overall Rating, years of experience, credentials.
3. Assign match_score 0 to any worker whose specialization is unrelated to the project field — they will be excluded.

Respond ONLY with valid JSON, no markdown:
{{
  "ranked_workers": [
    {{
      "worker_id": "<id>",
      "match_score": <0-100 float>,
      "match_reasoning": "<one clear sentence explaining the match or exclusion>"
    }}
  ]
}}

Only list workers who are relevant to this project."""

    try:
        result = chat_json(prompt, max_tokens=2000)
        ranked_ids = {r["worker_id"]: r for r in result.get("ranked_workers", [])}

        output = []
        for w in enriched:
            rank_info = ranked_ids.get(w["worker_id"], {
                "match_score": w["ai_overall_score"] * 10,
                "match_reasoning": "Ranked by AI rating score."
            })
            output.append({
                "worker_id": w["worker_id"],
                "worker_name": w["worker_name"],
                "worker_email": w["worker_email"],
                "specialization": w["specialization"],
                "years_of_experience": w["years_of_experience"],
                "rating_score": w["ai_overall_score"],
                "match_score": float(rank_info.get("match_score", 0)),
                "match_reasoning": rank_info.get("match_reasoning", ""),
            })

        output.sort(key=lambda x: x["match_score"], reverse=True)
        filtered = [w for w in output if w["match_score"] > 15]

        if project_id:
            _store_cache(project_id, filtered, db)

        return filtered

    except Exception as e:
        print(f"[Matching] Groq unavailable for project {project_id}, using fallback ranking: {type(e).__name__}")
        # Don't cache fallback results — retry Groq on the next request once quota restores
        return _score_based_fallback(enriched)
