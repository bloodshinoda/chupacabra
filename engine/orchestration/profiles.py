"""Execution presets, validated overrides, and persisted profile settings."""
from __future__ import annotations

from dataclasses import asdict, dataclass
import json
import math
from pathlib import Path
from typing import Any


@dataclass(frozen=True, slots=True)
class RunProfile:
    """`limit` caps raw crawler matches per job (one city × niche query), before dedupe."""
    name: str
    limit: int
    scraper_concurrency: int
    scrape_websites: bool
    web_concurrency: int
    web_batch_size: int
    web_timeout: int
    delay_min: float
    delay_max: float

    def settings(self) -> dict[str, int | float | bool]:
        values = asdict(self)
        values.pop("name")
        return values


PROFILE_LIMITS: dict[str, tuple[int, int]] = {
    "limit": (1, 5_000),
    "scraper_concurrency": (1, 5),
    "web_concurrency": (1, 20),
    "web_batch_size": (1, 500),
    "web_timeout": (1, 60),
    "delay_min": (0, 120),
    "delay_max": (0, 120),
}

_DEFAULT_PROFILES = {
    "rapido": RunProfile("rapido", 250, 5, False, 4, 100, 6, 3, 7),
    "balanceado": RunProfile("balanceado", 500, 3, True, 8, 100, 10, 8, 16),
    "chupacabra": RunProfile("chupacabra", 1000, 3, True, 10, 100, 10, 15, 35),
}


def profile_defaults() -> dict[str, dict[str, int | float | bool]]:
    return {name: profile.settings() for name, profile in _DEFAULT_PROFILES.items()}


def validate_profile_settings(name: str, values: dict[str, Any]) -> RunProfile:
    key = _profile_key(name)
    if not isinstance(values, dict):
        raise ValueError("As configurações do perfil devem ser um objeto.")

    defaults = _DEFAULT_PROFILES[key].settings()
    unknown = sorted(set(values) - set(defaults))
    if unknown:
        raise ValueError(f"Configurações desconhecidas para o perfil: {', '.join(unknown)}")

    merged = {**defaults, **values}
    for field, (minimum, maximum) in PROFILE_LIMITS.items():
        value = merged[field]
        if field.startswith("delay_"):
            if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value):
                raise ValueError(f"{field} deve ser um número finito.")
        elif isinstance(value, bool) or not isinstance(value, int):
            raise ValueError(f"{field} deve ser um número inteiro.")
        if not minimum <= value <= maximum:
            raise ValueError(f"{field} deve estar entre {minimum} e {maximum}.")

    if not isinstance(merged["scrape_websites"], bool):
        raise ValueError("scrape_websites deve ser verdadeiro ou falso.")
    if merged["delay_max"] < merged["delay_min"]:
        raise ValueError("delay_max deve ser maior ou igual a delay_min.")

    return RunProfile(key, **merged)


def resolve_profile(name: str, settings: dict[str, Any] | None = None) -> RunProfile:
    key = _profile_key(name)
    return validate_profile_settings(key, settings or {})


def get_profile(name: str) -> RunProfile:
    key = _profile_key(name)
    return _DEFAULT_PROFILES[key]


def profiles() -> tuple[RunProfile, ...]:
    return tuple(_DEFAULT_PROFILES.values())


def _profile_key(name: str) -> str:
    if not isinstance(name, str):
        raise ValueError("O identificador do perfil deve ser texto.")
    key = name.strip().lower()
    if key not in _DEFAULT_PROFILES:
        valid = ", ".join(_DEFAULT_PROFILES)
        raise ValueError(f"Perfil desconhecido '{name}'. Perfis válidos: {valid}")
    return key


class ProfileSettingsStore:
    """Persist each profile independently without rewriting unrelated settings."""

    VERSION = 1

    def __init__(self, path: str | Path) -> None:
        self.path = Path(path)

    def load(self) -> tuple[dict[str, RunProfile], list[str]]:
        defaults = _DEFAULT_PROFILES.copy()
        if not self.path.exists():
            return defaults, []

        try:
            document = json.loads(self.path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError) as exc:
            raise ValueError(f"Não foi possível ler as configurações de perfis: {exc}") from exc
        if not isinstance(document, dict) or document.get("version") != self.VERSION:
            raise ValueError("O arquivo de perfis tem formato ou versão inválidos; ele foi preservado.")

        configured = document.get("profiles", {})
        if not isinstance(configured, dict):
            raise ValueError("A seção profiles do arquivo de configuração deve ser um objeto.")

        resolved = {}
        warnings = []
        for name, default_profile in _DEFAULT_PROFILES.items():
            raw_values = configured.get(name, {})
            if not isinstance(raw_values, dict):
                warnings.append(f"Configuração inválida em {name}; usando os padrões desse perfil.")
                resolved[name] = default_profile
                continue
            merged = default_profile.settings()
            for field, value in raw_values.items():
                if field not in merged:
                    warnings.append(f"Campo desconhecido ignorado em {name}: {field}.")
                    continue
                try:
                    if field in {"delay_min", "delay_max"}:
                        candidate = validate_profile_settings(
                            name,
                            {"delay_min": value, "delay_max": value},
                        )
                    else:
                        candidate = validate_profile_settings(name, {**merged, field: value})
                except ValueError:
                    warnings.append(f"Valor inválido em {name}.{field}; usando o padrão desse campo.")
                    continue
                merged[field] = candidate.settings()[field]
            try:
                resolved[name] = validate_profile_settings(name, merged)
            except ValueError as exc:
                merged["delay_min"] = default_profile.delay_min
                merged["delay_max"] = default_profile.delay_max
                warnings.append(f"Intervalos inválidos em {name}; usando os padrões desse perfil: {exc}")
                resolved[name] = validate_profile_settings(name, merged)
        return resolved, warnings

    def save(self, name: str, values: dict[str, Any]) -> RunProfile:
        key = _profile_key(name)
        profile = validate_profile_settings(key, values)
        if self.path.exists():
            try:
                document = json.loads(self.path.read_text(encoding="utf-8"))
            except (OSError, json.JSONDecodeError) as exc:
                raise ValueError(f"Arquivo de perfis inválido e preservado: {exc}") from exc
            if (
                not isinstance(document, dict)
                or document.get("version") != self.VERSION
                or not isinstance(document.get("profiles", {}), dict)
            ):
                raise ValueError("Arquivo de perfis inválido e preservado; não foi sobrescrito.")
        else:
            document = {"version": self.VERSION, "profiles": {}}

        configured = document.setdefault("profiles", {})
        configured[key] = profile.settings()
        self.path.parent.mkdir(parents=True, exist_ok=True)
        temporary = self.path.with_suffix(self.path.suffix + ".tmp")
        temporary.write_text(json.dumps(document, ensure_ascii=False, indent=2), encoding="utf-8")
        temporary.replace(self.path)
        return profile
