import type { ReactNode } from 'react';
import styles from './ScrollArea.module.css';

export function ScrollArea({
  children,
  className = '',
}: {
  children?: ReactNode;
  className?: string;
}) {
  return <div className={`${styles.wrap} ${className}`}>{children}</div>;
}
