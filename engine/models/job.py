from dataclasses import dataclass, asdict
from datetime import datetime, timezone
from enum import StrEnum
from typing import Optional


class JobStatus(StrEnum):
    PENDING = "pending"
    RUNNING = "running"
    PAUSED = "paused"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


@dataclass
class SearchJob:
    id: str
    run_id: str
    city: str
    category: str
    query: str
    status: JobStatus = JobStatus.PENDING
    started_at: Optional[str] = None
    finished_at: Optional[str] = None
    results_count: int = 0
    raw_file: Optional[str] = None
    enriched_file: Optional[str] = None
    log_file: Optional[str] = None
    error: Optional[str] = None

    def start(self) -> None:
        self.status = JobStatus.RUNNING
        self.started_at = utc_now()

    def complete(self, results_count: int = 0) -> None:
        self.status = JobStatus.COMPLETED
        self.results_count = results_count
        self.finished_at = utc_now()

    def fail(self, error: str) -> None:
        self.status = JobStatus.FAILED
        self.error = error
        self.finished_at = utc_now()

    def cancel(self) -> None:
        self.status = JobStatus.CANCELLED
        self.finished_at = utc_now()

    def to_dict(self) -> dict:
        data = asdict(self)
        data["status"] = self.status.value
        return data
