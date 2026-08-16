import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ListMusic } from 'lucide-react';
import { AmbientBackground } from '@/components/media/AmbientBackground';
import { CoverArt } from '@/components/media/CoverArt';
import { LikeButton } from '@/features/likes/LikeButton';
import { PlayerControls } from './PlayerControls';
import { PlayerProgress } from './PlayerProgress';
import { QueueDrawer } from './QueueDrawer';
import { VolumeControl } from './VolumeControl';
import { useAudioPulse } from './useAudioPulse';
import { usePlayerStore } from './usePlayerStore';
import styles from './player.module.css';

export function FullPlayer() {
  const open = usePlayerStore((s) => s.fullPlayerOpen);
  const setOpen = usePlayerStore((s) => s.setFullPlayerOpen);
  const setQueueOpen = usePlayerStore((s) => s.setQueueOpen);
  const track = usePlayerStore((s) => s.currentTrack);
  const rootRef = useRef<HTMLDivElement>(null);

  useAudioPulse(rootRef, open && !!track);

  if (!open || !track) return null;

  return (
    <div className={styles.full} ref={rootRef}>
      <AmbientBackground variant="player" pulse={false} />

      <header className={styles.fullHead}>
        <button type="button" onClick={() => setOpen(false)} aria-label="Réduire">
          <ChevronDown size={24} />
        </button>
        {track.album ? (
          <Link
            to={`/music/albums/${track.album.id}`}
            className={styles.fullSource}
            onClick={() => setOpen(false)}
          >
            {track.album.title}
          </Link>
        ) : (
          <span className={styles.fullSource}>Lecture en cours</span>
        )}
        <button
          type="button"
          onClick={() => setQueueOpen(true)}
          aria-label="File d'attente"
        >
          <ListMusic size={22} />
        </button>
      </header>

      <div className={styles.fullStage}>
        <div className={styles.fullArt}>
          <CoverArt src={track.coverUrl} label={track.title} size="fill" />
        </div>
        <div className={styles.fullMain}>
          <div className={styles.fullTitleRow}>
            <div style={{ minWidth: 0 }}>
              <h2 className={styles.fullTitle}>{track.title}</h2>
              <p className={styles.fullArtist}>
                {track.artist ? (
                  <Link
                    to={`/music/artists/${track.artist.id}`}
                    className={styles.fullArtistLink}
                    onClick={() => setOpen(false)}
                  >
                    {track.artist.name}
                  </Link>
                ) : (
                  '—'
                )}
              </p>
            </div>
            <LikeButton track={track} size={22} />
          </div>
          <PlayerProgress />
          <PlayerControls size="lg" />
          <VolumeControl />
        </div>
      </div>

      <QueueDrawer />
    </div>
  );
}
