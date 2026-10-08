from datetime import datetime, timezone
from typing import Any


def _percent(current: int, target: int) -> float:
    return round((current / target) * 100, 1) if target > 0 else 0.0


def _status(progress: float) -> str:
    if progress >= 90:
        return "ADIANTADO"
    if progress >= 80:
        return "NO RITMO"
    return "ATENCAO"


class BusinessEngine:
    def __init__(self, stale_after_minutes: int = 10):
        self.stale_after_minutes = stale_after_minutes

    def calculate(self, raw: dict[str, Any], now: datetime | None = None) -> dict[str, Any]:
        updated_at = raw["updated_at"]
        if updated_at.tzinfo is None:
            updated_at = updated_at.replace(tzinfo=timezone.utc)
        now = now or datetime.now(timezone.utc)
        if now.tzinfo is None:
            now = now.replace(tzinfo=timezone.utc)

        latency_minutes = max(0.0, (now - updated_at).total_seconds() / 60)
        stale = False if raw.get("demo_mode") else latency_minutes > self.stale_after_minutes

        teams = []
        for team in raw["teams"]:
            progress = _percent(team["current"], team["target"])
            error_rate = round((team["errors"] / team["current"]) * 100, 2) if team["current"] else 0.0
            teams.append({
                **team,
                "bipagens": team["current"],
                "progress_pct": progress,
                "error_rate_pct": error_rate,
                "status": _status(progress),
            })

        sessions = []
        for session in raw["sessions"]:
            sessions.append({**session, "progress_pct": _percent(session["current"], session["target"])})

        processed = sum(team["current"] for team in raw["teams"])
        volume_day = raw["volume_day"]
        packages_pending = max(0, raw.get("packages_pending", volume_day - processed))
        packages_at_station = max(0, raw.get("packages_at_station", 0))
        pace = raw["pace_per_hour"]
        overall_progress = _percent(processed, volume_day)
        aggregate_flow = round(sum(s["progress_pct"] for s in sessions) / len(sessions)) if sessions else 0
        best_team = max(teams, key=lambda item: (item["progress_pct"], -item["errors"]), default=None)

        return {
            "unit": raw["unit"],
            "shift": raw["shift"],
            "source": raw["source"],
            "demo_mode": raw.get("demo_mode", False),
            "demo_snapshot": raw.get("demo_snapshot"),
            "demo_total_snapshots": raw.get("demo_total_snapshots"),
            "demo_interval_seconds": raw.get("demo_interval_seconds"),
            "updated_at": updated_at.isoformat(),
            "updated_time": updated_at.astimezone().strftime("%H:%M:%S"),
            "server_time": now.isoformat(),
            "system_status": "DADOS DEFASADOS" if stale else "OPERACIONAL ATIVO",
            "stale": stale,
            "latency_minutes": round(latency_minutes, 1),
            "kpis": {
                "volume_day": volume_day,
                "processed": processed,
                "packages_pending": packages_pending,
                "packages_at_station": packages_at_station,
                "progress_pct": overall_progress,
                "packages_pending_pct": _percent(packages_pending, volume_day),
                "packages_at_station_pct": _percent(packages_at_station, volume_day),
                "pace_per_hour": pace,
            },
            "teams": teams,
            "sessions": sessions,
            "aggregate_flow_pct": aggregate_flow,
            "highlight": ({
                "team": best_team["name"],
                "function": best_team["function"],
                "message": f"atingiu {best_team['progress_pct']:.0f}% da meta com {best_team['errors']} erros registrados.",
            } if best_team else None),
        }
