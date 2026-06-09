import { Pause, Play } from 'lucide-react';
import styles from './PlayButton.module.css';

export function PlayButton({
  onClick,
  label = 'Lecture',
  playing = false,
}: {
  onClick: () => void;
  label?: string;
  playing?: boolean;
}) {
  return (
    <button type="button" className={styles.play} onClick={onClick}>
      {playing ? (
        <Pause size={19} fill="currentColor" />
      ) : (
        <Play size={19} fill="currentColor" />
      )}
      <span>{label}</span>
    </button>
  );
}
