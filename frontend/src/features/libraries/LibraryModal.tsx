import { useState } from 'react';
import { FolderSearch } from 'lucide-react';
import { Button } from '@/components/primitives/Button';
import { Modal } from '@/components/primitives/Modal';
import { useT, type TKey } from '@/i18n';
import type { Library, LibraryType } from '@/types/api';
import { FolderPicker } from './FolderPicker';
import { useLibraryActions } from './useLibraryActions';
import styles from './libraries.module.css';

const TYPES: { key: LibraryType; label: TKey; hint: TKey }[] = [
  { key: 'music', label: 'section.music', hint: 'libraries.type.musicHint' },
  { key: 'concert', label: 'section.concert', hint: 'libraries.type.concertHint' },
  {
    key: 'audiobook',
    label: 'section.audiobook',
    hint: 'libraries.type.audiobookHint',
  },
];

/** Le dernier segment du chemin fait un nom par défaut honnête. */
function nameFromPath(path: string): string {
  const seg = path.split('/').filter(Boolean).pop();
  return seg ?? path;
}

export function LibraryModal({
  library,
  defaultPath,
  onClose,
  onSaved,
}: {
  /** Renseignée = édition ; absente = création. */
  library?: Library;
  defaultPath?: string;
  onClose: () => void;
  onSaved?: () => void;
}) {
  const t = useT();
  const actions = useLibraryActions();
  const [name, setName] = useState(library?.name ?? '');
  const [type, setType] = useState<LibraryType>(library?.type ?? 'music');
  const [path, setPath] = useState(library?.path ?? defaultPath ?? '');
  const [picking, setPicking] = useState(false);
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    const finalPath = path.trim();
    if (!finalPath || saving) return;
    const finalName = name.trim() || nameFromPath(finalPath);
    setSaving(true);
    const out = library
      ? await actions.update(library.id, {
          name: finalName,
          type,
          path: finalPath,
        })
      : await actions.create({ name: finalName, type, path: finalPath });
    setSaving(false);
    if (out) {
      onSaved?.();
      onClose();
    }
  };

  return (
    <>
      <Modal
        title={t(library ? 'libraries.editTitle' : 'libraries.addTitle')}
        onClose={onClose}
      >
        <label className={styles.label} htmlFor="library-path">
          {t('libraries.pathLabel')}
        </label>
        <div className={styles.pathRow}>
          <input
            id="library-path"
            className={styles.input}
            placeholder="/mnt/disque/musique"
            value={path}
            onChange={(e) => setPath(e.target.value)}
            spellCheck={false}
          />
          <Button
            variant="ghost"
            onClick={() => setPicking(true)}
            aria-label={t('libraries.browse')}
          >
            <FolderSearch size={16} aria-hidden="true" />
          </Button>
        </div>

        <label className={styles.label} htmlFor="library-name">
          {t('libraries.nameLabel')}
        </label>
        <input
          id="library-name"
          className={styles.input}
          placeholder={path ? nameFromPath(path) : t('libraries.namePlaceholder')}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
        />

        <span className={styles.label}>{t('libraries.typeLabel')}</span>
        <div className={styles.typeRow} role="group">
          {TYPES.map((item) => (
            <button
              key={item.key}
              type="button"
              className={item.key === type ? styles.typeOn : styles.type}
              aria-pressed={item.key === type}
              onClick={() => setType(item.key)}
            >
              {t(item.label)}
            </button>
          ))}
        </div>
        <p className={styles.hint}>
          {t(TYPES.find((x) => x.key === type)?.hint ?? 'libraries.type.musicHint')}
        </p>

        <Button
          variant="primary"
          onClick={submit}
          disabled={!path.trim() || saving}
        >
          {saving
            ? t('libraries.saving')
            : t(library ? 'libraries.save' : 'libraries.add')}
        </Button>
      </Modal>

      {picking && (
        <FolderPicker
          initialPath={path.trim() || undefined}
          onPick={(picked) => {
            setPath(picked);
            if (!name.trim()) setName(nameFromPath(picked));
            setPicking(false);
          }}
          onClose={() => setPicking(false)}
        />
      )}
    </>
  );
}
