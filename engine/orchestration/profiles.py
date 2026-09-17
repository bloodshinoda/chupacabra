"""Execution profiles that translate the old BAT behavior into engine settings."""
from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class RunProfile:
    name: str
    limit: int
    scraper_concurrency: int
    scrape_websites: bool
    web_concurrency: int
    web_batch_size: int
    web_timeout: int
    delay_min: float
    delay_max: float


_PROFILES = {
    "fast": RunProfile(
        name="fast",
        limit=250,
        scraper_concurrency=5,
        scrape_websites=False,
        web_concurrency=4,
        web_batch_size=100,
        web_timeout=6,
        delay_min=3,
        delay_max=7,
    ),
    "balanced": RunProfile(
        name="balanced",
        limit=500,
        scraper_concurrency=3,
        scrape_websites=True,
        web_concurrency=8,
        web_batch_size=100,
        web_timeout=10,
        delay_min=8,
        delay_max=16,
    ),
    "aggressive": RunProfile(
        name="aggressive",
        limit=1000,
        scraper_concurrency=3,
        scrape_websites=True,
        web_concurrency=10,
        web_batch_size=100,
        web_timeout=10,
        delay_min=15,
        delay_max=35,
    ),
}


def get_profile(name: str) -> RunProfile:
    key = name.strip().lower()
    try:
        return _PROFILES[key]
    except KeyError as exc:
        valid = ", ".join(sorted(_PROFILES))
        raise ValueError(f"Unknown profile '{name}'. Valid profiles: {valid}") from exc


def profiles() -> tuple[RunProfile, ...]:
    """Return all built-in profiles."""
    return tuple(_PROFILES.values())
