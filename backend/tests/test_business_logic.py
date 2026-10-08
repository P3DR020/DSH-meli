import unittest
from datetime import datetime, timezone

from app.services.business_logic import BusinessEngine


RAW = {
    "unit": "SBA9",
    "shift": "TURNO 1",
    "source": "CSV",
    "updated_at": datetime(2026, 10, 7, 15, 0, tzinfo=timezone.utc),
    "volume_day": 1000,
    "pace_per_hour": 100,
    "packages_pending": 180,
    "packages_at_station": 120,
    "teams": [
        {"id": "A", "name": "Time A", "function": "Entrada", "current": 400, "target": 500, "errors": 2, "detail_1": "", "detail_2": ""},
        {"id": "B", "name": "Time B", "function": "Saida", "current": 300, "target": 300, "errors": 1, "detail_1": "", "detail_2": ""},
    ],
    "sessions": [
        {"id": "x", "name": "X", "function": "", "current": 8, "target": 10, "errors": 0, "detail_1": "", "detail_2": ""},
        {"id": "y", "name": "Y", "function": "", "current": 10, "target": 10, "errors": 0, "detail_1": "", "detail_2": ""},
    ],
}


class BusinessEngineTests(unittest.TestCase):
    def test_calculates_consistent_kpis(self):
        result = BusinessEngine().calculate(RAW, datetime(2026, 10, 7, 15, 5, tzinfo=timezone.utc))
        self.assertEqual(result["kpis"]["processed"], 700)
        self.assertEqual(result["kpis"]["packages_pending"], 180)
        self.assertEqual(result["kpis"]["packages_at_station"], 120)
        self.assertEqual(result["aggregate_flow_pct"], 90)
        self.assertFalse(result["stale"])

    def test_marks_data_as_stale(self):
        result = BusinessEngine(stale_after_minutes=10).calculate(
            RAW, datetime(2026, 10, 7, 15, 11, tzinfo=timezone.utc)
        )
        self.assertTrue(result["stale"])


if __name__ == "__main__":
    unittest.main()
