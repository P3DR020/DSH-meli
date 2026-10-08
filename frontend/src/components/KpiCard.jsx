const format = new Intl.NumberFormat("pt-BR");

export function KpiCard({ label, value, note, progress, tone }) {
  const displayValue = typeof value === "number" ? format.format(value) : value;
  return (
    <article className={`kpi-card tone-${tone}`}>
      <p className="kpi-label">{label}</p>
      <strong className="kpi-value">{displayValue}</strong>
      <p className="kpi-note">{note}</p>
      <div className="progress-track" aria-label={`${label}: ${progress}%`}>
        <span style={{ width: `${Math.min(100, Math.max(0, progress))}%` }} />
      </div>
    </article>
  );
}
