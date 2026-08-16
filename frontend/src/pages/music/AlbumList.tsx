import { PageHeader } from '@/components/layout/PageHeader';
import { AlbumsGrid } from '@/features/library/AlbumsGrid';
import { useT } from '@/i18n';

export function AlbumList() {
  const t = useT();
  return (
    <div>
      <PageHeader title={t('common.albums')} />
      <AlbumsGrid />
    </div>
  );
}
