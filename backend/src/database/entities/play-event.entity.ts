import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Track } from './track.entity';

@Entity('play_events')
export class PlayEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'track_id', type: 'uuid' })
  trackId: string;

  @ManyToOne(() => Track, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'track_id' })
  track: Track;

  @CreateDateColumn({ name: 'played_at', type: 'timestamptz' })
  playedAt: Date;

  @Column({ name: 'duration_ms', type: 'int' })
  durationMs: number;

  @Column({ type: 'boolean', default: false })
  completed: boolean;

  @Column({ type: 'text', nullable: true })
  source: string | null;

  @Column({ type: 'varchar', length: 32 })
  section: string;
}
