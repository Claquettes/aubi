import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Album } from './album.entity';

/**
 * Un appui sur le bouton lecture d'un album (« lancement »). Volontairement
 * séparé de PlayEvent : celui-ci compte les titres écoutés, celui-là les fois
 * où l'album a été lancé en entier.
 */
@Entity('album_plays')
export class AlbumPlay {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'album_id', type: 'uuid' })
  albumId: string;

  @ManyToOne(() => Album, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'album_id' })
  album: Album;

  @CreateDateColumn({ name: 'played_at', type: 'timestamptz' })
  playedAt: Date;

  @Column({ type: 'text', nullable: true })
  source: string | null;
}
