import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { artistsApi } from '@/api/artists';
import { CoverArt } from '@/components/media/CoverArt';
import { Modal } from '@/components/primitives/Modal';
import { Spinner } from '@/components/primitives/Spinner';
import { useDebounce } from '@/hooks/useDebounce';
import styles from './ArtistesDiversModal.module.css';

/** Liste recherchable des artistes n'ayant qu'un seul titre. */
export function ArtistesDiversModal({ onClose }: { onClose: () => void }) {
  const [q, setQ] = useState('');
  const dq = useDebounce(q.trim(), 250);
  const { data, isFetching } = useQuery({
    queryKey: ['artists-divers', dq],
    queryFn: () =>
      artistsApi.list({
        maxTracks: 1,
        search: dq || undefined,
        sort: 'name',
        order: 'asc',
        limit: 300,
      }),
  });
  const artists = data?.data ?? [];

  return (
    <Modal title="Artistes divers" onClose={onClose}>
      <input
        className={styles.search}
        placeholder="Rechercher un artiste…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        autoFocus
      />
      {isFetching && !artists.length ? (
        <Spinner />
      ) : artists.length ? (
        <div className={styles.list}>
          {artists.map((a) => (
            <Link
              key={a.id}
              to={`/music/artists/${a.id}`}
              className={styles.row}
              onClick={onClose}
            >
              <CoverArt src={a.coverUrl} label={a.name} size="xs" round />
              <span className={styles.name}>{a.name}</span>
            </Link>
          ))}
        </div>
      ) : (
        <p className={styles.empty}>Aucun artiste.</p>
      )}
    </Modal>
  );
}
