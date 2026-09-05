// A focused full run; use the same read-only controller and real input path as the matrix.
process.env.SCENARIO ||= 'desktop';
process.env.ENGINES ||= 'chromium';
await import('./shonin-browser-check.mjs');
