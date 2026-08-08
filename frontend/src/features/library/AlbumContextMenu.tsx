import { useState } from 'react';
import type { MouseEvent } from 'react';
import { CheckSquare, Disc3, ListMusic, MoreHorizontal } from 'lucide-react';
import { Modal } from '@/components/primitives/Modal';
import { useSelection } from '@/features/selection/selectionStore';
import type { Album } from '@/types/api';
import { useAlbumType } from './useAlbumType';
import styles from './library.module.css';

/** Actions d'une vignette album, sans avoir à ouvrir la page. */
export function AlbumContextMenu({ album }: { album: Album }) {
  const [open, setOpen] = useState(false);
  const enterSelection = useSelection((s) => s.enter);
  const setType = useAlbumType();

  // La vignette est un <Link> : tout clic à l'intérieur déclenche la navigation
  // native de l'ancre. Sur le bouton, on coupe tout ; dans la modale, on ne peut
  // pas le faire en remontée (Modal fait déjà un stopPropagation qui nous
  // court-circuite) → on neutralise le défaut en phase de CAPTURE, sans couper
  // la propagation pour laisser les entrées du menu réagir normalement.
  const stop = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <>
      <button
        type="button"
        aria-label={`Options de ${album.title}`}
        className={styles.cardMenu}
        onClick={(e) => {
          stop(e);
          setOpen(true);
        }}
      >
        <MoreHorizontal size={18} />
      </button>

      {open && (
        <span
          style={{ display: 'contents' }}
          onClickCapture={(e) => e.preventDefault()}
        >
          <Modal title={album.title} onClose={() => setOpen(false)}>
            <button
              type="button"
              className={styles.menuItem}
              onClick={() => {
                setOpen(false);
                setType.mutate({
                  ids: [album.id],
                  isCompilation: !album.isCompilation,
                });
              }}
            >
              {album.isCompilation ? (
                <>
                  <Disc3 size={18} /> C’est un album
                </>
              ) : (
                <>
                  <ListMusic size={18} /> C’est une playlist
                </>
              )}
            </button>
            <button
              type="button"
              className={styles.menuItem}
              onClick={() => {
                setOpen(false);
                enterSelection(album.id, 'album');
              }}
            >
              <CheckSquare size={18} /> Sélectionner
            </button>
          </Modal>
        </span>
      )}
    </>
  );
}
