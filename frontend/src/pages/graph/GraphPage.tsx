import { useQuery } from '@tanstack/react-query';
import {
  forceCenter,
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
} from 'd3-force';
import type { SimulationLinkDatum, SimulationNodeDatum } from 'd3-force';
import { useEffect, useRef, useState } from 'react';
import type { PointerEvent as RPointerEvent, WheelEvent as RWheelEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Locate, Minus, Plus } from 'lucide-react';
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
interface SimNode extends SimulationNodeDatum {
  id: string;
  name: string;
  trackCount: number;
}
interface SimLink extends SimulationLinkDatum<SimNode> {
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
  const fit = useRef({ x: 0, y: 0, k: 1 });

  useEffect(() => {
    if (!data || !data.nodes.length) {
      setNodes([]);
      setLinks([]);
      return;
    }
    const ns: SimNode[] = data.nodes.map((n) => ({
      ...n,
      x: (Math.random() - 0.5) * 400,
      y: (Math.random() - 0.5) * 400,
    }));
    const ls: SimLink[] = data.edges.map((e) => ({
      source: e.source,
      target: e.target,
      weight: e.weight,
    }));
    const sim = forceSimulation<SimNode>(ns)
      .force(
        'link',
        forceLink<SimNode, SimLink>(ls)
          .id((d) => d.id)
          .distance((l) => 100 - Math.min(l.weight, 8) * 6)
          .strength(0.6),
      )
      .force('charge', forceManyBody<SimNode>().strength(-280))
      .force('center', forceCenter<SimNode>(0, 0))
      .force(
        'collide',
        forceCollide<SimNode>().radius((d) => radius(d.trackCount) + 10),
      )
      .stop();
    for (let i = 0; i < 320; i++) sim.tick();

    const byId = new Map(ns.map((n) => [n.id, n]));
    setNodes(
      ns.map((n) => ({
        id: n.id,
        name: n.name,
        trackCount: n.trackCount,
        x: n.x ?? 0,
        y: n.y ?? 0,
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
    // Ajuste la vue à l'étendue réelle des nœuds (sinon ils débordent du viewBox).
    const xs = ns.map((n) => n.x ?? 0);
    const ys = ns.map((n) => n.y ?? 0);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const k = Math.min(
      820 / Math.max(maxX - minX, 1),
      560 / Math.max(maxY - minY, 1),
      1.4,
    );
    fit.current = {
      x: -((minX + maxX) / 2) * k,
      y: -((minY + maxY) / 2) * k,
      k,
    };
    setT(fit.current);
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
  const zoomBy = (f: number) =>
    setT((p) => ({ ...p, k: Math.max(0.3, Math.min(4, p.k * f)) }));
  const recenter = () => setT(fit.current);

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
        <div className={styles.toolbar}>
          <button type="button" onClick={() => zoomBy(1.25)} aria-label="Zoomer">
            <Plus size={18} />
          </button>
          <button type="button" onClick={() => zoomBy(0.8)} aria-label="Dézoomer">
            <Minus size={18} />
          </button>
          <button type="button" onClick={recenter} aria-label="Recentrer la vue">
            <Locate size={18} />
          </button>
        </div>
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
