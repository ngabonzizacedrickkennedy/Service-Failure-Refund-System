from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    groq_api_key: str = ""
    groq_model: str = "llama-3.3-70b-versatile"

    database_url: str = "postgresql://postgres:Novemba%4042@localhost:5432/ai_service_db"

    kafka_bootstrap_servers: str = "localhost:9092"

    service2_base_url: str = "http://localhost:8082"
    internal_api_key: str = "ssfrs-internal-2024"

    port: int = 8083


settings = Settings()
