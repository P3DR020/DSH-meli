import { useEffect, useState } from "react";

function getCurrentTime() {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(new Date());
}

export function useClock() {
  // Relógio local de exibição; não consulta a API nem altera o instante da coleta dos dados.
  const [time, setTime] = useState(getCurrentTime);

  useEffect(() => {
    const timer = window.setInterval(() => setTime(getCurrentTime()), 1_000);
    return () => window.clearInterval(timer);
  }, []);

  return time;
}
