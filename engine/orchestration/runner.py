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
        run_id = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S") + "_" + uuid4().hex[:6]
        run = ProspectingRun(id=run_id, profile=selected.name)
        run.jobs = [
            SearchJob(
                id=f"{index:03d}",
                run_id=run_id,
                city=city,
                category=category,
                query=query,
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

                if job.status is JobStatus.COMPLETED:
                    self._delay_between_jobs(selected)

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

        try:
            result = self.crawler.scrape(
                [job.query],
                lang=lang,
                country=country,
                limit=profile.limit,
                max_concurrent=profile.scraper_concurrency,
                output_file=job.raw_file,
                progress=lambda message, **details: self.events.emit(
                    "crawl_progress",
                    run=run.to_dict(),
                    job=job.to_dict(),
                    message=message,
                    **details,
                ),
            )

            sys.path.insert(0, str(self.crawler.mapscraper_root))
            from pipeline.orchestrator import run_pipeline

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
            self.events.emit(
                "enrichment_completed",
                run=run.to_dict(),
                job=job.to_dict(),
                message=f"Enriquecimento concluído · {result.count} resultados processados.",
            )
            job.enriched_file = str(enriched)
            job.complete(result.count)
            run.recalculate()
            self.events.emit("job_completed", run=run.to_dict(), job=job.to_dict())
        except Exception as exc:
            job.fail(str(exc))
            run.recalculate()
            self.events.emit("job_failed", run=run.to_dict(), job=job.to_dict(), error=str(exc))
        finally:
            root_logger.removeHandler(handler)
            handler.close()
            self.store.save_job(run.id, job)

    def _delay_between_jobs(self, profile: RunProfile) -> None:
        delay = random.uniform(profile.delay_min, profile.delay_max)
        deadline = time.monotonic() + delay
        while time.monotonic() < deadline:
            if self._cancel.is_set():
                return
            self._resume_gate.wait()
            time.sleep(min(0.5, max(0.0, deadline - time.monotonic())))
