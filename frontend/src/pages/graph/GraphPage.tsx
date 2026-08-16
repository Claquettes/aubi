import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Locate,
  Maximize2,
  Minimize2,
  Minus,
  Plus,
  Search,
  X,
} from 'lucide-react';
import { graphApi } from '@/api/graph';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/layout/EmptyState';
import { Spinner } from '@/components/primitives/Spinner';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useT } from '@/i18n';
import { GraphCanvas } from './GraphCanvas';
import type { GraphCanvasHandle } from './GraphCanvas';
import { buildGraphLayout } from './graphLayout';
import styles from './GraphPage.module.css';

export function GraphPage() {
  const t = useT();
  const { data, isLoading, isError } = useQuery({
    queryKey: ['graph'],
    queryFn: () => graphApi.collaborations(),
    staleTime: 5 * 60 * 1000,
  });
  const navigate = useNavigate();
  const dense = useMediaQuery('(max-width: 760px)');

  const canvasRef = useRef<GraphCanvasHandle>(null);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<number | null>(null);
  const [expanded, setExpanded] = useState(false);

  // La planche épouse le format réel de la zone de dessin (portrait sur
  // téléphone, paysage sur ordinateur) : aucun bord perdu, donc plus de zoom.
  const [stageEl, setStageEl] = useState<HTMLDivElement | null>(null);
  const [aspect, setAspect] = useState<number | null>(null);
  useEffect(() => {
    if (!stageEl) return;
    const measure = () => {
      const r = stageEl.getBoundingClientRect();
      if (r.width < 40 || r.height < 40) return;
      const next = Math.round(Math.min(3, Math.max(0.4, r.width / r.height)) * 4) / 4;
      setAspect((prev) => (prev === next ? prev : next));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(stageEl);
    window.addEventListener('resize', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [stageEl]);

  const layout = useMemo(
    () => buildGraphLayout(data, aspect ?? (dense ? 0.62 : 1.8)),
    [data, aspect, dense],
  );

  const q = query.trim().toLowerCase();
  const matches = useMemo(() => {
    if (!layout || !q) return null;
    const found: number[] = [];
    for (let i = 0; i < layout.nodes.length; i++) {
      if (layout.nodes[i].name.toLowerCase().includes(q)) found.push(i);
    }
    found.sort((a, b) => {
      const na = layout.nodes[a].name.toLowerCase();
      const nb = layout.nodes[b].name.toLowerCase();
      const sa = na.startsWith(q) ? 0 : 1;
      const sb = nb.startsWith(q) ? 0 : 1;
      return sa - sb || na.length - nb.length;
    });
    return found;
  }, [layout, q]);

  const matchedSet = useMemo(
    () => (matches ? new Set(matches) : null),
    [matches],
  );

  /* Une seule correspondance : on va directement dessus. */
  useEffect(() => {
    if (matches && matches.length === 1) {
      setSelected(matches[0]);
      canvasRef.current?.focus(matches[0]);
    }
  }, [matches]);

  useEffect(() => {
    setSelected(null);
  }, [data]);

  useEffect(() => {
    if (!expanded) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [expanded]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (expanded) setExpanded(false);
      else if (selected !== null) setSelected(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [expanded, selected]);

  const node = layout && selected !== null ? layout.nodes[selected] : null;

  /** Collaborateurs du nœud sélectionné, les plus fournis d'abord. */
  const collaborators = useMemo(() => {
    if (!layout || selected === null) return [];
    const list: { index: number; weight: number }[] = [];
    for (const e of layout.edges) {
      if (e.a === selected) list.push({ index: e.b, weight: e.weight });
      else if (e.b === selected) list.push({ index: e.a, weight: e.weight });
    }
    return list.sort((x, y) => y.weight - x.weight).slice(0, 8);
  }, [layout, selected]);

  const focusNode = (index: number) => {
    setSelected(index);
    canvasRef.current?.focus(index);
  };

  if (isLoading) {
    return (
      <div>
        <PageHeader title={t('nav.graph')} />
        <div className={styles.center}>
          <Spinner />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div>
        <PageHeader title={t('nav.graph')} />
        <EmptyState mark="⚠">{t('graph.error')}</EmptyState>
      </div>
    );
  }

  if (!layout || !layout.nodes.length) {
    return (
      <div>
        <PageHeader title={t('nav.graph')} />
        <EmptyState>{t('graph.empty')}</EmptyState>
      </div>
    );
  }

  return (
    <div className={expanded ? styles.expanded : undefined}>
      {!expanded && (
        <>
          <PageHeader title={t('nav.graph')} />
          <p className={styles.hint}>
            {t('graph.hint', {
              artists: layout.nodes.length,
              edges: layout.edges.length,
              clusters: layout.clusterCount,
            })}
          </p>
        </>
      )}

      <div className={styles.controls}>
        <div className={styles.searchBar}>
          <Search size={16} className={styles.searchIcon} aria-hidden="true" />
          <input
            className={styles.searchInput}
            placeholder={t('graph.searchPlaceholder')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && matches?.length) focusNode(matches[0]);
            }}
            aria-label={t('graph.searchAria')}
          />
          {query && (
            <button
              type="button"
              className={styles.searchClear}
              onClick={() => setQuery('')}
              aria-label={t('graph.clearAria')}
            >
              <X size={15} />
            </button>
          )}
        </div>
        {matches && (
          <span className={styles.count}>
            {matches.length === 0
              ? t('graph.noResult')
              : t('count.results', { count: matches.length })}
          </span>
        )}
      </div>

      {matches && matches.length > 1 && (
        <div className={styles.matchRow}>
          {matches.slice(0, 24).map((i) => (
            <button
              key={layout.nodes[i].id}
              type="button"
              className={styles.chip}
              onClick={() => focusNode(i)}
            >
              {layout.nodes[i].name}
            </button>
          ))}
        </div>
      )}

      <div className={styles.stage} ref={setStageEl}>
        <GraphCanvas
          ref={canvasRef}
          layout={layout}
          matched={matchedSet}
          selected={selected}
          dense={dense}
          onSelect={setSelected}
          onOpen={(i) => navigate(`/music/artists/${layout.nodes[i].id}`)}
        />

        <div className={styles.toolbar}>
          <button
            type="button"
            onClick={() => canvasRef.current?.zoomBy(1.3)}
            aria-label={t('graph.zoomIn')}
          >
            <Plus size={18} />
          </button>
          <button
            type="button"
            onClick={() => canvasRef.current?.zoomBy(1 / 1.3)}
            aria-label={t('graph.zoomOut')}
          >
            <Minus size={18} />
          </button>
          <button
            type="button"
            onClick={() => canvasRef.current?.fit()}
            aria-label={t('graph.fit')}
          >
            <Locate size={18} />
          </button>
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-label={
              expanded ? t('graph.exitFullscreen') : t('graph.fullscreen')
            }
          >
            {expanded ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>
        </div>

        {node && (
          <aside className={styles.card}>
            <button
              type="button"
              className={styles.cardClose}
              onClick={() => setSelected(null)}
              aria-label={t('common.close')}
            >
              <X size={15} />
            </button>
            <h2 className={styles.cardTitle}>{node.name}</h2>
            <p className={styles.cardMeta}>
              {t('count.tracks', { count: node.trackCount })} ·{' '}
              {t('count.collaborators', { count: node.degree })}
            </p>
            {collaborators.length > 0 && (
              <div className={styles.cardChips}>
                {collaborators.map((c) => (
                  <button
                    key={layout.nodes[c.index].id}
                    type="button"
                    className={styles.chip}
                    onClick={() => focusNode(c.index)}
                    title={t('count.commonTracks', { count: c.weight })}
                  >
                    {layout.nodes[c.index].name}
                  </button>
                ))}
              </div>
            )}
            <button
              type="button"
              className={styles.cardAction}
              onClick={() => navigate(`/music/artists/${node.id}`)}
            >
              {t('graph.openArtist')}
              <ArrowRight size={15} />
            </button>
          </aside>
        )}
      </div>

      <p className={styles.legend}>
        {dense ? t('graph.legendTouch') : t('graph.legendMouse')}
      </p>
    </div>
  );
}
