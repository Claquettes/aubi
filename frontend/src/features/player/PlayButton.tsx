import { Pause, Play } from 'lucide-react';
import { useT } from '@/i18n';
import styles from './PlayButton.module.css';

export function PlayButton({
  onClick,
  label,
  playing = false,
}: {
  onClick: () => void;
  label?: string;
  playing?: boolean;
}) {
  const t = useT();
  return (
    <button type="button" className={styles.play} onClick={onClick}>
      {playing ? (
        <Pause size={19} fill="currentColor" />
      ) : (
        <Play size={19} fill="currentColor" />
      )}
      <span>{label ?? t('player.play')}</span>
    </button>
  );
}
