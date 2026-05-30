import { Column, Entity, PrimaryColumn } from 'typeorm';

/** Lien M2M titre ↔ artiste (un titre « A, B » a deux artistes). position 0 = principal. */
@Entity('track_artists')
export class TrackArtist {
  @PrimaryColumn({ name: 'track_id', type: 'uuid' })
  trackId: string;

  @PrimaryColumn({ name: 'artist_id', type: 'uuid' })
  artistId: string;

  @Column({ type: 'int', default: 0 })
  position: number;
}
