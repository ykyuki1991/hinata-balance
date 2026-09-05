import {Game,H,VERSION} from './engine.js?v=4.0.0';
import {Renderer} from './render.js?v=4.0.0';
import {AudioDirector} from './audio.js?v=4.0.0';
const $=id=>document.getElementById(id),canvas=$('game'),readCost=performance.now.bind(performance);
const renderer=new Renderer(canvas,matchMedia('(prefers-reduced-motion: reduce)').matches),audio=new AudioDirector();
const width=()=>Math.max(280,Math.min(1200,canvas.clientWidth/canvas.clientHeight*H));
let seed=Date.now()%1000000,mode='normal',game=new Game(seed,mode,width()),paused=false,pointer=null,blockGestureClick=false,last=0,accumulator=0,visualTime=0,lastPhase='ready';
const keys=new Set(),frameTimes=[];let records={normal:0,hard:0,clears:0,plays:0};
try{const saved=JSON.parse(localStorage.getItem('shonin-defense-v4')||'null');for(const k of Object.keys(records))if(Number.isFinite(saved?.[k]))records[k]=Math.max(0,saved[k]);}catch{}
let soundWanted=false;try{soundWanted=localStorage.getItem('shonin-defense-sound')==='on';}catch{}
function soundUI(){$('sound').textContent=soundWanted?'♫':'♪';$('sound').setAttribute('aria-pressed',String(soundWanted));$('sound').setAttribute('aria-label',soundWanted?'サウンドをオフにする':'サウンドをオンにする');}soundUI();
$('sound').onclick=async()=>{soundWanted=!soundWanted;await audio.enable(soundWanted);try{localStorage.setItem('shonin-defense-sound',soundWanted?'on':'off');}catch{}soundUI();};
function clearInput(){pointer=null;keys.clear();renderer.joystick=null;game.move(0,0);}
function overlayBase(){blockGestureClick=!!pointer;clearInput();$('overlay').hidden=false;$('mark').hidden=true;$('modes').hidden=true;$('credit').hidden=true;$('result').hidden=true;$('home').hidden=false;$('eyebrow').textContent='FLOW BREAKER';}
// A released playing gesture must never activate a newly appeared overlay.
document.addEventListener('pointerdown',()=>{blockGestureClick=false;},true);document.addEventListener('keydown',()=>{blockGestureClick=false;},true);document.addEventListener('click',e=>{if(blockGestureClick){e.preventDefault();e.stopImmediatePropagation();blockGestureClick=false;}},true);
function hud(){$('lives').textContent='▰'.repeat(Math.max(0,game.lives))+'▱'.repeat(4-Math.max(0,game.lives));$('lives').setAttribute('aria-label',`残りライフ${game.lives}`);$('score').textContent=String(game.score).padStart(6,'0');$('burst').hidden=game.phase!=='playing'||paused;$('burst').disabled=game.energy<100||game.segment==='intro'||game.segment==='clear';$('burst').classList.toggle('ready',game.energy>=100);$('burst').style.setProperty('--energy',game.energy/100);$('best').textContent=records[mode].toLocaleString();}
function start(){if(paused){resume();return;}game=new Game(seed,mode,width());game.start();clearInput();renderer.particles=[];renderer.rings=[];renderer.stamps=[];paused=false;lastPhase='playing';accumulator=0;$('overlay').hidden=true;$('pause').hidden=false;audio.enable(soundWanted);hud();}
$('start').onclick=start;
function home(){paused=false;seed=(seed+7919)%1000000;game=new Game(seed,mode,width());lastPhase='ready';clearInput();$('overlay').className='';$('overlay').hidden=false;$('mark').hidden=false;$('modes').hidden=false;$('credit').hidden=false;$('result').hidden=true;$('home').hidden=true;$('pause').hidden=true;$('title').textContent='承認防衛線';$('subtitle').textContent='未処理、接近中。';$('eyebrow').textContent='FLOW BREAKER';$('start').innerHTML='業務開始 <span>→</span>';$('hint').textContent=matchMedia('(pointer:coarse)').matches?'ドラッグで移動 · 射撃は自動':'矢印 / WASD / ドラッグ · SPACEで一括承認';hud();}
$('home').onclick=home;
for(const id of ['normal','hard'])$(id).onclick=()=>{mode=id;for(const x of ['normal','hard']){$(x).classList.toggle('selected',x===mode);$(x).setAttribute('aria-pressed',String(x===mode));}hud();};
function pause(){if(paused||game.phase!=='playing')return;paused=true;overlayBase();$('title').textContent='ひと息。';$('subtitle').textContent='';$('hint').textContent='';$('start').innerHTML='再開 <span>→</span>';if(audio.context?.state==='running')audio.context.suspend().catch(()=>{});hud();}
function resume(){paused=false;accumulator=0;last=performance.now();clearInput();$('overlay').hidden=true;audio.enable(soundWanted);hud();}
$('pause').onclick=()=>paused?resume():pause();window.addEventListener('blur',pause);document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});
function fireBurst(){if(!paused)game.burst();}
$('burst').addEventListener('pointerdown',e=>{e.preventDefault();fireBurst();});$('burst').onclick=fireBurst;
canvas.addEventListener('pointerdown',e=>{if(game.phase!=='playing'||paused||pointer)return;e.preventDefault();canvas.setPointerCapture(e.pointerId);pointer={id:e.pointerId,x:e.clientX,y:e.clientY};game.move(0,0);});
canvas.addEventListener('pointermove',e=>{if(!pointer||e.pointerId!==pointer.id)return;const dx=e.clientX-pointer.x,dy=e.clientY-pointer.y,l=Math.hypot(dx,dy);if(l>68){pointer.x=e.clientX-dx/l*68;pointer.y=e.clientY-dy/l*68;}game.move(l<4?0:(e.clientX-pointer.x)/38,l<4?0:(e.clientY-pointer.y)/38);const b=canvas.getBoundingClientRect();renderer.joystick={x:(pointer.x-b.left)/b.width*game.width,y:(pointer.y-b.top)/b.height*H,dx:game.mx,dy:game.my};});
function release(e){if(pointer?.id===e.pointerId)clearInput();}canvas.addEventListener('pointerup',release);canvas.addEventListener('pointercancel',release);canvas.addEventListener('lostpointercapture',release);
window.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','a','d','w','s','A','D','W','S',' ','Escape','p','P'].includes(e.key))return;if(game.phase==='playing')e.preventDefault();if(e.key===' '&&!e.repeat&&!paused)game.burst();else if(['Escape','p','P'].includes(e.key)&&!e.repeat){if(paused)resume();else pause();}else keys.add(e.key.toLowerCase());});window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
new ResizeObserver(()=>{renderer.resize();game.resize(width());clearInput();}).observe($('field'));
function result(){records.plays++;records.clears+=Number(game.win);records[mode]=Math.max(records[mode],game.score);try{localStorage.setItem('shonin-defense-v4',JSON.stringify(records));}catch{}overlayBase();$('overlay').className='finished';$('title').textContent=game.win?'本日の業務、完了。':'未処理、持ち越し。';$('subtitle').textContent=game.win?'おつかれさまでした。':game.reason;$('eyebrow').textContent='DAILY REPORT';const rank=game.win?(game.hits<=1&&game.score>90000?'S':game.score>60000?'A':'B'):'C';$('result').hidden=false;$('result').innerHTML=`<div class="result-rank">${rank}</div><div class="result-score">${game.score.toLocaleString()}</div><div class="result-detail">${game.kills} 件承認 · 連続 ${game.maxCombo} · ${Math.floor(game.t)} 秒</div><div class="route">${[0,1,2].map(i=>i<game.stageScores.length?'✓':'○').join(' → ')}</div>`;$('start').innerHTML='もう一度出勤 <span>↻</span>';$('hint').textContent='';$('pause').hidden=true;hud();}
let hudTime=0;function frame(now){const wall=Math.min(.1,Math.max(0,(now-last)/1000||.016));last=now;const cost=readCost();if(!paused){accumulator+=wall;while(accumulator>=1/120){if(!pointer)game.move(Number(keys.has('d')||keys.has('arrowright'))-Number(keys.has('a')||keys.has('arrowleft')),Number(keys.has('s')||keys.has('arrowdown'))-Number(keys.has('w')||keys.has('arrowup')));game.update(1/120);audio.tick(1/120,game.stage,game.segment==='boss',game.phase==='playing'&&game.segment!=='intro'&&game.segment!=='clear');accumulator-=1/120;}visualTime+=wall;for(const e of game.events){renderer.effect(e);audio.effect(e.type);}game.events=[];}if(game.phase!==lastPhase){lastPhase=game.phase;if(game.phase==='ended')result();}renderer.draw(game,visualTime,paused?0:wall);if(now-hudTime>80){hud();hudTime=now;}frameTimes.push(readCost()-cost);if(frameTimes.length>300)frameTimes.shift();requestAnimationFrame(frame);}home();requestAnimationFrame(frame);
if(new URLSearchParams(location.search).has('qa'))window.gameSnapshot=()=>({...game.snapshot(),paused,records:JSON.parse(JSON.stringify(records)),version:VERSION,world:{width:game.width,height:H},performance:{samples:frameTimes.length,p95:[...frameTimes].sort((a,b)=>a-b)[Math.floor(frameTimes.length*.95)]||0,particles:renderer.particles.length}});

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
