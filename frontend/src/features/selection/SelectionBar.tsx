import { useState } from 'react';
import { Pencil, X } from 'lucide-react';
import { BulkEditModal } from './BulkEditModal';
import { useSelection } from './selectionStore';
import styles from './SelectionBar.module.css';

export function SelectionBar() {
  const active = useSelection((s) => s.active);
  const ids = useSelection((s) => s.ids);
  const clear = useSelection((s) => s.clear);
  const [editing, setEditing] = useState(false);

  if (!active) return null;
  const count = ids.size;

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
          {count} titre{count > 1 ? 's' : ''} sélectionné{count > 1 ? 's' : ''}
        </span>
        <button
          type="button"
          className={styles.edit}
          onClick={() => setEditing(true)}
        >
          <Pencil size={16} /> Modifier
        </button>
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
