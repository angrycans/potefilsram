import { createNoise2D, type NoiseFunction2D } from "simplex-noise";
import type { HexesOption, RegionTag, AlignmentMode, DangerMode } from "./PerilousConfig";

export type PerilousBiome =
  | "ocean"
  | "shallow"
  | "beach"
  | "plains"
  | "forest"
  | "mountain";

export interface PerilousMapFeature {
  type: "mountain" | "forest" | "river" | "town" | "road" | "danger";
  // For point features: one index. For line features: ordered path.
  cellIndices: number[];
  name?: string;
}

export interface PerilousHexCell {
  index: number;

  // Offset coordinates (for easy neighbor parity rules)
  col: number;
  row: number;

  // World coordinates (same coordinate space as generator width/height)
  center: [number, number];

  // Hex polygon vertices
  polygon: [number, number][];

  // Scalar fields
  elevation: number;
  moisture: number;

  // Classification
  isLand: boolean;
  biome: PerilousBiome;

  // Neighbor indices (6 neighbors, fewer near map edges)
  neighbors: number[];

  // Coastline & smoothing flags
  isCoast: boolean;
  coastDepth: number; // 0 = interior, 1 = direct coast, >1 = deeper inland
}

export interface PerilousMapData {
  width: number;
  height: number;
  hexRadius: number;
  cells: PerilousHexCell[];
  features: PerilousMapFeature[];
}

export interface PerilousMapGenConfig {
  width: number;
  height: number;

  // Target number of hex cells (used to derive hex radius)
  cellCount: number;

  seaLevel: number;
  riverCount: number;

  // Perilous Shores: pointy/flat/warped
  hexes: Exclude<HexesOption, "None">;

  tags: RegionTag[];
  alignment: AlignmentMode;
  danger: DangerMode;
  settlementDensity: number;
  riverDensity: number;
  roadDensity: number;

  seed?: number;
}

const DEFAULT_CONFIG: PerilousMapGenConfig = {
  width: 200,
  height: 200,
  cellCount: 2000,
  seaLevel: 0.05,
  riverCount: 6,
  hexes: "Warped",
  tags: ["island"],
  alignment: "Neutral",
  danger: "Balanced",
  settlementDensity: 0.028,
  riverDensity: 0.05,
  roadDensity: 0.7,
};

function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

/**
 * Reverse-engineered Perilous Shores-style map generator.
 *
 * Key invariant vs MapGenerator:
 * - This generator is HEX-GRID based: cells are hexagons; neighbors derived from grid adjacency.
 * - This module is independent and ONLY intended for PerilousFantasyWorldScene.
 */
export class PerilousMapGenerator {
  private cfg: PerilousMapGenConfig;
  private elevationNoise: NoiseFunction2D;
  private moistureNoise: NoiseFunction2D;
  private warpNoise: NoiseFunction2D;
  private rng: () => number;

  constructor(config?: Partial<PerilousMapGenConfig>) {
    this.cfg = { ...DEFAULT_CONFIG, ...config };
    const baseSeed = (this.cfg.seed ?? Date.now()) >>> 0;
    this.elevationNoise = createNoise2D(mulberry32(baseSeed ^ 0xa341316c));
    this.moistureNoise = createNoise2D(mulberry32(baseSeed ^ 0xc8013ea4));
    this.warpNoise = createNoise2D(mulberry32(baseSeed ^ 0xad90777d));
    this.rng = mulberry32(baseSeed ^ 0x7e95761e);
  }

  generate(): PerilousMapData {
    const { width, height, cellCount, hexes } = this.cfg;

    // Hex radius derived from desired cellCount.
    // Area(hex) ≈ (3√3/2) r^2
    const areaPerCell = (width * height) / cellCount;
    const r = Math.sqrt(areaPerCell / (Math.sqrt(3) * 1.5));

    const isFlat = hexes === "Flat topped";
    const isWarped = hexes === "Warped";

    let colStep: number;
    let rowStep: number;
    if (isFlat) {
      colStep = 1.5 * r;
      rowStep = Math.sqrt(3) * r;
    } else {
      // Pointy topped (also base for Warped)
      colStep = Math.sqrt(3) * r;
      rowStep = 1.5 * r;
    }

    const cols = Math.ceil(width / colStep) + 2;
    const rows = Math.ceil(height / rowStep) + 2;

    const gridMap: (number | undefined)[][] = [];
    const cells: PerilousHexCell[] = [];
    const cellByCoord = new Map<string, number>();
    let idx = 0;

    for (let row = -1; row < rows; row++) {
      const gridRow: (number | undefined)[] = [];

      for (let col = -1; col < cols; col++) {
        let cx: number;
        let cy: number;

        if (isFlat) {
          cx = col * colStep;
          cy = row * rowStep + ((col & 1) !== 0 ? rowStep * 0.5 : 0);
        } else {
          cx = col * colStep + ((row & 1) !== 0 ? colStep * 0.5 : 0);
          cy = row * rowStep;
        }

        // Cull points far outside
        if (cx < -r * 2 || cx > width + r * 2 || cy < -r * 2 || cy > height + r * 2) {
          gridRow.push(undefined);
          continue;
        }

        const poly = this.buildHexPoly(cx, cy, r, isFlat, isWarped);
        const pcx = poly.reduce((s, p) => s + p[0], 0) / poly.length;
        const pcy = poly.reduce((s, p) => s + p[1], 0) / poly.length;

        const elevation = this.getElevation(pcx, pcy);
        const moisture = this.getMoisture(pcx, pcy);
        const isLand = elevation > this.cfg.seaLevel;
        const biome = this.classifyBiome(elevation, moisture, isLand);

        const mapCol = col + 1;
        const mapRow = row + 1;

        cells.push({
          index: idx,
          col: mapCol,
          row: mapRow,
          center: [pcx, pcy],
          polygon: poly,
          elevation,
          moisture,
          isLand,
          biome,
          neighbors: [],
          isCoast: false,
          coastDepth: 0,
        });

        cellByCoord.set(this.coordKey(mapCol, mapRow), idx);
        gridRow.push(idx);
        idx++;
      }

      gridMap.push(gridRow);
    }

    this.computeNeighbors(cells, gridMap, cols + 1, isFlat);
    this.identifyCoastlines(cells);

    const features = this.placeFeatures(cells, r, cellByCoord);

    return {
      width,
      height,
      hexRadius: r,
      cells,
      features,
    };
  }

  private buildHexPoly(
    cx: number,
    cy: number,
    r: number,
    isFlat: boolean,
    isWarped: boolean
  ): [number, number][] {
    const poly: [number, number][] = [];

    // Pointy topped hex: we use -30° start (matches typical “pointy” layout)
    // Flat topped hex: 0° start
    const startAngle = isFlat ? 0 : -Math.PI / 6;

    for (let i = 0; i < 6; i++) {
      const angle = startAngle + (Math.PI / 3) * i;
      let vx = cx + r * Math.cos(angle);
      let vy = cy + r * Math.sin(angle);

      if (isWarped) {
        const warp = r * 0.35;
        vx += this.warpNoise(vx * 0.03, vy * 0.03) * warp;
        vy += this.warpNoise(vx * 0.03 + 50, vy * 0.03 + 50) * warp;
      }

      poly.push([vx, vy]);
    }

    return poly;
  }

  private computeNeighbors(
    cells: PerilousHexCell[],
    gridMap: (number | undefined)[][],
    totalCols: number,
    isFlat: boolean
  ): void {
    const getCell = (gr: number, gc: number): number | undefined => {
      if (gr < 0 || gr >= gridMap.length) return undefined;
      if (gc < 0 || gc >= totalCols) return undefined;
      return gridMap[gr]?.[gc];
    };

    for (const cell of cells) {
      const c = cell.col;
      const r = cell.row;
      const neighbors: number[] = [];

      if (isFlat) {
        // Flat topped: parity on column
        const offsets: [number, number][] =
          (c & 1) === 0
            ? [[1, 0], [-1, 0], [0, -1], [0, 1], [-1, -1], [1, -1]]
            : [[1, 0], [-1, 0], [0, -1], [0, 1], [-1, 1], [1, 1]];

        for (const [dc, dr] of offsets) {
          const ni = getCell(r + dr, c + dc);
          if (ni !== undefined) neighbors.push(ni);
        }
      } else {
        // Pointy topped: parity on row
        const offsets: [number, number][] =
          (r & 1) === 0
            ? [[1, 0], [-1, 0], [0, -1], [0, 1], [-1, -1], [-1, 1]]
            : [[1, 0], [-1, 0], [0, -1], [0, 1], [1, -1], [1, 1]];

        for (const [dc, dr] of offsets) {
          const ni = getCell(r + dr, c + dc);
          if (ni !== undefined) neighbors.push(ni);
        }
      }

      cell.neighbors = neighbors;
    }
  }

  private hasTag(tag: RegionTag): boolean {
    return this.cfg.tags.includes(tag);
  }

  private random(): number {
    return this.rng();
  }

  private randomInt(maxExclusive: number): number {
    if (maxExclusive <= 1) return 0;
    return Math.floor(this.random() * maxExclusive);
  }

  private getElevation(x: number, y: number): number {
    const { width, height } = this.cfg;

    // Multi-octave noise
    let e = 0;
    e += 1.0 * this.elevationNoise(x / 120, y / 120);
    e += 0.5 * this.elevationNoise(x / 60, y / 60);
    e += 0.25 * this.elevationNoise(x / 30, y / 30);
    e += 0.125 * this.elevationNoise(x / 15, y / 15);
    e /= 1.875;

    // Tag-driven macro shape
    const nx = (x / width) * 2 - 1;
    const ny = (y / height) * 2 - 1;
    const dist = Math.sqrt(nx * nx + ny * ny);

    if (this.hasTag("island")) {
      const mask = 1.0 - Math.pow(dist, 2);
      e = (e + mask) / 2;
    } else if (this.hasTag("archipelago")) {
      const mask = 1.0 - Math.pow(dist, 1.5);
      e = e * 0.7 + mask * 0.3 - 0.1;
    } else if (this.hasTag("land")) {
      e = (e + 0.6) / 2;
    } else {
      // default to island-ish
      const mask = 1.0 - Math.pow(dist, 2);
      e = (e + mask) / 2;
    }

    if (this.hasTag("highland")) e += 0.12;
    if (this.hasTag("lowland")) e -= 0.08;

    return e;
  }

  private getMoisture(x: number, y: number): number {
    let m = 0;
    m += 1.0 * this.moistureNoise(x / 100, y / 100);
    m += 0.5 * this.moistureNoise(x / 50, y / 50);
    m /= 1.5;
    m = (m + 1) / 2;

    if (this.hasTag("woodland")) m = Math.min(1, m + 0.25);
    if (this.hasTag("wetland")) m = Math.min(1, m + 0.3);
    if (this.hasTag("barren")) m = Math.max(0, m - 0.3);

    return m;
  }

  private classifyBiome(elevation: number, moisture: number, isLand: boolean): PerilousBiome {
    if (!isLand) {
      return elevation < -0.2 ? "ocean" : "shallow";
    }
    if (elevation > 0.55) return "mountain";
    if (elevation < 0.08) return "beach";
    if (moisture > 0.6) return "forest";
    return "plains";
  }

  private placeFeatures(
    cells: PerilousHexCell[],
    hexRadius: number,
    cellByCoord: Map<string, number>
  ): PerilousMapFeature[] {
    const features: PerilousMapFeature[] = [];

    const mountainCells = this.placeMountains(cells);
    for (const ci of mountainCells) {
      features.push({ type: "mountain", cellIndices: [ci] });
    }

    const forestCells = this.placeForests(cells);
    for (const ci of forestCells) {
      features.push({ type: "forest", cellIndices: [ci] });
    }

    const rivers = this.placeRivers(cells);
    for (const riverPath of rivers) {
      features.push({ type: "river", cellIndices: riverPath });
    }

    const towns = this.placeTowns(cells, rivers, hexRadius);
    for (const ci of towns) {
      features.push({ type: "town", cellIndices: [ci] });
    }

    const roads = this.placeRoads(cells, towns);
    for (const roadPath of roads) {
      features.push({ type: "road", cellIndices: roadPath });
    }

    const dangers = this.placeDanger(cells, towns, hexRadius, cellByCoord);
    for (const ci of dangers) {
      features.push({ type: "danger", cellIndices: [ci] });
    }

    return features;
  }

  private placeMountains(cells: PerilousHexCell[]): number[] {
    const land = cells.filter((c) => c.isLand).length;
    let density = this.hasTag("highland") ? 0.04 : 0.025;
    if (this.hasTag("lowland")) density *= 0.6;

    const candidates = cells
      .filter((c) => c.isLand && c.elevation > 0.38)
      .sort((a, b) => b.elevation - a.elevation);

    const target = Math.min(candidates.length, Math.max(4, Math.round(land * density)));
    const picked = new Set<number>();

    while (picked.size < target && candidates.length > 0) {
      const seedCell = candidates[this.randomInt(Math.min(30, candidates.length))];
      if (picked.has(seedCell.index)) {
        continue;
      }
      picked.add(seedCell.index);

      const clusterSize = 1 + this.randomInt(this.hasTag("highland") ? 4 : 3);
      let frontier = [seedCell.index];
      for (let i = 0; i < clusterSize; i++) {
        if (frontier.length === 0 || picked.size >= target) break;
        const cur = frontier[this.randomInt(frontier.length)];
        const next = cells[cur].neighbors
          .map((ni) => cells[ni])
          .filter((n) => n.isLand && n.elevation > 0.32 && !picked.has(n.index));
        if (next.length === 0) continue;
        const n = next[this.randomInt(next.length)];
        picked.add(n.index);
        frontier = [...frontier, n.index];
      }

      if (picked.size >= target) break;
    }

    return Array.from(picked);
  }

  private placeForests(cells: PerilousHexCell[]): number[] {
    const land = cells.filter((c) => c.isLand).length;
    let density = this.hasTag("woodland") ? 0.14 : 0.09;
    if (this.hasTag("barren")) density *= 0.45;

    const candidates = cells.filter(
      (c) => c.isLand && c.biome !== "mountain" && c.moisture > 0.42
    );

    const target = Math.min(candidates.length, Math.max(8, Math.round(land * density)));
    const picked = new Set<number>();

    while (picked.size < target && candidates.length > 0) {
      const seed = candidates[this.randomInt(candidates.length)];
      if (picked.has(seed.index)) continue;
      picked.add(seed.index);

      const cluster = 1 + this.randomInt(5);
      let frontier = [seed.index];
      for (let i = 0; i < cluster; i++) {
        if (frontier.length === 0 || picked.size >= target) break;
        const cur = frontier[this.randomInt(frontier.length)];
        const next = cells[cur].neighbors
          .map((ni) => cells[ni])
          .filter((n) => n.isLand && n.moisture > 0.35 && n.biome !== "mountain" && !picked.has(n.index));
        if (next.length === 0) continue;
        const n = next[this.randomInt(next.length)];
        picked.add(n.index);
        frontier = [...frontier, n.index];
      }
    }

    return Array.from(picked);
  }

  private placeRivers(cells: PerilousHexCell[]): number[][] {
    const landCount = cells.filter((c) => c.isLand).length;
    let riverTarget = clamp(
      Math.round(landCount * this.cfg.riverDensity * 0.02) + Math.round(this.cfg.riverDensity * 40),
      1,
      Math.max(2, this.cfg.riverCount)
    );
    if (this.hasTag("wetland")) riverTarget += 2;
    if (this.hasTag("barren")) riverTarget = Math.max(1, riverTarget - 1);
    if (this.cfg.danger === "Perilous") riverTarget += 1;
    if (this.cfg.danger === "Safe") riverTarget = Math.max(1, riverTarget - 1);

    const sources = cells
      .filter((c) => c.isLand && c.elevation > 0.42 && c.coastDepth >= 2)
      .sort((a, b) => b.elevation - a.elevation);

    const rivers: number[][] = [];
    const usedSources = new Set<number>();

    for (const source of sources) {
      if (rivers.length >= riverTarget) break;
      if (usedSources.has(source.index)) continue;
      usedSources.add(source.index);

      const path: number[] = [source.index];
      const visited = new Set<number>(path);
      let cur = source;

      for (let step = 0; step < 56; step++) {
        if (!cur.isLand || cur.biome === "ocean") break;

        const neighbors = cur.neighbors.map((ni) => cells[ni]);
        const candidates = neighbors.filter((n) => !visited.has(n.index));
        if (candidates.length === 0) break;

        let best = candidates[0];
        let bestScore = Number.POSITIVE_INFINITY;

        for (const n of candidates) {
          const downhill = n.elevation - cur.elevation;
          const coastPull = n.coastDepth === 0 ? -1 : n.coastDepth;
          const moisturePull = 1 - n.moisture;
          const oceanBias = n.isLand ? 0 : -2;
          const score = downhill * 2.2 + coastPull * 0.25 + moisturePull * 0.2 + oceanBias + this.random() * 0.35;
          if (score < bestScore) {
            bestScore = score;
            best = n;
          }
        }

        path.push(best.index);
        visited.add(best.index);
        cur = best;

        if (!cur.isLand || cur.biome === "ocean" || cur.biome === "shallow") {
          break;
        }
      }

      const landPath = path.filter((ci) => cells[ci].isLand);
      if (landPath.length >= 4) {
        rivers.push(landPath);
      }
    }

    return rivers;
  }

  private placeTowns(cells: PerilousHexCell[], rivers: number[][], hexRadius: number): number[] {
    const riverSet = new Set<number>(rivers.flat());
    const landCount = cells.filter((c) => c.isLand).length;
    let target = clamp(Math.round(landCount * this.cfg.settlementDensity), 2, 16);
    if (this.cfg.alignment === "Lawful") target += 2;
    if (this.cfg.alignment === "Chaotic") target = Math.max(2, target - 1);
    if (this.cfg.danger === "Safe") target += 1;
    if (this.cfg.danger === "Perilous") target = Math.max(2, target - 2);

    const candidates = cells
      .filter((c) => c.isLand && c.biome !== "mountain" && c.coastDepth >= 1)
      .map((c) => {
        let score = 0;
        if (c.biome === "plains") score += this.cfg.alignment === "Lawful" ? 3.5 : 3;
        if (c.biome === "beach") score += 1.8;
        if (c.coastDepth >= 2 && c.coastDepth <= 4) score += 1.5;
        if (riverSet.has(c.index)) score += 2.5;
        if (this.cfg.alignment === "Chaotic" && c.coastDepth >= 4) score += 0.8;
        score += c.moisture * 0.8;
        score += this.random() * 0.9;
        return { index: c.index, score };
      })
      .sort((a, b) => b.score - a.score);

    const selected: number[] = [];
    const minDist = hexRadius * 7;

    for (const c of candidates) {
      if (selected.length >= target) break;
      const cell = cells[c.index];
      const tooClose = selected.some((si) => {
        const s = cells[si];
        return this.distance(cell.center, s.center) < minDist;
      });
      if (!tooClose) selected.push(c.index);
    }

    return selected;
  }

  private placeRoads(cells: PerilousHexCell[], townCells: number[]): number[][] {
    if (townCells.length < 2) return [];

    const roads: number[][] = [];
    const connected = new Set<number>([townCells[0]]);
    const remaining = new Set<number>(townCells.slice(1));
    const keepChance = clamp(this.cfg.roadDensity, 0, 1);

    while (remaining.size > 0) {
      let bestFrom = -1;
      let bestTo = -1;
      let bestDistance = Number.POSITIVE_INFINITY;

      for (const from of connected) {
        for (const to of remaining) {
          const d = this.distance(cells[from].center, cells[to].center);
          if (d < bestDistance) {
            bestDistance = d;
            bestFrom = from;
            bestTo = to;
          }
        }
      }

      if (bestFrom === -1 || bestTo === -1) break;

      const path = this.findLandPath(bestFrom, bestTo, cells, 250);
      if (path.length >= 2 && this.random() <= keepChance) {
        roads.push(path);
      }

      connected.add(bestTo);
      remaining.delete(bestTo);
    }

    return roads;
  }

  private placeDanger(
    cells: PerilousHexCell[],
    towns: number[],
    hexRadius: number,
    cellByCoord: Map<string, number>
  ): number[] {
    const land = cells.filter((c) => c.isLand).length;
    let density = this.hasTag("perilous") ? 0.02 : 0.012;
    if (this.hasTag("safe")) density *= 0.35;
    if (this.cfg.danger === "Safe") density *= 0.5;
    if (this.cfg.danger === "Perilous") density *= 1.8;
    if (this.cfg.alignment === "Chaotic") density *= 1.25;
    if (this.cfg.alignment === "Lawful") density *= 0.8;

    const candidates = cells.filter((c) => c.isLand && c.coastDepth >= 2 && c.biome !== "beach");
    const target = clamp(Math.round(land * density), 2, 10);

    const minDist = hexRadius * 6;
    const scored = candidates
      .map((c) => {
        const nearTown = towns.length === 0
          ? Number.POSITIVE_INFINITY
          : Math.min(...towns.map((ti) => this.distance(c.center, cells[ti].center)));
        const nearbyCount = this.neighborCount(cellByCoord, c.col, c.row);
        let score = c.coastDepth * 0.8 + c.elevation * 0.7 + this.random();
        score += nearTown > minDist ? 1.0 : -1.5;
        score += nearbyCount > 4 ? 0.5 : 0;
        return { index: c.index, score };
      })
      .sort((a, b) => b.score - a.score);

    const selected: number[] = [];
    for (const s of scored) {
      if (selected.length >= target) break;
      const c = cells[s.index];
      const tooCloseToTown = towns.some((ti) => this.distance(c.center, cells[ti].center) < minDist);
      if (tooCloseToTown) continue;
      const tooCloseToDanger = selected.some((di) => this.distance(c.center, cells[di].center) < minDist * 0.75);
      if (tooCloseToDanger) continue;
      selected.push(s.index);
    }

    return selected;
  }

  private findLandPath(
    start: number,
    goal: number,
    cells: PerilousHexCell[],
    maxIterations: number
  ): number[] {
    const open = new Set<number>([start]);
    const cameFrom = new Map<number, number>();
    const gScore = new Map<number, number>([[start, 0]]);
    const fScore = new Map<number, number>([[start, this.heuristic(cells[start], cells[goal])]]);

    let iterations = 0;
    while (open.size > 0 && iterations < maxIterations) {
      iterations++;

      let current = -1;
      let currentF = Number.POSITIVE_INFINITY;
      for (const node of open) {
        const f = fScore.get(node) ?? Number.POSITIVE_INFINITY;
        if (f < currentF) {
          currentF = f;
          current = node;
        }
      }

      if (current === goal) {
        return this.reconstructPath(cameFrom, current);
      }

      open.delete(current);
      const curCell = cells[current];

      for (const ni of curCell.neighbors) {
        const n = cells[ni];
        const terrainPenalty = n.biome === "mountain"
          ? 4
          : n.biome === "forest"
            ? 1.8
            : n.biome === "shallow"
              ? 8
              : n.biome === "ocean"
                ? 30
                : 1;

        if (!n.isLand && ni !== goal) {
          continue;
        }

        const tentativeG = (gScore.get(current) ?? Number.POSITIVE_INFINITY) + terrainPenalty;
        if (tentativeG < (gScore.get(ni) ?? Number.POSITIVE_INFINITY)) {
          cameFrom.set(ni, current);
          gScore.set(ni, tentativeG);
          fScore.set(ni, tentativeG + this.heuristic(n, cells[goal]));
          open.add(ni);
        }
      }
    }

    return [start, goal];
  }

  private reconstructPath(cameFrom: Map<number, number>, current: number): number[] {
    const total = [current];
    while (cameFrom.has(current)) {
      current = cameFrom.get(current)!;
      total.push(current);
    }
    total.reverse();
    return total;
  }

  private heuristic(a: PerilousHexCell, b: PerilousHexCell): number {
    return this.distance(a.center, b.center);
  }

  private neighborCount(coordMap: Map<string, number>, col: number, row: number): number {
    // Useful for danger placement in dense inland regions.
    const offsets: [number, number][] = [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
      [1, 1],
      [-1, -1],
    ];
    let c = 0;
    for (const [dc, dr] of offsets) {
      if (coordMap.has(this.coordKey(col + dc, row + dr))) c++;
    }
    return c;
  }

  private coordKey(col: number, row: number): string {
    return `${col},${row}`;
  }

  private distance(a: [number, number], b: [number, number]): number {
    const dx = a[0] - b[0];
    const dy = a[1] - b[1];
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Coastline identification and smoothing based on hex adjacency.
   * Marks land cells adjacent to ocean as coast and assigns coastDepth.
   */
  private identifyCoastlines(cells: PerilousHexCell[]): void {
    // First pass: mark direct coast (land with ocean neighbor)
    for (const cell of cells) {
      if (!cell.isLand) {
        cell.isCoast = false;
        cell.coastDepth = 0;
        continue;
      }

      const hasOceanNeighbor = cell.neighbors.some((ni) => {
        const n = cells[ni];
        return n && n.biome === "ocean";
      });

      cell.isCoast = hasOceanNeighbor;
      cell.coastDepth = hasOceanNeighbor ? 1 : 0;
    }

    // Second pass: assign coastDepth via BFS from coast
    const queue: number[] = [];
    for (let i = 0; i < cells.length; i++) {
      if (cells[i].coastDepth === 1) queue.push(i);
    }

    while (queue.length > 0) {
      const ci = queue.shift()!;
      const cur = cells[ci];
      for (const ni of cur.neighbors) {
        const n = cells[ni];
        if (n && n.isLand && n.coastDepth === 0) {
          n.coastDepth = cur.coastDepth + 1;
          queue.push(ni);
        }
      }
    }

    // Optional: smooth shallow water near coast
    for (const cell of cells) {
      if (cell.biome === "shallow") continue;
      if (cell.biome === "ocean") {
        const nearShallowOrLand = cell.neighbors.some((ni) => {
          const n = cells[ni];
          return n && (n.biome === "shallow" || n.isLand);
        });
        if (nearShallowOrLand) {
          cell.biome = "shallow";
        }
      }
    }
  }
}
