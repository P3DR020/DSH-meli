const sessionMeta = {
  auditorias: { tone: "green", order: 3 },
  expedicao: { tone: "blue", order: 4 },
  recebimento: { tone: "cyan", order: 1 },
  iniciadores: { tone: "yellow", order: 2 },
  resolucao: { tone: "purple", order: 5 },
};

function SessionDetails({ session }) {
  return (
    <>
      <p>{session.detail_1}</p>
      <span>{session.detail_2}</span>
    </>
  );
}

export function FlowMonitor({ sessions, aggregate }) {
  const rings = sessions
    .filter((session) => sessionMeta[session.id])
    .map((session) => ({
      ...session,
      ...sessionMeta[session.id],
    }))
    .sort((a, b) => (a.flow_order || a.order) - (b.flow_order || b.order));
  return (
    <section className="panel flow-panel">
      <header className="panel-heading flow-heading">
        <h2>Monitor de fluxo das sessões</h2>
        <p>Cada sessão mantém uma cor fixa para facilitar a leitura</p>
      </header>
      <div className="flow-content">
        <div className="radial" aria-label={`Fluxo geral agregado ${aggregate}%`}>
          {rings.map((session, index) => (
            <div className={`ring ring-${index + 1} ${session.tone}`} style={{ "--pct": session.progress_pct }} key={session.id} />
          ))}
          <div className="radial-center"><strong>{aggregate}%</strong><span>Fluxo geral</span><small>Média integrada</small></div>
        </div>
        <div className="session-list">
          {rings.map((session, index) => (
            <article className={`session-card ${session.tone}`} key={session.id}>
              <div className="session-card-heading"><b>{index + 1}. {session.name}</b><strong>{session.progress_pct.toFixed(0)}%</strong></div>
              <SessionDetails session={session} />
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
