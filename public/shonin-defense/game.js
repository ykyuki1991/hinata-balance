import {Game,H,VERSION} from './engine.js?v=6.1.0';
import {Renderer} from './render.js?v=6.1.0';
import {AudioDirector} from './audio.js?v=6.1.0';
const $=id=>document.getElementById(id),canvas=$('game'),renderer=new Renderer(canvas,matchMedia('(prefers-reduced-motion:reduce)').matches),audio=new AudioDirector();
const width=()=>Math.max(280,Math.min(1100,canvas.clientWidth/canvas.clientHeight*H));
let seed=44677,mode='normal',game=new Game(seed,mode,width()),paused=false,last=0,accumulator=0,visualTime=0,lastPhase='ready',pointer=null,blockGestureClick=false;
const keys=new Set(),frameTimes=[],readCost=performance.now.bind(performance),records={normal:0,hard:0,plays:0,clears:0};
try{const saved=JSON.parse(localStorage.getItem('shonin-defense-v61')||'null');for(const k of Object.keys(records))if(Number.isFinite(saved?.[k]))records[k]=Math.max(0,saved[k]);}catch{}
let soundWanted=false;try{soundWanted=localStorage.getItem('shonin-defense-sound')==='on';}catch{}
function soundUI(){$('sound').textContent=soundWanted?'♫':'♪';$('sound').setAttribute('aria-pressed',String(soundWanted));$('sound').setAttribute('aria-label',soundWanted?'サウンドをオフにする':'サウンドをオンにする');}soundUI();
$('sound').onclick=async()=>{soundWanted=!soundWanted;await audio.enable(soundWanted);try{localStorage.setItem('shonin-defense-sound',soundWanted?'on':'off');}catch{}soundUI();};
function clearInput(){pointer=null;keys.clear();game.release();}
function overlayBase(){blockGestureClick=!!pointer;clearInput();$('overlay').hidden=false;$('mark').hidden=true;$('modes').hidden=true;$('credit').hidden=true;$('result').hidden=true;$('home').hidden=false;$('eyebrow').textContent='';}
document.addEventListener('pointerdown',()=>{blockGestureClick=false;},true);document.addEventListener('keydown',()=>{blockGestureClick=false;},true);document.addEventListener('click',e=>{if(blockGestureClick){e.preventDefault();e.stopImmediatePropagation();blockGestureClick=false;}},true);
function hud(){$('lives').textContent='▰'.repeat(Math.max(0,game.lives))+'▱'.repeat(5-Math.max(0,game.lives));$('lives').setAttribute('aria-label',`残りライフ${game.lives}`);$('score').textContent=String(game.score).padStart(6,'0');$('actions').hidden=game.phase!=='playing'||paused;const held=!!game.held;$('guard').disabled=!held&&(game.holdCooldown>0||!game.enemies.some(e=>e.id===game.targetId));$('guard').querySelector('b').textContent=held?'↩':'Ⅱ';$('guard').querySelector('span').textContent=held?'再開':'保留';$('guard').style.setProperty('--cooldown',game.holdCooldown/8);$('best').textContent=records[mode].toLocaleString();}
function start(){if(paused){resume();return;}game=new Game(seed,mode,width());game.start();clearInput();renderer.particles=[];renderer.rings=[];renderer.stamps=[];paused=false;lastPhase='playing';accumulator=0;$('overlay').hidden=true;$('pause').hidden=false;audio.enable(soundWanted);hud();}
$('start').onclick=start;
function home(){paused=false;seed=(seed+7919)%1000000;game=new Game(seed,mode,width());lastPhase='ready';clearInput();$('overlay').className='';$('overlay').hidden=false;$('mark').hidden=false;$('modes').hidden=false;$('credit').hidden=false;$('result').hidden=true;$('home').hidden=true;$('pause').hidden=true;$('title').textContent='承認防衛線';$('subtitle').textContent='未処理、接近中。';$('eyebrow').textContent='';$('start').innerHTML='業務開始 <span>→</span>';$('hint').textContent=matchMedia('(pointer:coarse)').matches?'指で動かす。射撃はおまかせ。':'ドラッグ / WASDで移動。射撃は自動。';hud();}
$('home').onclick=home;
for(const id of ['normal','hard'])$(id).onclick=()=>{mode=id;for(const x of ['normal','hard']){$(x).classList.toggle('selected',x===mode);$(x).setAttribute('aria-pressed',String(x===mode));}hud();};
function pause(){if(paused||game.phase!=='playing')return;paused=true;overlayBase();$('title').textContent='ひと息。';$('subtitle').textContent='';$('hint').textContent='';$('start').innerHTML='再開 <span>→</span>';if(audio.context?.state==='running')audio.context.suspend().catch(()=>{});hud();}
function resume(){paused=false;accumulator=0;last=performance.now();clearInput();$('overlay').hidden=true;audio.enable(soundWanted);hud();}
$('pause').onclick=()=>paused?resume():pause();window.addEventListener('blur',pause);document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});
$('guard').onclick=()=>{if(!paused)game.hold();};
function world(e){const b=canvas.getBoundingClientRect();return{x:(e.clientX-b.left)/b.width*game.width,y:(e.clientY-b.top)/b.height*H};}
canvas.addEventListener('pointerdown',e=>{if(game.phase!=='playing'||paused||pointer)return;e.preventDefault();canvas.setPointerCapture(e.pointerId);pointer={id:e.pointerId,x:e.clientX,y:e.clientY,startX:e.clientX,startY:e.clientY,time:performance.now(),moved:false};});
canvas.addEventListener('pointermove',e=>{if(!pointer||pointer.id!==e.pointerId)return;const b=canvas.getBoundingClientRect(),dx=e.clientX-pointer.x,dy=e.clientY-pointer.y;pointer.moved||=Math.hypot(e.clientX-pointer.startX,e.clientY-pointer.startY)>7;game.drag(dx/b.width*game.width*1.25,dy/b.height*H*1.25);pointer.x=e.clientX;pointer.y=e.clientY;});
function release(e){if(pointer?.id!==e.pointerId)return;if(e.type==='pointerup'&&!pointer.moved&&performance.now()-pointer.time<300){const p=world(e);game.select(p.x,p.y);}clearInput();}
canvas.addEventListener('pointerup',release);canvas.addEventListener('pointercancel',release);canvas.addEventListener('lostpointercapture',release);
window.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','a','d','w','s','A','D','W','S',' ','Escape','p','P'].includes(e.key))return;if(game.phase==='playing')e.preventDefault();if(e.key===' '&&!e.repeat&&!paused)game.hold();else if(['Escape','p','P'].includes(e.key)&&!e.repeat){if(paused)resume();else pause();}else keys.add(e.key.toLowerCase());});window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
new ResizeObserver(()=>{renderer.resize();game.resize(width());clearInput();}).observe($('field'));
function result(){records.plays++;records.clears+=Number(game.win);records[mode]=Math.max(records[mode],game.score);try{localStorage.setItem('shonin-defense-v61',JSON.stringify(records));}catch{}overlayBase();$('overlay').className='finished';$('title').textContent=game.win?'本日の業務、完了。':'未処理、持ち越し。';$('subtitle').textContent=game.win?'次の仕事へ、届きました。':game.reason;$('eyebrow').textContent='DAILY REPORT';const rank=game.win?(game.hits<=1&&game.score>(mode==='hard'?130000:115000)?'S':game.score>90000?'A':'B'):'C';$('result').hidden=false;$('result').innerHTML=`<div class="result-rank">${rank}</div><div class="result-score">${game.score.toLocaleString()}</div><div class="result-detail">${game.delivered} 件引渡し · ${Math.floor(game.t)} 秒</div><div class="route">${[0,1,2].map(i=>i<game.stageScores.length?'✓':'○').join(' → ')}</div>`;$('start').innerHTML='もう一度 <span>↻</span>';$('hint').textContent='';$('pause').hidden=true;hud();}
let hudTime=0;function frame(now){const wall=Math.min(.1,Math.max(0,(now-last)/1000||.016));last=now;const cost=readCost();if(!paused){accumulator+=wall;while(accumulator>=1/120){if(!pointer)game.move(Number(keys.has('d')||keys.has('arrowright'))-Number(keys.has('a')||keys.has('arrowleft')),Number(keys.has('s')||keys.has('arrowdown'))-Number(keys.has('w')||keys.has('arrowup')));game.update(1/120);audio.tick(1/120,game.stage,game.segment==='boss',game.phase==='playing'&&!['intro','clear'].includes(game.segment));accumulator-=1/120;}visualTime+=wall;for(const e of game.events){renderer.effect(e);audio.effect(e.type);}game.events=[];}if(game.phase!==lastPhase){lastPhase=game.phase;if(game.phase==='ended')result();}renderer.draw(game,visualTime,paused?0:wall);if(now-hudTime>80){hud();hudTime=now;}frameTimes.push(readCost()-cost);if(frameTimes.length>300)frameTimes.shift();requestAnimationFrame(frame);}home();requestAnimationFrame(frame);
if(new URLSearchParams(location.search).has('qa'))window.gameSnapshot=()=>({...game.snapshot(),paused,records:{...records},version:VERSION,world:{width:game.width,height:H},performance:{samples:frameTimes.length,p95:[...frameTimes].sort((a,b)=>a-b)[Math.floor(frameTimes.length*.95)]||0,particles:renderer.particles.length}});

// Refresh an inherited site worker without reloading an active game. The game
// itself is not precached by the parent PWA, so future releases stay reachable.
if('serviceWorker' in navigator){
  navigator.serviceWorker.getRegistration().then(async registration=>{
    if(!registration)return;
    const activate=()=>registration.waiting?.postMessage({type:'SKIP_WAITING'});
    const observe=()=>{const worker=registration.installing;if(worker)worker.addEventListener('statechange',()=>{if(worker.state==='installed')activate();});};
    registration.addEventListener('updatefound',observe);observe();
    await registration.update();activate();
  }).catch(()=>{});
}
// A versioned handoff escapes a previously cached index once, then keeps the
// original public URL. Other parameters (including read-only QA) are preserved.
const address=new URL(location.href);
if(address.searchParams.get('v')===VERSION){
  const freshEntry=async()=>{
    try{
      const response=await fetch(address.pathname,{cache:'reload'});
      if(!response.ok||!(await response.text()).includes(`v${VERSION}`))return;
      address.searchParams.delete('v');
      history.replaceState(null,'',address.pathname+address.search+address.hash);
    }catch{}
  };
  // Also refresh the browser's HTTP cache, after any old precache worker retires.
  navigator.serviceWorker?.addEventListener('controllerchange',freshEntry,{once:true});
  freshEntry();
}
