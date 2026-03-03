import { GameEngine } from "./engine/GameEngine";
import { SceneManager } from "./engine/SceneManager";
import { HomeScene } from "./scenes/HomeScene";
import { GameScene } from "./scenes/GameScene";
import { Fantasy2DScene } from "./scenes/Fantasy2DScene";
import { PerilousFantasyWorldScene } from "./scenes/PerilousFantasyWorldScene";
import { HomeUI } from "./ui/HomeUI";
import type { AbstractEngine } from "@babylonjs/core/Engines/abstractEngine";
import type { MapData } from "./game/map/MapGenerator";

let inspectorLoaded = false;
let inspectorLoading: Promise<void> | null = null;

async function ensureInspectorLoaded(): Promise<void> {
  if (inspectorLoaded) return;
  if (!inspectorLoading) {
    inspectorLoading = import("@babylonjs/inspector").then(() => {
      inspectorLoaded = true;
    });
  }
  await inspectorLoading;
}

function createGameScene(engine: AbstractEngine, sceneManager: SceneManager): GameScene {
  return new GameScene(engine, {
    onFantasyMap: (mapData: MapData) => {
      sceneManager.fadeTransition(() => {
        const fantasy = new Fantasy2DScene(engine, mapData, () => {
          // Back button: return to game scene
          sceneManager.fadeTransition(() => {
            const gs = createGameScene(engine, sceneManager);
            return gs.setup();
          });
        });
        return fantasy.setup();
      });
    },
    onPerilousMap: () => {
      sceneManager.fadeTransition(() => {
        const perilous = new PerilousFantasyWorldScene(engine, () => {
          // Back button: return to game scene
          sceneManager.fadeTransition(() => {
            const gs = createGameScene(engine, sceneManager);
            return gs.setup();
          });
        });
        return perilous.setup();
      });
    },
  });
}

async function main() {
  const canvas = document.getElementById("renderCanvas") as HTMLCanvasElement;
  if (!canvas) {
    throw new Error("Canvas element not found");
  }

  // Initialize engine (WebGPU with WebGL fallback)
  const gameEngine = new GameEngine(canvas);
  const engine = await gameEngine.init();

  // Scene manager
  const sceneManager = new SceneManager(engine);

  // Start with home scene
  const homeScene = new HomeScene(engine);
  const homeSceneInstance = homeScene.setup();
  sceneManager.setActiveScene(homeSceneInstance);

  // Home UI
  new HomeUI(homeSceneInstance, {
    onPlay: () => {
      // Fade transition to game scene
      sceneManager.fadeTransition(() => {
        const gs = createGameScene(engine, sceneManager);
        return gs.setup();
      });
    },
  });

  // Toggle Inspector with Shift+I (dev tool)
  window.addEventListener("keydown", async (e) => {
    if (e.shiftKey && e.key.toLowerCase() === "i") {
      const active = sceneManager.getActiveScene();
      if (!active) return;
      await ensureInspectorLoaded();
      if (active.debugLayer.isVisible()) {
        active.debugLayer.hide();
      } else {
        active.debugLayer.show({ embedMode: true });
      }
    }
  });

  // Render loop
  sceneManager.startRenderLoop();
}

main().catch(console.error);
