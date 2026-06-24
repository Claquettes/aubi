import type { ReactNode } from 'react';
import styles from './EmptyState.module.css';

export function EmptyState({
  children,
  mark = '✳',
}: {
  children: ReactNode;
  mark?: ReactNode;
}) {
  return (
    <div className={styles.wrap}>
      <div className={styles.mark} aria-hidden="true">
        {mark}
      </div>
      <p className={styles.text}>{children}</p>
    </div>
  );
}
