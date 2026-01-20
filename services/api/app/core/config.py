from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "Mooses Place API"
    environment: str = "dev"

    # Postgres (Supabase) connection string.
    # Example: postgresql://postgres:<password>@db.<project>.supabase.co:5432/postgres
    database_url: str

    # CORS
    cors_origins: str = "http://localhost:3000"

    # Optional simple admin key for imports
    admin_import_key: str = ""


settings = Settings()  # type: ignore
