import type { ReactNode } from 'react';
import { EmptyState } from '@/components/layout/EmptyState';
import { localeTag, useT } from '@/i18n';
import type { StatsRecords } from '@/types/api';
import { dayLabel, duration, int, monthLabel } from './statsFormat';
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
  const t = useT();
  const cards: { kicker: string; value: ReactNode; detail: ReactNode }[] = [];

  if (data.bestDay) {
    cards.push({
      kicker: t('stats.record.bestDay'),
      value: duration(data.bestDay.totalMs),
      detail: `${dayLabel(data.bestDay.date)} · ${t('count.plays', {
        count: data.bestDay.playCount,
      })}`,
    });
  }
  if (data.longestSession?.startedAt) {
    const d = new Date(data.longestSession.startedAt);
    cards.push({
      kicker: t('stats.record.longestSession'),
      value: duration(data.longestSession.totalMs),
      detail: t('stats.record.longestSessionDetail', {
        date: d.toLocaleDateString(localeTag(), {
          day: 'numeric',
          month: 'long',
        }),
        count: data.longestSession.playCount,
      }),
    });
  }
  if (data.obsession) {
    cards.push({
      kicker: t('stats.record.obsession'),
      value: t('stats.record.obsessionTimes', {
        count: int(data.obsession.playCount),
      }),
      detail: (
        <>
          {t('common.quote', { text: data.obsession.title })}
          {data.obsession.artistName ? ` — ${data.obsession.artistName}` : ''}
          <br />
          {t('stats.record.obsessionDetail', {
            date: dayLabel(data.obsession.date),
          })}
        </>
      ),
    });
  }
  if (data.bestMonth) {
    cards.push({
      kicker: t('stats.record.bestMonth'),
      value: monthLabel(data.bestMonth.month),
      detail: `${duration(data.bestMonth.totalMs)} · ${t('count.plays', {
        count: data.bestMonth.playCount,
      })}`,
    });
  }
  cards.push({
    kicker: t('stats.record.discoveries'),
    value: int(data.discoveredTracks),
    detail: t('stats.record.discoveriesDetail', {
      count: data.discoveredTracks,
      artists: t('count.artists', { count: data.discoveredArtists }),
    }),
  });

  if (!data.bestDay) return <EmptyState>{t('stats.record.empty')}</EmptyState>;

  return (
    <div className={styles.recordGrid}>
      {cards.map((c) => (
        <Card key={c.kicker} {...c} />
      ))}
    </div>
  );
}
