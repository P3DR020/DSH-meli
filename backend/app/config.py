from pathlib import Path

BASE_DIR = Path(__file__).resolve().parents[1]
# Resolve os caminhos a partir do arquivo Python, permitindo iniciar o serviço
# pela raiz do repositório ou pela pasta backend sem mudar a localização dos CSVs.
# Caminho disponível para exportação única; main.py usa atualmente DEMO_DATA_DIR.
DATA_FILE = BASE_DIR / "data" / "export_turno.csv"
DEMO_DATA_DIR = BASE_DIR / "data" / "demo"
# Intervalo de troca do cenário no backend, em segundos. É independente do
# intervalo de consulta do navegador, definido em frontend/src/hooks/useDashboard.js.
DEMO_INTERVAL_SECONDS = 10
# Tolerância da coleta real, em minutos. demo_mode ignora o alerta de defasagem.
STALE_AFTER_MINUTES = 10
