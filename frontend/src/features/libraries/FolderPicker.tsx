import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CornerLeftUp, Folder, HardDrive } from 'lucide-react';
import { systemApi } from '@/api/system';
import { Modal } from '@/components/primitives/Modal';
import { Button } from '@/components/primitives/Button';
import { Spinner } from '@/components/primitives/Spinner';
import { useApiError, useT } from '@/i18n';
import styles from './libraries.module.css';

/**
 * Navigateur de dossiers du serveur — l'utilisateur choisit sa bibliothèque
 * sans connaître le chemin par cœur. Le backend cantonne l'exploration à la
 * racine média (et aux bibliothèques déjà déclarées).
 */
export function FolderPicker({
  initialPath,
  onPick,
  onClose,
}: {
  initialPath?: string;
  onPick: (path: string) => void;
  onClose: () => void;
}) {
  const t = useT();
  const apiError = useApiError();
  const [path, setPath] = useState<string | undefined>(initialPath);
  const { data, isPending, error } = useQuery({
    queryKey: ['browse', path ?? ''],
    queryFn: () => systemApi.browse(path),
    retry: false,
  });

  return (
    <Modal title={t('libraries.pickFolder')} onClose={onClose}>
      <div className={styles.pickerPath}>
        <HardDrive size={14} aria-hidden="true" />
        <span>{data?.path ?? path ?? '…'}</span>
      </div>

      {error && <p className={styles.error}>{apiError(error)}</p>}

      <div className={styles.pickerList}>
        {isPending && <Spinner />}
        {data?.parent && (
          <button
            type="button"
            className={styles.pickerRow}
            onClick={() => setPath(data.parent ?? undefined)}
          >
            <CornerLeftUp size={16} aria-hidden="true" />
            <span>{t('libraries.parentFolder')}</span>
          </button>
        )}
        {data?.entries.map((e) => (
          <button
            key={e.path}
            type="button"
            className={styles.pickerRow}
            onClick={() => setPath(e.path)}
          >
            <Folder size={16} aria-hidden="true" />
            <span>{e.name}</span>
          </button>
        ))}
        {data && data.entries.length === 0 && (
          <p className={styles.hint}>{t('libraries.noSubfolder')}</p>
        )}
      </div>

      {data && (
        <p className={styles.hint}>
          {t('libraries.audioHere', { count: data.audioFileCount })}
        </p>
      )}

      <Button
        variant="primary"
        disabled={!data}
        onClick={() => {
          if (data) onPick(data.path);
        }}
      >
        {t('libraries.pickThis')}
      </Button>
    </Modal>
  );
}
