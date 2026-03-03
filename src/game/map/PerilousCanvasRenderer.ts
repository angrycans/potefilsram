/**
 * Perilous Shores–style hand-drawn map renderer.
 * Borrows color palette and visual style from PerilousJS/Assets/*.json.
 * Renders to an OffscreenCanvas / HTMLCanvasElement for use as a BabylonJS texture.
 */
import type { MapData, MapCell } from "./MapGenerator";
import { Biome } from "./MapGenerator";
import { PerilousNameGenerator } from "./PerilousNameGenerator";
import type { PerilousRenderConfig, PerilousColorTheme } from "./PerilousConfig";
import { THEMES, DEFAULT_RENDER_CONFIG } from "./PerilousConfig";

interface PlaceLabel {
  x: number;
  y: number;
  text: string;
  fontSize: number;
  type: "region" | "mountain" | "forest" | "town" | "river";
}

export class PerilousCanvasRenderer {
  private mapData: MapData;
  private canvas: OffscreenCanvas | HTMLCanvasElement;
  private ctx: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D;
  private resolution: number;
  private scale: number;
  private labels: PlaceLabel[] = [];
  private nameGen = new PerilousNameGenerator();
  private coastPaths: [number, number][][] | null = null;
  private config: PerilousRenderConfig;
  private theme: PerilousColorTheme;

  constructor(mapData: MapData, resolution = 2048, config?: Partial<PerilousRenderConfig>) {
    this.mapData = mapData;
    this.resolution = resolution;
    this.config = { ...DEFAULT_RENDER_CONFIG, ...config };
    this.theme = THEMES[this.config.theme] || THEMES.default;
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
    const cfg = this.config;

    ctx.save();

    // Apply rotation
    if (cfg.rotation !== 0) {
      const cx = this.resolution / 2;
      const cy = this.resolution / 2;
      ctx.translate(cx, cy);
      ctx.rotate((cfg.rotation * Math.PI) / 180);
      ctx.translate(-cx, -cy);
    }

    // 1. Parchment background
    const bg = this.theme.background;
    ctx.fillStyle = Array.isArray(bg) ? bg[0] : bg;
    ctx.fillRect(0, 0, this.resolution, this.resolution);

    // 2. Water fill
    this.drawWater();

    // 3. Coastal shading bands
    if (cfg.bandsNumber > 0) this.drawCoastalBands();

    // 4. Land mass fill (smooth coastline)
    this.drawLandMass();

    // 5. Grid overlay (Under layer — drawn before land details)
    if (cfg.gridLayer === "Under") this.drawHexGrid();

    // 5b. Land biome fills (clipped to coast)
    this.drawLandBiomes();

    // 6. Coastline ink border
    this.drawCoastlineInk();

    // 7. Shallow water bands
    if (cfg.showShallowWater) this.drawShallowWater();

    // 8. Hatching shadows on coast
    if (cfg.enumShading === "Hatching") this.drawCoastHatching();

    // 9. Mountain icons
    if (cfg.showMountains) this.drawMountains();

    // 10. Tree icons
    if (cfg.showTrees) this.drawTrees();

    // 11. Rivers
    if (cfg.showRivers) this.drawRivers();

    // 12. Routes / roads
    if (cfg.showRoutes) this.drawRoutes();

    // 13. Town buildings
    if (cfg.showTowns) this.drawTownBuildings();

    // 14. Grass hatching
    if (cfg.showGrass && cfg.enumShading === "Hatching") this.drawGrassHatching();

    // 15. Danger markers
    if (cfg.showDanger) this.drawDangerMarkers();

    // 16. Grid overlay (Above layer — drawn after labels)
    if (cfg.gridLayer === "Above") this.drawHexGrid();

    // 17. Generate & draw labels
    this.generateLabels();
    this.drawLabels();

    // 18. Clouds
    if (cfg.showClouds) this.drawClouds();

    // 19. Compass rose
    if (cfg.showCompass) this.drawCompass();

    // 20. Vignette border
    if (cfg.showBorder) this.drawVignette();

    ctx.restore();

    return this.canvas;
  }

  getCanvas(): HTMLCanvasElement | OffscreenCanvas {
    return this.canvas;
  }

  // --- Coordinate helpers ---
  private toX(x: number): number {
    return x * this.scale;
  }
  private toY(y: number): number {
    return y * this.scale;
  }

  // --- Chaikin smoothing ---
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

  // --- Coast path extraction (reused from MapCanvasRenderer approach) ---
  private getCoastPaths(): [number, number][][] {
    if (this.coastPaths) return this.coastPaths;
    this.coastPaths = this.buildCoastPaths();
    return this.coastPaths;
  }

  private buildCoastPaths(): [number, number][][] {
    const cells = this.mapData.cells;
    const vtxKey = (x: number, y: number) =>
      `${Math.round(x * 100)},${Math.round(y * 100)}`;

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

    interface BEdge { a: [number, number]; b: [number, number]; ak: string; bk: string; }
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

        const aCells = vtxCells.get(ak) || [];
        const bSet = new Set(vtxCells.get(bk) || []);
        let otherIdx = -1;
        for (const ci of aCells) {
          if (ci !== cell.index && bSet.has(ci)) { otherIdx = ci; break; }
        }

        if (otherIdx === -1 || !cells[otherIdx].isLand) {
          edges.push({ a, b, ak, bk });
        }
      }
    }

    const adj = new Map<string, BEdge[]>();
    for (const e of edges) {
      let ea = adj.get(e.ak); if (!ea) { ea = []; adj.set(e.ak, ea); } ea.push(e);
      let eb = adj.get(e.bk); if (!eb) { eb = []; adj.set(e.bk, eb); } eb.push(e);
    }

    const used = new Set<BEdge>();
    const paths: [number, number][][] = [];

    for (const startEdge of edges) {
      if (used.has(startEdge)) continue;
      used.add(startEdge);

      const path: [number, number][] = [startEdge.a, startEdge.b];
      let curKey = startEdge.bk;

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

  private traceCoastPath(path: [number, number][]): void {
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.moveTo(this.toX(path[0][0]), this.toY(path[0][1]));
    for (let i = 1; i < path.length; i++) {
      ctx.lineTo(this.toX(path[i][0]), this.toY(path[i][1]));
    }
    ctx.closePath();
  }

  // --- Drawing methods ---

  private hexToRgb(hex: string): [number, number, number] {
    const h = hex.replace("#", "");
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }

  private drawWater(): void {
    const ctx = this.ctx;
    const bg = this.theme.background;
    const bgColor = Array.isArray(bg) ? bg[0] : bg;
    const waterColor = this.theme.water;
    const bgRgb = this.hexToRgb(bgColor);
    const waterRgb = this.hexToRgb(waterColor);

    for (const cell of this.mapData.cells) {
      if (cell.isLand) continue;
      const poly = cell.polygon;
      if (!poly || poly.length < 3) continue;

      // Depth-based blend: shallow → bgColor, deep → waterColor, then darker
      const depth = Math.abs(cell.elevation);
      const t = Math.min(depth / 0.3, 1);
      const r = Math.round(bgRgb[0] + (waterRgb[0] - bgRgb[0]) * t - t * 20);
      const g = Math.round(bgRgb[1] + (waterRgb[1] - bgRgb[1]) * t - t * 15);
      const b = Math.round(bgRgb[2] + (waterRgb[2] - bgRgb[2]) * t - t * 5);
      ctx.fillStyle = `rgb(${Math.max(0, r)},${Math.max(0, g)},${Math.max(0, b)})`;
      ctx.beginPath();
      ctx.moveTo(this.toX(poly[0][0]), this.toY(poly[0][1]));
      for (let i = 1; i < poly.length; i++) {
        ctx.lineTo(this.toX(poly[i][0]), this.toY(poly[i][1]));
      }
      ctx.closePath();
      ctx.fill();
    }
  }

  private drawCoastalBands(): void {
    const ctx = this.ctx;
    const paths = this.getCoastPaths();
    const shadowRgb = this.hexToRgb(this.theme.landShadow);
    const baseAlpha = this.config.alphaLandShadow;

    ctx.save();
    ctx.lineJoin = "round";
    ctx.lineCap = "round";

    for (let band = this.config.bandsNumber; band >= 1; band--) {
      const width = band * 10;
      const alpha = (baseAlpha * 0.3) + band * (baseAlpha * 0.15);
      ctx.strokeStyle = `rgba(${shadowRgb[0]}, ${shadowRgb[1]}, ${shadowRgb[2]}, ${Math.min(alpha, 0.4)})`;
      ctx.lineWidth = width;
      for (const path of paths) {
        this.traceCoastPath(path);
        ctx.stroke();
      }
    }

    ctx.restore();
  }

  private drawLandMass(): void {
    const ctx = this.ctx;
    const paths = this.getCoastPaths();

    ctx.fillStyle = this.theme.matte;
    for (const path of paths) {
      this.traceCoastPath(path);
      ctx.fill();
    }
  }

  private drawLandBiomes(): void {
    const ctx = this.ctx;
    const paths = this.getCoastPaths();

    // Clip to coast
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

    // Fill biome colors — Perilous uses very muted, close-to-parchment tones
    const biomeColors: Record<string, string> = {
      [Biome.BEACH]: "#EDE6D2",
      [Biome.PLAINS]: "#E8E2CE",
      [Biome.GRASSLAND]: "#DFE0C8",
      [Biome.FOREST]: "#CFD4B5",
      [Biome.DENSE_FOREST]: "#BFC8A8",
      [Biome.DESERT]: "#EDE5C8",
      [Biome.MOUNTAIN]: this.theme.mountain,
      [Biome.SNOW]: "#EAE8E0",
    };

    for (const cell of this.mapData.cells) {
      if (!cell.isLand) continue;
      const poly = cell.polygon;
      if (!poly || poly.length < 3) continue;

      ctx.fillStyle = biomeColors[cell.biome] || this.theme.matte;
      ctx.beginPath();
      ctx.moveTo(this.toX(poly[0][0]), this.toY(poly[0][1]));
      for (let i = 1; i < poly.length; i++) {
        ctx.lineTo(this.toX(poly[i][0]), this.toY(poly[i][1]));
      }
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  }

  private drawCoastlineInk(): void {
    const ctx = this.ctx;
    const paths = this.getCoastPaths();

    ctx.save();
    ctx.lineJoin = "round";
    ctx.lineCap = "round";

    // Soft shadow pass
    ctx.strokeStyle = `rgba(63, 51, 44, ${this.config.alphaLandShadow})`;
    ctx.lineWidth = 3.5;
    for (const path of paths) {
      this.traceCoastPath(path);
      ctx.stroke();
    }

    // Main ink line
    ctx.strokeStyle = this.theme.foreground;
    ctx.lineWidth = 1.4;
    for (const path of paths) {
      this.traceCoastPath(path);
      ctx.stroke();
    }

    ctx.restore();
  }

  private drawCoastHatching(): void {
    const ctx = this.ctx;
    const paths = this.getCoastPaths();

    ctx.save();
    ctx.strokeStyle = `rgba(63, 51, 44, 0.15)`;
    ctx.lineWidth = 0.5;

    // Draw short hatching lines along coast paths on the water side
    for (const path of paths) {
      for (let i = 0; i < path.length; i += 4) {
        const px = this.toX(path[i][0]);
        const py = this.toY(path[i][1]);
        const ni = (i + 1) % path.length;
        const dx = this.toX(path[ni][0]) - px;
        const dy = this.toY(path[ni][1]) - py;
        const len = Math.sqrt(dx * dx + dy * dy);
        if (len < 0.1) continue;

        // Normal pointing outward (into water)
        const nx = -dy / len;
        const ny = dx / len;

        const hatchLen = 4 + Math.random() * 6;
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(px + nx * hatchLen, py + ny * hatchLen);
        ctx.stroke();
      }
    }

    ctx.restore();
  }

  private drawMountains(): void {
    const ctx = this.ctx;
    const mountainCells = this.mapData.cells.filter(
      c => c.isLand && (c.biome === Biome.MOUNTAIN || c.biome === Biome.SNOW)
    );

    ctx.save();
    for (const cell of mountainCells) {
      const cx = this.toX(cell.centroid[0]);
      const cy = this.toY(cell.centroid[1]);

      const baseSize = 6 + cell.elevation * 14;
      const h = baseSize * (1.5 + Math.random() * 0.5);
      const w = baseSize * (0.8 + Math.random() * 0.4);

      // Mountain triangle with Perilous ink style
      ctx.fillStyle = this.theme.mountain;
      ctx.beginPath();
      ctx.moveTo(cx, cy - h);
      ctx.lineTo(cx - w, cy + 2);
      ctx.lineTo(cx + w, cy + 2);
      ctx.closePath();
      ctx.fill();

      // Outline
      ctx.strokeStyle = this.theme.foreground;
      ctx.lineWidth = 1.0;
      ctx.stroke();

      // Shadow hatching on left face
      ctx.strokeStyle = `rgba(63, 51, 44, 0.3)`;
      ctx.lineWidth = 0.6;
      const steps = Math.floor(h / 3);
      for (let s = 0; s < steps; s++) {
        const t = s / steps;
        const ly = cy - h + t * (h + 2);
        const lx1 = cx - w * t * 0.5;
        const lx2 = cx - w * t * 0.15;
        ctx.beginPath();
        ctx.moveTo(lx1, ly);
        ctx.lineTo(lx2, ly);
        ctx.stroke();
      }

      // Snow cap for high mountains
      if (cell.biome === Biome.SNOW || cell.elevation > 0.55) {
        ctx.fillStyle = "#F0EDE5";
        ctx.beginPath();
        const capH = h * 0.3;
        const capW = w * 0.3;
        ctx.moveTo(cx, cy - h);
        ctx.lineTo(cx - capW, cy - h + capH);
        ctx.lineTo(cx + capW, cy - h + capH);
        ctx.closePath();
        ctx.fill();
      }
    }
    ctx.restore();
  }

  private drawTrees(): void {
    const ctx = this.ctx;
    const treeCells = this.mapData.cells.filter(
      c => c.isLand && (c.biome === Biome.FOREST || c.biome === Biome.DENSE_FOREST)
    );

    ctx.save();
    for (const cell of treeCells) {
      const isDense = cell.biome === Biome.DENSE_FOREST;
      const count = isDense ? 3 + Math.floor(Math.random() * 3) : 1 + Math.floor(Math.random() * 2);

      for (let t = 0; t < count; t++) {
        const ox = (Math.random() - 0.5) * 8;
        const oy = (Math.random() - 0.5) * 6;
        const tx = this.toX(cell.centroid[0]) + ox;
        const ty = this.toY(cell.centroid[1]) + oy;
        const size = 3 + Math.random() * 3;

        if (isDense) {
          // Deciduous tree (round blob) — Perilous darkWood color
          ctx.fillStyle = isDense ? this.theme.darkWood[Math.floor(Math.random() * this.theme.darkWood.length)] : this.theme.lightWood[0];
          ctx.beginPath();
          ctx.arc(tx, ty - size, size * 0.8, 0, Math.PI * 2);
          ctx.fill();
          // Trunk
          ctx.strokeStyle = this.theme.foreground;
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.moveTo(tx, ty - size * 0.2);
          ctx.lineTo(tx, ty + 1);
          ctx.stroke();
        } else {
          // Conifer (triangle) — lightWood color
          ctx.fillStyle = this.theme.lightWood[Math.floor(Math.random() * this.theme.lightWood.length)];
          ctx.beginPath();
          ctx.moveTo(tx, ty - size * 1.8);
          ctx.lineTo(tx - size * 0.6, ty);
          ctx.lineTo(tx + size * 0.6, ty);
          ctx.closePath();
          ctx.fill();
          // Outline
          ctx.strokeStyle = this.theme.foreground;
          ctx.lineWidth = 0.6;
          ctx.stroke();
        }
      }
    }
    ctx.restore();
  }

  private drawRivers(): void {
    const ctx = this.ctx;
    const cells = this.mapData.cells;

    ctx.save();
    ctx.strokeStyle = this.theme.rivers;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    for (const river of this.mapData.rivers) {
      if (river.length < 2) continue;

      ctx.beginPath();
      const start = cells[river[0]];
      ctx.moveTo(this.toX(start.centroid[0]), this.toY(start.centroid[1]));

      for (let i = 1; i < river.length; i++) {
        const cell = cells[river[i]];
        // Width increases downstream
        ctx.lineWidth = 1.0 + (i / river.length) * 2.5;
        ctx.lineTo(this.toX(cell.centroid[0]), this.toY(cell.centroid[1]));
      }
      ctx.stroke();
    }

    ctx.restore();
  }

  private drawGrassHatching(): void {
    const ctx = this.ctx;
    const grassCells = this.mapData.cells.filter(
      c => c.isLand && (c.biome === Biome.GRASSLAND || c.biome === Biome.PLAINS)
    );

    ctx.save();
    ctx.strokeStyle = `rgba(63, 51, 44, 0.08)`;
    ctx.lineWidth = 0.4;

    for (const cell of grassCells) {
      const cx = this.toX(cell.centroid[0]);
      const cy = this.toY(cell.centroid[1]);
      const count = cell.biome === Biome.GRASSLAND ? 4 : 2;

      for (let i = 0; i < count; i++) {
        const ox = (Math.random() - 0.5) * 10;
        const oy = (Math.random() - 0.5) * 8;
        const len = 2 + Math.random() * 3;
        ctx.beginPath();
        ctx.moveTo(cx + ox, cy + oy);
        ctx.lineTo(cx + ox + len * 0.7, cy + oy - len);
        ctx.stroke();
      }
    }

    ctx.restore();
  }

  private generateLabels(): void {
    this.labels = [];
    const cfg = this.config;
    const cells = this.mapData.cells;

    // Island title (center of land mass)
    const landCells = cells.filter(c => c.isLand);
    if (cfg.showRegionLabels && landCells.length > 0) {
      const avgX = landCells.reduce((s, c) => s + c.centroid[0], 0) / landCells.length;
      const avgY = landCells.reduce((s, c) => s + c.centroid[1], 0) / landCells.length;
      this.labels.push({
        x: this.toX(avgX),
        y: this.toY(avgY) - 20,
        text: this.nameGen.island(),
        fontSize: 28,
        type: "region",
      });
    }

    // Mountain range labels
    const mountainCells = cells.filter(c => c.biome === Biome.MOUNTAIN || c.biome === Biome.SNOW);
    if (cfg.showMountainLabels && mountainCells.length > 3) {
      const cluster = this.findCluster(mountainCells);
      if (cluster) {
        this.labels.push({
          x: this.toX(cluster[0]),
          y: this.toY(cluster[1]) + 20,
          text: this.nameGen.mountainRange(),
          fontSize: 16,
          type: "mountain",
        });
      }
    }

    // Forest labels
    const forestCells = cells.filter(c => c.biome === Biome.FOREST || c.biome === Biome.DENSE_FOREST);
    if (cfg.showForestLabels && forestCells.length > 5) {
      const cluster = this.findCluster(forestCells);
      if (cluster) {
        this.labels.push({
          x: this.toX(cluster[0]),
          y: this.toY(cluster[1]) + 12,
          text: this.nameGen.forest(),
          fontSize: 14,
          type: "forest",
        });
      }
    }

    // Town labels (at random coastal or crossroad cells)
    if (!cfg.showTownLabels) { /* skip towns */ }
    const townCandidates = cfg.showTownLabels ? cells.filter(c => {
      if (!c.isLand) return false;
      if (c.biome === Biome.MOUNTAIN || c.biome === Biome.SNOW) return false;
      const hasWaterNeighbor = c.neighbors.some(ni => ni < cells.length && !cells[ni].isLand);
      return hasWaterNeighbor || c.biome === Biome.PLAINS;
    }) : [];

    const townCount = Math.min(4, Math.floor(townCandidates.length / 20));
    const usedTowns = new Set<number>();
    for (let i = 0; i < townCount; i++) {
      const idx = Math.floor(Math.random() * townCandidates.length);
      const cell = townCandidates[idx];
      if (usedTowns.has(cell.index)) continue;
      usedTowns.add(cell.index);
      this.labels.push({
        x: this.toX(cell.centroid[0]),
        y: this.toY(cell.centroid[1]) - 8,
        text: this.nameGen.town(),
        fontSize: 12,
        type: "town",
      });
    }

    // River labels
    if (!cfg.showRiverLabels) return;
    for (let i = 0; i < Math.min(this.mapData.rivers.length, 3); i++) {
      const river = this.mapData.rivers[i];
      if (river.length < 4) continue;
      const midIdx = Math.floor(river.length / 2);
      const midCell = cells[river[midIdx]];
      this.labels.push({
        x: this.toX(midCell.centroid[0]) + 10,
        y: this.toY(midCell.centroid[1]),
        text: this.nameGen.river(),
        fontSize: 10,
        type: "river",
      });
    }
  }

  private findCluster(cells: MapCell[]): [number, number] | null {
    if (cells.length === 0) return null;
    const cx = cells.reduce((s, c) => s + c.centroid[0], 0) / cells.length;
    const cy = cells.reduce((s, c) => s + c.centroid[1], 0) / cells.length;
    return [cx, cy];
  }

  private drawLabels(): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    for (const label of this.labels) {
      const italic = label.type === "river" || label.type === "forest";
      ctx.font = `${italic ? "italic " : ""}${label.fontSize}px Georgia, serif`;

      // Text shadow/outline for readability
      ctx.strokeStyle = this.theme.matte;
      ctx.lineWidth = 3;
      ctx.lineJoin = "round";
      ctx.strokeText(label.text, label.x, label.y);

      // Main text
      ctx.fillStyle = label.type === "region" ? this.theme.foreground : this.theme.contours;
      if (label.type === "town") ctx.fillStyle = this.theme.foreground;
      ctx.fillText(label.text, label.x, label.y);

      // Town marker dot
      if (label.type === "town") {
        ctx.fillStyle = this.theme.foreground;
        ctx.beginPath();
        ctx.arc(label.x, label.y + label.fontSize, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }

  private drawCompass(): void {
    const ctx = this.ctx;
    const cx = this.resolution - 80;
    const cy = this.resolution - 80;
    const r = 30;

    ctx.save();
    ctx.translate(cx, cy);

    // Circle
    ctx.strokeStyle = this.theme.contours;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.stroke();

    // Cardinal points
    const dirs: [number, number, string][] = [
      [0, -r - 10, "N"],
      [0, r + 10, "S"],
      [r + 10, 0, "E"],
      [-r - 10, 0, "W"],
    ];

    ctx.fillStyle = this.theme.foreground;
    ctx.font = "bold 10px Georgia, serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (const [dx, dy, letter] of dirs) {
      ctx.fillText(letter, dx, dy);
    }

    // Arrow pointing north
    ctx.fillStyle = this.theme.foreground;
    ctx.beginPath();
    ctx.moveTo(0, -r + 4);
    ctx.lineTo(-4, 0);
    ctx.lineTo(4, 0);
    ctx.closePath();
    ctx.fill();

    // South arrow (hollow)
    ctx.strokeStyle = this.theme.foreground;
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(0, r - 4);
    ctx.lineTo(-4, 0);
    ctx.lineTo(4, 0);
    ctx.closePath();
    ctx.stroke();

    // Cross lines
    ctx.strokeStyle = this.theme.contours;
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.moveTo(0, -r + 2);
    ctx.lineTo(0, r - 2);
    ctx.moveTo(-r + 2, 0);
    ctx.lineTo(r - 2, 0);
    ctx.stroke();

    ctx.restore();
  }

  private drawShallowWater(): void {
    const ctx = this.ctx;
    const paths = this.getCoastPaths();
    const size = this.config.shallowSize;
    if (size <= 0) return;

    ctx.save();
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.strokeStyle = `rgba(63, 51, 44, 0.04)`;
    ctx.lineWidth = size * 18;
    for (const path of paths) {
      this.traceCoastPath(path);
      ctx.stroke();
    }
    ctx.restore();
  }

  private drawRoutes(): void {
    const ctx = this.ctx;
    const cells = this.mapData.cells;
    // Find town candidate cells and draw dashed lines between nearby ones
    const townCells = cells.filter(c => {
      if (!c.isLand) return false;
      if (c.biome === Biome.MOUNTAIN || c.biome === Biome.SNOW) return false;
      return c.neighbors.some(ni => ni < cells.length && !cells[ni].isLand) || c.biome === Biome.PLAINS;
    });

    if (townCells.length < 2) return;

    ctx.save();
    ctx.strokeStyle = this.theme.contours;
    ctx.lineWidth = this.config.lineWidthThin;
    ctx.setLineDash([4, 4]);
    ctx.lineCap = "round";

    // Connect a few nearby town candidates with dotted lines
    const used = new Set<number>();
    const maxRoutes = Math.min(6, Math.floor(townCells.length / 3));
    for (let r = 0; r < maxRoutes && r < townCells.length; r++) {
      const a = townCells[r];
      if (used.has(a.index)) continue;
      let bestDist = Infinity;
      let bestCell: typeof a | null = null;
      for (const b of townCells) {
        if (b.index === a.index || used.has(b.index)) continue;
        const dx = a.centroid[0] - b.centroid[0];
        const dy = a.centroid[1] - b.centroid[1];
        const d = dx * dx + dy * dy;
        if (d < bestDist && d > 100) {
          bestDist = d;
          bestCell = b;
        }
      }
      if (bestCell) {
        ctx.beginPath();
        ctx.moveTo(this.toX(a.centroid[0]), this.toY(a.centroid[1]));
        ctx.lineTo(this.toX(bestCell.centroid[0]), this.toY(bestCell.centroid[1]));
        ctx.stroke();
        used.add(a.index);
        used.add(bestCell.index);
      }
    }

    ctx.setLineDash([]);
    ctx.restore();
  }

  private drawTownBuildings(): void {
    const ctx = this.ctx;
    const cells = this.mapData.cells;
    const scale = this.config.townScale;
    if (scale <= 0) return;

    const townCells = cells.filter(c => {
      if (!c.isLand) return false;
      if (c.biome === Biome.MOUNTAIN || c.biome === Biome.SNOW || c.biome === Biome.DESERT) return false;
      return c.neighbors.some(ni => ni < cells.length && !cells[ni].isLand);
    });

    ctx.save();
    const maxTowns = Math.min(6, Math.floor(townCells.length / 15));
    for (let i = 0; i < maxTowns && i < townCells.length; i++) {
      const cell = townCells[i * Math.floor(townCells.length / Math.max(1, maxTowns))];
      if (!cell) continue;
      const cx = this.toX(cell.centroid[0]);
      const cy = this.toY(cell.centroid[1]);
      const s = 3 * scale;

      // Draw 2-3 tiny house shapes
      const houses = 2 + Math.floor(Math.random() * 2);
      for (let h = 0; h < houses; h++) {
        const hx = cx + (h - houses / 2) * s * 2.5;
        const hy = cy;

        // Body
        ctx.fillStyle = this.theme.matte;
        ctx.fillRect(hx - s, hy - s, s * 2, s * 1.5);
        ctx.strokeStyle = this.theme.foreground;
        ctx.lineWidth = 0.6;
        ctx.strokeRect(hx - s, hy - s, s * 2, s * 1.5);

        // Roof
        ctx.fillStyle = this.theme.roofs;
        ctx.beginPath();
        ctx.moveTo(hx - s * 1.3, hy - s);
        ctx.lineTo(hx, hy - s * 2.2);
        ctx.lineTo(hx + s * 1.3, hy - s);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  private drawDangerMarkers(): void {
    const ctx = this.ctx;
    const scale = this.config.dangerScale;
    if (scale <= 0) return;

    // Place danger markers in mountain/snow cells with high elevation
    const dangerCells = this.mapData.cells.filter(
      c => c.isLand && c.elevation > 0.5 && (c.biome === Biome.MOUNTAIN || c.biome === Biome.SNOW)
    );

    if (dangerCells.length < 3) return;

    ctx.save();
    ctx.font = `${10 * scale}px Georgia, serif`;
    ctx.fillStyle = this.theme.foreground;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Place a few skull/cross markers
    const count = Math.min(3, Math.floor(dangerCells.length / 5));
    for (let i = 0; i < count; i++) {
      const cell = dangerCells[Math.floor(Math.random() * dangerCells.length)];
      const cx = this.toX(cell.centroid[0]);
      const cy = this.toY(cell.centroid[1]) + 12;
      ctx.fillText("☠", cx, cy);
    }
    ctx.restore();
  }

  private drawHexGrid(): void {
    const ctx = this.ctx;
    const cfg = this.config;
    const landCells = cfg.gridOceanTiles ? null : new Set(
      this.mapData.cells.filter(c => c.isLand).map(c => c.index)
    );

    ctx.save();
    const cRgb = this.hexToRgb(this.theme.contours);
    ctx.strokeStyle = `rgba(${cRgb[0]}, ${cRgb[1]}, ${cRgb[2]}, 0.3)`;
    ctx.lineWidth = 0.7;

    const r = this.resolution / 18;
    const w = r * Math.sqrt(3);
    const h = r * 2;

    let row = 0;
    for (let gy = -h; gy < this.resolution + h; gy += h * 0.75, row++) {
      let col = 0;
      for (let gx = -w; gx < this.resolution + w; gx += w, col++) {
        const cx = gx + (row % 2 ? w * 0.5 : 0);
        const cy = gy;

        // Skip ocean hexes if gridOceanTiles is off
        if (landCells) {
          const mapX = cx / this.scale;
          const mapY = cy / this.scale;
          let onLand = false;
          for (const cell of this.mapData.cells) {
            const dx = cell.centroid[0] - mapX;
            const dy = cell.centroid[1] - mapY;
            if (dx * dx + dy * dy < 100 && cell.isLand) {
              onLand = true;
              break;
            }
          }
          if (!onLand) continue;
        }

        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const angle = (Math.PI / 3) * i - Math.PI / 2;
          const px = cx + r * Math.cos(angle);
          const py = cy + r * Math.sin(angle);
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.stroke();

        // Numbers
        if (cfg.gridNumbers) {
          ctx.fillStyle = `rgba(63, 51, 44, 0.25)`;
          ctx.font = `${r * 0.25}px Georgia, serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(`${col}.${row}`, cx, cy);
        }
      }
    }

    ctx.restore();
  }

  private drawClouds(): void {
    const ctx = this.ctx;
    ctx.save();

    // Semi-transparent cloud blobs over water areas
    const waterCells = this.mapData.cells.filter(c => !c.isLand);
    const cloudCount = Math.min(8, Math.floor(waterCells.length / 30));

    for (let i = 0; i < cloudCount; i++) {
      const cell = waterCells[Math.floor(Math.random() * waterCells.length)];
      const cx = this.toX(cell.centroid[0]);
      const cy = this.toY(cell.centroid[1]);
      const r = 15 + Math.random() * 25;

      ctx.fillStyle = "rgba(249, 248, 242, 0.4)";
      ctx.beginPath();
      // Cloud shape: overlapping circles
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.arc(cx + r * 0.6, cy - r * 0.2, r * 0.7, 0, Math.PI * 2);
      ctx.arc(cx - r * 0.5, cy + r * 0.1, r * 0.6, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  private drawVignette(): void {
    const ctx = this.ctx;
    const r = this.resolution;

    // Subtle darkening at edges
    const grad = ctx.createRadialGradient(r / 2, r / 2, r * 0.3, r / 2, r / 2, r * 0.72);
    grad.addColorStop(0, "rgba(0, 0, 0, 0)");
    grad.addColorStop(1, "rgba(0, 0, 0, 0.12)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, r, r);

    // Border frame
    ctx.strokeStyle = this.theme.foreground;
    ctx.lineWidth = 3;
    ctx.strokeRect(8, 8, r - 16, r - 16);
    ctx.strokeStyle = this.theme.contours;
    ctx.lineWidth = 0.8;
    ctx.strokeRect(14, 14, r - 28, r - 28);
  }
}
