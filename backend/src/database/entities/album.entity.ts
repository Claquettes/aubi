import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Artist } from './artist.entity';
import { Track } from './track.entity';

@Entity('albums')
@Unique(['artistId', 'slug'])
export class Album {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  title: string;

  @Column({ type: 'text' })
  slug: string;

  @Column({ name: 'artist_id', type: 'uuid', nullable: true })
  artistId: string | null;

  @ManyToOne(() => Artist, (a) => a.albums, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'artist_id' })
  artist: Artist | null;

  @Column({ type: 'smallint', nullable: true })
  year: number | null;

  @Column({ name: 'cover_path', type: 'text', nullable: true })
  coverPath: string | null;

  @Column({ name: 'total_tracks', type: 'smallint', nullable: true })
  totalTracks: number | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @OneToMany(() => Track, (t) => t.album)
  tracks: Track[];
}
