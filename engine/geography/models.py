"""Stable geographic models used by the prospecting matrix."""
from __future__ import annotations

from dataclasses import asdict, dataclass


@dataclass(frozen=True, slots=True)
class TargetLocation:
    """A selectable municipality with stable IBGE identity when available."""

    id: str
    country: str
    state_code: str
    state_name: str
    city: str
    latitude: float | None = None
    longitude: float | None = None

    def to_dict(self) -> dict:
        return asdict(self)
