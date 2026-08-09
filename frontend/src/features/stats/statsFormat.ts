/** Formateurs partagés par tous les blocs de la page Statistiques. */

const nf = new Intl.NumberFormat('fr-FR');

export const int = (n: number) => nf.format(Math.round(n));

export const hours = (ms: number) => Math.round(ms / 3_600_000);

export const minutes = (ms: number) => Math.round(ms / 60_000);

/** « 3 h 24 » / « 47 min » / « 38 s » — la précision suit l'ordre de grandeur. */
export function duration(ms: number): string {
  if (!ms) return '0 min';
  const totalMin = Math.round(ms / 60_000);
  if (totalMin < 1) return `${Math.round(ms / 1000)} s`;
  if (totalMin < 60) return `${totalMin} min`;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h < 48) return m ? `${h} h ${String(m).padStart(2, '0')}` : `${h} h`;
  const d = Math.floor(h / 24);
  return h % 24 ? `${d} j ${h % 24} h` : `${d} j`;
}

export function bytes(n: number): string {
  if (!n) return '0 o';
  const units = ['o', 'Ko', 'Mo', 'Go', 'To'];
  const i = Math.min(units.length - 1, Math.floor(Math.log(n) / Math.log(1024)));
  const v = n / 1024 ** i;
  return `${v.toFixed(v < 10 && i > 0 ? 1 : 0).replace('.', ',')} ${units[i]}`;
}

/** « 0 % » pour une valeur non nulle serait un mensonge : on plancher à « < 1 % ». */
export function percent(ratio: number, digits = 0): string {
  const v = ratio * 100;
  const rounded = Number(v.toFixed(digits));
  if (v > 0 && rounded === 0) return `< ${(10 ** -digits).toString().replace('.', ',')} %`;
  return `${v.toFixed(digits).replace('.', ',')} %`;
}

export const plural = (n: number) => (n > 1 ? 's' : '');

const MONTHS = [
  'janv.',
  'févr.',
  'mars',
  'avr.',
  'mai',
  'juin',
  'juil.',
  'août',
  'sept.',
  'oct.',
  'nov.',
  'déc.',
];

/** « 2026-08 » → « août 26 ». */
export function monthLabel(key: string, withYear = true): string {
  const [y, m] = key.split('-');
  const name = MONTHS[Number(m) - 1] ?? m;
  return withYear ? `${name} ${y.slice(2)}` : name;
}

/** « 2026-08-15 » → « 15 août 2026 ». */
export function dayLabel(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${Number(d)} ${MONTHS[Number(m) - 1] ?? m} ${y}`;
}

export const WEEKDAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

export const SECTION_LABELS: Record<string, string> = {
  music: 'Musique',
  concert: 'Concerts',
  audiobook: 'Livres audio',
};

export const sectionLabel = (s: string) => SECTION_LABELS[s] ?? s;

export function timeLabel(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('fr-FR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** « il y a 3 h » — pour les écoutes récentes. */
export function relative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.round(diff / 60_000);
  if (min < 1) return "à l'instant";
  if (min < 60) return `il y a ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `il y a ${h} h`;
  const d = Math.round(h / 24);
  if (d < 30) return `il y a ${d} j`;
  return timeLabel(iso);
}
