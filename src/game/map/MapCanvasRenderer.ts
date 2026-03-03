import type { MapData, MapCell } from "./MapGenerator";
import { Biome } from "./MapGenerator";

// Fantasy hand-drawn map style colors — muted parchment palette matching reference
const LAND_COLORS: Record<Biome, string> = {
  [Biome.DEEP_WATER]: "#8494a8",
  [Biome.SHALLOW_WATER]: "#97a8b8",
  [Biome.BEACH]: "#ccc5a4",
  [Biome.PLAINS]: "#c2b88a",
  [Biome.GRASSLAND]: "#aaa66e",
  [Biome.FOREST]: "#7a8a52",
  [Biome.DENSE_FOREST]: "#3e4e2a",
  [Biome.DESERT]: "#ccc088",
  [Biome.MOUNTAIN]: "#b0a680",
  [Biome.SNOW]: "#c8c4b4",
};

const WATER_DEEP = "#7888a0";
const WATER_MID = "#8a9aae";
const WATER_SHORE = "#a0b0c0";
const WATER_NEAR = "#b0bcc8";
const PARCHMENT_BG = "#cec5ac";

export class MapCanvasRenderer {
  private mapData: MapData;
  private canvas: OffscreenCanvas | HTMLCanvasElement;
  private ctx: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D;
  private resolution: number;
  private scale: number;
  private baseImageData: ImageData | null = null;
  private coastPaths: [number, number][][] | null = null;

  constructor(mapData: MapData, resolution = 2048) {
    this.mapData = mapData;
    this.resolution = resolution;
    this.scale = resolution / Math.max(mapData.width, mapData.height);

    if (typeof OffscreenCanvas !== "undefined") {
      this.canvas = new OffscreenCanvas(resolution, resolution);
      this.ctx = this.canvas.getContext("2d")!;
    } else {
      const c = document.createElement("canvas");
      c.width = resolution;
      c.height = resolution;
      this.canvas = c;
      this.ctx = c.getContext("2d")!;
    }
  }

  render(): HTMLCanvasElement | OffscreenCanvas {
    const ctx = this.ctx;

    // 1. Parchment background
    ctx.fillStyle = PARCHMENT_BG;
    ctx.fillRect(0, 0, this.resolution, this.resolution);

    // 2. Draw water cells
    this.drawWaterCells();

    // 3. Smooth coastline glow (light halo spreading into water)
    this.drawCoastalShading();

    // 4. Fill land mass using smooth coastline paths
    this.drawLandMass();

    // 5. Draw biome colors clipped to smooth coastline
    this.drawLandCells();

    // 6. Draw coastline dark border
    this.drawCoastlines();

    // 7. Draw biome decorations (mountains, trees, hatching)
    this.drawBiomeDecorations();

    // 8. Draw rivers
    this.drawRivers();

    // 9. Draw Voronoi grid (very subtle)
    this.drawSubtleGrid();

    // 10. Add parchment vignette overlay
    this.drawVignette();

    return this.canvas;
  }

  getCanvas(): HTMLCanvasElement | OffscreenCanvas {
    return this.canvas;
  }

  /** Re-render overlays on top of cached base map */
  renderWithOverlays(options: {
    showGrid?: boolean;
    selectedCellIndex?: number;
  }): HTMLCanvasElement | OffscreenCanvas {
    // Render base once and cache
    if (!this.baseImageData) {
      this.render();
      this.baseImageData = this.ctx.getImageData(0, 0, this.resolution, this.resolution);
    } else {
      // Restore cached base
      this.ctx.putImageData(this.baseImageData, 0, 0);
    }

    // Visible grid
    if (options.showGrid) {
      this.drawVisibleGrid();
    }

    // Cell highlight
    if (options.selectedCellIndex != null && options.selectedCellIndex >= 0) {
      this.drawCellHighlight(options.selectedCellIndex);
    }

    return this.canvas;
  }

  drawVisibleGrid(): void {
    const ctx = this.ctx;

    ctx.save();
    ctx.strokeStyle = "rgba(60, 55, 40, 0.35)";
    ctx.lineWidth = 0.8;
    ctx.lineJoin = "round";

    for (const cell of this.mapData.cells) {
      const poly = cell.polygon;
      if (!poly || poly.length < 3) continue;

      ctx.beginPath();
      ctx.moveTo(this.toX(poly[0][0]), this.toY(poly[0][1]));
      for (let i = 1; i < poly.length; i++) {
        ctx.lineTo(this.toX(poly[i][0]), this.toY(poly[i][1]));
      }
      ctx.closePath();
      ctx.stroke();
    }

    ctx.restore();
  }

  drawCellHighlight(cellIndex: number): void {
    const cell = this.mapData.cells[cellIndex];
    if (!cell) return;

    const poly = cell.polygon;
    if (!poly || poly.length < 3) return;

    const ctx = this.ctx;

    // Semi-transparent fill
    ctx.save();
    ctx.fillStyle = "rgba(255, 220, 80, 0.25)";
    ctx.beginPath();
    ctx.moveTo(this.toX(poly[0][0]), this.toY(poly[0][1]));
    for (let i = 1; i < poly.length; i++) {
      ctx.lineTo(this.toX(poly[i][0]), this.toY(poly[i][1]));
    }
    ctx.closePath();
    ctx.fill();

    // Bright border
    ctx.strokeStyle = "#ffcc20";
    ctx.lineWidth = 2.5;
    ctx.lineJoin = "round";
    ctx.stroke();
    ctx.restore();
  }

  /** Find which cell contains the given map-space coordinate */
  findCellAt(mapX: number, mapY: number): number {
    let bestIdx = -1;
    let bestDist = Infinity;

    for (const cell of this.mapData.cells) {
      const dx = cell.centroid[0] - mapX;
      const dy = cell.centroid[1] - mapY;
      const dist = dx * dx + dy * dy;
      if (dist < bestDist) {
        bestDist = dist;
        bestIdx = cell.index;
      }
    }

    if (bestIdx >= 0) {
      const cell = this.mapData.cells[bestIdx];
      if (this.pointInPolygon(mapX, mapY, cell.polygon)) {
        return bestIdx;
      }
      for (const ni of cell.neighbors) {
        if (ni < this.mapData.cells.length) {
          const neighbor = this.mapData.cells[ni];
          if (this.pointInPolygon(mapX, mapY, neighbor.polygon)) {
            return ni;
          }
        }
      }
    }

    return bestIdx;
  }

  private pointInPolygon(
    x: number,
    y: number,
    polygon: [number, number][]
  ): boolean {
    let inside = false;
    const n = polygon.length;
    for (let i = 0, j = n - 1; i < n; j = i++) {
      const xi = polygon[i][0], yi = polygon[i][1];
      const xj = polygon[j][0], yj = polygon[j][1];
      if (
        yi > y !== yj > y &&
        x < ((xj - xi) * (y - yi)) / (yj - yi) + xi
      ) {
        inside = !inside;
      }
    }
    return inside;
  }

  private toX(x: number): number {
    return x * this.scale;
  }

  private toY(y: number): number {
    return y * this.scale;
  }

  /** Chaikin corner-cutting: round polygon corners for organic look */
  private smoothPoly(poly: [number, number][], iterations = 2): [number, number][] {
    let pts = poly;
    for (let iter = 0; iter < iterations; iter++) {
      const out: [number, number][] = [];
      const n = pts.length;
      for (let i = 0; i < n; i++) {
        const cur = pts[i];
        const nxt = pts[(i + 1) % n];
        out.push([cur[0] * 0.75 + nxt[0] * 0.25, cur[1] * 0.75 + nxt[1] * 0.25]);
        out.push([cur[0] * 0.25 + nxt[0] * 0.75, cur[1] * 0.25 + nxt[1] * 0.75]);
      }
      pts = out;
    }
    return pts;
  }

  /** Trace a smoothed polygon path (does not fill/stroke — caller decides) */
  private traceSmoothPoly(poly: [number, number][]): void {
    const ctx = this.ctx;
    const sm = this.smoothPoly(poly);
    if (sm.length < 3) return;
    ctx.beginPath();
    ctx.moveTo(this.toX(sm[0][0]), this.toY(sm[0][1]));
    for (let i = 1; i < sm.length; i++) {
      ctx.lineTo(this.toX(sm[i][0]), this.toY(sm[i][1]));
    }
    ctx.closePath();
  }

  /** Get cached smooth coastline paths (builds on first call) */
  private getCoastPaths(): [number, number][][] {
    if (this.coastPaths) return this.coastPaths;
    this.coastPaths = this.buildCoastPaths();
    return this.coastPaths;
  }

  /** Extract land-water boundary edges, chain into loops, smooth */
  private buildCoastPaths(): [number, number][][] {
    const cells = this.mapData.cells;
    const vtxKey = (x: number, y: number) =>
      `${Math.round(x * 100)},${Math.round(y * 100)}`;

    // Map vertex → cell indices
    const vtxCells = new Map<string, number[]>();
    for (const cell of cells) {
      if (!cell.polygon) continue;
      for (const [x, y] of cell.polygon) {
        const k = vtxKey(x, y);
        let arr = vtxCells.get(k);
        if (!arr) { arr = []; vtxCells.set(k, arr); }
        arr.push(cell.index);
      }
    }

    // Collect boundary edges (land cell edge facing water or map edge)
    interface BEdge {
      a: [number, number]; b: [number, number];
      ak: string; bk: string;
    }
    const edges: BEdge[] = [];

    for (const cell of cells) {
      if (!cell.isLand) continue;
      const poly = cell.polygon;
      if (!poly || poly.length < 3) continue;

      for (let i = 0; i < poly.length; i++) {
        const a = poly[i];
        const b = poly[(i + 1) % poly.length];
        const ak = vtxKey(a[0], a[1]);
        const bk = vtxKey(b[0], b[1]);

        // Find the OTHER cell sharing this edge
        const aCells = vtxCells.get(ak) || [];
        const bSet = new Set(vtxCells.get(bk) || []);
        let otherIdx = -1;
        for (const ci of aCells) {
          if (ci !== cell.index && bSet.has(ci)) { otherIdx = ci; break; }
        }

        // Boundary if neighbor is water or doesn't exist (map edge)
        if (otherIdx === -1 || !cells[otherIdx].isLand) {
          edges.push({ a, b, ak, bk });
        }
      }
    }

    // Build adjacency: vertex → edges
    const adj = new Map<string, BEdge[]>();
    for (const e of edges) {
      let ea = adj.get(e.ak); if (!ea) { ea = []; adj.set(e.ak, ea); } ea.push(e);
      let eb = adj.get(e.bk); if (!eb) { eb = []; adj.set(e.bk, eb); } eb.push(e);
    }

    // Chain edges into ordered loops
    const used = new Set<BEdge>();
    const paths: [number, number][][] = [];

    for (const startEdge of edges) {
      if (used.has(startEdge)) continue;
      used.add(startEdge);

      const path: [number, number][] = [startEdge.a, startEdge.b];
      let curKey = startEdge.bk;

      // Walk forward
      for (;;) {
        const neighbors = adj.get(curKey);
        if (!neighbors) break;
        const next = neighbors.find(e => !used.has(e));
        if (!next) break;
        used.add(next);

        const isA = next.ak === curKey;
        path.push(isA ? next.b : next.a);
        curKey = isA ? next.bk : next.ak;
      }

      if (path.length >= 3) {
        paths.push(this.smoothPoly(path, 3));
      }
    }

    return paths;
  }

  /** Trace a single coastline path on canvas (beginPath + closePath) */
  private traceCoastPath(path: [number, number][]): void {
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.moveTo(this.toX(path[0][0]), this.toY(path[0][1]));
    for (let i = 1; i < path.length; i++) {
      ctx.lineTo(this.toX(path[i][0]), this.toY(path[i][1]));
    }
    ctx.closePath();
  }

  private drawWaterCells(): void {
    const ctx = this.ctx;

    for (const cell of this.mapData.cells) {
      if (cell.isLand) continue;

      const poly = cell.polygon;
      if (!poly || poly.length < 3) continue;

      // Depth-based water color with smoother gradient
      const depth = Math.abs(cell.elevation);
      const t = Math.min(depth / 0.35, 1);
      let color: string;
      if (t < 0.3) {
        color = this.lerpColor(WATER_NEAR, WATER_SHORE, t / 0.3);
      } else if (t < 0.6) {
        color = this.lerpColor(WATER_SHORE, WATER_MID, (t - 0.3) / 0.3);
      } else {
        color = this.lerpColor(WATER_MID, WATER_DEEP, (t - 0.6) / 0.4);
      }
      ctx.fillStyle = color;
      this.traceSmoothPoly(poly);
      ctx.fill();
    }

    // Horizontal wave texture lines in deep water
    ctx.save();
    ctx.lineCap = "round";
    for (const cell of this.mapData.cells) {
      if (cell.isLand) continue;
      const depth = Math.abs(cell.elevation);
      if (depth < 0.08) continue; // skip near-shore

      const cx = this.toX(cell.centroid[0]);
      const cy = this.toY(cell.centroid[1]);
      const opacity = Math.min(depth / 0.3, 1) * 0.15;
      ctx.strokeStyle = `rgba(90, 105, 125, ${opacity})`;
      ctx.lineWidth = 0.6;

      // 2-4 short horizontal dashes
      const count = 2 + Math.floor(Math.random() * 3);
      for (let i = 0; i < count; i++) {
        const ox = (Math.random() - 0.5) * 12;
        const oy = (Math.random() - 0.5) * 8;
        const len = 3 + Math.random() * 6;
        ctx.beginPath();
        ctx.moveTo(cx + ox - len / 2, cy + oy);
        ctx.lineTo(cx + ox + len / 2, cy + oy);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  /** Fill land mass base color using smooth coastline outline */
  private drawLandMass(): void {
    const ctx = this.ctx;
    const paths = this.getCoastPaths();

    ctx.fillStyle = PARCHMENT_BG;
    for (const path of paths) {
      this.traceCoastPath(path);
      ctx.fill();
    }
  }

  /** Draw biome colors inside land, clipped to smooth coastline */
  private drawLandCells(): void {
    const ctx = this.ctx;
    const paths = this.getCoastPaths();

    // Clip to smooth coastline outline
    ctx.save();
    ctx.beginPath();
    for (const path of paths) {
      ctx.moveTo(this.toX(path[0][0]), this.toY(path[0][1]));
      for (let i = 1; i < path.length; i++) {
        ctx.lineTo(this.toX(path[i][0]), this.toY(path[i][1]));
      }
      ctx.closePath();
    }
    ctx.clip();

    // Draw biome cells (edges clipped to smooth coast)
    for (const cell of this.mapData.cells) {
      if (!cell.isLand) continue;
      const poly = cell.polygon;
      if (!poly || poly.length < 3) continue;

      ctx.fillStyle = LAND_COLORS[cell.biome] || PARCHMENT_BG;
      ctx.beginPath();
      ctx.moveTo(this.toX(poly[0][0]), this.toY(poly[0][1]));
      for (let i = 1; i < poly.length; i++) {
        ctx.lineTo(this.toX(poly[i][0]), this.toY(poly[i][1]));
      }
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore(); // removes clip
  }

  /** Smooth coastal glow — strokes smooth coastline paths at decreasing widths */
  private drawCoastalShading(): void {
    const ctx = this.ctx;
    const paths = this.getCoastPaths();

    ctx.save();
    ctx.lineJoin = "round";
    ctx.lineCap = "round";

    // Wide → narrow, light → denser — creates smooth concentric halo in water
    const passes: [string, number][] = [
      ["rgba(200, 198, 185, 0.06)", 36],
      ["rgba(195, 194, 182, 0.08)", 30],
      ["rgba(190, 190, 178, 0.10)", 25],
      ["rgba(186, 186, 174, 0.12)", 20],
      ["rgba(182, 182, 170, 0.14)", 16],
      ["rgba(178, 178, 166, 0.16)", 12],
      ["rgba(174, 174, 162, 0.18)", 9],
      ["rgba(170, 170, 158, 0.20)", 6],
    ];

    for (const [color, width] of passes) {
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      for (const path of paths) {
        this.traceCoastPath(path);
        ctx.stroke();
      }
    }

    ctx.restore();
  }

  /** Dark border stroke on smooth coastline paths */
  private drawCoastlines(): void {
    const ctx = this.ctx;
    const paths = this.getCoastPaths();

    ctx.save();
    ctx.lineJoin = "round";
    ctx.lineCap = "round";

    // Soft shadow
    ctx.strokeStyle = "rgba(50, 48, 35, 0.20)";
    ctx.lineWidth = 4;
    for (const path of paths) {
      this.traceCoastPath(path);
      ctx.stroke();
    }

    // Main dark border
    ctx.strokeStyle = "rgba(50, 48, 35, 0.55)";
    ctx.lineWidth = 2;
    for (const path of paths) {
      this.traceCoastPath(path);
      ctx.stroke();
    }

    ctx.restore();
  }

  private drawBiomeDecorations(): void {
    for (const cell of this.mapData.cells) {
      if (!cell.isLand) continue;

      switch (cell.biome) {
        case Biome.MOUNTAIN:
        case Biome.SNOW:
          this.drawMountains(cell);
          break;
        case Biome.FOREST:
          this.drawTrees(cell, false);
          break;
        case Biome.DENSE_FOREST:
          this.drawTrees(cell, true);
          break;
        case Biome.PLAINS:
        case Biome.GRASSLAND:
          this.drawGrassHatch(cell);
          break;
        case Biome.DESERT:
          this.drawDesertDots(cell);
          break;
        case Biome.BEACH:
          this.drawBeachDots(cell);
          break;
      }
    }
  }

  private drawMountains(cell: MapCell): void {
    const ctx = this.ctx;
    const cx = this.toX(cell.centroid[0]);
    const cy = this.toY(cell.centroid[1]);
    const isSnow = cell.biome === Biome.SNOW;
    const elev = cell.elevation;

    // Size scales with elevation
    const sizeScale = 0.7 + elev * 1.5;
    const count = 2 + Math.floor(Math.random() * 2);

    for (let i = 0; i < count; i++) {
      const ox = (Math.random() - 0.5) * 14 * sizeScale;
      const oy = (Math.random() - 0.5) * 8 * sizeScale;
      const h = (10 + Math.random() * 10) * sizeScale;
      const wL = (5 + Math.random() * 4) * sizeScale; // left width
      const wR = (4 + Math.random() * 3) * sizeScale; // right width (narrower = asymmetric)

      const px = cx + ox;
      const py = cy + oy;
      const baseY = py + 2;

      // Light side (left face)
      ctx.beginPath();
      ctx.moveTo(px, py - h);
      ctx.lineTo(px - wL, baseY);
      ctx.lineTo(px, baseY - 1);
      ctx.closePath();
      ctx.fillStyle = isSnow ? "#c5c0af" : "#b5ab8a";
      ctx.fill();

      // Shadow side (right face) — darker
      ctx.beginPath();
      ctx.moveTo(px, py - h);
      ctx.lineTo(px + wR, baseY);
      ctx.lineTo(px, baseY - 1);
      ctx.closePath();
      ctx.fillStyle = isSnow ? "#a09a88" : "#8a8068";
      ctx.fill();

      // Outline
      ctx.beginPath();
      ctx.moveTo(px - wL, baseY);
      ctx.lineTo(px, py - h);
      ctx.lineTo(px + wR, baseY);
      ctx.strokeStyle = "#4a4538";
      ctx.lineWidth = 0.9;
      ctx.stroke();

      // Shadow hatching on right face (diagonal lines)
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(px, py - h);
      ctx.lineTo(px + wR, baseY);
      ctx.lineTo(px, baseY - 1);
      ctx.closePath();
      ctx.clip();

      ctx.strokeStyle = "rgba(55, 50, 38, 0.35)";
      ctx.lineWidth = 0.6;
      const hatchCount = Math.floor(h / 2);
      for (let line = 0; line < hatchCount; line++) {
        const t = (line + 0.5) / hatchCount;
        const ly = py - h + h * t;
        const lxStart = px + wR * t * 0.3;
        const lxEnd = px + wR * t * 0.95;
        ctx.beginPath();
        ctx.moveTo(lxStart, ly);
        ctx.lineTo(lxEnd, ly + 1.2);
        ctx.stroke();
      }
      ctx.restore();

      // Snow cap
      if (isSnow || elev > 0.5 || Math.random() > 0.5) {
        const capH = h * (isSnow ? 0.45 : 0.3);
        const capT = capH / h;
        ctx.beginPath();
        ctx.moveTo(px, py - h);
        ctx.lineTo(px - wL * capT * 0.9, py - h + capH);
        ctx.lineTo(px + wR * capT * 0.7, py - h + capH);
        ctx.closePath();
        ctx.fillStyle = isSnow ? "#e5e0d5" : "#ddd8c8";
        ctx.fill();
      }
    }
  }

  private drawTrees(cell: MapCell, dense: boolean): void {
    const ctx = this.ctx;
    const cx = this.toX(cell.centroid[0]);
    const cy = this.toY(cell.centroid[1]);

    if (dense) {
      // Dense forest: packed dark conifer silhouettes
      const count = 5 + Math.floor(Math.random() * 5);
      for (let i = 0; i < count; i++) {
        const ox = (Math.random() - 0.5) * 14;
        const oy = (Math.random() - 0.5) * 10;
        const px = cx + ox;
        const py = cy + oy;
        const h = 6 + Math.random() * 6;
        const w = 2.5 + Math.random() * 2;

        // Multi-layer conifer silhouette (3 overlapping triangles)
        const darkFill = `rgba(${35 + Math.floor(Math.random() * 20)}, ${50 + Math.floor(Math.random() * 15)}, ${25 + Math.floor(Math.random() * 10)}, 0.9)`;
        ctx.fillStyle = darkFill;

        for (let layer = 0; layer < 3; layer++) {
          const layerH = h * (0.5 + layer * 0.2);
          const layerW = w * (0.6 + layer * 0.25);
          const layerY = py - h + layer * h * 0.25;
          ctx.beginPath();
          ctx.moveTo(px, layerY);
          ctx.lineTo(px - layerW, layerY + layerH * 0.45);
          ctx.lineTo(px + layerW, layerY + layerH * 0.45);
          ctx.closePath();
          ctx.fill();
        }

        // Tiny trunk
        ctx.fillStyle = "#3a3520";
        ctx.fillRect(px - 0.4, py + 1, 0.8, 1.5);
      }
    } else {
      // Regular forest: round blob deciduous trees
      const count = 3 + Math.floor(Math.random() * 3);
      for (let i = 0; i < count; i++) {
        const ox = (Math.random() - 0.5) * 12;
        const oy = (Math.random() - 0.5) * 10;
        const px = cx + ox;
        const py = cy + oy;
        const r = 3 + Math.random() * 3;

        // Tree shadow
        ctx.beginPath();
        ctx.arc(px + 0.8, py - r + 0.8, r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(50, 60, 30, 0.2)";
        ctx.fill();

        // Tree crown — round blob
        ctx.beginPath();
        ctx.arc(px, py - r, r, 0, Math.PI * 2);
        ctx.fillStyle = `rgb(${85 + Math.floor(Math.random() * 25)}, ${105 + Math.floor(Math.random() * 20)}, ${55 + Math.floor(Math.random() * 20)})`;
        ctx.fill();

        // Outline
        ctx.strokeStyle = "rgba(45, 55, 28, 0.5)";
        ctx.lineWidth = 0.6;
        ctx.stroke();

        // Trunk
        ctx.fillStyle = "#6a5a40";
        ctx.fillRect(px - 0.6, py - 1, 1.2, 2.5);
      }
    }
  }

  private drawGrassHatch(cell: MapCell): void {
    const ctx = this.ctx;
    const cx = this.toX(cell.centroid[0]);
    const cy = this.toY(cell.centroid[1]);

    ctx.save();

    // Parallel horizontal hatching lines (like reference)
    const isPlains = cell.biome === Biome.PLAINS;
    ctx.strokeStyle = isPlains
      ? "rgba(100, 95, 70, 0.15)"
      : "rgba(85, 90, 55, 0.18)";
    ctx.lineWidth = 0.5;

    const lineCount = 3 + Math.floor(Math.random() * 4);
    const spread = 8;
    const baseAngle = (Math.random() - 0.5) * 0.2; // slight random tilt

    for (let i = 0; i < lineCount; i++) {
      const oy = (i - lineCount / 2) * (spread / lineCount);
      const len = 4 + Math.random() * 6;
      const ox = (Math.random() - 0.5) * 4;
      ctx.beginPath();
      ctx.moveTo(cx + ox - len / 2, cy + oy + Math.sin(baseAngle) * len / 2);
      ctx.lineTo(cx + ox + len / 2, cy + oy - Math.sin(baseAngle) * len / 2);
      ctx.stroke();
    }

    ctx.restore();
  }

  private drawDesertDots(cell: MapCell): void {
    const ctx = this.ctx;
    const cx = this.toX(cell.centroid[0]);
    const cy = this.toY(cell.centroid[1]);

    ctx.fillStyle = "rgba(160, 140, 90, 0.3)";
    const dots = 3 + Math.floor(Math.random() * 4);
    for (let i = 0; i < dots; i++) {
      const ox = (Math.random() - 0.5) * 10;
      const oy = (Math.random() - 0.5) * 8;
      ctx.beginPath();
      ctx.arc(cx + ox, cy + oy, 0.5 + Math.random(), 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private drawBeachDots(cell: MapCell): void {
    const ctx = this.ctx;
    const cx = this.toX(cell.centroid[0]);
    const cy = this.toY(cell.centroid[1]);

    ctx.fillStyle = "rgba(180, 170, 130, 0.25)";
    const dots = 2 + Math.floor(Math.random() * 3);
    for (let i = 0; i < dots; i++) {
      const ox = (Math.random() - 0.5) * 8;
      const oy = (Math.random() - 0.5) * 6;
      ctx.beginPath();
      ctx.arc(cx + ox, cy + oy, 0.3 + Math.random() * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private drawRivers(): void {
    const ctx = this.ctx;
    const { rivers, cells } = this.mapData;

    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    for (const river of rivers) {
      if (river.length < 2) continue;

      const points: [number, number][] = [];
      for (const cellIdx of river) {
        if (cellIdx >= cells.length) continue;
        const cell = cells[cellIdx];
        if (!cell) continue;
        points.push([this.toX(cell.centroid[0]), this.toY(cell.centroid[1])]);
      }

      if (points.length < 2) continue;

      // Draw river with varying width (thin at source, wide at mouth)
      for (let pass = 0; pass < 2; pass++) {
        ctx.beginPath();
        ctx.moveTo(points[0][0], points[0][1]);

        // Smooth curve through points
        for (let i = 1; i < points.length - 1; i++) {
          const mx = (points[i][0] + points[i + 1][0]) / 2;
          const my = (points[i][1] + points[i + 1][1]) / 2;
          ctx.quadraticCurveTo(points[i][0], points[i][1], mx, my);
        }
        ctx.lineTo(points[points.length - 1][0], points[points.length - 1][1]);

        if (pass === 0) {
          // Outer stroke (darker border)
          ctx.strokeStyle = "#4a6070";
          ctx.lineWidth = 3;
        } else {
          // Inner stroke (lighter fill)
          ctx.strokeStyle = "#6a8ca0";
          ctx.lineWidth = 1.5;
        }
        ctx.stroke();
      }
    }

    ctx.restore();
  }

  private drawSubtleGrid(): void {
    const ctx = this.ctx;

    ctx.save();
    ctx.strokeStyle = "rgba(90, 85, 70, 0.06)";
    ctx.lineWidth = 0.3;

    for (const cell of this.mapData.cells) {
      if (!cell.isLand) continue;
      const poly = cell.polygon;
      if (!poly || poly.length < 3) continue;

      ctx.beginPath();
      ctx.moveTo(this.toX(poly[0][0]), this.toY(poly[0][1]));
      for (let i = 1; i < poly.length; i++) {
        ctx.lineTo(this.toX(poly[i][0]), this.toY(poly[i][1]));
      }
      ctx.closePath();
      ctx.stroke();
    }

    ctx.restore();
  }

  private drawVignette(): void {
    const ctx = this.ctx;
    const r = this.resolution;

    // Radial gradient overlay for parchment vignette
    const gradient = ctx.createRadialGradient(r / 2, r / 2, r * 0.3, r / 2, r / 2, r * 0.7);
    gradient.addColorStop(0, "rgba(0, 0, 0, 0)");
    gradient.addColorStop(1, "rgba(50, 42, 28, 0.18)");

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, r, r);

    // Border frame — thick black outline like reference
    ctx.strokeStyle = "#1a1a1a";
    ctx.lineWidth = 8;
    ctx.strokeRect(4, 4, r - 8, r - 8);
    ctx.strokeStyle = "#3a3530";
    ctx.lineWidth = 2;
    ctx.strokeRect(14, 14, r - 28, r - 28);

    // Compass rose in bottom-right
    this.drawCompassRose(r * 0.88, r * 0.88, r * 0.055);
  }

  private drawCompassRose(cx: number, cy: number, size: number): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(cx, cy);

    // Outer circle
    ctx.beginPath();
    ctx.arc(0, 0, size, 0, Math.PI * 2);
    ctx.strokeStyle = "#6a6050";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Inner circle
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.85, 0, Math.PI * 2);
    ctx.lineWidth = 0.8;
    ctx.stroke();

    // 8 directional rays
    const directions = 8;
    for (let i = 0; i < directions; i++) {
      const angle = (i * Math.PI * 2) / directions - Math.PI / 2;
      const isPrimary = i % 2 === 0;
      const len = isPrimary ? size * 0.95 : size * 0.55;
      const w = isPrimary ? size * 0.18 : size * 0.1;

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(
        Math.cos(angle - 0.15) * w,
        Math.sin(angle - 0.15) * w
      );
      ctx.lineTo(Math.cos(angle) * len, Math.sin(angle) * len);
      ctx.lineTo(
        Math.cos(angle + 0.15) * w,
        Math.sin(angle + 0.15) * w
      );
      ctx.closePath();

      // Alternate light/dark halves
      ctx.fillStyle = i % 2 === 0 ? "#8a7e60" : "#b8a880";
      ctx.fill();
      ctx.strokeStyle = "#5a5040";
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }

    // Center dot
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.08, 0, Math.PI * 2);
    ctx.fillStyle = "#8a7e60";
    ctx.fill();

    ctx.restore();
  }

  // Utility: linear interpolation between two hex colors
  private lerpColor(a: string, b: string, t: number): string {
    const ar = parseInt(a.slice(1, 3), 16);
    const ag = parseInt(a.slice(3, 5), 16);
    const ab = parseInt(a.slice(5, 7), 16);
    const br = parseInt(b.slice(1, 3), 16);
    const bg = parseInt(b.slice(3, 5), 16);
    const bb = parseInt(b.slice(5, 7), 16);

    const rr = Math.round(ar + (br - ar) * t);
    const rg = Math.round(ag + (bg - ag) * t);
    const rb = Math.round(ab + (bb - ab) * t);

    return `rgb(${rr}, ${rg}, ${rb})`;
  }
}
