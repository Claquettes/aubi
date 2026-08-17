import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import type { TrackSection } from './track.entity';

/** Le type d'une bibliothèque donne la section de ses pistes dans l'app. */
export type LibraryType = TrackSection;

/**
 * Un dossier du disque déclaré par l'utilisateur (assistant de première
 * configuration ou page Paramètres). Remplace la variable MUSIC_PATH comme
 * source de vérité : le scanner parcourt les bibliothèques actives.
 */
@Entity('libraries')
export class Library {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  name: string;

  @Column({ type: 'varchar', length: 32 })
  type: LibraryType;

  /** Chemin absolu, tel que le backend le voit (montage identité en Docker). */
  @Column({ type: 'text', unique: true })
  path: string;

  /**
   * Une bibliothèque inactive n'est plus scannée et ses pistes sont masquées
   * (marquées `deleted_at`) — sans perdre likes, éditions ni statistiques.
   */
  @Column({ type: 'boolean', default: true })
  enabled: boolean;

  /**
   * Instant de la désactivation. Les pistes masquées à ce moment portent
   * exactement cet horodatage dans `deleted_at` : c'est ce qui les distingue
   * des pistes dont le fichier a réellement disparu, et ce qui permet de ne
   * ressusciter qu'elles à la réactivation.
   */
  @Column({ name: 'hidden_at', type: 'timestamptz', nullable: true })
  hiddenAt: Date | null;

  @Column({ type: 'int', default: 0 })
  position: number;

  @Column({ name: 'last_scan_at', type: 'timestamptz', nullable: true })
  lastScanAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
