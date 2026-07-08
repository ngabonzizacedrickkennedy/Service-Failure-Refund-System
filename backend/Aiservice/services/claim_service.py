import json
from groq_client import chat_json
from models import MediationReport
from sqlalchemy.orm import Session
from datetime import datetime


def mediate_claim(data: dict, db: Session) -> MediationReport:
    geo_text = (
        f"Geotagged photo evidence was submitted. Location verification result: {data['geolocation_summary']}"
        if data.get("geolocation_summary")
        else "No geotagged photo evidence was submitted with this claim."
    )

    worker_response_text = (
        data["worker_response"]
        if data.get("worker_response")
        else "The worker has not yet submitted a formal response to this claim."
    )

    prompt = f"""You are an impartial AI mediator for SSFRS (Smart Service Failure Refund System), a professional service platform.
Your role is to analyse a project failure dispute and produce a fair, evidence-based mediation report.

DISPUTE OVERVIEW:
Project Title: {data.get('project_title', 'Unknown')}
Required Skills: {data.get('required_skills', 'Not specified')}
Project Budget: ${data.get('budget', 0):,.2f}

PROJECT PROVIDER'S CLAIM (why they are requesting a refund):
{data.get('description')}

WORKER'S FORMAL RESPONSE:
{worker_response_text}

GEOLOCATION EVIDENCE:
{geo_text}

ANALYSIS INSTRUCTIONS:
1. Identify the core dispute and who bears responsibility
2. Evaluate the credibility of both parties
3. Consider the geolocation evidence if present
4. Note if the worker's response acknowledges, disputes, or ignores the claim
5. Make a clear recommendation

Respond ONLY with valid JSON, no markdown:
{{
  "analysis": "<detailed neutral analysis of the situation — 3-5 sentences>",
  "recommendation": "<APPROVE|REJECT|NEEDS_MORE_INFO>",
  "reasoning": "<clear explanation for the recommendation — 2-3 sentences>",
  "key_findings": ["<finding 1>", "<finding 2>", "<finding 3>"],
  "confidence_score": <0-100>
}}"""

    result = chat_json(prompt, max_tokens=1500)

    existing = db.query(MediationReport).filter(MediationReport.claim_id == data["claim_id"]).first()
    if existing:
        existing.analysis = result["analysis"]
        existing.recommendation = result["recommendation"]
        existing.reasoning = result["reasoning"]
        existing.key_findings = json.dumps(result.get("key_findings", []))
        existing.confidence_score = float(result.get("confidence_score", 0))
        existing.worker_response = data.get("worker_response")
        existing.geolocation_summary = data.get("geolocation_summary")
        db.commit()
        db.refresh(existing)
        return existing

    report = MediationReport(
        claim_id=data["claim_id"],
        project_id=data["project_id"],
        worker_id=data["worker_id"],
        provider_id=data["provider_id"],
        claim_description=data.get("description"),
        worker_response=data.get("worker_response"),
        geolocation_summary=data.get("geolocation_summary"),
        analysis=result["analysis"],
        recommendation=result["recommendation"],
        reasoning=result["reasoning"],
        key_findings=json.dumps(result.get("key_findings", [])),
        confidence_score=float(result.get("confidence_score", 0)),
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    return report


def get_report(claim_id: str, db: Session) -> MediationReport | None:
    return db.query(MediationReport).filter(MediationReport.claim_id == claim_id).first()
