import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { collectionsApi } from '@/api/collections';
import { DurationText } from '@/components/media/DurationText';
import { EmptyState } from '@/components/layout/EmptyState';
import { Spinner } from '@/components/primitives/Spinner';
import { DetailHero } from '@/features/library/DetailHero';
import { TrackRow } from '@/features/library/TrackRow';
import { PlayButton } from '@/features/player/PlayButton';
import { usePlayerStore } from '@/features/player/usePlayerStore';
import { usePageTheme } from '@/hooks/appTheme';
import { useCoverColor } from '@/hooks/useCoverColor';

export function CollectionPage() {
  const { id } = useParams<{ id: string }>();
  const { data: col, isLoading } = useQuery({
    queryKey: ['collection', id],
    queryFn: () => collectionsApi.get(id!),
    enabled: !!id,
  });
  const accent = useCoverColor(col?.coverUrl);
  usePageTheme(col?.coverUrl);
  const playTrack = usePlayerStore((s) => s.playTrack);
  const setSource = usePlayerStore((s) => s.setSource);

  if (isLoading) return <Spinner />;
  if (!col) return <EmptyState>Collection introuvable.</EmptyState>;

  const tracks = col.tracks ?? [];
  const playAll = () => {
    if (!tracks.length) return;
    setSource(`collection:${col.id}`);
    playTrack(tracks[0], tracks, 0);
  };

  return (
    <div className="page-enter">
      <DetailHero
        accent={accent}
        coverUrl={col.coverUrl}
        label={col.name}
        kicker="Collection"
        title={col.name}
        subtitle={
          <>
            {col.trackCount} titres · {col.artistCount} artistes ·{' '}
            <DurationText ms={col.durationMs} />
          </>
        }
        actions={<PlayButton onClick={playAll} />}
      />
      <div>
        {tracks.map((t, i) => (
          <TrackRow
            key={t.id}
            track={t}
            index={i}
            queue={tracks}
            source={`collection:${col.id}`}
          />
        ))}
      </div>
    </div>
  );
}
