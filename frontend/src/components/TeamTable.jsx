const format = new Intl.NumberFormat("pt-BR");

function formatEffectiveTime(totalMinutes) {
  if (!totalMinutes) return "—";
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${String(minutes).padStart(2, "0")}m`;
}

function statusClass(status) {
  return status === "ADIANTADO" ? "success" : status === "ATENCAO" ? "warning" : "steady";
}

export function TeamTable({ teams }) {
  /**
   * Cada linha representa uma equipe com liderança, HC, volume, NET e qualidade.
   * Os nomes dos líderes e suas equipes vêm da API/CSV; não são fixados aqui.
   * effective_minutes é MO acumulada, bipagens é volume e error_rate_pct já está
   * calculada. O componente só formata essas medidas e escolhe classes visuais.
   * Em celular, data-label oferece os títulos de cada campo via CSS, substituindo
   * a linha de cabeçalhos que fica escondida no layout de cartões.
   */
  const totalHeadcount = teams.reduce(
    (total, team) => total + (team.headcount || 0),
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
          const netPct = team.net_pct || 0;
          // Cor visual da NET (35%) e status por avanço de volume são critérios distintos.
          const productivityClass = netPct >= 35 ? "success" : "warning";

          return (
            <article className="team-row" key={team.id}>
              <div className="leader-cell">
                <strong>{team.leader_name || team.name}</strong>
                <small>Processos Sistêmicos &amp; Apoio Operacional</small>
              </div>
              <div className="headcount-cell" data-label="Efetivo (HC)">
                <strong>{team.headcount || 0} Colabs</strong>
                <small>{formatEffectiveTime(team.effective_minutes)} MO efetiva</small>
              </div>
              <b className="volume-cell" data-label="Volume total">{format.format(team.bipagens)}</b>
              {/* Escala visual de 0 a 40% NET: 40 × 2,5 preenche 100% da barra. */}
              <div className={`team-progress ${productivityClass}`} data-label="Produtividade NET">
                <div className="progress-track"><span style={{ width: `${Math.min(netPct * 2.5, 100)}%` }} /></div>
                <b>{netPct.toFixed(1).replace(".", ",")}%</b>
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
