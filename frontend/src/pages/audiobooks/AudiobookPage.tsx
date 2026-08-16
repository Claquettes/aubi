import { useParams } from 'react-router-dom';
import { BookDetail } from '@/features/library/BookDetail';
import { useT } from '@/i18n';

export function AudiobookPage() {
  const t = useT();
  const { id } = useParams<{ id: string }>();
  if (!id) return null;
  return <BookDetail id={id} kicker={t('book.audiobook')} />;
}
