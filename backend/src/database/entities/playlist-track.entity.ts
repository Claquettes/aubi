import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { Playlist } from './playlist.entity';
import { Track } from './track.entity';

@Entity('playlist_tracks')
export class PlaylistTrack {
  @PrimaryColumn({ name: 'playlist_id', type: 'uuid' })
  playlistId: string;

  @PrimaryColumn({ name: 'track_id', type: 'uuid' })
  trackId: string;

  @ManyToOne(() => Playlist, (p) => p.playlistTracks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'playlist_id' })
  playlist: Playlist;

  @ManyToOne(() => Track, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'track_id' })
  track: Track;

  @Column({ type: 'smallint' })
  position: number;

  @CreateDateColumn({ name: 'added_at', type: 'timestamptz' })
  addedAt: Date;
}
