import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { artistsApi } from '@/api/artists';
import { Grid } from '@/components/layout/Grid';
import { EmptyState } from '@/components/layout/EmptyState';
import { Spinner } from '@/components/primitives/Spinner';
import { AlbumCard } from '@/features/library/AlbumCard';
import { TrackRow } from '@/features/library/TrackRow';
import { DetailHero } from '@/features/library/DetailHero';
import { EntityLikeButton } from '@/features/likes/EntityLikeButton';
import { usePageTheme } from '@/hooks/appTheme';
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
  usePageTheme(artist?.coverUrl);

  if (isLoading) return <Spinner />;
  if (!artist) return <EmptyState>Artiste introuvable.</EmptyState>;

  const albums = artist.albums ?? [];
  const tracks = artist.tracks ?? [];

  return (
    <div className="page-enter">
      <DetailHero
        accent={accent}
        round
        coverUrl={artist.coverUrl}
        label={artist.name}
        kicker="Artiste"
        title={artist.name}
        subtitle={
          <>
            {albums.length > 0 && (
              <>
                {albums.length} album{albums.length > 1 ? 's' : ''} ·{' '}
              </>
            )}
            {artist.trackCount} titre{artist.trackCount > 1 ? 's' : ''}
            <br />
            {/* Somme des écoutes de tous les titres de l'artiste. */}
            {artist.playCount} écoute{artist.playCount > 1 ? 's' : ''}
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

      {albums.length > 0 && (
        <>
          <h2 className={styles.sectionTitle}>Albums</h2>
          <Grid>
            {albums.map((a) => (
              <AlbumCard key={a.id} album={a} />
            ))}
          </Grid>
        </>
      )}

      {tracks.length > 0 && (
        <>
          <h2 className={styles.sectionTitle}>Titres</h2>
          <div>
            {tracks.map((t, i) => (
              <TrackRow
                key={t.id}
                track={t}
                index={i}
                queue={tracks}
                source={`artist:${artist.id}`}
                showNumber={false}
              />
            ))}
          </div>
        </>
      )}

      {albums.length === 0 && tracks.length === 0 && (
        <EmptyState>Aucun contenu pour cet artiste.</EmptyState>
      )}
    </div>
  );
}
