import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('scanner_state')
export class ScannerState {
  @PrimaryColumn({ type: 'smallint', default: 1 })
  id: number;

  @Column({ name: 'last_scan_at', type: 'timestamptz', nullable: true })
  lastScanAt: Date | null;

  @Column({ type: 'text', default: 'idle' })
  status: string;

  @Column({ name: 'tracks_found', type: 'int', default: 0 })
  tracksFound: number;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage: string | null;

  @Column({ name: 'scan_progress', type: 'int', default: 0 })
  scanProgress: number;

  @Column({ name: 'current_scan_id', type: 'uuid', nullable: true })
  currentScanId: string | null;
}
