import { Injectable } from '@nestjs/common';
import { parseFile, IAudioMetadata } from 'music-metadata';
import { stat } from 'fs/promises';

export interface ParsedAudioMeta {
  title: string;
  artist: string;
  album: string;
  trackNumber: number | null;
  discNumber: number;
  durationMs: number;
  fileFormat: string | null;
  fileSize: bigint | null;
  bitrate: number | null;
  sampleRate: number | null;
  embeddedPicture: Buffer | null;
  isCoverHint: boolean;
}

@Injectable()
export class MetadataService {
  async parseFilePath(filePath: string): Promise<ParsedAudioMeta> {
    const metadata = await parseFile(filePath);
    const st = await stat(filePath);
    return this.mapMetadata(metadata, st.size);
  }

  private mapMetadata(m: IAudioMetadata, fileSize: number): ParsedAudioMeta {
    const common = m.common;
    const format = m.format;
    let title = common.title?.trim();
    if (!title) {
      title =
        common.track?.no != null ? `Track ${common.track.no}` : 'Unknown';
    }
    const artist = common.artist?.trim() || common.artists?.[0]?.trim() || 'Unknown Artist';
    const album = common.album?.trim() || 'Unknown Album';
    const trackNumber = common.track?.no ?? null;
    const discNumber = common.disk?.no ?? 1;
    const durationMs = Math.round((format.duration ?? 0) * 1000) || 0;
    const pic = common.picture?.[0];
    const embeddedPicture = pic?.data?.length ? Buffer.from(pic.data) : null;
    const grouping = (common as { grouping?: string }).grouping?.toLowerCase() ?? '';
    const isCoverHint = grouping.includes('cover');

    return {
      title,
      artist,
      album,
      trackNumber,
      discNumber,
      durationMs: durationMs > 0 ? durationMs : 1,
      fileFormat: format.container?.toLowerCase() ?? format.codec?.toLowerCase() ?? null,
      fileSize: BigInt(fileSize),
      bitrate: format.bitrate ? Math.round(format.bitrate / 1000) : null,
      sampleRate: format.sampleRate ?? null,
      embeddedPicture,
      isCoverHint,
    };
  }
}
