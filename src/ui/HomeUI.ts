import { AdvancedDynamicTexture } from "@babylonjs/gui/2D/advancedDynamicTexture";
import { Button } from "@babylonjs/gui/2D/controls/button";
import { Rectangle } from "@babylonjs/gui/2D/controls/rectangle";
import { StackPanel } from "@babylonjs/gui/2D/controls/stackPanel";

import { TextBlock } from "@babylonjs/gui/2D/controls/textBlock";
import { Control } from "@babylonjs/gui/2D/controls/control";
import { Scene } from "@babylonjs/core/scene";
import "@babylonjs/core/Engines/Extensions/engine.dynamicTexture";
import "@babylonjs/core/Engines/WebGPU/Extensions/engine.dynamicTexture";

export interface HomeUICallbacks {
  onPlay: () => void;
}

export class HomeUI {
  private gui: AdvancedDynamicTexture;
  private settingsPanel: Rectangle | null = null;

  constructor(scene: Scene, callbacks: HomeUICallbacks) {
    this.gui = AdvancedDynamicTexture.CreateFullscreenUI("homeUI", true, scene);
    // Non-interactive elements first (bottom layer)
    this.createTitle();
    // Interactive elements last (top layer)
    this.createPlayButton(callbacks.onPlay);
    this.createSettingsButton();
  }

  private createTitle(): void {
    const title = new TextBlock("title");
    title.text = "POTEFILSRAM";
    title.color = "#e8d5b5";
    title.fontSize = 48;
    title.fontFamily = "Georgia, serif";
    title.top = "-30%";
    title.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
    title.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    title.shadowColor = "#000000";
    title.shadowOffsetX = 2;
    title.shadowOffsetY = 2;
    title.shadowBlur = 8;
    title.isHitTestVisible = false;
    title.isPointerBlocker = false;
    this.gui.addControl(title);
  }

  private createPlayButton(onPlay: () => void): void {
    // Main play button with text
    const btn = Button.CreateSimpleButton("playBtn", "PLAY");
    btn.width = "140px";
    btn.height = "140px";
    btn.cornerRadius = 70;
    btn.thickness = 3;
    btn.color = "#e8a840";
    btn.background = "rgba(30, 20, 10, 0.7)";
    btn.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
    btn.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    btn.top = "5%";
    btn.zIndex = 10;
    btn.fontSize = 24;
    btn.fontFamily = "Georgia, serif";

    // Hover effects
    btn.onPointerEnterObservable.add(() => {
      btn.background = "rgba(60, 40, 15, 0.85)";
      btn.color = "#ffd070";
    });

    btn.onPointerOutObservable.add(() => {
      btn.background = "rgba(30, 20, 10, 0.7)";
      btn.color = "#e8a840";
    });

    btn.onPointerClickObservable.add(() => {
      onPlay();
    });

    this.gui.addControl(btn);
  }

  private createSettingsButton(): void {
    const btn = Button.CreateSimpleButton("settingsBtn", "");
    btn.width = "50px";
    btn.height = "50px";
    btn.cornerRadius = 25;
    btn.thickness = 1.5;
    btn.color = "rgba(200, 190, 170, 0.5)";
    btn.background = "rgba(20, 15, 10, 0.5)";
    btn.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
    btn.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
    btn.top = "-20px";
    btn.left = "-20px";

    // Gear icon using unicode
    const gearIcon = new TextBlock("gearIcon");
    gearIcon.text = "⚙";
    gearIcon.color = "rgba(200, 190, 170, 0.7)";
    gearIcon.fontSize = 24;
    btn.addControl(gearIcon);

    // Hover effects
    btn.onPointerEnterObservable.add(() => {
      btn.background = "rgba(40, 30, 15, 0.7)";
      btn.color = "rgba(230, 210, 170, 0.8)";
      gearIcon.color = "rgba(240, 220, 180, 0.9)";
    });

    btn.onPointerOutObservable.add(() => {
      btn.background = "rgba(20, 15, 10, 0.5)";
      btn.color = "rgba(200, 190, 170, 0.5)";
      gearIcon.color = "rgba(200, 190, 170, 0.7)";
    });

    btn.onPointerClickObservable.add(() => {
      this.toggleSettingsPanel();
    });

    this.gui.addControl(btn);
  }

  private toggleSettingsPanel(): void {
    if (this.settingsPanel) {
      this.gui.removeControl(this.settingsPanel);
      this.settingsPanel = null;
      return;
    }

    const panel = new Rectangle("settingsPanel");
    panel.width = "420px";
    panel.height = "300px";
    panel.cornerRadius = 12;
    panel.thickness = 2;
    panel.color = "#e8a840";
    panel.background = "rgba(12, 10, 8, 0.92)";
    panel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    panel.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;

    const stack = new StackPanel("settingsStack");
    stack.width = "90%";
    stack.spacing = 10;
    panel.addControl(stack);

    const title = new TextBlock("settingsTitle", "SETTINGS");
    title.height = "52px";
    title.color = "#f6e5c2";
    title.fontSize = 32;
    title.fontFamily = "Georgia, serif";
    stack.addControl(title);

    const item1 = new TextBlock("settingsItem1", "Inspector: Shift + I");
    item1.height = "36px";
    item1.color = "#e8d5b5";
    item1.fontSize = 22;
    item1.fontFamily = "Georgia, serif";
    item1.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    stack.addControl(item1);

    const item2 = new TextBlock("settingsItem2", "Mouse Wheel: Zoom");
    item2.height = "36px";
    item2.color = "#e8d5b5";
    item2.fontSize = 22;
    item2.fontFamily = "Georgia, serif";
    item2.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    stack.addControl(item2);

    const item3 = new TextBlock("settingsItem3", "Right Drag: Pan camera");
    item3.height = "36px";
    item3.color = "#e8d5b5";
    item3.fontSize = 22;
    item3.fontFamily = "Georgia, serif";
    item3.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    stack.addControl(item3);

    const closeBtn = Button.CreateSimpleButton("closeSettingsBtn", "CLOSE");
    closeBtn.width = "140px";
    closeBtn.height = "48px";
    closeBtn.cornerRadius = 24;
    closeBtn.thickness = 2;
    closeBtn.color = "#f6e5c2";
    closeBtn.background = "rgba(80, 45, 12, 0.9)";
    closeBtn.fontSize = 20;
    closeBtn.fontFamily = "Georgia, serif";
    closeBtn.onPointerEnterObservable.add(() => {
      closeBtn.background = "rgba(120, 65, 18, 0.95)";
    });
    closeBtn.onPointerOutObservable.add(() => {
      closeBtn.background = "rgba(80, 45, 12, 0.9)";
    });
    closeBtn.onPointerClickObservable.add(() => this.toggleSettingsPanel());
    stack.addControl(closeBtn);

    this.gui.addControl(panel);
    this.settingsPanel = panel;
  }

  dispose(): void {
    if (this.settingsPanel) {
      this.gui.removeControl(this.settingsPanel);
      this.settingsPanel = null;
    }
    this.gui.dispose();
  }
}
