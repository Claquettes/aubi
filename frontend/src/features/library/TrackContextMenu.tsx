import { useState } from 'react';
import { MoreHorizontal, Pencil, Plus } from 'lucide-react';
import { Modal } from '@/components/primitives/Modal';
import { AddToPlaylistModal } from '@/features/playlists/AddToPlaylistModal';
import { EditTrackModal } from '@/features/metadata/EditTrackModal';
import type { Track } from '@/types/api';

const itemStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--space-3)',
  width: '100%',
  background: 'none',
  border: 'none',
  color: 'var(--color-text-primary)',
  padding: 'var(--space-3)',
  borderRadius: 'var(--radius-base)',
  cursor: 'pointer',
  fontFamily: 'var(--font-body)',
  fontSize: 'var(--text-sm)',
  textAlign: 'left' as const,
};

export function TrackContextMenu({ track }: { track: Track }) {
  const [menu, setMenu] = useState(false);
  const [addPl, setAddPl] = useState(false);
  const [edit, setEdit] = useState(false);

  return (
    <>
      <button
        type="button"
        aria-label="Options du titre"
        onClick={(e) => {
          e.stopPropagation();
          setMenu(true);
        }}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--color-text-tertiary)',
          cursor: 'pointer',
          display: 'flex',
          padding: 4,
        }}
      >
        <MoreHorizontal size={18} />
      </button>

      {menu && (
        <Modal title={track.title} onClose={() => setMenu(false)}>
          <button
            type="button"
            style={itemStyle}
            onClick={() => {
              setMenu(false);
              setAddPl(true);
            }}
          >
            <Plus size={18} /> Ajouter à une playlist
          </button>
          <button
            type="button"
            style={itemStyle}
            onClick={() => {
              setMenu(false);
              setEdit(true);
            }}
          >
            <Pencil size={18} /> Modifier les infos
          </button>
        </Modal>
      )}
      {addPl && (
        <AddToPlaylistModal track={track} onClose={() => setAddPl(false)} />
      )}
      {edit && <EditTrackModal track={track} onClose={() => setEdit(false)} />}
    </>
  );
}
