"""Sequential prospecting runner built on the existing MapScraper pipeline."""
from __future__ import annotations

from datetime import datetime, timezone
import logging
from pathlib import Path
import random
import shutil
import sys
import threading
import time
from typing import Iterable

import pandas as pd
from uuid import uuid4

from engine.crawler import CrawlerAdapter
from engine.models import JobStatus, ProspectingRun, RunStatus, SearchJob
from engine.orchestration.events import EventBus, EventHandler
from engine.orchestration.profiles import RunProfile, get_profile
from engine.storage import RunStore

logger = logging.getLogger(__name__)


class ProspectingRunner:
    """Run jobs sequentially while exposing pause/resume/cancel controls.

    The first P0 implementation intentionally pauses only between jobs. The
    current crawler has no cancellation hook at page level, so cancelling an
    in-flight Google Maps request is deferred until that request finishes.
    """

    def __init__(
        self,
        *,
        store: RunStore | None = None,
        crawler: CrawlerAdapter | None = None,
        event_handler: EventHandler | None = None,
    ) -> None:
        self.store = store or RunStore()
        self.crawler = crawler or CrawlerAdapter()
        self.events = EventBus(event_handler)
        self._resume_gate = threading.Event()
        self._resume_gate.set()
        self._cancel = threading.Event()
        self._active_run: ProspectingRun | None = None

    @property
    def active_run(self) -> ProspectingRun | None:
        return self._active_run

    def pause(self) -> None:
        self._resume_gate.clear()
        if self._active_run is not None and self._active_run.status is RunStatus.RUNNING:
            self._active_run.status = RunStatus.PAUSED
            self.store.save_run(self._active_run)
        self.events.emit("run_paused")

    def resume(self) -> None:
        self._resume_gate.set()
        if self._active_run is not None and self._active_run.status is RunStatus.PAUSED:
            self._active_run.status = RunStatus.RUNNING
            self.store.save_run(self._active_run)
        self.events.emit("run_resumed")

    def cancel(self) -> None:
        self._cancel.set()
        self._resume_gate.set()

    def run(
        self,
        jobs: Iterable[tuple[str, str, str, str]],
        *,
        profile: str | RunProfile = "balanceado",
        lang: str = "pt",
        country: str = "br",
    ) -> ProspectingRun:
        if self._active_run is not None:
            raise RuntimeError("A prospecting run is already active")

        selected = get_profile(profile) if isinstance(profile, str) else profile
        job_specs = list(jobs)
        base_id = datetime.now().astimezone().strftime("%Y-%m-%d %H.%M")
        run_id = base_id
        if self.store.run_dir(run_id).exists():
            run_id = f"{base_id}.{datetime.now().astimezone().strftime('%S')}-{uuid4().hex[:4]}"
        run = ProspectingRun(id=run_id, profile=selected.name, lang=lang)
        run.jobs = [
            SearchJob(
                id=f"{index:03d}",
                run_id=run_id,
                city=city,
                category=category,
                query=query,
                category_slug=category,
            )
            for index, (_slug, city, category, query) in enumerate(job_specs, start=1)
        ]
        run.total_jobs = len(run.jobs)
        self._active_run = run
        self._cancel.clear()
        self._resume_gate.set()
        run.start()
        self.store.save_run(run)
        self.events.emit("run_started", run=run.to_dict())

        try:
            for job, spec in zip(run.jobs, job_specs, strict=True):
                if self._cancel.is_set():
                    job.cancel()
                    self.store.save_job(run.id, job)
                    continue

                self._resume_gate.wait()
                if self._cancel.is_set():
                    job.cancel()
                    self.store.save_job(run.id, job)
                    continue

                self._run_job(run, job, selected, lang, country)
                run.recalculate()
                self.store.save_run(run)

                if job.status is JobStatus.COMPLETED and job.id != run.jobs[-1].id:
                    self._delay_between_jobs(selected, next_job_id=run.jobs[run.jobs.index(job) + 1].id)

            if self._cancel.is_set():
                run.cancel()
                for job in run.jobs:
                    if job.status is JobStatus.PENDING:
                        job.cancel()
                        self.store.save_job(run.id, job)
            elif run.failed_jobs:
                run.fail()
            else:
                run.complete()

            if run.completed_jobs > 0:
                self._build_report(run)
        except Exception as exc:
            logger.exception("Prospecting run failed")
            run.fail()
            self.events.emit("run_failed", run=run.to_dict(), error=str(exc))
        finally:
            run.recalculate()
            self.store.save_run(run)
            self._active_run = None

        if run.status is RunStatus.CANCELLED:
            event = "run_cancelled"
        elif run.status is RunStatus.FAILED:
            event = "run_failed"
        else:
            event = "run_completed"
        self.events.emit(event, run=run.to_dict())
        return run

    def _run_job(
        self,
        run: ProspectingRun,
        job: SearchJob,
        profile: RunProfile,
        lang: str,
        country: str,
    ) -> None:
        job.start()
        job.raw_file = str(self.store.job_output_path(run.id, job.id))
        job.enriched_file = None
        job.log_file = str(self.store.job_log_path(run.id, job.id))
        self.store.save_job(run.id, job)
        run.recalculate()
        self.events.emit("job_started", run=run.to_dict(), job=job.to_dict())

        handler = logging.FileHandler(job.log_file, encoding="utf-8")
        formatter = logging.Formatter("%(asctime)s %(levelname)-8s %(name)s — %(message)s")
        handler.setFormatter(formatter)
        root_logger = logging.getLogger()
        root_logger.addHandler(handler)

        def write_job_log(message: str) -> None:
            with Path(job.log_file).open("a", encoding="utf-8") as handle:
                timestamp = datetime.now().astimezone().strftime("%Y-%m-%d %H:%M:%S")
                handle.write(f"[{timestamp}] {message}\n")

        try:
            write_job_log(f"Job iniciado · consulta: {job.query}")
            result = self.crawler.scrape(
                [job.query],
                lang=lang,
                country=country,
                limit=profile.limit,
                max_concurrent=profile.scraper_concurrency,
                output_file=job.raw_file,
                progress=lambda message, **details: (
                    write_job_log(message),
                    self.events.emit(
                        "crawl_progress",
                        run=run.to_dict(),
                        job=job.to_dict(),
                        message=message,
                        **details,
                    ),
                )[1],
            )

            sys.path.insert(0, str(self.crawler.mapscraper_root))
            from pipeline.orchestrator import run_pipeline

            write_job_log("Iniciando enriquecimento dos dados coletados.")
            self.events.emit(
                "enrichment_started",
                run=run.to_dict(),
                job=job.to_dict(),
                message="Iniciando enriquecimento dos dados coletados.",
            )
            run_pipeline(
                mode="enrich",
                input_path=job.raw_file,
                scrape_websites=profile.scrape_websites,
                web_concurrent=profile.web_concurrency,
                web_batch_size=profile.web_batch_size,
                web_timeout=profile.web_timeout,
            )

            generated = Path(job.raw_file).with_name(Path(job.raw_file).stem + "_enriched.csv")
            enriched = self.store.job_output_path(run.id, job.id, enriched=True)
            if generated != enriched:
                enriched.parent.mkdir(parents=True, exist_ok=True)
                shutil.move(str(generated), str(enriched))
            job.enriched_file = str(enriched)

            try:
                from enrichment.scoring import localize_segment_column
                frame = pd.read_csv(enriched, dtype=str)
                frame = localize_segment_column(frame, lang=run.lang or lang)
                frame.to_csv(enriched, index=False)
            except Exception as loc_exc:
                logger.warning("Segment localization skipped: %s", loc_exc)

            write_job_log(f"Enriquecimento concluído · {result.count} resultados únicos processados.")
            self.events.emit(
                "enrichment_completed",
                run=run.to_dict(),
                job=job.to_dict(),
                message=f"Enriquecimento concluído · {result.count} resultados processados.",
            )
            job.enriched_file = str(enriched)
            job.complete(
                result.count,
                collected_count=result.collected_count,
                duplicates_count=result.duplicates_removed,
            )
            run.recalculate()
            self.events.emit("job_completed", run=run.to_dict(), job=job.to_dict())
        except Exception as exc:
            write_job_log(f"ERRO: {exc}")
            logger.exception("Job falhou")
            job.fail(str(exc))
            run.recalculate()
            self.events.emit("job_failed", run=run.to_dict(), job=job.to_dict(), error=str(exc))
        finally:
            root_logger.removeHandler(handler)
            handler.close()
            self.store.save_job(run.id, job)

    def _build_report(self, run: ProspectingRun) -> None:
        """Consolidate completed enriched jobs into the original XLSX report."""
        completed = [job for job in run.jobs if job.status is JobStatus.COMPLETED and job.enriched_file]
        if not completed:
            return

        report_path = self.store.report_path(run.id)
        report_path.parent.mkdir(parents=True, exist_ok=True)
        report_input = self.store.run_dir(run.id) / "_report_input"
        report_input.mkdir(parents=True, exist_ok=True)

        self.events.emit(
            "report_started",
            run=run.to_dict(),
            message="Consolidando os dados enriquecidos e gerando o relatório final.",
        )
        report_log = self.store.run_log_path(run.id)
        report_log.parent.mkdir(parents=True, exist_ok=True)

        def write_report_log(message: str) -> None:
            with report_log.open("a", encoding="utf-8") as handle:
                timestamp = datetime.now().astimezone().strftime("%Y-%m-%d %H:%M:%S")
                handle.write(f"[{timestamp}] {message}\n")

        try:
            write_report_log("Iniciando geração do relatório XLSX.")
            files_by_slug: dict[str, str] = {}
            for job in completed:
                slug = job.category_slug or job.category
                target = report_input / f"{slug}.csv"
                source = Path(job.enriched_file)
                if not source.exists():
                    raise FileNotFoundError(f"Arquivo enriquecido não encontrado: {source}")

                frame = pd.read_csv(source, dtype=str)
                if target.exists():
                    existing = pd.read_csv(target, dtype=str)
                    frame = pd.concat([existing, frame], ignore_index=True)
                frame.to_csv(target, index=False)
                files_by_slug[slug] = str(target)

            sys.path.insert(0, str(self.crawler.mapscraper_root))
            from gerar_relatorio import build_workbook

            build_workbook(files_by_slug, str(report_path), lang=run.lang or "pt")
            run.report_file = str(report_path)
            write_report_log(f"Relatório gerado com sucesso: {report_path}")

            self.events.emit(
                "report_completed",
                run=run.to_dict(),
                report_file=str(report_path),
                message="Relatório final gerado com sucesso.",
            )
        except Exception as exc:
            logger.exception("Falha ao gerar relatório XLSX")
            write_report_log(f"ERRO ao gerar relatório XLSX: {exc}")
            import traceback

            write_report_log(traceback.format_exc())
            for job in completed:
                if job.log_file:
                    job_log = Path(job.log_file)
                    job_log.parent.mkdir(parents=True, exist_ok=True)
                    with job_log.open("a", encoding="utf-8") as handle:
                        handle.write(f"\n[REPORT] Falha ao gerar XLSX: {exc}\n")
                        handle.write(traceback.format_exc())
            self.events.emit(
                "report_failed",
                run=run.to_dict(),
                report_file=str(report_path),
                error=str(exc),
            )
            raise
        finally:
            shutil.rmtree(report_input, ignore_errors=True)

    def _delay_between_jobs(self, profile: RunProfile, *, next_job_id: str | None = None) -> None:
        delay = random.uniform(profile.delay_min, profile.delay_max)
        self.events.emit("run_delay", delay=delay, next_job_id=next_job_id)
        deadline = time.monotonic() + delay
        while time.monotonic() < deadline:
            if self._cancel.is_set():
                return
            self._resume_gate.wait()
            remaining = max(0.0, deadline - time.monotonic())
            self.events.emit("run_delay_tick", remaining=remaining, delay=delay)
            time.sleep(min(0.5, remaining))
        self.events.emit("run_delay_tick", remaining=0.0, delay=delay)
