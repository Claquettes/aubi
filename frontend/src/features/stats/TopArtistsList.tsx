import type { TopArtist } from '@/types/api';
import { RankedBars } from './RankedBars';
import { duration, int, plural } from './statsFormat';

export function TopArtistsList({ items }: { items: TopArtist[] }) {
  return (
    <RankedBars
      items={items.map((it) => ({
        id: it.artist.id,
        label: it.artist.name,
        sub: `${duration(it.totalListenedMs)} · ${int(it.distinctTracks)} titre${plural(
          it.distinctTracks,
        )} sur ${int(it.libraryTracks)}`,
        value: it.playCount,
        valueLabel: `${int(it.playCount)} ×`,
        coverUrl: it.artist.coverUrl,
        to: `/music/artists/${it.artist.id}`,
      }))}
    />
  );
}
