import { useQuery } from '@tanstack/react-query';
import { albumsApi } from '@/api/albums';
import { Grid } from '@/components/layout/Grid';
import { EmptyState } from '@/components/layout/EmptyState';
import { useT } from '@/i18n';
import { AlbumCard } from './AlbumCard';
import { GridSkeleton } from './GridSkeleton';

export function AlbumsGrid({
  artistId,
  search,
  sort = 'plays',
  order = 'desc',
  isLiked,
}: {
  artistId?: string;
  search?: string;
  sort?: string;
  order?: 'asc' | 'desc';
  isLiked?: boolean;
}) {
  const t = useT();
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
          ? t('grid.noLikedAlbum')
          : search
            ? t('grid.noAlbumFor', { query: search })
            : t('grid.noAlbum')}
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
