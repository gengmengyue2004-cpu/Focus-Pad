(() => {
  const ns='http://www.w3.org/2000/svg';
  const svg=document.querySelector('.curve');
  const defs=svg.querySelector('defs');
  defs.insertAdjacentHTML('beforeend','<radialGradient id="moonLight" cx="65%" cy="30%" r="90%"><stop offset="0" stop-color="#ffffff"/><stop offset=".65" stop-color="#edf0ff"/><stop offset="1" stop-color="#c7c7eb"/></radialGradient>');
  const marker=document.createElementNS(ns,'g');
  marker.setAttribute('class','moon-marker');
  marker.innerHTML='<circle class="moon-shadow" r="14"/><path class="moon-lit"/>';
  svg.append(marker);
  defs.insertAdjacentHTML('beforeend','<radialGradient id="sunGold" cx="27%" cy="24%" r="90%"><stop offset="0" stop-color="#ffdc65"/><stop offset=".4" stop-color="#f7bd30"/><stop offset=".72" stop-color="#ed7914"/><stop offset="1" stop-color="#b84a08"/></radialGradient><radialGradient id="sunRed" cx="96%" cy="14%" r="76%"><stop offset="0" stop-color="#ff1d0b"/><stop offset=".26" stop-color="#ff3108" stop-opacity=".98"/><stop offset=".66" stop-color="#ff5c00" stop-opacity=".25"/><stop offset="1" stop-color="#ff5c00" stop-opacity="0"/></radialGradient>');
  const sun=document.createElementNS(ns,'g');
  sun.setAttribute('class','sun-marker');
  sun.setAttribute('aria-label','太阳');
  sun.innerHTML='<circle r="14" fill="url(#sunGold)"/><circle r="14" fill="url(#sunRed)"/>';
  svg.append(sun);
  const themeToggle=document.getElementById('modeIndicator');
  const focusToggle=document.getElementById('focusModeButton');
  function updateFocusLabel() {focusToggle.textContent=widget.dataset.focusMode==='free'?'自由专注 · 切换任务':'任务专注 · 切换自由';}
  new MutationObserver(updateFocusLabel).observe(widget,{attributes:true,attributeFilter:['data-focus-mode']});
  updateFocusLabel();
  const phaseSelect=document.getElementById('phaseSelect');
  const description=document.getElementById('phaseDescription');
  let themeChoice='night';
  const period=29.530588853;
  // Approximate mean lunar phase; a visual indicator, not an ephemeris.
  function currentPhase(date=new Date()) {
    const age=(date.getTime()-Date.UTC(2000,0,6,18,14))/86400000;
    return ((age%period)+period)%period/period;
  }
  function phaseName(p) { return ['新月','娥眉月','上弦月','盈凸月','满月','亏凸月','下弦月','残月'][Math.round(p*8)%8]; }
  function paintMoon() {
    const p=phaseSelect.value==='today'?currentPhase():Number(phaseSelect.value);
    const k=Math.cos(p*Math.PI*2),r=14, points=[];
    for(let i=0;i<=64;i++) {const y=-r+2*r*i/64;const x=Math.sqrt(Math.max(0,r*r-y*y));points.push([p<=.5?x:-x,y]);}
    for(let i=64;i>=0;i--) {const y=-r+2*r*i/64;const x=Math.sqrt(Math.max(0,r*r-y*y));points.push([p<=.5?k*x:-k*x,y]);}
    marker.querySelector('path').setAttribute('d',points.map((pt,i)=>(i?'L':'M')+pt.map(v=>v.toFixed(3)).join(',')).join(' ')+' Z');
    marker.setAttribute('aria-label',phaseName(p));
    description.textContent=`${phaseName(p)} · ${Math.round((1-k)/2*100)}% 亮面`;
  }
  const point=document.getElementById('currentPoint');
  function applyPersonality(config) {
    const d=MoonCompanion.curve(config);
    document.querySelectorAll('.curve__track,.curve__fill,.curve__pulse').forEach(path=>path.setAttribute('d',d));
    state.trackLength=trackPath.getTotalLength();
    renderCurve(liveElapsedMs()/durationMs());
    marker.style.setProperty('--moon-strength',MoonCompanion.normalize(config).glow/100);
  }
  window.addEventListener('storage',event=>{if(event.key===MoonCompanion.KEY)applyPersonality(MoonCompanion.load());});
  const configChannel=typeof BroadcastChannel!=='undefined'?new BroadcastChannel('focus-pad-onboarding-demo-config'):null;
  if(configChannel)configChannel.onmessage=()=>applyPersonality(MoonCompanion.load());
  function followPoint() {
    const position=`translate(${point.getAttribute('cx')},${point.getAttribute('cy')})`;
    marker.setAttribute('transform',position+' rotate(-18)');
    sun.setAttribute('transform',position);
  }
  new MutationObserver(followPoint).observe(point,{attributes:true,attributeFilter:['cx','cy']});
  function applyTheme(date=new Date()) {
    const h=date.getHours();
    document.body.dataset.theme=themeChoice==='auto'?(h>=21||h<6?'night':'day'):themeChoice;
    const minutes=h*60+date.getMinutes();
    const nightStrength=minutes>=1260?(minutes-1260)/180:minutes<180?1:minutes<360?1-(minutes-180)/180:0;
    document.body.style.setProperty('--sky-glow',String(document.body.dataset.theme==='night'?.55+.4*nightStrength:0));
    const isNight=document.body.dataset.theme==='night';
    const entry=document.querySelector('.moon-entry');
    if(entry && entry.dataset.iconTheme!==document.body.dataset.theme) {
      entry.dataset.iconTheme=document.body.dataset.theme;
      entry.querySelector('svg').innerHTML=isNight
        ? '<path d="M19 15A8 8 0 0 1 9 5a8 8 0 1 0 10 10Z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/>'
        : '<g fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.4 1.4m11.2 11.2L19 19M5 19l1.4-1.4M17.6 6.4L19 5"/></g>';
      entry.title=isNight?'月亮陪伴与个性化':'日间陪伴与个性化';
      entry.setAttribute('aria-label',isNight?'打开月亮陪伴网页':'打开日间陪伴网页');
    }
    themeToggle.setAttribute('aria-label',isNight?'切换到日间模式':'切换到夜间模式');
    themeToggle.setAttribute('title',isNight?'切换到日间模式':'切换到夜间模式');
    document.querySelectorAll('[data-theme-choice]').forEach(b=>b.classList.toggle('selected',document.body.dataset.panel!=='custom'&&b.dataset.themeChoice===themeChoice));
    document.getElementById('scheduleLabel').textContent=themeChoice==='auto'?'当前跟随本机时间 · 21:00 — 06:00 自动入夜':'21:00 — 06:00 自动入夜 · 点击时间展开完整功能';
  }
  document.querySelectorAll('[data-theme-choice]').forEach(b=>b.addEventListener('click',()=>{themeChoice=b.dataset.themeChoice;applyTheme();}));
  themeToggle.addEventListener('click',event=>{
    event.stopPropagation();
    themeChoice=document.body.dataset.theme==='night'?'day':'night';
    applyTheme();
  });
  phaseSelect.addEventListener('change',paintMoon);
  setInterval(()=>{applyTheme();if(phaseSelect.value==='today')paintMoon();},15000);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden){applyTheme();paintMoon();}});
  // Start the preview halfway through a paused session, matching the supplied layout.
  state.expanded=false;
  state.selectedMinutes=30;
  state.elapsedBeforePause=15*60000;
  state.remainingMs=15*60000;
  state.mode='paused';
  setMode('paused');
  renderCurve(state.elapsedBeforePause/durationMs());
  timeLabel.textContent=formatTime(state.remainingMs);
  renderAll();
  applyPersonality(MoonCompanion.load());
  followPoint();paintMoon();applyTheme();
  window.NightPreview={currentPhase,applyTheme,phaseName,applyPersonality};
})();
