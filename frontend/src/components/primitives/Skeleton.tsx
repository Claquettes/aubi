import type { CSSProperties } from 'react';
import styles from './Skeleton.module.css';

export function Skeleton({
  style,
  className = '',
}: {
  style?: CSSProperties;
  className?: string;
}) {
  return <span className={`${styles.sk} ${className}`} style={style} />;
}
