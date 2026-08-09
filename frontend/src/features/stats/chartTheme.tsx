import type { ReactNode } from 'react';
import styles from './stats.module.css';

/**
 * Palette catégorielle : on assigne les créneaux dans l'ordre, jamais en
 * boucle. L'ordre est le mécanisme de sécurité daltonisme (voir tokens.css) ;
 * au-delà de six séries on regroupe en « Autres » plutôt que d'inventer une
 * teinte. Les valeurs sont des variables CSS, donc le thème clair suit tout
 * seul — SVG accepte var() dans fill/stroke.
 */
export const CHART_COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
  'var(--chart-6)',
] as const;

/** Rampe séquentielle une teinte : faible → fort. */
export const HEAT_COLORS = [
  'var(--heat-1)',
  'var(--heat-2)',
  'var(--heat-3)',
  'var(--heat-4)',
  'var(--heat-5)',
] as const;

export const axisProps = {
  tick: { fill: 'var(--color-ink-muted)', fontSize: 11 },
  axisLine: false,
  tickLine: false,
} as const;

export const gridProps = {
  stroke: 'var(--chart-grid)',
  strokeDasharray: '2 4',
  vertical: false,
} as const;

/** Infobulle maison : mêmes filets et même encre que le reste de la page. */
export function ChartTooltip({
  active,
  label,
  rows,
}: {
  active?: boolean;
  label?: ReactNode;
  rows: { name: string; value: string; color?: string }[];
}) {
  if (!active || !rows.length) return null;
  return (
    <div className={styles.tooltip}>
      {label != null && <div className={styles.tooltipLabel}>{label}</div>}
      {rows.map((r) => (
        <div key={r.name} className={styles.tooltipRow}>
          {r.color && (
            <span
              className={styles.tooltipSwatch}
              style={{ background: r.color }}
              aria-hidden="true"
            />
          )}
          <span className={styles.tooltipName}>{r.name}</span>
          <span className={styles.tooltipValue}>{r.value}</span>
        </div>
      ))}
    </div>
  );
}

/** Légende partagée — l'identité ne repose jamais sur la seule couleur. */
export function ChartLegend({
  items,
}: {
  items: { label: string; color: string; value?: string }[];
}) {
  return (
    <ul className={styles.legend}>
      {items.map((it) => (
        <li key={it.label} className={styles.legendItem}>
          <span
            className={styles.legendSwatch}
            style={{ background: it.color }}
            aria-hidden="true"
          />
          <span className={styles.legendLabel}>{it.label}</span>
          {it.value && <span className={styles.legendValue}>{it.value}</span>}
        </li>
      ))}
    </ul>
  );
}
