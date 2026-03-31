import { useMemo } from "react";
import { JsonPanel } from "./components/JsonPanel";
import { BabylonViewport } from "./components/BabylonViewport";
import { starterDashboardSchema } from "@marslife/shared-schema";

export function App() {
  const schema = useMemo(() => starterDashboardSchema, []);

  return (
    <div className="layout">
      <header className="topbar">
        <h1>Marslife Command Center</h1>
      </header>
      <main className="main-grid">
        <section className="viewport-shell">
          <BabylonViewport />
        </section>
        <JsonPanel schema={schema} />
      </main>
    </div>
  );
}
