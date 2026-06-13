import { useQuery } from '@tanstack/react-query';
import { concertsApi } from '@/api/concerts';
import { PageHeader } from '@/components/layout/PageHeader';
import { Grid } from '@/components/layout/Grid';
import { EmptyState } from '@/components/layout/EmptyState';
import { Spinner } from '@/components/primitives/Spinner';
import { ConcertCard } from '@/features/library/ConcertCard';

export function ConcertList() {
  const { data, isLoading } = useQuery({
    queryKey: ['concerts'],
    queryFn: () => concertsApi.list({ limit: 200 }),
  });

  if (isLoading) return <Spinner />;
  const concerts = data?.data ?? [];

  return (
    <div>
      <PageHeader title="Concerts" />
      {concerts.length ? (
        <Grid>
          {concerts.map((c) => (
            <ConcertCard key={c.id} concert={c} />
          ))}
        </Grid>
      ) : (
        <EmptyState>
          Aucun concert. Ajoute des enregistrements dans le dossier concerts.
        </EmptyState>
      )}
    </div>
  );
}
