import { Delaunay } from "d3-delaunay";
import { createNoise2D, type NoiseFunction2D } from "simplex-noise";

export enum Biome {
  DEEP_WATER = "deep_water",
  SHALLOW_WATER = "shallow_water",
  BEACH = "beach",
  PLAINS = "plains",
  GRASSLAND = "grassland",
  FOREST = "forest",
  DENSE_FOREST = "dense_forest",
  DESERT = "desert",
  MOUNTAIN = "mountain",
  SNOW = "snow",
}

export interface MapCell {
  index: number;
  centroid: [number, number];
  elevation: number;
  moisture: number;
  biome: Biome;
  isLand: boolean;
  neighbors: number[];
  polygon: [number, number][];
}

export interface MapData {
  cells: MapCell[];
  width: number;
  height: number;
  rivers: number[][];
}

export interface MapGenConfig {
  width: number;
  height: number;
  cellCount: number;
  seaLevel: number;
  lloydIterations: number;
  riverCount: number;
}

const DEFAULT_CONFIG: MapGenConfig = {
  width: 200,
  height: 200,
  cellCount: 1500,
  seaLevel: 0.05,
  lloydIterations: 2,
  riverCount: 8,
};

export class MapGenerator {
  private config: MapGenConfig;
  private noise2D: NoiseFunction2D;
  private moistureNoise: NoiseFunction2D;

  constructor(config?: Partial<MapGenConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.noise2D = createNoise2D();
    this.moistureNoise = createNoise2D();
  }

  generate(): MapData {
    let points = this.generatePoints();
    points = this.lloydRelax(points, this.config.lloydIterations);

    const delaunay = Delaunay.from(points);
    const voronoi = delaunay.voronoi([0, 0, this.config.width, this.config.height]);

    const cells: MapCell[] = [];
    for (let i = 0; i < points.length; i++) {
      const polygon = voronoi.cellPolygon(i);
      if (!polygon) continue;

      const cx = points[i][0];
      const cy = points[i][1];

      const elevation = this.getElevation(cx, cy);
      const moisture = this.getMoisture(cx, cy);
      const isLand = elevation > this.config.seaLevel;
      const biome = this.getBiome(elevation, moisture, isLand);

      const neighbors: number[] = [];
      for (const j of delaunay.neighbors(i)) {
        neighbors.push(j);
      }

      cells.push({
        index: i,
        centroid: [cx, cy],
        elevation,
        moisture,
        biome,
        isLand,
        neighbors,
        polygon: polygon as [number, number][],
      });
    }

    const rivers = this.generateRivers(cells);

    return {
      cells,
      width: this.config.width,
      height: this.config.height,
      rivers,
    };
  }

  private generatePoints(): [number, number][] {
    const { width, height, cellCount } = this.config;
    const points: [number, number][] = [];
    for (let i = 0; i < cellCount; i++) {
      points.push([Math.random() * width, Math.random() * height]);
    }
    return points;
  }

  private lloydRelax(
    points: [number, number][],
    iterations: number
  ): [number, number][] {
    const { width, height } = this.config;
    let current = points;

    for (let iter = 0; iter < iterations; iter++) {
      const delaunay = Delaunay.from(current);
      const voronoi = delaunay.voronoi([0, 0, width, height]);
      const newPoints: [number, number][] = [];

      for (let i = 0; i < current.length; i++) {
        const polygon = voronoi.cellPolygon(i);
        if (!polygon) {
          newPoints.push(current[i]);
          continue;
        }
        const centroid = this.computeCentroid(polygon as [number, number][]);
        newPoints.push(centroid);
      }

      current = newPoints;
    }

    return current;
  }

  private computeCentroid(polygon: [number, number][]): [number, number] {
    let cx = 0;
    let cy = 0;
    let area = 0;

    for (let i = 0; i < polygon.length - 1; i++) {
      const [x0, y0] = polygon[i];
      const [x1, y1] = polygon[i + 1];
      const cross = x0 * y1 - x1 * y0;
      area += cross;
      cx += (x0 + x1) * cross;
      cy += (y0 + y1) * cross;
    }

    area /= 2;
    if (Math.abs(area) < 1e-10) {
      const avgX = polygon.reduce((s, p) => s + p[0], 0) / polygon.length;
      const avgY = polygon.reduce((s, p) => s + p[1], 0) / polygon.length;
      return [avgX, avgY];
    }

    cx /= 6 * area;
    cy /= 6 * area;
    return [cx, cy];
  }

  private getElevation(x: number, y: number): number {
    const { width, height } = this.config;

    let e = 0;
    e += 1.0 * this.noise2D(x / 120, y / 120);
    e += 0.5 * this.noise2D(x / 60, y / 60);
    e += 0.25 * this.noise2D(x / 30, y / 30);
    e += 0.125 * this.noise2D(x / 15, y / 15);
    e /= 1.875;

    // Island shape: lower elevation near edges
    const nx = (x / width) * 2 - 1;
    const ny = (y / height) * 2 - 1;
    const distFromCenter = Math.sqrt(nx * nx + ny * ny);
    const islandMask = 1.0 - Math.pow(distFromCenter, 2);
    e = (e + islandMask) / 2;

    return e;
  }

  private getMoisture(x: number, y: number): number {
    let m = 0;
    m += 1.0 * this.moistureNoise(x / 100, y / 100);
    m += 0.5 * this.moistureNoise(x / 50, y / 50);
    m /= 1.5;
    return (m + 1) / 2;
  }

  getBiome(elevation: number, moisture: number, isLand: boolean): Biome {
    if (!isLand) {
      return elevation < -0.2 ? Biome.DEEP_WATER : Biome.SHALLOW_WATER;
    }
    if (elevation > 0.6) return Biome.SNOW;
    if (elevation > 0.45) return Biome.MOUNTAIN;
    if (elevation < 0.1) return Biome.BEACH;

    if (moisture < 0.25) return Biome.DESERT;
    if (moisture < 0.45) return Biome.PLAINS;
    if (moisture < 0.65) return Biome.GRASSLAND;
    if (moisture < 0.8) return Biome.FOREST;
    return Biome.DENSE_FOREST;
  }

  private generateRivers(cells: MapCell[]): number[][] {
    const rivers: number[][] = [];
    const mountainCells = cells
      .filter((c) => c.elevation > 0.4 && c.isLand)
      .sort((a, b) => b.elevation - a.elevation);

    const usedCells = new Set<number>();
    let count = 0;

    for (const start of mountainCells) {
      if (count >= this.config.riverCount) break;
      if (usedCells.has(start.index)) continue;

      const path = this.traceRiver(cells, start, usedCells);
      if (path.length >= 4) {
        rivers.push(path);
        count++;
      }
    }

    return rivers;
  }

  private traceRiver(
    cells: MapCell[],
    start: MapCell,
    usedCells: Set<number>
  ): number[] {
    const path: number[] = [start.index];
    let current = start;
    const visited = new Set<number>([start.index]);

    for (let step = 0; step < 100; step++) {
      if (!current.isLand) break;

      let lowest: MapCell | null = null;
      let lowestElev = current.elevation;

      for (const ni of current.neighbors) {
        if (ni >= cells.length) continue;
        const neighbor = cells[ni];
        if (!neighbor) continue;
        if (visited.has(ni)) continue;
        if (neighbor.elevation < lowestElev) {
          lowestElev = neighbor.elevation;
          lowest = neighbor;
        }
      }

      if (!lowest) break;

      path.push(lowest.index);
      visited.add(lowest.index);
      usedCells.add(lowest.index);
      current = lowest;
    }

    return path;
  }
}
