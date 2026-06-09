import { Volume1, Volume2, VolumeX } from 'lucide-react';
import { usePlayerStore } from './usePlayerStore';
import styles from './player.module.css';

export function VolumeControl() {
  const volume = usePlayerStore((s) => s.volume);
  const setVolume = usePlayerStore((s) => s.setVolume);
  const Icon = volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;

  return (
    <div className={styles.volume}>
      <button
        type="button"
        className={styles.volIcon}
        aria-label={volume === 0 ? 'Rétablir le son' : 'Couper le son'}
        onClick={() => setVolume(volume === 0 ? 0.9 : 0)}
      >
        <Icon size={18} />
      </button>
      <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={volume}
        onChange={(e) => setVolume(Number(e.target.value))}
        className={styles.volumeSlider}
        aria-label="Volume"
      />
    </div>
  );
}
