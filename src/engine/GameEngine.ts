import { Engine } from "@babylonjs/core/Engines/engine";
import { WebGPUEngine } from "@babylonjs/core/Engines/webgpuEngine";
import { AbstractEngine } from "@babylonjs/core/Engines/abstractEngine";

export class GameEngine {
  private engine: AbstractEngine | null = null;
  private canvas: HTMLCanvasElement;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
  }

  async init(): Promise<AbstractEngine> {
    try {
      const webgpuEngine = new WebGPUEngine(this.canvas, {
        adaptToDeviceRatio: true,
      });
      await webgpuEngine.initAsync();
      console.log("✅ WebGPU renderer active");
      this.engine = webgpuEngine;
    } catch (_e) {
      console.warn("⚠️ WebGPU unavailable, fallback to WebGL");
      this.engine = new Engine(this.canvas, true, {
        adaptToDeviceRatio: true,
      });
    }

    window.addEventListener("resize", () => {
      this.engine?.resize();
    });

    return this.engine;
  }

  getEngine(): AbstractEngine {
    if (!this.engine) {
      throw new Error("Engine not initialized. Call init() first.");
    }
    return this.engine;
  }

  getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }
}
