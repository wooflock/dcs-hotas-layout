import type { Binding } from "./types";

export function groupBindingsByDeviceKey(bindings: Binding[]): Map<string, Binding[]> {
  const m = new Map<string, Binding[]>();
  for (const b of bindings) {
    const composite = `${b.device}.${b.key}`;
    const arr = m.get(composite) ?? [];
    arr.push(b);
    m.set(composite, arr);
  }
  return m;
}
