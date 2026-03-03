import { Scene } from "@babylonjs/core/scene";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { LinesMesh } from "@babylonjs/core/Meshes/linesMesh";
import { VertexData } from "@babylonjs/core/Meshes/mesh.vertexData";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import type { MapData, MapCell } from "./MapGenerator";
import { BIOME_COLORS } from "./BiomeColors";

export class MapRenderer {
  private scene: Scene;
  private mapData: MapData;
  private offsetX: number;
  private offsetZ: number;
  private highlightMesh: LinesMesh | null = null;
  private selectedCellIndex: number = -1;
  private useHeight = false;
  private heightScale = 3.0;
  private terrainMeshes: Mesh[] = [];
  private gridMesh: LinesMesh | null = null;
  private riverMeshes: Mesh[] = [];
  private waterMesh: Mesh | null = null;

  constructor(scene: Scene, mapData: MapData) {
    this.scene = scene;
    this.mapData = mapData;
    this.offsetX = mapData.width / 2;
    this.offsetZ = mapData.height / 2;
  }

  render(): void {
    this.renderCells();
    this.renderGrid();
    this.renderRivers();
    this.renderWaterPlane();
    this.setupPicking();
  }

  toggleHeight(): void {
    this.useHeight = !this.useHeight;
    this.rebuild();
  }

  isHeightEnabled(): boolean {
    return this.useHeight;
  }

  private rebuild(): void {
    for (const m of this.terrainMeshes) m.dispose();
    this.terrainMeshes = [];
    if (this.gridMesh) { this.gridMesh.dispose(); this.gridMesh = null; }
    for (const m of this.riverMeshes) m.dispose();
    this.riverMeshes = [];
    if (this.waterMesh) { this.waterMesh.dispose(); this.waterMesh = null; }
    if (this.highlightMesh) { this.highlightMesh.dispose(); this.highlightMesh = null; }
    this.selectedCellIndex = -1;

    this.renderCells();
    this.renderGrid();
    this.renderRivers();
    this.renderWaterPlane();
  }

  getSelectedCell(): MapCell | null {
    if (this.selectedCellIndex < 0) return null;
    return this.mapData.cells[this.selectedCellIndex] ?? null;
  }

  private renderCells(): void {
    // Batch cells by biome for performance
    const biomeGroups = new Map<string, MapCell[]>();

    for (const cell of this.mapData.cells) {
      const key = cell.biome;
      if (!biomeGroups.has(key)) {
        biomeGroups.set(key, []);
      }
      biomeGroups.get(key)!.push(cell);
    }

    for (const [biome, cells] of biomeGroups) {
      this.createBiomeMesh(biome, cells);
    }
  }

  private createBiomeMesh(biome: string, cells: MapCell[]): void {
    const positions: number[] = [];
    const indices: number[] = [];
    const normals: number[] = [];
    let vertexOffset = 0;

    for (const cell of cells) {
      const poly = cell.polygon;
      if (!poly || poly.length < 3) continue;

      const y = this.useHeight ? cell.elevation * this.heightScale : 0;

      // Center vertex
      const cx = cell.centroid[0] - this.offsetX;
      const cz = cell.centroid[1] - this.offsetZ;
      positions.push(cx, y, cz);
      const centerIdx = vertexOffset;
      vertexOffset++;

      // Edge vertices (polygon is closed: last point == first point)
      const edgeStart = vertexOffset;
      const edgeCount = poly.length - 1;
      for (let i = 0; i < edgeCount; i++) {
        const px = poly[i][0] - this.offsetX;
        const pz = poly[i][1] - this.offsetZ;
        positions.push(px, y, pz);
        vertexOffset++;
      }

      // Fan triangles from center
      for (let i = 0; i < edgeCount; i++) {
        const next = (i + 1) % edgeCount;
        indices.push(centerIdx, edgeStart + i, edgeStart + next);
      }
    }

    if (positions.length === 0) return;

    const mesh = new Mesh(`terrain_${biome}`, this.scene);
    this.terrainMeshes.push(mesh);
    const vertexData = new VertexData();
    vertexData.positions = positions;
    vertexData.indices = indices;

    VertexData.ComputeNormals(positions, indices, normals);
    vertexData.normals = normals;

    vertexData.applyToMesh(mesh);

    const mat = new StandardMaterial(`mat_${biome}`, this.scene);
    const color = BIOME_COLORS[biome as keyof typeof BIOME_COLORS] || new Color3(0.5, 0.5, 0.5);
    mat.diffuseColor = color;
    mat.specularColor = new Color3(0.05, 0.05, 0.05);
    mat.backFaceCulling = false;
    mesh.material = mat;
  }

  private renderGrid(): void {
    const lines: Vector3[][] = [];
    const y = 0.01; // slightly above terrain to avoid z-fighting

    for (const cell of this.mapData.cells) {
      const poly = cell.polygon;
      if (!poly || poly.length < 3) continue;

      const edgeLine: Vector3[] = [];
      for (const [px, pz] of poly) {
        edgeLine.push(new Vector3(px - this.offsetX, y, pz - this.offsetZ));
      }
      lines.push(edgeLine);
    }

    this.gridMesh = MeshBuilder.CreateLineSystem(
      "voronoiGrid",
      { lines },
      this.scene
    ) as unknown as LinesMesh;
    this.gridMesh.color = new Color3(0.15, 0.15, 0.15);
    this.gridMesh.alpha = 0.4;
  }

  private renderRivers(): void {
    const { rivers, cells } = this.mapData;

    for (let ri = 0; ri < rivers.length; ri++) {
      const river = rivers[ri];
      if (river.length < 2) continue;

      const path: Vector3[] = [];
      for (const cellIdx of river) {
        if (cellIdx >= cells.length) continue;
        const cell = cells[cellIdx];
        if (!cell) continue;
        const x = cell.centroid[0] - this.offsetX;
        const z = cell.centroid[1] - this.offsetZ;
        const y = this.useHeight ? cell.elevation * this.heightScale + 0.05 : 0.05;
        path.push(new Vector3(x, y, z));
      }

      if (path.length < 2) continue;

      const riverMesh_ = MeshBuilder.CreateTube(
        `river_${ri}`,
        {
          path,
          radius: 0.15,
          tessellation: 6,
          updatable: false,
        },
        this.scene
      );

      this.riverMeshes.push(riverMesh_);
      const mat = new StandardMaterial(`riverMat_${ri}`, this.scene);
      mat.diffuseColor = new Color3(0.15, 0.3, 0.6);
      mat.specularColor = new Color3(0.3, 0.3, 0.4);
      mat.alpha = 0.85;
      riverMesh_.material = mat;
    }
  }

  private setupPicking(): void {
    this.scene.onPointerDown = (_evt, pickResult) => {
      if (!pickResult.hit) return;

      // Get world-space hit point
      const hit = pickResult.pickedPoint;
      if (!hit) return;

      // Convert back to map coordinates
      const mapX = hit.x + this.offsetX;
      const mapZ = hit.z + this.offsetZ;

      // Find which cell contains this point
      const cellIndex = this.findCellAt(mapX, mapZ);
      if (cellIndex >= 0) {
        this.selectCell(cellIndex);
      }
    };
  }

  private findCellAt(x: number, z: number): number {
    // Quick search: check nearest cells by centroid distance first
    let bestIdx = -1;
    let bestDist = Infinity;

    for (const cell of this.mapData.cells) {
      const dx = cell.centroid[0] - x;
      const dz = cell.centroid[1] - z;
      const dist = dx * dx + dz * dz;
      if (dist < bestDist) {
        bestDist = dist;
        bestIdx = cell.index;
      }
    }

    // Verify with point-in-polygon for the closest few candidates
    if (bestIdx >= 0) {
      const cell = this.mapData.cells[bestIdx];
      if (this.pointInPolygon(x, z, cell.polygon)) {
        return bestIdx;
      }
      // Check neighbors as fallback
      for (const ni of cell.neighbors) {
        if (ni < this.mapData.cells.length) {
          const neighbor = this.mapData.cells[ni];
          if (this.pointInPolygon(x, z, neighbor.polygon)) {
            return ni;
          }
        }
      }
    }

    return bestIdx;
  }

  private pointInPolygon(
    x: number,
    z: number,
    polygon: [number, number][]
  ): boolean {
    let inside = false;
    const n = polygon.length;
    for (let i = 0, j = n - 1; i < n; j = i++) {
      const xi = polygon[i][0], zi = polygon[i][1];
      const xj = polygon[j][0], zj = polygon[j][1];
      if (
        zi > z !== zj > z &&
        x < ((xj - xi) * (z - zi)) / (zj - zi) + xi
      ) {
        inside = !inside;
      }
    }
    return inside;
  }

  private selectCell(cellIndex: number): void {
    this.selectedCellIndex = cellIndex;
    this.highlightCell(cellIndex);
  }

  private highlightCell(cellIndex: number): void {
    // Remove previous highlight
    if (this.highlightMesh) {
      this.highlightMesh.dispose();
      this.highlightMesh = null;
    }

    const cell = this.mapData.cells[cellIndex];
    if (!cell) return;

    const poly = cell.polygon;
    if (!poly || poly.length < 3) return;

    const y = this.useHeight ? cell.elevation * this.heightScale + 0.02 : 0.02;
    const points: Vector3[] = [];
    for (const [px, pz] of poly) {
      points.push(new Vector3(px - this.offsetX, y, pz - this.offsetZ));
    }

    this.highlightMesh = MeshBuilder.CreateLines(
      "cellHighlight",
      { points },
      this.scene
    ) as LinesMesh;
    this.highlightMesh.color = new Color3(1, 0.85, 0.2);
  }

  private renderWaterPlane(): void {
    const size = Math.max(this.mapData.width, this.mapData.height);
    this.waterMesh = MeshBuilder.CreateGround(
      "waterPlane",
      { width: size, height: size, subdivisions: 1 },
      this.scene
    );
    this.waterMesh.position.y = -0.01;

    const waterMat = new StandardMaterial("waterMat", this.scene);
    waterMat.diffuseColor = new Color3(0.15, 0.28, 0.55);
    waterMat.specularColor = new Color3(0.2, 0.2, 0.3);
    waterMat.alpha = 0.6;
    this.waterMesh.material = waterMat;
  }
}
