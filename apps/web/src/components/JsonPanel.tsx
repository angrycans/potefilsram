import type { DashboardSchema } from "@marslife/shared-schema";

type JsonPanelProps = {
  schema: DashboardSchema;
};

export function JsonPanel({ schema }: JsonPanelProps) {
  return (
    <aside className="panel">
      <h2>{schema.title}</h2>
      {schema.widgets.map((widget) => (
        <section key={widget.id} className="widget">
          <h3>{widget.label}</h3>
          <p>{widget.description}</p>
          <code>{JSON.stringify(widget.data, null, 2)}</code>
        </section>
      ))}
    </aside>
  );
}
