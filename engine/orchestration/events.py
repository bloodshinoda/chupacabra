"""Small event abstraction shared by the runner and future Tauri bridge."""
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any, Callable


@dataclass(frozen=True, slots=True)
class EngineEvent:
    type: str
    payload: dict[str, Any] = field(default_factory=dict)
    timestamp: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

    def to_dict(self) -> dict[str, Any]:
        return {"type": self.type, "timestamp": self.timestamp, **self.payload}


EventHandler = Callable[[EngineEvent], None]


class EventBus:
    def __init__(self, handler: EventHandler | None = None) -> None:
        self._handler = handler

    def emit(self, event_type: str, **payload: Any) -> EngineEvent:
        event = EngineEvent(event_type, payload)
        if self._handler is not None:
            self._handler(event)
        return event
