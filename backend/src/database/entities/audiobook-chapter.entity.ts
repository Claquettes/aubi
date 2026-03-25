import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Audiobook } from './audiobook.entity';
import { Track } from './track.entity';

@Entity('audiobook_chapters')
@Unique(['audiobookId', 'chapterNumber'])
export class AudiobookChapter {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'audiobook_id', type: 'uuid' })
  audiobookId: string;

  @ManyToOne(() => Audiobook, (a) => a.chapters, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'audiobook_id' })
  audiobook: Audiobook;

  @Column({ type: 'text' })
  title: string;

  @Column({ name: 'chapter_number', type: 'smallint' })
  chapterNumber: number;

  @Column({ name: 'parent_section', type: 'text', nullable: true })
  parentSection: string | null;

  @Column({ name: 'track_id', type: 'uuid' })
  trackId: string;

  @ManyToOne(() => Track, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'track_id' })
  track: Track;
}
