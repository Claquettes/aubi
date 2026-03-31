import { apiUrl } from '@/api/client';
import styles from './CoverArt.module.css';

type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

const sz: Record<Size, string> = {
  xs: styles.xs,
  sm: styles.sm,
  md: styles.md,
  lg: styles.lg,
  xl: styles.xl,
};

function initials(label: string) {
  return label
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase() || '?';
}

export function CoverArt({
  src,
  label,
  size = 'md',
}: {
  src?: string | null;
  label: string;
  size?: Size;
}) {
  const url = src ? apiUrl(src) : null;
  return (
    <div className={`${styles.box} ${sz[size]}`}>
      {url ? (
        <img className={styles.img} src={url} alt="" loading="lazy" />
      ) : (
        initials(label)
      )}
    </div>
  );
}
