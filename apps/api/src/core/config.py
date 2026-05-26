from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    app_name: str
    environment: str
    debug: bool

    redis_host: str
    redis_port: int

    database_url: str

    jwt_secret: str
    jwt_algorithm: str
    access_token_expire_minutes: int
    refresh_token_expire_days: int
    invite_token_expire_days: int = 7

    resend_api_key: str
    mail_from: str
    frontend_url: str

    allowed_origins: list[str] = ["*"]

    # Host verification
    host_verification_window_hours: int = 24
    host_verification_sweep_interval_minutes: int = 1
    host_verification_fast_window_minutes: int = 10
    host_verification_fast_interval_minutes: int = 1
    host_verification_slow_interval_minutes: int = 5
    host_verification_dns_prefix: str = "_lt-verify"
    host_verification_http_path: str = "/.well-known/lt-verify.txt"
    host_verify_dns_timeout_seconds: int = 5
    host_verify_http_timeout_seconds: int = 10

    # Celery
    celery_broker_url: str = "redis://localhost:6379/0"

    # Load tests / OpenAPI import
    load_test_max_urls: int = 500
    openapi_spec_max_bytes: int = 2 * 1024 * 1024

    # k6 execution
    k6_image: str = "grafana/k6:0.57.0"
    k6_runs_dir: str = "/tmp/loadwhiz-runs"
    k6_docker_network: str = "loadwhiz-network"
    k6_container_memory: str = "512m"
    k6_container_cpus: float = 1.0
    load_test_max_concurrent_runs: int = 5
    load_test_scheduled_dispatch_interval_minutes: int = 1
    dashboard_bucket_seconds: int = 1
    dashboard_distribution_bucket_ms: int = 50
    dashboard_distribution_max_buckets: int = 40
    load_test_metrics_poll_seconds: int = 2


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
