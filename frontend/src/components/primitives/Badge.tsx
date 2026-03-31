import type { ReactNode } from 'react';
import styles from './Badge.module.css';

export function Badge({
  children,
  variant = 'default',
}: {
  children: ReactNode;
  variant?: 'default' | 'accent';
}) {
  return (
    <span
      className={`${styles.badge} ${variant === 'accent' ? styles.accent : ''}`}
    >
      {children}
    </span>
  );
}
