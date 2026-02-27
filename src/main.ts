import { Engine } from "@babylonjs/core/Engines/engine";
import { WebGPUEngine } from "@babylonjs/core/Engines/webgpuEngine";
import { AbstractEngine } from "@babylonjs/core/Engines/abstractEngine";
import { Scene } from "@babylonjs/core/scene";
import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { DirectionalLight } from "@babylonjs/core/Lights/directionalLight";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3, Color4 } from "@babylonjs/core/Maths/math.color";
import { ShadowGenerator } from "@babylonjs/core/Lights/Shadows/shadowGenerator";

import "@babylonjs/core/Lights/Shadows/shadowGeneratorSceneComponent";

async function createEngine(canvas: HTMLCanvasElement): Promise<AbstractEngine> {
  // 尝试使用 WebGPU，失败则回退到 WebGL
  try {
    const webgpuEngine = new WebGPUEngine(canvas, {
      adaptToDeviceRatio: true,
    });
    await webgpuEngine.initAsync();
    console.log("✅ 使用 WebGPU 渲染");
    return webgpuEngine;
  } catch (_e) {
    console.warn("⚠️ WebGPU 不可用，回退到 WebGL");
    const webglEngine = new Engine(canvas, true, {
      adaptToDeviceRatio: true,
    });
    return webglEngine;
  }
}

function createScene(engine: AbstractEngine): Scene {
  const scene = new Scene(engine);
  scene.clearColor = new Color4(0.05, 0.05, 0.1, 1);

  // 摄像机
  const camera = new ArcRotateCamera(
    "camera",
    -Math.PI / 4,
    Math.PI / 3,
    10,
    Vector3.Zero(),
    scene
  );
  camera.attachControl(engine.getRenderingCanvas(), true);
  camera.lowerRadiusLimit = 3;
  camera.upperRadiusLimit = 25;
  camera.wheelDeltaPercentage = 0.01;

  // 环境光
  const hemiLight = new HemisphericLight(
    "hemiLight",
    new Vector3(0, 1, 0),
    scene
  );
  hemiLight.intensity = 0.4;

  // 方向光 + 阴影
  const dirLight = new DirectionalLight(
    "dirLight",
    new Vector3(-1, -2, -1),
    scene
  );
  dirLight.position = new Vector3(5, 10, 5);
  dirLight.intensity = 0.8;

  const shadowGen = new ShadowGenerator(1024, dirLight);
  shadowGen.useBlurExponentialShadowMap = true;

  // 地面
  const ground = MeshBuilder.CreateGround(
    "ground",
    { width: 12, height: 12 },
    scene
  );
  const groundMat = new StandardMaterial("groundMat", scene);
  groundMat.diffuseColor = new Color3(0.2, 0.25, 0.3);
  groundMat.specularColor = new Color3(0.1, 0.1, 0.1);
  ground.material = groundMat;
  ground.receiveShadows = true;

  // 立方体
  const box = MeshBuilder.CreateBox("box", { size: 1.5 }, scene);
  box.position = new Vector3(-2, 0.75, 0);
  const boxMat = new StandardMaterial("boxMat", scene);
  boxMat.diffuseColor = new Color3(0.9, 0.3, 0.2);
  box.material = boxMat;
  shadowGen.addShadowCaster(box);

  // 球体
  const sphere = MeshBuilder.CreateSphere(
    "sphere",
    { diameter: 1.5, segments: 32 },
    scene
  );
  sphere.position = new Vector3(0, 0.75, 0);
  const sphereMat = new StandardMaterial("sphereMat", scene);
  sphereMat.diffuseColor = new Color3(0.2, 0.6, 0.9);
  sphere.material = sphereMat;
  shadowGen.addShadowCaster(sphere);

  // 圆柱体
  const cylinder = MeshBuilder.CreateCylinder(
    "cylinder",
    { height: 1.5, diameter: 1.2 },
    scene
  );
  cylinder.position = new Vector3(2, 0.75, 0);
  const cylMat = new StandardMaterial("cylMat", scene);
  cylMat.diffuseColor = new Color3(0.3, 0.8, 0.4);
  cylinder.material = cylMat;
  shadowGen.addShadowCaster(cylinder);

  // 旋转动画
  scene.registerBeforeRender(() => {
    const delta = engine.getDeltaTime() / 1000;
    box.rotation.y += delta * 0.8;
    sphere.rotation.y += delta * 1.0;
    cylinder.rotation.y += delta * 0.6;
  });

  return scene;
}

async function main() {
  const canvas = document.getElementById("renderCanvas") as HTMLCanvasElement;
  if (!canvas) {
    throw new Error("Canvas element not found");
  }

  const engine = await createEngine(canvas);
  const scene = createScene(engine);

  // 渲染循环
  engine.runRenderLoop(() => {
    scene.render();
  });

  // 自适应窗口大小
  window.addEventListener("resize", () => {
    engine.resize();
  });
}

main().catch(console.error);
