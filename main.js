const { app, BrowserWindow, ipcMain, screen } = require('electron');
const path = require('path');
const { WIDGET_SIZES, clampWindowSize } = require('./window-size.js');

let win;

function createWindow() {
  const display = screen.getPrimaryDisplay();
  const { width, height } = display.workAreaSize;

  win = BrowserWindow.getAllWindows()[0] || new BrowserWindow({
    width: WIDGET_SIZES.compact.width,
    height: WIDGET_SIZES.compact.height,
    minWidth: 280,
    minHeight: 180,
    x: Math.max(16, Math.round(width - 360)),
    y: Math.max(16, Math.round(height - 340)),
    show: false,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    movable: true,
    hasShadow: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  win.setAlwaysOnTop(true, 'floating');
  win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  const loadOptions = process.argv.includes('--show-onboarding') ? { query: { showOnboarding: '1' } } : undefined;
  win.loadFile(path.join(__dirname, 'app', 'index.html'), loadOptions);

  win.once('ready-to-show', () => {
    if (!win.isDestroyed()) win.show();
  });

  win.on('closed', () => {
    win = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.handle('focuspet:get-info', () => ({
  platform: process.platform,
  alwaysOnTop: win ? win.isAlwaysOnTop() : false,
}));

ipcMain.handle('focuspet:move-by', (_event, dx, dy) => {
  if (!win) return null;
  const [x, y] = win.getPosition();
  win.setPosition(Math.round(x + dx), Math.round(y + dy), false);
  return win.getPosition();
});

ipcMain.handle('focuspet:set-position', (_event, x, y) => {
  if (!win) return null;
  win.setPosition(Math.round(x), Math.round(y), false);
  return win.getPosition();
});

ipcMain.handle('focuspet:set-always-on-top', (_event, pinned) => {
  if (!win) return false;
  win.setAlwaysOnTop(Boolean(pinned), 'floating');
  return win.isAlwaysOnTop();
});

ipcMain.handle('focuspet:resize-window', (_event, width, height) => {
  if (!win) return null;
  const [nextWidth, nextHeight] = clampWindowSize(width, height);
  win.setContentSize(nextWidth, nextHeight, false);
  return win.getContentSize();
});
