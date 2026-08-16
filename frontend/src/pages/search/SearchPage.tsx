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
import { useT } from '@/i18n';
import styles from './SearchPage.module.css';

export function SearchPage() {
  const t = useT();
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
      <PageHeader title={t('nav.search')} />
      <input
        className={styles.input}
        placeholder={t('search.placeholder')}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        autoFocus
      />

      {isFetching && <Spinner />}

      {data && !isFetching && (
        <>
          {data.artists.length > 0 && (
            <>
              <SectionHeader title={t('common.artists')} />
              <Grid>
                {data.artists.map((a) => (
                  <ArtistCard key={a.id} artist={a} />
                ))}
              </Grid>
            </>
          )}
          {data.albums.length > 0 && (
            <>
              <SectionHeader title={t('common.albums')} />
              <Grid>
                {data.albums.map((a) => (
                  <AlbumCard key={a.id} album={a} />
                ))}
              </Grid>
            </>
          )}
          {data.tracks.length > 0 && (
            <>
              <SectionHeader title={t('common.tracks')} />
              {data.tracks.map((track, i) => (
                <TrackRow
                  key={track.id}
                  track={track}
                  index={i}
                  queue={data.tracks}
                  source="search"
                  showNumber={false}
                />
              ))}
            </>
          )}
          {empty && (
            <EmptyState>{t('search.noResult', { query: dq })}</EmptyState>
          )}
        </>
      )}

      {dq.length < 2 && !isFetching && (
        <EmptyState>{t('search.tooShort')}</EmptyState>
      )}
    </div>
  );
}
