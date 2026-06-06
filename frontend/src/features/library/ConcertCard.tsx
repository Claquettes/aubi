import { Link } from 'react-router-dom';
import { CoverArt } from '@/components/media/CoverArt';
import type { Concert } from '@/types/api';
import styles from './library.module.css';

function year(date: string | null) {
  return date ? new Date(date).getFullYear() : null;
}

export function ConcertCard({ concert }: { concert: Concert }) {
  const y = year(concert.concertDate);
  return (
    <Link to={`/concerts/${concert.id}`} className={styles.card}>
      <CoverArt src={concert.coverUrl} label={concert.title} size="lg" />
      <div className={styles.cardBody}>
        <div className={styles.cardTitle}>{concert.title}</div>
        <div className={styles.cardSub}>
          {concert.venue ?? concert.artist?.name ?? '—'}
          {y ? ` · ${y}` : ''}
        </div>
      </div>
    </Link>
  );
}
