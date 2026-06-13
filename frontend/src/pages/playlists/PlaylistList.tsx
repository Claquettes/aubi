import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { playlistsApi } from '@/api/playlists';
import { PageHeader } from '@/components/layout/PageHeader';
import { Grid } from '@/components/layout/Grid';
import { EmptyState } from '@/components/layout/EmptyState';
import { Spinner } from '@/components/primitives/Spinner';
import { Button } from '@/components/primitives/Button';
import { CreatePlaylistModal } from '@/features/playlists/CreatePlaylistModal';
import { PlaylistCard } from '@/features/playlists/PlaylistCard';

export function PlaylistList() {
  const [creating, setCreating] = useState(false);
  const { data, isLoading } = useQuery({
    queryKey: ['playlists'],
    queryFn: () => playlistsApi.list(),
  });
  const playlists = data?.data ?? [];

  return (
    <div>
      <PageHeader
        title="Playlists"
        actions={
          <Button variant="ghost" onClick={() => setCreating(true)}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
              }}
            >
              <Plus size={16} /> Nouvelle
            </span>
          </Button>
        }
      />
      {isLoading ? (
        <Spinner />
      ) : playlists.length ? (
        <Grid>
          {playlists.map((p) => (
            <PlaylistCard key={p.id} playlist={p} />
          ))}
        </Grid>
      ) : (
        <EmptyState>Aucune playlist. Crée-en une avec « Nouvelle ».</EmptyState>
      )}
      {creating && <CreatePlaylistModal onClose={() => setCreating(false)} />}
    </div>
  );
}
