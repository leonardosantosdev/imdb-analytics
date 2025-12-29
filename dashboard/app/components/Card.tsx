import type { ReactNode } from "react";

interface CardProps {
  title?: string;
  eyebrow?: string;
  children: ReactNode;
  className?: string;
}

export function Card({ title, eyebrow, children, className }: CardProps) {
  const classes = ["card", className].filter(Boolean).join(" ");

  return (
    <section className={classes}>
      {(title || eyebrow) && (
        <div className="card__header">
          {eyebrow && <p className="card__eyebrow">{eyebrow}</p>}
          {title && <h3 className="card__title">{title}</h3>}
        </div>
      )}
      <div className="card__body">{children}</div>
    </section>
  );
}
