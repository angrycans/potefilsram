import {
  ArcRotateCamera,
  Color3,
  Color4,
  Engine,
  HemisphericLight,
  Mesh,
  MeshBuilder,
  PointerEventTypes,
  Scene,
  StandardMaterial,
  Texture,
  Vector3,
} from "@babylonjs/core";
import type { UiToSceneEvent } from "@marslife/shared-schema";

export type SurfaceHudState = {
  altKm: number;
  latDeg: number;
  lonDeg: number;
  pickElevM: number | null;
};

export type SceneEngineOptions = {
  canvas: HTMLCanvasElement;
  onHudUpdate?: (state: SurfaceHudState) => void;
};

export class MarsSceneEngine {
  private readonly engine: Engine;
  private readonly scene: Scene;
  private readonly camera: ArcRotateCamera;
  private readonly onHudUpdate?: (state: SurfaceHudState) => void;
  private readonly mars: Mesh;

  private readonly marsRadiusMeters = 3_389_500;
  private readonly marsRadius = 3;
  private readonly minSurfaceAltitude = 0.12;
  private readonly maxSurfaceAltitude = 6;
  private readonly minMarsElevationMeters = -9000;
  private readonly maxMarsElevationMeters = 30000;
  private readonly minScreenDiameterPx = 56;
  private readonly hardMaxRadius = this.marsRadius + 4.2;
  private pickElevationMeters: number | null = null;
  private readonly wheelHandler: (event: WheelEvent) => void;

  constructor(options: SceneEngineOptions) {
    this.onHudUpdate = options.onHudUpdate;
    this.engine = new Engine(options.canvas, true);
    this.scene = new Scene(this.engine);
    this.scene.clearColor = new Color4(0.03, 0.04, 0.08, 1);

    this.camera = new ArcRotateCamera("camera", Math.PI / 2, Math.PI / 2.25, 8, Vector3.Zero(), this.scene);
    this.camera.attachControl(options.canvas, true);
    this.camera.minZ = 0.01;
    this.camera.maxZ = 1000;
    this.camera.wheelDeltaPercentage = 0.02;
    this.camera.panningSensibility = 0;
    this.camera.useAutoRotationBehavior = false;

    // Keep camera outside the surface and away from pole singularities.
    this.camera.lowerRadiusLimit = this.marsRadius + this.minSurfaceAltitude;
    this.camera.upperRadiusLimit = this.hardMaxRadius;
    this.camera.lowerBetaLimit = 0.12;
    this.camera.upperBetaLimit = Math.PI - 0.12;
    this.wheelHandler = (event: WheelEvent) => {
      if (event.deltaY > 0 && this.camera.radius >= (this.camera.upperRadiusLimit ?? this.hardMaxRadius) - 0.001) {
        this.camera.inertialRadiusOffset = 0;
        event.preventDefault();
      }
    };
    options.canvas.addEventListener("wheel", this.wheelHandler, { passive: false });

    const light = new HemisphericLight("light", new Vector3(0, 1, 0), this.scene);
    light.intensity = 1.05;

    this.mars = MeshBuilder.CreateSphere(
      "mars",
      { diameter: this.marsRadius * 2, segments: 128, sideOrientation: Mesh.FRONTSIDE },
      this.scene
    );
    this.mars.alwaysSelectAsActiveMesh = true;

    const marsMaterial = new StandardMaterial("mars-material", this.scene);
    marsMaterial.diffuseColor = new Color3(0.73, 0.45, 0.31);
    marsMaterial.specularColor = Color3.Black();
    marsMaterial.ambientColor = new Color3(0.17, 0.1, 0.07);
    // Keep visible even if camera reaches a bad near-surface state.
    marsMaterial.backFaceCulling = false;

    // Load texture lazily. If missing/broken, keep pure-color Mars material (no checkerboard fallback).
    const textureUrl = "/datasets/mola/mars_mola_albedo.png";
    const albedo = new Texture(
      textureUrl,
      this.scene,
      true,
      false,
      Texture.TRILINEAR_SAMPLINGMODE,
      () => {
        // Clamp on U avoids blending the 0/360 edge and reduces vertical seam artifacts.
        albedo.wrapU = Texture.CLAMP_ADDRESSMODE;
        albedo.wrapV = Texture.CLAMP_ADDRESSMODE;
        albedo.uOffset = 0.001;
        albedo.uScale = 0.998;
        marsMaterial.diffuseTexture = albedo;
      },
      () => {
        albedo.dispose();
      }
    );

    this.mars.material = marsMaterial;

    this.scene.onPointerObservable.add((pointerInfo) => {
      if (pointerInfo.type !== PointerEventTypes.POINTERDOWN) {
        return;
      }
      const pick = this.scene.pick(this.scene.pointerX, this.scene.pointerY, (mesh) => mesh === this.mars);
      if (!pick?.hit || !pick.pickedPoint) {
        return;
      }
      const pickedRadius = pick.pickedPoint.length();
      // Ignore invalid radii (usually caused by bad pick target/state) to avoid absurd elevation values.
      if (pickedRadius < this.marsRadius * 0.8 || pickedRadius > this.marsRadius * 1.2) {
        return;
      }
      const rawElevation = this.worldRadiusToElevationMeters(pickedRadius);
      this.pickElevationMeters = this.clamp(rawElevation, this.minMarsElevationMeters, this.maxMarsElevationMeters);
      this.pushHudUpdate();
    });
  }

  start() {
    this.engine.runRenderLoop(() => {
      this.enforceCameraSafety();
      this.pushHudUpdate();
      this.scene.render();
    });
    window.addEventListener("resize", this.resize);
  }

  handleUiEvent(event: UiToSceneEvent) {
    if (event.type === "set_time") {
      this.scene.metadata = { ...this.scene.metadata, time: event.payload.timestamp };
    }
  }

  dispose() {
    window.removeEventListener("resize", this.resize);
    this.engine.getRenderingCanvas()?.removeEventListener("wheel", this.wheelHandler);
    this.engine.dispose();
  }

  private resize = () => {
    this.engine.resize();
  };

  private enforceCameraSafety() {
    const minRadius = this.marsRadius + this.minSurfaceAltitude + 0.005;
    const maxRadius = this.hardMaxRadius;

    // Hard lock: never allow zoom-out beyond ping-pong sized visual threshold.
    this.camera.upperRadiusLimit = this.hardMaxRadius;

    if (this.camera.radius < minRadius) {
      this.camera.radius = minRadius;
      this.camera.inertialRadiusOffset = 0;
    } else if (this.camera.radius > maxRadius) {
      this.camera.radius = maxRadius;
      this.camera.inertialRadiusOffset = 0;
    }

    if (this.camera.beta < 0.12) {
      this.camera.beta = 0.12;
    } else if (this.camera.beta > Math.PI - 0.12) {
      this.camera.beta = Math.PI - 0.12;
    }

    // Keep clip planes conservative and stable to avoid sudden clipping disappearance.
    this.camera.minZ = 0.01;
    this.camera.maxZ = 1000;
  }

  private pushHudUpdate() {
    if (!this.onHudUpdate) {
      return;
    }
    const position = this.camera.position;
    const radius = position.length();
    const normalized = position.normalizeToNew();
    const latDeg = (Math.asin(normalized.y) * 180) / Math.PI;
    let lonDeg = (Math.atan2(normalized.z, normalized.x) * 180) / Math.PI;
    if (lonDeg < 0) {
      lonDeg += 360;
    }
    this.onHudUpdate({
      altKm: this.worldRadiusToElevationMeters(radius) / 1000,
      latDeg,
      lonDeg,
      pickElevM: this.pickElevationMeters,
    });
  }

  private worldRadiusToElevationMeters(worldRadius: number) {
    const metersPerWorldUnit = this.marsRadiusMeters / this.marsRadius;
    return (worldRadius - this.marsRadius) * metersPerWorldUnit;
  }

  private clamp(value: number, min: number, max: number) {
    return Math.min(max, Math.max(min, value));
  }
}
