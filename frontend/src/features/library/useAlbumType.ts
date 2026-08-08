import { useMutation, useQueryClient } from '@tanstack/react-query';
import { albumsApi } from '@/api/albums';
import { useToast } from '@/components/feedback/Toast';

/**
 * Album ↔ playlist. Le scanner range en « collection » tout dossier à ≥ 8
 * artistes ; quand il se trompe, ce choix manuel prend le dessus (et survit
 * aux prochains scans, cf. `is_compilation_locked` côté serveur).
 */
export function useAlbumType() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: ({
      ids,
      isCompilation,
    }: {
      ids: string[];
      isCompilation: boolean;
    }) => albumsApi.setType(ids, isCompilation),
    onSuccess: (_res, { ids, isCompilation }) => {
      // Les deux pages changent de contenu : grille Albums et page Playlists.
      queryClient.invalidateQueries({ queryKey: ['albums'] });
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      for (const id of ids) {
        queryClient.invalidateQueries({ queryKey: ['album', id] });
      }
      const n = ids.length;
      toast(
        isCompilation
          ? n > 1
            ? `${n} albums déplacés dans les playlists`
            : 'Déplacé dans les playlists'
          : n > 1
            ? `${n} playlists remises dans les albums`
            : 'Remis dans les albums',
      );
    },
    onError: () => toast('Impossible de reclasser — réessaie'),
  });
}
