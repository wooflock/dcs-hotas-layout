import React, { useEffect, useMemo, useState } from "react";
import TemplatePicker from "./components/TemplatePicker";
import CanvasPreview from "./components/CanvasPreview";
import BindingList from "./components/BindingList";
import TopBar from "./components/TopBar";
import { loadTemplateAssets, loadTemplates } from "./lib/templates";
import { parseDcsDiffLua } from "./lib/dcsDiffParser";
import type { AnchorsFile, Binding, Orientation, PageSize, TemplateInfo } from "./lib/types";

export default function App() {
  const [templates, setTemplates] = useState<TemplateInfo[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [anchors, setAnchors] = useState<AnchorsFile | null>(null);

  const [stickBindings, setStickBindings] = useState<Binding[]>([]);
  const [throttleBindings, setThrottleBindings] = useState<Binding[]>([]);
  const bindings = useMemo(() => [...stickBindings, ...throttleBindings], [stickBindings, throttleBindings]);

  const [pageSize, setPageSize] = useState<PageSize>("A4");
  const [orientation, setOrientation] = useState<Orientation>("landscape");

  const [showBindingsPanel, setShowBindingsPanel] = useState(false);


  useEffect(() => {
    (async () => {
      const t = await loadTemplates();
      setTemplates(t);
    })();
  }, []);

  useEffect(() => {
    if (!selectedTemplateId) return;
    (async () => {
      const assets = await loadTemplateAssets(selectedTemplateId);
      setImageUrl(assets.imageUrl);
      setAnchors(assets.anchors);

      // apply template defaults if present
      const tmpl = templates.find((x) => x.id === selectedTemplateId);
      if (tmpl?.defaultPage?.size) setPageSize(tmpl.defaultPage.size);
      if (tmpl?.defaultPage?.orientation) setOrientation(tmpl.defaultPage.orientation);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTemplateId]);

  useEffect(() => {
  window.hotasApi.onMenuImport(({ device }) => {
    importForDevice(device);
  });

  window.hotasApi.onMenuExportPdf(() => {
    onExportPdf();
  });

  window.hotasApi.onMenuAbout(() => {
    alert("HOTAS Layout Exporter\nBy Martin Quensel\nBeta version.\nTakes DCS files with the input config and shows it.");
  });

  window.hotasApi.onMenuToggleBindings(({ visible }) => {
    setShowBindingsPanel(visible);
  });

  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);


  const canExport = useMemo(() => {
    return Boolean(selectedTemplateId && imageUrl && anchors && bindings.length > 0);
  }, [selectedTemplateId, imageUrl, anchors, bindings.length]);

  async function importForDevice(device: "stick" | "throttle") {
    try {
      const files = await window.hotasApi.openLuaDiffFiles({ single: true });
      if (!files || files.length === 0) return;

      const file = files[0];
      const parsed = parseDcsDiffLua(file.content, device);

      // Keep only active mappings (added/changed) — assuming you already applied that filter
      const deduped = dedupeBindings(parsed.bindings);

      if (device === "stick") setStickBindings(deduped);
      else setThrottleBindings(deduped);

    } catch (err) {
      console.error(err);
      alert(`Import failed: ${String(err)}`);
    }
  }

  function dedupeBindings(list: Binding[]) {
    const seen = new Set<string>();
    const out: Binding[] = [];
    for (const b of list) {
      const k = `${b.device}.${b.key}||${b.action}`;
      if (seen.has(k)) continue;
      seen.add(k);
      out.push(b);
    }
    return out;
  }

  async function onExportPdf() {
    const result = await window.hotasApi.exportPdf({
      pageSize,
      landscape: orientation === "landscape"
    });

    if (result.savedPath) {
      // Optional: replace with toast later
      alert(`Saved PDF:\n${result.savedPath}`);
    }
  }

  return (
    <div style={{ padding: 16, fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif" }}>
      <h1 style={{ margin: "0 0 12px" }}>HOTAS Layout Exporter</h1>

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
        <TemplatePicker
          templates={templates}
          selectedId={selectedTemplateId}
          onChange={(id) => setSelectedTemplateId(id)}
        />
        <TopBar
          pageSize={pageSize}
          setPageSize={setPageSize}
          orientation={orientation}
          setOrientation={setOrientation}
          onImportStick={() => importForDevice("stick")}
          onImportThrottle={() => importForDevice("throttle")}
          
          onExportPdf={onExportPdf}
          canExport={canExport}
        />
      </div>

      <div style={{ 
        display: "grid", 
        gridTemplateColumns: showBindingsPanel ? "1.6fr 1fr" : "1fr", 
        gap: 16, 
        marginTop: 16 
      }}>
        <div>
          {!imageUrl || !anchors ? (
            <div style={{ padding: 24, border: "1px dashed #ccc", borderRadius: 8 }}>
              Select a template to preview.
            </div>
          ) : (
            <CanvasPreview imageUrl={imageUrl} anchors={anchors} bindings={bindings} />
          )}
        </div>

        {showBindingsPanel && (
        <div>
          <BindingList anchors={anchors} bindings={bindings} />
          <div style={{ marginTop: 12, color: "#666", fontSize: 13 }}>
            If actions appear under “Unmapped”, add those keys to the template’s anchors.json.
          </div>
        </div>
        )}
      </div>
    </div>
  );
}
