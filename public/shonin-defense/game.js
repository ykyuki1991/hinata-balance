import {Game,W,H,STAGES,UPGRADES,VERSION} from './engine.js?v=3.0.1';
import {Renderer} from './render.js?v=3.0.1';
import {AudioDirector} from './audio.js?v=3.0.1';
const $=id=>document.getElementById(id),canvas=$('game'),readCost=performance.now.bind(performance);
const renderer=new Renderer(canvas,matchMedia('(prefers-reduced-motion: reduce)').matches),audio=new AudioDirector();
let mode='normal',seed=Date.now()%1000000,game=new Game(seed,mode),paused=false,last=0,accumulator=0,visualTime=0,noticeLeft=0,lastPhase='ready',pointer=null;
let blockGestureClick=false;
// A finger released as a result/upgrade overlay appears must not click through
// into its buttons. A fresh press or keyboard action arms the UI immediately.
document.addEventListener('pointerdown',()=>{blockGestureClick=false;},true);
document.addEventListener('keydown',()=>{blockGestureClick=false;},true);
document.addEventListener('click',e=>{if(blockGestureClick){e.preventDefault();e.stopImmediatePropagation();blockGestureClick=false;}},true);
const keys=new Set(),frameTimes=[];let records={normal:0,hard:0,plays:0,clears:0,medals:[]};
try{const saved=JSON.parse(localStorage.getItem('shonin-defense-v3')||'null');if(saved&&typeof saved==='object'){for(const k of ['normal','hard','plays','clears'])if(Number.isFinite(saved[k]))records[k]=Math.max(0,saved[k]);if(Array.isArray(saved.medals))records.medals=saved.medals.filter(x=>typeof x==='string');}}catch{}
function save(){try{localStorage.setItem('shonin-defense-v3',JSON.stringify(records));}catch{}}
let soundWanted=false;try{soundWanted=localStorage.getItem('shonin-defense-sound')==='on';}catch{}
function soundUI(){$('sound').textContent=soundWanted?'音 ON':'音 OFF';$('sound').setAttribute('aria-pressed',String(soundWanted));$('sound').setAttribute('aria-label',soundWanted?'サウンドをオフにする':'サウンドをオンにする');}soundUI();
$('sound').onclick=async()=>{soundWanted=!soundWanted;await audio.enable(soundWanted);try{localStorage.setItem('shonin-defense-sound',soundWanted?'on':'off');}catch{}soundUI();};
const medals=[['clear','定時退勤'],['clean','無傷の勤務'],['close','即決30件'],['reflect','差戻し20発']];
function recordUI(){$('best').textContent=records[mode].toLocaleString();$('medals').replaceChildren(...medals.map(([id,name])=>{const el=document.createElement('span');el.textContent=name;el.className=records.medals.includes(id)?'earned':'';return el;}));}recordUI();
function notice(text,seconds=1.7){$('announcement').textContent=text;$('announcement').classList.add('show');noticeLeft=seconds;}
function clearInput(){keys.clear();pointer=null;renderer.joystick=null;game.move(0,0);}
function resetEffects(){renderer.particles=[];renderer.labels=[];renderer.rings=[];renderer.shake=0;renderer.flash=0;noticeLeft=0;$('announcement').classList.remove('show');clearInput();}
function start(){if(paused){resume();return;}game=new Game(seed,mode);game.start();lastPhase='playing';paused=false;accumulator=0;resetEffects();$('overlay').hidden=true;$('pause').hidden=false;$('pause').textContent='Ⅱ';audio.enable(soundWanted);updateHUD();}
$('start').onclick=start;
function home(){paused=false;seed=(seed+7919)%1000000;game=new Game(seed,mode);lastPhase='ready';resetEffects();$('overlay').className='overlay';$('overlay').hidden=false;$('splash').hidden=false;$('overlay-title').textContent='未処理は、四方から。';$('overlay-text').innerHTML='指を置いて、動かすだけ。<br>近くの申請を自動で承認。';$('modes').hidden=false;$('result').hidden=true;$('upgrades').hidden=true;$('start').hidden=false;$('home').hidden=true;$('start').innerHTML='業務開始 <span>→</span>';$('start-hint').textContent='3つの現場 · 約3分 · 指一本で移動';$('medals').hidden=false;$('best-wrap').hidden=false;$('pause').hidden=true;recordUI();updateHUD();} $('home').onclick=home;
for(const id of ['normal','hard'])$(id).onclick=()=>{mode=id;game.mode=mode;for(const x of ['normal','hard']){$(x).classList.toggle('selected',x===mode);$(x).setAttribute('aria-pressed',String(x===mode));}recordUI();};
function overlayBase(){$('overlay').className='overlay';blockGestureClick=!!pointer;clearInput();$('splash').hidden=true;$('overlay').hidden=false;$('modes').hidden=true;$('upgrades').hidden=true;$('result').hidden=true;$('medals').hidden=true;$('best-wrap').hidden=true;}
function pause(){if(paused||game.phase!=='playing')return;paused=true;overlayBase();$('overlay-title').textContent='ちょっと、ひと息。';$('overlay-text').textContent='申請も、いったん待機中。';$('start').hidden=false;$('home').hidden=false;$('start').innerHTML='業務再開 <span>→</span>';$('start-hint').textContent='同じ場所から再開します';if(audio.context?.state==='running')audio.context.suspend().catch(()=>{});}
function resume(){paused=false;last=performance.now();accumulator=0;clearInput();$('overlay').hidden=true;audio.enable(soundWanted);}
$('pause').onclick=()=>paused?resume():pause();window.addEventListener('blur',pause);document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});
function burst(){if(!paused)game.burst();}$('burst').onclick=burst;
// Floating single stick. The press establishes a neutral point: no teleporting,
// no thumb covering the ship. A second pointer can use the action button.
canvas.addEventListener('pointerdown',e=>{if(game.phase!=='playing'||paused||pointer)return;e.preventDefault();canvas.setPointerCapture(e.pointerId);pointer={id:e.pointerId,x:e.clientX,y:e.clientY};game.move(0,0);});
canvas.addEventListener('pointermove',e=>{if(!pointer||e.pointerId!==pointer.id)return;const dx=e.clientX-pointer.x,dy=e.clientY-pointer.y,len=Math.hypot(dx,dy),radius=38;if(len>radius*1.8){pointer.x=e.clientX-dx/len*radius*1.8;pointer.y=e.clientY-dy/len*radius*1.8;}const x=(e.clientX-pointer.x)/radius,y=(e.clientY-pointer.y)/radius;game.move(len<5?0:x,len<5?0:y);const box=canvas.getBoundingClientRect();renderer.joystick={x:(pointer.x-box.left)/box.width*W,y:(pointer.y-box.top)/box.height*H,dx:game.mx,dy:game.my};});
function release(e){if(pointer?.id===e.pointerId){pointer=null;renderer.joystick=null;game.move(0,0);}}canvas.addEventListener('pointerup',release);canvas.addEventListener('pointercancel',release);canvas.addEventListener('lostpointercapture',release);
window.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','a','d','w','s','A','D','W','S',' ','Escape','p','P'].includes(e.key))return;if(game.phase==='playing')e.preventDefault();if(e.key===' '&&!e.repeat)burst();else if(['Escape','p','P'].includes(e.key)&&!e.repeat){if(paused)resume();else pause();}else keys.add(e.key.toLowerCase());});window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
new ResizeObserver(()=>{renderer.resize();clearInput();}).observe($('field'));
function upgradeUI(){overlayBase();$('overlay-title').textContent=game.stage===0?'処理方法を、選ぶ。':'最後の現場へ、備える。';$('overlay-text').textContent=game.stage===0?'位置取りに合う装備をひとつ。':'素早く切り返すか、守りを厚くするか。';$('start').hidden=true;$('home').hidden=true;$('upgrades').hidden=false;$('pause').hidden=true;$('start-hint').textContent='選ぶと、そのまま次の現場へ';$('upgrades').replaceChildren(...UPGRADES[game.stage].map(u=>{const b=document.createElement('button');b.className='upgrade-card';b.innerHTML=`<span>${u.icon}</span><div><strong>${u.name}</strong><small>${u.desc}</small></div>`;b.onclick=()=>{if(game.chooseUpgrade(u.id)){$('overlay').hidden=true;$('pause').hidden=false;resetEffects();}};return b;}));}
function resultUI(){records.plays++;if(game.win)records.clears++;records[mode]=Math.max(records[mode],game.score);const earned=[];if(game.win)earned.push('clear');if(game.win&&!game.hits)earned.push('clean');if(game.closeKills>=30)earned.push('close');if(game.reflected>=20)earned.push('reflect');records.medals=[...new Set([...records.medals,...earned])];save();recordUI();overlayBase();$('overlay').className='overlay finished';const rank=!game.win?(game.stage===0?'D':'C'):game.score>=100000&&game.hits<=1?'S':game.score>=60000?'A':'B';$('overlay-title').textContent=game.win?'本日の業務、完了。':'未処理、持ち越し。';$('overlay-text').textContent=game.win?'定時を守りました。おつかれさまでした。':game.reason;$('start').hidden=false;$('home').hidden=false;$('medals').hidden=false;$('best-wrap').hidden=false;$('result').hidden=false;$('result').innerHTML=`<div class="result-rank"><small>DAILY REPORT</small>${rank}</div><div class="result-score">${game.score.toLocaleString()}</div><div class="result-detail">${game.kills} 件承認 / 即決 ${game.closeKills} 件<br>決裁印 ${game.stamps} 個 / 被弾 ${game.hits} 回 / ${Math.floor(game.t/60)}:${String(Math.floor(game.t%60)).padStart(2,'0')}</div><div class="result-route">${STAGES.map((s,i)=>`<span class="${i<game.stageScores.length?'done':''}">${i<game.stageScores.length?'✓':'—'} ${s.name}</span>`).join('')}</div>`;$('start').innerHTML='もう一度出勤 <span>↻</span>';$('start-hint').textContent=game.win?'次は、近距離承認と決裁印で上の評価へ。':'同じ配置で再挑戦。予告の横へ、切り返そう。';$('pause').hidden=true;$('announcement').classList.remove('show');$('start').focus({preventScroll:true});updateHUD();}
function updateHUD(){const info=STAGES[game.stage];document.documentElement.style.setProperty('--green',info.color);$('score').textContent=String(game.score).padStart(6,'0');$('time-label').textContent=game.segment==='boss'?'ボス締切':'現場';$('time').textContent=game.segment==='boss'?`${Math.max(0,Math.ceil(65-game.bossTime))}s`:info.time;$('lives').textContent='▰ '.repeat(Math.max(0,game.lives))+'▱ '.repeat(Math.max(0,4-game.lives));$('lives').setAttribute('aria-label',`残りライフ${game.lives}`);$('wave').textContent=`${info.name} / ${game.segment==='boss'?'決裁装置':`WAVE ${Math.max(1,game.formation)} / 4`}`;$('combo-label').textContent=game.coffee>0?'☕ 集中モード':game.combo?'連続承認 / 即決なら +50%':'決裁印を拾って強化';$('combo').innerHTML=game.combo?`${game.combo}<span> COMBO ×${game.multiplier}</span>`:'READY';$('equipment').textContent=`${{single:'承認ショット',wide:'並列承認',pierce:'直列決裁'}[game.weapon]} Lv.${game.level+1}${game.shield?' ◇':''}`;$('burst').disabled=paused||game.phase!=='playing'||game.energy<100||['intro','clear'].includes(game.segment);$('burst').classList.toggle('ready',game.energy>=100);$('burst').style.setProperty('--charge',game.energy/100);$('burst-label').textContent=game.energy>=100?'回避 ＋ 反撃 / SPACE':`再充填 ${Math.floor(game.energy)}%`;document.querySelectorAll('.stage-rail span').forEach((el,i)=>{el.classList.toggle('active',i===game.stage);el.classList.toggle('done',i<game.stage);});}
function events(){for(const e of game.events){renderer.effect(e);audio.effect(e.type);if(e.type==='boss')notice(e.hint,3.5);if(e.type==='notice')notice(e.text,2.2);if(e.type==='upgrade'&&e.text)notice(e.text);if(e.type==='item')notice('コーヒー補給。6秒の集中。');if(e.type==='damage')notice(`${e.reason} / ライフ −1`,1.1);if(e.type==='burst'&&e.cleared)notice(`差戻し → ${e.cleared} 発否認`,.8);if(e.type==='shield')notice('代理が対応しました。');}game.events=[];}
let hud=0;function frame(now){const wall=Math.min(.1,Math.max(0,(now-last)/1000||.016));last=now;const start=readCost();if(!paused){accumulator+=wall;while(accumulator>=1/120){const dt=1/120;if(!pointer)game.move(Number(keys.has('d')||keys.has('arrowright'))-Number(keys.has('a')||keys.has('arrowleft')),Number(keys.has('s')||keys.has('arrowdown'))-Number(keys.has('w')||keys.has('arrowup')));game.update(dt);audio.tick(dt,game.stage,game.segment==='boss',game.phase==='playing'&&!['clear','intro'].includes(game.segment));accumulator-=dt;}visualTime+=wall;events();noticeLeft-=wall;if(noticeLeft<=0)$('announcement').classList.remove('show');}if(game.phase!==lastPhase){lastPhase=game.phase;if(game.phase==='upgrade')upgradeUI();if(game.phase==='ended')resultUI();}renderer.draw(game,visualTime,paused?0:wall);if(now-hud>80){updateHUD();hud=now;}frameTimes.push(readCost()-start);if(frameTimes.length>300)frameTimes.shift();requestAnimationFrame(frame);}requestAnimationFrame(frame);
if(new URLSearchParams(location.search).has('qa'))window.gameSnapshot=()=>({...game.snapshot(),paused,records:JSON.parse(JSON.stringify(records)),performance:{samples:frameTimes.length,p95:[...frameTimes].sort((a,b)=>a-b)[Math.floor(frameTimes.length*.95)]||0,particles:renderer.particles.length,maxHazards:game.maxHazards},version:VERSION,world:{width:W,height:H}});
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
