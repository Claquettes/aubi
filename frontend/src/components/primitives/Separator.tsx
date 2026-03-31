import styles from './Separator.module.css';

export function Separator({ subtle }: { subtle?: boolean }) {
  return <hr className={`${styles.sep} ${subtle ? styles.subtle : ''}`} />;
}
