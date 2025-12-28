export {};

declare global {
  interface Window {
    hotasApi: {
      listTemplates(): Promise<any[]>;
      readTemplateAssets(templateId: string): Promise<{ imagePath: string; anchorsJson: string }>;
      openLuaDiffFiles(): Promise<Array<{ name: string; path: string; content: string }>>;
      addTemplate(payload: {
        name: string;
        imageFilePath: string;
        anchorsFilePath: string;
        defaultPage?: { size: string; orientation: string; marginMm: number };
      }): Promise<any>;
      exportPdf(options: { pageSize: "A4" | "A5" | "Letter"; landscape: boolean }): Promise<{ savedPath: string | null }>;
    };
  }
}
