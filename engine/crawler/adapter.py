"""Stable engine-facing adapter for the existing placesCrawlerV2 implementation."""
from dataclasses import dataclass
from pathlib import Path
import sys
from typing import Any


@dataclass(frozen=True, slots=True)
class CrawlResult:
    raw_file: str
    count: int


class CrawlerAdapter:
    """Keep the engine independent from the legacy mapScraper package layout."""

    def __init__(self, repository_root: str | Path | None = None) -> None:
        root = Path(repository_root or Path(__file__).resolve().parents[2])
        self.repository_root = root.resolve()
        self.mapscraper_root = self.repository_root / "mapScraper"
        if str(self.mapscraper_root) not in sys.path:
            sys.path.insert(0, str(self.mapscraper_root))

    def scrape(
        self,
        queries: list[str],
        *,
        lang: str,
        country: str,
        limit: int | None,
        max_concurrent: int,
        output_file: str | Path,
    ) -> CrawlResult:
        if not queries:
            raise ValueError("At least one search query is required")
        if max_concurrent < 1:
            raise ValueError("max_concurrent must be >= 1")

        import mapScraper.placesCrawlerV2 as crawler

        destination = Path(output_file)
        destination.parent.mkdir(parents=True, exist_ok=True)
        results: list[dict[str, Any]] = crawler.search_multiple(
            queries, lang, country, limit, max_concurrent
        )
        crawler.save_to_csv(results, str(destination))
        return CrawlResult(raw_file=str(destination), count=len(results))
