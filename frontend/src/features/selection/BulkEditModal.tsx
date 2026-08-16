import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { tracksApi } from '@/api/tracks';
import { useToast } from '@/components/feedback/Toast';
import { Button } from '@/components/primitives/Button';
import { Modal } from '@/components/primitives/Modal';
import { useT } from '@/i18n';

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

export function BulkEditModal({
  ids,
  onClose,
  onDone,
}: {
  ids: string[];
  onClose: () => void;
  onDone: () => void;
}) {
  const qc = useQueryClient();
  const toast = useToast();
  const t = useT();
  const [album, setAlbum] = useState('');
  const [artist, setArtist] = useState('');
  const [genre, setGenre] = useState('');
  const [year, setYear] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    const dto: {
      ids: string[];
      album?: string;
      artistName?: string;
      genre?: string;
      year?: number;
    } = { ids };
    if (album.trim()) dto.album = album.trim();
    if (artist.trim()) dto.artistName = artist.trim();
    if (genre.trim()) dto.genre = genre.trim();
    if (year.trim()) dto.year = Number(year.trim());

    if (Object.keys(dto).length === 1) {
      onClose();
      return;
    }
    setSaving(true);
    try {
      const r = await tracksApi.bulkEdit(dto);
      qc.invalidateQueries();
      toast(t('bulk.done', { count: r.updated }));
      onDone();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={t('bulk.title', { count: ids.length })} onClose={onClose}>
      <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>
        {t('bulk.hint')}
      </p>
      <span style={label}>{t('bulk.artists')}</span>
      <input
        style={input}
        value={artist}
        onChange={(e) => setArtist(e.target.value)}
        placeholder={t('bulk.keep')}
      />
      <span style={label}>{t('bulk.album')}</span>
      <input
        style={input}
        value={album}
        onChange={(e) => setAlbum(e.target.value)}
        placeholder={t('bulk.keep')}
      />
      <span style={label}>{t('bulk.genre')}</span>
      <input
        style={input}
        value={genre}
        onChange={(e) => setGenre(e.target.value)}
        placeholder={t('bulk.keep')}
      />
      <span style={label}>{t('bulk.year')}</span>
      <input
        style={input}
        value={year}
        onChange={(e) => setYear(e.target.value.replace(/[^0-9]/g, ''))}
        placeholder={t('bulk.keep')}
        inputMode="numeric"
      />
      <Button variant="primary" onClick={submit} disabled={saving}>
        {saving ? t('common.saving') : t('bulk.apply')}
      </Button>
    </Modal>
  );
}
