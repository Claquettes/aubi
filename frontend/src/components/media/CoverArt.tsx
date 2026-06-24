import { apiUrl } from '@/api/client';
import styles from './CoverArt.module.css';

type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'fill';

const sz: Record<Size, string> = {
  xs: styles.xs,
  sm: styles.sm,
  md: styles.md,
  lg: styles.lg,
  xl: styles.xl,
  fill: styles.fill,
};

function initials(label: string) {
  return (
    label
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => [...w][0])
      .join('')
      .toUpperCase() || '?'
  );
}

/** Teinte stable dérivée du nom (pour les monogrammes des entités sans image). */
function hashHue(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h % 360;
}

export function CoverArt({
  src,
  label,
  size = 'md',
  round = false,
}: {
  src?: string | null;
  label: string;
  size?: Size;
  round?: boolean;
}) {
  const url = src ? apiUrl(src) : null;
  return (
    <div
      className={`${styles.box} ${sz[size]} ${round ? styles.round : ''}`}
      style={{ ['--mono-hue' as string]: hashHue(label) }}
    >
      {url ? (
        <img
          className={styles.img}
          src={url}
          alt=""
          loading="lazy"
          decoding="async"
        />
      ) : (
        <span className={styles.mono} aria-hidden="true">
          {initials(label)}
        </span>
      )}
    </div>
  );
}
