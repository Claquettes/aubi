import { EmptyState } from '@/components/layout/EmptyState';
import type { LibraryStats } from '@/types/api';
import { DecadeChart } from './DecadeChart';
import { ProportionBar } from './ProportionBar';
import { RankedBars } from './RankedBars';
import { StatTiles } from './StatTiles';
import { Block } from './StatsControls';
import { bytes, duration, int, percent, sectionLabel } from './statsFormat';
import styles from './stats.module.css';

/** Ce que contient le catalogue — indépendant de ce qui a été écouté. */
export function LibraryPanel({ data }: { data: LibraryStats }) {
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
          { label: 'Titres', value: int(totalTracks) },
          {
            label: 'Durée totale',
            value: duration(totalMs),
            hint: `${int(Math.round(totalMs / 86_400_000))} jours de lecture continue`,
          },
          { label: 'Sur le disque', value: bytes(totalBytes) },
          {
            label: 'Sans perte',
            value: percent(totalTracks ? lossless / totalTracks : 0),
            hint: `${int(lossless)} titres FLAC / WAV`,
          },
          {
            label: 'Durée médiane',
            value: duration(data.durations.medianMs),
            hint: `moyenne ${duration(data.durations.avgMs)}`,
          },
          {
            label: 'Plus long titre',
            value: duration(data.durations.maxMs),
          },
          {
            label: 'Jamais écoutés',
            value: int(data.neverPlayedTracks),
            hint: `${percent(
              totalTracks ? data.neverPlayedTracks / totalTracks : 0,
            )} du catalogue`,
          },
          {
            label: 'Albums intacts',
            value: int(data.neverPlayedAlbums),
            hint: 'aucun titre encore lancé',
          },
        ]}
      />

      <div className={styles.twoCol}>
        <Block title="Formats" caption="Répartition des fichiers du catalogue.">
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
        <Block title="Débit" caption="Paliers ordonnés, du plus compressé au sans perte.">
          <ProportionBar
            ordinal
            slices={data.byQuality.map((q) => ({
              label: q.bucket,
              value: q.trackCount,
            }))}
          />
        </Block>
      </div>

      {data.bySection.length > 1 && (
        <Block title="Par catégorie">
          <ProportionBar
            slices={data.bySection.map((s) => ({
              label: sectionLabel(s.section),
              value: s.trackCount,
              hint: `${int(s.trackCount)} titres · ${duration(s.totalMs)}`,
            }))}
          />
        </Block>
      )}

      <Block title="Par décennie" caption="Année de sortie des albums.">
        {data.byDecade.length ? (
          <DecadeChart data={data.byDecade} />
        ) : (
          <EmptyState>
            Aucun album n'a d'année renseignée — les balises sont vides.
          </EmptyState>
        )}
      </Block>

      <Block title="Genres">
        {data.byGenre.length ? (
          <RankedBars
            showCover={false}
            items={data.byGenre.map((g) => ({
              id: g.genre,
              label: g.genre,
              sub: duration(g.totalMs),
              value: g.trackCount,
              valueLabel: `${int(g.trackCount)} titres`,
            }))}
          />
        ) : (
          <EmptyState>Aucun genre renseigné dans les balises.</EmptyState>
        )}
      </Block>

      <Block title="Artistes les mieux fournis" caption="Par nombre de titres possédés.">
        <RankedBars
          items={data.topArtistsByTracks.map((a) => ({
            id: a.artist.id,
            label: a.artist.name,
            sub: `${int(a.albumCount)} album${a.albumCount > 1 ? 's' : ''}`,
            value: a.trackCount,
            valueLabel: `${int(a.trackCount)} titres`,
            coverUrl: a.artist.coverUrl,
            to: `/music/artists/${a.artist.id}`,
          }))}
        />
      </Block>
    </div>
  );
}
