import httpx
from config import settings

# Topics that map to a real Audit-and-Compliance internal endpoint.
_AUDIT_EVENTS = {"geolocation-verified", "geolocation-flagged"}


def publish_event(topic: str, message: str) -> None:
    """Fire-and-forget internal event publish (replaces Kafka).

    geolocation-verified / geolocation-flagged -> POST to Audit service with
    body {"claimId": message}. All other legacy topics have no consumer and
    are treated as a harmless no-op. Best-effort: all exceptions swallowed.
    """
    if topic not in _AUDIT_EVENTS:
        print(f"[Event] No consumer for topic '{topic}' — skipping (no-op).")
        return

    try:
        httpx.post(
            f"{settings.audit_base_url}/api/internal/events/{topic}",
            json={"claimId": message},
            headers={"X-Internal-Key": settings.internal_api_key},
            timeout=10,
        )
    except Exception as e:
        print(f"[Event] POST {topic} to Audit failed: {e}")
