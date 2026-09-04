const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('focusPetDesktop', {
  getInfo: () => ipcRenderer.invoke('focuspet:get-info'),
  moveBy: (dx, dy) => ipcRenderer.invoke('focuspet:move-by', dx, dy),
  setPosition: (x, y) => ipcRenderer.invoke('focuspet:set-position', x, y),
  setAlwaysOnTop: (pinned) => ipcRenderer.invoke('focuspet:set-always-on-top', pinned),
  resizeWindow: (width, height) => ipcRenderer.invoke('focuspet:resize-window', width, height),
});
