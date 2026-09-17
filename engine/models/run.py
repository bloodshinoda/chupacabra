from dataclasses import dataclass, field, asdict
from datetime import datetime, timezone
from enum import StrEnum
from typing import Optional

from .job import JobStatus, SearchJob


class RunStatus(StrEnum):
    PENDING = "pending"
    RUNNING = "running"
    PAUSED = "paused"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


@dataclass
class ProspectingRun:
    id: str
    profile: str
    status: RunStatus = RunStatus.PENDING
    total_jobs: int = 0
    completed_jobs: int = 0
    failed_jobs: int = 0
    jobs: list[SearchJob] = field(default_factory=list)
    started_at: Optional[str] = None
    finished_at: Optional[str] = None

    def start(self) -> None:
        self.status = RunStatus.RUNNING
        self.started_at = utc_now()

    def recalculate(self) -> None:
        self.total_jobs = len(self.jobs)
        self.completed_jobs = sum(j.status is JobStatus.COMPLETED for j in self.jobs)
        self.failed_jobs = sum(j.status is JobStatus.FAILED for j in self.jobs)

    def complete(self) -> None:
        self.recalculate()
        self.status = RunStatus.COMPLETED
        self.finished_at = utc_now()

    def fail(self) -> None:
        self.recalculate()
        self.status = RunStatus.FAILED
        self.finished_at = utc_now()

    def cancel(self) -> None:
        self.recalculate()
        self.status = RunStatus.CANCELLED
        self.finished_at = utc_now()

    def to_dict(self) -> dict:
        data = asdict(self)
        data["status"] = self.status.value
        data["jobs"] = [job.to_dict() for job in self.jobs]
        return data
