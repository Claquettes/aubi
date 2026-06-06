import type { ReactNode } from 'react';

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        padding: 'var(--space-12) var(--space-4)',
        textAlign: 'center',
        color: 'var(--color-text-secondary)',
        fontSize: 'var(--text-sm)',
      }}
    >
      {children}
    </div>
  );
}
