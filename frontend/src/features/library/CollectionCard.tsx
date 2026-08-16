import { Layers } from 'lucide-react';
import { Link } from 'react-router-dom';
import { CoverArt } from '@/components/media/CoverArt';
import { useT } from '@/i18n';
import type { Collection } from '@/types/api';
import styles from './library.module.css';

export function CollectionCard({ collection }: { collection: Collection }) {
  const t = useT();
  return (
    <Link to={`/music/collections/${collection.id}`} className={styles.card}>
      <div className={styles.cardCover}>
        <CoverArt src={collection.coverUrl} label={collection.name} size="lg" />
        <span className={styles.collectionBadge}>
          <Layers size={12} /> {collection.albumCount}
        </span>
      </div>
      <div className={styles.cardBody}>
        <div className={styles.cardTitle}>{collection.name}</div>
        <div className={styles.cardSub}>
          {t('count.tracks', { count: collection.trackCount })} ·{' '}
          {t('count.albums', { count: collection.albumCount })}
        </div>
      </div>
    </Link>
  );
}
