import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { searchApi } from '@/api/search';
import { PageHeader } from '@/components/layout/PageHeader';
import { Grid } from '@/components/layout/Grid';
import { EmptyState } from '@/components/layout/EmptyState';
import { Spinner } from '@/components/primitives/Spinner';
import { AlbumCard } from '@/features/library/AlbumCard';
import { ArtistCard } from '@/features/library/ArtistCard';
import { SectionHeader } from '@/features/library/SectionHeader';
import { TrackRow } from '@/features/library/TrackRow';
import { useDebounce } from '@/hooks/useDebounce';
import styles from './SearchPage.module.css';

export function SearchPage() {
  const [q, setQ] = useState('');
  const dq = useDebounce(q.trim(), 300);
  const { data, isFetching } = useQuery({
    queryKey: ['search', dq],
    queryFn: () => searchApi.search(dq),
    enabled: dq.length >= 2,
  });

  const empty =
    data &&
    !data.tracks.length &&
    !data.albums.length &&
    !data.artists.length &&
    !data.concerts.length &&
    !data.audiobooks.length;

  return (
    <div>
      <PageHeader title="Recherche" />
      <input
        className={styles.input}
        placeholder="Rechercher un titre, un album, un artiste…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        autoFocus
      />

      {isFetching && <Spinner />}

      {data && !isFetching && (
        <>
          {data.artists.length > 0 && (
            <>
              <SectionHeader title="Artistes" />
              <Grid>
                {data.artists.map((a) => (
                  <ArtistCard key={a.id} artist={a} />
                ))}
              </Grid>
            </>
          )}
          {data.albums.length > 0 && (
            <>
              <SectionHeader title="Albums" />
              <Grid>
                {data.albums.map((a) => (
                  <AlbumCard key={a.id} album={a} />
                ))}
              </Grid>
            </>
          )}
          {data.tracks.length > 0 && (
            <>
              <SectionHeader title="Titres" />
              {data.tracks.map((t, i) => (
                <TrackRow
                  key={t.id}
                  track={t}
                  index={i}
                  queue={data.tracks}
                  source="search"
                  showNumber={false}
                />
              ))}
            </>
          )}
          {empty && <EmptyState>Aucun résultat pour « {dq} ».</EmptyState>}
        </>
      )}

      {dq.length < 2 && !isFetching && (
        <EmptyState>Tape au moins 2 caractères pour rechercher.</EmptyState>
      )}
    </div>
  );
}
