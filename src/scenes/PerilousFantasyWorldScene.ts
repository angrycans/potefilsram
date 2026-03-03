import { Scene } from "@babylonjs/core/scene";
import { AbstractEngine } from "@babylonjs/core/Engines/abstractEngine";
import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { DirectionalLight } from "@babylonjs/core/Lights/directionalLight";
import { Color4, Color3 } from "@babylonjs/core/Maths/math.color";
import { AdvancedDynamicTexture } from "@babylonjs/gui/2D/advancedDynamicTexture";
import { Button } from "@babylonjs/gui/2D/controls/button";
import { TextBlock } from "@babylonjs/gui/2D/controls/textBlock";
import { Control } from "@babylonjs/gui/2D/controls/control";

import { PerilousMapGenerator, type PerilousMapData } from "../game/map/PerilousMapGenerator";
import { PerilousBabylonRenderer } from "../game/map/PerilousBabylonRenderer";

export class PerilousFantasyWorldScene {
  private scene: Scene;
  private engine: AbstractEngine;
  private onBack: () => void;

  private ui: AdvancedDynamicTexture | null = null;
  private loadingLabel: TextBlock | null = null;

  private renderer: PerilousBabylonRenderer | null = null;
  private mapData: PerilousMapData | null = null;

  private isDisposed = false;

  constructor(engine: AbstractEngine, onBack: () => void) {
    this.engine = engine;
    this.onBack = onBack;
    this.scene = new Scene(engine);
    this.scene.clearColor = new Color4(0.1, 0.15, 0.2, 1);
  }

  setup(): Scene {
    this.createCamera();
    this.createLights();
    this.createUI();
    this.generateAndRenderMap();
    return this.scene;
  }

  getScene(): Scene {
    return this.scene;
  }

  private createCamera(): void {
    const camera = new ArcRotateCamera(
      "perilCam",
      -Math.PI / 2,
      Math.PI / 3,
      15,
      Vector3.Zero(),
      this.scene
    );
    camera.attachControl(this.engine.getRenderingCanvas(), true);
    camera.lowerBetaLimit = 0.3;
    camera.upperBetaLimit = Math.PI / 2.2;
    camera.lowerRadiusLimit = 5;
    camera.upperRadiusLimit = 30;
    camera.wheelDeltaPercentage = 0.02;
    camera.panningSensibility = 100;
    camera.pinchPrecision = 50;
  }

  private createLights(): void {
    const hemi = new HemisphericLight("perilLight", new Vector3(0, 1, 0), this.scene);
    hemi.intensity = 0.7;
    hemi.groundColor = new Color3(0.2, 0.2, 0.3);
    hemi.diffuse = new Color3(1, 0.95, 0.9);

    const dir = new DirectionalLight("dirLight", new Vector3(-1, -2, -1), this.scene);
    dir.intensity = 0.5;
    dir.diffuse = new Color3(1, 0.9, 0.8);
  }

  private createUI(): void {
    this.ui = AdvancedDynamicTexture.CreateFullscreenUI("perilousOverlay", true, this.scene);

    this.loadingLabel = new TextBlock("perilousLoading");
    this.loadingLabel.text = "Generating map...";
    this.loadingLabel.color = "#e8d5b5";
    this.loadingLabel.fontSize = 26;
    this.loadingLabel.top = "-44%";
    this.loadingLabel.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
    this.loadingLabel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    this.ui.addControl(this.loadingLabel);

    const backBtn = Button.CreateSimpleButton("perilousBack", "BACK");
    backBtn.width = "120px";
    backBtn.height = "46px";
    backBtn.cornerRadius = 22;
    backBtn.thickness = 2;
    backBtn.color = "#f4e6ca";
    backBtn.background = "rgba(40, 24, 8, 0.9)";
    backBtn.fontSize = 20;
    backBtn.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
    backBtn.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    backBtn.top = "16px";
    backBtn.left = "-16px";

    backBtn.onPointerEnterObservable.add(() => {
      backBtn.background = "rgba(74, 43, 13, 0.95)";
    });
    backBtn.onPointerOutObservable.add(() => {
      backBtn.background = "rgba(40, 24, 8, 0.9)";
    });
    backBtn.onPointerClickObservable.add(() => {
      this.dispose();
      this.onBack();
    });

    this.ui.addControl(backBtn);

    const regenerateBtn = Button.CreateSimpleButton("regenerate", "NEW MAP");
    regenerateBtn.width = "140px";
    regenerateBtn.height = "46px";
    regenerateBtn.cornerRadius = 22;
    regenerateBtn.thickness = 2;
    regenerateBtn.color = "#f4e6ca";
    regenerateBtn.background = "rgba(40, 24, 8, 0.9)";
    regenerateBtn.fontSize = 18;
    regenerateBtn.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    regenerateBtn.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    regenerateBtn.top = "16px";
    regenerateBtn.left = "16px";

    regenerateBtn.onPointerEnterObservable.add(() => {
      regenerateBtn.background = "rgba(74, 43, 13, 0.95)";
    });
    regenerateBtn.onPointerOutObservable.add(() => {
      regenerateBtn.background = "rgba(40, 24, 8, 0.9)";
    });
    regenerateBtn.onPointerClickObservable.add(() => {
      this.regenerateMap();
    });

    this.ui.addControl(regenerateBtn);
  }

  private generateAndRenderMap(): void {
    if (this.loadingLabel) {
      this.loadingLabel.text = "Generating map...";
    }

    const generator = new PerilousMapGenerator({
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
      seed: Date.now(),
    });
    this.mapData = generator.generate();

    this.renderer = new PerilousBabylonRenderer(this.scene, this.mapData, {
      theme: "fullColour",
      showMountains: true,
      showTrees: true,
      showRivers: true,
      showRoutes: true,
      showTowns: true,
      showDanger: true,
      showRegionLabels: true,
      showMountainLabels: true,
      showTownLabels: true,
      showRiverLabels: false,
    });

    this.renderer.render();

    if (this.loadingLabel) {
      this.loadingLabel.text = "";
    }
  }

  private regenerateMap(): void {
    if (this.renderer) {
      this.renderer.dispose();
      this.renderer = null;
    }

    this.generateAndRenderMap();
  }

  dispose(): void {
    if (this.isDisposed) return;
    this.isDisposed = true;

    this.renderer?.dispose();
    this.renderer = null;

    this.ui?.dispose();
    this.ui = null;
    this.loadingLabel = null;
  }
}
