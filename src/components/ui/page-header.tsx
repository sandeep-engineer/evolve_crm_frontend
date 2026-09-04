import type { ReactNode } from "react";

type PageHeaderProps = {
  title: string;
  description: string;
  actions?: ReactNode;
};

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-[var(--space-4)] md:flex-row md:items-start md:justify-between">
      <div>
        <h1 className="text-2xl font-bold leading-tight tracking-[var(--tracking-tight)] text-[var(--color-text)]">
          {title}
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          {description}
        </p>
      </div>
      {actions ? <div className="flex shrink-0 gap-[var(--space-3)]">{actions}</div> : null}
    </div>
  );
}
