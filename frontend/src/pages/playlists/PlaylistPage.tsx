import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Trash2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { playlistsApi } from '@/api/playlists';
import { DurationText } from '@/components/media/DurationText';
import { EmptyState } from '@/components/layout/EmptyState';
import { Spinner } from '@/components/primitives/Spinner';
import { DetailHero } from '@/features/library/DetailHero';
import { PlaylistTrackList } from '@/features/playlists/PlaylistTrackList';
import { PlayButton } from '@/features/player/PlayButton';
import { usePlayerStore } from '@/features/player/usePlayerStore';
import { usePageTheme } from '@/hooks/appTheme';
import { useCoverColor } from '@/hooks/useCoverColor';
import { useT } from '@/i18n';
import styles from './PlaylistPage.module.css';

export function PlaylistPage() {
  const t = useT();
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data: pl, isLoading } = useQuery({
    queryKey: ['playlist', id],
    queryFn: () => playlistsApi.get(id!),
    enabled: !!id,
  });
  const accent = useCoverColor(pl?.coverUrl);
  usePageTheme(pl?.coverUrl);
  const playTrack = usePlayerStore((s) => s.playTrack);
  const setSource = usePlayerStore((s) => s.setSource);

  if (isLoading) return <Spinner />;
  if (!pl) return <EmptyState>{t('playlist.notFound')}</EmptyState>;

  const tracks = pl.tracks ?? [];
  const playAll = () => {
    if (!tracks.length) return;
    setSource(`playlist:${pl.id}`);
    playTrack(tracks[0], tracks, 0);
  };
  const remove = async () => {
    if (!confirm(t('playlist.deleteConfirm', { name: pl.name }))) return;
    await playlistsApi.remove(pl.id);
    qc.invalidateQueries({ queryKey: ['playlists'] });
    navigate('/playlists');
  };

  return (
    <div className="page-enter">
      <DetailHero
        backFallback="/playlists"
        accent={accent}
        coverUrl={pl.coverUrl}
        label={pl.name}
        kicker={t('common.playlist')}
        title={pl.name}
        subtitle={
          <>
            {pl.description ? `${pl.description} · ` : ''}
            {t('count.tracks', { count: pl.trackCount })} ·{' '}
            <DurationText ms={pl.durationMs} />
          </>
        }
        actions={
          <>
            {tracks.length > 0 && <PlayButton onClick={playAll} />}
            <button
              type="button"
              className={styles.delete}
              onClick={remove}
              aria-label={t('playlist.deleteAria')}
            >
              <Trash2 size={20} />
            </button>
          </>
        }
      />
      {tracks.length ? (
        <PlaylistTrackList playlistId={pl.id} tracks={tracks} />
      ) : (
        <EmptyState>{t('playlist.tracksEmpty')}</EmptyState>
      )}
    </div>
  );
}
