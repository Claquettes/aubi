import styles from './player.module.css';

/** Petit égaliseur animé indiquant le titre en cours de lecture. */
export function PlayingIndicator() {
  return (
    <span className={styles.eq} aria-hidden="true">
      <span />
      <span />
      <span />
    </span>
  );
}
