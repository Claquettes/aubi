import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { AudiobookChapter } from './audiobook-chapter.entity';

@Entity('audiobooks')
export class Audiobook {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  title: string;

  @Column({ type: 'text', nullable: true })
  author: string | null;

  @Column({ name: 'cover_path', type: 'text', nullable: true })
  coverPath: string | null;

  @Column({ name: 'is_bible', type: 'boolean', default: false })
  isBible: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @OneToMany(() => AudiobookChapter, (c) => c.audiobook)
  chapters: AudiobookChapter[];
}
