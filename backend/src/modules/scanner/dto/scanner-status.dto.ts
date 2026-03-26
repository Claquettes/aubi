export class ScannerStatusDto {
  status: string;
  lastScanAt: string | null;
  tracksFound: number;
  progress: number;
  errorMessage: string | null;
}
