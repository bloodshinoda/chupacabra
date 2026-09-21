"""Small cached client for the official IBGE locality API.

The desktop app keeps a local cache so target selection remains usable after
an initial sync. The API is only used for the geographic catalog; prospecting
jobs continue to run through the existing crawler.
"""
from __future__ import annotations

import json
import time
from pathlib import Path
from urllib.request import Request, urlopen

from engine.geography.models import TargetLocation

BASE_URL = "https://servicodados.ibge.gov.br/api/v1/localidades"
CACHE_TTL_SECONDS = 24 * 60 * 60


class IbgeBrazilCatalog:
    def __init__(self, cache_dir: str | Path = "cache/geography") -> None:
        self.cache_dir = Path(cache_dir)
        self.cache_dir.mkdir(parents=True, exist_ok=True)

    def states(self) -> list[dict]:
        payload = self._get_cached("states.json", f"{BASE_URL}/estados")
        return sorted(
            [
                {
                    "id": str(item["id"]),
                    "code": item.get("sigla", ""),
                    "name": item["nome"],
                }
                for item in payload
            ],
            key=lambda item: item["name"],
        )

    def cities(self, state_code: str, search: str = "") -> list[TargetLocation]:
        state = state_code.strip().upper()
        if len(state) != 2 or not state.isalpha():
            raise ValueError("state_code deve ser uma UF brasileira de duas letras")
        states = {item["code"]: item for item in self.states()}
        state_info = states.get(state)
        if state_info is None:
            raise ValueError(f"UF brasileira inválida: {state}")

        payload = self._get_cached(
            f"cities-{state}.json",
            f"{BASE_URL}/estados/{state_info['id']}/municipios",
        )
        needle = search.strip().casefold()
        result: list[TargetLocation] = []
        for item in payload:
            name = item["nome"]
            if needle and needle not in name.casefold():
                continue
            result.append(
                TargetLocation(
                    id=f"br:{item['id']}",
                    country="BR",
                    state_code=state,
                    state_name=state_info["name"],
                    city=name,
                )
            )
        return sorted(result, key=lambda item: item.city)

    def _get_cached(self, filename: str, url: str) -> list[dict]:
        path = self.cache_dir / filename
        if path.exists() and time.time() - path.stat().st_mtime < CACHE_TTL_SECONDS:
            return json.loads(path.read_text(encoding="utf-8"))
        request = Request(url, headers={"Accept": "application/json", "User-Agent": "Chupacabra-System/0.1"})
        with urlopen(request, timeout=20) as response:
            payload = json.loads(response.read().decode("utf-8"))
        path.write_text(json.dumps(payload, ensure_ascii=False), encoding="utf-8")
        return payload
