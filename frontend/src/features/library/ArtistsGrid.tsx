import { useQuery } from '@tanstack/react-query';
import { artistsApi } from '@/api/artists';
import { Grid } from '@/components/layout/Grid';
import { EmptyState } from '@/components/layout/EmptyState';
import { ArtistCard } from './ArtistCard';
import { GridSkeleton } from './GridSkeleton';

export function ArtistsGrid({
  search,
  sort = 'name',
  order = 'asc',
  isLiked,
}: {
  search?: string;
  sort?: string;
  order?: 'asc' | 'desc';
  isLiked?: boolean;
}) {
  const { data, isLoading } = useQuery({
    queryKey: ['artists', { search, sort, order, isLiked }],
    queryFn: () =>
      artistsApi.list({ search, sort, order, isLiked, limit: 200 }),
  });

  if (isLoading) return <GridSkeleton round />;
  const artists = data?.data ?? [];
  if (!artists.length)
    return (
      <EmptyState>
        {isLiked
          ? 'Aucun artiste en favori.'
          : search
            ? `Aucun artiste pour « ${search} ».`
            : 'Aucun artiste pour le moment.'}
      </EmptyState>
    );

  return (
    <Grid>
      {artists.map((a) => (
        <ArtistCard key={a.id} artist={a} />
      ))}
    </Grid>
  );
}
