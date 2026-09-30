"""Perfis de execução do motor Chupacabra."""
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
    "rapido": RunProfile("rapido", 250, 5, False, 4, 100, 6, 3, 7),
    "balanceado": RunProfile("balanceado", 500, 3, True, 8, 100, 10, 8, 16),
    "chupacabra": RunProfile("chupacabra", 1000, 3, True, 10, 100, 10, 15, 35),
}


def get_profile(name: str) -> RunProfile:
    key = name.strip().lower()
    try:
        return _PROFILES[key]
    except KeyError as exc:
        valid = ", ".join(sorted(_PROFILES))
        raise ValueError(f"Perfil desconhecido '{name}'. Perfis válidos: {valid}") from exc


def profiles() -> tuple[RunProfile, ...]:
    return tuple(_PROFILES.values())
