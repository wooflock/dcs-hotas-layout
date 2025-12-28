export type PageSize = "A4" | "A5" | "Letter";
export type Orientation = "landscape" | "portrait";

export type TemplateInfo = {
  id: string;
  name: string;
  image: string;
  anchors: string;
  defaultPage?: { size: PageSize; orientation: Orientation; marginMm: number };
  source?: "bundled" | "user";
  baseDir?: string;
};

export type DeviceId = "stick" | "throttle";

export type Anchor = {
  x: number;
  y: number;
  align?: CanvasTextAlign; // "left" | "center" | "right"
  maxWidth?: number;
  fontSize?: number;
};

export type AnchorsFile = {
  imageSize?: { width: number; height: number };
  anchors: Record<string, Anchor>;
};

export type Binding = {
  device: DeviceId;
  key: string;      // e.g. "JOY_BTN14"
  action: string;   // e.g. "Landing Gear Up"
  section: "keys" | "axes";
  commandId: string;
};

export type ParsedDiff = {
  bindings: Binding[];
};
