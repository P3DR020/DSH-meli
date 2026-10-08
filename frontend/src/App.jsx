import { FlowMonitor } from "./components/FlowMonitor";
import { KpiCard } from "./components/KpiCard";
import { TeamTable } from "./components/TeamTable";
import { useDashboard } from "./hooks/useDashboard";
import { useClock } from "./hooks/useClock";

function LoadingScreen({ error }) {
  return (
    <main className="state-screen">
      <div className="brand">MELI</div>
      <h1>{error ? "Nao foi possivel carregar os dados" : "Carregando painel operacional"}</h1>
      <p>{error || "Conectando ao backend..."}</p>
    </main>
  );
}

export default function App() {
  const { data, error, loading, refresh } = useDashboard();
  const currentTime = useClock();
  if (!data && (loading || error)) return <LoadingScreen error={error} />;
  if (!data) return null;

  const { kpis } = data;
  const reportMonth = new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
  }).format(new Date(data.updated_at));
  return (
    <main className={`dashboard ${data.stale ? "is-stale" : ""}`}>
      <header className="topbar">
        <div className="brand">MELI</div>
        <h1>Painel de produtividade operacional</h1>
        <div className="location"><b>{data.unit}</b><span /> <b>{data.shift}</b></div>
        <div className="live-status"><i />{data.system_status}</div>
        <div className="time-stack">
          <button className="refresh-button" onClick={refresh} title="Atualizar agora">Atualizado às {data.updated_time}</button>
          <span>Horário atual: {currentTime}</span>
        </div>
      </header>

      {error ? <div className="connection-banner">Falha na ultima atualizacao: {error}. Exibindo o ultimo dado valido.</div> : null}

      <section className="kpi-grid">
        <KpiCard label="Volume do dia" value={kpis.volume_day} note="Meta total do turno" progress={100} tone="yellow" />
        <KpiCard label="Processado" value={kpis.processed} note={`${kpis.progress_pct.toFixed(0)}% da meta concluída`} progress={kpis.progress_pct} tone="green" />
        <KpiCard label="Pacotes pendentes" value={kpis.packages_pending} note="A caminho da estação" progress={kpis.packages_pending_pct} tone="amber" />
        <KpiCard label="Pacotes na estação" value={kpis.packages_at_station} note="Devoluções, PS e Inbound p/ conterenização" progress={kpis.packages_at_station_pct} tone="blue" />
      </section>

      <section className="main-grid">
        <TeamTable teams={data.teams} highlight={data.highlight} />
        <FlowMonitor sessions={data.sessions} aggregate={data.aggregate_flow_pct} />
      </section>

      <footer className="footer">
        <div>
          <strong>Definição operacional dos volumes no painel</strong>
          <p><b>Pacotes pendentes:</b> constam sistemicamente como “a caminho da estação”.</p>
          <small><b>Pacotes na estação:</b> recebidos em devoluções, Soluções de Problemas ou Inbound e ainda não conterenizados. <b>Processados:</b> total conterenizado pelas 5 equipes.</small>
        </div>
        <div className="credits">
          <strong>Idealização e desenvolvimento</strong>
          <p>Pedro Henrique Santos de Jesus &nbsp;·&nbsp; Jhonata dos Santos Moura</p>
          <small>Rep 1 / SBA9 &nbsp;•&nbsp; {reportMonth.charAt(0).toUpperCase() + reportMonth.slice(1)}</small>
        </div>
      </footer>
    </main>
  );
}
