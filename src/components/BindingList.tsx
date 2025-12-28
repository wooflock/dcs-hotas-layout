import React, { useMemo } from "react";
import type { AnchorsFile, Binding } from "../lib/types";

export default function BindingList({
  anchors,
  bindings
}: {
  anchors: AnchorsFile | null;
  bindings: Binding[];
}) {
  const unmapped = useMemo(() => {
    if (!anchors) return bindings;
    const set = new Set(Object.keys(anchors.anchors));
    return bindings.filter((b) => !set.has(`${b.device}.${b.key}`));
  }, [anchors, bindings]);

  return (
    <div style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <h3 style={{ margin: 0 }}>Bindings</h3>
        <div style={{ color: "#666" }}>{bindings.length} total</div>
      </div>

      <div style={{ marginTop: 8, maxHeight: 240, overflow: "auto", fontSize: 13 }}>
        {bindings.slice(0, 200).map((b, idx) => (
          <div key={`${b.commandId}-${b.key}-${idx}`} style={{ padding: "4px 0", borderBottom: "1px solid #f2f2f2" }}>
            <strong>{b.key}</strong> — {b.action}
          </div>
        ))}
        {bindings.length > 200 && <div style={{ paddingTop: 8, color: "#666" }}>Showing first 200…</div>}
      </div>

      <div style={{ marginTop: 12 }}>
        <h4 style={{ margin: "8px 0" }}>Unmapped (no anchor in JSON)</h4>
        <div style={{ maxHeight: 140, overflow: "auto", fontSize: 13, color: "#a33" }}>
          {unmapped.length === 0 ? (
            <div style={{ color: "#2a7" }}>All bindings mapped 🎉</div>
          ) : (
            unmapped.slice(0, 200).map((b, idx) => (
              <div key={`unmapped-${b.commandId}-${b.key}-${idx}`} style={{ padding: "2px 0" }}>
                <strong>{b.key}</strong> — {b.action}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
