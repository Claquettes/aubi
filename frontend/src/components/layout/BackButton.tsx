import { useCallback, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePlayerStore } from '@/features/player/usePlayerStore';
import { useT } from '@/i18n';
import styles from './BackButton.module.css';

/**
 * Retour à l'écran précédent, sur mobile comme sur desktop : une PWA installée
 * (iOS surtout) n'a aucun bouton retour système. Doublé de la touche Échap.
 */
export function BackButton({ fallback = '/music' }: { fallback?: string }) {
  const t = useT();
  const navigate = useNavigate();

  const goBack = useCallback(() => {
    // `idx` est posé par react-router : 0 = on est arrivé directement sur la
    // page (lien partagé, PWA au démarrage), il n'y a rien derrière.
    const idx = (window.history.state as { idx?: number } | null)?.idx ?? 0;
    if (idx > 0) navigate(-1);
    else navigate(fallback, { replace: true });
  }, [navigate, fallback]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || e.defaultPrevented) return;
      const el = e.target as HTMLElement | null;
      if (
        el &&
        (el.tagName === 'INPUT' ||
          el.tagName === 'TEXTAREA' ||
          el.isContentEditable)
      ) {
        return;
      }
      // Une modale ou le lecteur plein écran passent avant la navigation.
      if (document.querySelector('[role="dialog"]')) return;
      if (usePlayerStore.getState().fullPlayerOpen) return;
      goBack();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goBack]);

  return (
    <button
      type="button"
      className={styles.back}
      onClick={goBack}
      aria-label={t('common.back')}
      title={t('common.backTitle')}
    >
      <ArrowLeft size={18} strokeWidth={2} />
      <span className={styles.label}>{t('common.back')}</span>
    </button>
  );
}
