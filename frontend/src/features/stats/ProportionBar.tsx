import { CHART_COLORS, ChartLegend, HEAT_COLORS } from './chartTheme';
import { int, percent } from './statsFormat';
import styles from './stats.module.css';

export interface Slice {
  label: string;
  value: number;
  hint?: string;
}

/**
 * Barre de répartition 100 %. `ordinal` bascule sur la rampe une teinte :
 * des paliers ordonnés (débit, tranche) doivent se lire dans la couleur,
 * des catégories nominales (formats) prennent les teintes catégorielles.
 */
export function ProportionBar({
  slices,
  ordinal = false,
  unit = 'titres',
}: {
  slices: Slice[];
  ordinal?: boolean;
  unit?: string;
}) {
  const items = slices.filter((s) => s.value > 0);
  const total = items.reduce((a, b) => a + b.value, 0);
  if (!total) return null;
  const palette = ordinal ? HEAT_COLORS : CHART_COLORS;
  const colored = items.map((s, i) => ({
    ...s,
    color: palette[Math.min(i, palette.length - 1)],
  }));

  return (
    <div>
      <div className={styles.propBar}>
        {colored.map((s) => (
          <div
            key={s.label}
            className={styles.propSeg}
            style={{
              width: `${(s.value / total) * 100}%`,
              background: s.color,
            }}
            title={`${s.label} — ${int(s.value)} ${unit} (${percent(
              s.value / total,
              1,
            )})`}
          />
        ))}
      </div>
      <ChartLegend
        items={colored.map((s) => ({
          label: s.label,
          color: s.color,
          value: s.hint ?? `${percent(s.value / total)} · ${int(s.value)}`,
        }))}
      />
    </div>
  );
}
