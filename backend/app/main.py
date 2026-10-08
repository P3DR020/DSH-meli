from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .adapters.csv_adapter import RotatingCsvDashboardSource
from .config import DEMO_DATA_DIR, DEMO_INTERVAL_SECONDS, STALE_AFTER_MINUTES
from .services.business_logic import BusinessEngine

app = FastAPI(
    title="Dashboard PS - SBA9 API",
    description="Motor de dados para o painel operacional em TV.",
    version="1.0.0",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:5173", "http://localhost:5173"],
    allow_methods=["GET"],
    allow_headers=["*"],
)

source = RotatingCsvDashboardSource(DEMO_DATA_DIR, DEMO_INTERVAL_SECONDS)
engine = BusinessEngine(STALE_AFTER_MINUTES)


@app.get("/api/v1/dashboard/turno-atual")
def current_shift():
    try:
        return engine.calculate(source.fetch_data())
    except (FileNotFoundError, ValueError, KeyError) as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.get("/api/v1/health")
def healthcheck():
    return {
        "status": "ONLINE",
        "unit": "SBA9",
        "version": "1.1.0",
        "mode": "CSV DEMO",
        "interval_seconds": DEMO_INTERVAL_SECONDS,
    }
