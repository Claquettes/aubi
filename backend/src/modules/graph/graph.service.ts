import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

interface EdgeRow {
  source: string;
  target: string;
  weight: number;
}
interface NodeRow {
  id: string;
  name: string;
  track_count: number;
}

/** Graphe de collaborations : deux artistes reliés s'ils partagent un titre. */
@Injectable()
export class GraphService {
  constructor(@InjectDataSource() private readonly ds: DataSource) {}

  async collaborations() {
    const edges = await this.ds.query<EdgeRow[]>(`
      SELECT a.artist_id AS source, b.artist_id AS target, COUNT(*)::int AS weight
      FROM track_artists a
      JOIN track_artists b
        ON a.track_id = b.track_id AND a.artist_id < b.artist_id
      JOIN tracks t ON t.id = a.track_id AND t.deleted_at IS NULL
      GROUP BY a.artist_id, b.artist_id
      ORDER BY weight DESC
      LIMIT 500
    `);

    const nodeIds = new Set<string>();
    for (const e of edges) {
      nodeIds.add(e.source);
      nodeIds.add(e.target);
    }

    const nodes = nodeIds.size
      ? await this.ds.query<NodeRow[]>(
          `SELECT a.id, a.name, COUNT(DISTINCT ta.track_id)::int AS track_count
           FROM artists a
           JOIN track_artists ta ON ta.artist_id = a.id
           JOIN tracks t ON t.id = ta.track_id AND t.deleted_at IS NULL
           WHERE a.id = ANY($1)
           GROUP BY a.id, a.name`,
          [[...nodeIds]],
        )
      : [];

    return {
      nodes: nodes.map((n) => ({
        id: n.id,
        name: n.name,
        trackCount: Number(n.track_count),
      })),
      edges: edges.map((e) => ({
        source: e.source,
        target: e.target,
        weight: Number(e.weight),
      })),
    };
  }
}
