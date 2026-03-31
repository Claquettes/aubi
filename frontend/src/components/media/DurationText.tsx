export function DurationText({ ms }: { ms: number }) {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) {
    return (
      <span>
        {h}:{String(m).padStart(2, '0')}:{String(sec).padStart(2, '0')}
      </span>
    );
  }
  return (
    <span>
      {m}:{String(sec).padStart(2, '0')}
    </span>
  );
}
