import { Scene } from "@babylonjs/core/scene";
import { AbstractEngine } from "@babylonjs/core/Engines/abstractEngine";
import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { PointLight } from "@babylonjs/core/Lights/pointLight";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3, Color4 } from "@babylonjs/core/Maths/math.color";
import { ParticleSystem } from "@babylonjs/core/Particles/particleSystem";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { Animation } from "@babylonjs/core/Animations/animation";
import "@babylonjs/core/Animations/animatable";

export class HomeScene {
  private scene: Scene;
  private fireLight: PointLight | null = null;

  constructor(engine: AbstractEngine) {
    this.scene = new Scene(engine);
    this.scene.clearColor = new Color4(0.02, 0.02, 0.05, 1);
  }

  setup(): Scene {
    this.createCamera();
    this.createLights();
    this.createGround();
    this.createCampfire();
    this.createFireParticles();
    this.createSmokeParticles();
    this.createEmberParticles();
    this.animateFireLight();
    return this.scene;
  }

  getScene(): Scene {
    return this.scene;
  }

  private createCamera(): void {
    const camera = new ArcRotateCamera(
      "homeCamera",
      -Math.PI / 2,
      Math.PI / 2.8,
      6,
      new Vector3(0, 0.8, 0),
      this.scene
    );
    camera.lowerRadiusLimit = 6;
    camera.upperRadiusLimit = 6;
    camera.lowerBetaLimit = Math.PI / 2.8;
    camera.upperBetaLimit = Math.PI / 2.8;
    // Lock camera - no user interaction on home screen
    camera.inputs.clear();
  }

  private createLights(): void {
    // Dim ambient
    const hemi = new HemisphericLight(
      "hemiLight",
      new Vector3(0, 1, 0),
      this.scene
    );
    hemi.intensity = 0.08;
    hemi.diffuse = new Color3(0.3, 0.3, 0.5);

    // Fire point light
    this.fireLight = new PointLight(
      "fireLight",
      new Vector3(0, 0.6, 0),
      this.scene
    );
    this.fireLight.diffuse = new Color3(1, 0.6, 0.2);
    this.fireLight.intensity = 2.5;
    this.fireLight.range = 12;
  }

  private createGround(): void {
    const ground = MeshBuilder.CreateGround(
      "ground",
      { width: 20, height: 20 },
      this.scene
    );
    const mat = new StandardMaterial("groundMat", this.scene);
    mat.diffuseColor = new Color3(0.08, 0.06, 0.04);
    mat.specularColor = new Color3(0, 0, 0);
    ground.material = mat;
  }

  private createCampfire(): void {
    // Stone ring
    const stoneCount = 8;
    for (let i = 0; i < stoneCount; i++) {
      const angle = (i / stoneCount) * Math.PI * 2;
      const radius = 0.6;
      const stone = MeshBuilder.CreateSphere(
        `stone${i}`,
        {
          diameter: 0.22,
          segments: 6,
        },
        this.scene
      );
      stone.position.x = Math.cos(angle) * radius;
      stone.position.z = Math.sin(angle) * radius;
      stone.position.y = 0.06;
      stone.scaling.y = 0.6;

      const mat = new StandardMaterial(`stoneMat${i}`, this.scene);
      const shade = 0.15 + Math.random() * 0.1;
      mat.diffuseColor = new Color3(shade, shade, shade);
      mat.specularColor = new Color3(0, 0, 0);
      stone.material = mat;
    }

    // Wood logs
    const logMat = new StandardMaterial("logMat", this.scene);
    logMat.diffuseColor = new Color3(0.3, 0.15, 0.05);
    logMat.specularColor = new Color3(0.05, 0.02, 0.01);

    for (let i = 0; i < 3; i++) {
      const log = MeshBuilder.CreateCylinder(
        `log${i}`,
        { height: 0.9, diameter: 0.12 },
        this.scene
      );
      const angle = (i / 3) * Math.PI * 2 + 0.3;
      log.position.x = Math.cos(angle) * 0.15;
      log.position.z = Math.sin(angle) * 0.15;
      log.position.y = 0.15;
      log.rotation.z = Math.PI / 2 - 0.4;
      log.rotation.y = angle;
      log.material = logMat;
    }
  }

  private createFireParticles(): void {
    const fire = new ParticleSystem("fire", 800, this.scene);

    fire.createPointEmitter(new Vector3(-0.1, 0, -0.1), new Vector3(0.1, 1, 0.1));
    fire.emitter = new Vector3(0, 0.2, 0);

    // Use procedural texture - circle
    fire.particleTexture = this.createFireTexture();

    fire.minLifeTime = 0.2;
    fire.maxLifeTime = 0.6;
    fire.minSize = 0.15;
    fire.maxSize = 0.5;
    fire.minEmitPower = 0.5;
    fire.maxEmitPower = 1.5;
    fire.emitRate = 400;

    // Fire colors: bright yellow core → orange → dark red
    fire.color1 = new Color4(1, 0.9, 0.3, 1);
    fire.color2 = new Color4(1, 0.5, 0.1, 1);
    fire.colorDead = new Color4(0.6, 0.1, 0.0, 0);

    fire.minEmitBox = new Vector3(-0.15, 0, -0.15);
    fire.maxEmitBox = new Vector3(0.15, 0, 0.15);

    fire.blendMode = ParticleSystem.BLENDMODE_ADD;
    fire.gravity = new Vector3(0, 2, 0);

    fire.addSizeGradient(0, 0.4, 0.5);
    fire.addSizeGradient(0.5, 0.25, 0.35);
    fire.addSizeGradient(1.0, 0.05, 0.1);

    fire.start();
  }

  private createSmokeParticles(): void {
    const smoke = new ParticleSystem("smoke", 200, this.scene);

    smoke.createPointEmitter(new Vector3(-0.05, 0, -0.05), new Vector3(0.05, 1, 0.05));
    smoke.emitter = new Vector3(0, 0.8, 0);

    smoke.particleTexture = this.createFireTexture();

    smoke.minLifeTime = 1.0;
    smoke.maxLifeTime = 2.5;
    smoke.minSize = 0.3;
    smoke.maxSize = 0.8;
    smoke.minEmitPower = 0.3;
    smoke.maxEmitPower = 0.8;
    smoke.emitRate = 60;

    smoke.color1 = new Color4(0.3, 0.3, 0.35, 0.15);
    smoke.color2 = new Color4(0.2, 0.2, 0.25, 0.1);
    smoke.colorDead = new Color4(0.1, 0.1, 0.12, 0);

    smoke.blendMode = ParticleSystem.BLENDMODE_STANDARD;
    smoke.gravity = new Vector3(0, 0.5, 0);

    smoke.addSizeGradient(0, 0.3);
    smoke.addSizeGradient(0.5, 0.6);
    smoke.addSizeGradient(1.0, 1.0);

    smoke.start();
  }

  private createEmberParticles(): void {
    const embers = new ParticleSystem("embers", 100, this.scene);

    embers.createPointEmitter(new Vector3(-0.2, 0, -0.2), new Vector3(0.2, 1, 0.2));
    embers.emitter = new Vector3(0, 0.4, 0);

    embers.particleTexture = this.createFireTexture();

    embers.minLifeTime = 0.8;
    embers.maxLifeTime = 2.0;
    embers.minSize = 0.02;
    embers.maxSize = 0.06;
    embers.minEmitPower = 1.0;
    embers.maxEmitPower = 3.0;
    embers.emitRate = 30;

    embers.color1 = new Color4(1, 0.8, 0.2, 1);
    embers.color2 = new Color4(1, 0.4, 0.1, 1);
    embers.colorDead = new Color4(0.5, 0.1, 0.0, 0);

    embers.blendMode = ParticleSystem.BLENDMODE_ADD;
    embers.gravity = new Vector3(0, 1.5, 0);

    embers.start();
  }

  private createFireTexture(): Texture {
    // Procedural circle texture for particles
    const size = 128;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d")!;

    const gradient = ctx.createRadialGradient(
      size / 2, size / 2, 0,
      size / 2, size / 2, size / 2
    );
    gradient.addColorStop(0, "rgba(255, 255, 255, 1)");
    gradient.addColorStop(0.4, "rgba(255, 255, 255, 0.6)");
    gradient.addColorStop(1, "rgba(255, 255, 255, 0)");

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);

    const texture = new Texture(
      canvas.toDataURL(),
      this.scene,
      false,
      false
    );
    return texture;
  }

  private animateFireLight(): void {
    if (!this.fireLight) return;

    // Flickering fire light animation
    const flickerAnim = new Animation(
      "fireLightFlicker",
      "intensity",
      30,
      Animation.ANIMATIONTYPE_FLOAT,
      Animation.ANIMATIONLOOPMODE_CYCLE
    );

    const keys = [];
    const frames = 60;
    for (let i = 0; i <= frames; i++) {
      keys.push({
        frame: i,
        value: 2.0 + Math.random() * 1.5,
      });
    }
    flickerAnim.setKeys(keys);
    this.fireLight.animations.push(flickerAnim);
    this.scene.beginAnimation(this.fireLight, 0, frames, true);
  }
}
