"""Brazilian geographic catalog backed by official IBGE APIs."""
from __future__ import annotations

import json
import time
from pathlib import Path
from urllib.parse import quote
from urllib.request import Request, urlopen

from engine.geography.models import TargetLocation

BASE_URL = "https://servicodados.ibge.gov.br/api/v1/localidades"
SIDRA_URL = "https://apisidra.ibge.gov.br/values/t/4714/n6/all/v/93/p/2022"
CACHE_TTL_SECONDS = 24 * 60 * 60

# Capitais estaduais used only as a deterministic UI filter.
STATE_CAPITALS = {
    "AC": "Rio Branco",
    "AL": "Maceio",
    "AP": "Macapa",
    "AM": "Manaus",
    "BA": "Salvador",
    "CE": "Fortaleza",
    "DF": "Brasilia",
    "ES": "Vitoria",
    "GO": "Goiania",
    "MA": "Sao Luis",
    "MT": "Cuiaba",
    "MS": "Campo Grande",
    "MG": "Belo Horizonte",
    "PA": "Belem",
    "PB": "Joao Pessoa",
    "PR": "Curitiba",
    "PE": "Recife",
    "PI": "Teresina",
    "RJ": "Rio de Janeiro",
    "RN": "Natal",
    "RS": "Porto Alegre",
    "RO": "Porto Velho",
    "RR": "Boa Vista",
    "SC": "Florianopolis",
    "SP": "Sao Paulo",
    "SE": "Aracaju",
    "TO": "Palmas",
}


class IbgeBrazilCatalog:
    def __init__(self, cache_dir: str | Path = "cache/geography") -> None:
        self.cache_dir = Path(cache_dir)
        self.cache_dir.mkdir(parents=True, exist_ok=True)

    def states(self) -> list[dict[str, str]]:
        payload = self._get_cached("states.json", f"{BASE_URL}/estados")
        return [
            {"id": str(item["id"]), "code": item["sigla"], "name": item["nome"]}
            for item in sorted(payload, key=lambda item: item["nome"])
        ]

    def cities(self, state_code: str, search: str = "") -> list[TargetLocation]:
        state = state_code.strip().upper()
        states = {item["code"]: item for item in self.states()}
        state_info = states.get(state)
        if state_info is None:
            raise ValueError(f"UF brasileira inválida: {state}")

        payload = self._get_cached(
            f"cities-{state}.json",
            f"{BASE_URL}/estados/{state_info['id']}/municipios",
        )
        populations = self._populations_2022()
        needle = search.strip().casefold()
        capital = _normalize(STATE_CAPITALS.get(state, ""))
        result: list[TargetLocation] = []

        for item in payload:
            name = item["nome"]
            if needle and needle not in name.casefold():
                continue
            municipality_id = str(item["id"])
            result.append(
                TargetLocation(
                    id=f"br:{municipality_id}",
                    country="BR",
                    state_code=state,
                    state_name=state_info["name"],
                    city=name,
                    population_2022=populations.get(municipality_id),
                    is_capital=_normalize(name) == capital,
                )
            )
        return sorted(result, key=lambda item: item.city)

    def _populations_2022(self) -> dict[str, int]:
        path = self.cache_dir / "municipality-population-2022.json"
        if path.exists() and time.time() - path.stat().st_mtime < CACHE_TTL_SECONDS:
            return {str(k): int(v) for k, v in json.loads(path.read_text(encoding="utf-8")).items()}

        request = Request(
            SIDRA_URL,
            headers={"Accept": "application/json", "User-Agent": "Chupacabra-System/0.1"},
        )
        with urlopen(request, timeout=30) as response:
            payload = json.loads(response.read().decode("utf-8"))

        populations: dict[str, int] = {}
        for row in payload[1:]:
            code = str(row.get("D1C", "")).strip()
            value = str(row.get("V", "")).strip().replace(".", "")
            if code and value.isdigit():
                populations[code] = int(value)

        path.write_text(json.dumps(populations, ensure_ascii=False), encoding="utf-8")
        return populations

    def _get_cached(self, filename: str, url: str) -> list[dict]:
        path = self.cache_dir / filename
        if path.exists() and time.time() - path.stat().st_mtime < CACHE_TTL_SECONDS:
            return json.loads(path.read_text(encoding="utf-8"))
        request = Request(
            url,
            headers={"Accept": "application/json", "User-Agent": "Chupacabra-System/0.1"},
        )
        with urlopen(request, timeout=20) as response:
            payload = json.loads(response.read().decode("utf-8"))
        path.write_text(json.dumps(payload, ensure_ascii=False), encoding="utf-8")
        return payload


def _normalize(value: str) -> str:
    import unicodedata

    return unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode("ascii").casefold()
