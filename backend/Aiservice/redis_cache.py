"""In-process cache (no external Redis needed).

Keeps the same cache_get / cache_set / cache_delete API the rest of the app
already uses, but stores values in memory with a per-entry TTL. Each service
instance has its own cache; entries expire after their TTL. Fine for our scale
and removes the Redis dependency entirely.
"""
import threading
import time

# key -> (expires_at_monotonic, value)
_store: dict[str, tuple[float, object]] = {}
_lock = threading.Lock()


def cache_get(key: str):
    with _lock:
        item = _store.get(key)
        if item is None:
            return None
        expires_at, value = item
        if expires_at < time.monotonic():
            _store.pop(key, None)
            return None
        return value


def cache_set(key: str, value, ttl: int = 300) -> None:
    with _lock:
        _store[key] = (time.monotonic() + ttl, value)


def cache_delete(key: str) -> None:
    with _lock:
        _store.pop(key, None)
