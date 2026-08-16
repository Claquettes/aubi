import { useQuery } from '@tanstack/react-query';
import { BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import { audiobooksApi } from '@/api/audiobooks';
import { PageHeader } from '@/components/layout/PageHeader';
import { Grid } from '@/components/layout/Grid';
import { EmptyState } from '@/components/layout/EmptyState';
import { Spinner } from '@/components/primitives/Spinner';
import { BookCard } from '@/features/library/BookCard';
import { useT } from '@/i18n';

export function AudiobookList() {
  const t = useT();
  const { data, isLoading } = useQuery({
    queryKey: ['audiobooks'],
    queryFn: () => audiobooksApi.list({ limit: 200 }),
  });

  const books = (data?.data ?? []).filter((b) => !b.isBible);

  return (
    <div>
      <PageHeader
        title={t('nav.audiobooks')}
        actions={
          <Link
            to="/audiobooks/bible"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              color: 'var(--color-text-secondary)',
              textDecoration: 'none',
              fontSize: 'var(--text-sm)',
            }}
          >
            <BookOpen size={16} /> {t('book.bible')}
          </Link>
        }
      />
      {isLoading ? (
        <Spinner />
      ) : books.length ? (
        <Grid>
          {books.map((b) => (
            <BookCard key={b.id} book={b} />
          ))}
        </Grid>
      ) : (
        <EmptyState>{t('book.empty')}</EmptyState>
      )}
    </div>
  );
}
