import { useQuery } from '@tanstack/react-query';
import type { CSSProperties } from 'react';
import { useParams } from 'react-router-dom';
import { artistsApi } from '@/api/artists';
import { Grid } from '@/components/layout/Grid';
import { EmptyState } from '@/components/layout/EmptyState';
import { Spinner } from '@/components/primitives/Spinner';
import { AlbumCard } from '@/features/library/AlbumCard';
import { DetailHero } from '@/features/library/DetailHero';
import { EntityLikeButton } from '@/features/likes/EntityLikeButton';
import { useCoverColor } from '@/hooks/useCoverColor';
import styles from './ArtistPage.module.css';

export function ArtistPage() {
  const { id } = useParams<{ id: string }>();
  const { data: artist, isLoading } = useQuery({
    queryKey: ['artist', id],
    queryFn: () => artistsApi.get(id!),
    enabled: !!id,
  });
  const accent = useCoverColor(artist?.coverUrl);

  if (isLoading) return <Spinner />;
  if (!artist) return <EmptyState>Artiste introuvable.</EmptyState>;

  const albums = artist.albums ?? [];

  return (
    <div
      className="page-enter"
      style={accent ? ({ '--color-accent': accent } as CSSProperties) : undefined}
    >
      <DetailHero
        accent={accent}
        round
        coverUrl={artist.coverUrl}
        label={artist.name}
        kicker="Artiste"
        title={artist.name}
        subtitle={
          <>
            {artist.albumCount} album{artist.albumCount > 1 ? 's' : ''} ·{' '}
            {artist.trackCount} titres
          </>
        }
        actions={
          <EntityLikeButton
            kind="artist"
            id={artist.id}
            isLiked={artist.isLiked}
            size={24}
          />
        }
      />
      <h2 className={styles.sectionTitle}>Albums</h2>
      {albums.length ? (
        <Grid>
          {albums.map((a) => (
            <AlbumCard key={a.id} album={a} />
          ))}
        </Grid>
      ) : (
        <EmptyState>Aucun album.</EmptyState>
      )}
    </div>
  );
}
