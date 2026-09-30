"""Common contract for geographic catalog providers."""
from __future__ import annotations

from typing import Protocol

from engine.geography.models import TargetLocation


class GeographyCatalog(Protocol):
    def search_cities(self, query: str, country_code: str | None = None) -> list[TargetLocation]:
        """Return selectable cities matching a human search."""
