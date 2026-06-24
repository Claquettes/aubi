import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { playlistsApi } from '@/api/playlists';
import { albumsApi } from '@/api/albums';
import { PageHeader } from '@/components/layout/PageHeader';
import { Grid } from '@/components/layout/Grid';
import { EmptyState } from '@/components/layout/EmptyState';
import { Spinner } from '@/components/primitives/Spinner';
import { Button } from '@/components/primitives/Button';
import { CreatePlaylistModal } from '@/features/playlists/CreatePlaylistModal';
import { PlaylistCard } from '@/features/playlists/PlaylistCard';
import { AlbumCard } from '@/features/library/AlbumCard';

export function PlaylistList() {
  const [creating, setCreating] = useState(false);
  const { data, isLoading } = useQuery({
    queryKey: ['playlists'],
    queryFn: () => playlistsApi.list(),
  });
  // Les collections (dossiers multi-artistes) sont des albums « compilation » :
  // même page que les playlists créées, elles sont la même chose.
  const { data: colData, isLoading: colLoading } = useQuery({
    queryKey: ['albums', { isCompilation: true }],
    queryFn: () =>
      albumsApi.list({
        isCompilation: true,
        sort: 'title',
        order: 'asc',
        limit: 200,
      }),
  });
  const playlists = data?.data ?? [];
  const collections = colData?.data ?? [];
  const loading = isLoading || colLoading;

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
      {loading ? (
        <Spinner />
      ) : playlists.length || collections.length ? (
        <Grid>
          {playlists.map((p) => (
            <PlaylistCard key={p.id} playlist={p} />
          ))}
          {collections.map((a) => (
            <AlbumCard key={a.id} album={a} />
          ))}
        </Grid>
      ) : (
        <EmptyState>Aucune playlist. Crée-en une avec « Nouvelle ».</EmptyState>
      )}
      {creating && <CreatePlaylistModal onClose={() => setCreating(false)} />}
    </div>
  );
}
