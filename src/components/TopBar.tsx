import React from "react";
import type { Orientation, PageSize } from "../lib/types";

export default function TopBar({
  pageSize,
  setPageSize,
  orientation,
  setOrientation,
  onImportStick,
  onImportThrottle,
  onExportPdf,
  canExport
}: {
  pageSize: PageSize;
  setPageSize: (s: PageSize) => void;
  orientation: Orientation;
  setOrientation: (o: Orientation) => void;
  onImportStick: () => void;
  onImportThrottle: () => void;
  onExportPdf: () => void;
  canExport: boolean;
}) {
  return (
    <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>

      <button onClick={onImportThrottle} style={{ padding: "8px 12px", borderRadius: 8 }}>
        Import Throttle DCS .diff.lua
      </button>

      <button onClick={onImportStick} style={{ padding: "8px 12px", borderRadius: 8 }}>
        Import Stick DCS .diff.lua
      </button>

      <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <span style={{ fontWeight: 600 }}>Page</span>
        <select
          value={pageSize}
          onChange={(e) => setPageSize(e.target.value as PageSize)}
          style={{ padding: 6, borderRadius: 6 }}
        >
          <option value="A4">A4</option>
          <option value="A5">A5</option>
          <option value="Letter">Letter</option>
        </select>
      </label>

      <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <span style={{ fontWeight: 600 }}>Orientation</span>
        <select
          value={orientation}
          onChange={(e) => setOrientation(e.target.value as Orientation)}
          style={{ padding: 6, borderRadius: 6 }}
        >
          <option value="landscape">Landscape</option>
          <option value="portrait">Portrait</option>
        </select>
      </label>

      <button
        onClick={onExportPdf}
        disabled={!canExport}
        style={{ padding: "8px 12px", borderRadius: 8 }}
        title={!canExport ? "Select a template and import lua first" : "Export a single-page PDF"}
      >
        Export PDF
      </button>
    </div>
  );
}
