import json
import re
import httpx
from models import GeolocationResult
from sqlalchemy.orm import Session
from groq_client import chat_vision


def reverse_geocode(lat: float, lon: float) -> str:
    try:
        url = "https://nominatim.openstreetmap.org/reverse"
        params = {"lat": lat, "lon": lon, "format": "json"}
        headers = {"User-Agent": "SSFRS-AI-Service/1.0"}
        response = httpx.get(url, params=params, headers=headers, timeout=10)
        data = response.json()
        return data.get("display_name", f"{lat}, {lon}")
    except Exception:
        return f"{lat:.4f}, {lon:.4f}"


def verify_geolocation(data: dict, db: Session) -> GeolocationResult:
    lat = data["latitude"]
    lon = data["longitude"]
    claim_id = data["claim_id"]
    flags = []

    address = reverse_geocode(lat, lon)

    project_location = data.get("project_location", "").lower()
    location_status = "VERIFIED"
    if project_location:
        address_lower = address.lower()
        keywords = [k.strip() for k in project_location.split(",")]
        if not any(k in address_lower for k in keywords if k):
            location_status = "MISMATCH"
            flags.append(
                f"Photo location ({address}) does not match expected project area ({data.get('project_location')})."
            )
    else:
        location_status = "VERIFIED"
        flags.append("No project location on record — location cross-reference skipped.")

    timeline_status = "UNKNOWN"
    timestamp = data.get("photo_timestamp")
    if not timestamp:
        flags.append("Photo timestamp could not be extracted from EXIF data.")
    else:
        start = data.get("project_start_date")
        end = data.get("project_end_date")
        if start and end:
            if start <= timestamp <= end:
                timeline_status = "CONSISTENT"
            else:
                timeline_status = "INCONSISTENT"
                flags.append(
                    f"Photo timestamp ({timestamp}) falls outside the project period "
                    f"({start} to {end})."
                )
        else:
            timeline_status = "UNKNOWN"

    existing = db.query(GeolocationResult).filter(GeolocationResult.claim_id == claim_id).first()
    if existing:
        existing.latitude = lat
        existing.longitude = lon
        existing.address = address
        existing.photo_timestamp = timestamp
        existing.location_status = location_status
        existing.timeline_status = timeline_status
        existing.flags = json.dumps(flags)
        db.commit()
        db.refresh(existing)
        return existing

    result = GeolocationResult(
        claim_id=claim_id,
        latitude=lat,
        longitude=lon,
        address=address,
        photo_timestamp=timestamp,
        location_status=location_status,
        timeline_status=timeline_status,
        flags=json.dumps(flags),
    )
    db.add(result)
    db.commit()
    db.refresh(result)
    return result


def verify_location_by_image(claim_id: str, image_urls: list, construction_location: str) -> dict:
    prompt = f"""You are a forensic construction fraud investigator. Your job is to determine whether submitted photos genuinely match the claimed project location, or whether they are fraudulent (taken elsewhere).

Claimed construction location: "{construction_location}"

IMPORTANT: You must output exactly VERIFIED or MISMATCH — never "UNCERTAIN". When evidence is ambiguous, make a best-judgment call based on the balance of indicators and lean toward MISMATCH if there are red flags.

Step 1 — Identify the expected region from the claimed location:
Extract the country and city/region. For example "KN 3 Rd 5, Nyarugenge, Kigali, Rwanda" → country: Rwanda, city: Kigali, region: Central Africa (tropical highland).

Step 2 — Examine every image for these regional signals:
• VEGETATION: tropical/arid/temperate? Specific tree types (banana trees, eucalyptus, savanna, pine, etc.)?
• CLIMATE INDICATORS: red laterite soil, dust, lush green hills, seasonal context?
• ARCHITECTURE & BUILDING MATERIALS: brick type, wall colours, roof styles typical of the region?
• ROAD MARKINGS & INFRASTRUCTURE: road surface, kerb style, drainage channels?
• SIGNAGE: any text visible — what language/script? Consistent with claimed country?
• SKY & LIGHT: sunlight angle and intensity consistent with the latitude?
• VEHICLES: right-hand or left-hand drive? Vehicle brands common in the region?
• SURROUNDING LANDSCAPE: urban/suburban/rural character consistent with claimed city?

Step 3 — Make a DEFINITIVE verdict:
• VERIFIED: The visual evidence (vegetation, soil, building style, climate, etc.) is broadly consistent with the claimed country and region. The construction activity is plausible for the described project. No clear contradicting indicators.
• MISMATCH: The visual evidence clearly contradicts the claimed location — wrong climate zone, wrong vegetation, wrong architectural style, or clear evidence of a different country/region. OR the images show something completely unrelated to construction.

Output ONLY this JSON, nothing else:
{{
  "location_status": "VERIFIED" or "MISMATCH",
  "confidence": "HIGH" or "MEDIUM" or "LOW",
  "what_is_visible": "1-2 sentences describing the construction site and surroundings visible in the images",
  "location_indicators": "list the specific visual clues you found — vegetation, soil, architecture, signage, etc.",
  "analysis": "explain how the regional signals in the images compare to the expected characteristics of {construction_location}",
  "reasoning": "state your final verdict clearly — what confirms or contradicts the location claim"
}}"""

    raw = chat_vision(prompt, image_urls, temperature=0.1)
    cleaned = re.sub(r"^```(?:json)?\s*", "", raw, flags=re.MULTILINE)
    cleaned = re.sub(r"\s*```$", "", cleaned, flags=re.MULTILINE)

    # Strip any text before the first { and after the last }
    start = cleaned.find("{")
    end = cleaned.rfind("}") + 1
    if start != -1 and end > start:
        cleaned = cleaned[start:end]

    result = json.loads(cleaned.strip())

    # Normalise — collapse any residual UNCERTAIN to MISMATCH
    if result.get("location_status") not in ("VERIFIED", "MISMATCH"):
        result["location_status"] = "MISMATCH"

    # Normalise — model sometimes returns location_indicators as a list instead of a string
    if isinstance(result.get("location_indicators"), list):
        result["location_indicators"] = "; ".join(result["location_indicators"])

    result["claim_id"] = claim_id
    return result


def build_summary(geo: GeolocationResult) -> str:
    flags = json.loads(geo.flags or "[]")
    flag_text = " ".join(flags) if flags else "No flags raised."
    return (
        f"GPS coordinates: ({geo.latitude:.4f}, {geo.longitude:.4f}). "
        f"Address: {geo.address}. "
        f"Location status: {geo.location_status}. "
        f"Timeline status: {geo.timeline_status}. "
        f"{flag_text}"
    )
