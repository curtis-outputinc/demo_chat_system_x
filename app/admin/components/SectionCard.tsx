import type { ReactNode } from 'react';

interface SectionCardProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  id?: string;
}

export function SectionCard({ title, subtitle, action, children, className, id }: SectionCardProps) {
  return (
    <section
      id={id}
      className={`rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-bg-elevated)] overflow-hidden ${className ?? ''}`}
      style={{ borderColor: 'var(--admin-border)' }}
    >
      <header
        className="flex items-baseline justify-between px-6 py-4 border-b"
        style={{ borderColor: 'var(--admin-border)' }}
      >
        <div>
          <h2 className="text-base font-semibold tracking-tight" style={{ color: 'var(--admin-fg)' }}>
            {title}
          </h2>
          {subtitle && (
            <p className="mt-0.5 text-xs" style={{ color: 'var(--admin-fg-subtle)' }}>
              {subtitle}
            </p>
          )}
        </div>
        {action && <div className="ml-4">{action}</div>}
      </header>
      <div className="p-6">{children}</div>
    </section>
  );
}
