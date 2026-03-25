import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { Track } from './track.entity';

@Entity('likes')
export class Like {
  @PrimaryColumn({ name: 'track_id', type: 'uuid' })
  trackId: string;

  @ManyToOne(() => Track, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'track_id' })
  track: Track;

  @Column({ name: 'liked_at', type: 'timestamptz', default: () => 'now()' })
  likedAt: Date;
}
