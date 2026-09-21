"""Categories and target planning helpers for prospecting runs."""
from __future__ import annotations

from engine.geography.models import TargetLocation
from engine.geography.planner import build_matrix_jobs

CATEGORIES: tuple[tuple[str, str], ...] = (
    ("agencias_publicidade", "Agencias de publicidade"),
    ("graficas", "Graficas"),
    ("graficas_rapidas", "Grafica rapida"),
    ("comunicacao_visual", "Comunicacao visual"),
    ("marketing_digital", "Agencias de marketing digital"),
    ("brindes_corporativos", "Brindes corporativos"),
    ("eventos_corporativos", "Organizacao de eventos corporativos"),
    ("serigrafia_estamparia", "Serigrafia e estamparia"),
    ("imobiliarias", "Imobiliarias"),
    ("concessionarias", "Concessionarias de veiculos"),
    ("construtoras", "Construtoras"),
    ("clinicas_odontologicas", "Clinicas odontologicas"),
)

OPTIONAL_CATEGORIES: tuple[tuple[str, str], ...] = (
    ("escritorios_advocacia", "Escritorios de advocacia"),
    ("academias", "Academias"),
    ("supermercados", "Supermercados"),
    ("escolas_particulares", "Escolas particulares"),
    ("restaurantes", "Restaurantes"),
    ("distribuidoras", "Distribuidoras"),
)


def build_queries(
    cities: tuple[str, ...],
    categories: tuple[tuple[str, str], ...] = CATEGORIES,
    state: str = "SC",
) -> list[tuple[str, str, str, str]]:
    """Backward-compatible helper for callers that already have city names."""
    locations = [
        TargetLocation(
            id=f"br:legacy:{state}:{city.casefold()}",
            country="BR",
            state_code=state.upper(),
            state_name=state.upper(),
            city=city,
        )
        for city in cities
    ]
    return build_matrix_jobs(locations, list(categories))


def build_jobs(
    locations: list[TargetLocation],
    categories: list[tuple[str, str]] | None = None,
) -> list[tuple[str, str, str, str]]:
    """Build a complete city × category matrix for the runner."""
    return build_matrix_jobs(locations, categories or list(CATEGORIES))
