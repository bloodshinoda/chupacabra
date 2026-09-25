"""Stable engine-facing adapter for the existing placesCrawlerV2 implementation."""
from dataclasses import dataclass
from pathlib import Path
import csv
import sys
from typing import Any


@dataclass(frozen=True, slots=True)
class CrawlResult:
    raw_file: str
    count: int


class CrawlerAdapter:
    """Keep the engine independent from the legacy mapScraper package layout."""

    _COLUMNS = [
        "id", "url_place", "title", "category", "address", "phoneNumber",
        "completePhoneNumber", "domain", "url", "coor", "stars", "reviews",
        "source_query",
    ]

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
        progress: Any | None = None,
    ) -> CrawlResult:
        if not queries:
            raise ValueError("At least one search query is required")
        if max_concurrent < 1:
            raise ValueError("max_concurrent must be >= 1")

        import mapScraper.placesCrawlerV2 as crawler

        destination = Path(output_file)
        destination.parent.mkdir(parents=True, exist_ok=True)
        def report(message: str, **details: Any) -> None:
            if progress is not None:
                progress(message, **details)

        report("Preparando consulta no Google Maps.", query=queries[0], limit=limit)
        report(
            "Iniciando crawler MapScraper.",
            query_count=len(queries),
            concurrency=max_concurrent,
        )
        results: list[dict[str, Any]] = crawler.search_multiple(
            queries,
            lang,
            country,
            limit,
            max_concurrent,
            progress=progress,
        )
        report("Crawler finalizado.", results=len(results))
        crawler.save_to_csv(results, str(destination))

        # The legacy saver intentionally skips file creation for zero results.
        # The engine keeps a valid empty CSV so the enrichment pipeline can
        # distinguish "zero leads" from "job crashed before producing output".
        if not destination.exists():
            with destination.open("w", newline="", encoding="utf-8") as handle:
                csv.writer(handle).writerow(self._COLUMNS)

        return CrawlResult(raw_file=str(destination), count=len(results))
