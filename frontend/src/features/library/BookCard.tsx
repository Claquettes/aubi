import { Link } from 'react-router-dom';
import { CoverArt } from '@/components/media/CoverArt';
import type { Audiobook } from '@/types/api';
import styles from './library.module.css';

export function BookCard({ book }: { book: Audiobook }) {
  return (
    <Link to={`/audiobooks/${book.id}`} className={styles.card}>
      <CoverArt src={book.coverUrl} label={book.title} size="lg" />
      <div className={styles.cardBody}>
        <div className={styles.cardTitle}>{book.title}</div>
        <div className={styles.cardSub}>
          {book.author ?? '—'}
          {book.progressPercent > 0 ? ` · ${book.progressPercent}%` : ''}
        </div>
      </div>
    </Link>
  );
}
