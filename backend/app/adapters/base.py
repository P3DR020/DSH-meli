from abc import ABC, abstractmethod
from typing import Any


class DashboardSource(ABC):
    @abstractmethod
    def fetch_data(self) -> dict[str, Any]:
        """Return normalized raw data for the business engine."""
        raise NotImplementedError
