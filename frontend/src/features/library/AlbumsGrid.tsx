import { useQuery } from '@tanstack/react-query';
import { albumsApi } from '@/api/albums';
import { Grid } from '@/components/layout/Grid';
import { EmptyState } from '@/components/layout/EmptyState';
import { AlbumCard } from './AlbumCard';
import { GridSkeleton } from './GridSkeleton';

export function AlbumsGrid({
  artistId,
  search,
  sort = 'title',
  order = 'asc',
  isLiked,
}: {
  artistId?: string;
  search?: string;
  sort?: string;
  order?: 'asc' | 'desc';
  isLiked?: boolean;
}) {
  const { data, isLoading } = useQuery({
    queryKey: ['albums', { artistId, search, sort, order, isLiked }],
    queryFn: () =>
      albumsApi.list({ artistId, search, sort, order, isLiked, limit: 200 }),
  });

  if (isLoading) return <GridSkeleton />;
  const albums = data?.data ?? [];
  if (!albums.length)
    return (
      <EmptyState>
        {isLiked
          ? 'Aucun album en favori.'
          : search
            ? `Aucun album pour « ${search} ».`
            : 'Aucun album. Lance un scan de ta bibliothèque dans Paramètres.'}
      </EmptyState>
    );

  return (
    <Grid>
      {albums.map((a) => (
        <AlbumCard key={a.id} album={a} />
      ))}
    </Grid>
  );
}
