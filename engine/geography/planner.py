"""Turn selected geographic locations and categories into engine jobs."""
from __future__ import annotations

from engine.geography.models import TargetLocation


def build_matrix_jobs(
    locations: list[TargetLocation],
    categories: list[tuple[str, str]],
) -> list[tuple[str, str, str, str]]:
    jobs: list[tuple[str, str, str, str]] = []
    seen: set[str] = set()
    for location in locations:
        for category_slug, label in categories:
            job_slug = (
                f"{category_slug}_{_slug(location.country)}_"
                f"{_slug(location.state_code or location.state_name)}_{_slug(location.city)}"
            )
            if job_slug in seen:
                continue
            seen.add(job_slug)

            if location.country == "BR":
                suffix = f"{location.city} {location.state_code}"
                query = f"{label} em {suffix}"
            else:
                suffix = f"{location.city} {location.country}"
                query = f"{label} in {suffix}"

            jobs.append((job_slug, location.city, category_slug, query))
    return jobs


def _slug(value: str) -> str:
    import re
    import unicodedata

    normalized = unicodedata.normalize("NFKD", value)
    ascii_value = normalized.encode("ascii", "ignore").decode("ascii")
    return re.sub(r"[^a-z0-9]+", "_", ascii_value.lower()).strip("_")
