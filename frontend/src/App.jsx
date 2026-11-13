/**
 * Montagem da tela: cabeçalho → cinco KPIs → equipes/sessões → consolidado/ritmo.
 * useDashboard concentra a comunicação HTTP; os componentes recebem props.
 * O backend é a fonte principal dos indicadores. Os cálculos auxiliares abaixo
 * atendem à compatibilidade entre versões implantadas separadamente.
 */
import { FlowMonitor } from "./components/FlowMonitor";
import { KpiCard } from "./components/KpiCard";
import { TeamTable } from "./components/TeamTable";
import { ThemeSelector } from "./components/ThemeSelector";
import { OperationsSummary } from "./components/OperationsSummary";
import { useDashboard } from "./hooks/useDashboard";
import { useClock } from "./hooks/useClock";

function LoadingScreen({ error }) {
  return (
    <main className="state-screen">
      <div className="brand brand-loading" role="img" aria-label="Mercado Livre">
        <span className="brand-mark" aria-hidden="true"><img src="/assets/mercado-livre-transparent.png" alt="" /></span>
        <span className="brand-name" aria-hidden="true">mercado<br />livre</span>
      </div>
      <h1>{error ? "Nao foi possivel carregar os dados" : "Carregando painel operacional"}</h1>
      <p>{error || "Conectando ao backend..."}</p>
    </main>
  );
}

// Compatibilidade com a API anterior: esta curva é demonstrativa e fixa.
// Quando hourly_flow chega da API, os pontos dos CSVs têm prioridade.
const fallbackHourlyFlow = [1420, 1680, 2150, 2380, 2450, 1820, 2240, 2410, 1870].map((realized, index) => ({
  label: ["23h", "00h", "01h", "02h", "03h", "04h", "05h", "06h", "07h"][index],
  realized,
  target: 1540,
  order: index + 1,
}));

function deriveOperationalSummary(teams, kpis) {
  /**
   * Entrada: equipes da API e KPIs do turno. Saída: contrato do cartão inferior.
   * A ponderação usa minutos acumulados de MO, e não a quantidade de equipes.
   * Ex.: equipes com 33%/100 min e 36%/200 min produzem NET global de 35%.
   * Se as regras do backend mudarem, revisar esta compatibilidade em conjunto.
   */
  // Compatibilidade durante deploys separados: espelha as regras do backend
  // somente quando a resposta ainda não inclui operational_summary.
  const totalEffectiveMinutes = teams.reduce((total, team) => total + (team.effective_minutes || 0), 0);
  const processed = kpis.processed;
  const weightedNet = teams.reduce(
    (total, team) => total + (team.net_pct || 0) * (team.effective_minutes || 0),
    0,
  );
  const netGlobal = totalEffectiveMinutes ? weightedNet / totalEffectiveMinutes : 0;
  const totalErrors = teams.reduce((total, team) => total + team.errors, 0);
  return {
    processed,
    net_global_pct: Math.round(netGlobal * 10) / 10,
    total_headcount: teams.reduce((total, team) => total + (team.headcount || 0), 0),
    total_effective_minutes: totalEffectiveMinutes,
    total_errors: totalErrors,
    error_rate_pct: processed ? Math.round((totalErrors / processed) * 10_000) / 100 : 0,
    effective_productivity: totalEffectiveMinutes ? Math.round((processed / (totalEffectiveMinutes / 60)) * 10) / 10 : 0,
    pace_per_hour: kpis.pace_per_hour,
    status: netGlobal > 38 ? "ADIANTADO" : netGlobal >= 32 ? "NO RITMO" : "ATENCAO",
  };
}

function deriveCompletionForecast(data) {
  /**
   * Projeta a conclusão mantendo constante o ritmo informado pela fonte.
   * Considera todo o volume ainda não processado, inclusive carga a caminho.
   * Não limita a projeção ao fim do turno. O timestamp completo da coleta permite
   * atravessar a meia-noite; a tela mostra somente HH:mm no fuso de São Paulo.
   * O texto da duração arredonda para cima em minutos; o horário usa a duração
   * exata. Por isso as duas apresentações podem diferir por menos de um minuto.
   * Esta função calcula localmente a partir dos dados básicos, mesmo quando a
   * API também fornece estimated_completion_time/remaining_hours.
   */
  // Calcula pela coleta, nunca pelo relógio ao vivo: atualizar a tela sem novos
  // dados não deve empurrar a previsão para frente. O fuso exibido é o da operação.
  const { kpis } = data;
  const remaining = Math.max(0, kpis.volume_day - kpis.processed);
  if (remaining === 0) return { time: "Concluído", note: "Volume do turno processado" };
  if (kpis.pace_per_hour <= 0) return { time: "—", note: "Sem previsão • aguardando ritmo" };
  const hours = remaining / kpis.pace_per_hour;
  const minutes = Math.ceil(hours * 60);
  const duration = `${Math.floor(minutes / 60)}h${String(minutes % 60).padStart(2, "0")}min`;
  const estimatedDate = new Date(new Date(data.updated_at).getTime() + hours * 3_600_000);
  return {
    time: new Intl.DateTimeFormat("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "America/Sao_Paulo",
    }).format(estimatedDate),
    note: `${duration} restantes • ritmo de ${new Intl.NumberFormat("pt-BR").format(kpis.pace_per_hour)} pct/h`,
  };
}

export default function App() {
  const { data, error, loading, refresh } = useDashboard();
  const currentTime = useClock();
  // Antes do primeiro snapshot mostramos carregamento/erro. Depois da primeira
  // resposta válida, falhas de atualização usam o banner e mantêm o painel visível.
  if (!data && (loading || error)) return <LoadingScreen error={error} />;
  if (!data) return null;

  const { kpis } = data;
  const operationalSummary = data.operational_summary || deriveOperationalSummary(data.teams, kpis);
  const hourlyFlow = data.hourly_flow?.length ? data.hourly_flow : fallbackHourlyFlow;
  // A curva fixa acima é somente uma compatibilidade de demonstração: não deve
  // ser confundida com histórico oficial caso a integração ainda não envie pontos.
  const completionForecast = deriveCompletionForecast(data);
  return (
    <main className={`dashboard ${data.stale ? "is-stale" : ""}`}>
      <header className="topbar">
        <div className="brand" role="img" aria-label="Mercado Livre">
          <span className="brand-mark" aria-hidden="true"><img src="/assets/mercado-livre-transparent.png" alt="" /></span>
          <span className="brand-name" aria-hidden="true">mercado<br />livre</span>
        </div>
        <h1>Painel de produtividade operacional</h1>
        <div className="location"><b>{data.unit}</b><span /> <b>{data.shift}</b></div>
        <div className="live-status"><i />{data.system_status}</div>
        <div className="time-stack">
          <div className="time-actions">
            <button className="refresh-button" onClick={refresh} title="Atualizar agora">Atualizado às {data.updated_time}</button>
            <ThemeSelector />
          </div>
          <span className="current-time">Horário atual: {currentTime}</span>
        </div>
      </header>

      {error ? <div className="connection-banner">Falha na ultima atualizacao: {error}. Exibindo o ultimo dado valido.</div> : null}

      <section className="kpi-grid">
        <KpiCard label="Volume do dia" value={kpis.volume_day} note="Meta total do turno" progress={100} tone="yellow" />
        <KpiCard label="Processado" value={kpis.processed} note={`${kpis.progress_pct.toFixed(0)}% da meta concluída`} progress={kpis.progress_pct} tone="green" />
        <KpiCard label="Pacotes pendentes" value={kpis.packages_pending} note="A caminho da estação" progress={kpis.packages_pending_pct} tone="amber" />
        <KpiCard label="Pacotes na estação" value={kpis.packages_at_station} note="Devoluções, PS e Inbound p/ conterenização" progress={kpis.packages_at_station_pct} tone="blue" />
        <KpiCard
          label="Previsão de término"
          value={completionForecast.time}
          note={completionForecast.note}
          progress={kpis.progress_pct}
          tone="cyan"
        />
      </section>

      {/* Composição principal: liderança à esquerda e sessões com anéis à direita. */}
      <section className="main-grid">
        <TeamTable teams={data.teams} />
        <FlowMonitor sessions={data.sessions} aggregate={data.aggregate_flow_pct} />
      </section>
      <OperationsSummary summary={operationalSummary} hourlyFlow={hourlyFlow} shift={data.shift} />
    </main>
  );
}
