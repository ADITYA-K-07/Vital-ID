from functools import lru_cache
from typing import Annotated

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    app_name: str = "CareFlow Backend"
    environment: str = "development"
    debug: bool = True
    cors_origins: Annotated[list[str], NoDecode] = Field(
        default_factory=lambda: ["http://localhost:3000"]
    )
    request_timeout_seconds: float = 15.0

    supabase_url: str = Field(env=["SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_URL"])
    supabase_anon_key: str = Field(env=["SUPABASE_ANON_KEY", "SUPABASE_KEY", "NEXT_PUBLIC_SUPABASE_ANON_KEY"])
    supabase_service_role_key: str | None = None
    supabase_schema: str = "public"

    ai_mode: str = "mock"
    ai_insight_store_enabled: bool = True
    ai_create_alerts_enabled: bool = True
    groq_api_key: str | None = None
    groq_model: str = "llama-3.3-70b-versatile"

    @field_validator("debug", mode="before")
    @classmethod
    def parse_debug_flag(cls, value: bool | str) -> bool | str:
        if isinstance(value, bool):
            return value

        normalized = value.strip().lower()
        if normalized in {"1", "true", "yes", "on", "debug", "development", "dev"}:
            return True
        if normalized in {"0", "false", "no", "off", "release", "production", "prod"}:
            return False
        return value

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, value: str | list[str]) -> list[str]:
        if isinstance(value, str):
            return [item.strip() for item in value.split(",") if item.strip()]
        return value

    @property
    def is_mock_ai(self) -> bool:
        return self.ai_mode.lower() == "mock"

    @property
    def is_groq_ai(self) -> bool:
        return self.ai_mode.lower() == "groq"


@lru_cache
def get_settings() -> Settings:
    return Settings()
