import React, { useEffect, useMemo, useRef } from "react";
import type { AnchorsFile, Binding } from "../lib/types";
import { groupBindingsByDeviceKey } from "../lib/normalize";

type Props = {
  imageUrl: string | null;
  anchors: AnchorsFile | null;
  bindings: Binding[];
  showUnmappedMarkers?: boolean;
};

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";

  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    const width = ctx.measureText(test).width;
    if (width > maxWidth && line) {
      lines.push(line);
      line = w;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export default function CanvasPreview({ imageUrl, anchors, bindings }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const grouped = useMemo(() => groupBindingsByDeviceKey(bindings), [bindings]);

  useEffect(() => {
    if (!imageUrl || !anchors) return;

    const img = new Image();
    imgRef.current = img;
    img.src = imageUrl;

    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Use image natural size for best coordinate alignment
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;

      // Background
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);

      // Text styling
      ctx.textBaseline = "top";
      ctx.fillStyle = "black";

      for (const [deviceKey, list] of grouped.entries()) {
        const a = anchors.anchors[deviceKey];
        if (!a) continue;

        const fontSize = a.fontSize ?? 18;
        ctx.font = `${fontSize}px sans-serif`;
        ctx.textAlign = a.align ?? "left";

        const text = list.map((b) => b.action).join("\n");
        const maxWidth = a.maxWidth ?? 320;

        // Draw background box for readability
        const lines = text.split("\n").flatMap((t) => wrapText(ctx, t, maxWidth));
        const lineHeight = fontSize * 1.2;

        // Compute box size
        const boxWidth = Math.min(
          maxWidth,
          Math.max(...lines.map((ln) => ctx.measureText(ln).width)) + 10
        );
        const boxHeight = lines.length * lineHeight + 10; // 10 is padding

        let boxX = a.x;
        if (ctx.textAlign === "center") boxX = a.x - boxWidth / 2;
        if (ctx.textAlign === "right") boxX = a.x - boxWidth;

        
        const boxY = a.y - boxHeight / 2;

        // semi-opaque white box
        ctx.save();
        ctx.globalAlpha = 0.75;
        ctx.fillStyle = "white";
        ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
        ctx.restore();

        // text
        ctx.fillStyle = "black";
        let y = boxY + 5;
        for (const ln of lines) {
          ctx.fillText(ln, a.x, y);
          y += lineHeight;
        }
      }
    };
  }, [imageUrl, anchors, grouped]);

  return (
    <div style={{ border: "1px solid #ddd", borderRadius: 8, overflow: "auto" }}>
      <canvas ref={canvasRef} style={{ width: "100%", height: "auto", display: "block" }} />
    </div>
  );
}
