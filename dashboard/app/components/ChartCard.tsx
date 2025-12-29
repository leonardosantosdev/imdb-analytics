import type { ReactNode } from "react";
import { Card } from "./Card";

interface ChartCardProps {
  title: string;
  eyebrow?: string;
  description?: string;
  caption?: string;
  children: ReactNode;
}

export function ChartCard({ title, eyebrow, description, caption, children }: ChartCardProps) {
  return (
    <Card title={title} eyebrow={eyebrow} className="card--chart">
      {description && <p className="card__description">{description}</p>}
      {children}
      {caption && <p className="chart-caption">{caption}</p>}
    </Card>
  );
}