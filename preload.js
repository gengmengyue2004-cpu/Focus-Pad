const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('focusPetDesktop', {
 isWidget: !process.argv.includes('--companion'),
 loadStore:()=>ipcRenderer.sendSync('focuspad:load-store'),
 saveEntry:(key,value)=>{const result=ipcRenderer.sendSync('focuspad:save-entry',key,value);if(!result.ok)throw new Error('无法保存数据：'+result.error);},
 onStoreChange:callback=>ipcRenderer.on('focuspad:store-change',(_event,data)=>callback(data)),
 getInfo:()=>ipcRenderer.invoke('focuspet:get-info'),
 moveBy:(dx,dy)=>ipcRenderer.invoke('focuspet:move-by',dx,dy),
 setPosition:(x,y)=>ipcRenderer.invoke('focuspet:set-position',x,y),
 setAlwaysOnTop:p=>ipcRenderer.invoke('focuspet:set-always-on-top',p),
 resizeWindow:(w,h)=>ipcRenderer.invoke('focuspet:resize-window',w,h),
});
