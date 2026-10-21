(()=>{
 const core=MoonCompanion,ns='http://www.w3.org/2000/svg';
 let draft=core.load(),saved=core.load(),activePoint=null;
 const status=document.getElementById('saveStatus'),editor=document.getElementById('energyEditor');
 const embedded=!!document.getElementById('editorView');
 const customButton=embedded?null:document.querySelector('[data-open-custom]');
 if(!customButton){
   window.FocusPadEditor={open(){if(typeof setView==='function')setView('editor');}};
 } else {
 function setPanel(panel){
   const custom=panel==='custom';
   document.body.dataset.panel=custom?'custom':'main';
   customButton.classList.toggle('selected',custom);
   customButton.setAttribute('aria-pressed',String(custom));
   if(custom)document.querySelectorAll('[data-theme-choice]').forEach(b=>b.classList.remove('selected'));else NightPreview.applyTheme();
   if(custom)window.scrollTo({top:0});
 }
 customButton.addEventListener('click',()=>{history.replaceState(null,'','#your-rhythm');setPanel('custom');});
 document.querySelectorAll('[data-theme-choice]').forEach(b=>b.addEventListener('click',()=>{history.replaceState(null,'',location.pathname);setPanel('main');window.scrollTo({top:0});}));
 document.querySelectorAll('a[href="#your-rhythm"]').forEach(a=>a.addEventListener('click',event=>{event.preventDefault();history.replaceState(null,'','#your-rhythm');setPanel('custom');}));
 document.querySelector('a[href="#widget"]').addEventListener('click',event=>{event.preventDefault();history.replaceState(null,'',location.pathname);setPanel('main');window.scrollTo({top:0});});
 window.addEventListener('hashchange',()=>setPanel(location.hash==='#your-rhythm'?'custom':'main'));
 setPanel(location.hash==='#your-rhythm'?'custom':'main');
 }
 const names=['开始','进入状态','中段','收尾','结束'];
 const presets={arc:core.defaults,early:{shape:'custom',energy:[65,95,65,35,10],glow:70},late:{shape:'custom',energy:[10,35,70,90,45],glow:70},steady:{shape:'custom',energy:[45,55,60,55,40],glow:70}};
 const channel=typeof BroadcastChannel!=='undefined'?new BroadcastChannel('focus-pad-moon-config'):null;
 if(document.getElementById('todayDate'))document.getElementById('todayDate').textContent=new Date().toLocaleDateString('zh-CN',{month:'long',day:'numeric'});
 const fields=document.getElementById('energyFields');
 names.forEach((name,i)=>{
   const row=document.createElement('div');row.className='energy-field';
   row.innerHTML=`<label for="energy${i}">${name}</label><input id="energy${i}" type="range" min="0" max="100" step="1"/><output id="value${i}"></output>`;
   fields.append(row);
   row.querySelector('input').addEventListener('input',event=>{draft.energy[i]=Number(event.target.value);draft.shape='custom';render(true);});
   const point=document.createElementNS(ns,'circle');point.setAttribute('class','editor-point');point.setAttribute('r','6');point.dataset.index=i;
   point.addEventListener('pointerdown',event=>{activePoint=i;event.preventDefault();editor.setPointerCapture?.(event.pointerId);});
   point.addEventListener('pointerup',()=>activePoint=null);point.addEventListener('pointercancel',()=>activePoint=null);
   document.getElementById('energyPoints').append(point);
 });
 editor.addEventListener('pointermove',event=>{if(activePoint===null)return;const ctm=editor.getScreenCTM();if(!ctm)return;const p=new DOMPoint(event.clientX,event.clientY).matrixTransform(ctm.inverse());draft.energy[activePoint]=Math.round(Math.max(0,Math.min(100,(168-p.y)/1.2)));draft.shape='custom';render(true);event.preventDefault();});
 editor.addEventListener('pointerup',()=>activePoint=null);editor.addEventListener('pointercancel',()=>activePoint=null);

 function render(dirty=false){
   const d=core.curve(draft);
   // Same SVG path as the widget, scaled into the editor plotting area.
   document.getElementById('editorPath').setAttribute('d',d);
   const transform=draft.shape==='arc'?'scale(1.75)':'translate(-12.5 0) scale(1.85417 1.5)';
   document.getElementById('editorPath').setAttribute('transform',transform);
   document.getElementById('editorArea').setAttribute('d',d+(draft.shape==='arc'?' L 208 115 L 32 115 Z':' L 216 115 L 24 115 Z'));
   document.getElementById('editorArea').setAttribute('transform',transform);
   names.forEach((_,i)=>{document.getElementById('energy'+i).value=draft.energy[i];document.getElementById('value'+i).textContent=draft.energy[i];const dot=document.querySelector(`.editor-point[data-index="${i}"]`);dot.setAttribute('cx',draft.shape==='arc'?56+i*77:32+i*89);dot.setAttribute('cy',draft.shape==='arc'?[196,62.632,42,62.632,196][i]:168-draft.energy[i]*1.2);});
   const day=embedded&&document.body.dataset.theme==='day';const value=day?draft.sunBrightness:draft.glow;document.getElementById('glowRange').value=value;document.getElementById('glowValue').textContent=value;document.querySelector('label[for=glowRange]').textContent=day?'太阳亮度':'月光柔和度';if(embedded)document.querySelector('.widget-editor__header span').textContent=day?'太阳沿着你的节奏前进':'月亮沿着你的节奏前进';
   document.querySelectorAll('[data-preset]').forEach(b=>b.classList.toggle('active',b.dataset.preset==='arc'?draft.shape==='arc':JSON.stringify(presets[b.dataset.preset].energy)===JSON.stringify(draft.energy)&&draft.shape==='custom'));
   NightPreview.applyPersonality(draft);
   if(dirty)status.textContent='预览中 · 尚未应用';
 }
 document.querySelectorAll('[data-preset]').forEach(b=>b.addEventListener('click',()=>{draft=b.dataset.preset==='steady'&&(embedded||document.body.dataset.compactEditor==='true')?core.normalize({...draft,shape:'custom'}):core.normalize({...presets[b.dataset.preset],glow:draft.glow,sunBrightness:draft.sunBrightness});render(true);}));
 document.getElementById('glowRange').addEventListener('input',e=>{draft[embedded&&document.body.dataset.theme==='day'?'sunBrightness':'glow']=Number(e.target.value);render(true);});
 document.getElementById('savePersonality').addEventListener('click',()=>{
   try{saved=core.save(draft);channel?.postMessage({type:'changed'});status.textContent='已应用 · 其他打开的小组件也会同步';if(embedded)setView('focus');}
   catch{status.textContent='无法保存，请检查浏览器存储权限。';}
 });
 document.getElementById('restorePersonality').addEventListener('click',()=>{draft=core.normalize(core.defaults);render(true);});
 window.addEventListener('storage',e=>{if(e.key===core.KEY){saved=core.load();draft=core.normalize(saved);render();status.textContent='已同步其他页面的设置';}});
 if(embedded)new MutationObserver(()=>render()).observe(document.getElementById('editorView'),{attributes:true,attributeFilter:['data-theme']});
 const slider=document.getElementById('learnPhase');if(slider){slider.value=Math.round(NightPreview.currentPhase()*100);
 document.getElementById('phaseSelect').value='today';
 document.getElementById('phaseSelect').dispatchEvent(new Event('change'));
 function learn(){const p=Number(slider.value)/100,angle=Math.PI-p*Math.PI*2;document.getElementById('orbitMoon').setAttribute('transform',`translate(${193+82*Math.cos(angle)},${135+82*Math.sin(angle)})`);document.getElementById('learnPhaseTitle').textContent=`${NightPreview.phaseName(p)} · 约 ${Math.round((1-Math.cos(p*Math.PI*2))/2*100)}% 的可见月面被照亮`;}
 slider.addEventListener('input',learn);learn();}render();
})();


