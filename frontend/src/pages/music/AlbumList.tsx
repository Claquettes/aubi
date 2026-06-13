import { PageHeader } from '@/components/layout/PageHeader';
import { AlbumsGrid } from '@/features/library/AlbumsGrid';

export function AlbumList() {
  return (
    <div>
      <PageHeader title="Albums" />
      <AlbumsGrid />
    </div>
  );
}
