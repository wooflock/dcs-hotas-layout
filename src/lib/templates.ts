import type { AnchorsFile, TemplateInfo } from "./types";

export async function loadTemplates(): Promise<TemplateInfo[]> {
  const list = await window.hotasApi.listTemplates();
  return list as TemplateInfo[];
}

export async function loadTemplateAssets(templateId: string): Promise<{
  imageUrl: string;
  anchors: AnchorsFile;
}> {
  const { imagePath, anchorsJson } = await window.hotasApi.readTemplateAssets(templateId);

  const normalized = imagePath.replace(/\\/g, "/");
  const imageUrl = `appimg://${encodeURIComponent(normalized)}`;
  const anchors = JSON.parse(anchorsJson) as AnchorsFile;

  return { imageUrl, anchors };
}
