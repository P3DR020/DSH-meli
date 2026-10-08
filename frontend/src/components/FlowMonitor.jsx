const sessionMeta = {
  auditorias: { tone: "green", ring: 1 },
  recebimento: { tone: "blue", ring: 2 },
  gaiolas: { tone: "yellow", ring: 3 },
};

function SessionDetails({ session }) {
  if (session.id === "auditorias") {
    return (
      <>
        <p>{session.current.toFixed(1).replace(".", ",")}% em Conformidade</p>
        <span>{session.detail_1} concluídas</span>
        <em>Extravios: Zero &nbsp;•&nbsp; Avarias: {session.errors}</em>
      </>
    );
  }

  if (session.id === "recebimento") {
    return (
      <>
        <p>{session.current} / {session.target} Docas Operando</p>
        <span>{session.detail_1}</span>
        <em>{session.detail_2} &nbsp;•&nbsp; SLA: 94%</em>
      </>
    );
  }

  return (
    <>
      <p>{session.current} Gaiolas Concluídas</p>
      <span>Meta do turno: {session.target} gaiolas</span>
      <em>{session.detail_1} &nbsp;•&nbsp; {session.detail_2}</em>
    </>
  );
}

export function FlowMonitor({ sessions, aggregate }) {
  const rings = sessions
    .filter((session) => sessionMeta[session.id])
    .map((session) => ({ ...session, ...sessionMeta[session.id] }))
    .sort((a, b) => a.ring - b.ring);
  return (
    <section className="panel flow-panel">
      <header className="panel-heading flow-heading">
        <h2>Monitor de fluxo das sessões operacionais</h2>
        <p>Indicador integrado e índices individuais por sessão</p>
      </header>
      <div className="flow-content">
        <div className="radial" aria-label={`Fluxo geral agregado ${aggregate}%`}>
          {rings.map((session, index) => (
            <div className={`ring ring-${index + 1} ${session.tone}`} style={{ "--pct": session.progress_pct }} key={session.id} />
          ))}
          <div className="radial-center"><strong>{aggregate}%</strong><span>Fluxo geral</span><small>Média integrada</small></div>
        </div>
        <div className="session-list">
          {rings.map((session) => (
            <article className={`session-card ${session.tone}`} key={session.id}>
              <div className="session-card-heading"><b>{session.name}</b><strong>{session.progress_pct.toFixed(0)}%</strong></div>
              <SessionDetails session={session} />
            </article>
          ))}
        </div>
      </div>
      <aside className="aggregate-note">
        <strong>Índice agregado de fluxo - {aggregate}%</strong>
        <p>Consolida a harmonia entre Initizadores ({rings.find((item) => item.id === "gaiolas")?.progress_pct.toFixed(0)}%), Recebimento ({rings.find((item) => item.id === "recebimento")?.progress_pct.toFixed(0)}%) e Auditoria ({rings.find((item) => item.id === "auditorias")?.progress_pct.toFixed(0)}%).</p>
        <span>Permite à liderança avaliar a cadência sistêmica das etapas de apoio em um único indicador central.</span>
        <small>Cálculo: Média ponderada com base nas metas individuais concluídas no turno.</small>
      </aside>
    </section>
  );
}
