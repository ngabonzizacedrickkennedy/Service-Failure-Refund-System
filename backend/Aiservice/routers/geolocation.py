import json
import traceback
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from schemas import VerifyGeolocationRequest, GeolocationResultResponse, VerifyImageLocationRequest, ImageVerificationResponse
from services import geolocation_service
from messaging.producer import publish_event

router = APIRouter(prefix="/api/ai/geolocation", tags=["Geolocation"])


@router.post("/verify", response_model=GeolocationResultResponse)
def verify_geolocation(request: VerifyGeolocationRequest, db: Session = Depends(get_db)):
    try:
        result = geolocation_service.verify_geolocation(request.model_dump(), db)
        summary = geolocation_service.build_summary(result)
        flags = json.loads(result.flags or "[]")

        event = "geolocation-flagged" if (
            result.location_status == "MISMATCH" or result.timeline_status == "INCONSISTENT"
        ) else "geolocation-verified"
        publish_event(event, request.claim_id)

        return GeolocationResultResponse(
            claim_id=result.claim_id,
            latitude=result.latitude,
            longitude=result.longitude,
            address=result.address,
            photo_timestamp=result.photo_timestamp,
            location_status=result.location_status,
            timeline_status=result.timeline_status,
            flags=flags,
            summary=summary,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/verify-image", response_model=ImageVerificationResponse)
def verify_image_location(request: VerifyImageLocationRequest):
    try:
        result = geolocation_service.verify_location_by_image(
            request.claim_id,
            request.image_urls,
            request.construction_location,
        )
        return ImageVerificationResponse(**result)
    except Exception as e:
        print(f"[verify-image] ERROR for claim {request.claim_id}: {e}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/result/{claim_id}", response_model=GeolocationResultResponse)
def get_result(claim_id: str, db: Session = Depends(get_db)):
    from models import GeolocationResult
    result = db.query(GeolocationResult).filter(GeolocationResult.claim_id == claim_id).first()
    if not result:
        raise HTTPException(status_code=404, detail="Geolocation result not found.")
    return GeolocationResultResponse(
        claim_id=result.claim_id,
        latitude=result.latitude,
        longitude=result.longitude,
        address=result.address,
        photo_timestamp=result.photo_timestamp,
        location_status=result.location_status,
        timeline_status=result.timeline_status,
        flags=json.loads(result.flags or "[]"),
        summary=geolocation_service.build_summary(result),
    )
