import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("hotasApi", {
  listTemplates: () => ipcRenderer.invoke("templates:list"),
  readTemplateAssets: (templateId: string) =>
    ipcRenderer.invoke("templates:readAssets", templateId),

  openLuaDiffFiles: (opts?: { single?: boolean }) =>
  ipcRenderer.invoke("files:openLuaDiff", opts ?? {}),

  addTemplate: (payload: {
    name: string;
    imageFilePath: string;
    anchorsFilePath: string;
    defaultPage?: { size: string; orientation: string; marginMm: number };
  }) => ipcRenderer.invoke("templates:add", payload),

  exportPdf: (options: { pageSize: "A4" | "A5" | "Letter"; landscape: boolean }) =>
    ipcRenderer.invoke("pdf:export", options),

  onMenuImport: (cb: (payload: { device: "stick" | "throttle" }) => void) =>
    ipcRenderer.on("menu:import", (_e, payload) => cb(payload)),

  onMenuExportPdf: (cb: () => void) =>
    ipcRenderer.on("menu:exportPdf", () => cb()),

  onMenuAbout: (cb: () => void) =>
    ipcRenderer.on("menu:about", () => cb()),

  onMenuToggleBindings: (cb: (payload: { visible: boolean }) => void) =>
  ipcRenderer.on("menu:toggleBindings", (_e, payload) => cb(payload))

});
