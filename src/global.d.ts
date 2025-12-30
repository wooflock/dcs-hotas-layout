import type { PageSize } from "./lib/types";

export {};

declare global {
  interface Window {
    hotasApi: {
      listTemplates(): Promise<any[]>;
      readTemplateAssets(templateId: string): Promise<{ imagePath: string; anchorsJson: string }>;
      openLuaDiffFiles(opts?: { single?: boolean }): Promise<Array<{ name: string; path: string; content: string }>>;
      addTemplate(payload: {
        name: string;
        imageFilePath: string;
        anchorsFilePath: string;
        defaultPage?: { size: PageSize; orientation: "landscape" | "portrait"; marginMm: number };
      }): Promise<any>;
      exportPdf(options: { pageSize: "A4" | "A5" | "Letter"; landscape: boolean }): Promise<{ savedPath: string | null }>;

      // : menu event listeners (no Promise; they register callbacks)
      onMenuImport(cb: (payload: { device: "stick" | "throttle" }) => void): void;
      onMenuExportPdf(cb: () => void): void;
      onMenuAbout(cb: () => void): void;
      onMenuToggleBindings(cb: (payload: { visible: boolean }) => void): void;
    };
  }
}
