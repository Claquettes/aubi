import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Artist } from './artist.entity';
import { Track } from './track.entity';

@Entity('albums')
export class Album {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  title: string;

  @Column({ type: 'text' })
  slug: string;

  /**
   * Dossier disque de l'album : identité stable (un dossier = un album).
   * Évite les doublons titre×artiste des compilations multi-artistes.
   */
  @Index('idx_albums_folder_path')
  @Column({ name: 'folder_path', type: 'text', nullable: true })
  folderPath: string | null;

  /** Dossier à beaucoup d'artistes → traité comme une collection/playlist. */
  @Column({ name: 'is_compilation', type: 'boolean', default: false })
  isCompilation: boolean;

  /**
   * Classement décidé à la main dans l'app (album ↔ playlist) : le scan ne
   * recalcule plus `is_compilation` pour cet album.
   */
  @Column({ name: 'is_compilation_locked', type: 'boolean', default: false })
  isCompilationLocked: boolean;

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
