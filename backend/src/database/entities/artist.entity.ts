import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Album } from './album.entity';
import { Track } from './track.entity';
import { Concert } from './concert.entity';

@Entity('artists')
export class Artist {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text', unique: true })
  name: string;

  @Column({ type: 'text', unique: true })
  slug: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @OneToMany(() => Album, (a) => a.artist)
  albums: Album[];

  @OneToMany(() => Track, (t) => t.artist)
  tracks: Track[];

  @OneToMany(() => Concert, (c) => c.artist)
  concerts: Concert[];
}
