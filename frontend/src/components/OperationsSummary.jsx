function formatNumber(value) {
  return new Intl.NumberFormat("pt-BR").format(value);
}

function formatHours(minutes) {
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  return remaining ? `${hours}h ${String(remaining).padStart(2, "0")}min` : `${hours}h`;
}

function statusClass(status) {
  if (status === "ADIANTADO") return "success";
  if (status === "ATENCAO") return "warning";
  return "steady";
}

function PaceChart({ points }) {
  if (!points?.length) return <p className="chart-empty">Sem histórico por hora.</p>;

  // Coordenadas internas do SVG; o CSS adapta o gráfico ao espaço disponível.
  const width = 900;
  const height = 126;
  const pad = { top: 25, right: 20, bottom: 27, left: 28 };
  const values = points.flatMap((point) => [point.realized, point.target]);
  // Inclui a meta na escala e reserva espaço acima dos pontos para os rótulos.
  const max = Math.max(...values, 1) * 1.12;
  const x = (index) => pad.left + (index * (width - pad.left - pad.right)) / Math.max(points.length - 1, 1);
  const y = (value) => pad.top + (1 - value / max) * (height - pad.top - pad.bottom);
  const polyline = points.map((point, index) => `${x(index)},${y(point.realized)}`).join(" ");
  // A linha tracejada representa uma meta nominal constante ao longo do turno.
  const targetY = y(points[0].target);

  return (
    <div className="pace-chart-wrap">
      <svg className="pace-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Ritmo realizado por hora comparado à meta nominal">
        <line className="pace-target" x1={pad.left} x2={width - pad.right} y1={targetY} y2={targetY} />
        <polyline className="pace-line" points={polyline} />
        {points.map((point, index) => (
          <g key={point.label}>
            <circle className="pace-point" cx={x(index)} cy={y(point.realized)} r="4" />
            <text className="pace-value" x={x(index)} y={Math.max(13, y(point.realized) - 9)} textAnchor="middle">{point.realized}</text>
            <text className="pace-label" x={x(index)} y={height - 7} textAnchor="middle">{point.label}</text>
          </g>
        ))}
      </svg>
    </div>
  );
}

export function OperationsSummary({ summary, hourlyFlow, shift }) {
  const nominalTarget = hourlyFlow?.[0]?.target || 0;
  return (
    <section className="operations-band" aria-label="Resumo operacional e ritmo por hora">
      <article className="consolidated-card">
        <header><h2>Total consolidado operacional</h2><span>{shift}</span></header>
        <div className="consolidated-grid">
          <div className="summary-primary"><strong>{formatNumber(summary.processed)}</strong><span>Pacotes processados</span></div>
          <div className="summary-net"><strong>{summary.net_global_pct.toFixed(1).replace(".", ",")}%</strong><span>Prod. líquida (NET global)</span></div>
          <div className="summary-details">
            <b>{summary.total_headcount} Colabs • {formatHours(summary.total_effective_minutes)} MO</b>
            <span>Prod. efetiva: {summary.effective_productivity.toFixed(1).replace(".", ",")} pct/h por MO</span>
            <small>Qualidade da pista: {summary.total_errors} erros totais ({summary.error_rate_pct.toFixed(2).replace(".", ",")}%)</small>
          </div>
          <div className={`summary-status ${statusClass(summary.status)}`}><b>{summary.status}</b><span>Turno monitorado</span></div>
        </div>
      </article>
      <article className="pace-card">
        <header><h2>Ritmo e oscilação de volume por hora</h2><span>Meta nominal: {formatNumber(nominalTarget)} p/h</span></header>
        <PaceChart points={hourlyFlow} />
      </article>
    </section>
  );
}
