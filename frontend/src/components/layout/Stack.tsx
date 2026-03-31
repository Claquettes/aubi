import type { CSSProperties, ReactNode } from 'react';
import styles from './Stack.module.css';

const GAP: Record<
  1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12 | 16 | 20,
  string
> = {
  1: 'var(--space-1)',
  2: 'var(--space-2)',
  3: 'var(--space-3)',
  4: 'var(--space-4)',
  5: 'var(--space-5)',
  6: 'var(--space-6)',
  8: 'var(--space-8)',
  10: 'var(--space-10)',
  12: 'var(--space-12)',
  16: 'var(--space-16)',
  20: 'var(--space-20)',
};

export function Stack({
  direction = 'column',
  gap = 4,
  children,
  className = '',
  style,
}: {
  direction?: 'column' | 'row';
  gap?: 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12 | 16 | 20;
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  const g = GAP[gap];
  return (
    <div
      className={`${styles.stack} ${direction === 'row' ? styles.row : styles.col} ${className}`}
      style={{ gap: g, ...style }}
    >
      {children}
    </div>
  );
}
