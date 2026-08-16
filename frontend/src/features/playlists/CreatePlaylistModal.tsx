import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { playlistsApi } from '@/api/playlists';
import { Button } from '@/components/primitives/Button';
import { Modal } from '@/components/primitives/Modal';
import { useT } from '@/i18n';

const inputStyle = {
  background: 'var(--color-bg-overlay)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-base)',
  padding: 'var(--space-3)',
  color: 'var(--color-text-primary)',
  fontFamily: 'var(--font-body)',
  fontSize: 'var(--text-sm)',
  outline: 'none',
  width: '100%',
} as const;

export function CreatePlaylistModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated?: (id: string) => void;
}) {
  const qc = useQueryClient();
  const t = useT();
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!name.trim() || saving) return;
    setSaving(true);
    try {
      const pl = await playlistsApi.create({
        name: name.trim(),
        description: desc.trim() || undefined,
      });
      qc.invalidateQueries({ queryKey: ['playlists'] });
      onCreated?.(pl.id);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={t('playlist.createTitle')} onClose={onClose}>
      <input
        style={inputStyle}
        placeholder={t('playlist.namePlaceholder')}
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
        autoFocus
      />
      <textarea
        style={{ ...inputStyle, minHeight: 72, resize: 'vertical' }}
        placeholder={t('playlist.descPlaceholder')}
        value={desc}
        onChange={(e) => setDesc(e.target.value)}
      />
      <Button
        variant="primary"
        onClick={submit}
        disabled={!name.trim() || saving}
      >
        {saving ? t('playlist.creating') : t('playlist.create')}
      </Button>
    </Modal>
  );
}
