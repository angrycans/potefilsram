/**
 * Configuration types for Perilous-style map rendering.
 * All preset values sourced directly from PerilousJS/Assets/*.json.
 */

// --- Complete style preset (mirrors JSON structure) ---
export interface PerilousColorTheme {
  name: string;
  // Colors
  background: string | string[];
  foreground: string;
  water: string;
  shallow: string;
  mountain: string;
  lightWood: string[];
  darkWood: string[];
  rivers: string;
  contours: string;
  landShadow: string;
  matte: string;
  compass: string;
  roofs: string;
  clouds: string;
  walls: string;
  routes: string;
  flags: string;
  danger: string;
  // Rendering params (from JSON)
  enumShading: string;
  bandsNumber: number;
  treesDensity: number;
  treesRegularity: number;
  clutterScale: number;
  townScale: number;
  dangerScale: number;
  ruggedMountains: boolean;
  alphaLandShadow: number;
  widthLandShadow: number;
  shallowSize: number;
  shallowEdge: number;
  thin: number;
  normal: number;
  thick: number;
  river: number;
}

function arr(v: string | string[]): string[] {
  return Array.isArray(v) ? v : [v];
}

// --- Predefined themes — values taken directly from PerilousJS/Assets/*.json ---
export const THEMES: Record<string, PerilousColorTheme> = {
  default: {
    name: "Default",
    background: ["#EBE8DF", "#F2F0E6", "#E5E2DA"],
    foreground: "#3F332C", water: "#E5E2DA", shallow: "#EBE8DF",
    mountain: "#E0DDD5", lightWood: ["#C8CCB7", "#ADB297"],
    darkWood: ["#B9C1B2", "#9BA591"], rivers: "#665C57",
    contours: "#998B83", landShadow: "#665C57", matte: "#F2EFE6",
    compass: "#CCCAC1", roofs: "#E59189", clouds: "#F9F8F2",
    walls: "#EBE8DF", routes: "#998B83", flags: "#4D3F36", danger: "#F2EFE6",
    enumShading: "Hatching", bandsNumber: 5, treesDensity: 0.2,
    treesRegularity: 0.5, clutterScale: 0.7, townScale: 0.8,
    dangerScale: 0.6, ruggedMountains: true, alphaLandShadow: 0.2,
    widthLandShadow: 0.333, shallowSize: 0.8, shallowEdge: 1.0,
    thin: 0.8, normal: 1.4, thick: 3.0, river: 3.0,
  },
  bw: {
    name: "B&W",
    background: "#FFFFFF",
    foreground: "#000000", water: "#FFFFFF", shallow: "#FFFFFF",
    mountain: "#FFFFFF", lightWood: ["#FFFFFF"], darkWood: ["#FFFFFF"],
    rivers: "#000000", contours: "#000000", landShadow: "#000000",
    matte: "#FFFFFF", compass: "#FFFFFF", roofs: "#FFFFFF",
    clouds: "#FFFFFF", walls: "#FFFFFF", routes: "#888888",
    flags: "#000000", danger: "#FFFFFF",
    enumShading: "Hatching", bandsNumber: 3, treesDensity: 0.3,
    treesRegularity: 0.4, clutterScale: 1.0, townScale: 1.0,
    dangerScale: 1.0, ruggedMountains: true, alphaLandShadow: 0.0,
    widthLandShadow: 0.0, shallowSize: 0.6, shallowEdge: 0.666,
    thin: 1.0, normal: 2.0, thick: 4.0, river: 4.0,
  },
  antique: {
    name: "Antique",
    background: "#F9F2DB",
    foreground: "#33180E", water: "#FFFAE5", shallow: "#E5DAC3",
    mountain: "#E5DAC9", lightWood: ["#EFE6D2"], darkWood: ["#EADFCE"],
    rivers: "#4C2416", contours: "#4C2416", landShadow: "#4C2416",
    matte: "#FFFAE5", compass: "#FEF7D8", roofs: "#4C2416",
    clouds: "#FFFBEF", walls: "#F9F2DB", routes: "#B2886B",
    flags: "#4C2416", danger: "#FFFAE5",
    enumShading: "Hatching", bandsNumber: 0, treesDensity: 0.4,
    treesRegularity: 0.7, clutterScale: 0.6, townScale: 0.5,
    dangerScale: 0.6, ruggedMountains: false, alphaLandShadow: 0.1,
    widthLandShadow: 0.333, shallowSize: 1.2, shallowEdge: 1.0,
    thin: 0.8, normal: 1.5, thick: 2.0, river: 3.0,
  },
  soft: {
    name: "Soft",
    background: "#F8F8F4",
    foreground: "#33333F", water: "#E0E0E4", shallow: "#BABAC4",
    mountain: "#F8F8F4", lightWood: ["#E0E0E4", "#C9C9CC"],
    darkWood: ["#E0E0E4", "#C9C9CC"], rivers: "#444455",
    contours: "#666677", landShadow: "#333355", matte: "#F8F8F4",
    compass: "#F8F8F4", roofs: "#F8F8F4", clouds: "#FFFFFF",
    walls: "#F8F8F4", routes: "#666677", flags: "#444455", danger: "#F8F8F4",
    enumShading: "Smooth", bandsNumber: 0, treesDensity: 0.15,
    treesRegularity: 0.5, clutterScale: 1.2, townScale: 1.0,
    dangerScale: 1.2, ruggedMountains: true, alphaLandShadow: 0.1,
    widthLandShadow: 1.0, shallowSize: 1.5, shallowEdge: 0.6,
    thin: 2.0, normal: 4.0, thick: 8.0, river: 8.0,
  },
  cartoon: {
    name: "Cartoon",
    background: ["#CCBF99", "#D8CAA2", "#C6BC9F"],
    foreground: "#434A42", water: "#A0B2A9", shallow: "#BBCCBB",
    mountain: "#E5DCC3", lightWood: ["#797F59"], darkWood: ["#647256"],
    rivers: "#434A42", contours: "#F2ECDA", landShadow: "#E5D3A0",
    matte: "#B2A68E", compass: "#CBC1AD", roofs: "#A67F63",
    clouds: "#E6EDF2", walls: "#E5D6C3", routes: "#566563",
    flags: "#7F1919", danger: "#F2ECDA",
    enumShading: "Smooth", bandsNumber: 3, treesDensity: 0.3,
    treesRegularity: 0.7, clutterScale: 1.0, townScale: 0.9,
    dangerScale: 0.7, ruggedMountains: true, alphaLandShadow: 0.4,
    widthLandShadow: 0.5, shallowSize: 0.6, shallowEdge: 1.0,
    thin: 1.0, normal: 2.0, thick: 4.0, river: 5.0,
  },
  october: {
    name: "October",
    background: ["#EDB899", "#EFCC9B", "#D6A7A0"],
    foreground: "#281E32", water: "#74A8B2", shallow: "#A9F2DA",
    mountain: "#9AA5A5", lightWood: ["#D86161", "#E07059", "#ED8E5E"],
    darkWood: ["#B25968", "#A56379"], rivers: "#281E32",
    contours: "#000000", landShadow: "#CC9E8E", matte: "#E5DDCE",
    compass: "#E5DAA0", roofs: "#7F666E", clouds: "#F8F7FF",
    walls: "#F1F1E4", routes: "#3F5F7F", flags: "#281E32", danger: "#F2ECE6",
    enumShading: "Smooth", bandsNumber: 0, treesDensity: 0.8,
    treesRegularity: 0.5, clutterScale: 1.2, townScale: 1.2,
    dangerScale: 1.0, ruggedMountains: true, alphaLandShadow: 1.0,
    widthLandShadow: 0.5, shallowSize: 1.0, shallowEdge: 0.0,
    thin: 1.0, normal: 3.0, thick: 5.0, river: 6.0,
  },
  fullColour: {
    name: "Full color",
    background: ["#A5A16A", "#D6C9A4", "#87875F"],
    foreground: "#000000", water: "#72889E", shallow: "#A9BCC8",
    mountain: "#D7D8BE", lightWood: ["#878053", "#6F7248", "#938E5B"],
    darkWood: ["#585E50", "#4D513D", "#3B3D2C"], rivers: "#4C472A",
    contours: "#C7D3D8", landShadow: "#4C3E25", matte: "#D8DCC3",
    compass: "#E3C86E", roofs: "#A1693F", clouds: "#F2F8F9",
    walls: "#CDC9B3", routes: "#C1D5E4", flags: "#892B21", danger: "#FEFDF9",
    enumShading: "Hatching", bandsNumber: 0, treesDensity: 0.2,
    treesRegularity: 0.4, clutterScale: 1.2, townScale: 0.9,
    dangerScale: 0.8, ruggedMountains: true, alphaLandShadow: 0.25,
    widthLandShadow: 0.5, shallowSize: 0.8, shallowEdge: 0.0,
    thin: 2.0, normal: 3.0, thick: 5.0, river: 6.0,
  },
};

/** Apply a theme preset's rendering params onto a render config */
export function applyThemeToConfig(
  config: PerilousRenderConfig,
  themeKey: string
): PerilousRenderConfig {
  const t = THEMES[themeKey];
  if (!t) return config;
  return {
    ...config,
    theme: themeKey,
    enumShading: t.enumShading === "Hatching" ? "Hatching"
      : t.enumShading === "None" || t.enumShading === "No outlines" ? "None" : "Smooth",
    bandsNumber: t.bandsNumber,
    treesDensity: t.treesDensity,
    treesRegularity: t.treesRegularity,
    clutterScale: t.clutterScale,
    townScale: t.townScale,
    dangerScale: t.dangerScale,
    ruggedMountains: t.ruggedMountains,
    alphaLandShadow: t.alphaLandShadow,
    widthLandShadow: t.widthLandShadow,
    shallowSize: t.shallowSize,
    shallowEdge: t.shallowEdge,
    lineWidthThin: t.thin,
    lineWidthNormal: t.normal,
    lineWidthThick: t.thick,
    lineWidthRiver: t.river,
  };
}

// helper to silence lint for arr()
void arr;

// --- Region tags (from Perilous Shores) ---
export type RegionTag =
  | "archipelago" | "highland" | "lawful" | "safe" | "woodland"
  | "barren" | "bay" | "chaotic" | "civilized" | "coast"
  | "difficult" | "evil" | "fjord" | "good" | "island"
  | "lake" | "land" | "lowland" | "neutral"
  | "peninsula" | "perilous" | "wetland";

export const ALL_TAGS: RegionTag[] = [
  "archipelago", "highland", "lawful", "safe", "woodland",
  "barren", "bay", "chaotic", "civilized", "coast",
  "difficult", "evil", "fjord", "good", "island",
  "lake", "land", "lowland", "neutral",
  "peninsula", "perilous", "wetland",
];

export type SizePreset = "Small" | "Medium" | "Large" | "Huge";

export const SIZE_PRESETS: Record<SizePreset, [number, number, number]> = {
  Small:  [100, 100, 800],
  Medium: [150, 150, 1200],
  Large:  [200, 200, 2000],
  Huge:   [300, 300, 3500],
};

export type HexesOption = "None" | "Pointy topped" | "Flat topped" | "Warped";
export type AlignmentMode = "Lawful" | "Neutral" | "Chaotic";
export type DangerMode = "Safe" | "Balanced" | "Perilous";

// --- Map generation parameters ---
export interface PerilousGenParams {
  mapWidth: number;
  mapHeight: number;
  cellCount: number;
  seaLevel: number;
  // Legacy-compatible count. Density fields below are preferred.
  riverCount: number;
  lloydIterations: number;
  sizePreset: SizePreset;
  hexes: HexesOption;
  tags: RegionTag[];
  alignment: AlignmentMode;
  danger: DangerMode;
  settlementDensity: number; // 0..0.1
  riverDensity: number;      // 0..0.15
  roadDensity: number;       // 0..1
}

export const DEFAULT_GEN_PARAMS: PerilousGenParams = {
  mapWidth: 200,
  mapHeight: 200,
  cellCount: 2000,
  seaLevel: 0.05,
  riverCount: 6,
  lloydIterations: 2,
  sizePreset: "Large",
  hexes: "Warped",
  tags: ["island"],
  alignment: "Neutral",
  danger: "Balanced",
  settlementDensity: 0.028,
  riverDensity: 0.05,
  roadDensity: 0.7,
};

// --- Shading modes (from enumShading in default.json) ---
export type ShadingMode = "Hatching" | "Smooth" | "None";
export type LabelMode = "hidden" | "straight" | "arced" | "curved";
export type HeaderDecorMode = "Hidden" | "Plain" | "Plaque" | "Banner";

// --- Grid layer position ---
export type GridLayer = "Hidden" | "Under" | "Above";

// --- Render configuration (mirrors default.json keys) ---
export interface PerilousRenderConfig {
  // Style
  theme: string;

  // Grid (from Perilous Shores Grid submenu)
  gridLayer: GridLayer;       // Hidden / Under / Above
  gridOceanTiles: boolean;    // show hex grid on ocean too
  gridNumbers: boolean;       // show coordinate numbers

  // Details — from default.json
  enumShading: ShadingMode;
  bandsNumber: number;        // coastal shading bands (0–10)
  treesDensity: number;       // 0..1
  treesRegularity: number;    // 0..1
  clutterScale: number;       // 0..2 — density of decorations
  townScale: number;          // 0..1.5 — town building size
  dangerScale: number;        // 0..1 — danger marker size
  ruggedMountains: boolean;

  // Line widths (from thin/normal/thick/ultraThin/river in JSON)
  lineWidthThin: number;
  lineWidthNormal: number;
  lineWidthThick: number;
  lineWidthRiver: number;

  // Shallow water
  shallowSize: number;        // 0..2
  shallowEdge: number;        // 0..2

  // Land shadow
  widthLandShadow: number;    // 0..1
  alphaLandShadow: number;    // 0..1

  // Labels
  showRegionLabels: boolean;
  showMountainLabels: boolean;
  showForestLabels: boolean;
  showTownLabels: boolean;
  showRiverLabels: boolean;
  showDangerLabels: boolean;
  showAreaLabels: boolean;
  labelMode: LabelMode;
  headerDecor: HeaderDecorMode;
  showInfo: boolean;
  showMatte: boolean;
  showLight: boolean;

  // Elements
  showMountains: boolean;
  showTrees: boolean;
  showRivers: boolean;
  showRoads: boolean;
  showRoutes: boolean;         // roads between towns
  showTowns: boolean;          // town building icons
  showLandmarks: boolean;
  showMeadows: boolean;
  showFields: boolean;
  showSuburbs: boolean;
  showGrass: boolean;
  showCompass: boolean;
  showBorder: boolean;
  showShallowWater: boolean;
  showClouds: boolean;
  showDanger: boolean;         // danger zone markers
  pinTowns: boolean;
  uniformTowns: boolean;
  individualTrees: boolean;
  edgeTrees: boolean;
  treeShadows: boolean;
  revealRivers: boolean;
  hollowRivers: boolean;
  riverBanks: boolean;

  // Rotation (degrees)
  rotation: number;
}

export const DEFAULT_RENDER_CONFIG: PerilousRenderConfig = {
  theme: "fullColour",
  gridLayer: "Above",
  gridOceanTiles: true,
  gridNumbers: false,
  enumShading: "Hatching",
  bandsNumber: 0,
  treesDensity: 0.2,
  treesRegularity: 0.4,
  clutterScale: 1.2,
  townScale: 0.9,
  dangerScale: 0.8,
  ruggedMountains: true,
  lineWidthThin: 2.0,
  lineWidthNormal: 3.0,
  lineWidthThick: 5.0,
  lineWidthRiver: 6.0,
  shallowSize: 0.8,
  shallowEdge: 0.0,
  widthLandShadow: 0.5,
  alphaLandShadow: 0.25,
  showRegionLabels: true,
  showMountainLabels: true,
  showForestLabels: true,
  showTownLabels: true,
  showRiverLabels: true,
  showDangerLabels: true,
  showAreaLabels: true,
  labelMode: "arced",
  headerDecor: "Plain",
  showInfo: true,
  showMatte: true,
  showLight: false,
  showMountains: true,
  showTrees: true,
  showRivers: true,
  showRoads: true,
  showRoutes: true,
  showTowns: true,
  showLandmarks: true,
  showMeadows: true,
  showFields: true,
  showSuburbs: true,
  showGrass: true,
  showCompass: true,
  showBorder: true,
  showShallowWater: true,
  showClouds: false,
  showDanger: true,
  pinTowns: false,
  uniformTowns: false,
  individualTrees: false,
  edgeTrees: true,
  treeShadows: false,
  revealRivers: true,
  hollowRivers: true,
  riverBanks: true,
  rotation: 0,
};
