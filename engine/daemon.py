"""JSON-line daemon used by the Tauri bridge in the desktop application."""
from __future__ import annotations

import json
import sys
import threading
from pathlib import Path

from engine.geography.ibge import IbgeBrazilCatalog
from engine.geography.models import TargetLocation
from engine.orchestration.runner import ProspectingRunner
from engine.orchestration.targets import CATEGORIES, build_jobs
from engine.storage import RunStore


class EngineDaemon:
    def __init__(self) -> None:
        self.runner = ProspectingRunner(
            store=RunStore("runs"),
            event_handler=self._emit_event,
        )
        self._lock = threading.Lock()
        self._run_thread: threading.Thread | None = None
        self._catalog = IbgeBrazilCatalog()

    @staticmethod
    def _emit_payload(payload: dict) -> None:
        sys.stdout.write(json.dumps(payload, ensure_ascii=False) + "\n")
        sys.stdout.flush()

    def _emit_event(self, event) -> None:
        self._emit_payload(event.to_dict())

    def _start_run(self, payload: dict) -> None:
        with self._lock:
            if self._run_thread is not None and self._run_thread.is_alive():
                raise RuntimeError("A prospecting run is already active")

            profile = str(payload.get("profile", "fast"))
            runs_dir = str(payload.get("runs_dir", "runs"))
            self.runner.store = RunStore(Path(runs_dir))

            raw_targets = payload.get("targets")
            if raw_targets:
                locations = [
                    TargetLocation(
                        id=str(target["id"]),
                        country=str(target.get("country", "BR")),
                        state_code=str(target["state_code"]),
                        state_name=str(target.get("state_name", target["state_code"])),
                        city=str(target["city"]),
                        latitude=target.get("latitude"),
                        longitude=target.get("longitude"),
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

    def _dispatch(self, payload: dict) -> None:
        command = payload.get("command")
        if command == "start_run":
            self._start_run(payload)
        elif command == "catalog_states":
            self._emit_payload({"type": "catalog_states", "states": self._catalog.states()})
        elif command == "catalog_cities":
            state = str(payload.get("state_code", ""))
            search = str(payload.get("search", ""))
            cities = [item.to_dict() for item in self._catalog.cities(state, search)]
            self._emit_payload({"type": "catalog_cities", "state_code": state.upper(), "cities": cities})
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
        for line in sys.stdin:
            line = line.strip()
            if not line:
                continue
            try:
                self._dispatch(json.loads(line))
            except Exception as exc:
                self._emit_payload({"type": "engine_error", "error": str(exc)})


if __name__ == "__main__":
    EngineDaemon().serve()
