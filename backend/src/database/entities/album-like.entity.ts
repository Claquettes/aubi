import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { Album } from './album.entity';

@Entity('album_likes')
export class AlbumLike {
  @PrimaryColumn({ name: 'album_id', type: 'uuid' })
  albumId: string;

  @ManyToOne(() => Album, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'album_id' })
  album: Album;

  @Column({ name: 'liked_at', type: 'timestamptz', default: () => 'now()' })
  likedAt: Date;
}
