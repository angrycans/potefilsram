/**
 * Perilous Shores–style settings menu UI.
 * Mirrors the original menu: New region, Parameters, Rotate, Style, Grid, Details, Labels, Elements.
 */
import { AdvancedDynamicTexture } from "@babylonjs/gui/2D/advancedDynamicTexture";
import { Button } from "@babylonjs/gui/2D/controls/button";
import { StackPanel } from "@babylonjs/gui/2D/controls/stackPanel";
import { TextBlock } from "@babylonjs/gui/2D/controls/textBlock";
import { Rectangle } from "@babylonjs/gui/2D/controls/rectangle";
import { Checkbox } from "@babylonjs/gui/2D/controls/checkbox";
import { Slider } from "@babylonjs/gui/2D/controls/sliders/slider";
import { Control } from "@babylonjs/gui/2D/controls/control";
import { Grid } from "@babylonjs/gui/2D/controls/grid";
import { InputText } from "@babylonjs/gui/2D/controls/inputText";
import { Scene } from "@babylonjs/core/scene";
import type {
  PerilousRenderConfig,
  PerilousGenParams,
  RegionTag,
  SizePreset,
  HexesOption,
  GridLayer,
  ShadingMode,
} from "../game/map/PerilousConfig";
import { THEMES, ALL_TAGS, SIZE_PRESETS, applyThemeToConfig } from "../game/map/PerilousConfig";

// --- Style constants ---
const MENU_BG = "#D1CDBE";
const MENU_BORDER = "#474250";
const MENU_TEXT = "#3F3A49";
const MENU_HOVER = "#C3BFAE";
const HEADER_BG = "#3F3A49";
const HEADER_TEXT = "#DFDBC9";
const CHIP_ACTIVE_BG = "#3F3A49";
const CHIP_IDLE_BG = "#626777";
const ITEM_H = "36px";
const MENU_W = "220px";
const PANEL_FONT = "'Share Tech Regular', 'Neucha', serif";

export interface PerilousMenuCallbacks {
  onNewRegion: () => void;
  onParamsChanged: (params: PerilousGenParams) => void;
  onRenderConfigChanged: (config: PerilousRenderConfig) => void;
  onRerollNames: () => void;
  onResetDefaults: () => void;
  onPermalink?: () => void;
  onExport?: () => void;
  onBack: () => void;
}

export class PerilousMenuUI {
  private gui: AdvancedDynamicTexture;
  private renderConfig: PerilousRenderConfig;
  private genParams: PerilousGenParams;
  private callbacks: PerilousMenuCallbacks;
  private mainPanel: Rectangle | null = null;
  private subPanel: Rectangle | null = null;

  constructor(
    scene: Scene,
    renderConfig: PerilousRenderConfig,
    genParams: PerilousGenParams,
    callbacks: PerilousMenuCallbacks
  ) {
    this.gui = AdvancedDynamicTexture.CreateFullscreenUI("perilousMenu", true, scene);
    this.renderConfig = { ...renderConfig };
    this.genParams = { ...genParams };
    this.callbacks = callbacks;
    this.createMenuButton();
  }

  // --- Top-level menu trigger button ---
  private createMenuButton(): void {
    const btn = Button.CreateSimpleButton("menuBtn", "Procgen Arcana");
    btn.width = "170px";
    btn.height = "36px";
    btn.color = "#2d261f";
    btn.background = "rgba(224, 219, 204, 0.92)";
    btn.cornerRadius = 2;
    btn.thickness = 1;
    btn.fontSize = 14;
    btn.fontFamily = PANEL_FONT;
    btn.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    btn.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    btn.top = "20px";
    btn.left = "20px";
    btn.zIndex = 50;

    btn.onPointerEnterObservable.add(() => {
      btn.background = "rgba(210, 203, 184, 1)";
      btn.color = "#1f1710";
    });
    btn.onPointerOutObservable.add(() => {
      btn.background = "rgba(224, 219, 204, 0.92)";
      btn.color = "#2d261f";
    });
    btn.onPointerClickObservable.add(() => {
      this.toggleMainMenu();
    });

    this.gui.addControl(btn);
  }

  private toggleMainMenu(): void {
    if (this.mainPanel) {
      this.closeAllPanels();
    } else {
      this.openMainMenu();
    }
  }

  private closeAllPanels(): void {
    if (this.subPanel) {
      this.gui.removeControl(this.subPanel);
      this.subPanel = null;
    }
    if (this.mainPanel) {
      this.gui.removeControl(this.mainPanel);
      this.mainPanel = null;
    }
  }

  // --- Main menu panel ---
  private openMainMenu(): void {
    this.closeAllPanels();

    const panel = this.createPanel(MENU_W, "auto");
    panel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    panel.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    panel.top = "62px";
    panel.left = "20px";
    panel.zIndex = 100;

    const stack = new StackPanel("mainStack");
    stack.width = "100%";
    panel.addControl(stack);

    // Title
    const title = this.createTitle("Procgen Arcana");
    stack.addControl(title);

    // Separator
    stack.addControl(this.createSeparator());

    // New region
    stack.addControl(this.createMenuItem("New region", () => {
      this.closeAllPanels();
      this.callbacks.onNewRegion();
    }));

    // Parameters...
    stack.addControl(this.createMenuItem("Parameters...", () => {
      this.openParametersPanel();
    }));

    // Rotate >
    stack.addControl(this.createMenuItem("Rotate", () => {
      this.openRotatePanel();
    }, true));

    // Separator
    stack.addControl(this.createSeparator());

    // Style...
    stack.addControl(this.createMenuItem("Style...", () => {
      this.openStylePanel();
    }));

    // Vantage... (camera)
    stack.addControl(this.createMenuItem("Vantage...", () => {
      this.openVantagePanel();
    }));

    // Grid >
    stack.addControl(this.createMenuItem("Grid", () => {
      this.openGridPanel();
    }, true));

    // Details >
    stack.addControl(this.createMenuItem("Details", () => {
      this.openDetailsPanel();
    }, true));

    // Labels >
    stack.addControl(this.createMenuItem("Labels", () => {
      this.openLabelsPanel();
    }, true));

    // Elements >
    stack.addControl(this.createMenuItem("Elements", () => {
      this.openElementsPanel();
    }, true));

    // Separator
    stack.addControl(this.createSeparator());

    stack.addControl(this.createMenuItem("Permalink...", () => {
      this.callbacks.onPermalink?.();
    }));
    stack.addControl(this.createMenuItem("Export as", () => {
      this.callbacks.onExport?.();
    }, true));

    this.gui.addControl(panel);
    this.mainPanel = panel;
  }

  // --- Sub-panels ---

  private openParametersPanel(): void {
    this.closeSubPanel();
    const panel = this.createSubPanel("Region parameters");
    panel.width = "340px";
    const stack = this.getSubStack(panel);
    stack.paddingLeft = "14px";
    stack.paddingRight = "14px";

    const sizeRow = new StackPanel("sizeRow");
    sizeRow.isVertical = false;
    sizeRow.width = "100%";
    sizeRow.height = "54px";
    sizeRow.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;

    const sizeLbl = new TextBlock("sizeLbl", "Size:");
    sizeLbl.width = "72px";
    sizeLbl.height = "44px";
    sizeLbl.color = MENU_TEXT;
    sizeLbl.fontSize = 22;
    sizeLbl.fontFamily = PANEL_FONT;
    sizeLbl.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    sizeLbl.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
    sizeRow.addControl(sizeLbl);

    const wInput = this.createNumberInput("sizeW", this.genParams.mapWidth, "88px", (val) => {
      this.genParams.mapWidth = Math.max(50, Math.round(val));
    });
    sizeRow.addControl(wInput);
    const hInput = this.createNumberInput("sizeH", this.genParams.mapHeight, "88px", (val) => {
      this.genParams.mapHeight = Math.max(50, Math.round(val));
    });
    hInput.paddingLeft = "8px";
    sizeRow.addControl(hInput);

    const presetBtn = Button.CreateSimpleButton("sizePreset", this.genParams.sizePreset + "   ▼");
    presetBtn.width = "128px";
    presetBtn.height = "44px";
    presetBtn.color = MENU_TEXT;
    presetBtn.background = "#D7D2C1";
    presetBtn.cornerRadius = 0;
    presetBtn.thickness = 2;
    presetBtn.fontSize = 20;
    presetBtn.fontFamily = PANEL_FONT;
    presetBtn.paddingLeft = "8px";
    presetBtn.onPointerClickObservable.add(() => {
      const presets: SizePreset[] = ["Small", "Medium", "Large", "Huge"];
      const idx = presets.indexOf(this.genParams.sizePreset);
      const next = presets[(idx + 1 + presets.length) % presets.length];
      this.genParams.sizePreset = next;
      const [w, h, cells] = SIZE_PRESETS[next];
      this.genParams.mapWidth = w;
      this.genParams.mapHeight = h;
      this.genParams.cellCount = cells;
      this.openParametersPanel();
    });
    sizeRow.addControl(presetBtn);
    stack.addControl(sizeRow);

    const hexLine = Button.CreateSimpleButton("hexMode", `Hexes: ${this.genParams.hexes} ▼`);
    hexLine.width = "100%";
    hexLine.height = "44px";
    hexLine.color = MENU_TEXT;
    hexLine.background = "transparent";
    hexLine.thickness = 0;
    hexLine.fontSize = 22;
    hexLine.fontFamily = PANEL_FONT;
    if (hexLine.textBlock) {
      hexLine.textBlock.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    }
    hexLine.onPointerClickObservable.add(() => {
      const opts: HexesOption[] = ["Pointy topped", "Flat topped", "Warped"];
      const idx = opts.indexOf(this.genParams.hexes);
      this.genParams.hexes = opts[(idx + 1 + opts.length) % opts.length];
      this.openParametersPanel();
    });
    stack.addControl(hexLine);

    // Active tags (top group)
    const activeTags = this.genParams.tags;
    const activeBox = new Rectangle("activeTagBox");
    activeBox.width = "100%";
    activeBox.adaptHeightToChildren = true;
    activeBox.background = "#AAA295";
    activeBox.thickness = 0;
    activeBox.cornerRadius = 22;
    activeBox.paddingTop = "12px";
    activeBox.paddingBottom = "8px";
    activeBox.paddingLeft = "8px";
    activeBox.paddingRight = "8px";
    activeBox.top = "6px";
    if (activeTags.length > 0) activeBox.addControl(this.createTagWrap(activeTags, true));
    stack.addControl(activeBox);

    // Available tags (bottom group)
    const availableTags = ALL_TAGS.filter(t => !activeTags.includes(t));
    const availableWrap = this.createTagWrap(availableTags, false);
    availableWrap.top = "8px";
    stack.addControl(availableWrap);

    // Hint
    const hint = new TextBlock("hint", "* Shift+click a tag to learn its effect.");
    hint.height = "42px";
    hint.color = "#5E6276";
    hint.fontSize = 19;
    hint.fontFamily = PANEL_FONT;
    hint.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    hint.paddingLeft = "2px";
    stack.addControl(hint);

    // --- Generate / Random buttons ---
    const footer = new Rectangle("paramFooter");
    footer.width = "340px";
    footer.height = "74px";
    footer.background = "#AAA295";
    footer.thickness = 0;
    footer.left = "-14px";
    footer.top = "6px";

    const btnRow = new StackPanel("btnRow");
    btnRow.isVertical = false;
    btnRow.width = "100%";
    btnRow.height = "74px";
    btnRow.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    btnRow.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
    btnRow.paddingLeft = "18px";
    btnRow.paddingRight = "18px";

    const genBtn = this.createActionButton("Generate", () => {
      this.closeAllPanels();
      this.callbacks.onParamsChanged({ ...this.genParams });
    });
    genBtn.width = "160px";
    genBtn.height = "46px";
    genBtn.fontSize = 24;
    btnRow.addControl(genBtn);

    const rndBtn = this.createActionButton("Random", () => {
      this.randomizeTags();
      this.closeAllPanels();
      this.callbacks.onParamsChanged({ ...this.genParams });
    });
    rndBtn.width = "160px";
    rndBtn.height = "46px";
    rndBtn.fontSize = 24;
    btnRow.addControl(rndBtn);
    footer.addControl(btnRow);
    stack.addControl(footer);

    this.showSubPanel(panel);
  }

  private createTagWrap(tags: RegionTag[], isActive: boolean): StackPanel {
    const root = new StackPanel("tagWrapRoot_" + (isActive ? "a" : "b"));
    root.width = "100%";
    root.adaptHeightToChildren = true;

    let row = new StackPanel("tagRow_0_" + (isActive ? "a" : "b"));
    row.isVertical = false;
    row.width = "100%";
    row.height = "54px";
    root.addControl(row);
    let rowPx = 0;
    let rowIdx = 0;

    for (const tag of tags) {
      const w = Math.max(84, Math.round(tag.length * 14 + 28));
      if (rowPx + w > 300) {
        rowIdx++;
        row = new StackPanel("tagRow_" + rowIdx + "_" + (isActive ? "a" : "b"));
        row.isVertical = false;
        row.width = "100%";
        row.height = "54px";
        root.addControl(row);
        rowPx = 0;
      }
      const btn = Button.CreateSimpleButton("tagw_" + tag + "_" + rowIdx, tag);
      btn.width = `${w}px`;
      btn.height = "46px";
      btn.color = "#DCD8C7";
      btn.background = isActive ? CHIP_ACTIVE_BG : CHIP_IDLE_BG;
      btn.cornerRadius = 16;
      btn.thickness = 0;
      btn.fontSize = 22;
      btn.fontFamily = PANEL_FONT;
      btn.paddingRight = "8px";
      btn.onPointerClickObservable.add(() => {
        if (isActive) {
          this.genParams.tags = this.genParams.tags.filter((t) => t !== tag);
        } else {
          this.genParams.tags = [...this.genParams.tags, tag];
        }
        this.openParametersPanel();
      });
      row.addControl(btn);
      rowPx += w + 8;
    }

    return root;
  }

  private createNumberInput(
    id: string,
    value: number,
    width: string,
    onCommit: (val: number) => void
  ): InputText {
    const input = new InputText(id, value.toString());
    input.width = width;
    input.height = "44px";
    input.maxWidth = width;
    input.color = MENU_TEXT;
    input.background = "#D7D2C1";
    input.thickness = 2;
    input.fontSize = 20;
    input.fontFamily = PANEL_FONT;
    input.onBlurObservable.add(() => {
      const n = Number(input.text);
      if (Number.isFinite(n)) {
        onCommit(n);
      } else {
        input.text = value.toString();
      }
    });
    return input;
  }

  /** Randomly pick 1-3 tags */
  private randomizeTags(): void {
    const count = 1 + Math.floor(Math.random() * 3);
    const shuffled = [...ALL_TAGS].sort(() => Math.random() - 0.5);
    this.genParams.tags = shuffled.slice(0, count);
    const alignments: PerilousGenParams["alignment"][] = ["Lawful", "Neutral", "Chaotic"];
    const dangers: PerilousGenParams["danger"][] = ["Safe", "Balanced", "Perilous"];
    this.genParams.alignment = alignments[Math.floor(Math.random() * alignments.length)];
    this.genParams.danger = dangers[Math.floor(Math.random() * dangers.length)];
    this.genParams.settlementDensity = 0.015 + Math.random() * 0.05;
    this.genParams.riverDensity = 0.02 + Math.random() * 0.08;
    this.genParams.roadDensity = 0.35 + Math.random() * 0.6;
  }

  private openRotatePanel(): void {
    this.closeSubPanel();
    const panel = this.createSubPanel("Rotate");
    const stack = this.getSubStack(panel);

    const angles = [0, 90, 180, 270];
    for (const angle of angles) {
      const label = angle === 0 ? "No rotation" : `${angle}°`;
      const item = this.createMenuItem(label, () => {
        this.renderConfig.rotation = angle;
        this.notifyRenderChange();
        this.closeSubPanel();
      });
      stack.addControl(item);
    }

    this.showSubPanel(panel);
  }

  private openStylePanel(): void {
    this.closeSubPanel();
    const panel = this.createSubPanel("Style");
    const stack = this.getSubStack(panel);

    for (const [key, theme] of Object.entries(THEMES)) {
      const item = this.createMenuItem(
        (this.renderConfig.theme === key ? "● " : "○ ") + theme.name,
        () => {
          this.renderConfig = applyThemeToConfig(this.renderConfig, key);
          this.notifyRenderChange();
          this.openStylePanel(); // refresh checkmarks
        }
      );
      stack.addControl(item);
    }

    this.showSubPanel(panel);
  }

  private openVantagePanel(): void {
    this.closeSubPanel();
    const panel = this.createSubPanel("Vantage");
    const stack = this.getSubStack(panel);

    stack.addControl(this.createSliderRow("Coast Bands", this.renderConfig.bandsNumber, 0, 10, 1, (v) => {
      this.renderConfig.bandsNumber = Math.round(v);
      this.notifyRenderChange();
    }));

    stack.addControl(this.createSliderRow("Shallow Size", this.renderConfig.shallowSize, 0, 2, 0.1, (v) => {
      this.renderConfig.shallowSize = v;
      this.notifyRenderChange();
    }));

    stack.addControl(this.createSliderRow("Shallow Edge", this.renderConfig.shallowEdge, 0, 2, 0.1, (v) => {
      this.renderConfig.shallowEdge = v;
      this.notifyRenderChange();
    }));

    stack.addControl(this.createSliderRow("Land Shadow W", this.renderConfig.widthLandShadow, 0, 1, 0.05, (v) => {
      this.renderConfig.widthLandShadow = v;
      this.notifyRenderChange();
    }));

    stack.addControl(this.createSliderRow("Land Shadow α", this.renderConfig.alphaLandShadow, 0, 1, 0.05, (v) => {
      this.renderConfig.alphaLandShadow = v;
      this.notifyRenderChange();
    }));

    this.showSubPanel(panel);
  }

  private openGridPanel(): void {
    this.closeSubPanel();
    const panel = this.createSubPanel("Grid");
    const stack = this.getSubStack(panel);

    // Layer position: Hidden / Under / Above
    const layers: GridLayer[] = ["Hidden", "Under", "Above"];
    for (const layer of layers) {
      const active = this.renderConfig.gridLayer === layer;
      stack.addControl(this.createMenuItem(
        (active ? "■ " : "  ") + layer,
        () => {
          this.renderConfig.gridLayer = layer;
          this.notifyRenderChange();
          this.openGridPanel();
        }
      ));
    }

    stack.addControl(this.createSeparator());

    // Ocean tiles toggle
    stack.addControl(this.createCheckboxRow("Ocean tiles", this.renderConfig.gridOceanTiles, (v) => {
      this.renderConfig.gridOceanTiles = v;
      this.notifyRenderChange();
    }));

    // Numbers toggle
    stack.addControl(this.createCheckboxRow("Numbers", this.renderConfig.gridNumbers, (v) => {
      this.renderConfig.gridNumbers = v;
      this.notifyRenderChange();
    }));

    this.showSubPanel(panel);
  }

  private openDetailsPanel(): void {
    this.closeSubPanel();
    const panel = this.createSubPanel("Details");
    panel.width = "260px";
    const stack = this.getSubStack(panel);

    // Shading mode
    const shadingRow = new StackPanel("shadRow");
    shadingRow.isVertical = false;
    shadingRow.width = "100%";
    shadingRow.height = "32px";
    shadingRow.paddingLeft = "12px";
    const shadLbl = new TextBlock("shadLbl", "Shading:");
    shadLbl.width = "70px";
    shadLbl.color = MENU_TEXT;
    shadLbl.fontSize = 12;
    shadLbl.fontFamily = PANEL_FONT;
    shadLbl.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    shadingRow.addControl(shadLbl);
    const shadModes: ShadingMode[] = ["Hatching", "Smooth", "None"];
    for (const sm of shadModes) {
      const active = this.renderConfig.enumShading === sm;
      const btn = Button.CreateSimpleButton("shad_" + sm, sm);
      btn.width = "60px";
      btn.height = "26px";
      btn.color = active ? "#F2EFE6" : MENU_TEXT;
      btn.background = active ? "rgba(63,51,44,0.7)" : "rgba(63,51,44,0.15)";
      btn.cornerRadius = 4;
      btn.thickness = 0;
      btn.fontSize = 11;
      btn.fontFamily = PANEL_FONT;
      btn.onPointerClickObservable.add(() => {
        this.renderConfig.enumShading = sm;
        this.notifyRenderChange();
        this.openDetailsPanel();
      });
      shadingRow.addControl(btn);
    }
    stack.addControl(shadingRow);

    stack.addControl(this.createCheckboxRow("Rugged Mountains", this.renderConfig.ruggedMountains, (v) => {
      this.renderConfig.ruggedMountains = v;
      this.notifyRenderChange();
    }));

    stack.addControl(this.createSliderRow("Tree Density", this.renderConfig.treesDensity, 0, 1, 0.1, (v) => {
      this.renderConfig.treesDensity = v;
      this.notifyRenderChange();
    }));

    stack.addControl(this.createSliderRow("Tree Regularity", this.renderConfig.treesRegularity, 0, 1, 0.1, (v) => {
      this.renderConfig.treesRegularity = v;
      this.notifyRenderChange();
    }));

    stack.addControl(this.createSliderRow("Clutter Scale", this.renderConfig.clutterScale, 0, 2, 0.1, (v) => {
      this.renderConfig.clutterScale = v;
      this.notifyRenderChange();
    }));

    stack.addControl(this.createSliderRow("Town Scale", this.renderConfig.townScale, 0, 1.5, 0.1, (v) => {
      this.renderConfig.townScale = v;
      this.notifyRenderChange();
    }));

    stack.addControl(this.createSliderRow("Danger Scale", this.renderConfig.dangerScale, 0, 1, 0.1, (v) => {
      this.renderConfig.dangerScale = v;
      this.notifyRenderChange();
    }));

    stack.addControl(this.createSeparator());

    stack.addControl(this.createSliderRow("Line Thin", this.renderConfig.lineWidthThin, 0.2, 3, 0.1, (v) => {
      this.renderConfig.lineWidthThin = v;
      this.notifyRenderChange();
    }));

    stack.addControl(this.createSliderRow("Line Normal", this.renderConfig.lineWidthNormal, 0.5, 5, 0.1, (v) => {
      this.renderConfig.lineWidthNormal = v;
      this.notifyRenderChange();
    }));

    stack.addControl(this.createSliderRow("Line Thick", this.renderConfig.lineWidthThick, 1, 8, 0.5, (v) => {
      this.renderConfig.lineWidthThick = v;
      this.notifyRenderChange();
    }));

    stack.addControl(this.createSliderRow("River Width", this.renderConfig.lineWidthRiver, 1, 8, 0.5, (v) => {
      this.renderConfig.lineWidthRiver = v;
      this.notifyRenderChange();
    }));

    this.showSubPanel(panel);
  }

  private openLabelsPanel(): void {
    this.closeSubPanel();
    const panel = this.createSubPanel("Labels");
    const stack = this.getSubStack(panel);

    const labelModes: Array<["Hidden" | "Straight" | "Arced" | "Curved", PerilousRenderConfig["labelMode"]]> = [
      ["Hidden", "hidden"],
      ["Straight", "straight"],
      ["Arced", "arced"],
      ["Curved", "curved"],
    ];
    for (const [name, mode] of labelModes) {
      const active = this.renderConfig.labelMode === mode;
      stack.addControl(this.createMenuItem((active ? "● " : "○ ") + name, () => {
        this.renderConfig.labelMode = mode;
        this.notifyRenderChange();
        this.openLabelsPanel();
      }));
    }

    stack.addControl(this.createSeparator());

    const labels: [string, keyof PerilousRenderConfig][] = [
      ["Region", "showRegionLabels"],
      ["Mountains", "showMountainLabels"],
      ["Forests", "showForestLabels"],
      ["Towns", "showTownLabels"],
      ["Rivers", "showRiverLabels"],
      ["Danger", "showDangerLabels"],
      ["Areas", "showAreaLabels"],
    ];

    for (const [name, key] of labels) {
      stack.addControl(this.createCheckboxRow(name, this.renderConfig[key] as boolean, (v) => {
        (this.renderConfig as unknown as Record<string, unknown>)[key] = v;
        this.notifyRenderChange();
      }));
    }

    stack.addControl(this.createSeparator());
    stack.addControl(this.createMenuItem("Reroll names", () => {
      this.callbacks.onRerollNames();
    }));

    this.showSubPanel(panel);
  }

  private openElementsPanel(): void {
    this.closeSubPanel();
    const panel = this.createSubPanel("Elements");
    const stack = this.getSubStack(panel);

    stack.addControl(this.createMenuItem("Towns...", () => this.openTownsPanel(), true));
    stack.addControl(this.createMenuItem("Forests...", () => this.openForestsPanel(), true));
    stack.addControl(this.createMenuItem("Rivers...", () => this.openRiversPanel(), true));
    stack.addControl(this.createMenuItem("Frame...", () => this.openFramePanel(), true));
    stack.addControl(this.createSeparator());

    const quick: [string, keyof PerilousRenderConfig][] = [
      ["Mountains", "showMountains"],
      ["Danger", "showDanger"],
      ["Clouds", "showClouds"],
      ["Grass", "showGrass"],
      ["Shallow Water", "showShallowWater"],
      ["Light", "showLight"],
    ];
    for (const [name, key] of quick) {
      stack.addControl(this.createCheckboxRow(name, this.renderConfig[key] as boolean, (v) => {
        (this.renderConfig as unknown as Record<string, unknown>)[key] = v;
        this.notifyRenderChange();
      }));
    }

    this.showSubPanel(panel);
  }

  private openTownsPanel(): void {
    this.closeSubPanel();
    const panel = this.createSubPanel("Towns");
    const stack = this.getSubStack(panel);
    const rows: [string, keyof PerilousRenderConfig][] = [
      ["Show towns", "showTowns"],
      ["Show roads", "showRoads"],
      ["Show routes", "showRoutes"],
      ["Show fields", "showFields"],
      ["Show suburbs", "showSuburbs"],
      ["Pin towns", "pinTowns"],
      ["Uniform towns", "uniformTowns"],
    ];
    for (const [name, key] of rows) {
      stack.addControl(this.createCheckboxRow(name, this.renderConfig[key] as boolean, (v) => {
        (this.renderConfig as unknown as Record<string, unknown>)[key] = v;
        this.notifyRenderChange();
      }));
    }
    stack.addControl(this.createSliderRow("Town Scale", this.renderConfig.townScale, 0, 1.5, 0.1, (v) => {
      this.renderConfig.townScale = v;
      this.notifyRenderChange();
    }));
    this.showSubPanel(panel);
  }

  private openForestsPanel(): void {
    this.closeSubPanel();
    const panel = this.createSubPanel("Forests");
    const stack = this.getSubStack(panel);
    const rows: [string, keyof PerilousRenderConfig][] = [
      ["Show trees", "showTrees"],
      ["Individual trees", "individualTrees"],
      ["Edge trees", "edgeTrees"],
      ["Tree shadows", "treeShadows"],
      ["Show meadows", "showMeadows"],
      ["Show landmarks", "showLandmarks"],
    ];
    for (const [name, key] of rows) {
      stack.addControl(this.createCheckboxRow(name, this.renderConfig[key] as boolean, (v) => {
        (this.renderConfig as unknown as Record<string, unknown>)[key] = v;
        this.notifyRenderChange();
      }));
    }
    stack.addControl(this.createSliderRow("Tree Density", this.renderConfig.treesDensity, 0, 1, 0.1, (v) => {
      this.renderConfig.treesDensity = v;
      this.notifyRenderChange();
    }));
    stack.addControl(this.createSliderRow("Tree Regularity", this.renderConfig.treesRegularity, 0, 1, 0.1, (v) => {
      this.renderConfig.treesRegularity = v;
      this.notifyRenderChange();
    }));
    this.showSubPanel(panel);
  }

  private openRiversPanel(): void {
    this.closeSubPanel();
    const panel = this.createSubPanel("Rivers");
    const stack = this.getSubStack(panel);
    const rows: [string, keyof PerilousRenderConfig][] = [
      ["Show rivers", "showRivers"],
      ["Reveal rivers", "revealRivers"],
      ["Simple rivers", "hollowRivers"],
      ["Shade banks", "riverBanks"],
    ];
    for (const [name, key] of rows) {
      stack.addControl(this.createCheckboxRow(name, this.renderConfig[key] as boolean, (v) => {
        (this.renderConfig as unknown as Record<string, unknown>)[key] = v;
        this.notifyRenderChange();
      }));
    }
    stack.addControl(this.createSliderRow("River Width", this.renderConfig.lineWidthRiver, 1, 8, 0.5, (v) => {
      this.renderConfig.lineWidthRiver = v;
      this.notifyRenderChange();
    }));
    this.showSubPanel(panel);
  }

  private openFramePanel(): void {
    this.closeSubPanel();
    const panel = this.createSubPanel("Frame");
    const stack = this.getSubStack(panel);
    const rows: [string, keyof PerilousRenderConfig][] = [
      ["Show matte", "showMatte"],
      ["Show compass", "showCompass"],
      ["Show border", "showBorder"],
      ["Show descriptions", "showInfo"],
      ["Show clouds", "showClouds"],
      ["Show light", "showLight"],
    ];
    for (const [name, key] of rows) {
      stack.addControl(this.createCheckboxRow(name, this.renderConfig[key] as boolean, (v) => {
        (this.renderConfig as unknown as Record<string, unknown>)[key] = v;
        this.notifyRenderChange();
      }));
    }
    this.showSubPanel(panel);
  }

  // --- Helpers ---

  private notifyRenderChange(): void {
    this.callbacks.onRenderConfigChanged({ ...this.renderConfig });
  }

  private closeSubPanel(): void {
    if (this.subPanel) {
      this.gui.removeControl(this.subPanel);
      this.subPanel = null;
    }
  }

  private showSubPanel(panel: Rectangle): void {
    this.gui.addControl(panel);
    this.subPanel = panel;
  }

  private createPanel(width: string, _height: string): Rectangle {
    const rect = new Rectangle("panel_" + Math.random().toString(36).slice(2, 6));
    rect.width = width;
    rect.adaptHeightToChildren = true;
    rect.background = MENU_BG;
    rect.color = MENU_BORDER;
    rect.thickness = 1.5;
    rect.cornerRadius = 8;
    rect.shadowColor = "rgba(0,0,0,0.15)";
    rect.shadowBlur = 10;
    rect.shadowOffsetX = 2;
    rect.shadowOffsetY = 2;
    rect.paddingTop = "4px";
    rect.paddingBottom = "4px";
    return rect;
  }

  private createSubPanel(title: string): Rectangle {
    const panel = this.createPanel("230px", "auto");
    panel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    panel.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    panel.top = "62px";
    panel.left = "250px";
    panel.zIndex = 110;

    const stack = new StackPanel("sub_" + title);
    stack.width = "100%";
    panel.addControl(stack);

    stack.addControl(this.createTitle(title));
    stack.addControl(this.createSeparator());

    return panel;
  }

  private getSubStack(panel: Rectangle): StackPanel {
    // The StackPanel is the first child of the panel
    return panel.children[0] as StackPanel;
  }

  private createTitle(text: string): Rectangle {
    const header = new Rectangle("titleBox_" + text);
    header.width = "100%";
    header.height = "40px";
    header.background = HEADER_BG;
    header.thickness = 0;

    const tb = new TextBlock("title_" + text, text);
    tb.height = "40px";
    tb.color = HEADER_TEXT;
    tb.fontSize = 18;
    tb.fontFamily = PANEL_FONT;
    tb.fontWeight = "bold";
    tb.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    header.addControl(tb);
    return header;
  }

  private createSeparator(): Rectangle {
    const sep = new Rectangle("sep_" + Math.random());
    sep.width = "90%";
    sep.height = "1px";
    sep.background = MENU_BORDER;
    sep.thickness = 0;
    sep.paddingTop = "2px";
    sep.paddingBottom = "2px";
    return sep;
  }

  private createMenuItem(label: string, onClick: () => void, hasSubmenu = false): Button {
    const displayText = hasSubmenu ? label + "  ›" : label;
    const btn = Button.CreateSimpleButton("item_" + label, displayText);
    btn.width = "100%";
    btn.height = ITEM_H;
    btn.color = MENU_TEXT;
    btn.background = "transparent";
    btn.thickness = 0;
    btn.fontSize = 15;
    btn.fontFamily = PANEL_FONT;
    btn.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    if (btn.textBlock) {
      btn.textBlock.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
      btn.textBlock.paddingLeft = "16px";
    }

    btn.onPointerEnterObservable.add(() => {
      btn.background = MENU_HOVER;
    });
    btn.onPointerOutObservable.add(() => {
      btn.background = "transparent";
    });
    btn.onPointerClickObservable.add(() => {
      onClick();
    });

    return btn;
  }

  private createCheckboxRow(label: string, value: boolean, onChange: (v: boolean) => void): Grid {
    const row = new Grid("cbRow_" + label);
    row.width = "100%";
    row.height = "32px";
    row.addColumnDefinition(0.15);
    row.addColumnDefinition(0.85);

    const cb = new Checkbox("cb_" + label);
    cb.width = "18px";
    cb.height = "18px";
    cb.isChecked = value;
    cb.color = MENU_TEXT;
    cb.background = "transparent";
    cb.checkSizeRatio = 0.6;
    cb.onIsCheckedChangedObservable.add((val: boolean) => {
      onChange(val);
    });
    row.addControl(cb, 0, 0);

    const tb = new TextBlock("lbl_" + label, label);
    tb.color = MENU_TEXT;
    tb.fontSize = 13;
    tb.fontFamily = PANEL_FONT;
    tb.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    tb.paddingLeft = "4px";
    row.addControl(tb, 0, 1);

    return row;
  }

  private createSliderRow(label: string, value: number, min: number, max: number, step: number, onChange: (v: number) => void): StackPanel {
    const container = new StackPanel("slRow_" + label);
    container.width = "100%";
    container.height = "50px";
    container.paddingLeft = "12px";
    container.paddingRight = "12px";

    const header = new Grid("slHdr_" + label);
    header.width = "100%";
    header.height = "20px";
    header.addColumnDefinition(0.6);
    header.addColumnDefinition(0.4);

    const tb = new TextBlock("slLbl_" + label, label);
    tb.color = MENU_TEXT;
    tb.fontSize = 12;
    tb.fontFamily = PANEL_FONT;
    tb.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    header.addControl(tb, 0, 0);

    const valText = new TextBlock("slVal_" + label, this.formatSliderValue(value, step));
    valText.color = MENU_TEXT;
    valText.fontSize = 12;
    valText.fontFamily = PANEL_FONT;
    valText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
    header.addControl(valText, 0, 1);

    container.addControl(header);

    const slider = new Slider("sl_" + label);
    slider.width = "100%";
    slider.height = "20px";
    slider.minimum = min;
    slider.maximum = max;
    slider.step = step;
    slider.value = value;
    slider.color = MENU_TEXT;
    slider.background = "rgba(138, 133, 120, 0.3)";
    slider.thumbColor = MENU_TEXT;
    slider.borderColor = "transparent";
    slider.isThumbCircle = true;
    slider.onValueChangedObservable.add((v) => {
      valText.text = this.formatSliderValue(v, step);
      onChange(v);
    });

    container.addControl(slider);

    return container;
  }

  private createActionButton(label: string, onClick: () => void): Button {
    const btn = Button.CreateSimpleButton("act_" + label, label);
    btn.width = "90%";
    btn.height = "34px";
    btn.color = "#F2EFE6";
    btn.background = "rgba(63, 51, 44, 0.8)";
    btn.cornerRadius = 5;
    btn.thickness = 0;
    btn.fontSize = 13;
    btn.fontFamily = PANEL_FONT;

    btn.onPointerEnterObservable.add(() => {
      btn.background = "rgba(63, 51, 44, 1)";
    });
    btn.onPointerOutObservable.add(() => {
      btn.background = "rgba(63, 51, 44, 0.8)";
    });
    btn.onPointerClickObservable.add(() => onClick());

    return btn;
  }

  private formatSliderValue(v: number, step: number): string {
    if (step >= 1) return Math.round(v).toString();
    if (step >= 0.1) return v.toFixed(1);
    return v.toFixed(2);
  }

  dispose(): void {
    this.gui.dispose();
  }
}
