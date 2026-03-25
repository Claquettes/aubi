import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Track } from './track.entity';

@Entity('audiobook_progress')
export class AudiobookProgress {
  @PrimaryColumn({ name: 'track_id', type: 'uuid' })
  trackId: string;

  @OneToOne(() => Track, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'track_id' })
  track: Track;

  @Column({ name: 'position_ms', type: 'int', default: 0 })
  positionMs: number;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
