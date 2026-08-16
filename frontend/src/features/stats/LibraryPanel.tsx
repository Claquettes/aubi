import { EmptyState } from '@/components/layout/EmptyState';
import { useT, type TFn, type TKey } from '@/i18n';
import type { LibraryStats } from '@/types/api';
import { DecadeChart } from './DecadeChart';
import { ProportionBar } from './ProportionBar';
import { RankedBars } from './RankedBars';
import { StatTiles } from './StatTiles';
import { Block } from './StatsControls';
import { bytes, duration, int, percent, sectionLabel } from './statsFormat';
import styles from './stats.module.css';

/**
 * Deux libellés arrivent en dur du serveur (SQL) : on les retraduit ici
 * plutôt que de changer le contrat de l'API.
 */
const SERVER_LABELS: Record<string, TKey> = {
  'Sans perte': 'stats.lib.lossless',
  'Sans genre': 'stats.lib.noGenre',
};
const serverLabel = (v: string, t: TFn) =>
  SERVER_LABELS[v] ? t(SERVER_LABELS[v]) : v;

/** Ce que contient le catalogue — indépendant de ce qui a été écouté. */
export function LibraryPanel({ data }: { data: LibraryStats }) {
  const t = useT();
  const totalTracks = data.bySection.reduce((a, b) => a + b.trackCount, 0);
  const totalBytes = data.bySection.reduce((a, b) => a + b.sizeBytes, 0);
  const totalMs = data.bySection.reduce((a, b) => a + b.totalMs, 0);
  const lossless = data.byFormat
    .filter((f) => ['FLAC', 'WAV', 'AIFF'].includes(f.format))
    .reduce((a, b) => a + b.trackCount, 0);

  return (
    <div>
      <StatTiles
        columns={4}
        tiles={[
          { label: t('stats.lib.tracks'), value: int(totalTracks) },
          {
            label: t('stats.lib.totalDuration'),
            value: duration(totalMs),
            hint: t('stats.lib.totalDurationHint', {
              count: int(Math.round(totalMs / 86_400_000)),
            }),
          },
          { label: t('stats.lib.onDisk'), value: bytes(totalBytes) },
          {
            label: t('stats.lib.lossless'),
            value: percent(totalTracks ? lossless / totalTracks : 0),
            hint: t('stats.lib.losslessHint', { count: int(lossless) }),
          },
          {
            label: t('stats.lib.medianDuration'),
            value: duration(data.durations.medianMs),
            hint: t('stats.lib.medianDurationHint', {
              duration: duration(data.durations.avgMs),
            }),
          },
          {
            label: t('stats.lib.longestTrack'),
            value: duration(data.durations.maxMs),
          },
          {
            label: t('stats.lib.neverPlayed'),
            value: int(data.neverPlayedTracks),
            hint: t('stats.lib.neverPlayedHint', {
              percent: percent(
                totalTracks ? data.neverPlayedTracks / totalTracks : 0,
              ),
            }),
          },
          {
            label: t('stats.lib.untouchedAlbums'),
            value: int(data.neverPlayedAlbums),
            hint: t('stats.lib.untouchedAlbumsHint'),
          },
        ]}
      />

      <div className={styles.twoCol}>
        <Block
          title={t('stats.lib.formats')}
          caption={t('stats.lib.formatsCaption')}
        >
          <ProportionBar
            slices={data.byFormat.map((f) => ({
              label: f.format,
              value: f.trackCount,
              hint: `${percent(f.trackCount / (totalTracks || 1))} · ${bytes(
                f.sizeBytes,
              )}`,
            }))}
          />
        </Block>
        <Block
          title={t('stats.lib.bitrate')}
          caption={t('stats.lib.bitrateCaption')}
        >
          <ProportionBar
            ordinal
            slices={data.byQuality.map((q) => ({
              label: serverLabel(q.bucket, t),
              value: q.trackCount,
            }))}
          />
        </Block>
      </div>

      {data.bySection.length > 1 && (
        <Block title={t('stats.block.bySection')}>
          <ProportionBar
            slices={data.bySection.map((s) => ({
              label: sectionLabel(s.section),
              value: s.trackCount,
              hint: `${t('stats.lib.tracksValue', {
                count: int(s.trackCount),
              })} · ${duration(s.totalMs)}`,
            }))}
          />
        </Block>
      )}

      <Block
        title={t('stats.lib.decades')}
        caption={t('stats.lib.decadesCaption')}
      >
        {data.byDecade.length ? (
          <DecadeChart data={data.byDecade} />
        ) : (
          <EmptyState>{t('stats.lib.decadesEmpty')}</EmptyState>
        )}
      </Block>

      <Block title={t('stats.lib.genres')}>
        {data.byGenre.length ? (
          <RankedBars
            showCover={false}
            items={data.byGenre.map((g) => ({
              id: g.genre,
              label: serverLabel(g.genre, t),
              sub: duration(g.totalMs),
              value: g.trackCount,
              valueLabel: t('stats.lib.tracksValue', {
                count: int(g.trackCount),
              }),
            }))}
          />
        ) : (
          <EmptyState>{t('stats.lib.genresEmpty')}</EmptyState>
        )}
      </Block>

      <Block
        title={t('stats.lib.topArtistsByTracks')}
        caption={t('stats.lib.topArtistsByTracksCaption')}
      >
        <RankedBars
          items={data.topArtistsByTracks.map((a) => ({
            id: a.artist.id,
            label: a.artist.name,
            sub: t('count.albums', { count: a.albumCount }),
            value: a.trackCount,
            valueLabel: t('stats.lib.tracksValue', {
              count: int(a.trackCount),
            }),
            coverUrl: a.artist.coverUrl,
            to: `/music/artists/${a.artist.id}`,
          }))}
        />
      </Block>
    </div>
  );
}
