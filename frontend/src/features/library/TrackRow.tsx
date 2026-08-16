import { Check, Play, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { DurationText } from '@/components/media/DurationText';
import { LikeButton } from '@/features/likes/LikeButton';
import { PlayingIndicator } from '@/features/player/PlayingIndicator';
import { usePlayerStore } from '@/features/player/usePlayerStore';
import { useSelection } from '@/features/selection/selectionStore';
import { useT } from '@/i18n';
import type { Track } from '@/types/api';
import { TrackContextMenu } from './TrackContextMenu';
import styles from './library.module.css';

export function TrackRow({
  track,
  index,
  queue,
  source,
  showNumber = true,
  onRemove,
}: {
  track: Track;
  index?: number;
  queue?: Track[];
  source?: string;
  showNumber?: boolean;
  onRemove?: () => void;
}) {
  const t = useT();
  const currentId = usePlayerStore((s) => s.currentTrack?.id);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const playTrack = usePlayerStore((s) => s.playTrack);
  const setSource = usePlayerStore((s) => s.setSource);
  const isActive = currentId === track.id;
  const selActive = useSelection((s) => s.active && s.kind === 'track');
  const selected = useSelection((s) => s.ids.has(track.id));
  const toggleSel = useSelection((s) => s.toggle);

  const onPlay = () => {
    if (source) setSource(source);
    playTrack(track, queue ?? [track], index ?? 0);
  };

  // Position dans la liste (toujours séquentielle) plutôt que le trackNumber
  // brut, souvent absent/dupliqué sur les dossiers de playlists téléchargées.
  const num = index != null ? index + 1 : track.trackNumber;

  return (
    <div
      className={`${styles.row} ${isActive ? styles.rowActive : ''} ${selected ? styles.rowSelected : ''}`}
      onClick={selActive ? () => toggleSel(track.id) : onPlay}
    >
      <div className={styles.rowNum}>
        {selActive ? (
          <span
            className={`${styles.checkbox} ${selected ? styles.checkboxOn : ''}`}
          >
            {selected && <Check size={12} />}
          </span>
        ) : isActive ? (
          isPlaying ? (
            <PlayingIndicator />
          ) : (
            <Play size={13} />
          )
        ) : showNumber ? (
          (num ?? '·')
        ) : (
          '·'
        )}
      </div>
      <div className={styles.rowMain}>
        <div className={styles.rowTitle}>{track.title}</div>
        <div className={styles.rowSub}>
          {track.artist ? (
            <Link
              to={`/music/artists/${track.artist.id}`}
              className={styles.subLink}
              onClick={(e) => e.stopPropagation()}
            >
              {track.artist.name}
            </Link>
          ) : (
            '—'
          )}
          {track.isCover ? ` · ${t('track.cover')}` : ''}
        </div>
      </div>
      <div className={styles.rowActions} onClick={(e) => e.stopPropagation()}>
        <TrackContextMenu track={track} />
        <LikeButton track={track} />
        {onRemove && (
          <button
            type="button"
            className={styles.rowRemove}
            onClick={onRemove}
            aria-label={t('playlist.removeTrackAria')}
          >
            <X size={15} />
          </button>
        )}
        <span className={styles.rowDur}>
          <DurationText ms={track.durationMs} />
        </span>
      </div>
    </div>
  );
}
