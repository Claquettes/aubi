import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { albumsApi } from '@/api/albums';
import { useToast } from '@/components/feedback/Toast';
import { Button } from '@/components/primitives/Button';
import { Modal } from '@/components/primitives/Modal';
import { useT } from '@/i18n';
import type { AlbumDetail } from '@/types/api';

const label = {
  fontSize: 'var(--text-xs)',
  color: 'var(--color-text-secondary)',
  textTransform: 'uppercase' as const,
  letterSpacing: 'var(--tracking-wide)',
  marginBottom: 'calc(-1 * var(--space-1))',
};
const input = {
  background: 'var(--color-bg-overlay)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-base)',
  padding: 'var(--space-3)',
  color: 'var(--color-text-primary)',
  fontFamily: 'var(--font-body)',
  fontSize: 'var(--text-sm)',
  outline: 'none',
  width: '100%',
};

export function EditAlbumModal({
  album,
  onClose,
}: {
  album: AlbumDetail;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const toast = useToast();
  const t = useT();
  const [title, setTitle] = useState(album.title);
  const [year, setYear] = useState(album.year ? String(album.year) : '');
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!title.trim() || saving) return;
    setSaving(true);
    try {
      const y = year.trim() ? Number(year.trim()) : undefined;
      await albumsApi.edit(album.id, {
        title: title.trim(),
        year: Number.isFinite(y) ? y : undefined,
      });
      qc.invalidateQueries();
      toast(t('edit.albumSaved'));
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={t('edit.albumTitle')} onClose={onClose}>
      <span style={label}>{t('edit.albumTitleField')}</span>
      <input
        style={input}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        autoFocus
      />
      <span style={label}>{t('edit.year')}</span>
      <input
        style={input}
        value={year}
        onChange={(e) => setYear(e.target.value.replace(/[^0-9]/g, ''))}
        placeholder="2024"
        inputMode="numeric"
      />
      <Button variant="primary" onClick={submit} disabled={!title.trim() || saving}>
        {saving ? t('common.saving') : t('common.save')}
      </Button>
      <p
        style={{
          fontSize: 'var(--text-xs)',
          color: 'var(--color-text-tertiary)',
        }}
      >
        {t('edit.albumNote')}
      </p>
    </Modal>
  );
}
