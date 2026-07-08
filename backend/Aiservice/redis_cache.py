import json
import logging
import redis

logger = logging.getLogger(__name__)

_client: redis.Redis | None = None


def get_client() -> redis.Redis | None:
    global _client
    if _client is not None:
        return _client
    try:
        client = redis.Redis(host="localhost", port=6379, decode_responses=True)
        client.ping()
        _client = client
        logger.info("[Redis] Connected on localhost:6379")
    except Exception as exc:
        logger.warning("[Redis] Not available — caching disabled: %s", exc)
        _client = None
    return _client


def cache_get(key: str):
    r = get_client()
    if r is None:
        return None
    try:
        raw = r.get(key)
        return json.loads(raw) if raw else None
    except Exception:
        return None


def cache_set(key: str, value, ttl: int = 300) -> None:
    r = get_client()
    if r is None:
        return
    try:
        r.setex(key, ttl, json.dumps(value))
    except Exception:
        pass


def cache_delete(key: str) -> None:
    r = get_client()
    if r is None:
        return
    try:
        r.delete(key)
    except Exception:
        pass
