import type { ReactNode } from "react";

interface KpiCardProps {
  label: string;
  value: ReactNode;
  hint?: string;
  meta?: string;
}

export function KpiCard({ label, value, hint, meta }: KpiCardProps) {
  return (
    <div className="kpi-card">
      <p className="kpi-card__label">{label}</p>
      <p className="kpi-card__value">{value}</p>
      {hint && <p className="kpi-card__hint">{hint}</p>}
      {meta && <p className="kpi-card__meta">{meta}</p>}
    </div>
  );
}