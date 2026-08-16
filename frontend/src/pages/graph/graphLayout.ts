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
/*    2. les composantes sont empilées en spirale autour du centre — les plus */
/*       gros amas au milieu, les duos et les solitaires comblent les creux.  */
/*  Résultat : une constellation, pas une grille : rien n'est aligné, la      */
/*  matière est au centre et la densité reste homogène jusqu'aux bords.       */
/* -------------------------------------------------------------------------- */

export interface LayoutNode {
  id: string;
  name: string;
  trackCount: number;
  /** Nombre de collaborateurs distincts. */
  degree: number;
  /** Index des voisins dans `nodes`. */
  neighbors: number[];
  /** Réseau d'appartenance : donne sa teinte au nœud et à ses liens. */
  cluster: number;
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

const TAU = Math.PI * 2;
/** Angle d'or : deux valeurs consécutives ne se ressemblent jamais. */
const GOLDEN_ANGLE = 2.399963229728653;
/** Marge réservée sous chaque nœud pour son étiquette. */
const LABEL_PAD = 22;
/** Respiration entre deux composantes : de la place pour poser les noms. */
const GAP = 30;

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

/** Fait pivoter une composante autour de son barycentre. */
function rotateComponent(
  members: number[],
  nodes: LayoutNode[],
  angle: number,
) {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  for (const i of members) {
    const n = nodes[i];
    const x = n.x * cos - n.y * sin;
    const y = n.x * sin + n.y * cos;
    n.x = x;
    n.y = y;
  }
}

/** Rayon d'une composante autour de son barycentre, étiquette comprise. */
function componentRadius(members: number[], nodes: LayoutNode[]) {
  let r = 0;
  for (const i of members) {
    const n = nodes[i];
    // On réserve la place du nom : deux amas voisins ne doivent pas se voler
    // leurs étiquettes.
    const reach = Math.max(labelWidth(n.name) / 2, n.r + LABEL_PAD);
    r = Math.max(r, Math.hypot(n.x, n.y) + reach);
  }
  return Math.max(r, 14);
}

/**
 * Empile les composantes en spirale autour du centre : la plus grosse au
 * milieu, les suivantes se posent dans le premier creux libre en tournant
 * autour. Aucune ligne, aucune colonne — un amas, pas un tableau.
 *
 * @param aspect Format visé (largeur / hauteur) : la spirale est aplatie pour
 *   que l'ensemble épouse la zone de dessin et gagne du zoom.
 */
function packClusters(
  components: number[][],
  nodes: LayoutNode[],
  aspect: number,
) {
  const items = components.map((members) => ({
    members,
    r: componentRadius(members, nodes),
  }));
  // Les gros amas d'abord : ils prennent le centre, les duos et les artistes
  // solitaires viennent ensuite combler les creux du pourtour.
  items.sort((a, b) => b.r - a.r);

  const stretchX = Math.sqrt(aspect);
  const stretchY = 1 / Math.sqrt(aspect);

  /* Index spatial : sans lui, chaque position candidate serait confrontée à
     tous les amas déjà posés et le rangement deviendrait quadratique — une
     grosse bibliothèque mettait plusieurs dizaines de secondes à s'afficher.
     Les quelques amas trop larges pour la grille sont testés à part. */
  type Disc = { x: number; y: number; r: number };
  const median = items[Math.floor(items.length / 2)]?.r ?? 40;
  const cell = Math.max(64, median * 2);
  const grid = new Map<string, Disc[]>();
  const oversized: Disc[] = [];

  const cellsOf = (x: number, y: number, reach: number) => ({
    x0: Math.floor((x - reach) / cell),
    x1: Math.floor((x + reach) / cell),
    y0: Math.floor((y - reach) / cell),
    y1: Math.floor((y + reach) / cell),
  });

  const remember = (disc: Disc) => {
    if (disc.r > cell * 3) {
      oversized.push(disc);
      return;
    }
    const c = cellsOf(disc.x, disc.y, disc.r);
    for (let cx = c.x0; cx <= c.x1; cx++) {
      for (let cy = c.y0; cy <= c.y1; cy++) {
        const key = `${cx}:${cy}`;
        const bucket = grid.get(key);
        if (bucket) bucket.push(disc);
        else grid.set(key, [disc]);
      }
    }
  };

  const hits = (d: Disc, x: number, y: number, r: number) => {
    const need = d.r + r + GAP;
    const dx = x - d.x;
    const dy = y - d.y;
    return dx * dx + dy * dy < need * need;
  };

  /** La place est-elle libre pour un amas de rayon `r` centré en (x, y) ? */
  const free = (x: number, y: number, r: number) => {
    for (const d of oversized) if (hits(d, x, y, r)) return false;
    // Un disque est rangé dans toutes les cases que couvre sa boîte : chercher
    // dans celles de la boîte élargie du candidat suffit à tous les trouver.
    const c = cellsOf(x, y, r + GAP);
    for (let cx = c.x0; cx <= c.x1; cx++) {
      for (let cy = c.y0; cy <= c.y1; cy++) {
        const bucket = grid.get(`${cx}:${cy}`);
        if (!bucket) continue;
        for (const d of bucket) if (hits(d, x, y, r)) return false;
      }
    }
    return true;
  };

  // Aire déjà occupée : elle donne le rayon du front, d'où l'on part chercher
  // une place plutôt que de resonder le centre — dense — à chaque amas.
  let filled = 0;

  items.forEach((item, rank) => {
    let pos = { x: 0, y: 0 };

    if (filled > 0) {
      // Le pas suit la taille de l'amas à poser : les petits se faufilent au
      // plus près, les gros ne perdent pas leur temps à sonder chaque pixel.
      const step = Math.max(10, item.r * 0.55);
      const front = Math.sqrt(filled / Math.PI);
      // On redescend d'un amas sous le front : les derniers creux du pourtour
      // restent accessibles, c'est ce qui donne son grain à l'ensemble.
      const first = Math.max(1, Math.floor((front - item.r * 2) / step));
      let found = false;
      for (let ring = first; ring < first + 400 && !found; ring++) {
        const radius = ring * step;
        const slots = Math.max(9, Math.round((TAU * radius) / step));
        // Décalage d'un anneau à l'autre : pas de couloirs rectilignes.
        const phase = ring * GOLDEN_ANGLE;
        for (let s = 0; s < slots; s++) {
          const a = phase + (s / slots) * TAU;
          const x = Math.cos(a) * radius * stretchX;
          const y = Math.sin(a) * radius * stretchY;
          if (free(x, y, item.r)) {
            pos = { x, y };
            found = true;
            break;
          }
        }
      }
      if (!found) {
        // Garde-fou : plutôt loin dehors que superposé au reste.
        const a = rank * GOLDEN_ANGLE;
        const radius = (first + 400) * step;
        pos = {
          x: Math.cos(a) * radius * stretchX,
          y: Math.sin(a) * radius * stretchY,
        };
      }
    }

    remember({ x: pos.x, y: pos.y, r: item.r });
    filled += Math.PI * (item.r + GAP / 2) ** 2;
    for (const m of item.members) {
      nodes[m].x += pos.x;
      nodes[m].y += pos.y;
      // La teinte suit l'ordre de pose : deux amas voisins sur la spirale ne
      // tombent jamais sur la même nuance.
      nodes[m].cluster = rank;
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
    cluster: 0,
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
      // Sans cette rotation, tous les duos sortent à l'horizontale et l'œil ne
      // voit plus qu'un peigne. Angle d'or : réparti, et toujours le même d'un
      // affichage à l'autre.
      rotateComponent(members, nodes, c * GOLDEN_ANGLE);
    });
    packClusters(components, nodes, aspect);
  } catch {
    fallbackLayout(nodes);
    components.forEach((members, c) => {
      for (const i of members) nodes[i].cluster = c;
    });
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
