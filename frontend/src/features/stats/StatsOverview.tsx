import type { StatsOverview as SO } from '@/types/api';
import styles from './stats.module.css';

function hours(ms: number) {
  return Math.round(ms / 3_600_000);
}

export function StatsOverview({ data }: { data: SO }) {
  const tiles = [
    { label: 'Titres', value: data.totalTracks },
    { label: "Heures d'écoute", value: hours(data.totalListenedMs) },
    { label: 'Écoutes', value: data.totalPlayEvents },
    { label: 'Série', value: `${data.currentStreak} j` },
    { label: 'Record', value: `${data.longestStreak} j` },
  ];
  return (
    <div className={styles.tiles}>
      {tiles.map((t) => (
        <div key={t.label} className={styles.tile}>
          <span className={styles.tileValue}>{t.value}</span>
          <span className={styles.tileLabel}>{t.label}</span>
        </div>
      ))}
    </div>
  );
}
