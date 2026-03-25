import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Artist } from './artist.entity';
import { Track } from './track.entity';

@Entity('concerts')
export class Concert {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  title: string;

  @Column({ name: 'artist_id', type: 'uuid', nullable: true })
  artistId: string | null;

  @ManyToOne(() => Artist, (a) => a.concerts, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'artist_id' })
  artist: Artist | null;

  @Column({ type: 'text', nullable: true })
  venue: string | null;

  @Column({ name: 'concert_date', type: 'date', nullable: true })
  concertDate: string | null;

  @Column({ name: 'cover_path', type: 'text', nullable: true })
  coverPath: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @OneToMany(() => Track, (t) => t.concert)
  tracks: Track[];
}
