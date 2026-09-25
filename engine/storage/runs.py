"""Filesystem-backed run storage used by the engine and later by Tauri."""
from pathlib import Path
import json
from typing import Any

from engine.models import ProspectingRun, SearchJob


class RunStore:
    def __init__(self, root: str | Path = "runs") -> None:
        self.root = Path(root)

    def run_dir(self, run_id: str) -> Path:
        return self.root / run_id

    def job_dir(self, run_id: str, job_id: str) -> Path:
        return self.run_dir(run_id) / "jobs" / job_id

    @staticmethod
    def _sanitize_surrogates(value: Any) -> Any:
        """Remove isolated UTF-16 surrogate code points before UTF-8 serialization."""
        if isinstance(value, str):
            return value.encode("utf-8", errors="replace").decode("utf-8")
        if isinstance(value, dict):
            return {
                RunStore._sanitize_surrogates(key): RunStore._sanitize_surrogates(item)
                for key, item in value.items()
            }
        if isinstance(value, list):
            return [RunStore._sanitize_surrogates(item) for item in value]
        if isinstance(value, tuple):
            return tuple(RunStore._sanitize_surrogates(item) for item in value)
        return value

    @staticmethod
    def _write_json(path: Path, value: dict[str, Any]) -> None:
        path.parent.mkdir(parents=True, exist_ok=True)
        temporary = path.with_suffix(path.suffix + ".tmp")
        safe_value = RunStore._sanitize_surrogates(value)
        temporary.write_text(
            json.dumps(safe_value, ensure_ascii=False, indent=2), encoding="utf-8"
        )
        temporary.replace(path)

    def save_run(self, run: ProspectingRun) -> Path:
        path = self.run_dir(run.id) / "run.json"
        self._write_json(path, run.to_dict())
        return path

    def save_job(self, run_id: str, job: SearchJob) -> Path:
        path = self.job_dir(run_id, job.id) / "job.json"
        self._write_json(path, job.to_dict())
        return path

    def job_output_path(self, run_id: str, job_id: str, enriched: bool = False) -> Path:
        name = "enriched.csv" if enriched else "raw.csv"
        return self.job_dir(run_id, job_id) / name

    def job_log_path(self, run_id: str, job_id: str) -> Path:
        return self.job_dir(run_id, job_id) / "log.txt"

    def report_path(self, run_id: str) -> Path:
        return self.run_dir(run_id) / "report.xlsx"
