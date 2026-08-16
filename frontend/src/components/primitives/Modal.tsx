import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import { useT } from '@/i18n';
import styles from './Modal.module.css';

export function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const t = useT();
  return (
    <div className={styles.scrim} onClick={onClose}>
      <div
        className={styles.dialog}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <header className={styles.head}>
          <h2 className={styles.title}>{title}</h2>
          <button type="button" onClick={onClose} aria-label={t('common.close')}>
            <X size={18} />
          </button>
        </header>
        <div className={styles.body}>{children}</div>
      </div>
    </div>
  );
}
