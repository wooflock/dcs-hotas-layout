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
    ipcRenderer.invoke("pdf:export", options)
});
