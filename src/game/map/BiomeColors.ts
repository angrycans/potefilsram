import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Biome } from "./MapGenerator";

export const BIOME_COLORS: Record<Biome, Color3> = {
  [Biome.DEEP_WATER]: new Color3(0.12, 0.18, 0.45),
  [Biome.SHALLOW_WATER]: new Color3(0.2, 0.35, 0.6),
  [Biome.BEACH]: new Color3(0.82, 0.75, 0.55),
  [Biome.PLAINS]: new Color3(0.55, 0.7, 0.35),
  [Biome.GRASSLAND]: new Color3(0.4, 0.65, 0.3),
  [Biome.FOREST]: new Color3(0.2, 0.5, 0.2),
  [Biome.DENSE_FOREST]: new Color3(0.1, 0.35, 0.12),
  [Biome.DESERT]: new Color3(0.85, 0.75, 0.45),
  [Biome.MOUNTAIN]: new Color3(0.5, 0.45, 0.4),
  [Biome.SNOW]: new Color3(0.92, 0.92, 0.95),
};
