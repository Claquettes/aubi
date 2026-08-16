import { useRef } from 'react';
import { useAudioPulse } from '@/features/player/useAudioPulse';
import { usePlayerStore } from '@/features/player/usePlayerStore';
import styles from './AmbientBackground.module.css';

/** Six nappes de couleur, une par teinte extraite de la pochette. */
const ORBS = [
  styles.orbA,
  styles.orbB,
  styles.orbC,
  styles.orbD,
  styles.orbE,
  styles.orbF,
];

interface Props {
  /**
   * `app` : nappe discrète derrière toute l'application.
   * `player` : même fond, nettement plus présent, pour le lecteur plein écran.
   */
  variant?: 'app' | 'player';
  /**
   * Anime le fond au rythme de la musique en écrivant les variables --audio-*
   * sur son propre conteneur. À désactiver quand un parent les pose déjà (le
   * lecteur plein écran) : elles sont héritées.
   */
  pulse?: boolean;
}

/**
 * Fond ambiant : des taches de couleur issues de la pochette active, qui
 * dérivent et se déforment lentement en se mélangeant, et respirent au rythme
 * de la musique. Rendu sous tout le contenu, il suit automatiquement le thème
 * courant (--art-*), donc l'album consulté ou le titre en cours.
 */
export function AmbientBackground({ variant = 'app', pulse = true }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const isPlaying = usePlayerStore((s) => s.isPlaying);

  useAudioPulse(ref, pulse && isPlaying);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className={`${styles.bg} ${variant === 'player' ? styles.player : styles.app}`}
    >
      {ORBS.map((orb) => (
        <div key={orb} className={`${styles.orb} ${orb}`}>
          <div className={styles.morph}>
            <div className={styles.core} />
          </div>
        </div>
      ))}
      <div className={styles.beatFlash} />
      {variant === 'player' && <div className={styles.vignette} />}
    </div>
  );
}
