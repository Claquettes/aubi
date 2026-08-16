/**
 * Formateurs partagés par tous les blocs de la page Statistiques.
 *
 * Ce sont des fonctions simples (pas des hooks) : elles lisent la langue
 * courante via `getLang()`. Les composants qui les appellent se re-rendent
 * déjà au changement de langue (ils descendent d'un `useT()`), donc les
 * libellés suivent.
 */
import { getLang, localeTag, t, type Lang } from '@/i18n';

const NUMBER_FORMATS: Partial<Record<Lang, Intl.NumberFormat>> = {};

function nf() {
  const lang = getLang();
  return (NUMBER_FORMATS[lang] ??= new Intl.NumberFormat(localeTag()));
}

export const int = (n: number) => nf().format(Math.round(n));

export const hours = (ms: number) => Math.round(ms / 3_600_000);

export const minutes = (ms: number) => Math.round(ms / 60_000);

/** « 3 h 24 » / « 47 min » / « 38 s » — la précision suit l'ordre de grandeur. */
export function duration(ms: number): string {
  const en = getLang() === 'en';
  if (!ms) return '0 min';
  const totalMin = Math.round(ms / 60_000);
  if (totalMin < 1) {
    const s = Math.round(ms / 1000);
    return en ? `${s}s` : `${s} s`;
  }
  if (totalMin < 60) return `${totalMin} min`;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h < 48) {
    const mm = String(m).padStart(2, '0');
    if (en) return m ? `${h}h ${mm}` : `${h}h`;
    return m ? `${h} h ${mm}` : `${h} h`;
  }
  const d = Math.floor(h / 24);
  const rest = h % 24;
  if (en) return rest ? `${d}d ${rest}h` : `${d}d`;
  return rest ? `${d} j ${rest} h` : `${d} j`;
}

const BYTE_UNITS: Record<Lang, string[]> = {
  fr: ['o', 'Ko', 'Mo', 'Go', 'To'],
  en: ['B', 'KB', 'MB', 'GB', 'TB'],
};

export function bytes(n: number): string {
  const lang = getLang();
  const units = BYTE_UNITS[lang];
  if (!n) return `0 ${units[0]}`;
  const i = Math.min(units.length - 1, Math.floor(Math.log(n) / Math.log(1024)));
  const v = n / 1024 ** i;
  const s = v.toFixed(v < 10 && i > 0 ? 1 : 0);
  return `${lang === 'fr' ? s.replace('.', ',') : s} ${units[i]}`;
}

/** « 0 % » pour une valeur non nulle serait un mensonge : on plancher à « < 1 % ». */
export function percent(ratio: number, digits = 0): string {
  const fr = getLang() === 'fr';
  const sep = fr ? ' ' : '';
  const dec = (s: string) => (fr ? s.replace('.', ',') : s);
  const v = ratio * 100;
  const rounded = Number(v.toFixed(digits));
  if (v > 0 && rounded === 0) {
    return `< ${dec((10 ** -digits).toString())}${sep}%`;
  }
  return `${dec(v.toFixed(digits))}${sep}%`;
}

export const plural = (n: number) => (n > 1 ? 's' : '');

/** Graduation d'axe horaire : « 15h » en français, « 15:00 » en anglais. */
export const hourTick = (h: number) =>
  getLang() === 'en' ? `${h}:00` : `${h}h`;

const MONTHS: Record<Lang, string[]> = {
  fr: [
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
  ],
  en: [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ],
};

/** Noms de mois longs, pour l'en-tête du calendrier. */
export const MONTH_NAMES: Record<Lang, string[]> = {
  fr: [
    'Janv.',
    'Févr.',
    'Mars',
    'Avr.',
    'Mai',
    'Juin',
    'Juil.',
    'Août',
    'Sept.',
    'Oct.',
    'Nov.',
    'Déc.',
  ],
  en: MONTHS.en,
};

export const monthNames = () => MONTH_NAMES[getLang()];

export const monthInitials = () =>
  MONTHS[getLang()].map((m) => m[0].toUpperCase());

/** « 2026-08 » → « août 26 ». */
export function monthLabel(key: string, withYear = true): string {
  const [y, m] = key.split('-');
  const name = MONTHS[getLang()][Number(m) - 1] ?? m;
  return withYear ? `${name} ${y.slice(2)}` : name;
}

/** « 2026-08-15 » → « 15 août 2026 ». */
export function dayLabel(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${Number(d)} ${MONTHS[getLang()][Number(m) - 1] ?? m} ${y}`;
}

const WEEKDAY_NAMES: Record<Lang, string[]> = {
  fr: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
  en: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
};

/** Lundi → dimanche, dans la langue courante. */
export const weekdays = () => WEEKDAY_NAMES[getLang()];

export const sectionLabel = (s: string) => {
  if (s === 'music' || s === 'concert' || s === 'audiobook') {
    return t(`section.${s}`);
  }
  return s;
};

export function timeLabel(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString(localeTag(), {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** « il y a 3 h » — pour les écoutes récentes. */
export function relative(iso: string): string {
  const en = getLang() === 'en';
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.round(diff / 60_000);
  if (min < 1) return en ? 'just now' : "à l'instant";
  if (min < 60) return en ? `${min} min ago` : `il y a ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return en ? `${h} h ago` : `il y a ${h} h`;
  const d = Math.round(h / 24);
  if (d < 30) return en ? `${d} d ago` : `il y a ${d} j`;
  return timeLabel(iso);
}
