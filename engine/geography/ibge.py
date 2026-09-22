"""Brazilian geographic catalog backed by official IBGE APIs."""
from __future__ import annotations

import gzip
import json
import time
from pathlib import Path
from urllib.request import Request, urlopen

from engine.geography.models import TargetLocation

BASE_URL = "https://servicodados.ibge.gov.br/api/v1/localidades"
SIDRA_URL = "https://apisidra.ibge.gov.br/values/t/4714/n6/all/v/93/p/2022"
CACHE_TTL_SECONDS = 24 * 60 * 60

# Catálogo estrutural estático: UFs não precisam depender de uma chamada de
# rede para preencher o primeiro combo da interface. Os códigos são os IDs
# oficiais usados pelo endpoint de municípios do IBGE.
STATE_CATALOG = (
    ("12", "AC", "Acre"), ("27", "AL", "Alagoas"), ("16", "AP", "Amapá"),
    ("13", "AM", "Amazonas"), ("29", "BA", "Bahia"), ("23", "CE", "Ceará"),
    ("53", "DF", "Distrito Federal"), ("32", "ES", "Espírito Santo"),
    ("52", "GO", "Goiás"), ("21", "MA", "Maranhão"), ("51", "MT", "Mato Grosso"),
    ("50", "MS", "Mato Grosso do Sul"), ("31", "MG", "Minas Gerais"),
    ("15", "PA", "Pará"), ("25", "PB", "Paraíba"), ("41", "PR", "Paraná"),
    ("26", "PE", "Pernambuco"), ("22", "PI", "Piauí"), ("33", "RJ", "Rio de Janeiro"),
    ("24", "RN", "Rio Grande do Norte"), ("43", "RS", "Rio Grande do Sul"),
    ("11", "RO", "Rondônia"), ("14", "RR", "Roraima"), ("42", "SC", "Santa Catarina"),
    ("35", "SP", "São Paulo"), ("28", "SE", "Sergipe"), ("17", "TO", "Tocantins"),
)
STATE_BY_CODE = {code: {"id": id_, "code": code, "name": name} for id_, code, name in STATE_CATALOG}

# Catálogo estrutural estático: UFs não precisam depender de uma chamada de
# rede para preencher o primeiro combo da interface. Os códigos são os IDs
# oficiais usados pelo endpoint de municípios do IBGE.
STATE_CATALOG = (
    ("12", "AC", "Acre"), ("27", "AL", "Alagoas"), ("16", "AP", "Amapá"),
    ("13", "AM", "Amazonas"), ("29", "BA", "Bahia"), ("23", "CE", "Ceará"),
    ("53", "DF", "Distrito Federal"), ("32", "ES", "Espírito Santo"),
    ("52", "GO", "Goiás"), ("21", "MA", "Maranhão"), ("51", "MT", "Mato Grosso"),
    ("50", "MS", "Mato Grosso do Sul"), ("31", "MG", "Minas Gerais"),
    ("15", "PA", "Pará"), ("25", "PB", "Paraíba"), ("41", "PR", "Paraná"),
    ("26", "PE", "Pernambuco"), ("22", "PI", "Piauí"), ("33", "RJ", "Rio de Janeiro"),
    ("24", "RN", "Rio Grande do Norte"), ("43", "RS", "Rio Grande do Sul"),
    ("11", "RO", "Rondônia"), ("14", "RR", "Roraima"), ("42", "SC", "Santa Catarina"),
    ("35", "SP", "São Paulo"), ("28", "SE", "Sergipe"), ("17", "TO", "Tocantins"),
)
STATE_BY_CODE = {code: {"id": id_, "code": code, "name": name} for id_, code, name in STATE_CATALOG}

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
        return [dict(item) for item in sorted(STATE_BY_CODE.values(), key=lambda item: item["name"])]

    def cities(
        self,
        state_code: str,
        search: str = "",
        include_population: bool = False,
    ) -> list[TargetLocation]:
        state = state_code.strip().upper()
        state_info = STATE_BY_CODE.get(state)
        if state_info is None:
            raise ValueError(f"UF brasileira inválida: {state}")

        payload = self._get_cached(
            f"cities-{state}.json",
            f"{BASE_URL}/estados/{state_info['id']}/municipios",
        )
        populations = self._populations_2022() if include_population else {}
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
            headers={"Accept": "application/json", "Accept-Encoding": "identity", "User-Agent": "Chupacabra-System/0.1"},
        )
        with urlopen(request, timeout=30) as response:
            payload = _read_json_response(response.read())

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
            headers={"Accept": "application/json", "Accept-Encoding": "identity", "User-Agent": "Chupacabra-System/0.1"},
        )
        with urlopen(request, timeout=20) as response:
            payload = _read_json_response(response.read())
        path.write_text(json.dumps(payload, ensure_ascii=False), encoding="utf-8")
        return payload



def _read_json_response(raw: bytes):
    # Alguns endpoints do IBGE entregam gzip mesmo quando o cliente não
    # solicita explicitamente compressão. 0x1f 0x8b é a assinatura do gzip.
    if raw[:2] == b"\x1f\x8b":
        raw = gzip.decompress(raw)
    return json.loads(raw.decode("utf-8"))

def _normalize(value: str) -> str:
    import unicodedata

    return unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode("ascii").casefold()
