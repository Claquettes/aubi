import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users } from 'lucide-react';
import { artistsApi } from '@/api/artists';
import { Grid } from '@/components/layout/Grid';
import { EmptyState } from '@/components/layout/EmptyState';
import { useT } from '@/i18n';
import { ArtistCard } from './ArtistCard';
import { ArtistesDiversModal } from './ArtistesDiversModal';
import { GridSkeleton } from './GridSkeleton';
import styles from './library.module.css';

export function ArtistsGrid({
  search,
  sort = 'plays',
  order = 'desc',
  isLiked,
}: {
  search?: string;
  sort?: string;
  order?: 'asc' | 'desc';
  isLiked?: boolean;
}) {
  const t = useT();
  const [diversOpen, setDiversOpen] = useState(false);
  // On ne regroupe les artistes à 1 titre que hors recherche / hors favoris
  // (sinon une recherche d'un artiste « divers » ne trouverait rien).
  const grouped = !search && !isLiked;

  const { data, isLoading } = useQuery({
    queryKey: ['artists', { search, sort, order, isLiked, grouped }],
    queryFn: () =>
      artistsApi.list({
        search,
        sort,
        order,
        isLiked,
        limit: 200,
        minTracks: grouped ? 2 : undefined,
      }),
  });
  const { data: divers } = useQuery({
    queryKey: ['artists-divers-count'],
    queryFn: () => artistsApi.list({ maxTracks: 1, limit: 1 }),
    enabled: grouped,
  });
  const diversCount = divers?.meta.total ?? 0;

  if (isLoading) return <GridSkeleton round />;
  const artists = data?.data ?? [];
  if (!artists.length && !(grouped && diversCount))
    return (
      <EmptyState>
        {isLiked
          ? t('grid.noLikedArtist')
          : search
            ? t('grid.noArtistFor', { query: search })
            : t('grid.noArtist')}
      </EmptyState>
    );

  return (
    <>
      <Grid>
        {artists.map((a) => (
          <ArtistCard key={a.id} artist={a} />
        ))}
        {grouped && diversCount > 0 && (
          <button
            type="button"
            className={styles.card}
            onClick={() => setDiversOpen(true)}
          >
            <div className={styles.cardCover}>
              <div className={`${styles.coverImg} ${styles.diversCover}`}>
                <Users size={44} strokeWidth={1.3} />
              </div>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.cardTitle}>
                {t('grid.variousArtists')}
              </div>
              <div className={styles.cardSub}>
                {t('grid.variousArtistsSub', { count: diversCount })}
              </div>
            </div>
          </button>
        )}
      </Grid>
      {diversOpen && (
        <ArtistesDiversModal onClose={() => setDiversOpen(false)} />
      )}
    </>
  );
}
