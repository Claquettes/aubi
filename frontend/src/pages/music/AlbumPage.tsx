import { useQuery } from '@tanstack/react-query';
import { type CSSProperties, useState } from 'react';
import { Pencil } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { albumsApi } from '@/api/albums';
import { DurationText } from '@/components/media/DurationText';
import { EmptyState } from '@/components/layout/EmptyState';
import { Spinner } from '@/components/primitives/Spinner';
import { DetailHero } from '@/features/library/DetailHero';
import { EntityLikeButton } from '@/features/likes/EntityLikeButton';
import { TrackRow } from '@/features/library/TrackRow';
import { EditAlbumModal } from '@/features/metadata/EditAlbumModal';
import { PlayButton } from '@/features/player/PlayButton';
import { usePlayerStore } from '@/features/player/usePlayerStore';
import { usePageTheme } from '@/hooks/appTheme';
import { useCoverColor } from '@/hooks/useCoverColor';
import styles from './AlbumPage.module.css';

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

  if (isLoading) return <Spinner />;
  if (!album) return <EmptyState>Album introuvable.</EmptyState>;

  const tracks = album.tracks ?? [];
  const playAll = () => {
    if (!tracks.length) return;
    setSource(`album:${album.id}`);
    playTrack(tracks[0], tracks, 0);
  };

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
            {album.isCompilation ? 'Artistes variés' : (album.artist?.name ?? '—')}
            {!album.isCompilation && album.year ? ` · ${album.year}` : ''} ·{' '}
            {album.trackCount} titres · <DurationText ms={album.durationMs} />
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
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-text-secondary)',
                cursor: 'pointer',
                display: 'flex',
                padding: 'var(--space-2)',
              }}
            >
              <Pencil size={20} />
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
