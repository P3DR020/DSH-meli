import csv
from datetime import datetime
from pathlib import Path
from time import monotonic
from typing import Any

from .base import DashboardSource


def _as_int(value: str) -> int:
    return int(float(value or 0))


def _as_float(value: str) -> float:
    return float(value or 0)


class CsvDashboardSource(DashboardSource):
    """Converte uma exportação CSV no contrato do motor de indicadores.

    Estrutura do arquivo:
      team: volume, meta, erros e dados da liderança (HC, MO e NET);
      session: contagens, descrições e ordem de cada frente operacional;
      hour: volume realizado e meta nominal em cada faixa horária.

    As colunas globais são lidas da primeira linha. Campos opcionais de liderança
    aceitam exportações antigas; campos obrigatórios ausentes geram KeyError.
    Números devem usar ponto decimal e não devem ter separador de milhar.
    """

    def __init__(self, file_path: Path):
        self.file_path = file_path

    def fetch_data(self) -> dict[str, Any]:
        """Lê o arquivo a cada chamada e devolve números/datas prontos para cálculo.

        O adaptador não calcula os percentuais: current e target seguem para o
        motor. Arquivo inexistente/vazio interrompe a leitura; não cria um turno
        fictício de zeros que poderia parecer uma consulta bem-sucedida.
        """
        if not self.file_path.exists():
            raise FileNotFoundError(f"Arquivo CSV nao encontrado: {self.file_path}")

        # utf-8-sig aceita também o marcador BOM comum nas exportações do Excel.
        with self.file_path.open(encoding="utf-8-sig", newline="") as stream:
            rows = list(csv.DictReader(stream))

        if not rows:
            raise ValueError("O arquivo CSV esta vazio.")

        # Unidade, turno e totais se repetem nas linhas; a primeira fornece os dados globais.
        first = rows[0]
        teams: list[dict[str, Any]] = []
        sessions: list[dict[str, Any]] = []
        hourly_flow: list[dict[str, Any]] = []

        # kind separa três registros no mesmo arquivo: equipe, sessão e volume por hora.
        # flow_order preserva a sequência do T3 ao atravessar a meia-noite (23h → 00h).
        for row in rows:
            if row["kind"] == "hour":
                hourly_flow.append({
                    "label": row["name"],
                    "realized": _as_int(row["current"]),
                    "target": _as_int(row["target"]),
                    "order": _as_int(row.get("flow_order") or "0"),
                })
                continue

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
                # effective_minutes é a soma da MO da equipe, não a duração de um
                # colaborador. Ex.: 20 pessoas × 470 min = 9.400 min de MO.
                item.update({
                    "leader_name": row.get("leader_name") or row["name"],
                    "headcount": _as_int(row.get("headcount") or "0"),
                    "effective_minutes": _as_int(row.get("effective_minutes") or "0"),
                    "net_pct": _as_float(row.get("net_pct") or "0"),
                })
                teams.append(item)
            elif row["kind"] == "session":
                item["flow_order"] = _as_int(row.get("flow_order") or "99")
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
            "hourly_flow": sorted(hourly_flow, key=lambda item: item["order"]),
            "source": "CSV",
        }


class RotatingCsvDashboardSource(DashboardSource):
    """Simula a evolução do turno sem depender de uma integração externa.

    Os arquivos snapshot_*.csv são ordenados pelo nome. A cada intervalo avança
    um cenário e, ao final, retorna ao primeiro. Reiniciar o processo reinicia
    esse relógio. Não há gravação dos CSVs nem avanço por número de requisições.
    Em múltiplos processos, cada processo mantém seu próprio relógio de rotação.
    """

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
        # O relógio monotônico não depende de ajustes no relógio do computador.
        # O módulo reinicia o ciclo; clientes do mesmo processo veem o mesmo cenário.
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
