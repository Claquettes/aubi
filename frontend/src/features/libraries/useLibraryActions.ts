import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { librariesApi, type LibraryInput } from '@/api/libraries';
import { useToast } from '@/components/feedback/Toast';
import { useApiError, useT } from '@/i18n';
import type { Library } from '@/types/api';

/**
 * Actions sur les bibliothèques, partagées par l'assistant de première
 * configuration et la page Paramètres. Toute modification change ce que
 * l'application a le droit d'afficher : on vide le cache en entier plutôt que
 * de lister les vingt clés concernées.
 */
export function useLibraryActions() {
  const qc = useQueryClient();
  const toast = useToast();
  const t = useT();
  const apiError = useApiError();

  const refresh = useCallback(() => qc.invalidateQueries(), [qc]);

  const run = useCallback(
    async <T,>(action: () => Promise<T>, success?: string): Promise<T | null> => {
      try {
        const out = await action();
        if (success) toast(success);
        return out;
      } catch (e) {
        toast(apiError(e));
        return null;
      } finally {
        await refresh();
      }
    },
    [apiError, refresh, toast],
  );

  return {
    create: (input: LibraryInput) =>
      run(() => librariesApi.create(input), t('libraries.created')),
    update: (id: string, input: Partial<LibraryInput>) =>
      run(() => librariesApi.update(id, input), t('libraries.saved')),
    toggle: (library: Library) =>
      run(
        () => librariesApi.update(library.id, { enabled: !library.enabled }),
        library.enabled ? t('libraries.disabled') : t('libraries.enabled'),
      ),
    remove: (library: Library) =>
      run(
        () => librariesApi.remove(library.id),
        t('libraries.removed', { name: library.name }),
      ),
    scan: (library: Library) =>
      run(() => librariesApi.scan(library.id), t('libraries.scanStarted')),
  };
}
