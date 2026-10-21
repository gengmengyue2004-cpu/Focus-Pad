(function(root) {
  const KEY='focus-pad-onboarding-demo-personality';
  const defaults={version:1,shape:'arc',energy:[9,88,100,88,9],glow:70};
  function normalize(value) {
    const v=value&&typeof value==='object'?value:{};
    return {version:1,shape:v.shape==='custom'?'custom':'arc',energy:Array.isArray(v.energy)&&v.energy.length===5?v.energy.map((n,i)=>Number.isFinite(Number(n))?Math.max(0,Math.min(100,Number(n))):defaults.energy[i]):[...defaults.energy],glow:Number.isFinite(Number(v.glow))?Math.max(0,Math.min(100,Number(v.glow))):70};
  }
  function load(){try{return normalize(JSON.parse(localStorage.getItem(KEY)));}catch{return normalize(defaults);}}
  function save(value){const v=normalize(value);localStorage.setItem(KEY,JSON.stringify(v));return v;}
  // Natural cubic spline: C2 continuity at every interior knot.
  function curve(value){
    const v=normalize(value);
    if(v.shape==='arc') return 'M 24 104 A 100 100 0 0 1 216 104';
    const ys=v.energy.map(n=>112-n*.8),xs=[24,72,120,168,216],h=48;
    const diagonal=[4,4,4],rhs=[1,2,3].map(i=>6*(ys[i+1]-2*ys[i]+ys[i-1])/(h*h));
    for(let i=1;i<3;i++){const factor=1/diagonal[i-1];diagonal[i]-=factor;rhs[i]-=factor*rhs[i-1];}
    const second=[0,0,0,0,0];
    for(let i=2;i>=0;i--)second[i+1]=(rhs[i]-(i<2?second[i+2]:0))/diagonal[i];
    let d='M '+xs[0]+' '+ys[0];
    for(let i=0;i<4;i++){
      const slope=(ys[i+1]-ys[i])/h;
      const left=slope-h*(2*second[i]+second[i+1])/6;
      const right=slope+h*(second[i]+2*second[i+1])/6;
      d+=' C '+(xs[i]+h/3)+' '+(ys[i]+left*h/3)+', '+(xs[i+1]-h/3)+' '+(ys[i+1]-right*h/3)+', '+xs[i+1]+' '+ys[i+1];
    }
    return d;
  }
  const api={KEY,defaults,normalize,load,save,curve};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  else root.MoonCompanion=api;
})(typeof window!=='undefined'?window:globalThis);

