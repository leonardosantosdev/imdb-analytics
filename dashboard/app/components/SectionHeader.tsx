import type { ReactNode } from "react";

interface SectionHeaderProps {
  title: string;
  description?: string;
  eyebrow?: string;
  meta?: string;
}

export function SectionHeader({ title, description, eyebrow, meta }: SectionHeaderProps) {
  return (
    <div className="section-header">
      <div>
        {eyebrow && <p className="section-header__eyebrow">{eyebrow}</p>}
        <h2 className="section-header__title">{title}</h2>
        {description && <p className="section-header__description">{description}</p>}
      </div>
      {meta && <p className="section-header__meta">{meta}</p>}
    </div>
  );
}