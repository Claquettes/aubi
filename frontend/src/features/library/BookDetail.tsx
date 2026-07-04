import { useQuery } from '@tanstack/react-query';
import { audiobooksApi } from '@/api/audiobooks';
import { EmptyState } from '@/components/layout/EmptyState';
import { Spinner } from '@/components/primitives/Spinner';
import { PlayButton } from '@/features/player/PlayButton';
import { usePlayerStore } from '@/features/player/usePlayerStore';
import { usePageTheme } from '@/hooks/appTheme';
import { useCoverColor } from '@/hooks/useCoverColor';
import type { AudiobookChapter, AudiobookDetail, Track } from '@/types/api';
import { DetailHero } from './DetailHero';
import { TrackRow } from './TrackRow';

function chapterToTrack(book: AudiobookDetail, ch: AudiobookChapter): Track {
  return {
    id: ch.track.id,
    title: ch.title,
    artist: book.author ? { id: book.id, name: book.author } : null,
    album: { id: book.id, title: book.title, year: null },
    trackNumber: ch.chapterNumber,
    durationMs: ch.track.durationMs,
    fileFormat: null,
    section: 'audiobook',
    isCover: false,
    isLiked: false,
    playCount: 0,
    lastPlayedAt: null,
    coverUrl: book.coverUrl,
  };
}

export function BookDetail({ id, kicker }: { id: string; kicker: string }) {
  const { data: book, isLoading } = useQuery({
    queryKey: ['audiobook', id],
    queryFn: () => audiobooksApi.get(id),
    enabled: !!id,
  });
  const accent = useCoverColor(book?.coverUrl);
  usePageTheme(book?.coverUrl);
  const playTrack = usePlayerStore((s) => s.playTrack);
  const setSource = usePlayerStore((s) => s.setSource);

  if (isLoading) return <Spinner />;
  if (!book) return <EmptyState>Livre introuvable.</EmptyState>;

  const chapters = book.chapters ?? [];
  const tracks = chapters.map((ch) => chapterToTrack(book, ch));
  const play = (i: number) => {
    setSource(`audiobook:${book.id}`);
    playTrack(tracks[i], tracks, i);
  };

  return (
    <div className="page-enter">
      <DetailHero
        accent={accent}
        coverUrl={book.coverUrl}
        label={book.title}
        kicker={kicker}
        title={book.title}
        subtitle={
          <>
            {book.author ?? '—'} · {book.chapterCount} chapitres
          </>
        }
        actions={<PlayButton onClick={() => play(0)} label="Écouter" />}
      />
      <div>
        {tracks.map((t, i) => (
          <TrackRow
            key={t.id}
            track={t}
            index={i}
            queue={tracks}
            source={`audiobook:${book.id}`}
          />
        ))}
      </div>
    </div>
  );
}
