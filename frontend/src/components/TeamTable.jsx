const format = new Intl.NumberFormat("pt-BR");

function statusClass(status) {
  return status === "ADIANTADO" ? "success" : status === "ATENCAO" ? "warning" : "steady";
}

export function TeamTable({ teams, highlight }) {
  return (
    <section className="panel team-panel">
      <header className="panel-heading">
        <h2>Desempenho de Conterenização por Equipes</h2>
        <span>Meta: 90% &nbsp;|&nbsp; Qualidade: ≤ 5 erros</span>
      </header>
      <div className="team-header" aria-hidden="true">
        <span>Time / equipe</span><span>Bipagens</span><span>Avanço / meta</span><span>Qualidade</span><span>Status</span>
      </div>
      <div className="team-list">
        {teams.map((team) => (
          <article className="team-row" key={team.id}>
            <div><strong>{team.name}</strong><small>{team.function}</small></div>
            <b>{format.format(team.bipagens)}</b>
            <div className={`team-progress ${statusClass(team.status)}`}><div className="progress-track"><span style={{ width: `${team.progress_pct}%` }} /></div><b>{team.progress_pct.toFixed(0)}%</b></div>
            <div><strong>{team.errors} {team.errors === 1 ? "erro" : "erros"}</strong><small>Taxa {team.error_rate_pct.toFixed(2).replace(".", ",")}%</small></div>
            <span className={`status-tag ${statusClass(team.status)}`}>{team.status === "ATENCAO" ? "ATENÇÃO" : team.status}</span>
          </article>
        ))}
      </div>
      {highlight ? (
        <aside className="highlight">
          <strong>Destaque coletivo do turno</strong>
          <p><b>{highlight.team} ({highlight.function})</b> {highlight.message}</p>
          <small>Reconhecimento à sinergia e à cooperação das 5 equipes na superação do ritmo previsto.</small>
        </aside>
      ) : null}
    </section>
  );
}
