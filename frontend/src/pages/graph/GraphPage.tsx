import { useQuery } from '@tanstack/react-query';
import {
  forceCenter,
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
} from 'd3-force';
import { useEffect, useRef, useState } from 'react';
import type { PointerEvent as RPointerEvent, WheelEvent as RWheelEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { graphApi } from '@/api/graph';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/layout/EmptyState';
import { Spinner } from '@/components/primitives/Spinner';
import styles from './GraphPage.module.css';

interface N {
  id: string;
  name: string;
  trackCount: number;
  x: number;
  y: number;
}
interface L {
  s: N;
  t: N;
  weight: number;
}

function radius(tc: number) {
  return 5 + Math.sqrt(tc) * 2.2;
}

export function GraphPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['graph'],
    queryFn: () => graphApi.collaborations(),
  });
  const navigate = useNavigate();
  const [nodes, setNodes] = useState<N[]>([]);
  const [links, setLinks] = useState<L[]>([]);
  const [t, setT] = useState({ x: 0, y: 0, k: 1 });
  const [hover, setHover] = useState<string | null>(null);
  const pan = useRef<{ px: number; py: number; ox: number; oy: number } | null>(
    null,
  );

  useEffect(() => {
    if (!data || !data.nodes.length) {
      setNodes([]);
      setLinks([]);
      return;
    }
    const ns = data.nodes.map((n) => ({
      ...n,
      x: (Math.random() - 0.5) * 400,
      y: (Math.random() - 0.5) * 400,
    }));
    const ls = data.edges.map((e) => ({
      source: e.source,
      target: e.target,
      weight: e.weight,
    }));
    const sim = forceSimulation(ns as never[])
      .force(
        'link',
        forceLink(ls as never[])
          .id((d: never) => (d as N).id)
          .distance((l: never) => 100 - Math.min((l as L).weight, 8) * 6)
          .strength(0.6),
      )
      .force('charge', forceManyBody().strength(-280))
      .force('center', forceCenter(0, 0))
      .force(
        'collide',
        forceCollide().radius((d: never) => radius((d as N).trackCount) + 10),
      )
      .stop();
    for (let i = 0; i < 320; i++) sim.tick();

    const byId = new Map(ns.map((n) => [n.id, n]));
    setNodes(
      ns.map((n) => ({
        id: n.id,
        name: n.name,
        trackCount: n.trackCount,
        x: n.x,
        y: n.y,
      })),
    );
    setLinks(
      ls
        .map((l) => {
          const src = l.source as unknown as { id?: string } | string;
          const tgt = l.target as unknown as { id?: string } | string;
          const sid = typeof src === 'object' ? src.id! : src;
          const tid = typeof tgt === 'object' ? tgt.id! : tgt;
          return { s: byId.get(sid), t: byId.get(tid), weight: l.weight };
        })
        .filter((l): l is L => !!l.s && !!l.t),
    );
    setT({ x: 0, y: 0, k: 1 });
  }, [data]);

  if (isLoading)
    return (
      <div>
        <PageHeader title="Graphe" />
        <Spinner />
      </div>
    );
  if (!data || !data.nodes.length)
    return (
      <div>
        <PageHeader title="Graphe" />
        <EmptyState>
          Pas encore de collaborations à visualiser. Le graphe relie les
          artistes qui partagent un titre.
        </EmptyState>
      </div>
    );

  const onWheel = (e: RWheelEvent) => {
    const factor = e.deltaY < 0 ? 1.12 : 0.89;
    setT((p) => ({ ...p, k: Math.max(0.3, Math.min(4, p.k * factor)) }));
  };
  const onDown = (e: RPointerEvent) => {
    pan.current = { px: e.clientX, py: e.clientY, ox: t.x, oy: t.y };
  };
  const onMove = (e: RPointerEvent) => {
    if (!pan.current) return;
    setT((p) => ({
      ...p,
      x: pan.current!.ox + (e.clientX - pan.current!.px),
      y: pan.current!.oy + (e.clientY - pan.current!.py),
    }));
  };
  const onUp = () => {
    pan.current = null;
  };

  return (
    <div>
      <PageHeader title="Graphe" />
      <p className={styles.hint}>
        Chaque point est un artiste (taille = nombre de titres), chaque trait une
        collaboration. Touche un point pour l'ouvrir · glisse pour déplacer ·
        molette pour zoomer.
      </p>
      <div
        className={styles.canvas}
        onWheel={onWheel}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerLeave={onUp}
      >
        <svg
          className={styles.svg}
          viewBox="-450 -320 900 640"
          preserveAspectRatio="xMidYMid meet"
        >
          <g transform={`translate(${t.x} ${t.y}) scale(${t.k})`}>
            {links.map((l, i) => (
              <line
                key={i}
                x1={l.s.x}
                y1={l.s.y}
                x2={l.t.x}
                y2={l.t.y}
                className={styles.edge}
                style={{
                  strokeWidth: Math.min(1 + l.weight * 0.4, 4),
                  opacity: hover
                    ? l.s.id === hover || l.t.id === hover
                      ? 0.9
                      : 0.08
                    : 0.32,
                }}
              />
            ))}
            {nodes.map((n) => {
              const r = radius(n.trackCount);
              const active = hover === n.id;
              return (
                <g
                  key={n.id}
                  transform={`translate(${n.x} ${n.y})`}
                  className={styles.node}
                  onClick={() => navigate(`/music/artists/${n.id}`)}
                  onPointerEnter={() => setHover(n.id)}
                  onPointerLeave={() => setHover(null)}
                >
                  <circle
                    r={r}
                    className={styles.dot}
                    style={{ opacity: hover && !active ? 0.35 : 1 }}
                  />
                  <text
                    y={r + 12}
                    className={styles.label}
                    style={{ opacity: active || t.k > 1.3 ? 1 : 0.7 }}
                  >
                    {n.name.length > 18 ? `${n.name.slice(0, 17)}…` : n.name}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>
      </div>
    </div>
  );
}
