"""JSON-line daemon used by the Tauri bridge in the desktop application."""
from __future__ import annotations

import csv
import errno
import json
import sys
import threading
from pathlib import Path

from engine.geography.ibge import IbgeBrazilCatalog
from engine.geography.world import WorldCityCatalog
from engine.geography.models import TargetLocation
from engine.orchestration.runner import ProspectingRunner
from engine.orchestration.targets import CATEGORIES, build_jobs
from engine.storage import RunStore

MAX_JOBS = 10_000


class EngineDaemon:
    def __init__(self) -> None:
        self.runner = ProspectingRunner(
            store=RunStore("runs"),
            event_handler=self._emit_event,
        )
        self._lock = threading.Lock()
        self._run_thread: threading.Thread | None = None
        self._catalog = IbgeBrazilCatalog()
        self._world_catalog = WorldCityCatalog()
        self._stdout_lock = threading.Lock()
        self._stdout_available = True

    @staticmethod
    def _repair_mojibake(value):
        """Repair common UTF-8-as-Windows-1252 corruption at the protocol boundary."""
        if isinstance(value, str):
            if not any(marker in value for marker in ("Ã", "Â", "â€", "â€™", "â€œ", "â€�", "â€“", "â€”")):
                return value
            try:
                repaired = value.encode("cp1252").decode("utf-8")
            except (UnicodeEncodeError, UnicodeDecodeError):
                return value
            return repaired if repaired != value else value
        if isinstance(value, dict):
            return {
                EngineDaemon._repair_mojibake(key): EngineDaemon._repair_mojibake(item)
                for key, item in value.items()
            }
        if isinstance(value, list):
            return [EngineDaemon._repair_mojibake(item) for item in value]
        if isinstance(value, tuple):
            return [EngineDaemon._repair_mojibake(item) for item in value]
        return value

    @staticmethod
    def _sanitize_surrogates(value):
        if isinstance(value, str):
            return value.encode("utf-8", errors="replace").decode("utf-8")
        if isinstance(value, dict):
            return {
                EngineDaemon._sanitize_surrogates(key): EngineDaemon._sanitize_surrogates(item)
                for key, item in value.items()
            }
        if isinstance(value, list):
            return [EngineDaemon._sanitize_surrogates(item) for item in value]
        if isinstance(value, tuple):
            return [EngineDaemon._sanitize_surrogates(item) for item in value]
        return value

    def _emit_payload(self, payload: dict) -> None:
        # O canal stdout é um protocolo entre o daemon e o Tauri. A perda
        # desse pipe não pode derrubar a execução do crawler.
        if not self._stdout_available:
            return

        safe_payload = self._sanitize_surrogates(payload)
        line = json.dumps(safe_payload, ensure_ascii=False) + "\n"

        with self._stdout_lock:
            if not self._stdout_available:
                return
            try:
                sys.stdout.write(line)
                sys.stdout.flush()
            except (BrokenPipeError, OSError) as exc:
                # Windows pode reportar um pipe fechado como EINVAL (22).
                if isinstance(exc, BrokenPipeError) or getattr(exc, "errno", None) in {
                    errno.EPIPE,
                    errno.EINVAL,
                    errno.EBADF,
                }:
                    self._stdout_available = False
                    return
                raise

    def _emit_event(self, event) -> None:
        self._emit_payload(event.to_dict())

    def _start_run(self, payload: dict) -> None:
        with self._lock:
            if self._run_thread is not None and self._run_thread.is_alive():
                raise RuntimeError("A prospecting run is already active")

            profile = str(payload.get("profile", "balanceado"))
            runs_dir = str(payload.get("runs_dir", "runs"))
            reports_dir = payload.get("reports_dir")
            self.runner.store = RunStore(
                Path(runs_dir),
                report_root=Path(str(reports_dir)) if reports_dir else None,
            )

            raw_targets = payload.get("targets")
            if raw_targets:
                locations = [
                    TargetLocation(
                        id=str(target["id"]),
                        country=str(target.get("country", "BR")),
                        state_code=str(target.get("state_code", "")),
                        state_name=str(target.get("state_name", target.get("state_code", ""))),
                        city=str(target["city"]),
                        latitude=target.get("latitude"),
                        longitude=target.get("longitude"),
                        population_2022=target.get("population_2022"),
                        is_capital=bool(target.get("is_capital", False)),
                    )
                    for target in raw_targets
                ]
                categories = [tuple(item) for item in payload.get("categories", CATEGORIES)]
                jobs = build_jobs(locations, categories)
            else:
                query = str(payload.get("query", "")).strip()
                if not query:
                    raise ValueError("query is required")
                city = str(payload.get("city", "custom"))
                category = str(payload.get("category", "custom"))
                jobs = [("manual_001", city, category, query)]

            max_jobs = int(payload.get("max_jobs", MAX_JOBS))
            if max_jobs < 1 or max_jobs > MAX_JOBS:
                raise ValueError(f"max_jobs deve estar entre 1 e {MAX_JOBS}")
            if len(jobs) > max_jobs:
                raise ValueError(
                    f"A matriz gerou {len(jobs):,} jobs, acima do limite configurado de {max_jobs:,}."
                )

            if not jobs:
                raise ValueError("Nenhum alvo selecionado")

            lang = str(payload.get("lang", "pt"))
            country = str(payload.get("country", "br"))
            self._run_thread = threading.Thread(
                target=self.runner.run,
                kwargs={
                    "jobs": jobs,
                    "profile": profile,
                    "lang": lang,
                    "country": country,
                },
                name="chupacabra-engine-run",
                daemon=True,
            )
            self._run_thread.start()

    def _list_runs(self) -> None:
        root = Path(self.runner.store.root)
        runs = []
        if root.exists():
            for run_file in sorted(root.glob("*/run.json"), key=lambda path: path.parent.name, reverse=True):
                try:
                    data = json.loads(run_file.read_text(encoding="utf-8"))
                    runs.append({
                        "id": data.get("id", run_file.parent.name),
                        "profile": data.get("profile", ""),
                        "status": data.get("status", ""),
                        "total_jobs": data.get("total_jobs", 0),
                        "completed_jobs": data.get("completed_jobs", 0),
                        "failed_jobs": data.get("failed_jobs", 0),
                        "started_at": data.get("started_at"),
                        "finished_at": data.get("finished_at"),
                        "report_file": data.get("report_file"),
                    })
                except (OSError, json.JSONDecodeError):
                    continue
        self._emit_payload({
            "type": "runs_list",
            "correlation_id": payload.get("correlation_id"),
            "runs": runs,
        })

    def _load_run_leads(self, payload: dict) -> None:
        run_id = str(payload.get("run_id", "")).strip()
        if not run_id:
            raise ValueError("run_id is required")

        run_dir = self.runner.store.run_dir(run_id)
        if not run_dir.exists():
            raise ValueError(f"Execução não encontrada: {run_id}")

        leads = []
        for job_file in sorted(run_dir.glob("jobs/*/job.json")):
            try:
                job = json.loads(job_file.read_text(encoding="utf-8"))
            except (OSError, json.JSONDecodeError):
                continue

            enriched_file = job.get("enriched_file")
            csv_path = Path(enriched_file) if enriched_file else self.runner.store.job_output_path(
                run_id, job_file.parent.name, enriched=True
            )
            if not csv_path.exists():
                continue

            try:
                with csv_path.open("r", encoding="utf-8-sig", newline="") as handle:
                    for row in csv.DictReader(handle):
                        row["run_id"] = run_id
                        row["job_id"] = str(job.get("id", job_file.parent.name))
                        row["city"] = str(job.get("city", ""))
                        row["category"] = str(job.get("category", row.get("category", "")))
                        row["category_slug"] = str(job.get("category_slug", ""))
                        leads.append(row)
            except (OSError, UnicodeError):
                continue

        self._emit_payload({
            "type": "run_leads",
            "correlation_id": payload.get("correlation_id"),
            "run_id": run_id,
            "leads": leads,
        })

    def _dispatch(self, payload: dict) -> None:
        command = payload.get("command")
        if command == "start_run":
            self._start_run(payload)
        elif command == "list_runs":
            self._list_runs()
        elif command == "load_run_leads":
            self._load_run_leads(payload)
        elif command == "catalog_states":
            self._emit_payload({
                "type": "catalog_states",
                "correlation_id": payload.get("correlation_id"),
                "states": self._catalog.states(),
            })
        elif command == "catalog_world_cities":
            query = str(payload.get("query", ""))
            country_code = payload.get("country_code")
            cities = [item.to_dict() for item in self._world_catalog.search_cities(query, str(country_code) if country_code else None)]
            self._emit_payload({
                "type": "catalog_world_cities",
                "correlation_id": payload.get("correlation_id"),
                "cities": cities,
            })
        elif command == "catalog_cities":
            state = str(payload.get("state_code", ""))
            search = str(payload.get("search", ""))
            include_population = bool(payload.get("include_population", False))
            cities = [
                item.to_dict()
                for item in self._catalog.cities(
                    state,
                    search,
                    include_population=include_population,
                )
            ]
            self._emit_payload({
                "type": "catalog_cities",
                "correlation_id": payload.get("correlation_id"),
                "state_code": state.upper(),
                "cities": cities,
            })
        elif command == "pause_run":
            self.runner.pause()
        elif command == "resume_run":
            self.runner.resume()
        elif command == "cancel_run":
            self.runner.cancel()
        elif command == "status":
            run = self.runner.active_run
            self._emit_payload(
                {
                    "type": "engine_status",
                    "run": run.to_dict() if run else None,
                }
            )
        else:
            raise ValueError(f"unknown command: {command}")

    def serve(self) -> None:
        self._emit_payload({"type": "engine_ready", "status": "ready"})
        for line in sys.stdin:
            line = line.strip()
            if not line:
                continue
            payload = {}
            try:
                payload = self._repair_mojibake(json.loads(line))
                self._dispatch(payload)
            except Exception as exc:
                self._emit_payload({
                    "type": "engine_error",
                    "correlation_id": payload.get("correlation_id") if isinstance(payload, dict) else None,
                    "error": str(exc),
                })


if __name__ == "__main__":
    for stream in (sys.stdin, sys.stdout, sys.stderr):
        if hasattr(stream, "reconfigure"):
            stream.reconfigure(encoding="utf-8", errors="strict")
    EngineDaemon().serve()
