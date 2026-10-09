"""BrasilAPI CNPJ lookup used by the enrichment pipeline."""

from __future__ import annotations

import logging
import re
from typing import Any

import aiohttp

logger = logging.getLogger(__name__)

_CNPJ_RE = re.compile(r"^\d{14}$")
_ENDPOINT = "https://brasilapi.com.br/api/cnpj/v1/{cnpj}"
_DEFAULT_TIMEOUT = 10

_EMPTY_RESULT: dict[str, Any] = {}


def _normalize_cnpj(cnpj: str) -> str:
    return re.sub(r"\D", "", str(cnpj or ""))


async def lookup_cnpj(
    session: aiohttp.ClientSession,
    cnpj: str,
    timeout: int = _DEFAULT_TIMEOUT,
) -> dict[str, Any]:
    """Look up a CNPJ in BrasilAPI.

    The lookup is deliberately best-effort: any invalid input, HTTP error,
    timeout, malformed JSON, or unexpected response schema returns an empty
    dictionary so enrichment can continue normally.
    """
    normalized = _normalize_cnpj(cnpj)
    if not _CNPJ_RE.fullmatch(normalized):
        return dict(_EMPTY_RESULT)

    try:
        async with session.get(
            _ENDPOINT.format(cnpj=normalized),
            timeout=aiohttp.ClientTimeout(total=timeout),
        ) as response:
            if response.status != 200:
                return dict(_EMPTY_RESULT)

            payload = await response.json(content_type=None)

        if not isinstance(payload, dict):
            return dict(_EMPTY_RESULT)

        required = (
            "descricao_situacao_cadastral",
            "porte",
            "capital_social",
            "data_inicio_atividade",
            "cnae_fiscal",
        )
        if any(key not in payload for key in required):
            return dict(_EMPTY_RESULT)

        return {
            "cnpj_situacao_cadastral": payload["descricao_situacao_cadastral"],
            "cnpj_porte": payload["porte"],
            "cnpj_capital_social": payload["capital_social"],
            "cnpj_data_abertura": payload["data_inicio_atividade"],
            "cnpj_cnae_principal": payload["cnae_fiscal"],
        }
    except Exception as exc:
        logger.debug("CNPJ lookup failed for %s: %s", normalized, exc)
        return dict(_EMPTY_RESULT)
