from kafka import KafkaProducer
from config import settings
import json

_producer: KafkaProducer | None = None


def get_producer() -> KafkaProducer:
    global _producer
    if _producer is None:
        _producer = KafkaProducer(
            bootstrap_servers=settings.kafka_bootstrap_servers,
            value_serializer=lambda v: v.encode("utf-8") if isinstance(v, str) else json.dumps(v).encode("utf-8"),
            key_serializer=lambda k: k.encode("utf-8") if k else None,
            api_version=(3, 7, 0),
        )
    return _producer


def publish_event(topic: str, message: str) -> None:
    try:
        get_producer().send(topic, value=message)
        get_producer().flush()
    except Exception as e:
        print(f"[Kafka] Failed to publish to {topic}: {e}")
