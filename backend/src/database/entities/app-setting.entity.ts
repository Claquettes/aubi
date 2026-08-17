import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

/**
 * Réglages serveur, en clé/valeur : quelques lignes rares (fin de l'assistant
 * de configuration…) qui ne méritent pas une colonne dédiée.
 */
@Entity('app_settings')
export class AppSetting {
  @PrimaryColumn({ type: 'text' })
  key: string;

  @Column({ type: 'text', nullable: true })
  value: string | null;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
