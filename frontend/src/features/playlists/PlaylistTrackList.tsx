import { useQueryClient } from '@tanstack/react-query';
import { playlistsApi } from '@/api/playlists';
import { TrackRow } from '@/features/library/TrackRow';
import type { Track } from '@/types/api';

export function PlaylistTrackList({
  playlistId,
  tracks,
}: {
  playlistId: string;
  tracks: Track[];
}) {
  const qc = useQueryClient();

  const remove = async (trackId: string) => {
    await playlistsApi.removeTrack(playlistId, trackId);
    qc.invalidateQueries({ queryKey: ['playlist', playlistId] });
    qc.invalidateQueries({ queryKey: ['playlists'] });
  };

  return (
    <div>
      {tracks.map((t, i) => (
        <TrackRow
          key={t.id}
          track={t}
          index={i}
          queue={tracks}
          source={`playlist:${playlistId}`}
          showNumber={false}
          onRemove={() => remove(t.id)}
        />
      ))}
    </div>
  );
}
