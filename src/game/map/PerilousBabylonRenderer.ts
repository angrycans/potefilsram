import {
  Scene,
  MeshBuilder,
  StandardMaterial,
  Color3,
  Mesh,
  DynamicTexture,
} from "@babylonjs/core";
import type { PerilousMapData, PerilousHexCell } from "./PerilousMapGenerator";
import type { PerilousRenderConfig, PerilousColorTheme } from "./PerilousConfig";
import { THEMES, DEFAULT_RENDER_CONFIG } from "./PerilousConfig";
import { PerilousNameGenerator } from "./PerilousNameGenerator";

const BIOME_COLORS: Record<string, string> = {
  ocean: "#72889E",
  shallow: "#A9BCC8",
  beach: "#EDE6D2",
  plains: "#E8E2CE",
  forest: "#CFD4B5",
  mountain: "#D7D8BE",
};

export class PerilousBabylonRenderer {
  private scene: Scene;
  private mapData: PerilousMapData;
  private config: PerilousRenderConfig;
  private theme: PerilousColorTheme;
  private nameGen = new PerilousNameGenerator();

  private mapPlane: Mesh | null = null;
  private mapTexture: DynamicTexture | null = null;
  private resolution = 2048;

  constructor(scene: Scene, mapData: PerilousMapData, config?: Partial<PerilousRenderConfig>) {
    this.scene = scene;
    this.mapData = mapData;
    this.config = { ...DEFAULT_RENDER_CONFIG, ...config };
    this.theme = THEMES[this.config.theme] || THEMES.fullColour;
  }

  render(): void {
    this.createMapTexture();
    this.createMapPlane();
    this.createLabels();
  }

  private createMapTexture(): void {
    this.mapTexture = new DynamicTexture(
      "perilousMapTexture",
      { width: this.resolution, height: this.resolution },
      this.scene,
      false,
      DynamicTexture.TRILINEAR_SAMPLINGMODE
    );

    const ctx = this.mapTexture.getContext() as unknown as CanvasRenderingContext2D;
    this.renderToContext(ctx);
    this.mapTexture.update();
  }

  private renderToContext(ctx: CanvasRenderingContext2D): void {
    const cfg = this.config;
    const cells = this.mapData.cells;
    const scale = this.resolution / Math.max(this.mapData.width, this.mapData.height);
    const offsetX = (this.resolution - this.mapData.width * scale) / 2;
    const offsetY = (this.resolution - this.mapData.height * scale) / 2;

    const toX = (x: number) => x * scale + offsetX;
    const toY = (y: number) => y * scale + offsetY;

    ctx.fillStyle = this.theme.water || "#72889E";
    ctx.fillRect(0, 0, this.resolution, this.resolution);

    for (const cell of cells) {
      if (!cell.isLand || !cell.polygon) continue;
      const poly = cell.polygon;

      ctx.beginPath();
      ctx.moveTo(toX(poly[0][0]), toY(poly[0][1]));
      for (let i = 1; i < poly.length; i++) {
        ctx.lineTo(toX(poly[i][0]), toY(poly[i][1]));
      }
      ctx.closePath();

      ctx.fillStyle = BIOME_COLORS[cell.biome] || this.theme.matte || "#D8D4B8";
      ctx.fill();

      if (cfg.enumShading === "Hatching") {
        ctx.strokeStyle = "rgba(63, 51, 44, 0.08)";
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }
    }

    this.drawCoastlines(ctx, cells, toX, toY);
    this.drawRivers(ctx, toX, toY);
    this.drawRoads(ctx, toX, toY);
    this.drawMountains(ctx, toX, toY);
    this.drawTrees(ctx, toX, toY);
    this.drawTowns(ctx, toX, toY);
    this.drawDanger(ctx, toX, toY);
    this.drawCompass(ctx);
    this.drawBorder(ctx);
  }

  private drawCoastlines(
    ctx: CanvasRenderingContext2D,
    cells: PerilousHexCell[],
    toX: (x: number) => number,
    toY: (y: number) => number
  ): void {
    ctx.save();
    ctx.strokeStyle = this.theme.foreground || "#3F332C";
    ctx.lineWidth = 2.5;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";

    for (const cell of cells) {
      if (!cell.isLand || !cell.polygon) continue;
      const hasWaterNeighbor = cell.neighbors.some(
        (ni) => ni < cells.length && cells[ni] && !cells[ni].isLand
      );

      if (hasWaterNeighbor) {
        const poly = cell.polygon;
        ctx.beginPath();
        ctx.moveTo(toX(poly[0][0]), toY(poly[0][1]));
        for (let i = 1; i < poly.length; i++) {
          ctx.lineTo(toX(poly[i][0]), toY(poly[i][1]));
        }
        ctx.closePath();
        ctx.stroke();
      }
    }

    ctx.strokeStyle = "rgba(63, 51, 44, 0.15)";
    ctx.lineWidth = 5;
    for (const cell of cells) {
      if (!cell.isLand || !cell.polygon) continue;
      const hasWaterNeighbor = cell.neighbors.some(
        (ni) => ni < cells.length && cells[ni] && !cells[ni].isLand
      );

      if (hasWaterNeighbor) {
        const poly = cell.polygon;
        ctx.beginPath();
        ctx.moveTo(toX(poly[0][0]), toY(poly[0][1]));
        for (let i = 1; i < poly.length; i++) {
          ctx.lineTo(toX(poly[i][0]), toY(poly[i][1]));
        }
        ctx.closePath();
        ctx.stroke();
      }
    }

    ctx.restore();
  }

  private drawRivers(
    ctx: CanvasRenderingContext2D,
    toX: (x: number) => number,
    toY: (y: number) => number
  ): void {
    if (!this.config.showRivers) return;

    const riverFeatures = this.mapData.features.filter((f) => f.type === "river");

    ctx.save();
    ctx.strokeStyle = this.theme.rivers || "#4C472A";
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    for (const feature of riverFeatures) {
      if (feature.cellIndices.length < 2) continue;

      ctx.beginPath();
      const startCell = this.mapData.cells[feature.cellIndices[0]];
      ctx.moveTo(toX(startCell.center[0]), toY(startCell.center[1]));

      for (let i = 1; i < feature.cellIndices.length; i++) {
        const cell = this.mapData.cells[feature.cellIndices[i]];
        ctx.lineWidth = 1.5 + (i / feature.cellIndices.length) * 4;
        ctx.lineTo(toX(cell.center[0]), toY(cell.center[1]));
      }
      ctx.stroke();
    }

    ctx.restore();
  }

  private drawRoads(
    ctx: CanvasRenderingContext2D,
    toX: (x: number) => number,
    toY: (y: number) => number
  ): void {
    if (!this.config.showRoutes) return;

    const roadFeatures = this.mapData.features.filter((f) => f.type === "road");

    ctx.save();
    ctx.strokeStyle = this.theme.routes || "#998B83";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 3]);
    ctx.lineCap = "round";

    for (const feature of roadFeatures) {
      if (feature.cellIndices.length < 2) continue;

      ctx.beginPath();
      const startCell = this.mapData.cells[feature.cellIndices[0]];
      ctx.moveTo(toX(startCell.center[0]), toY(startCell.center[1]));

      for (let i = 1; i < feature.cellIndices.length; i++) {
        const cell = this.mapData.cells[feature.cellIndices[i]];
        ctx.lineTo(toX(cell.center[0]), toY(cell.center[1]));
      }
      ctx.stroke();
    }

    ctx.restore();
  }

  private drawMountains(
    ctx: CanvasRenderingContext2D,
    toX: (x: number) => number,
    toY: (y: number) => number
  ): void {
    if (!this.config.showMountains) return;

    const mountainFeatures = this.mapData.features.filter((f) => f.type === "mountain");

    ctx.save();
    for (const feature of mountainFeatures) {
      const cell = this.mapData.cells[feature.cellIndices[0]];
      if (!cell) continue;

      const cx = toX(cell.center[0]);
      const cy = toY(cell.center[1]);

      const baseSize = 6 + cell.elevation * 16;
      const h = baseSize * (1.5 + Math.random() * 0.5);
      const w = baseSize * (0.8 + Math.random() * 0.4);

      ctx.fillStyle = this.theme.mountain || "#B8B0A0";
      ctx.beginPath();
      ctx.moveTo(cx, cy - h);
      ctx.lineTo(cx - w, cy + 2);
      ctx.lineTo(cx + w, cy + 2);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = this.theme.foreground || "#3F332C";
      ctx.lineWidth = 1.2;
      ctx.stroke();

      ctx.strokeStyle = "rgba(63, 51, 44, 0.25)";
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

      if (cell.elevation > 0.55) {
        ctx.fillStyle = "#F0EDE5";
        ctx.beginPath();
        const capH = h * 0.3;
        const capW = w * 0.35;
        ctx.moveTo(cx, cy - h);
        ctx.lineTo(cx - capW, cy - h + capH);
        ctx.lineTo(cx + capW, cy - h + capH);
        ctx.closePath();
        ctx.fill();
      }
    }
    ctx.restore();
  }

  private drawTrees(
    ctx: CanvasRenderingContext2D,
    toX: (x: number) => number,
    toY: (y: number) => number
  ): void {
    if (!this.config.showTrees) return;

    const forestFeatures = this.mapData.features.filter((f) => f.type === "forest");

    ctx.save();
    for (const feature of forestFeatures) {
      for (const cellIndex of feature.cellIndices) {
        const cell = this.mapData.cells[cellIndex];
        if (!cell || !cell.isLand) continue;

        if (Math.random() > this.config.treesDensity * 2) continue;

        const cx = toX(cell.center[0]) + (Math.random() - 0.5) * 10;
        const cy = toY(cell.center[1]) + (Math.random() - 0.5) * 8;
        const size = 3 + Math.random() * 4;

        const isDense = cell.biome === "forest" && cell.moisture > 0.6;

        if (isDense) {
          ctx.fillStyle = (this.theme.darkWood || ["#585E50"])[Math.floor(Math.random() * (this.theme.darkWood?.length || 1))];
          ctx.beginPath();
          ctx.arc(cx, cy - size * 0.7, size * 0.75, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = this.theme.foreground || "#3F332C";
          ctx.lineWidth = 0.6;
          ctx.stroke();
        } else {
          ctx.fillStyle = (this.theme.lightWood || ["#878053"])[Math.floor(Math.random() * (this.theme.lightWood?.length || 1))];
          ctx.beginPath();
          ctx.moveTo(cx, cy - size * 1.8);
          ctx.lineTo(cx - size * 0.6, cy);
          ctx.lineTo(cx + size * 0.6, cy);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = this.theme.foreground || "#3F332C";
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }
    ctx.restore();
  }

  private drawTowns(
    ctx: CanvasRenderingContext2D,
    toX: (x: number) => number,
    toY: (y: number) => number
  ): void {
    if (!this.config.showTowns) return;

    const townFeatures = this.mapData.features.filter((f) => f.type === "town");

    ctx.save();
    for (const feature of townFeatures) {
      const cell = this.mapData.cells[feature.cellIndices[0]];
      if (!cell) continue;

      const cx = toX(cell.center[0]);
      const cy = toY(cell.center[1]);
      const size = 5 + Math.random() * 3;

      ctx.fillStyle = this.theme.roofs || "#A1693F";
      ctx.beginPath();
      ctx.moveTo(cx, cy - size * 1.5);
      ctx.lineTo(cx - size, cy - size * 0.3);
      ctx.lineTo(cx + size, cy - size * 0.3);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = this.theme.foreground || "#3F332C";
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = this.theme.foreground || "#3F332C";
      ctx.beginPath();
      ctx.arc(cx, cy - size * 0.3, 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  private drawDanger(
    ctx: CanvasRenderingContext2D,
    toX: (x: number) => number,
    toY: (y: number) => number
  ): void {
    if (!this.config.showDanger) return;

    const dangerFeatures = this.mapData.features.filter((f) => f.type === "danger");

    ctx.save();
    for (const feature of dangerFeatures) {
      const cell = this.mapData.cells[feature.cellIndices[0]];
      if (!cell) continue;

      const cx = toX(cell.center[0]);
      const cy = toY(cell.center[1]);
      const size = 4 + Math.random() * 2;

      ctx.fillStyle = "#8B0000";
      ctx.beginPath();
      ctx.moveTo(cx, cy - size * 1.2);
      ctx.lineTo(cx - size * 0.7, cy + size * 0.4);
      ctx.lineTo(cx + size * 0.7, cy + size * 0.4);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  private drawCompass(ctx: CanvasRenderingContext2D): void {
    if (!this.config.showCompass) return;

    const cx = this.resolution - 80;
    const cy = 80;
    const r = 30;

    ctx.save();
    ctx.translate(cx, cy);

    ctx.strokeStyle = this.theme.contours || "#998B83";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = this.theme.foreground || "#3F332C";
    ctx.font = "bold 11px Georgia, serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("N", 0, -r - 8);
    ctx.fillText("S", 0, r + 10);
    ctx.fillText("E", r + 10, 0);
    ctx.fillText("W", -r - 10, 0);

    ctx.beginPath();
    ctx.moveTo(0, -r + 5);
    ctx.lineTo(-4, 0);
    ctx.lineTo(4, 0);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = this.theme.contours || "#998B83";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, r - 5);
    ctx.lineTo(-4, 0);
    ctx.lineTo(4, 0);
    ctx.closePath();
    ctx.stroke();

    ctx.restore();
  }

  private drawBorder(ctx: CanvasRenderingContext2D): void {
    if (!this.config.showBorder) return;

    const gradient = ctx.createRadialGradient(
      this.resolution / 2,
      this.resolution / 2,
      this.resolution * 0.3,
      this.resolution / 2,
      this.resolution / 2,
      this.resolution * 0.7
    );
    gradient.addColorStop(0, "rgba(0,0,0,0)");
    gradient.addColorStop(1, "rgba(0,0,0,0.3)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.resolution, this.resolution);
  }

  private createMapPlane(): void {
    const { width, height } = this.mapData;
    const aspect = width / height;

    let planeWidth: number;
    let planeHeight: number;

    if (aspect > 1) {
      planeWidth = 12;
      planeHeight = 12 / aspect;
    } else {
      planeHeight = 12;
      planeWidth = 12 * aspect;
    }

    this.mapPlane = MeshBuilder.CreatePlane(
      "perilousMapPlane",
      { width: planeWidth, height: planeHeight },
      this.scene
    );

    const mat = new StandardMaterial("perilousMapMat", this.scene);
    mat.diffuseTexture = this.mapTexture;
    mat.specularColor = new Color3(0.1, 0.1, 0.1);
    mat.emissiveColor = new Color3(0.1, 0.1, 0.1);

    this.mapPlane.material = mat;
  }

  private createLabels(): void {
    const labelContainer = document.createElement("div");
    labelContainer.id = "perilous-labels-3d";
    labelContainer.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 100;
      overflow: hidden;
    `;
    document.body.appendChild(labelContainer);

    const scale = this.resolution / Math.max(this.mapData.width, this.mapData.height);
    const offsetX = (this.resolution - this.mapData.width * scale) / 2;
    const offsetY = (this.resolution - this.mapData.height * scale) / 2;
    const toX = (x: number) => (x * scale + offsetX) / this.resolution * 100;
    const toY = (y: number) => (y * scale + offsetY) / this.resolution * 100;

    if (this.config.showRegionLabels) {
      const landCells = this.mapData.cells.filter((c) => c.isLand);
      if (landCells.length > 0) {
        const avgX = landCells.reduce((s, c) => s + c.center[0], 0) / landCells.length;
        const avgY = landCells.reduce((s, c) => s + c.center[1], 0) / landCells.length;

        const label = document.createElement("div");
        label.style.cssText = `
          position: absolute;
          left: ${toX(avgX)}%;
          top: ${toY(avgY)}%;
          transform: translate(-50%, -50%);
          color: ${this.theme.foreground || "#3F332C"};
          font-family: 'Georgia', serif;
          font-size: 30px;
          font-weight: bold;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.3), -1px -1px 2px ${this.theme.matte || "#F2EFE6"};
          white-space: nowrap;
        `;
        label.textContent = this.nameGen.island();
        labelContainer.appendChild(label);
      }
    }

    if (this.config.showMountainLabels) {
      const mountainFeatures = this.mapData.features.filter((f) => f.type === "mountain");
      if (mountainFeatures.length > 3) {
        let totalX = 0, totalY = 0;
        for (const f of mountainFeatures.slice(0, 5)) {
          const cell = this.mapData.cells[f.cellIndices[0]];
          if (cell) {
            totalX += cell.center[0];
            totalY += cell.center[1];
          }
        }
        const avgX = totalX / Math.min(5, mountainFeatures.length);
        const avgY = totalY / Math.min(5, mountainFeatures.length);

        const label = document.createElement("div");
        label.style.cssText = `
          position: absolute;
          left: ${toX(avgX)}%;
          top: ${toY(avgY) + 3}%;
          transform: translate(-50%, 0);
          color: ${this.theme.contours || "#998B83"};
          font-family: 'Georgia', serif;
          font-size: 14px;
          font-style: italic;
          text-shadow: 1px 1px 2px rgba(0,0,0,0.2);
          white-space: nowrap;
        `;
        label.textContent = this.nameGen.mountainRange();
        labelContainer.appendChild(label);
      }
    }

    if (this.config.showTownLabels) {
      const townFeatures = this.mapData.features.filter((f) => f.type === "town");
      const maxLabels = Math.min(4, Math.floor(townFeatures.length / 15));

      for (let i = 0; i < townFeatures.length; i += Math.max(1, Math.floor(townFeatures.length / maxLabels))) {
        const feature = townFeatures[i];
        const cell = this.mapData.cells[feature.cellIndices[0]];
        if (!cell) continue;

        const label = document.createElement("div");
        label.style.cssText = `
          position: absolute;
          left: ${toX(cell.center[0])}%;
          top: ${toY(cell.center[1])}%;
          transform: translate(-50%, 120%);
          color: ${this.theme.foreground || "#3F332C"};
          font-family: 'Courier New', monospace;
          font-size: 10px;
          text-shadow: 0.5px 0.5px 1px rgba(0,0,0,0.3);
          white-space: nowrap;
        `;
        label.textContent = this.nameGen.town();
        labelContainer.appendChild(label);
      }
    }
  }

  dispose(): void {
    this.mapTexture?.dispose();
    this.mapPlane?.dispose();

    const labelContainer = document.getElementById("perilous-labels-3d");
    if (labelContainer) {
      labelContainer.remove();
    }
  }
}
