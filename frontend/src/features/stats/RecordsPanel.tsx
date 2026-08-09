import type { ReactNode } from 'react';
import { EmptyState } from '@/components/layout/EmptyState';
import type { StatsRecords } from '@/types/api';
import { dayLabel, duration, int, monthLabel, plural } from './statsFormat';
import styles from './stats.module.css';

function Card({
  kicker,
  value,
  detail,
}: {
  kicker: string;
  value: ReactNode;
  detail: ReactNode;
}) {
  return (
    <div className={styles.recordCard}>
      <span className={styles.recordKicker}>{kicker}</span>
      <span className={styles.recordValue}>{value}</span>
      <span className={styles.recordDetail}>{detail}</span>
    </div>
  );
}

/** Les faits marquants de la période, en phrases plutôt qu'en chiffres nus. */
export function RecordsPanel({ data }: { data: StatsRecords }) {
  const cards: { kicker: string; value: ReactNode; detail: ReactNode }[] = [];

  if (data.bestDay) {
    cards.push({
      kicker: 'Meilleure journée',
      value: duration(data.bestDay.totalMs),
      detail: `${dayLabel(data.bestDay.date)} · ${int(
        data.bestDay.playCount,
      )} lecture${plural(data.bestDay.playCount)}`,
    });
  }
  if (data.longestSession?.startedAt) {
    const d = new Date(data.longestSession.startedAt);
    cards.push({
      kicker: 'Plus longue session',
      value: duration(data.longestSession.totalMs),
      detail: `${d.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
      })} · ${int(data.longestSession.playCount)} titre${plural(
        data.longestSession.playCount,
      )} d'affilée`,
    });
  }
  if (data.obsession) {
    cards.push({
      kicker: 'Obsession',
      value: `${int(data.obsession.playCount)} ×`,
      detail: (
        <>
          « {data.obsession.title} »
          {data.obsession.artistName ? ` — ${data.obsession.artistName}` : ''}
          <br />
          en une journée, le {dayLabel(data.obsession.date)}
        </>
      ),
    });
  }
  if (data.bestMonth) {
    cards.push({
      kicker: 'Meilleur mois',
      value: monthLabel(data.bestMonth.month),
      detail: `${duration(data.bestMonth.totalMs)} · ${int(
        data.bestMonth.playCount,
      )} lecture${plural(data.bestMonth.playCount)}`,
    });
  }
  cards.push({
    kicker: 'Découvertes',
    value: int(data.discoveredTracks),
    detail: `titre${plural(data.discoveredTracks)} entendu${plural(
      data.discoveredTracks,
    )} pour la première fois · ${int(data.discoveredArtists)} artiste${plural(
      data.discoveredArtists,
    )}`,
  });

  if (!data.bestDay) return <EmptyState>Rien à raconter pour l'instant.</EmptyState>;

  return (
    <div className={styles.recordGrid}>
      {cards.map((c) => (
        <Card key={c.kicker} {...c} />
      ))}
    </div>
  );
}
