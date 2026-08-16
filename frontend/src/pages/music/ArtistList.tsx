import { PageHeader } from '@/components/layout/PageHeader';
import { ArtistsGrid } from '@/features/library/ArtistsGrid';
import { useT } from '@/i18n';

export function ArtistList() {
  const t = useT();
  return (
    <div>
      <PageHeader title={t('common.artists')} />
      <ArtistsGrid />
    </div>
  );
}
