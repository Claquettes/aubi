import { useState } from 'react';
import { Disc3, ListMusic, Pencil, X } from 'lucide-react';
import { useAlbumType } from '@/features/library/useAlbumType';
import { useT } from '@/i18n';
import { BulkEditModal } from './BulkEditModal';
import { useSelection } from './selectionStore';
import styles from './SelectionBar.module.css';

export function SelectionBar() {
  const t = useT();
  const active = useSelection((s) => s.active);
  const kind = useSelection((s) => s.kind);
  const ids = useSelection((s) => s.ids);
  const clear = useSelection((s) => s.clear);
  const setType = useAlbumType();
  const [editing, setEditing] = useState(false);

  if (!active) return null;
  const count = ids.size;

  const reclass = (isCompilation: boolean) => {
    setType.mutate({ ids: [...ids], isCompilation });
    clear();
  };

  return (
    <>
      <div className={styles.bar}>
        <button
          type="button"
          className={styles.close}
          onClick={clear}
          aria-label={t('select.cancelAria')}
        >
          <X size={20} />
        </button>
        <span className={styles.count}>
          {kind === 'album'
            ? t('select.albums', { count })
            : t('select.tracks', { count })}
        </span>
        {kind === 'album' ? (
          <>
            <button
              type="button"
              className={styles.edit}
              onClick={() => reclass(true)}
              disabled={setType.isPending}
            >
              <ListMusic size={16} /> {t('select.toPlaylists')}
            </button>
            <button
              type="button"
              className={styles.edit}
              onClick={() => reclass(false)}
              disabled={setType.isPending}
            >
              <Disc3 size={16} /> {t('select.toAlbums')}
            </button>
          </>
        ) : (
          <button
            type="button"
            className={styles.edit}
            onClick={() => setEditing(true)}
          >
            <Pencil size={16} /> {t('select.edit')}
          </button>
        )}
      </div>
      {editing && (
        <BulkEditModal
          ids={[...ids]}
          onClose={() => setEditing(false)}
          onDone={clear}
        />
      )}
    </>
  );
}
