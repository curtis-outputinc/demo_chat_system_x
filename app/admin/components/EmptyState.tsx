import type { ReactNode } from 'react';

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="py-12 text-center">
      <h3 className="text-sm font-semibold" style={{ color: 'var(--admin-fg)' }}>
        {title}
      </h3>
      {description && (
        <p className="mt-2 text-sm max-w-md mx-auto" style={{ color: 'var(--admin-fg-muted)' }}>
          {description}
        </p>
      )}
      {action && <div className="mt-4 inline-block">{action}</div>}
    </div>
  );
}
