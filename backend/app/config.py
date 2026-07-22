from pydantic_settings import BaseSettings
from functools import lru_cache
from pathlib import Path


_ENV_FILE = Path(__file__).resolve().parent.parent / ".env"
_BACKEND_ROOT = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    app_name: str = "ForgeMind AI"
    api_prefix: str = "/api"
    cors_origins: str = "http://localhost:3000,http://127.0.0.1:3000"

    # OpenRouter (OpenAI-compatible)
    openrouter_api_key: str = ""
    openrouter_base_url: str = "https://openrouter.ai/api/v1"
    openrouter_model: str = "google/gemini-2.0-flash-001"
    openrouter_embedding_model: str = "openai/text-embedding-3-small"
    openrouter_site_url: str = "https://github.com/tarungarg18/ForgeMind-AI"
    openrouter_app_name: str = "ForgeMind AI"

    force_demo_llm: bool = False

    # Persistence
    data_dir: str = ""
    vector_backend: str = "local"  # local (SQLite vectors) | chroma
    seed_on_empty: bool = True

    model_config = {
        "env_file": str(_ENV_FILE),
        "env_file_encoding": "utf-8",
        "extra": "ignore",
    }

    @property
    def resolved_data_dir(self) -> Path:
        if self.data_dir:
            path = Path(self.data_dir)
        else:
            path = _BACKEND_ROOT / "data"
        path.mkdir(parents=True, exist_ok=True)
        (path / "uploads").mkdir(parents=True, exist_ok=True)
        (path / "chroma").mkdir(parents=True, exist_ok=True)
        return path

    @property
    def sqlite_path(self) -> Path:
        return self.resolved_data_dir / "forgemind.db"

    @property
    def chroma_path(self) -> Path:
        return self.resolved_data_dir / "chroma"

    @property
    def uploads_path(self) -> Path:
        return self.resolved_data_dir / "uploads"


@lru_cache
def get_settings() -> Settings:
    return Settings()
