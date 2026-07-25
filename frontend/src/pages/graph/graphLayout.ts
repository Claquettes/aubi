import {
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  forceX,
  forceY,
} from 'd3-force';
import type { SimulationLinkDatum, SimulationNodeDatum } from 'd3-force';
import type { GraphData } from '@/types/api';

/* -------------------------------------------------------------------------- */
/*  Calcul de la disposition du graphe de collaborations.                      */
/*                                                                            */
/*  Le graphe réel est très fragmenté : un gros amas + des dizaines de petits  */
/*  duos isolés. Une simulation globale les projette à l'infini (répulsion     */
/*  sans lien pour les retenir) et tout devient minuscule une fois cadré.      */
/*  On procède donc en deux temps :                                           */
/*    1. chaque composante connexe est simulée séparément, bien compacte ;    */
/*    2. les composantes sont rangées comme des vignettes sur une planche.    */
/*  Résultat : densité homogène, zéro trou, lisible même sur un téléphone.    */
/* -------------------------------------------------------------------------- */

export interface LayoutNode {
  id: string;
  name: string;
  trackCount: number;
  /** Nombre de collaborateurs distincts. */
  degree: number;
  /** Index des voisins dans `nodes`. */
  neighbors: number[];
  /** Rayon du disque, en unités « monde ». */
  r: number;
  /** Poids visuel : sert à prioriser les étiquettes affichées. */
  score: number;
  x: number;
  y: number;
}

export interface LayoutEdge {
  a: number;
  b: number;
  weight: number;
}

export interface GraphLayout {
  nodes: LayoutNode[];
  edges: LayoutEdge[];
  /** Nombre de groupes d'artistes sans lien entre eux. */
  clusterCount: number;
  bounds: { minX: number; minY: number; maxX: number; maxY: number };
}

interface SimNode extends SimulationNodeDatum {
  i: number;
  r: number;
}
interface SimLink extends SimulationLinkDatum<SimNode> {
  weight: number;
}

/** Marge réservée sous chaque nœud pour son étiquette. */
const LABEL_PAD = 22;
/** Respiration entre deux composantes : de la place pour poser les noms. */
const GAP = 48;

function nodeRadius(trackCount: number, degree: number) {
  const r = 5 + Math.sqrt(Math.max(trackCount, 0)) * 2.4 + Math.min(degree, 8) * 0.7;
  return Math.max(7, Math.min(30, r));
}

/** Largeur approximative d'une étiquette (le canvas mesurera précisément). */
function labelWidth(name: string) {
  return Math.min(name.length, 20) * 6.6 + 8;
}

/** Spirale de phyllotaxie : positions de départ déterministes et bien réparties. */
function seedPosition(i: number, spread: number) {
  const a = i * 2.399963229728653;
  const d = spread * Math.sqrt(i + 0.5);
  return { x: Math.cos(a) * d, y: Math.sin(a) * d };
}

function isFinitePoint(x: number | undefined, y: number | undefined): boolean {
  return Number.isFinite(x) && Number.isFinite(y);
}

/** Simule une composante connexe autour de (0, 0). */
function layoutComponent(
  members: number[],
  nodes: LayoutNode[],
  edges: LayoutEdge[],
) {
  const size = members.length;
  const local = new Map<number, number>();
  members.forEach((idx, k) => local.set(idx, k));

  if (size === 1) {
    const n = nodes[members[0]];
    n.x = 0;
    n.y = 0;
    return;
  }

  if (size === 2) {
    const [a, b] = members;
    const half = (nodes[a].r + nodes[b].r) / 2 + 36;
    nodes[a].x = -half;
    nodes[a].y = 0;
    nodes[b].x = half;
    nodes[b].y = 0;
    return;
  }

  const sim: SimNode[] = members.map((idx, k) => {
    const seed = seedPosition(k, 26);
    return { i: idx, r: nodes[idx].r, x: seed.x, y: seed.y };
  });

  const links: SimLink[] = [];
  for (const e of edges) {
    const a = local.get(e.a);
    const b = local.get(e.b);
    if (a === undefined || b === undefined) continue;
    links.push({ source: sim[a], target: sim[b], weight: e.weight });
  }

  const simulation = forceSimulation<SimNode>(sim)
    .force(
      'link',
      forceLink<SimNode, SimLink>(links)
        .distance((l) => {
          const s = l.source as SimNode;
          const t = l.target as SimNode;
          // Plus la collaboration est fournie, plus les artistes sont proches.
          return Math.max(
            30,
            s.r + t.r + 46 - Math.min(l.weight, 10) * 2.4,
          );
        })
        .strength(0.75),
    )
    .force(
      'charge',
      forceManyBody<SimNode>()
        .strength((d) => -(70 + d.r * 7))
        .distanceMax(520),
    )
    // forceX/forceY (et non forceCenter) : ça retient vraiment l'amas au centre.
    .force('x', forceX<SimNode>(0).strength(0.055))
    .force('y', forceY<SimNode>(0).strength(0.055))
    .force(
      'collide',
      forceCollide<SimNode>()
        .radius((d) => d.r + 16)
        .strength(0.9)
        .iterations(2),
    )
    .stop();

  const ticks = Math.min(420, 160 + size * 5);
  for (let i = 0; i < ticks; i++) simulation.tick();

  // Recentre sur le barycentre et neutralise d'éventuels NaN.
  let cx = 0;
  let cy = 0;
  let valid = 0;
  for (const s of sim) {
    if (!isFinitePoint(s.x, s.y)) continue;
    cx += s.x as number;
    cy += s.y as number;
    valid++;
  }
  if (valid > 0) {
    cx /= valid;
    cy /= valid;
  }
  sim.forEach((s, k) => {
    const target = nodes[s.i];
    if (isFinitePoint(s.x, s.y)) {
      target.x = (s.x as number) - cx;
      target.y = (s.y as number) - cy;
    } else {
      const seed = seedPosition(k, 40);
      target.x = seed.x;
      target.y = seed.y;
    }
  });
}

/** Range les composantes en étagères, comme des vignettes sur une planche. */
function packComponents(
  components: number[][],
  nodes: LayoutNode[],
  aspect: number,
) {
  const boxes = components.map((members) => {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const i of members) {
      const n = nodes[i];
      // On réserve la place de l'étiquette : deux composantes voisines ne
      // doivent pas se voler leurs noms.
      const halfLabel = Math.max(n.r, labelWidth(n.name) / 2);
      minX = Math.min(minX, n.x - halfLabel);
      minY = Math.min(minY, n.y - n.r);
      maxX = Math.max(maxX, n.x + halfLabel);
      maxY = Math.max(maxY, n.y + n.r + LABEL_PAD);
    }
    return { members, minX, minY, w: maxX - minX, h: maxY - minY };
  });

  // Les gros amas d'abord : ils donnent le rythme de la planche.
  boxes.sort((a, b) => b.h * b.w - a.h * a.w);

  const totalArea = boxes.reduce((sum, b) => sum + (b.w + GAP) * (b.h + GAP), 0);
  const widest = boxes.reduce((m, b) => Math.max(m, b.w), 0);
  const base = Math.sqrt(totalArea * aspect);

  const shelve = (targetW: number) => {
    const slots: { x: number; y: number }[] = [];
    let cursorX = 0;
    let cursorY = 0;
    let rowHeight = 0;
    let usedW = 0;
    for (const box of boxes) {
      if (cursorX > 0 && cursorX + box.w > targetW) {
        cursorX = 0;
        cursorY += rowHeight + GAP;
        rowHeight = 0;
      }
      slots.push({ x: cursorX, y: cursorY });
      cursorX += box.w + GAP;
      usedW = Math.max(usedW, cursorX - GAP);
      rowHeight = Math.max(rowHeight, box.h);
    }
    return { slots, w: usedW, h: cursorY + rowHeight };
  };

  // On essaie plusieurs largeurs de planche et on garde celle dont le format
  // colle le mieux à la zone de dessin : moins de vide, donc plus de zoom.
  let best: ReturnType<typeof shelve> | null = null;
  let bestErr = Infinity;
  for (const m of [0.55, 0.7, 0.85, 1, 1.15, 1.35, 1.6, 2, 2.6]) {
    const packed = shelve(Math.max(widest, base * m));
    const err = Math.abs(Math.log(packed.w / Math.max(packed.h, 1) / aspect));
    if (err < bestErr) {
      bestErr = err;
      best = packed;
    }
  }
  if (!best) return;
  const packed = best;

  boxes.forEach((box, i) => {
    const dx = packed.slots[i].x - box.minX;
    const dy = packed.slots[i].y - box.minY;
    for (const m of box.members) {
      nodes[m].x += dx;
      nodes[m].y += dy;
    }
  });
}

function bounds(nodes: LayoutNode[]) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const n of nodes) {
    const halfLabel = Math.max(n.r, labelWidth(n.name) / 2);
    minX = Math.min(minX, n.x - halfLabel);
    minY = Math.min(minY, n.y - n.r);
    maxX = Math.max(maxX, n.x + halfLabel);
    maxY = Math.max(maxY, n.y + n.r + LABEL_PAD);
  }
  if (!Number.isFinite(minX)) return { minX: -100, minY: -100, maxX: 100, maxY: 100 };
  return { minX, minY, maxX, maxY };
}

/** Repli sûr : anneau de phyllotaxie, jamais d'écran blanc. */
function fallbackLayout(nodes: LayoutNode[]) {
  nodes.forEach((n, i) => {
    const seed = seedPosition(i, 46);
    n.x = seed.x;
    n.y = seed.y;
  });
}

/**
 * @param aspect Format visé pour la planche (largeur / hauteur) : on cale la
 *   disposition sur la zone de dessin pour ne pas gâcher de place.
 */
export function buildGraphLayout(
  data: GraphData | undefined,
  aspect = 1.7,
): GraphLayout | null {
  if (!data || !data.nodes?.length) return null;

  const nodes: LayoutNode[] = data.nodes.map((n) => ({
    id: n.id,
    name: n.name ?? '—',
    trackCount: Number(n.trackCount) || 0,
    degree: 0,
    neighbors: [],
    r: 8,
    score: 0,
    x: 0,
    y: 0,
  }));

  const indexById = new Map<string, number>();
  nodes.forEach((n, i) => indexById.set(n.id, i));

  // On ignore les arêtes orphelines : d3-force lève une exception dessus
  // (« missing: <id> »), ce qui faisait planter la page.
  const edges: LayoutEdge[] = [];
  const seen = new Set<string>();
  for (const e of data.edges ?? []) {
    const a = indexById.get(e.source);
    const b = indexById.get(e.target);
    if (a === undefined || b === undefined || a === b) continue;
    const key = a < b ? `${a}:${b}` : `${b}:${a}`;
    if (seen.has(key)) continue;
    seen.add(key);
    edges.push({ a, b, weight: Math.max(1, Number(e.weight) || 1) });
  }

  for (const e of edges) {
    nodes[e.a].neighbors.push(e.b);
    nodes[e.b].neighbors.push(e.a);
  }
  for (const n of nodes) {
    n.degree = n.neighbors.length;
    n.r = nodeRadius(n.trackCount, n.degree);
    n.score = n.degree * 3 + Math.sqrt(n.trackCount) * 2;
  }

  // Composantes connexes (BFS itératif).
  const componentOf = new Int32Array(nodes.length).fill(-1);
  const components: number[][] = [];
  const queue: number[] = [];
  for (let start = 0; start < nodes.length; start++) {
    if (componentOf[start] !== -1) continue;
    const id = components.length;
    const members: number[] = [];
    componentOf[start] = id;
    queue.length = 0;
    queue.push(start);
    while (queue.length) {
      const cur = queue.pop() as number;
      members.push(cur);
      for (const nb of nodes[cur].neighbors) {
        if (componentOf[nb] === -1) {
          componentOf[nb] = id;
          queue.push(nb);
        }
      }
    }
    components.push(members);
  }

  try {
    const edgesByComponent = new Map<number, LayoutEdge[]>();
    for (const e of edges) {
      const c = componentOf[e.a];
      const list = edgesByComponent.get(c);
      if (list) list.push(e);
      else edgesByComponent.set(c, [e]);
    }
    components.forEach((members, c) => {
      layoutComponent(members, nodes, edgesByComponent.get(c) ?? []);
    });
    packComponents(components, nodes, aspect);
  } catch {
    fallbackLayout(nodes);
  }

  for (const n of nodes) {
    if (!isFinitePoint(n.x, n.y)) {
      n.x = 0;
      n.y = 0;
    }
  }

  return {
    nodes,
    edges,
    clusterCount: components.length,
    bounds: bounds(nodes),
  };
}
