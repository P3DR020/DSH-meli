const format = new Intl.NumberFormat("pt-BR");

export function KpiCard({ label, value, note, progress, tone }) {
  /**
   * Cartão reutilizado para volumes e horário previsto.
   * value numérico recebe formatação pt-BR; textos como "07:55" ficam intactos.
   * progress é percentual (0–100), não fração (0–1). O limite afeta somente a
   * largura da barra: não altera o valor exibido nem os cálculos recebidos.
   * tone seleciona variáveis de cor definidas em .tone-* no CSS.
   */
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
