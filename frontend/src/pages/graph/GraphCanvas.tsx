import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
} from 'react';
import type { PointerEvent as RPointerEvent } from 'react';
import type { GraphLayout } from './graphLayout';
import styles from './GraphPage.module.css';

/* -------------------------------------------------------------------------- */
/*  Rendu <canvas> du graphe.                                                  */
/*                                                                            */
/*  Tout est dessiné à la main plutôt qu'en SVG : la version précédente        */
/*  re-rendait 100 <g> React à chaque pixel de déplacement (avec transitions   */
/*  CSS sur chacun), ce qui figeait le téléphone. Ici la vue vit dans une ref  */
/*  et un seul rAF redessine — React ne rerend jamais pendant un geste.        */
/*                                                                            */
/*  Lisibilité : les étiquettes sont dessinées en pixels ÉCRAN (taille         */
/*  constante quel que soit le zoom) et un algo anti-chevauchement n'affiche   */
/*  que celles qui tiennent, les plus importantes d'abord.                     */
/* -------------------------------------------------------------------------- */

const TAU = Math.PI * 2;
const FONT_STACK =
  "'Instrument Sans Variable', Inter, ui-sans-serif, system-ui, sans-serif";
const MAX_ZOOM = 5;

export interface GraphCanvasHandle {
  zoomBy: (factor: number) => void;
  fit: () => void;
  focus: (index: number) => void;
}

interface Palette {
  node: string;
  nodeStrong: string;
  edge: string;
  label: string;
  labelSoft: string;
  halo: string;
  panel: string;
  hairline: string;
}

interface Props {
  layout: GraphLayout;
  /** Index des nœuds correspondant à la recherche, ou `null` si pas de recherche. */
  matched: Set<number> | null;
  selected: number | null;
  onSelect: (index: number | null) => void;
  onOpen: (index: number) => void;
  /** Écran étroit / tactile : cibles plus grosses, moins d'étiquettes. */
  dense: boolean;
}

interface View {
  k: number;
  tx: number;
  ty: number;
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function readPalette(host: HTMLElement): Palette {
  const probe = document.createElement('span');
  probe.style.cssText =
    'position:absolute;width:0;height:0;opacity:0;pointer-events:none';
  host.appendChild(probe);
  const read = (expr: string, fallback: string) => {
    probe.style.color = '';
    probe.style.color = expr;
    const value = getComputedStyle(probe).color;
    return value && value !== 'rgba(0, 0, 0, 0)' ? value : fallback;
  };
  const palette: Palette = {
    node: read('var(--art-action, var(--color-accent))', '#c6a0f6'),
    nodeStrong: read(
      'var(--art-secondary, var(--color-accent-secondary))',
      '#eed49f',
    ),
    edge: read('var(--color-ink-muted)', '#9995aa'),
    label: read('var(--color-ink)', '#f4ede4'),
    labelSoft: read('var(--color-ink-soft)', '#cbc5ce'),
    halo: read('var(--color-paper)', '#1e2030'),
    panel: read('var(--color-paper-high)', '#2b2e43'),
    hairline: read('var(--color-hairline-strong)', '#5b6078'),
  };
  probe.remove();
  return palette;
}

function truncate(name: string, max: number) {
  return name.length > max ? `${name.slice(0, max - 1)}…` : name;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export const GraphCanvas = forwardRef<GraphCanvasHandle, Props>(
  function GraphCanvas(props, ref) {
    const wrapRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const propsRef = useRef(props);
    propsRef.current = props;

    const sizeRef = useRef({ w: 0, h: 0, dpr: 1 });
    const viewRef = useRef<View>({ k: 1, tx: 0, ty: 0 });
    const fitKRef = useRef(1);
    const autoFitRef = useRef(true);
    const hoverRef = useRef<number | null>(null);
    const paletteRef = useRef<Palette | null>(null);
    const rafRef = useRef<number | null>(null);
    const animRef = useRef<number | null>(null);
    const pointersRef = useRef(new Map<number, { x: number; y: number }>());
    const gestureRef = useRef<{
      startX: number;
      startY: number;
      lastX: number;
      lastY: number;
      startTime: number;
      moved: boolean;
      pinchDist: number;
    } | null>(null);
    const lastTapRef = useRef<{ index: number; time: number } | null>(null);

    /* ----------------------------- dessin ---------------------------------- */

    const draw = useCallback(() => {
      rafRef.current = null;
      const canvas = canvasRef.current;
      const wrap = wrapRef.current;
      if (!canvas || !wrap) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      if (!paletteRef.current) paletteRef.current = readPalette(wrap);
      const pal = paletteRef.current;

      const { w, h, dpr } = sizeRef.current;
      if (w <= 0 || h <= 0) return;
      const { k, tx, ty } = viewRef.current;
      const { layout, matched, selected, dense } = propsRef.current;
      const nodes = layout.nodes;

      const focus = hoverRef.current ?? selected;
      const near =
        focus !== null && nodes[focus]
          ? new Set(nodes[focus].neighbors)
          : null;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      const sx = (x: number) => x * k + tx;
      const sy = (y: number) => y * k + ty;
      const edgeScale = clamp(k, 0.5, 1.4);

      /* ── liens ── */
      const strongEdges: number[] = [];
      for (let i = 0; i < layout.edges.length; i++) {
        const e = layout.edges[i];
        const A = nodes[e.a];
        const B = nodes[e.b];
        const x1 = sx(A.x);
        const y1 = sy(A.y);
        const x2 = sx(B.x);
        const y2 = sy(B.y);
        if (
          Math.max(x1, x2) < -60 ||
          Math.min(x1, x2) > w + 60 ||
          Math.max(y1, y2) < -60 ||
          Math.min(y1, y2) > h + 60
        )
          continue;

        let alpha: number;
        if (matched) {
          const hit = matched.has(e.a) || matched.has(e.b);
          if (hit) {
            strongEdges.push(i);
            continue;
          }
          alpha = 0.05;
        } else if (focus !== null) {
          if (e.a === focus || e.b === focus) {
            strongEdges.push(i);
            continue;
          }
          alpha = 0.06;
        } else {
          alpha = 0.3;
        }

        ctx.globalAlpha = alpha;
        ctx.strokeStyle = pal.edge;
        ctx.lineWidth = Math.min(1 + e.weight * 0.4, 4.5) * edgeScale;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }

      for (const i of strongEdges) {
        const e = layout.edges[i];
        ctx.globalAlpha = 0.9;
        ctx.strokeStyle = pal.nodeStrong;
        ctx.lineWidth = Math.min(1.6 + e.weight * 0.5, 6) * edgeScale;
        ctx.beginPath();
        ctx.moveTo(sx(nodes[e.a].x), sy(nodes[e.a].y));
        ctx.lineTo(sx(nodes[e.b].x), sy(nodes[e.b].y));
        ctx.stroke();
      }

      /* ── nœuds ── */
      const minR = dense ? 3.4 : 2.8;
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        const x = sx(n.x);
        const y = sy(n.y);
        const r = clamp(n.r * k, minR, 48);
        if (x < -r - 4 || x > w + r + 4 || y < -r - 4 || y > h + r + 4) continue;

        const isFocus = i === focus;
        const isMatch = matched?.has(i) ?? false;
        const lit = matched
          ? isMatch
          : focus === null || isFocus || (near?.has(i) ?? false);

        ctx.globalAlpha = lit ? 1 : 0.13;
        ctx.fillStyle = isFocus ? pal.nodeStrong : pal.node;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, TAU);
        ctx.fill();

        // Liseré couleur papier : les disques restent distincts dans les amas.
        if (r > 4) {
          ctx.strokeStyle = pal.halo;
          ctx.lineWidth = 1.4;
          ctx.stroke();
        }

        if (isFocus || isMatch || i === selected) {
          ctx.globalAlpha = 1;
          ctx.strokeStyle = pal.nodeStrong;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(x, y, r + 4.5, 0, TAU);
          ctx.stroke();
        }
      }

      /* ── étiquettes (taille écran constante + anti-chevauchement) ── */
      const fs = dense ? 12 : 12.5;
      ctx.font = `600 ${fs}px ${FONT_STACK}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';

      const candidates: number[] = [];
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        const x = sx(n.x);
        const y = sy(n.y);
        if (x < -80 || x > w + 80 || y < -40 || y > h + 40) continue;
        if (matched && !matched.has(i)) continue;
        if (!matched && focus !== null && i !== focus && !(near?.has(i) ?? false))
          continue;
        candidates.push(i);
      }
      const priority = (i: number) =>
        (i === focus ? 1e6 : 0) +
        (near?.has(i) ? 5e5 : 0) +
        (matched?.has(i) ? 4e5 : 0) +
        nodes[i].score;
      candidates.sort((a, b) => priority(b) - priority(a));

      // Les disques visibles sont des obstacles : un nom ne recouvre jamais un point.
      const obstacles: number[][] = [];
      for (const i of candidates) {
        const n = nodes[i];
        const x = sx(n.x);
        const y = sy(n.y);
        const r = clamp(n.r * k, minR, 48) + 2;
        obstacles.push([x - r, y - r, x + r, y + r]);
      }

      // Dézoomé, on raccourcit les noms : plus d'artistes gardent une étiquette.
      const maxChars = Math.round(clamp(9 + k * 13, 9, dense ? 15 : 22));
      const maxLabels = dense ? 42 : 120;
      const placed: number[][] = [];
      const free = (box: number[], skip: number) => {
        // Une étiquette qui dépasse du cadre serait coupée : on la refuse.
        if (box[0] < 2 || box[2] > w - 2 || box[1] < 2 || box[3] > h - 2)
          return false;
        for (const p of placed) {
          if (box[0] < p[2] && box[2] > p[0] && box[1] < p[3] && box[3] > p[1])
            return false;
        }
        for (let j = 0; j < obstacles.length; j++) {
          if (j === skip) continue;
          const p = obstacles[j];
          if (box[0] < p[2] && box[2] > p[0] && box[1] < p[3] && box[3] > p[1])
            return false;
        }
        return true;
      };

      let drawn = 0;
      for (let c = 0; c < candidates.length; c++) {
        if (drawn >= maxLabels) break;
        const i = candidates[c];
        const n = nodes[i];
        const x = sx(n.x);
        const y = sy(n.y);
        const r = clamp(n.r * k, minR, 48);
        const text = truncate(n.name, maxChars);
        const tw = ctx.measureText(text).width;
        const h = fs + 4;

        // Dessous, dessus, à droite, à gauche : le premier emplacement libre gagne.
        const spots: { box: number[]; tx: number; ty: number; align: CanvasTextAlign }[] =
          [
            {
              box: [x - tw / 2 - 3, y + r + 3, x + tw / 2 + 3, y + r + 3 + h],
              tx: x,
              ty: y + r + 4,
              align: 'center',
            },
            {
              box: [x - tw / 2 - 3, y - r - 3 - h, x + tw / 2 + 3, y - r - 3],
              tx: x,
              ty: y - r - 3 - h + 1,
              align: 'center',
            },
            {
              box: [x + r + 4, y - h / 2, x + r + 8 + tw, y + h / 2],
              tx: x + r + 6,
              ty: y - fs / 2,
              align: 'left',
            },
            {
              box: [x - r - 8 - tw, y - h / 2, x - r - 4, y + h / 2],
              tx: x - r - 6,
              ty: y - fs / 2,
              align: 'right',
            },
          ];

        const spot = spots.find((s) => free(s.box, c));
        if (!spot) continue;
        placed.push(spot.box);
        drawn++;

        ctx.globalAlpha = 1;
        ctx.textAlign = spot.align;
        ctx.lineWidth = 3.5;
        ctx.strokeStyle = pal.halo;
        ctx.strokeText(text, spot.tx, spot.ty);
        ctx.fillStyle =
          i === focus || (matched?.has(i) ?? false) ? pal.label : pal.labelSoft;
        ctx.fillText(text, spot.tx, spot.ty);
      }

      /* ── infobulle de survol (souris) ── */
      const hovered = hoverRef.current;
      if (hovered !== null && !dense && nodes[hovered]) {
        const n = nodes[hovered];
        const lines = [
          n.name,
          `${n.trackCount} titre${n.trackCount > 1 ? 's' : ''} · ${n.degree} collaborateur${n.degree > 1 ? 's' : ''}`,
        ];
        ctx.font = `600 13px ${FONT_STACK}`;
        const w1 = ctx.measureText(lines[0]).width;
        ctx.font = `400 12px ${FONT_STACK}`;
        const w2 = ctx.measureText(lines[1]).width;
        const boxW = Math.max(w1, w2) + 22;
        const boxH = 48;
        let bx = sx(n.x) + 16;
        let by = sy(n.y) - boxH - 14;
        if (bx + boxW > w - 8) bx = sx(n.x) - boxW - 16;
        if (by < 8) by = sy(n.y) + 20;
        bx = clamp(bx, 8, Math.max(8, w - boxW - 8));
        by = clamp(by, 8, Math.max(8, h - boxH - 8));

        ctx.globalAlpha = 0.97;
        ctx.fillStyle = pal.panel;
        roundRect(ctx, bx, by, boxW, boxH, 10);
        ctx.fill();
        ctx.globalAlpha = 0.6;
        ctx.strokeStyle = pal.hairline;
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.globalAlpha = 1;
        ctx.textAlign = 'left';
        ctx.fillStyle = pal.label;
        ctx.font = `600 13px ${FONT_STACK}`;
        ctx.fillText(lines[0], bx + 11, by + 10);
        ctx.fillStyle = pal.labelSoft;
        ctx.font = `400 12px ${FONT_STACK}`;
        ctx.fillText(lines[1], bx + 11, by + 28);
      }

      ctx.globalAlpha = 1;
    }, []);

    const requestDraw = useCallback(() => {
      // Onglet en arrière-plan : rAF ne se déclenche pas, on dessine tout de suite
      // pour que le canvas soit déjà prêt au retour sur la page.
      if (document.hidden) {
        if (rafRef.current !== null) {
          cancelAnimationFrame(rafRef.current);
          rafRef.current = null;
        }
        draw();
        return;
      }
      if (rafRef.current !== null) return;
      rafRef.current = requestAnimationFrame(draw);
    }, [draw]);

    /* --------------------------- vue & animations --------------------------- */

    const stopAnimation = useCallback(() => {
      if (animRef.current !== null) {
        cancelAnimationFrame(animRef.current);
        animRef.current = null;
      }
    }, []);

    const animateTo = useCallback(
      (target: View, ms = 420) => {
        stopAnimation();
        const from = { ...viewRef.current };
        const start = performance.now();
        const step = (now: number) => {
          const t = Math.min(1, (now - start) / ms);
          const e = 1 - Math.pow(1 - t, 3);
          viewRef.current = {
            k: from.k + (target.k - from.k) * e,
            tx: from.tx + (target.tx - from.tx) * e,
            ty: from.ty + (target.ty - from.ty) * e,
          };
          draw();
          animRef.current = t < 1 ? requestAnimationFrame(step) : null;
        };
        animRef.current = requestAnimationFrame(step);
      },
      [draw, stopAnimation],
    );

    const computeFit = useCallback((): View => {
      const { w, h } = sizeRef.current;
      const { layout, dense } = propsRef.current;
      const b = layout.bounds;
      const pad = dense ? 22 : 44;
      const bw = Math.max(b.maxX - b.minX, 1);
      const bh = Math.max(b.maxY - b.minY, 1);
      const k = clamp(
        Math.min((w - pad * 2) / bw, (h - pad * 2) / bh),
        0.04,
        1.15,
      );
      fitKRef.current = k;
      const cx = (b.minX + b.maxX) / 2;
      const cy = (b.minY + b.maxY) / 2;
      return { k, tx: w / 2 - cx * k, ty: h / 2 - cy * k };
    }, []);

    const minZoom = () => Math.min(0.25, fitKRef.current * 0.7);

    const zoomAt = useCallback(
      (cx: number, cy: number, factor: number) => {
        const v = viewRef.current;
        const k = clamp(v.k * factor, minZoom(), MAX_ZOOM);
        if (k === v.k) return;
        viewRef.current = {
          k,
          tx: cx - (cx - v.tx) * (k / v.k),
          ty: cy - (cy - v.ty) * (k / v.k),
        };
        autoFitRef.current = false;
        requestDraw();
      },
      [requestDraw],
    );

    useImperativeHandle(
      ref,
      () => ({
        zoomBy: (factor: number) => {
          stopAnimation();
          const { w, h } = sizeRef.current;
          zoomAt(w / 2, h / 2, factor);
        },
        fit: () => {
          autoFitRef.current = true;
          animateTo(computeFit());
        },
        focus: (index: number) => {
          const { layout } = propsRef.current;
          const n = layout.nodes[index];
          if (!n) return;
          const { w, h } = sizeRef.current;
          const k = clamp(Math.max(viewRef.current.k, 1), minZoom(), MAX_ZOOM);
          autoFitRef.current = false;
          animateTo({ k, tx: w / 2 - n.x * k, ty: h / 2 - n.y * k });
        },
      }),
      [animateTo, computeFit, stopAnimation, zoomAt],
    );

    /* ------------------------------ dimensions ------------------------------ */

    useEffect(() => {
      const wrap = wrapRef.current;
      const canvas = canvasRef.current;
      if (!wrap || !canvas) return;

      const apply = () => {
        const rect = wrap.getBoundingClientRect();
        const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
        const w = Math.max(1, Math.round(rect.width));
        const h = Math.max(1, Math.round(rect.height));
        if (
          sizeRef.current.w === w &&
          sizeRef.current.h === h &&
          sizeRef.current.dpr === dpr
        )
          return;
        sizeRef.current = { w, h, dpr };
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
        canvas.style.width = `${w}px`;
        canvas.style.height = `${h}px`;
        if (autoFitRef.current) viewRef.current = computeFit();
        else fitKRef.current = computeFit().k;
        requestDraw();
      };

      apply();
      const ro = new ResizeObserver(apply);
      ro.observe(wrap);
      // Filet de sécurité : ResizeObserver n'est notifié qu'au rendu, donc jamais
      // si la page était en arrière-plan au montage.
      window.addEventListener('resize', apply);
      return () => {
        ro.disconnect();
        window.removeEventListener('resize', apply);
      };
    }, [computeFit, requestDraw]);

    /* Nouveau jeu de données → on recadre. */
    useEffect(() => {
      autoFitRef.current = true;
      hoverRef.current = null;
      viewRef.current = computeFit();
      requestDraw();
    }, [props.layout, computeFit, requestDraw]);

    /* Sélection / recherche / densité → simple redessin. */
    useEffect(() => {
      requestDraw();
    }, [props.matched, props.selected, props.dense, requestDraw]);

    /* La palette suit la pochette courante (appTheme écrit sur :root). */
    useEffect(() => {
      const mo = new MutationObserver(() => {
        paletteRef.current = null;
        requestDraw();
      });
      mo.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['style', 'data-theme', 'data-themed'],
      });
      return () => mo.disconnect();
    }, [requestDraw]);

    useEffect(
      () => () => {
        if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
        if (animRef.current !== null) cancelAnimationFrame(animRef.current);
      },
      [],
    );

    /* ----------------------------- interactions ----------------------------- */

    /** setPointerCapture lève une exception si le pointeur n'est plus actif. */
    const capture = (id: number, on: boolean) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      try {
        if (on) canvas.setPointerCapture(id);
        else canvas.releasePointerCapture(id);
      } catch {
        /* pointeur déjà relâché : sans conséquence */
      }
    };

    const localPoint = (e: { clientX: number; clientY: number }) => {
      const rect = canvasRef.current!.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    const hitTest = useCallback((px: number, py: number) => {
      const { layout, dense } = propsRef.current;
      const { k, tx, ty } = viewRef.current;
      const x = (px - tx) / k;
      const y = (py - ty) / k;
      // Tolérance exprimée en pixels écran : la cible reste doigt-compatible.
      const slack = (dense ? 16 : 9) / k;
      let best = -1;
      let bestD = Infinity;
      for (let i = 0; i < layout.nodes.length; i++) {
        const n = layout.nodes[i];
        const dx = x - n.x;
        const dy = y - n.y;
        const d = dx * dx + dy * dy;
        const reach = n.r + slack;
        if (d <= reach * reach && d < bestD) {
          bestD = d;
          best = i;
        }
      }
      return best === -1 ? null : best;
    }, []);

    /* Molette : zoom ancré sous le curseur (listener non-passif). */
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const onWheel = (e: WheelEvent) => {
        e.preventDefault();
        stopAnimation();
        const rect = canvas.getBoundingClientRect();
        const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 400 : 1;
        const factor = Math.exp(-e.deltaY * unit * 0.0016);
        zoomAt(e.clientX - rect.left, e.clientY - rect.top, factor);
      };
      canvas.addEventListener('wheel', onWheel, { passive: false });
      return () => canvas.removeEventListener('wheel', onWheel);
    }, [stopAnimation, zoomAt]);

    const onPointerDown = (e: RPointerEvent<HTMLCanvasElement>) => {
      stopAnimation();
      const p = localPoint(e);
      pointersRef.current.set(e.pointerId, p);
      capture(e.pointerId, true);
      if (pointersRef.current.size === 1) {
        gestureRef.current = {
          startX: p.x,
          startY: p.y,
          lastX: p.x,
          lastY: p.y,
          startTime: performance.now(),
          moved: false,
          pinchDist: 0,
        };
      } else if (pointersRef.current.size === 2 && gestureRef.current) {
        const [a, b] = [...pointersRef.current.values()];
        gestureRef.current.pinchDist = Math.hypot(a.x - b.x, a.y - b.y);
        gestureRef.current.moved = true;
      }
    };

    const onPointerMove = (e: RPointerEvent<HTMLCanvasElement>) => {
      const p = localPoint(e);
      const pointers = pointersRef.current;
      const g = gestureRef.current;

      if (!pointers.has(e.pointerId)) {
        // Simple survol souris.
        if (e.pointerType === 'mouse') {
          const hit = hitTest(p.x, p.y);
          if (hit !== hoverRef.current) {
            hoverRef.current = hit;
            if (canvasRef.current)
              canvasRef.current.style.cursor = hit === null ? 'grab' : 'pointer';
            requestDraw();
          }
        }
        return;
      }

      pointers.set(e.pointerId, p);
      if (!g) return;

      if (pointers.size >= 2) {
        const [a, b] = [...pointers.values()];
        const dist = Math.hypot(a.x - b.x, a.y - b.y);
        const mx = (a.x + b.x) / 2;
        const my = (a.y + b.y) / 2;
        if (g.pinchDist > 0 && dist > 0) {
          zoomAt(mx, my, dist / g.pinchDist);
        }
        g.pinchDist = dist;
        g.moved = true;
        return;
      }

      const dx = p.x - g.lastX;
      const dy = p.y - g.lastY;
      g.lastX = p.x;
      g.lastY = p.y;
      if (Math.hypot(p.x - g.startX, p.y - g.startY) > 5) g.moved = true;
      if (!g.moved) return;

      const v = viewRef.current;
      viewRef.current = { k: v.k, tx: v.tx + dx, ty: v.ty + dy };
      autoFitRef.current = false;
      if (hoverRef.current !== null) hoverRef.current = null;
      requestDraw();
    };

    const endPointer = (e: RPointerEvent<HTMLCanvasElement>) => {
      const pointers = pointersRef.current;
      const had = pointers.delete(e.pointerId);
      capture(e.pointerId, false);
      const g = gestureRef.current;
      if (!had || !g) return;

      if (pointers.size === 0) {
        gestureRef.current = null;
        const quick = performance.now() - g.startTime < 600;
        if (!g.moved && quick) {
          const p = localPoint(e);
          const hit = hitTest(p.x, p.y);
          const last = lastTapRef.current;
          const now = performance.now();
          if (
            hit !== null &&
            last &&
            last.index === hit &&
            now - last.time < 400
          ) {
            lastTapRef.current = null;
            propsRef.current.onOpen(hit);
            return;
          }
          lastTapRef.current = hit === null ? null : { index: hit, time: now };
          propsRef.current.onSelect(hit);
        }
      } else if (pointers.size === 1) {
        const [p] = [...pointers.values()];
        g.lastX = p.x;
        g.lastY = p.y;
        g.pinchDist = 0;
      }
    };

    const onPointerLeave = () => {
      if (hoverRef.current !== null) {
        hoverRef.current = null;
        requestDraw();
      }
    };

    return (
      <div ref={wrapRef} className={styles.canvasWrap}>
        <canvas
          ref={canvasRef}
          className={styles.canvas}
          role="img"
          aria-label={`Graphe de ${props.layout.nodes.length} artistes reliés par ${props.layout.edges.length} collaborations`}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endPointer}
          onPointerCancel={endPointer}
          onPointerLeave={onPointerLeave}
        />
      </div>
    );
  },
);
