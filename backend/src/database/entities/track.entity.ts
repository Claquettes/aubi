import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Artist } from './artist.entity';
import { Album } from './album.entity';
import { Concert } from './concert.entity';

export type TrackSection = 'music' | 'concert' | 'audiobook';

@Entity('tracks')
export class Track {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'file_path', type: 'text', unique: true })
  filePath: string;

  @Column({ type: 'text' })
  title: string;

  @Column({ name: 'artist_id', type: 'uuid', nullable: true })
  artistId: string | null;

  @ManyToOne(() => Artist, (a) => a.tracks, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'artist_id' })
  artist: Artist | null;

  @Column({ name: 'album_id', type: 'uuid', nullable: true })
  albumId: string | null;

  @ManyToOne(() => Album, (a) => a.tracks, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'album_id' })
  album: Album | null;

  @Column({ name: 'concert_id', type: 'uuid', nullable: true })
  concertId: string | null;

  @ManyToOne(() => Concert, (c) => c.tracks, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'concert_id' })
  concert: Concert | null;

  @Column({ name: 'track_number', type: 'smallint', nullable: true })
  trackNumber: number | null;

  @Column({ name: 'disc_number', type: 'smallint', default: 1 })
  discNumber: number;

  @Column({ name: 'duration_ms', type: 'int' })
  durationMs: number;

  @Column({ name: 'file_format', type: 'text', nullable: true })
  fileFormat: string | null;

  @Column({ name: 'file_size', type: 'bigint', nullable: true })
  fileSize: string | null;

  @Column({ type: 'int', nullable: true })
  bitrate: number | null;

  @Column({ name: 'sample_rate', type: 'int', nullable: true })
  sampleRate: number | null;

  @Column({ type: 'varchar', length: 32 })
  section: TrackSection;

  @Column({ name: 'is_cover', type: 'boolean', default: false })
  isCover: boolean;

  @Column({ type: 'text', nullable: true })
  genre: string | null;

  /**
   * Vrai quand les métadonnées (titre/artiste/album/genre) ont été éditées
   * manuellement : le scanner ne doit plus les écraser à partir des fichiers.
   */
  @Column({ name: 'metadata_locked', type: 'boolean', default: false })
  metadataLocked: boolean;

  @Column({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
