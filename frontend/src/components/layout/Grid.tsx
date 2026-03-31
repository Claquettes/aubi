import type { ReactNode } from 'react';
import styles from './Grid.module.css';

export function Grid({
  children,
  className = '',
}: {
  children?: ReactNode;
  className?: string;
}) {
  return <div className={`${styles.grid} ${className}`}>{children}</div>;
}
