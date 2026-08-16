import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useT } from '@/i18n';
import styles from './library.module.css';

export function SectionHeader({
  title,
  to,
  action,
}: {
  title: string;
  to?: string;
  action?: ReactNode;
}) {
  const t = useT();
  return (
    <div className={styles.sectionHeader}>
      <h2 className={styles.sectionTitle}>{title}</h2>
      {to ? (
        <Link to={to} className={styles.sectionLink}>
          {t('common.seeAll')}
        </Link>
      ) : (
        action
      )}
    </div>
  );
}
