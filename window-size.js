(function windowSizeModule(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.FocusPadWindowSize = api;
})(typeof window !== 'undefined' ? window : globalThis, () => {
  const WIDGET_SIZES = {
    compact: { width: 320, height: 250 },
    focus: { width: 336, height: 430 },
    tasks: { width: 336, height: 500 },
    editor: { width: 336, height: 500 },
    historyDialog: { width: 336, height: 462 },
  };

  function clampWindowSize(width, height) {
    return [
      Math.max(280, Math.min(360, Math.round(width))),
      Math.max(180, Math.min(560, Math.round(height))),
    ];
  }

  return { WIDGET_SIZES, clampWindowSize };
});
