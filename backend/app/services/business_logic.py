"""Regras operacionais compartilhadas por qualquer fonte de dados.

Fluxo: DashboardSource.fetch_data() → BusinessEngine.calculate() → resposta da API.
O motor não consulta rede nem arquivos e não modifica as listas recebidas: cria
novas equipes/sessões com seus indicadores. Isso permite testar fórmulas sem
subir um servidor. NET e ritmo são entradas da fonte, não medidos por este motor.
"""

from datetime import datetime, timedelta, timezone
from typing import Any


def _percent(current: int, target: int) -> float:
    """Calcula avanço em pontos percentuais: 80 / 100 → 80,0.

    Meta ausente/zerada retorna zero para evitar divisão por zero. O resultado
    pode superar 100% quando a meta é excedida; a interface limita só a barra.
    """
    return round((current / target) * 100, 1) if target > 0 else 0.0


def _status(progress: float) -> str:
    # Status da equipe acompanha o avanço da meta de volume, não a produtividade NET.
    if progress >= 90:
        return "ADIANTADO"
    if progress >= 80:
        return "NO RITMO"
    return "ATENCAO"


def _net_status(net_pct: float) -> str:
    # O consolidado usa outra referência: faixa de NET de 32% a 38%.
    if net_pct > 38:
        return "ADIANTADO"
    if net_pct >= 32:
        return "NO RITMO"
    return "ATENCAO"


class BusinessEngine:
    """Transforma dados da fonte em indicadores para a API, sem depender de CSV ou HTTP."""

    def __init__(self, stale_after_minutes: int = 10):
        self.stale_after_minutes = stale_after_minutes

    def calculate(self, raw: dict[str, Any], now: datetime | None = None) -> dict[str, Any]:
        """Converte um snapshot bruto no contrato consumido pelo React.

        raw contém o turno completo normalizado pelo adaptador. now é opcional
        para fixar o relógio nos testes; em produção usa o instante atual em UTC.
        A saída agrupa kpis, teams, sessions, hourly_flow e operational_summary,
        além das informações de origem e atraso da coleta.

        Unidades: current/target em pacotes (ou contagem própria da sessão),
        effective_minutes em minutos acumulados de mão de obra, net_pct em
        pontos percentuais e pace_per_hour em pacotes por hora da operação.
        """
        # Datas sem fuso são interpretadas como UTC. Datas com offset mantêm o
        # instante da coleta; o relógio atual serve apenas para medir defasagem.
        updated_at = raw["updated_at"]
        if updated_at.tzinfo is None:
            updated_at = updated_at.replace(tzinfo=timezone.utc)
        now = now or datetime.now(timezone.utc)
        if now.tzinfo is None:
            now = now.replace(tzinfo=timezone.utc)

        # Snapshots de apresentação têm datas fixas; somente dados reais geram alerta de atraso.
        latency_minutes = max(0.0, (now - updated_at).total_seconds() / 60)
        stale = False if raw.get("demo_mode") else latency_minutes > self.stale_after_minutes

        teams = []
        for team in raw["teams"]:
            # Ex.: 4 erros / 4.650 pacotes × 100 = 0,09% após arredondamento.
            # bipagens é o nome de apresentação de current no contrato da API.
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
        # A sequência vem da fonte. O valor 99 deixa sessões antigas sem ordem
        # ao final, preservando a compatibilidade com exportações anteriores.
        for session in sorted(raw["sessions"], key=lambda item: item.get("flow_order", 99)):
            sessions.append({**session, "progress_pct": _percent(session["current"], session["target"])})

        # A soma das equipes é a referência única do total processado no painel.
        processed = sum(team["current"] for team in raw["teams"])
        volume_day = raw["volume_day"]
        # São conceitos distintos: pending = a caminho; at_station = recebido,
        # ainda aguardando processamento. O restante da previsão usa volume_day
        # menos processado, e inclui tudo que falta para a meta total do turno.
        packages_pending = max(0, raw.get("packages_pending", volume_day - processed))
        packages_at_station = max(0, raw.get("packages_at_station", 0))
        pace = raw["pace_per_hour"]
        overall_progress = _percent(processed, volume_day)
        # Estimativa na data da coleta: restante / ritmo informado pela fonte (pct/h).
        # Não há limite pelo horário de saída; ritmo zero significa ausência de previsão.
        # Somamos a duração sem arredondar para evitar deslocar o horário calculado.
        remaining_volume = max(0, volume_day - processed)
        # Ex.: (24.580 - 18.420) / 1.421 = ~4,335h. Com coleta às 03:35,
        # o término fica por volta de 07:55. É uma extrapolação de ritmo constante:
        # não considera pausas futuras, chegada tardia de carga ou mudanças de HC.
        remaining_hours_exact = remaining_volume / pace if pace > 0 else None
        remaining_hours = round(remaining_hours_exact, 2) if remaining_hours_exact is not None else None
        estimated_completion = updated_at + timedelta(hours=remaining_hours_exact) if remaining_hours_exact is not None else None
        # Fluxo geral: média simples das cinco frentes; não é a NET global.
        aggregate_flow = round(sum(s["progress_pct"] for s in sessions) / len(sessions)) if sessions else 0
        best_team = max(teams, key=lambda item: (item["progress_pct"], -item["errors"]), default=None)
        # O desempate do destaque usa menos erros. Esse campo permanece no
        # contrato mesmo sem um cartão de destaque na interface atual.
        total_headcount = sum(team.get("headcount", 0) for team in teams)
        total_effective_minutes = sum(team.get("effective_minutes", 0) for team in teams)
        total_errors = sum(team["errors"] for team in teams)
        # NET global ponderada pela mão de obra: Σ(NET × minutos de MO) / Σ(minutos de MO).
        weighted_net_total = sum(
            team.get("net_pct", 0) * team.get("effective_minutes", 0)
            for team in teams
        )
        net_global = round(weighted_net_total / total_effective_minutes, 1) if total_effective_minutes else 0.0
        # Não somamos as taxas individuais: a taxa global usa todos os erros
        # divididos por todos os pacotes, evitando dar peso igual a equipes de volumes distintos.
        error_rate = round((total_errors / processed) * 100, 2) if processed else 0.0
        # Produtividade por hora de mão de obra, diferente do ritmo da operação por hora de relógio.
        effective_productivity = round(processed / (total_effective_minutes / 60), 1) if total_effective_minutes else 0.0

        # updated_at é a referência completa da coleta (com offset); updated_time
        # é apenas uma apresentação no fuso local do servidor. server_time serve
        # para diagnóstico e não participa da previsão de término.
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
                "remaining_hours": remaining_hours,
                "estimated_completion_time": estimated_completion.strftime("%H:%M") if estimated_completion else None,
            },
            "teams": teams,
            "sessions": sessions,
            "aggregate_flow_pct": aggregate_flow,
            "hourly_flow": raw.get("hourly_flow", []),
            "operational_summary": {
                "processed": processed,
                "net_global_pct": net_global,
                "total_headcount": total_headcount,
                "total_effective_minutes": total_effective_minutes,
                "total_errors": total_errors,
                "error_rate_pct": error_rate,
                "effective_productivity": effective_productivity,
                "pace_per_hour": pace,
                "status": _net_status(net_global),
            },
            "highlight": ({
                "team": best_team["name"],
                "function": best_team["function"],
                "message": f"atingiu {best_team['progress_pct']:.0f}% da meta com {best_team['errors']} erros registrados.",
            } if best_team else None),
        }
