"""International city catalog backed by Open-Meteo's public geocoding API.

This provider is deliberately isolated from the Brazilian IBGE provider so the
engine can evolve to other authoritative/local datasets later without changing
the target planner.
"""
from __future__ import annotations

import json
import time
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from engine.geography.models import TargetLocation

BASE_URL = "https://geocoding-api.open-meteo.com/v1/search"
CACHE_TTL_SECONDS = 24 * 60 * 60


class WorldCityCatalog:
    def __init__(self, cache_dir: str | Path = "cache/geography") -> None:
        self.cache_dir = Path(cache_dir)
        self.cache_dir.mkdir(parents=True, exist_ok=True)

    def search_cities(self, query: str, country_code: str | None = None) -> list[TargetLocation]:
        query = query.strip()
        if len(query) < 2:
            return []
        params = {"name": query, "count": "50", "language": "en", "format": "json"}
        if country_code:
            params["countryCode"] = country_code.strip().upper()
        key = self._cache_key(query, country_code)
        payload = self._get_cached(key, f"{BASE_URL}?{urlencode(params)}")
        result: list[TargetLocation] = []
        for item in payload.get("results", []):
            if item.get("feature_code") not in {None, "PPLA", "PPLA2", "PPLA3", "PPLC", "PPL"}:
                continue
            country = str(item.get("country_code", "")).upper()
            city = str(item.get("name", "")).strip()
            if not city or not country:
                continue
            result.append(
                TargetLocation(
                    id=f"world:{country}:{item.get('id', city)}",
                    country=country,
                    state_code=str(item.get("admin1_code", "")),
                    state_name=str(item.get("admin1", "")),
                    city=city,
                    latitude=item.get("latitude"),
                    longitude=item.get("longitude"),
                )
            )
        return result

    @staticmethod
    def _cache_key(query: str, country_code: str | None) -> str:
        import hashlib
        value = f"{country_code or '*'}:{query.casefold()}"
        return f"world-{hashlib.sha256(value.encode()).hexdigest()[:20]}.json"

    def _get_cached(self, filename: str, url: str) -> dict:
        path = self.cache_dir / filename
        if path.exists() and time.time() - path.stat().st_mtime < CACHE_TTL_SECONDS:
            return json.loads(path.read_text(encoding="utf-8"))
        request = Request(url, headers={"Accept": "application/json", "User-Agent": "Chupacabra-System/0.1"})
        with urlopen(request, timeout=20) as response:
            payload = json.loads(response.read().decode("utf-8"))
        path.write_text(json.dumps(payload, ensure_ascii=False), encoding="utf-8")
        return payload
