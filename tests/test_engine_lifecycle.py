from __future__ import annotations

import csv
from pathlib import Path
import sys
import tempfile
import types
import unittest

from engine.crawler import CrawlResult
from engine.orchestration.runner import ProspectingRunner
from engine.storage import RunStore


class FakeCrawler:
    def __init__(self, root: Path, *, fail: bool = False, cancel_runner=None) -> None:
        self.mapscraper_root = root
        self.fail = fail
        self.cancel_runner = cancel_runner

    def scrape(self, queries, *, lang, country, limit, max_concurrent, output_file):
        if self.fail:
            raise RuntimeError("falha simulada do crawler")
        if self.cancel_runner is not None:
            self.cancel_runner.cancel()
        path = Path(output_file)
        path.parent.mkdir(parents=True, exist_ok=True)
        with path.open("w", newline="", encoding="utf-8") as handle:
            writer = csv.writer(handle)
            writer.writerow(["id", "title"])
            writer.writerow(["1", "Lead de teste"])
        return CrawlResult(raw_file=str(path), count=1)


class EngineLifecycleTests(unittest.TestCase):
    def _install_fake_pipeline(self) -> None:
        package = types.ModuleType("pipeline")
        module = types.ModuleType("pipeline.orchestrator")

        def run_pipeline(*, mode, input_path, **_kwargs):
            source = Path(input_path)
            target = source.with_name(source.stem + "_enriched.csv")
            target.write_text(source.read_text(encoding="utf-8"), encoding="utf-8")
            return target

        module.run_pipeline = run_pipeline
        package.orchestrator = module
        sys.modules["pipeline"] = package
        sys.modules["pipeline.orchestrator"] = module

    def test_falha_de_job_falha_a_run(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            runner = ProspectingRunner(
                store=RunStore(tmp),
                crawler=FakeCrawler(Path(tmp), fail=True),
            )
            events = []
            runner.events._handler = lambda event: events.append(event.type)

            run = runner.run([("teste", "Chapeco", "Agencia", "consulta")], profile="fast")

            self.assertEqual(run.status.value, "failed")
            self.assertEqual(run.failed_jobs, 1)
            self.assertIn("job_failed", events)
            self.assertIn("run_failed", events)
            self.assertNotIn("run_completed", events)

    def test_cancelamento_cancela_jobs_pendentes(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            runner = ProspectingRunner(store=RunStore(tmp))
            crawler = FakeCrawler(Path(tmp), cancel_runner=runner)
            runner.crawler = crawler
            self._install_fake_pipeline()
            events = []
            runner.events._handler = lambda event: events.append(event.type)

            run = runner.run(
                [
                    ("primeiro", "Chapeco", "Agencia", "consulta 1"),
                    ("segundo", "Chapeco", "Grafica", "consulta 2"),
                ],
                profile="fast",
            )

            self.assertEqual(run.status.value, "cancelled")
            self.assertEqual(run.jobs[0].status.value, "completed")
            self.assertEqual(run.jobs[1].status.value, "cancelled")
            self.assertIn("run_cancelled", events)
            self.assertNotIn("run_completed", events)

    def test_arquivo_enriquecido_usa_nome_canonico(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            self._install_fake_pipeline()
            runner = ProspectingRunner(
                store=RunStore(tmp),
                crawler=FakeCrawler(Path(tmp)),
            )

            run = runner.run([("teste", "Chapeco", "Agencia", "consulta")], profile="fast")
            enriched = Path(run.jobs[0].enriched_file)

            self.assertEqual(enriched.name, "enriched.csv")
            self.assertTrue(enriched.exists())
            self.assertFalse(enriched.with_name("raw_enriched.csv").exists())


if __name__ == "__main__":
    unittest.main()
