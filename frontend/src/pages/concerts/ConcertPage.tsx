import { useQuery } from '@tanstack/react-query';
import type { CSSProperties } from 'react';
import { useParams } from 'react-router-dom';
import { concertsApi } from '@/api/concerts';
import { DurationText } from '@/components/media/DurationText';
import { EmptyState } from '@/components/layout/EmptyState';
import { Spinner } from '@/components/primitives/Spinner';
import { DetailHero } from '@/features/library/DetailHero';
import { TrackRow } from '@/features/library/TrackRow';
import { PlayButton } from '@/features/player/PlayButton';
import { usePlayerStore } from '@/features/player/usePlayerStore';
import { useCoverColor } from '@/hooks/useCoverColor';
import styles from './ConcertPage.module.css';

export function ConcertPage() {
  const { id } = useParams<{ id: string }>();
  const { data: concert, isLoading } = useQuery({
    queryKey: ['concert', id],
    queryFn: () => concertsApi.get(id!),
    enabled: !!id,
  });
  const accent = useCoverColor(concert?.coverUrl);
  const playTrack = usePlayerStore((s) => s.playTrack);
  const setSource = usePlayerStore((s) => s.setSource);

  if (isLoading) return <Spinner />;
  if (!concert) return <EmptyState>Concert introuvable.</EmptyState>;

  const tracks = concert.tracks ?? [];
  const playAll = () => {
    if (!tracks.length) return;
    setSource(`concert:${concert.id}`);
    playTrack(tracks[0], tracks, 0);
  };
  const date = concert.concertDate
    ? new Date(concert.concertDate).toLocaleDateString('fr-FR')
    : null;

  return (
    <div
      className="page-enter"
      style={accent ? ({ '--color-accent': accent } as CSSProperties) : undefined}
    >
      <DetailHero
        accent={accent}
        coverUrl={concert.coverUrl}
        label={concert.title}
        kicker="Concert"
        title={concert.title}
        subtitle={
          <>
            {[concert.venue, date].filter(Boolean).join(' · ')}
            {concert.trackCount ? ` · ${concert.trackCount} titres · ` : ' · '}
            <DurationText ms={concert.durationMs} />
          </>
        }
        actions={<PlayButton onClick={playAll} />}
      />
      {concert.notes && <p className={styles.notes}>{concert.notes}</p>}
      <div>
        {tracks.map((t, i) => (
          <TrackRow
            key={t.id}
            track={t}
            index={i}
            queue={tracks}
            source={`concert:${concert.id}`}
          />
        ))}
      </div>
    </div>
  );
}
