import unittest

from engine.geography.models import TargetLocation
from engine.geography.planner import build_matrix_jobs


class GeographyPlannerTests(unittest.TestCase):
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
