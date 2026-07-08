import threading
import time
import httpx
from kafka import KafkaConsumer
from config import settings
from database import SessionLocal
from services import rating_service, claim_service, geolocation_service
from services.cv_parser import extract_text_from_url
from redis_cache import cache_delete


INTERNAL_HEADERS = {"X-Internal-Key": settings.internal_api_key}


def handle_worker_cv_submitted(payload: str):
    worker_id = payload.strip()
    print(f"[CV Rating] Starting rating for worker {worker_id}...")
    time.sleep(1)
    try:
        print(f"[CV Rating] Fetching CV from Java service for worker {worker_id}...")
        resp = httpx.get(
            f"{settings.service2_base_url}/api/internal/worker-cv/{worker_id}",
            headers=INTERNAL_HEADERS,
            timeout=10,
        )
        if resp.status_code != 200:
            print(f"[CV Rating] ERROR — Could not fetch CV for worker {worker_id}: HTTP {resp.status_code}")
            return
        cv = resp.json()

        # Extract text from the uploaded CV file (PDF or DOCX) if available
        cv_file_url = cv.get("cvFileUrl")
        cv_file_text = None
        if cv_file_url:
            print(f"[CV Rating] Extracting text from uploaded CV file for worker {worker_id}...")
            cv_file_text = extract_text_from_url(cv_file_url)
            if cv_file_text:
                print(f"[CV Rating] Extracted {len(cv_file_text)} characters from CV file")
            else:
                print(f"[CV Rating] Could not extract text from CV file (unsupported format, empty, or parse error)")

        # Build combined credentials: CV file content + manual credentials text
        manual_credentials = cv.get("additionalCredentials") or ""
        if cv_file_text and manual_credentials:
            combined_credentials = (
                f"[Uploaded CV File Content]:\n{cv_file_text}"
                f"\n\n[Additional Credentials (self-declared)]:\n{manual_credentials}"
            )
        elif cv_file_text:
            combined_credentials = f"[Uploaded CV File Content]:\n{cv_file_text}"
        elif manual_credentials:
            combined_credentials = manual_credentials
        else:
            combined_credentials = None

        db = SessionLocal()
        try:
            existing_rating = rating_service.get_rating(worker_id, db)
            worker_data = {
                "worker_id": worker_id,
                "worker_name": cv.get("workerName", ""),
                "worker_email": cv.get("workerEmail", ""),
                "specialization": cv.get("specialization", ""),
                "years_of_experience": cv.get("yearsOfExperience", 0),
                "additional_credentials": combined_credentials,
                "completed_projects": existing_rating.completed_projects if existing_rating else 0,
                "past_failures": existing_rating.past_failures if existing_rating else 0,
            }
            print(f"[AI] Rating worker {worker_id} — specialization={worker_data['specialization']}, "
                  f"experience={worker_data['years_of_experience']}yrs, "
                  f"credentials={'YES' if worker_data['additional_credentials'] else 'NONE'}, "
                  f"projects={worker_data['completed_projects']}, failures={worker_data['past_failures']}")
            rating = rating_service.rate_worker(worker_data, db)
            cache_delete(f"rating:{worker_id}")
            patch_resp = httpx.patch(
                f"{settings.service2_base_url}/api/internal/worker-cv/{worker_id}/rating",
                json={
                    "ratingScore": rating.overall_score,
                    "ratingReasoning": rating.reasoning,
                },
                headers=INTERNAL_HEADERS,
                timeout=10,
            )
            if patch_resp.status_code not in (200, 204):
                print(f"[Consumer] PATCH rating failed for worker {worker_id}: "
                      f"HTTP {patch_resp.status_code} — {patch_resp.text[:200]}")
            else:
                print(f"[AI] Rated worker {worker_id}: {rating.overall_score:.2f} (Java DB updated)")
        finally:
            db.close()
    except Exception as e:
        print(f"[Consumer] Error rating worker {worker_id}: {e}")


def handle_claim_filed(payload: str):
    parts = payload.strip().split(":")
    if len(parts) < 3:
        return
    claim_id, project_id, worker_id = parts[0], parts[1], parts[2]
    try:
        claim_resp = httpx.get(
            f"{settings.service2_base_url}/api/internal/claims/{claim_id}",
            headers=INTERNAL_HEADERS,
            timeout=10,
        )
        project_resp = httpx.get(
            f"{settings.service2_base_url}/api/projects/{project_id}",
            headers=INTERNAL_HEADERS,
            timeout=10,
        )
        if claim_resp.status_code != 200 or project_resp.status_code != 200:
            print(f"[Consumer] Could not fetch data for claim {claim_id} "
                  f"(claim={claim_resp.status_code}, project={project_resp.status_code})")
            return

        claim = claim_resp.json()
        project = project_resp.json()

        geo_summary = None
        db = SessionLocal()
        try:
            if claim.get("extractedLat") and claim.get("extractedLon"):
                geo = geolocation_service.verify_geolocation({
                    "claim_id": claim_id,
                    "latitude": claim["extractedLat"],
                    "longitude": claim["extractedLon"],
                    "photo_timestamp": claim.get("extractedPhotoTimestamp"),
                    "project_location": None,
                    "project_start_date": None,
                    "project_end_date": project.get("deadline"),
                }, db)
                geo_summary = geolocation_service.build_summary(geo)

            mediation_data = {
                "claim_id": claim_id,
                "project_id": project_id,
                "provider_id": claim.get("providerId", ""),
                "worker_id": worker_id,
                "project_title": project.get("title", "Unknown"),
                "required_skills": project.get("requiredSkills", ""),
                "budget": float(project.get("budget", 0)),
                "description": claim.get("description", ""),
                "worker_response": claim.get("workerResponse"),
                "geolocation_summary": geo_summary,
            }
            report = claim_service.mediate_claim(mediation_data, db)

            httpx.patch(
                f"{settings.service2_base_url}/api/internal/claims/{claim_id}/mediation",
                json={
                    "aiMediationReport": (
                        f"AI Recommendation: {report.recommendation}\n\n"
                        f"{report.analysis}\n\nReasoning: {report.reasoning}"
                    )
                },
                headers=INTERNAL_HEADERS,
                timeout=10,
            )
            print(f"[AI] Mediated claim {claim_id}: {report.recommendation}")
        finally:
            db.close()
    except Exception as e:
        print(f"[Consumer] Error mediating claim {claim_id}: {e}")


def handle_worker_claim_response(payload: str):
    parts = payload.strip().split(":")
    if len(parts) < 3:
        return
    handle_claim_filed(payload)


def retrigger_unrated_workers(db_factory):
    import time as _time
    _time.sleep(12)
    try:
        resp = httpx.get(
            f"{settings.service2_base_url}/api/internal/worker-cv/all",
            headers=INTERNAL_HEADERS,
            timeout=15,
        )
        if resp.status_code != 200:
            print(f"[Startup] Could not fetch all CVs: {resp.status_code}")
            return
        cvs = resp.json()
        db = db_factory()
        try:
            from services import rating_service as _rs
            for cv in cvs:
                worker_id = cv.get("workerId")
                if not worker_id:
                    continue
                if not cv.get("specialization") or not cv.get("yearsOfExperience"):
                    continue
                existing = _rs.get_rating(worker_id, db)
                if existing and existing.overall_score > 0:
                    continue
                print(f"[Startup] Retroactively rating worker {worker_id}")
                threading.Thread(
                    target=handle_worker_cv_submitted, args=(worker_id,), daemon=True
                ).start()
        finally:
            db.close()
    except Exception as e:
        print(f"[Startup] Error during retroactive rating: {e}")


def start_consumer():
    def _run():
        retry_delay = 5
        while True:
            consumer = None
            try:
                consumer = KafkaConsumer(
                    "worker-cv-submitted",
                    "claim-filed",
                    "worker-claim-response-submitted",
                    bootstrap_servers=settings.kafka_bootstrap_servers,
                    group_id="ai-service-group",
                    auto_offset_reset="earliest",
                    enable_auto_commit=True,
                    api_version=(3, 7, 0),
                )
                retry_delay = 5
                print("[Kafka Consumer] Started — listening for events...")
                for msg in consumer:
                    topic = msg.topic
                    value = msg.value.decode("utf-8") if msg.value else ""
                    print(f"[Kafka] Received: {topic} → {value}")

                    if topic == "worker-cv-submitted":
                        threading.Thread(target=handle_worker_cv_submitted, args=(value,), daemon=True).start()
                    elif topic == "claim-filed":
                        threading.Thread(target=handle_claim_filed, args=(value,), daemon=True).start()
                    elif topic == "worker-claim-response-submitted":
                        threading.Thread(target=handle_worker_claim_response, args=(value,), daemon=True).start()
            except Exception as e:
                print(f"[Kafka Consumer] Error: {e}. Reconnecting in {retry_delay}s...")
            finally:
                if consumer is not None:
                    try:
                        consumer.close()
                    except Exception:
                        pass
            time.sleep(retry_delay)
            retry_delay = min(retry_delay * 2, 60)

    thread = threading.Thread(target=_run, daemon=True)
    thread.start()
    return thread
