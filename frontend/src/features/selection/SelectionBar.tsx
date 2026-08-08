import { useState } from 'react';
import { Disc3, ListMusic, Pencil, X } from 'lucide-react';
import { useAlbumType } from '@/features/library/useAlbumType';
import { BulkEditModal } from './BulkEditModal';
import { useSelection } from './selectionStore';
import styles from './SelectionBar.module.css';

export function SelectionBar() {
  const active = useSelection((s) => s.active);
  const kind = useSelection((s) => s.kind);
  const ids = useSelection((s) => s.ids);
  const clear = useSelection((s) => s.clear);
  const setType = useAlbumType();
  const [editing, setEditing] = useState(false);

  if (!active) return null;
  const count = ids.size;
  const s = count > 1 ? 's' : '';

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
          aria-label="Annuler la sélection"
        >
          <X size={20} />
        </button>
        <span className={styles.count}>
          {count} {kind === 'album' ? 'album' : 'titre'}
          {s} sélectionné{s}
        </span>
        {kind === 'album' ? (
          <>
            <button
              type="button"
              className={styles.edit}
              onClick={() => reclass(true)}
              disabled={setType.isPending}
            >
              <ListMusic size={16} /> En playlists
            </button>
            <button
              type="button"
              className={styles.edit}
              onClick={() => reclass(false)}
              disabled={setType.isPending}
            >
              <Disc3 size={16} /> En albums
            </button>
          </>
        ) : (
          <button
            type="button"
            className={styles.edit}
            onClick={() => setEditing(true)}
          >
            <Pencil size={16} /> Modifier
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
