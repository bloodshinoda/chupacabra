from __future__ import annotations

import csv
from pathlib import Path
import sys
import tempfile
import threading
import time
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
        self.calls = []

    def scrape(
        self,
        queries,
        *,
        lang,
        country,
        limit,
        max_concurrent,
        output_file,
        progress=None,
        **_kwargs,
    ):
        self.calls.append({"limit": limit, "max_concurrent": max_concurrent})
        if self.fail:
            raise RuntimeError("falha simulada do crawler")
        if self.cancel_runner is not None:
            self.cancel_runner.cancel()
        if progress is not None:
            progress("coleta simulada", results=1)
        path = Path(output_file)
        path.parent.mkdir(parents=True, exist_ok=True)
        with path.open("w", newline="", encoding="utf-8") as handle:
            writer = csv.writer(handle)
            writer.writerow(["id", "title"])
            writer.writerow(["1", "Lead de teste"])
        return CrawlResult(raw_file=str(path), count=1, collected_count=1, duplicates_removed=0)


class EngineLifecycleTests(unittest.TestCase):
    def test_daemon_repara_mojibake_no_limite_do_protocolo(self) -> None:
        from engine.daemon import EngineDaemon

        payload = {"query": "GrÃ¡ficas em Angelina SC", "nested": ["SÃ£o Paulo", "AÃ§ores"]}
        repaired = EngineDaemon._repair_mojibake(payload)

        self.assertEqual(repaired["query"], "Gráficas em Angelina SC")
        self.assertEqual(repaired["nested"], ["São Paulo", "Açores"])

    def _install_fake_pipeline(self) -> None:
        package = types.ModuleType("pipeline")
        module = types.ModuleType("pipeline.orchestrator")
        pipeline_calls = []

        def run_pipeline(*, mode, input_path, **_kwargs):
            source = Path(input_path)
            pipeline_calls.append(_kwargs)
            target = source.with_name(source.stem + "_enriched.csv")
            target.write_text(source.read_text(encoding="utf-8"), encoding="utf-8")
            return target

        module.run_pipeline = run_pipeline
        module.calls = pipeline_calls
        package.orchestrator = module
        sys.modules["pipeline"] = package
        sys.modules["pipeline.orchestrator"] = module

        report_module = types.ModuleType("gerar_relatorio")

        def build_workbook(files_by_slug, out_path, lang="pt", **_kwargs):
            output = Path(out_path)
            output.parent.mkdir(parents=True, exist_ok=True)
            output.write_bytes(b"fake-xlsx")
            return str(output), list(files_by_slug.items())

        report_module.build_workbook = build_workbook
        sys.modules["gerar_relatorio"] = report_module

    def test_falha_de_job_falha_a_run(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            runner = ProspectingRunner(
                store=RunStore(tmp),
                crawler=FakeCrawler(Path(tmp), fail=True),
            )
            events = []
            runner.events._handler = lambda event: events.append(event.type)

            run = runner.run([("teste", "Chapeco", "Agencia", "consulta")], profile="rapido")

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
                profile="rapido",
            )

            self.assertEqual(run.status.value, "cancelled")
            self.assertEqual(run.jobs[0].status.value, "completed")
            self.assertEqual(run.jobs[1].status.value, "cancelled")
            self.assertIn("run_cancelled", events)
            self.assertNotIn("run_completed", events)

    def test_deduplicacao_expoe_contagens_do_crawler(self) -> None:
        from mapScraper.mapScraper.placesCrawlerV2 import save_to_csv

        with tempfile.TemporaryDirectory() as tmp:
            output = Path(tmp) / "bares.csv"
            rows = [
                {"id": "1", "title": "Bar A"},
                {"id": "1", "title": "Bar A duplicado"},
                {"id": "2", "title": "Bar B"},
            ]

            stats = save_to_csv(rows, str(output))

            self.assertEqual(stats["collected_count"], 3)
            self.assertEqual(stats["unique_count"], 2)
            self.assertEqual(stats["duplicates_removed"], 1)
            with output.open(encoding="utf-8", newline="") as handle:
                self.assertEqual(sum(1 for _ in csv.DictReader(handle)), 2)

    def test_timer_so_existe_entre_jobs(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            self._install_fake_pipeline()
            events = []
            runner = ProspectingRunner(
                store=RunStore(tmp),
                crawler=FakeCrawler(Path(tmp)),
            )
            runner.events._handler = lambda event: events.append(event.type)

            runner.run([("teste", "Chapeco", "Agencia", "consulta")], profile="rapido")
            self.assertNotIn("run_delay", events)

            events.clear()
            runner.run(
                [
                    ("primeiro", "Chapeco", "Agencia", "consulta 1"),
                    ("segundo", "Chapeco", "Grafica", "consulta 2"),
                ],
                profile="rapido",
            )
            self.assertIn("run_delay", events)
            self.assertIn("run_delay_tick", events)

    def test_profile_settings_chegam_ao_crawler_e_jobs_rodem_com_concorrencia_limitada(self) -> None:
        from engine.orchestration.profiles import get_profile

        class ParallelCrawler(FakeCrawler):
            def __init__(self, root: Path) -> None:
                super().__init__(root)
                self.active = 0
                self.max_active = 0
                self.lock = threading.Lock()

            def scrape(self, *args, **kwargs):
                with self.lock:
                    self.active += 1
                    self.max_active = max(self.max_active, self.active)
                try:
                    time.sleep(0.05)
                    return super().scrape(*args, **kwargs)
                finally:
                    with self.lock:
                        self.active -= 1

        with tempfile.TemporaryDirectory() as tmp:
            self._install_fake_pipeline()
            crawler = ParallelCrawler(Path(tmp))
            runner = ProspectingRunner(store=RunStore(tmp), crawler=crawler)
            settings = get_profile("balanceado").settings()
            settings.update({
                "limit": 37,
                "scraper_concurrency": 2,
                "scrape_websites": False,
                "web_concurrency": 5,
                "web_batch_size": 12,
                "web_timeout": 4,
                "delay_min": 0,
                "delay_max": 0,
            })

            run = runner.run(
                [("um", "Chapeco", "Agencia", "consulta 1"),
                 ("dois", "Chapeco", "Grafica", "consulta 2"),
                 ("tres", "Chapeco", "Clinica", "consulta 3")],
                profile="balanceado",
                profile_settings=settings,
            )

            self.assertEqual(run.profile_settings, settings)
            self.assertEqual([call["limit"] for call in crawler.calls], [37, 37, 37])
            self.assertEqual([call["max_concurrent"] for call in crawler.calls], [2, 2, 2])
            self.assertEqual(crawler.max_active, 2)
            pipeline_calls = sys.modules["pipeline.orchestrator"].calls
            self.assertEqual(len(pipeline_calls), 3)
            self.assertTrue(all(call["scrape_websites"] is False for call in pipeline_calls))
            self.assertTrue(all(call["web_concurrent"] == 5 for call in pipeline_calls))
            self.assertTrue(all(call["web_batch_size"] == 12 for call in pipeline_calls))
            self.assertTrue(all(call["web_timeout"] == 4 for call in pipeline_calls))

    def test_nicho_personalizado_usa_nome_no_job_e_no_relatorio(self) -> None:
        from engine.geography.planner import build_matrix_jobs
        from engine.geography.models import TargetLocation

        jobs = build_matrix_jobs(
            [TargetLocation(id="br:sc:chapeco", country="BR", state_code="SC", state_name="Santa Catarina", city="Chapecó")],
            [("custom:fbaa4cb1-d0f7-401c-88a4-df7eb61f2823", "Assistência Técnica em Informática")],
        )

        self.assertEqual(jobs[0][2], "Assistência Técnica em Informática")
        self.assertIn("Assistência Técnica em Informática em Chapecó SC", jobs[0][3])

    def test_job_usa_categoria_sem_incluir_o_slug_geografico(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            self._install_fake_pipeline()
            runner = ProspectingRunner(
                store=RunStore(tmp),
                crawler=FakeCrawler(Path(tmp)),
            )

            run = runner.run(
                [(
                    "agencias_publicidade_br_sc_aguas_de_chapeco",
                    "Águas de Chapecó",
                    "agencias_publicidade",
                    "Agências de publicidade em Águas de Chapecó SC",
                )],
                profile="rapido",
            )

            job = run.jobs[0]
            self.assertEqual(job.category_slug, "agencias_publicidade")
            self.assertEqual(job.category, "agencias_publicidade")
            self.assertEqual(job.query, "Agências de publicidade em Águas de Chapecó SC")

    def test_arquivo_enriquecido_usa_nome_canonico(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            self._install_fake_pipeline()
            runner = ProspectingRunner(
                store=RunStore(tmp),
                crawler=FakeCrawler(Path(tmp)),
            )

            run = runner.run([("teste", "Chapeco", "Agencia", "consulta")], profile="rapido")
            enriched = Path(run.jobs[0].enriched_file)

            self.assertEqual(enriched.name, "enriched.csv")
            self.assertTrue(enriched.exists())
            self.assertFalse(enriched.with_name("raw_enriched.csv").exists())
            self.assertEqual(run.report_file, str(Path(tmp) / run.id / "report.xlsx"))
            self.assertTrue(Path(run.report_file).exists())


if __name__ == "__main__":
    unittest.main()
