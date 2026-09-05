import {Game,W,H,STAGES,UPGRADES,VERSION} from './engine.js?v=2.0.1';
import {Renderer} from './render.js?v=2.0.1';
import {AudioDirector} from './audio.js?v=2.0.1';
const $=id=>document.getElementById(id);
const canvas=$('game');
const readCost=performance.now.bind(performance);
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const renderer=new Renderer(canvas,reduced),audio=new AudioDirector();
let mode='normal',seed=Date.now()%1000000,game=new Game(seed,mode),paused=false,last=0,accumulator=0,visualTime=0,noticeLeft=0,lastPhase='ready';
const keys=new Set(),frameTimes=[];
let records={normal:0,hard:0,plays:0,clears:0,medals:[]};
try{const saved=JSON.parse(localStorage.getItem('shonin-defense-v2')||'null');if(saved&&typeof saved==='object'){for(const k of ['normal','hard','plays','clears'])if(Number.isFinite(saved[k]))records[k]=Math.max(0,saved[k]);if(Array.isArray(saved.medals))records.medals=saved.medals.filter(x=>typeof x==='string');}}catch{}
function save(){try{localStorage.setItem('shonin-defense-v2',JSON.stringify(records));}catch{}}
let soundWanted=false;try{soundWanted=localStorage.getItem('shonin-defense-sound')==='on';}catch{}
function soundUI(){$('sound').textContent=soundWanted?'音 ON':'音 OFF';$('sound').setAttribute('aria-pressed',String(soundWanted));$('sound').setAttribute('aria-label',soundWanted?'サウンドをオフにする':'サウンドをオンにする');}
soundUI();
$('sound').onclick=async()=>{soundWanted=!soundWanted;await audio.enable(soundWanted);try{localStorage.setItem('shonin-defense-sound',soundWanted?'on':'off');}catch{}soundUI();audio.effect('item');};
const medals=[['clear','定時退勤'],['clean','無傷の勤務'],['combo','40連続承認'],['perfect','全件承認 ×8'],['hard','繁忙日突破']];
function recordUI(){$('best').textContent=records[mode].toLocaleString();$('medals').replaceChildren(...medals.map(([id,name])=>{const el=document.createElement('span');el.textContent=name;el.className=records.medals.includes(id)?'earned':'';el.title=records.medals.includes(id)?'達成済み':'未達成';return el;}));}
recordUI();
function notice(text,seconds=1.7){$('announcement').textContent=text;$('announcement').classList.add('show');noticeLeft=seconds;}
function resetEffects(){renderer.particles=[];renderer.labels=[];renderer.rings=[];renderer.shake=0;renderer.flash=0;noticeLeft=0;$('announcement').classList.remove('show');}
function start(){
  if(paused){resume();return;}
  game=new Game(seed,mode);game.start();paused=false;lastPhase='playing';keys.clear();accumulator=0;resetEffects();$('overlay').hidden=true;$('pause').hidden=false;$('pause').textContent='Ⅱ';$('pause').setAttribute('aria-label','一時停止');audio.enable(soundWanted);updateHUD();
}
$('start').onclick=start;
function home(){paused=false;seed=(seed+7919)%1000000;game=new Game(seed,mode);lastPhase='ready';keys.clear();resetEffects();$('overlay').className='overlay';$('overlay').hidden=false;$('splash').hidden=false;$('overlay-title').textContent='今日の定時を、守りきれ。';$('overlay-text').innerHTML='指で動かす。射撃は自動。<br>3つの現場を突破する、お仕事シューティング。';$('modes').hidden=false;$('result').hidden=true;$('upgrades').hidden=true;$('start').hidden=false;$('home').hidden=true;$('start').innerHTML='業務開始 <span>→</span>';$('start-hint').textContent='スライドで移動 · 弾は機体中央で避ける';$('medals').hidden=false;$('best-wrap').hidden=false;$('pause').hidden=true;recordUI();updateHUD();}
$('home').onclick=home;
for(const id of ['normal','hard'])$(id).onclick=()=>{mode=id;game.mode=mode;for(const x of ['normal','hard']){$(x).classList.toggle('selected',x===mode);$(x).setAttribute('aria-pressed',String(x===mode));}recordUI();};
function pause(){if(paused||game.phase!=='playing')return;paused=true;keys.clear();$('overlay').className='overlay pausing';$('overlay').hidden=false;$('overlay-title').textContent='ちょっと、ひと息。';$('overlay-text').textContent='申請も、いったん待機中。';$('modes').hidden=true;$('upgrades').hidden=true;$('result').hidden=true;$('medals').hidden=true;$('best-wrap').hidden=true;$('start').hidden=false;$('home').hidden=false;$('start').innerHTML='業務再開 <span>→</span>';$('start-hint').textContent='同じ場所から再開します';$('pause').textContent='▶';$('pause').setAttribute('aria-label','再開');if(audio.context?.state==='running')audio.context.suspend().catch(()=>{});updateHUD();}
function resume(){paused=false;last=performance.now();accumulator=0;$('overlay').hidden=true;$('pause').textContent='Ⅱ';$('pause').setAttribute('aria-label','一時停止');audio.enable(soundWanted);}
$('pause').onclick=()=>paused?resume():pause();
window.addEventListener('blur',pause);document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});
function burst(){if(!paused)game.burst();}$('burst').onclick=burst;
function pointer(e){const box=canvas.getBoundingClientRect();game.setTarget((e.clientX-box.left)/box.width*W);}
canvas.addEventListener('pointerdown',e=>{if(game.phase!=='playing'||paused)return;canvas.setPointerCapture(e.pointerId);pointer(e);e.preventDefault();});
canvas.addEventListener('pointermove',e=>{if(game.phase==='playing'&&!paused&&(e.pointerType==='mouse'||canvas.hasPointerCapture(e.pointerId)))pointer(e);});
canvas.addEventListener('pointercancel',()=>keys.clear());
window.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','a','d','A','D',' ','Escape','p','P'].includes(e.key))return;if(game.phase==='playing')e.preventDefault();if(e.key===' '&&!e.repeat)burst();else if(['Escape','p','P'].includes(e.key)&&!e.repeat){if(paused)resume();else pause();}else keys.add(e.key);});
window.addEventListener('keyup',e=>keys.delete(e.key));
new ResizeObserver(()=>renderer.resize()).observe($('field'));
function upgradeUI(){
  $('overlay').className='overlay upgrading';$('overlay').hidden=false;$('overlay-title').textContent=game.stage===0?'次の現場へ、装備を選ぶ。':'最後の現場へ、備える。';$('overlay-text').textContent=game.stage===0?'広く処理するか、奥まで通すか。':'守りを固めるか、切り札を回すか。';$('modes').hidden=true;$('result').hidden=true;$('start').hidden=true;$('home').hidden=true;$('medals').hidden=true;$('best-wrap').hidden=true;$('upgrades').hidden=false;$('pause').hidden=true;$('start-hint').textContent='選ぶと、そのまま次のステージへ';
  $('upgrades').replaceChildren(...UPGRADES[game.stage].map(u=>{const button=document.createElement('button');button.className='upgrade-card';button.innerHTML=`<span>${u.icon}</span><div><strong>${u.name}</strong><small>${u.desc}</small></div>`;button.onclick=()=>{if(game.chooseUpgrade(u.id)){$('overlay').hidden=true;$('pause').hidden=false;resetEffects();audio.effect('upgrade');}};return button;}));
}
function resultUI(){
  records.plays++;if(game.win)records.clears++;records[mode]=Math.max(records[mode],game.score);
  const earned=[];if(game.win)earned.push('clear');if(game.win&&!game.hits)earned.push('clean');if(game.maxCombo>=40)earned.push('combo');if(game.perfects>=8)earned.push('perfect');if(game.win&&mode==='hard')earned.push('hard');records.medals=[...new Set([...records.medals,...earned])];save();recordUI();
  const rank=!game.win?(game.stage===0?'D':'C'):game.score>=60000&&game.hits<=2?'S':game.score>=38000?'A':'B';
  $('overlay').className='overlay finished';$('overlay').hidden=false;$('overlay-title').textContent=game.win?'本日の業務、完了。':'未処理、持ち越し。';$('overlay-text').textContent=game.win?'朝から月末まで、おつかれさまでした。':game.reason;
  $('modes').hidden=true;$('upgrades').hidden=true;$('start').hidden=false;$('home').hidden=false;$('medals').hidden=false;$('best-wrap').hidden=false;$('result').hidden=false;
  $('result').innerHTML=`<div class="result-rank"><small>${mode==='hard'?'BUSY DAY':'DAILY REPORT'}</small>${rank}</div><div class="result-score">${game.score.toLocaleString()}</div><div class="result-detail">${game.kills} 件処理 / 最大 ${game.maxCombo} COMBO<br>全件承認 ${game.perfects} 回 / 被弾 ${game.hits} 回 / ${Math.floor(game.t/60)}:${String(Math.floor(game.t%60)).padStart(2,'0')}</div><div class="result-route">${STAGES.map((s,i)=>`<span class="${i<game.stageScores.length?'done':''}">${i<game.stageScores.length?'✓':'—'} ${s.name}</span>`).join('')}</div>`;
  $('start').innerHTML='もう一度出勤 <span>↻</span>';$('start-hint').textContent=game.win?(rank==='S'?'見事な仕事ぶり。次は別の装備でも。':'同じ編隊に再挑戦。全件承認で上の評価へ。'):'同じ編隊に再挑戦。次は予告を見て一歩早く。';$('pause').hidden=true;noticeLeft=0;$('announcement').classList.remove('show');$('start').focus({preventScroll:true});
}
function updateHUD(){
  const info=STAGES[game.stage];document.documentElement.style.setProperty('--green',info.color);$('score').textContent=String(game.score).padStart(6,'0');$('time-label').textContent=game.segment==='boss'?'ボス締切':game.phase==='ready'?'出勤時刻':'現場の時刻';$('time').textContent=game.segment==='boss'?`${Math.max(0,Math.ceil(55-game.bossTime))}s`:info.time;
  $('lives').textContent='▰ '.repeat(Math.max(0,game.lives))+'▱ '.repeat(Math.max(0,4-game.lives));$('lives').setAttribute('aria-label',`残りライフ${game.lives}${game.shield?'、シールドあり':''}`);
  $('wave').textContent=`${info.time} / ${info.name}${mode==='hard'?' / 繁忙日':''}`;$('combo-label').textContent=game.coffee>0?`☕ 処理加速 ${Math.ceil(game.coffee)}s`:game.combo?'連続承認 / COMBO':'編隊を撃ち切ると全件承認';$('combo').innerHTML=game.combo?`${game.combo}<span> COMBO ×${game.multiplier}</span>`:'READY<span> TO APPROVE</span>';
  $('equipment').textContent=`${{single:'承認ショット',wide:'並列承認',pierce:'直列決裁'}[game.weapon]}${game.utility==='shield'?` / 代理 ${game.shield?'◇':'—'}`:game.utility==='charge'?' / 即時決裁':''}`;
  $('burst').disabled=paused||game.phase!=='playing'||game.energy<100||['intro','clear'].includes(game.segment);$('burst').classList.toggle('ready',game.energy>=100);$('burst').style.setProperty('--charge',game.energy/100);$('burst-label').textContent=game.energy>=100?'READY / SPACE':`再充填 ${Math.floor(game.energy)}%`;
  $('backlog').textContent=`未処理 ${'▰'.repeat(game.backlog)}${'▱'.repeat(3-game.backlog)}　3件でライフ −1`;
  document.querySelectorAll('.stage-rail span').forEach((el,i)=>{el.classList.toggle('active',i===game.stage);el.classList.toggle('done',i<game.stage);});document.querySelectorAll('.route-card').forEach((el,i)=>el.classList.toggle('selected',i===game.stage));
}
function events(){for(const e of game.events){renderer.effect(e);audio.effect(e.type);if(e.type==='boss')notice(e.hint,3);if(e.type==='notice')notice(e.text,1.4);if(e.type==='item')notice(e.kind==='coffee'?'コーヒー補給。7秒の集中。':'決裁権限 +35%',1.3);if(e.type==='damage')notice(`${e.reason} / ライフ −1`,1.3);if(e.type==='burst')notice(`一括否認 / ${e.cleared} 発を処理`,1);if(e.type==='shield')notice('代理が対応しました。',1.2);}game.events=[];}
let hud=0;
function frame(now){const wall=Math.min(.1,Math.max(0,(now-last)/1000||.016));last=now;const start=readCost();if(!paused){accumulator+=wall;while(accumulator>=1/120){const dt=1/120;if(keys.has('ArrowLeft')||keys.has('a')||keys.has('A'))game.setTarget(game.target-450*dt);if(keys.has('ArrowRight')||keys.has('d')||keys.has('D'))game.setTarget(game.target+450*dt);game.update(dt);audio.tick(dt,game.stage,game.segment==='boss',game.phase==='playing'&&game.segment!=='clear');accumulator-=dt;}visualTime+=wall;events();noticeLeft-=wall;if(noticeLeft<=0)$('announcement').classList.remove('show');}
  if(game.phase!==lastPhase){lastPhase=game.phase;if(game.phase==='upgrade')upgradeUI();if(game.phase==='ended')resultUI();}
  renderer.draw(game,visualTime,paused?0:wall);if(now-hud>80){updateHUD();hud=now;}frameTimes.push(readCost()-start);if(frameTimes.length>300)frameTimes.shift();requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
if(new URLSearchParams(location.search).has('qa'))window.gameSnapshot=()=>({...game.snapshot(),paused,records:JSON.parse(JSON.stringify(records)),performance:{samples:frameTimes.length,p95:frameTimes.toSorted((a,b)=>a-b)[Math.floor(frameTimes.length*.95)]||0,particles:renderer.particles.length,maxHazards:game.maxHazards},version:VERSION,world:{width:W,height:H}});
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
if(address.searchParams.get('v')===VERSION){address.searchParams.delete('v');history.replaceState(null,'',address.pathname+address.search+address.hash);}
