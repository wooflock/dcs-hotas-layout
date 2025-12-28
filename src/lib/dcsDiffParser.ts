import type { ParsedDiff, Binding, DeviceId } from "./types";

export function parseDcsDiffLua(contents: string, device: DeviceId): ParsedDiff {
  const bindings: Binding[] = [];

  const axisBlock = extractTopLevelBlock(contents, "axisDiffs");
  if (axisBlock) parseDiffEntries(axisBlock, "axes");

  const keyBlock = extractTopLevelBlock(contents, "keyDiffs");
  if (keyBlock) parseDiffEntries(keyBlock, "keys");

  return { bindings };

  function parseDiffEntries(blockText: string, section: "keys" | "axes") {
    const entryHeaderRe = /\[\s*"([^"]+)"\s*\]\s*=\s*\{/g;

    let m: RegExpExecArray | null;
    while ((m = entryHeaderRe.exec(blockText))) {
      const commandId = m[1];
      const entryStartBraceIdx = m.index + m[0].length - 1; // '{'
      const entryEndBraceIdx = findMatchingBrace(blockText, entryStartBraceIdx);
      if (entryEndBraceIdx === -1) continue;

      const entryBody = blockText.slice(entryStartBraceIdx + 1, entryEndBraceIdx);

      const nameMatch = /\[\s*"name"\s*\]\s*=\s*"([^"]+)"/.exec(entryBody);
      const action = nameMatch?.[1];
      if (!action) {
        entryHeaderRe.lastIndex = entryEndBraceIdx + 1;
        continue;
      }

      // Active-only: read keys from ["added"] and ["changed"] blocks, ignore ["removed"]
      let foundAny = false;
      for (const blk of ["added", "changed"] as const) {
        const sub = extractNamedSubBlock(entryBody, blk);
        if (!sub) continue;

        const keyRe = /\[\s*"key"\s*\]\s*=\s*"([^"]+)"/g;
        let km: RegExpExecArray | null;
        while ((km = keyRe.exec(sub))) {
          const key = km[1];
          if (!key.startsWith("JOY_")) continue;

          foundAny = true;
          bindings.push({ device, key, action, section, commandId });
        }
      }

      // advance cursor to avoid nested re-matching
      entryHeaderRe.lastIndex = entryEndBraceIdx + 1;

      // If no active joystick keys, skip
      if (!foundAny) continue;
    }
  }
}

function extractTopLevelBlock(src: string, blockName: string): string | null {
  const startRe = new RegExp(`\\["${escapeRe(blockName)}"\\]\\s*=\\s*\\{`, "m");
  const sm = startRe.exec(src);
  if (!sm) return null;

  const startIdx = sm.index + sm[0].length; // after "{"
  const endIdx = findMatchingBrace(src, startIdx - 1);
  if (endIdx === -1) return null;

  return src.slice(startIdx, endIdx).trim();
}

function extractNamedSubBlock(entryBody: string, name: string): string | null {
  const startRe = new RegExp(`\\[\\s*"${escapeRe(name)}"\\s*\\]\\s*=\\s*\\{`, "m");
  const sm = startRe.exec(entryBody);
  if (!sm) return null;

  const openBraceIdx = sm.index + sm[0].length - 1; // '{'
  const endIdx = findMatchingBrace(entryBody, openBraceIdx);
  if (endIdx === -1) return null;

  return entryBody.slice(openBraceIdx + 1, endIdx);
}

function findMatchingBrace(text: string, openBraceIndex: number): number {
  if (text[openBraceIndex] !== "{") return -1;

  let depth = 0;
  let inString = false;
  let stringChar: '"' | "'" | null = null;

  for (let i = openBraceIndex; i < text.length; i++) {
    const ch = text[i];

    if (inString) {
      if (ch === "\\" && i + 1 < text.length) {
        i++;
        continue;
      }
      if (ch === stringChar) {
        inString = false;
        stringChar = null;
      }
      continue;
    } else {
      if (ch === '"' || ch === "'") {
        inString = true;
        stringChar = ch as '"' | "'";
        continue;
      }
    }

    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) return i;
    }
  }

  return -1;
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
