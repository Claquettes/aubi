import { useQuery } from '@tanstack/react-query';
import { collectionsApi } from '@/api/collections';
import { Grid } from '@/components/layout/Grid';
import { EmptyState } from '@/components/layout/EmptyState';
import { useT } from '@/i18n';
import { CollectionCard } from './CollectionCard';
import { GridSkeleton } from './GridSkeleton';

export function CollectionsGrid() {
  const t = useT();
  const { data, isLoading } = useQuery({
    queryKey: ['collections'],
    queryFn: () => collectionsApi.list(),
  });

  if (isLoading) return <GridSkeleton />;
  const cols = data?.data ?? [];
  if (!cols.length)
    return (
      <EmptyState>{t('grid.noCollection')}</EmptyState>
    );

  return (
    <Grid>
      {cols.map((c) => (
        <CollectionCard key={c.id} collection={c} />
      ))}
    </Grid>
  );
}
