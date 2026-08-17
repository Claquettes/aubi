import { useQuery } from '@tanstack/react-query';
import { librariesApi } from '@/api/libraries';
import type { LibraryType } from '@/types/api';

export function useLibraries() {
  return useQuery({
    queryKey: ['libraries'],
    queryFn: () => librariesApi.list(),
    staleTime: 60_000,
  });
}

/**
 * Rubriques à afficher dans la navigation : une entrée vide n'a rien à dire.
 * La liste vient du serveur, qui la déduit du contenu indexé — une seule
 * bibliothèque musicale peut alimenter concerts et livres audio si elle suit
 * le découpage historique. Tant que la réponse n'est pas là (ou en cas
 * d'erreur), tout reste visible : mieux vaut une entrée vide qu'un menu qui
 * saute sous le doigt.
 */
export function useEnabledSections(): (section: LibraryType) => boolean {
  const { data } = useQuery({
    queryKey: ['libraries', 'sections'],
    queryFn: () => librariesApi.sections(),
    staleTime: 60_000,
  });
  if (!data) return () => true;
  const enabled = new Set(data);
  return (section) => enabled.has(section);
}
