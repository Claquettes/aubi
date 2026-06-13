import { PageHeader } from '@/components/layout/PageHeader';
import { ArtistsGrid } from '@/features/library/ArtistsGrid';

export function ArtistList() {
  return (
    <div>
      <PageHeader title="Artistes" />
      <ArtistsGrid />
    </div>
  );
}
