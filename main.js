const { app, BrowserWindow, ipcMain, screen, Tray, Menu, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const { WIDGET_SIZES, clampWindowSize } = require('./window-size');
const { createStore } = require('./durable-store');
app.setName('Focus Pad v2');
const smoke = process.argv.includes('--smoke-test');
app.setPath('userData', smoke ? (process.env.FOCUSPAD_SMOKE_DIR || path.join(app.getPath('temp'), 'focus-pad-v2-smoke-' + process.pid)) : path.join(app.getPath('appData'), 'Focus Pad v2'));
const store = createStore(app.getPath('userData'));
let win, companion, tray, quitting = false;
if (!app.requestSingleInstanceLock()) app.quit();
else {
app.on('second-instance',()=>{win?.show();win?.focus();});
function configure(w) {
 w.webContents.setWindowOpenHandler(({url})=>{if(url.startsWith('file:')) openCompanion(); else if(/^https:\/\//.test(url))shell.openExternal(url);return {action:'deny'};});
 w.webContents.on('will-navigate',(event,url)=>{if(!url.startsWith('file:')){event.preventDefault();if(/^https:\/\//.test(url))shell.openExternal(url);}});
}
function openCompanion(){
 if(companion&&!companion.isDestroyed()){companion.show();companion.focus();return;}
 companion=new BrowserWindow({icon:path.join(__dirname,'assets/icon.ico'),title:'Focus Pad · 月亮陪伴',width:1080,height:820,autoHideMenuBar:true,backgroundColor:'#10111d',webPreferences:{preload:path.join(__dirname,'preload.js'),contextIsolation:true,nodeIntegration:false,sandbox:true,additionalArguments:['--companion']}});
 configure(companion);companion.loadFile(path.join(__dirname,'companion.html'));companion.on('closed',()=>companion=null);
}
app.whenReady().then(()=>{
 const {width,height}=screen.getPrimaryDisplay().workAreaSize;
 win=new BrowserWindow({icon:path.join(__dirname,'assets/icon.ico'),width:WIDGET_SIZES.compact.width,height:WIDGET_SIZES.compact.height,x:Math.max(16,width-360),y:Math.max(16,height-340),show:false,frame:false,transparent:true,backgroundColor:'#00000000',alwaysOnTop:true,skipTaskbar:true,resizable:false,hasShadow:false,webPreferences:{preload:path.join(__dirname,'preload.js'),contextIsolation:true,nodeIntegration:false,sandbox:true}});
 win.setAlwaysOnTop(true,'floating'); configure(win);win.loadFile(path.join(__dirname,'app/index.html'));
 win.once('ready-to-show',()=>{win.show();});win.on('close',e=>{if(!quitting){e.preventDefault();app.quit();}});
 tray=new Tray(path.join(__dirname,'assets/icon.ico'));tray.setToolTip('Focus Pad v2 · 月亮陪伴');
 tray.setContextMenu(Menu.buildFromTemplate([{label:'显示 / 隐藏小组件',click:()=>win.isVisible()?win.hide():win.show()},{label:'重新查看使用引导',click:()=>{win.show();win.webContents.executeJavaScript('window.FocusPadShowGuide()');}},{label:'月亮陪伴与个性化',click:openCompanion},{label:'置顶',type:'checkbox',checked:true,click:item=>win.setAlwaysOnTop(item.checked,'floating')},{type:'separator'},{label:'打开数据文件夹',click:()=>shell.openPath(app.getPath('userData'))},{label:'退出（保存数据）',click:()=>app.quit()}]));tray.on('double-click',()=>win.show());
 if(smoke)require('./smoke-runner').run({app,win,openCompanion,getCompanion:()=>companion,store});
});
app.on('before-quit',e=>{if(quitting)return;e.preventDefault();quitting=true;Promise.allSettled(BrowserWindow.getAllWindows().map(w=>w.webContents.executeJavaScript("if(typeof pauseSession==='function'&&typeof state!=='undefined'){if(state.mode==='running')pauseSession();if(typeof saveFocusCheckpoint==='function')saveFocusCheckpoint();}"))).finally(()=>app.quit());});
app.on('window-all-closed',()=>app.quit());
}
ipcMain.on('focuspad:load-store',(e)=>{e.returnValue=store.read();});
ipcMain.on('focuspad:save-entry',(e,key,value)=>{
 try { if(typeof key!=='string'||!key.startsWith('focus-')||typeof value!=='string')throw Error('Invalid entry');store.set(key,value);e.returnValue={ok:true};for(const w of BrowserWindow.getAllWindows())if(w.webContents.id!==e.sender.id)w.webContents.send('focuspad:store-change',{key,value}); }
 catch(error){e.returnValue={ok:false,error:error.message};}
});
ipcMain.handle('focuspet:get-info',()=>({platform:process.platform,alwaysOnTop:win?.isAlwaysOnTop()}));
ipcMain.handle('focuspet:move-by',(_e,dx,dy)=>{const[x,y]=win.getPosition();win.setPosition(Math.round(x+dx),Math.round(y+dy));});
ipcMain.handle('focuspet:set-position',(_e,x,y)=>win.setPosition(Math.round(x),Math.round(y)));
ipcMain.handle('focuspet:set-always-on-top',(_e,p)=>{win.setAlwaysOnTop(Boolean(p),'floating');return win.isAlwaysOnTop();});
ipcMain.handle('focuspet:resize-window',(_e,w,h)=>{win.setContentSize(...clampWindowSize(w,h));return win.getContentSize();});
