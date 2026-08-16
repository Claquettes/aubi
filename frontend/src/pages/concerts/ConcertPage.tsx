import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { concertsApi } from '@/api/concerts';
import { DurationText } from '@/components/media/DurationText';
import { EmptyState } from '@/components/layout/EmptyState';
import { Spinner } from '@/components/primitives/Spinner';
import { DetailHero } from '@/features/library/DetailHero';
import { TrackRow } from '@/features/library/TrackRow';
import { PlayButton } from '@/features/player/PlayButton';
import { usePlayerStore } from '@/features/player/usePlayerStore';
import { usePageTheme } from '@/hooks/appTheme';
import { useCoverColor } from '@/hooks/useCoverColor';
import { localeTag, useT } from '@/i18n';
import styles from './ConcertPage.module.css';

export function ConcertPage() {
  const t = useT();
  const { id } = useParams<{ id: string }>();
  const { data: concert, isLoading } = useQuery({
    queryKey: ['concert', id],
    queryFn: () => concertsApi.get(id!),
    enabled: !!id,
  });
  const accent = useCoverColor(concert?.coverUrl);
  usePageTheme(concert?.coverUrl);
  const playTrack = usePlayerStore((s) => s.playTrack);
  const setSource = usePlayerStore((s) => s.setSource);

  if (isLoading) return <Spinner />;
  if (!concert) return <EmptyState>{t('concert.notFound')}</EmptyState>;

  const tracks = concert.tracks ?? [];
  const playAll = () => {
    if (!tracks.length) return;
    setSource(`concert:${concert.id}`);
    playTrack(tracks[0], tracks, 0);
  };
  const date = concert.concertDate
    ? new Date(concert.concertDate).toLocaleDateString(localeTag())
    : null;

  return (
    <div className="page-enter">
      <DetailHero
        backFallback="/concerts"
        accent={accent}
        coverUrl={concert.coverUrl}
        label={concert.title}
        kicker={t('common.concert')}
        title={concert.title}
        subtitle={
          <>
            {[concert.venue, date].filter(Boolean).join(' · ')}
            {concert.trackCount
              ? ` · ${t('count.tracks', { count: concert.trackCount })} · `
              : ' · '}
            <DurationText ms={concert.durationMs} />
          </>
        }
        actions={<PlayButton onClick={playAll} />}
      />
      {concert.notes && <p className={styles.notes}>{concert.notes}</p>}
      <div>
        {tracks.map((track, i) => (
          <TrackRow
            key={track.id}
            track={track}
            index={i}
            queue={tracks}
            source={`concert:${concert.id}`}
          />
        ))}
      </div>
    </div>
  );
}
