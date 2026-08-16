import { useT } from '@/i18n';
import type { TopArtist } from '@/types/api';
import { RankedBars } from './RankedBars';
import { duration, int } from './statsFormat';

export function TopArtistsList({ items }: { items: TopArtist[] }) {
  const t = useT();
  return (
    <RankedBars
      items={items.map((it) => ({
        id: it.artist.id,
        label: it.artist.name,
        sub: t('stats.topArtistSub', {
          duration: duration(it.totalListenedMs),
          tracks: t('count.tracks', { count: it.distinctTracks }),
          total: int(it.libraryTracks),
        }),
        value: it.playCount,
        valueLabel: `${int(it.playCount)} ×`,
        coverUrl: it.artist.coverUrl,
        to: `/music/artists/${it.artist.id}`,
      }))}
    />
  );
}
