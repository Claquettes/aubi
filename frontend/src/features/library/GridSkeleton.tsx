import { Grid } from '@/components/layout/Grid';
import { Skeleton } from '@/components/primitives/Skeleton';

export function GridSkeleton({
  count = 12,
  round = false,
}: {
  count?: number;
  round?: boolean;
}) {
  return (
    <Grid>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-2)',
          }}
        >
          <Skeleton
            style={{
              aspectRatio: '1 / 1',
              width: '100%',
              borderRadius: round ? '50%' : 'var(--radius-base)',
            }}
          />
          <Skeleton style={{ height: 12, width: '80%' }} />
          <Skeleton style={{ height: 10, width: '55%' }} />
        </div>
      ))}
    </Grid>
  );
}
