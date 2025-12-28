import React from "react";
import type { TemplateInfo } from "../lib/types";

export default function TemplatePicker({
  templates,
  selectedId,
  onChange
}: {
  templates: TemplateInfo[];
  selectedId: string | null;
  onChange: (id: string) => void;
}) {
  return (
    <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
      <span style={{ fontWeight: 600 }}>Template</span>
      <select
        value={selectedId ?? ""}
        onChange={(e) => onChange(e.target.value)}
        style={{ padding: 6, borderRadius: 6 }}
      >
        <option value="" disabled>
          Select a joystick template…
        </option>
        {templates.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name} {t.source === "user" ? "(User)" : ""}
          </option>
        ))}
      </select>
    </label>
  );
}
