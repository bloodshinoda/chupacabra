import gzip
import json
import os
import tempfile
import time
import unittest
from pathlib import Path
from unittest.mock import patch
from urllib.error import URLError

from engine.geography.ibge import CACHE_TTL_SECONDS, IbgeBrazilCatalog, _read_json_response

from engine.geography.models import TargetLocation
from engine.geography.planner import build_matrix_jobs


class GeographyPlannerTests(unittest.TestCase):
    def test_reads_gzip_json_response(self):
        payload = json.dumps([{"id": 1}], ensure_ascii=False).encode("utf-8")
        self.assertEqual(_read_json_response(gzip.compress(payload)), [{"id": 1}])


    def test_uses_expired_city_cache_when_ibge_is_unavailable(self):
        with tempfile.TemporaryDirectory() as directory:
            cache = Path(directory) / "cities-SC.json"
            cache.write_text(json.dumps([{"id": 4204202, "nome": "Chapeco"}]), encoding="utf-8")
            expired = time.time() - CACHE_TTL_SECONDS - 60
            os.utime(cache, (expired, expired))
            catalog = IbgeBrazilCatalog(directory)

            with patch("engine.geography.ibge.urlopen", side_effect=URLError("IBGE indisponivel")):
                cities = catalog.cities("SC")

            self.assertEqual([city.city for city in cities], ["Chapeco"])
            self.assertEqual(cities[0].id, "br:4204202")

    def test_uses_expired_population_cache_when_sidra_is_unavailable(self):
        with tempfile.TemporaryDirectory() as directory:
            cache = Path(directory) / "municipality-population-2022.json"
            cache.write_text(json.dumps({"4204202": 254781}), encoding="utf-8")
            expired = time.time() - CACHE_TTL_SECONDS - 60
            os.utime(cache, (expired, expired))
            catalog = IbgeBrazilCatalog(directory)

            with patch("engine.geography.ibge.urlopen", side_effect=URLError("SIDRA indisponivel")):
                populations = catalog._populations_2022()

            self.assertEqual(populations, {"4204202": 254781})

    def test_builds_city_category_matrix(self):
        locations = [
            TargetLocation("br:1", "BR", "SC", "Santa Catarina", "Chapeco"),
            TargetLocation("br:2", "BR", "SC", "Santa Catarina", "Xanxere"),
        ]
        categories = [("agencias", "Agencias de publicidade"), ("graficas", "Graficas")]

        jobs = build_matrix_jobs(locations, categories)

        self.assertEqual(len(jobs), 4)
        self.assertEqual(jobs[0][3], "Agencias de publicidade em Chapeco SC")
        self.assertEqual(jobs[-1][3], "Graficas em Xanxere SC")

    def test_deduplicates_same_city_category(self):
        location = TargetLocation("br:1", "BR", "SC", "Santa Catarina", "Chapeco")
        jobs = build_matrix_jobs([location, location], [("agencias", "Agencias")])
        self.assertEqual(len(jobs), 1)

    def test_international_query_uses_country_and_in(self):
        location = TargetLocation("world:US:1", "US", "CA", "California", "San Francisco")
        jobs = build_matrix_jobs([location], [("marketing", "Marketing agencies")])

        self.assertEqual(jobs[0][0], "marketing_us_ca_san_francisco")
        self.assertEqual(jobs[0][3], "Marketing agencies in San Francisco US")


if __name__ == "__main__":
    unittest.main()
