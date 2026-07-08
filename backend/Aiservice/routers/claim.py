import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from schemas import MediateClaimRequest, MediationReportResponse, ValidateApologyRequest, ApologyValidationResponse
from services import claim_service
from messaging.producer import publish_event
import groq_client

router = APIRouter(prefix="/api/ai/claim", tags=["Claim Mediation"])


@router.post("/mediate", response_model=MediationReportResponse)
def mediate_claim(request: MediateClaimRequest, db: Session = Depends(get_db)):
    try:
        report = claim_service.mediate_claim(request.model_dump(), db)
        publish_event("claim-mediation-completed", f"{request.claim_id}:{report.recommendation}")
        publish_event("mediation-report-generated", request.claim_id)
        return MediationReportResponse(
            claim_id=report.claim_id,
            analysis=report.analysis,
            recommendation=report.recommendation,
            reasoning=report.reasoning,
            key_findings=json.loads(report.key_findings or "[]"),
            confidence_score=report.confidence_score,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/validate-apology", response_model=ApologyValidationResponse)
def validate_apology(request: ValidateApologyRequest):
    try:
        messages = []
        if request.message_evidence:
            try:
                messages = json.loads(request.message_evidence)
            except json.JSONDecodeError:
                messages = []

        if not messages:
            return ApologyValidationResponse(
                claim_id=request.claim_id,
                has_apology=False,
                confidence="HIGH",
                reasoning="No message evidence was provided to analyse.",
                apology_excerpt=None,
            )

        conversation = "\n".join(
            [f"- {m.get('senderName', 'Unknown')}: {m.get('text', '')}" for m in messages]
        )

        prompt = f"""You are analysing messages from a project dispute to determine if the worker (service provider) has sent a genuine apology to the project owner.

Messages from the project conversation:
{conversation}

Determine if any message contains a genuine apology from the worker acknowledging that the project failed, was not delivered, or that they are at fault.

Respond ONLY with a valid JSON object (no markdown, no extra text):
{{
  "has_apology": true or false,
  "confidence": "HIGH" or "MEDIUM" or "LOW",
  "reasoning": "brief explanation of your determination",
  "apology_excerpt": "the exact apology text if found, otherwise null"
}}"""

        result = groq_client.chat_json(prompt)
        return ApologyValidationResponse(
            claim_id=request.claim_id,
            has_apology=bool(result.get("has_apology", False)),
            confidence=result.get("confidence", "LOW"),
            reasoning=result.get("reasoning", ""),
            apology_excerpt=result.get("apology_excerpt"),
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/report/{claim_id}", response_model=MediationReportResponse)
def get_report(claim_id: str, db: Session = Depends(get_db)):
    report = claim_service.get_report(claim_id, db)
    if not report:
        raise HTTPException(status_code=404, detail="Mediation report not found.")
    return MediationReportResponse(
        claim_id=report.claim_id,
        analysis=report.analysis,
        recommendation=report.recommendation,
        reasoning=report.reasoning,
        key_findings=json.loads(report.key_findings or "[]"),
        confidence_score=report.confidence_score,
    )
