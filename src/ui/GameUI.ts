import { AdvancedDynamicTexture } from "@babylonjs/gui/2D/advancedDynamicTexture";
import { Button } from "@babylonjs/gui/2D/controls/button";
import { StackPanel } from "@babylonjs/gui/2D/controls/stackPanel";
import { Control } from "@babylonjs/gui/2D/controls/control";
import { Scene } from "@babylonjs/core/scene";
import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import { Tools } from "@babylonjs/core/Misc/tools";
import { MapRenderer } from "../game/map/MapRenderer";
import "@babylonjs/core/Engines/Extensions/engine.dynamicTexture";
import "@babylonjs/core/Engines/WebGPU/Extensions/engine.dynamicTexture";

export class GameUI {
  private gui: AdvancedDynamicTexture;
  private scene: Scene;
  private mapRenderer: MapRenderer;
  private onFantasyMap?: () => void;
  private onPerilousMap?: () => void;

  constructor(scene: Scene, mapRenderer: MapRenderer, onFantasyMap?: () => void, onPerilousMap?: () => void) {
    this.scene = scene;
    this.mapRenderer = mapRenderer;
    this.onFantasyMap = onFantasyMap;
    this.onPerilousMap = onPerilousMap;
    this.gui = AdvancedDynamicTexture.CreateFullscreenUI("gameUI", true, scene);
    this.createSidePanel();
  }

  private createSidePanel(): void {
    // Side panel container
    const panel = new StackPanel("sidePanel");
    panel.width = "160px";
    panel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    panel.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    panel.top = "20px";
    panel.left = "20px";
    panel.spacing = 8;
    this.gui.addControl(panel);

    // Top View button
    const topViewBtn = this.createButton("topViewBtn", "Top View");
    topViewBtn.onPointerClickObservable.add(() => {
      this.setTopView();
    });
    panel.addControl(topViewBtn);

    // Screenshot button
    const screenshotBtn = this.createButton("screenshotBtn", "Screenshot");
    screenshotBtn.onPointerClickObservable.add(() => {
      this.takeScreenshot();
    });
    panel.addControl(screenshotBtn);

    // Toggle height button
    const heightBtn = this.createButton("heightBtn", "Height: OFF");
    heightBtn.onPointerClickObservable.add(() => {
      this.mapRenderer.toggleHeight();
      const on = this.mapRenderer.isHeightEnabled();
      const tb = heightBtn.textBlock;
      if (tb) tb.text = on ? "Height: ON" : "Height: OFF";
    });
    panel.addControl(heightBtn);

    // 45° perspective view button
    const perspBtn = this.createButton("perspBtn", "45° View");
    perspBtn.onPointerClickObservable.add(() => {
      this.set45View();
    });
    panel.addControl(perspBtn);

    // Fantasy 2D map scene button
    if (this.onFantasyMap) {
      const fantasyBtn = this.createButton("fantasyBtn", "Fantasy Map");
      fantasyBtn.onPointerClickObservable.add(() => {
        this.onFantasyMap?.();
      });
      panel.addControl(fantasyBtn);
    }

    // Perilous Shores map scene button
    if (this.onPerilousMap) {
      const perilousBtn = this.createButton("perilousBtn", "Perilous Map");
      perilousBtn.onPointerClickObservable.add(() => {
        this.onPerilousMap?.();
      });
      panel.addControl(perilousBtn);
    }
  }

  private createButton(name: string, label: string): Button {
    const btn = Button.CreateSimpleButton(name, label);
    btn.width = "150px";
    btn.height = "40px";
    btn.color = "#d0c8b0";
    btn.background = "rgba(20, 25, 35, 0.8)";
    btn.cornerRadius = 6;
    btn.thickness = 1;
    btn.fontSize = 14;
    btn.fontFamily = "Arial, sans-serif";

    btn.onPointerEnterObservable.add(() => {
      btn.background = "rgba(40, 50, 70, 0.9)";
      btn.color = "#ffffff";
    });
    btn.onPointerOutObservable.add(() => {
      btn.background = "rgba(20, 25, 35, 0.8)";
      btn.color = "#d0c8b0";
    });

    return btn;
  }

  private setTopView(): void {
    const camera = this.scene.activeCamera as ArcRotateCamera;
    if (!camera) return;

    // Animate to top-down view
    const totalFrames = 15;

    // Target: alpha stays, beta = 0 (top down), radius = 200
    const startBeta = camera.beta;
    const startRadius = camera.radius;
    const targetBeta = 0.01; // near-zero to look straight down
    const targetRadius = 200;

    let frame = 0;
    const anim = this.scene.onBeforeRenderObservable.add(() => {
      frame++;
      const t = Math.min(frame / totalFrames, 1);
      // Smooth ease-out
      const ease = 1 - Math.pow(1 - t, 3);

      camera.beta = startBeta + (targetBeta - startBeta) * ease;
      camera.radius = startRadius + (targetRadius - startRadius) * ease;

      if (t >= 1) {
        this.scene.onBeforeRenderObservable.remove(anim);
      }
    });
  }

  private set45View(): void {
    const camera = this.scene.activeCamera as ArcRotateCamera;
    if (!camera) return;

    const totalFrames = 15;
    const startBeta = camera.beta;
    const startRadius = camera.radius;
    const targetBeta = Math.PI / 4; // 45°
    const targetRadius = 150;

    let frame = 0;
    const anim = this.scene.onBeforeRenderObservable.add(() => {
      frame++;
      const t = Math.min(frame / totalFrames, 1);
      const ease = 1 - Math.pow(1 - t, 3);

      camera.beta = startBeta + (targetBeta - startBeta) * ease;
      camera.radius = startRadius + (targetRadius - startRadius) * ease;

      if (t >= 1) {
        this.scene.onBeforeRenderObservable.remove(anim);
      }
    });
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
      "potefilsram-map.png"
    );
  }

  dispose(): void {
    this.gui.dispose();
  }
}
