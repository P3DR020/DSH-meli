import { useCallback, useEffect, useState } from "react";

// No deploy, Vite incorpora VITE_API_URL durante o build; localmente usamos a API padrão.
const API_URL = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000/api/v1/dashboard/turno-atual";

export function useDashboard() {
  /**
   * Contrato do hook:
   * data: último snapshot que a API entregou com sucesso;
   * error: mensagem da tentativa mais recente que falhou;
   * loading: espera pela primeira tentativa, inclusive se ela terminar em erro;
   * refresh: mesma consulta usada pelo temporizador e pelo botão do cabeçalho.
   * A consulta é feita uma vez para toda a tela, evitando requisições por cartão.
   */
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      // Evita reaproveitar uma resposta HTTP em cache. Isso não dispara uma query
      // corporativa diretamente: quem escolhe/lê a fonte é o backend.
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
    // setInterval não espera a requisição anterior terminar. Não há cancelamento
    // HTTP neste hook; a limpeza abaixo interrompe apenas futuras consultas do timer.
    return () => window.clearInterval(timer);
  }, [refresh]);

  return { data, error, loading, refresh };
}
