from pathlib import Path

BASE_DIR = Path(__file__).resolve().parents[1]
# Caminho disponível para exportação única; main.py usa atualmente DEMO_DATA_DIR.
DATA_FILE = BASE_DIR / "data" / "export_turno.csv"
DEMO_DATA_DIR = BASE_DIR / "data" / "demo"
DEMO_INTERVAL_SECONDS = 10
STALE_AFTER_MINUTES = 10
