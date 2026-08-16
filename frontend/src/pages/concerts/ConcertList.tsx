import { useQuery } from '@tanstack/react-query';
import { concertsApi } from '@/api/concerts';
import { PageHeader } from '@/components/layout/PageHeader';
import { Grid } from '@/components/layout/Grid';
import { EmptyState } from '@/components/layout/EmptyState';
import { Spinner } from '@/components/primitives/Spinner';
import { ConcertCard } from '@/features/library/ConcertCard';
import { useT } from '@/i18n';

export function ConcertList() {
  const t = useT();
  const { data, isLoading } = useQuery({
    queryKey: ['concerts'],
    queryFn: () => concertsApi.list({ limit: 200 }),
  });

  if (isLoading) return <Spinner />;
  const concerts = data?.data ?? [];

  return (
    <div>
      <PageHeader title={t('nav.concerts')} />
      {concerts.length ? (
        <Grid>
          {concerts.map((c) => (
            <ConcertCard key={c.id} concert={c} />
          ))}
        </Grid>
      ) : (
        <EmptyState>{t('concert.empty')}</EmptyState>
      )}
    </div>
  );
}
