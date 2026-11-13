from abc import ABC, abstractmethod
from typing import Any


class DashboardSource(ABC):
    """Contrato que permite trocar a origem dos dados sem reescrever os cálculos.

    Uma implementação pode ler CSV, consultar uma API ou executar uma query.
    Seu trabalho é devolver dados normalizados; percentuais, status e consolidados
    pertencem ao BusinessEngine. main.py escolhe qual implementação fica ativa.
    """

    @abstractmethod
    def fetch_data(self) -> dict[str, Any]:
        """Entrega um snapshot completo do turno para o motor de regras.

        Campos esperados: unit, shift, updated_at (datetime), volume_day,
        pace_per_hour, source, teams e sessions. O CSV também fornece os volumes
        pendentes/na estação e hourly_flow. Cada equipe/sessão informa id, name,
        current, target e errors; a equipe inclui HC, minutos de MO e NET.

        Quantidades e percentuais devem chegar como números, não textos
        formatados com ponto de milhar ou símbolo %. Erros de leitura devem ser
        propagados para que a camada HTTP possa responder à falha da consulta.
        """
        raise NotImplementedError
