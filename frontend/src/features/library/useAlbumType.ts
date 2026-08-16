import { useMutation, useQueryClient } from '@tanstack/react-query';
import { albumsApi } from '@/api/albums';
import { useToast } from '@/components/feedback/Toast';
import { useT } from '@/i18n';

/**
 * Album ↔ playlist. Le scanner range en « collection » tout dossier à ≥ 8
 * artistes ; quand il se trompe, ce choix manuel prend le dessus (et survit
 * aux prochains scans, cf. `is_compilation_locked` côté serveur).
 */
export function useAlbumType() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const t = useT();

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
            ? t('select.movedToPlaylists', { count: n })
            : t('select.movedToPlaylistsOne')
          : n > 1
            ? t('select.movedToAlbums', { count: n })
            : t('select.movedToAlbumsOne'),
      );
    },
    onError: () => toast(t('select.moveError')),
  });
}
