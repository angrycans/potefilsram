import { Scene } from "@babylonjs/core/scene";
import { AbstractEngine } from "@babylonjs/core/Engines/abstractEngine";

export class SceneManager {
  private engine: AbstractEngine;
  private activeScene: Scene | null = null;
  private overlay: HTMLElement | null = null;
  private fadeDuration = 600; // ms, must match CSS transition duration

  constructor(engine: AbstractEngine) {
    this.engine = engine;
    this.overlay = document.getElementById("fadeOverlay");
  }

  setActiveScene(scene: Scene): void {
    this.activeScene = scene;
  }

  getActiveScene(): Scene | null {
    return this.activeScene;
  }

  switchTo(newScene: Scene): void {
    if (this.activeScene) {
      this.activeScene.dispose();
    }
    this.activeScene = newScene;
  }

  async fadeTransition(createNewScene: () => Scene): Promise<void> {
    // Fade out
    this.overlay?.classList.add("active");

    await this.wait(this.fadeDuration);

    // Swap scene
    if (this.activeScene) {
      this.activeScene.dispose();
    }
    this.activeScene = createNewScene();

    // Fade in
    this.overlay?.classList.remove("active");
  }

  private wait(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  startRenderLoop(): void {
    this.engine.runRenderLoop(() => {
      this.activeScene?.render();
    });
  }
}
