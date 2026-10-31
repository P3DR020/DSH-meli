const format = new Intl.NumberFormat("pt-BR");

const operationalLeaders = {
  A: { name: "Rafael Italo", headcount: 22, effectiveTime: "172h 20m", netPct: 36.8 },
  B: { name: "Moisés Ferreira", headcount: 20, effectiveTime: "156h 40m", netPct: 33.4 },
  C: { name: "Letícia Adeodato", headcount: 12, effectiveTime: "94h 00m", netPct: 37.6 },
  D: { name: "Patrícia Sales", headcount: 10, effectiveTime: "78h 20m", netPct: 35.2 },
  E: { name: "Roberto Cerqueira", headcount: 8, effectiveTime: "62h 40m", netPct: 36.1 },
};

const fallbackLeader = {
  name: "Liderança operacional",
  headcount: 0,
  effectiveTime: "—",
  netPct: 0,
};

function statusClass(status) {
  return status === "ADIANTADO" ? "success" : status === "ATENCAO" ? "warning" : "steady";
}

export function TeamTable({ teams }) {
  const totalHeadcount = teams.reduce(
    (total, team) => total + (operationalLeaders[team.id]?.headcount || 0),
    0,
  );

  return (
    <section className="panel team-panel">
      <header className="panel-heading">
        <h2>Monitor de fluxo de desempenho operacional</h2>
        <span>Meta NET: 32% a 38% | MO efetiva: 07:50/colab | HC: {totalHeadcount}</span>
      </header>
      <div className="team-header" aria-hidden="true">
        <span>Líder operacional</span><span>Efetivo (HC)</span><span>Volume total</span><span>Produtividade NET</span><span>Qualidade (erros)</span><span>Status</span>
      </div>
      <div className="team-list">
        {teams.map((team) => {
          const leader = operationalLeaders[team.id] || fallbackLeader;
          const productivityClass = leader.netPct >= 35 ? "success" : "warning";

          return (
            <article className="team-row" key={team.id}>
              <div className="leader-cell">
                <strong>{leader.name}</strong>
                <small>Processos Sistêmicos &amp; Apoio Operacional</small>
              </div>
              <div className="headcount-cell" data-label="Efetivo (HC)">
                <strong>{leader.headcount} Colabs</strong>
                <small>{leader.effectiveTime} MO efetiva</small>
              </div>
              <b className="volume-cell" data-label="Volume total">{format.format(team.bipagens)}</b>
              <div className={`team-progress ${productivityClass}`} data-label="Produtividade NET">
                <div className="progress-track"><span style={{ width: `${Math.min(leader.netPct * 2.5, 100)}%` }} /></div>
                <b>{leader.netPct.toFixed(1).replace(".", ",")}%</b>
              </div>
              <div className="quality-cell" data-label="Qualidade">
                <strong>{team.errors} {team.errors === 1 ? "erro" : "erros"}</strong>
                <small>Taxa {team.error_rate_pct.toFixed(2).replace(".", ",")}%</small>
              </div>
              <span className={`status-tag ${statusClass(team.status)}`}>{team.status === "ATENCAO" ? "ATENÇÃO" : team.status}</span>
            </article>
          );
        })}
      </div>
    </section>
  );
}
