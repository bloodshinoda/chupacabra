import unittest

from mapScraper.enrichment.cnpj_lookup import lookup_cnpj
from mapScraper.enrichment.web_scraper import _analyze, _enrich_one


class _FakeResponse:
    def __init__(self, status=200, *, text="", payload=None):
        self.status = status
        self._text = text
        self._payload = payload

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc, tb):
        return False

    async def text(self, **kwargs):
        return self._text

    async def json(self, **kwargs):
        return self._payload


class _FakeSession:
    def __init__(self, html="", payload=None, status=200):
        self.html = html
        self.payload = payload
        self.status = status
        self.calls = []

    def get(self, url, **kwargs):
        self.calls.append((url, kwargs))
        if "brasilapi.com.br" in url:
            return _FakeResponse(self.status, payload=self.payload)
        return _FakeResponse(200, text=self.html)


class CnpjEnrichmentTests(unittest.IsolatedAsyncioTestCase):
    def test_extracts_cnpj_from_homepage_html(self):
        result = _analyze(
            "<html><body>CNPJ: 08.885.404/0001-11<br>Serviços</body></html>"
        )
        self.assertEqual(result["web_cnpj"], "08885404000111")

    async def test_lookup_maps_brasilapi_fields(self):
        payload = {
            "descricao_situacao_cadastral": "ATIVA",
            "porte": "MICRO EMPRESA",
            "capital_social": 150000,
            "data_inicio_atividade": "2007-06-12",
            "cnae_fiscal": 1821100,
        }
        session = _FakeSession(payload=payload)
        result = await lookup_cnpj(session, "08.885.404/0001-11")

        self.assertEqual(
            result,
            {
                "cnpj_situacao_cadastral": "ATIVA",
                "cnpj_porte": "MICRO EMPRESA",
                "cnpj_capital_social": 150000,
                "cnpj_data_abertura": "2007-06-12",
                "cnpj_cnae_principal": 1821100,
            },
        )

    async def test_lookup_fails_silently_for_404_and_bad_schema(self):
        not_found = _FakeSession(status=404)
        self.assertEqual(await lookup_cnpj(not_found, "08885404000111"), {})

        bad_schema = _FakeSession(payload={"porte": "MICRO EMPRESA"})
        self.assertEqual(await lookup_cnpj(bad_schema, "08885404000111"), {})

    async def test_web_enrichment_calls_cnpj_lookup_only_when_present(self):
        payload = {
            "descricao_situacao_cadastral": "ATIVA",
            "porte": "MICRO EMPRESA",
            "capital_social": 150000,
            "data_inicio_atividade": "2007-06-12",
            "cnae_fiscal": 1821100,
        }
        session = _FakeSession(
            html="CNPJ 08.885.404/0001-11",
            payload=payload,
        )
        result = await _enrich_one(
            session,
            "https://example.com",
            __import__("asyncio").Semaphore(1),
            17,
        )

        self.assertEqual(result["web_cnpj"], "08885404000111")
        self.assertEqual(result["cnpj_situacao_cadastral"], "ATIVA")
        self.assertEqual(len(session.calls), 2)
        self.assertTrue(all(call[1]["timeout"].total == 17 for call in session.calls))

        session_without_cnpj = _FakeSession(html="Sem CNPJ aqui")
        result_without_cnpj = await _enrich_one(
            session_without_cnpj,
            "https://example.com",
            __import__("asyncio").Semaphore(1),
            10,
        )
        self.assertEqual(result_without_cnpj["web_cnpj"], "")
        self.assertEqual(len(session_without_cnpj.calls), 1)
        self.assertEqual(session_without_cnpj.calls[0][1]["timeout"].total, 10)


if __name__ == "__main__":
    unittest.main()
