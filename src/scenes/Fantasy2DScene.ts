import { Scene } from "@babylonjs/core/scene";
import { AbstractEngine } from "@babylonjs/core/Engines/abstractEngine";
import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { Color3, Color4 } from "@babylonjs/core/Maths/math.color";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture";
import { AdvancedDynamicTexture } from "@babylonjs/gui/2D/advancedDynamicTexture";
import { Button } from "@babylonjs/gui/2D/controls/button";
import { StackPanel } from "@babylonjs/gui/2D/controls/stackPanel";
import { Control } from "@babylonjs/gui/2D/controls/control";
import { Tools } from "@babylonjs/core/Misc/tools";
import "@babylonjs/core/Engines/Extensions/engine.dynamicTexture";
import "@babylonjs/core/Engines/WebGPU/Extensions/engine.dynamicTexture";
import type { MapData } from "../game/map/MapGenerator";
import { MapCanvasRenderer } from "../game/map/MapCanvasRenderer";

export class Fantasy2DScene {
  private scene: Scene;
  private engine: AbstractEngine;
  private mapData: MapData;
  private onBack: () => void;

  private canvasRenderer!: MapCanvasRenderer;
  private dynTex!: DynamicTexture;
  private mapSize = 0;

  // State
  private showGrid = false;
  private selectedCellIndex = -1;

  constructor(engine: AbstractEngine, mapData: MapData, onBack: () => void) {
    this.engine = engine;
    this.mapData = mapData;
    this.onBack = onBack;
    this.scene = new Scene(engine);
    this.scene.clearColor = new Color4(0.82, 0.78, 0.7, 1);
  }

  setup(): Scene {
    this.createCamera();
    this.createLight();
    this.createFantasyMap();
    this.setupPicking();
    this.createUI();
    return this.scene;
  }

  private createCamera(): void {
    const size = Math.max(this.mapData.width, this.mapData.height);
    const camera = new ArcRotateCamera(
      "cam2d",
      -Math.PI / 2,
      0.01,
      size * 0.55,
      Vector3.Zero(),
      this.scene
    );
    camera.attachControl(this.engine.getRenderingCanvas(), true);
    camera.lowerBetaLimit = 0.01;
    camera.upperBetaLimit = Math.PI / 4;
    camera.lowerRadiusLimit = 30;
    camera.upperRadiusLimit = size * 1.2;
    camera.wheelDeltaPercentage = 0.01;
    camera.panningSensibility = 30;
    camera.panningAxis = new Vector3(1, 0, 1);
  }

  private createLight(): void {
    const light = new HemisphericLight("hemi2d", new Vector3(0, 1, 0), this.scene);
    light.intensity = 1.0;
  }

  private createFantasyMap(): void {
    this.mapSize = Math.max(this.mapData.width, this.mapData.height);
    this.canvasRenderer = new MapCanvasRenderer(this.mapData, 2048);
    this.canvasRenderer.render();

    this.dynTex = new DynamicTexture("fantasyTex", 2048, this.scene, false);
    this.refreshTexture();

    const plane = MeshBuilder.CreateGround(
      "fantasyMap",
      { width: this.mapSize, height: this.mapSize, subdivisions: 1 },
      this.scene
    );

    const mat = new StandardMaterial("fantasyMat", this.scene);
    mat.diffuseTexture = this.dynTex;
    mat.specularColor = new Color3(0, 0, 0);
    mat.emissiveColor = new Color3(0.5, 0.5, 0.5);
    mat.backFaceCulling = false;
    plane.material = mat;
  }

  private refreshTexture(): void {
    this.canvasRenderer.renderWithOverlays({
      showGrid: this.showGrid,
      selectedCellIndex: this.selectedCellIndex,
    });

    const texCtx = this.dynTex.getContext();
    texCtx.drawImage(this.canvasRenderer.getCanvas() as CanvasImageSource, 0, 0);
    this.dynTex.update();
  }

  private setupPicking(): void {
    const halfSize = this.mapSize / 2;

    this.scene.onPointerDown = (_evt, pickResult) => {
      if (!pickResult.hit || !pickResult.pickedPoint) return;

      const hit = pickResult.pickedPoint;
      // Convert world coords to map coords (0..width, 0..height)
      // X: world -half → map 0, world +half → map width
      // Z: flipped — canvas Y=0 (top) = world Z=+half, canvas Y=max (bottom) = world Z=-half
      const mapX = hit.x + halfSize;
      const mapZ = halfSize - hit.z;

      const cellIndex = this.canvasRenderer.findCellAt(mapX, mapZ);
      if (cellIndex >= 0) {
        this.selectedCellIndex = cellIndex;
        this.refreshTexture();
      }
    };
  }

  private createUI(): void {
    const gui = AdvancedDynamicTexture.CreateFullscreenUI("fantasy2dUI", true, this.scene);

    // Side panel
    const panel = new StackPanel("sidePanel2d");
    panel.width = "160px";
    panel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    panel.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    panel.top = "20px";
    panel.left = "20px";
    panel.spacing = 8;
    gui.addControl(panel);

    // Back button
    const backBtn = this.createButton("backBtn", "← Back to 3D");
    backBtn.onPointerClickObservable.add(() => {
      this.onBack();
    });
    panel.addControl(backBtn);

    // Grid toggle
    const gridBtn = this.createButton("gridBtn", "Grid: OFF");
    gridBtn.onPointerClickObservable.add(() => {
      this.showGrid = !this.showGrid;
      const tb = gridBtn.textBlock;
      if (tb) tb.text = this.showGrid ? "Grid: ON" : "Grid: OFF";
      this.refreshTexture();
    });
    panel.addControl(gridBtn);

    // Screenshot button
    const screenshotBtn = this.createButton("screenshotBtn2d", "Screenshot");
    screenshotBtn.onPointerClickObservable.add(() => {
      this.takeScreenshot();
    });
    panel.addControl(screenshotBtn);
  }

  private createButton(name: string, label: string): Button {
    const btn = Button.CreateSimpleButton(name, label);
    btn.width = "150px";
    btn.height = "40px";
    btn.color = "#d0c8b0";
    btn.background = "rgba(20, 25, 35, 0.85)";
    btn.cornerRadius = 6;
    btn.thickness = 1;
    btn.fontSize = 14;
    btn.fontFamily = "Arial, sans-serif";

    btn.onPointerEnterObservable.add(() => {
      btn.background = "rgba(40, 50, 70, 0.9)";
      btn.color = "#ffffff";
    });
    btn.onPointerOutObservable.add(() => {
      btn.background = "rgba(20, 25, 35, 0.85)";
      btn.color = "#d0c8b0";
    });

    return btn;
  }

  private takeScreenshot(): void {
    const engine = this.scene.getEngine();
    const canvas = engine.getRenderingCanvas();
    if (!canvas) return;

    Tools.CreateScreenshotUsingRenderTarget(
      engine,
      this.scene.activeCamera!,
      { width: canvas.width, height: canvas.height },
      undefined,
      undefined,
      undefined,
      undefined,
      "fantasy-map.png"
    );
  }
}
