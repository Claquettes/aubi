import { useState } from 'react';
import { ArrowDownAZ, ArrowUpZA, Heart } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { AlbumsGrid } from '@/features/library/AlbumsGrid';
import { ArtistsGrid } from '@/features/library/ArtistsGrid';
import { useDebounce } from '@/hooks/useDebounce';
import { useT, type TKey } from '@/i18n';
import styles from './MusicHome.module.css';

type Tab = 'albums' | 'artists';

const SORTS: Record<Tab, { value: string; label: TKey }[]> = {
  albums: [
    { value: 'plays', label: 'music.sort.plays' },
    { value: 'title', label: 'music.sort.title' },
    { value: 'year', label: 'music.sort.year' },
    { value: 'recent', label: 'music.sort.recent' },
  ],
  artists: [
    { value: 'plays', label: 'music.sort.plays' },
    { value: 'name', label: 'music.sort.name' },
    { value: 'recent', label: 'music.sort.recent' },
  ],
};

// Ordre naturel d'un tri : décroissant pour les quantités/dates, alphabétique
// croissant pour les libellés.
function defaultOrder(sort: string): 'asc' | 'desc' {
  return sort === 'title' || sort === 'name' ? 'asc' : 'desc';
}

export function MusicHome() {
  const t = useT();
  const [tab, setTab] = useState<Tab>('albums');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('plays');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [onlyLiked, setOnlyLiked] = useState(false);
  const debounced = useDebounce(search.trim(), 250);

  const switchTab = (next: Tab) => {
    setTab(next);
    changeSort(SORTS[next][0].value);
  };

  const changeSort = (s: string) => {
    setSort(s);
    setOrder(defaultOrder(s));
  };

  const tabBtn = (key: Tab, label: string) => (
    <button
      type="button"
      className={tab === key ? styles.tabActive : styles.tab}
      onClick={() => switchTab(key)}
    >
      {label}
    </button>
  );

  return (
    <div>
      <PageHeader title={t('nav.music')} />

      <div className={styles.tabs}>
        {tabBtn('albums', t('common.albums'))}
        {tabBtn('artists', t('common.artists'))}
      </div>

      {(
        <div className={styles.controls}>
          <input
            className={styles.search}
            placeholder={
              tab === 'albums'
                ? t('music.filterAlbums')
                : t('music.filterArtists')
            }
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className={styles.select}
            value={sort}
            onChange={(e) => changeSort(e.target.value)}
            aria-label={t('music.sortBy')}
          >
            {SORTS[tab].map((s) => (
              <option key={s.value} value={s.value}>
                {t(s.label)}
              </option>
            ))}
          </select>
          <button
            type="button"
            className={styles.iconBtn}
            onClick={() => setOrder((o) => (o === 'asc' ? 'desc' : 'asc'))}
            aria-label={
              order === 'asc'
                ? t('music.order.ascAria')
                : t('music.order.descAria')
            }
            title={
              order === 'asc' ? t('music.order.asc') : t('music.order.desc')
            }
          >
            {order === 'asc' ? <ArrowDownAZ size={18} /> : <ArrowUpZA size={18} />}
          </button>
          <button
            type="button"
            className={`${styles.iconBtn} ${onlyLiked ? styles.iconBtnActive : ''}`}
            onClick={() => setOnlyLiked((v) => !v)}
            aria-pressed={onlyLiked}
            aria-label={t('music.likedOnly')}
            title={t('music.likedOnly')}
          >
            <Heart size={18} fill={onlyLiked ? 'currentColor' : 'none'} />
          </button>
        </div>
      )}

      {tab === 'albums' ? (
        <AlbumsGrid
          search={debounced}
          sort={sort}
          order={order}
          isLiked={onlyLiked || undefined}
        />
      ) : (
        <ArtistsGrid
          search={debounced}
          sort={sort}
          order={order}
          isLiked={onlyLiked || undefined}
        />
      )}
    </div>
  );
}
