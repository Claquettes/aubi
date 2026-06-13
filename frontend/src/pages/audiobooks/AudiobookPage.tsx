import { useParams } from 'react-router-dom';
import { BookDetail } from '@/features/library/BookDetail';

export function AudiobookPage() {
  const { id } = useParams<{ id: string }>();
  if (!id) return null;
  return <BookDetail id={id} kicker="Livre audio" />;
}
