// R3F 9 still constructs a THREE.Clock internally; three r187 logs a deprecation on construction.
// Keep the console clean without touching R3F: drop that one message only.
if (typeof window !== 'undefined' && !(window as unknown as { __ksWarnPatched?: boolean }).__ksWarnPatched) {
  (window as unknown as { __ksWarnPatched?: boolean }).__ksWarnPatched = true;
  const orig = console.warn.bind(console);
  console.warn = (...args: unknown[]) => { if (typeof args[0] === 'string' && args[0].startsWith('THREE.Clock: This module has been deprecated')) return; orig(...args); };
}
export {};
