import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { tracksApi } from '@/api/tracks';
import { useToast } from '@/components/feedback/Toast';
import { Button } from '@/components/primitives/Button';
import { Modal } from '@/components/primitives/Modal';
import type { Track } from '@/types/api';

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

export function EditTrackModal({
  track,
  onClose,
}: {
  track: Track;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const toast = useToast();
  const [title, setTitle] = useState(track.title);
  const [artist, setArtist] = useState(track.artist?.name ?? '');
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!title.trim() || saving) return;
    setSaving(true);
    try {
      await tracksApi.edit(track.id, {
        title: title.trim(),
        artistName: artist.trim() || undefined,
      });
      qc.invalidateQueries();
      toast('Titre enregistré');
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="Modifier le titre" onClose={onClose}>
      <span style={label}>Titre</span>
      <input
        style={input}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        autoFocus
      />
      <span style={label}>Artiste(s) — séparez par une virgule</span>
      <input
        style={input}
        value={artist}
        onChange={(e) => setArtist(e.target.value)}
        placeholder="Artiste A, Artiste B"
      />
      <Button variant="primary" onClick={submit} disabled={!title.trim() || saving}>
        {saving ? 'Enregistrement…' : 'Enregistrer'}
      </Button>
      <p
        style={{
          fontSize: 'var(--text-xs)',
          color: 'var(--color-text-tertiary)',
        }}
      >
        Enregistré en base et dans les tags du fichier (MP3).
      </p>
    </Modal>
  );
}
