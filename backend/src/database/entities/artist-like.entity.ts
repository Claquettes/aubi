import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { Artist } from './artist.entity';

@Entity('artist_likes')
export class ArtistLike {
  @PrimaryColumn({ name: 'artist_id', type: 'uuid' })
  artistId: string;

  @ManyToOne(() => Artist, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'artist_id' })
  artist: Artist;

  @Column({ name: 'liked_at', type: 'timestamptz', default: () => 'now()' })
  likedAt: Date;
}
