import { Scene } from "@babylonjs/core/scene";
import { AbstractEngine } from "@babylonjs/core/Engines/abstractEngine";
import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { DirectionalLight } from "@babylonjs/core/Lights/directionalLight";
import { Color4 } from "@babylonjs/core/Maths/math.color";
import { MapGenerator } from "../game/map/MapGenerator";
import { MapRenderer } from "../game/map/MapRenderer";
import { GameUI } from "../ui/GameUI";

export interface GameSceneCallbacks {
  onFantasyMap?: (mapData: import("../game/map/MapGenerator").MapData) => void;
  onPerilousMap?: () => void;
}

export class GameScene {
  private scene: Scene;
  private engine: AbstractEngine;
  private callbacks: GameSceneCallbacks;

  constructor(engine: AbstractEngine, callbacks: GameSceneCallbacks = {}) {
    this.engine = engine;
    this.callbacks = callbacks;
    this.scene = new Scene(engine);
    this.scene.clearColor = new Color4(0.08, 0.12, 0.2, 1);
  }

  setup(): Scene {
    this.createCamera();
    this.createLights();
    this.generateMap();
    return this.scene;
  }

  getScene(): Scene {
    return this.scene;
  }

  private createCamera(): void {
    const camera = new ArcRotateCamera(
      "camera",
      -Math.PI / 4,
      Math.PI / 3.5,
      150,
      Vector3.Zero(),
      this.scene
    );
    camera.attachControl(this.engine.getRenderingCanvas(), true);
    camera.lowerRadiusLimit = 20;
    camera.upperRadiusLimit = 300;
    camera.wheelDeltaPercentage = 0.01;
    camera.panningSensibility = 30;
    camera.panningAxis = new Vector3(1, 0, 1);
  }

  private createLights(): void {
    const hemiLight = new HemisphericLight(
      "hemiLight",
      new Vector3(0, 1, 0),
      this.scene
    );
    hemiLight.intensity = 0.5;

    const dirLight = new DirectionalLight(
      "dirLight",
      new Vector3(-1, -2, -1),
      this.scene
    );
    dirLight.position = new Vector3(50, 100, 50);
    dirLight.intensity = 0.7;
  }

  private generateMap(): void {
    const generator = new MapGenerator({
      width: 200,
      height: 200,
      cellCount: 1500,
      seaLevel: 0.05,
      lloydIterations: 2,
      riverCount: 8,
    });

    console.time("MapGeneration");
    const mapData = generator.generate();
    console.timeEnd("MapGeneration");

    console.log(
      `Map: ${mapData.cells.length} cells, ${mapData.rivers.length} rivers`
    );

    const renderer = new MapRenderer(this.scene, mapData);
    renderer.render();

    // Game UI sidebar
    const onFantasyMap = this.callbacks.onFantasyMap
      ? () => this.callbacks.onFantasyMap!(mapData)
      : undefined;
    const onPerilousMap = this.callbacks.onPerilousMap || undefined;
    new GameUI(this.scene, renderer, onFantasyMap, onPerilousMap);
  }
}
