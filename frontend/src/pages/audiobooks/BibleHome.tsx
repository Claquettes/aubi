import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { audiobooksApi } from '@/api/audiobooks';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/layout/EmptyState';
import { Spinner } from '@/components/primitives/Spinner';
import { useT } from '@/i18n';
import styles from './BibleHome.module.css';

export function BibleHome() {
  const t = useT();
  const { data, isLoading } = useQuery({
    queryKey: ['bible'],
    queryFn: () => audiobooksApi.bibleBooks(),
  });

  if (isLoading) return <Spinner />;
  const books = data?.data ?? [];
  const sections = [...new Set(books.map((b) => b.section))];

  return (
    <div>
      <PageHeader title={t('book.bible')} />
      {books.length ? (
        sections.map((sec) => (
          <section key={sec} className={styles.section}>
            <h2 className={styles.sectionTitle}>{sec}</h2>
            <div className={styles.books}>
              {books
                .filter((b) => b.section === sec)
                .map((b) => (
                  <Link
                    key={b.id}
                    to={`/audiobooks/bible/${b.id}`}
                    className={styles.book}
                  >
                    <span className={styles.bookTitle}>{b.title}</span>
                    <span className={styles.bookCount}>{b.chapterCount}</span>
                  </Link>
                ))}
            </div>
          </section>
        ))
      ) : (
        <EmptyState>{t('book.bibleEmpty')}</EmptyState>
      )}
    </div>
  );
}
