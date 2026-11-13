import { useCallback, useEffect, useState } from "react";

// No deploy, Vite incorpora VITE_API_URL durante o build; localmente usamos a API padrão.
const API_URL = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000/api/v1/dashboard/turno-atual";

export function useDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch(API_URL, { cache: "no-store" });
      if (!response.ok) throw new Error(`API respondeu ${response.status}`);
      setData(await response.json());
      setError("");
    } catch (requestError) {
      // Preserva o último snapshot válido para a tela continuar útil durante uma falha.
      setError(requestError.message || "Falha ao atualizar o painel");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Consulta ao abrir e a cada 10 segundos; o mesmo refresh atende ao botão manual.
    // A limpeza evita manter timers quando o componente sai da tela.
    refresh();
    const timer = window.setInterval(refresh, 10_000);
    return () => window.clearInterval(timer);
  }, [refresh]);

  return { data, error, loading, refresh };
}
