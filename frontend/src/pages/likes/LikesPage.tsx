import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { likesApi } from '@/api/likes';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/layout/EmptyState';
import { Spinner } from '@/components/primitives/Spinner';
import { AlbumsGrid } from '@/features/library/AlbumsGrid';
import { ArtistsGrid } from '@/features/library/ArtistsGrid';
import { TrackRow } from '@/features/library/TrackRow';
import tabStyles from '@/pages/music/MusicHome.module.css';

type Tab = 'tracks' | 'albums' | 'artists';

export function LikesPage() {
  const [tab, setTab] = useState<Tab>('tracks');
  const { data, isLoading } = useQuery({
    queryKey: ['likes'],
    queryFn: () => likesApi.list(),
    enabled: tab === 'tracks',
  });
  const tracks = data?.data ?? [];

  return (
    <div>
      <PageHeader title="Favoris" />

      <div className={tabStyles.tabs}>
        <button
          type="button"
          className={tab === 'tracks' ? tabStyles.tabActive : tabStyles.tab}
          onClick={() => setTab('tracks')}
        >
          Titres
        </button>
        <button
          type="button"
          className={tab === 'albums' ? tabStyles.tabActive : tabStyles.tab}
          onClick={() => setTab('albums')}
        >
          Albums
        </button>
        <button
          type="button"
          className={tab === 'artists' ? tabStyles.tabActive : tabStyles.tab}
          onClick={() => setTab('artists')}
        >
          Artistes
        </button>
      </div>

      {tab === 'tracks' &&
        (isLoading ? (
          <Spinner />
        ) : tracks.length ? (
          tracks.map((t, i) => (
            <TrackRow
              key={t.id}
              track={t}
              index={i}
              queue={tracks}
              source="likes"
              showNumber={false}
            />
          ))
        ) : (
          <EmptyState>
            Aucun titre liké. Touche le cœur sur un titre.
          </EmptyState>
        ))}

      {tab === 'albums' && <AlbumsGrid isLiked sort="title" order="asc" />}
      {tab === 'artists' && <ArtistsGrid isLiked sort="name" order="asc" />}
    </div>
  );
}
