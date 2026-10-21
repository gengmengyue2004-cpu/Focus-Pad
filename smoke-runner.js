const fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
exports.run=({app,win,openCompanion,getCompanion,store})=>{
 const output=process.env.FOCUSPAD_SMOKE_OUTPUT;
 const logs=[];win.webContents.on('console-message',(_event,...args)=>logs.push(args.map(String).join(' ')));
 win.webContents.once('did-finish-load',async()=>{try{
 const js=code=>win.webContents.executeJavaScript(code);
 if(process.argv.includes('--smoke-browser-ui')){
 await new Promise(r=>setTimeout(r,400));
 await js("closeOnboarding();document.body.classList.remove('desktop-app');state.desktopMode=false;state.compactMode=false;widget.style.zoom='1.2';setView('editor')");
 await new Promise(r=>setTimeout(r,400));
 const visible=await js("({display:getComputedStyle(document.getElementById('your-rhythm')).display,height:document.getElementById('your-rhythm').getBoundingClientRect().height,points:document.querySelectorAll('.editor-point').length})");assert.equal(visible.display,'block');assert(visible.height>100);assert.equal(visible.points,5);
 await js("state.onboardingCompleted=false;onboardingLayer.hidden=false;showOnboardingStep(2)");await new Promise(r=>setTimeout(r,700));
 const alignment=await js("(()=>{const a=document.getElementById('modeIndicator').getBoundingClientRect(),b=onboardingSpotlight.getBoundingClientRect();return {x:Math.abs(a.x+a.width/2-b.x-b.width/2),y:Math.abs(a.y+a.height/2-b.y-b.height/2),title:onboardingTitle.textContent};})()");assert(alignment.x<3&&alignment.y<3,JSON.stringify(alignment));
 const before=await js('document.body.dataset.theme');await js("document.getElementById('modeIndicator').click()");assert.notEqual(await js('document.body.dataset.theme'),before);
 fs.writeFileSync(path.join(output,'browser-ui-regression.json'),JSON.stringify({pass:true,visible,alignment,themeToggle:true},null,2));app.quit();return;
 }
 if(process.argv.includes('--smoke-new-ui')){
 await new Promise(r=>setTimeout(r,500));
 const windows=()=>require('electron').BrowserWindow.getAllWindows().length;
 assert.equal(windows(),1);
 const completed=await js('state.onboardingCompleted');
 assert.equal(await js('onboardingLayer.hidden'),completed);
 if(!completed){
 await js("document.querySelector('[data-theme-choice=night]').click()");
 await new Promise(r=>setTimeout(r,400));
 fs.writeFileSync(path.join(output,'Focus-Pad-207-guide.png'),(await win.webContents.capturePage()).toPNG());
 await js('closeOnboarding()');await new Promise(r=>setTimeout(r,300));
 }
 await js("setView('focus');curveButton.click()");
 assert.equal(await js('state.view'),'editor');assert.equal(windows(),1);
 for(const theme of ['day','night']){
 await js(`document.querySelector('[data-theme-choice=${theme}]').click()`);
 await new Promise(r=>setTimeout(r,400));
 const check=await js("(()=>{const r=document.querySelector('#your-rhythm').getBoundingClientRect();return {theme:editorView.dataset.theme,points:document.querySelectorAll('.editor-point').length,moon:!!document.querySelector('.compact-moon'),bottom:r.bottom,height:innerHeight,text:getComputedStyle(document.querySelector('.widget-editor__header strong')).color};})()");
 assert.equal(check.theme,theme);assert.equal(check.points,5);assert(check.moon);assert(check.bottom<=check.height,JSON.stringify(check));
 fs.writeFileSync(path.join(output,'Focus-Pad-207-editor-'+theme+'.png'),(await win.webContents.capturePage()).toPNG());
 }
 await js("document.querySelector('[data-preset=steady]').click();document.getElementById('energy2').value=85;document.getElementById('energy2').dispatchEvent(new Event('input'));document.getElementById('savePersonality').click()");
 assert.equal(await js('MoonCompanion.load().energy[2]'),85);
 assert.equal(await js('state.view'),'focus');
 await js("setView('editor');document.querySelector('[data-theme-choice=day]').click()");await new Promise(r=>setTimeout(r,200));
 assert.equal(await js("document.querySelector('label[for=glowRange]').textContent"),'太阳亮度');assert.equal(await js("document.querySelector('.compact-moon').dataset.icon"),'sun');
 await js("document.getElementById('glowRange').value=90;document.getElementById('glowRange').dispatchEvent(new Event('input'));document.getElementById('savePersonality').click()");assert.equal(await js('state.view'),'focus');assert.equal(await js('MoonCompanion.load().sunBrightness'),90);
 await js("setView('editor');document.getElementById('energy2').value=20;document.getElementById('energy2').dispatchEvent(new Event('input'))"); assert.equal(await js("document.getElementById('editorPath').getAttribute('d').includes(' C ')"),true);
 await js("setView('editor')");await new Promise(r=>setTimeout(r,250));fs.writeFileSync(path.join(output,'Focus-Pad-208-editor-day.png'),(await win.webContents.capturePage()).toPNG());
 await js("document.querySelector('[data-theme-choice=night]').click()");await new Promise(r=>setTimeout(r,200));assert.equal(await js("document.querySelector('label[for=glowRange]').textContent"),'月光柔和度');assert.equal(await js("document.querySelector('.compact-moon').dataset.icon"),'moon');
 await js('editorBack.click()');
 win.reload();await new Promise(r=>win.webContents.once('did-finish-load',r));await new Promise(r=>setTimeout(r,400));
 assert.equal(await js('onboardingLayer.hidden'),true);assert.equal(await js('MoonCompanion.load().energy[2]'),85);assert.equal(windows(),1);
 fs.writeFileSync(path.join(output,'new-ui-test.json'),JSON.stringify({pass:true,singleWindow:true,dayNightTheme:true,guideFirstRun:!completed,guideNotRepeated:true,customizationPersisted:true,logs},null,2));app.quit();return;
 }
 assert.equal(await js('Boolean(desktopBridge?.isWidget)'),true);
 assert.equal(await js('state.mode'),'idle');
 assert.equal(await js('state.elapsedBeforePause'),0);
 assert.equal(await js('customDurationPanel.hidden'),true);
 if(process.argv.includes('--smoke-default')) {
 assert.equal(await js('MoonCompanion.load().shape'),'arc');
 assert.equal(await js("trackPath.getAttribute('d')"),'M 24 104 A 100 100 0 0 1 216 104');
 await js("localStorage.setItem('focus-pad-theme','night');NightPreview.applyTheme();");
 await new Promise(r=>setTimeout(r,650));
 fs.writeFileSync(path.join(output,'Focus-Pad-Windows-default.png'),(await win.webContents.capturePage()).toPNG());
 fs.writeFileSync(path.join(output,'default-startup-test.json'),JSON.stringify({pass:true,inputHidden:true,defaultArc:'M 24 104 A 100 100 0 0 1 216 104'}));app.quit();return;
 }
 if(store.read()['focus-smoke-completed']){
 assert.equal(await js("state.history.find(r=>r.title==='安装包计时测试').focusDurationMs"),65000);
 assert.equal(await js("localStorage.getItem('focus-pad-theme')"),'night');
 await js("localStorage.setItem('focus-pad-theme','night');NightPreview.applyTheme();");
 await new Promise(r=>setTimeout(r,300));
 fs.writeFileSync(path.join(output,'Focus-Pad-Windows-startup.png'),(await win.webContents.capturePage()).toPNG());
 fs.writeFileSync(path.join(output,'restart-test.json'),JSON.stringify({pass:true,historyMs:65000,persistedAcrossProcessRestart:true}));app.quit();return;
 }
 await js("setExpanded(true);setView('focus');state.tasks[0].title='安装包计时测试';setSelectedDuration(30);startSession();state.runningSince=performance.now()-65000;pauseSession();");
 const elapsed=await js('state.tasks[0].sessions[0].durationMs');assert(Math.abs(elapsed-65000)<20);
 await js('resetSession();resetSession();');assert.equal(await js('state.tasks[0].sessions.length'),1);
 // Normalize deterministic test duration before checking on-disk reload.
 await js("state.tasks[0].sessions[0].durationMs=65000;completeTask(state.tasks[0].id);");
 assert.equal(await js('state.history[0].focusDurationMs'),65000);
 await win.reload();await new Promise(resolve=>win.webContents.once('did-finish-load',resolve));
 assert.equal(await js('state.history[0].focusDurationMs'),65000);
 await js("localStorage.setItem('focus-pad-theme','night');NightPreview.applyTheme();setExpanded(true);setView('focus');customDurationButton.click();");
 const bounds=await js("(()=>{const w=widget.getBoundingClientRect(),p=customDurationPanel.getBoundingClientRect(),a=document.querySelector('.actions').getBoundingClientRect();return {bottom:w.bottom,window:innerHeight,panelBottom:p.bottom,actionTop:a.top};})()");
 assert(bounds.bottom<=bounds.window,JSON.stringify(bounds));assert(bounds.panelBottom<=bounds.actionTop,JSON.stringify(bounds));
 fs.writeFileSync(path.join(output,'Focus-Pad-Windows-widget.png'),(await win.webContents.capturePage()).toPNG());
 openCompanion();const companion=getCompanion();await new Promise(resolve=>companion.webContents.once('did-finish-load',resolve));
 await companion.webContents.executeJavaScript("MoonCompanion.save({shape:'custom',energy:[10,60,90,60,10],glow:75});");
 await new Promise(resolve=>setTimeout(resolve,200));
 assert((await js("trackPath.getAttribute('d')")).includes(' C '));
 store.set('focus-smoke-completed','yes');
 fs.writeFileSync(path.join(output,'desktop-smoke-test.json'),JSON.stringify({pass:true,elapsed,duplicateSessions:false,reloadHistoryMs:65000,personalizationSync:true,bounds,logs},null,2));app.quit();
 }catch(error){fs.writeFileSync(path.join(output,'desktop-smoke-error.txt'),error.stack+'\n'+logs.join('\n'));app.exit(1);}});
};
