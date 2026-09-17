"""JSON-line daemon used by the Tauri bridge in the desktop application."""
from __future__ import annotations

import json
import sys
import threading
from pathlib import Path

from engine.orchestration.runner import ProspectingRunner
from engine.storage import RunStore


class EngineDaemon:
    def __init__(self) -> None:
        self.runner = ProspectingRunner(
            store=RunStore("runs"),
            event_handler=self._emit_event,
        )
        self._lock = threading.Lock()
        self._run_thread: threading.Thread | None = None

    def _emit_event(self, event) -> None:
        payload = event.to_dict()
        sys.stdout.write(json.dumps(payload, ensure_ascii=False) + "\n")
        sys.stdout.flush()

    def _start_run(self, payload: dict) -> None:
        with self._lock:
            if self._run_thread is not None and self._run_thread.is_alive():
                raise RuntimeError("A prospecting run is already active")

            query = str(payload.get("query", "")).strip()
            if not query:
                raise ValueError("query is required")

            profile = str(payload.get("profile", "fast"))
            city = str(payload.get("city", "custom"))
            category = str(payload.get("category", "custom"))
            lang = str(payload.get("lang", "pt"))
            country = str(payload.get("country", "br"))
            runs_dir = str(payload.get("runs_dir", "runs"))
            self.runner.store = RunStore(Path(runs_dir))

            jobs = [("manual_001", city, category, query)]
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
        elif command == "pause_run":
            self.runner.pause()
        elif command == "resume_run":
            self.runner.resume()
        elif command == "cancel_run":
            self.runner.cancel()
        elif command == "status":
            run = self.runner.active_run
            self._emit_event(
                type("StatusEvent", (), {"to_dict": lambda self: {"type": "engine_status", "run": run.to_dict() if run else None}})()
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
                self._emit_event(
                    type("ErrorEvent", (), {"to_dict": lambda self: {"type": "engine_error", "error": str(exc)}})()
                )


if __name__ == "__main__":
    EngineDaemon().serve()
