import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { playlistsApi } from '@/api/playlists';
import { EmptyState } from '@/components/layout/EmptyState';
import { Modal } from '@/components/primitives/Modal';
import { useT } from '@/i18n';
import type { Track } from '@/types/api';
import { CreatePlaylistModal } from './CreatePlaylistModal';

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

export function AddToPlaylistModal({
  track,
  onClose,
}: {
  track: Track;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const t = useT();
  const { data } = useQuery({
    queryKey: ['playlists'],
    queryFn: () => playlistsApi.list(),
  });
  const [creating, setCreating] = useState(false);

  const add = async (playlistId: string) => {
    await playlistsApi.addTracks(playlistId, [track.id]);
    qc.invalidateQueries({ queryKey: ['playlist', playlistId] });
    qc.invalidateQueries({ queryKey: ['playlists'] });
    onClose();
  };

  const playlists = data?.data ?? [];

  if (creating) {
    return (
      <CreatePlaylistModal
        onClose={() => setCreating(false)}
        onCreated={(id) => add(id)}
      />
    );
  }

  return (
    <Modal title={t('playlist.addTo')} onClose={onClose}>
      <button
        type="button"
        style={{ ...itemStyle, color: 'var(--color-accent)' }}
        onClick={() => setCreating(true)}
      >
        <Plus size={18} /> {t('playlist.addNew')}
      </button>
      {playlists.length ? (
        playlists.map((pl) => (
          <button
            key={pl.id}
            type="button"
            style={itemStyle}
            onClick={() => add(pl.id)}
          >
            {pl.name}
          </button>
        ))
      ) : (
        <EmptyState>{t('playlist.addEmpty')}</EmptyState>
      )}
    </Modal>
  );
}
