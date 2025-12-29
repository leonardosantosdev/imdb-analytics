interface Stat {
  label: string;
  value: string;
  hint?: string;
}

interface StatGridProps {
  stats: Stat[];
}

export function StatGrid({ stats }: StatGridProps) {
  return (
    <div className="kpi-grid">
      {stats.map(stat => (
        <div className="kpi-card" key={stat.label}>
          <p className="kpi-card__label">{stat.label}</p>
          <p className="kpi-card__value">{stat.value}</p>
          {stat.hint && <p className="kpi-card__hint">{stat.hint}</p>}
        </div>
      ))}
    </div>
  );
}
