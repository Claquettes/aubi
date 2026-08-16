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
import { useT } from '@/i18n';
import styles from './ArtistPage.module.css';

export function ArtistPage() {
  const t = useT();
  const { id } = useParams<{ id: string }>();
  const { data: artist, isLoading } = useQuery({
    queryKey: ['artist', id],
    queryFn: () => artistsApi.get(id!),
    enabled: !!id,
  });
  const accent = useCoverColor(artist?.coverUrl);
  usePageTheme(artist?.coverUrl);

  if (isLoading) return <Spinner />;
  if (!artist) return <EmptyState>{t('artist.notFound')}</EmptyState>;

  const albums = artist.albums ?? [];
  const tracks = artist.tracks ?? [];

  return (
    <div className="page-enter">
      <DetailHero
        accent={accent}
        round
        coverUrl={artist.coverUrl}
        label={artist.name}
        kicker={t('common.artist')}
        title={artist.name}
        subtitle={
          <>
            {albums.length > 0 && (
              <>{t('count.albums', { count: albums.length })} · </>
            )}
            {t('count.tracks', { count: artist.trackCount })}
            <br />
            {/* Somme des écoutes de tous les titres de l'artiste. */}
            {t('count.listens', { count: artist.playCount })}
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
          <h2 className={styles.sectionTitle}>{t('common.albums')}</h2>
          <Grid>
            {albums.map((a) => (
              <AlbumCard key={a.id} album={a} />
            ))}
          </Grid>
        </>
      )}

      {tracks.length > 0 && (
        <>
          <h2 className={styles.sectionTitle}>{t('common.tracks')}</h2>
          <div>
            {tracks.map((track, i) => (
              <TrackRow
                key={track.id}
                track={track}
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
        <EmptyState>{t('artist.empty')}</EmptyState>
      )}
    </div>
  );
}
