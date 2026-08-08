import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Disc3, ListMusic, Pencil } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { albumsApi } from '@/api/albums';
import { statsApi } from '@/api/stats';
import { DurationText } from '@/components/media/DurationText';
import { EmptyState } from '@/components/layout/EmptyState';
import { Spinner } from '@/components/primitives/Spinner';
import { DetailHero } from '@/features/library/DetailHero';
import { EntityLikeButton } from '@/features/likes/EntityLikeButton';
import { TrackRow } from '@/features/library/TrackRow';
import { EditAlbumModal } from '@/features/metadata/EditAlbumModal';
import { PlayButton } from '@/features/player/PlayButton';
import { usePlayerStore } from '@/features/player/usePlayerStore';
import { useAlbumType } from '@/features/library/useAlbumType';
import { usePageTheme } from '@/hooks/appTheme';
import { useCoverColor } from '@/hooks/useCoverColor';
import styles from './AlbumPage.module.css';

const heroButtonStyle = {
  background: 'none',
  border: 'none',
  color: 'var(--color-text-secondary)',
  cursor: 'pointer',
  display: 'flex',
  padding: 'var(--space-2)',
};

export function AlbumPage() {
  const { id } = useParams<{ id: string }>();
  const { data: album, isLoading } = useQuery({
    queryKey: ['album', id],
    queryFn: () => albumsApi.get(id!),
    enabled: !!id,
  });
  const accent = useCoverColor(album?.coverUrl);
  usePageTheme(album?.coverUrl);
  const playTrack = usePlayerStore((s) => s.playTrack);
  const setSource = usePlayerStore((s) => s.setSource);
  const [editing, setEditing] = useState(false);
  const setType = useAlbumType();
  const queryClient = useQueryClient();

  if (isLoading) return <Spinner />;
  if (!album) return <EmptyState>Album introuvable.</EmptyState>;

  const tracks = album.tracks ?? [];
  const playAll = () => {
    if (!tracks.length) return;
    setSource(`album:${album.id}`);
    playTrack(tracks[0], tracks, 0);
    // Compteur de lancements de l'album : distinct des écoutes de titres.
    // Best-effort — un échec réseau ne doit pas couper la lecture.
    statsApi
      .albumPlay(album.id)
      .then(({ albumPlayCount }) => {
        queryClient.setQueryData(
          ['album', album.id],
          (prev: typeof album | undefined) =>
            prev ? { ...prev, albumPlayCount } : prev,
        );
      })
      .catch(() => {});
  };
  const plural = (n: number) => (n > 1 ? 's' : '');

  return (
    <div className="page-enter">
      <DetailHero
        accent={accent}
        coverUrl={album.coverUrl}
        label={album.title}
        kicker={album.isCompilation ? 'Collection' : 'Album'}
        title={album.title}
        subtitle={
          <>
            {album.isCompilation ? (
              'Artistes variés'
            ) : album.artist ? (
              <Link
                to={`/music/artists/${album.artist.id}`}
                style={{ color: 'inherit', textDecoration: 'underline', textUnderlineOffset: '3px' }}
              >
                {album.artist.name}
              </Link>
            ) : (
              '—'
            )}
            {!album.isCompilation && album.year ? ` · ${album.year}` : ''} ·{' '}
            {album.trackCount} titres · <DurationText ms={album.durationMs} />
            <br />
            {album.albumPlayCount} lancement{plural(album.albumPlayCount)} ·{' '}
            {album.playCount} écoute{plural(album.playCount)} de titres
          </>
        }
        actions={
          <>
            <PlayButton onClick={playAll} />
            <EntityLikeButton
              kind="album"
              id={album.id}
              isLiked={album.isLiked}
              size={24}
            />
            <button
              type="button"
              onClick={() => setEditing(true)}
              aria-label="Modifier l'album"
              style={heroButtonStyle}
            >
              <Pencil size={20} />
            </button>
            <button
              type="button"
              onClick={() =>
                setType.mutate({
                  ids: [album.id],
                  isCompilation: !album.isCompilation,
                })
              }
              disabled={setType.isPending}
              aria-label={
                album.isCompilation
                  ? 'Remettre dans les albums'
                  : 'Déplacer dans les playlists'
              }
              title={
                album.isCompilation
                  ? 'C’est un album, pas une playlist'
                  : 'C’est une playlist, pas un album'
              }
              style={heroButtonStyle}
            >
              {album.isCompilation ? <Disc3 size={20} /> : <ListMusic size={20} />}
            </button>
          </>
        }
      />
      {editing && (
        <EditAlbumModal album={album} onClose={() => setEditing(false)} />
      )}
      <div className={styles.tracks}>
        {tracks.map((t, i) => (
          <TrackRow
            key={t.id}
            track={t}
            index={i}
            queue={tracks}
            source={`album:${album.id}`}
          />
        ))}
      </div>
    </div>
  );
}
