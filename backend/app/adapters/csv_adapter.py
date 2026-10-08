import csv
from datetime import datetime
from pathlib import Path
from time import monotonic
from typing import Any

from .base import DashboardSource


def _as_int(value: str) -> int:
    return int(float(value or 0))


class CsvDashboardSource(DashboardSource):
    def __init__(self, file_path: Path):
        self.file_path = file_path

    def fetch_data(self) -> dict[str, Any]:
        if not self.file_path.exists():
            raise FileNotFoundError(f"Arquivo CSV nao encontrado: {self.file_path}")

        with self.file_path.open(encoding="utf-8-sig", newline="") as stream:
            rows = list(csv.DictReader(stream))

        if not rows:
            raise ValueError("O arquivo CSV esta vazio.")

        first = rows[0]
        teams: list[dict[str, Any]] = []
        sessions: list[dict[str, Any]] = []

        for row in rows:
            item = {
                "id": row["id"],
                "name": row["name"],
                "function": row["function"],
                "current": _as_int(row["current"]),
                "target": _as_int(row["target"]),
                "errors": _as_int(row["errors"]),
                "detail_1": row["detail_1"],
                "detail_2": row["detail_2"],
            }
            if row["kind"] == "team":
                teams.append(item)
            elif row["kind"] == "session":
                sessions.append(item)

        updated_at = datetime.fromisoformat(first["updated_at"])
        return {
            "unit": first["unit"],
            "shift": first["shift"],
            "updated_at": updated_at,
            "volume_day": _as_int(first["volume_day"]),
            "pace_per_hour": _as_int(first["pace_per_hour"]),
            "packages_pending": _as_int(first.get("packages_pending", "0")),
            "packages_at_station": _as_int(first.get("packages_at_station", "0")),
            "teams": teams,
            "sessions": sessions,
            "source": "CSV",
        }


class RotatingCsvDashboardSource(DashboardSource):
    def __init__(self, directory: Path, interval_seconds: int = 10):
        self.directory = directory
        self.interval_seconds = max(1, interval_seconds)
        self.started_at = monotonic()

    def _files(self) -> list[Path]:
        files = sorted(self.directory.glob("snapshot_*.csv"))
        if not files:
            raise FileNotFoundError(f"Nenhum CSV de demonstracao encontrado em: {self.directory}")
        return files

    def fetch_data(self) -> dict[str, Any]:
        files = self._files()
        elapsed_seconds = monotonic() - self.started_at
        snapshot_index = int(elapsed_seconds // self.interval_seconds) % len(files)
        data = CsvDashboardSource(files[snapshot_index]).fetch_data()
        data.update({
            "source": f"CSV DEMO {snapshot_index + 1}/{len(files)}",
            "demo_mode": True,
            "demo_snapshot": snapshot_index + 1,
            "demo_total_snapshots": len(files),
            "demo_interval_seconds": self.interval_seconds,
        })
        return data
