import { useState } from 'react';
import { ArrowDownAZ, ArrowUpZA, Heart } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { AlbumsGrid } from '@/features/library/AlbumsGrid';
import { ArtistsGrid } from '@/features/library/ArtistsGrid';
import { useDebounce } from '@/hooks/useDebounce';
import styles from './MusicHome.module.css';

type Tab = 'albums' | 'artists';

const SORTS: Record<'albums' | 'artists', { value: string; label: string }[]> = {
  albums: [
    { value: 'title', label: 'Titre' },
    { value: 'year', label: 'Année' },
    { value: 'recent', label: 'Récent' },
  ],
  artists: [
    { value: 'name', label: 'Nom' },
    { value: 'recent', label: 'Récent' },
  ],
};

export function MusicHome() {
  const [tab, setTab] = useState<Tab>('albums');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('title');
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');
  const [onlyLiked, setOnlyLiked] = useState(false);
  const debounced = useDebounce(search.trim(), 250);

  const switchTab = (t: Tab) => {
    setTab(t);
    setSort(SORTS[t][0].value);
  };

  const tabBtn = (t: Tab, label: string) => (
    <button
      type="button"
      className={tab === t ? styles.tabActive : styles.tab}
      onClick={() => switchTab(t)}
    >
      {label}
    </button>
  );

  return (
    <div>
      <PageHeader title="Musique" />

      <div className={styles.tabs}>
        {tabBtn('albums', 'Albums')}
        {tabBtn('artists', 'Artistes')}
      </div>

      {(
        <div className={styles.controls}>
          <input
            className={styles.search}
            placeholder={
              tab === 'albums' ? 'Filtrer les albums…' : 'Filtrer les artistes…'
            }
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className={styles.select}
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            aria-label="Trier par"
          >
            {SORTS[tab].map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            className={styles.iconBtn}
            onClick={() => setOrder((o) => (o === 'asc' ? 'desc' : 'asc'))}
            aria-label={order === 'asc' ? 'Ordre croissant' : 'Ordre décroissant'}
            title={order === 'asc' ? 'Croissant' : 'Décroissant'}
          >
            {order === 'asc' ? <ArrowDownAZ size={18} /> : <ArrowUpZA size={18} />}
          </button>
          <button
            type="button"
            className={`${styles.iconBtn} ${onlyLiked ? styles.iconBtnActive : ''}`}
            onClick={() => setOnlyLiked((v) => !v)}
            aria-pressed={onlyLiked}
            aria-label="Favoris uniquement"
            title="Favoris uniquement"
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
