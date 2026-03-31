export type Coordinate = {
  lat: number;
  lon: number;
  alt?: number;
};

export type DashboardWidget = {
  id: string;
  label: string;
  description: string;
  data: Record<string, unknown>;
};

export type DashboardSchema = {
  schemaVersion: "1.0.0";
  title: string;
  widgets: DashboardWidget[];
};

export type UiToSceneEvent =
  | { type: "focus_site"; payload: { siteId: string } }
  | { type: "toggle_layer"; payload: { layerId: string; enabled: boolean } }
  | { type: "set_time"; payload: { timestamp: string } };

export type SceneToUiEvent =
  | { type: "picked_site"; payload: { siteId: string } }
  | { type: "camera_changed"; payload: { lat: number; lon: number; zoom: number } }
  | { type: "object_alert"; payload: { objectId: string; level: "info" | "warn" | "critical" } };

export const starterDashboardSchema: DashboardSchema = {
  schemaVersion: "1.0.0",
  title: "Mars Command Panel",
  widgets: [
    {
      id: "mission-clock",
      label: "Mission Clock",
      description: "Current UTC and mission elapsed timer.",
      data: { utc: new Date().toISOString(), met: "T+000:00:00" }
    },
    {
      id: "launch-watch",
      label: "Launch Watch",
      description: "Latest Starship flight status feed.",
      data: { provider: "third-api", status: "monitoring" }
    }
  ]
};
