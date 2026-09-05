// Approval Defense v2. Simulation runs in a fixed world on every device.
export const W = 480;
export const H = 720;
export const VERSION = '2.0.3';
export const COMBO_MEDAL = 25;
export const STAGES = [
  {name:'朝の受付', sub:'MORNING INBOX', time:'09:00', color:'#c6f68d', boss:'回覧ルート', hint:'左右の承認印を壊すと、中央が開く。'},
  {name:'回覧経路', sub:'ROUTING NETWORK', time:'14:00', color:'#84dcf5', boss:'差戻しループ', hint:'予告された列を避けて、開いた窓を狙う。'},
  {name:'月末の夜', sub:'THE LAST DEADLINE', time:'17:55', color:'#ffb28d', boss:'月末締め', hint:'射線のすき間へ。締切レーザーは予告のあと。'},
];
export const UPGRADES = [
  [{id:'wide',name:'並列承認',desc:'3方向ショット。編隊を広く処理。',icon:'⋔'}, {id:'pierce',name:'直列決裁',desc:'太い貫通弾。奥の案件まで届く。',icon:'↑'}],
  [{id:'shield',name:'代理承認',desc:'各ステージで被弾を1回肩代わり。',icon:'◇'}, {id:'charge',name:'即時決裁',desc:'一括否認の再充填が速くなる。',icon:'ϟ'}],
];
export function rng(seed=12345){let n=seed>>>0;return()=>{n=(n*1664525+1013904223)>>>0;return n/4294967296;};}
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export class Game {
  constructor(seed=1,mode='normal'){this.seed=seed;this.mode=mode;this.reset();}
  reset(){
    Object.assign(this,{phase:'ready',win:false,t:0,stage:0,stageT:0,segment:'waves',score:0,kills:0,combo:0,maxCombo:0,comboT:0,lives:4,maxLives:4,backlog:0,x:240,target:240,y:H-72,shot:0,invincible:0,energy:100,coffee:0,shield:0,weapon:'single',utility:'none',enemies:[],bullets:[],hazards:[],warnings:[],items:[],events:[],boss:null,formation:0,nextId:1,forms:new Map(),perfects:0,grazes:0,hits:0,denials:0,escaped:0,stageHits:0,stageScores:[],stageStartScore:0,transition:0,bossTime:0,reason:'',log:[],maxHazards:0});
    this.random=rng(this.seed);this.random();this.random();this.patternOffset=Math.floor(this.random()*5);this.mirror=this.random()>.5;
  }
  event(type,data={}){this.events.push({type,...data});if(['stage','boss','damage','stageClear','end','upgrade','burst'].includes(type))this.log.push({t:+this.t.toFixed(2),type,stage:this.stage+1,score:this.score,lives:this.lives,...data});}
  start(){this.reset();this.phase='playing';this.enterStage(0);}
  enterStage(stage){this.stage=stage;this.stageT=0;this.segment='intro';this.transition=2;this.stageHits=0;this.stageStartScore=this.score;this.formation=0;this.comboT=4;this.enemies=[];this.hazards=[];this.warnings=[];this.bullets=[];this.items=[];this.boss=null;this.backlog=0;this.forms.clear();if(this.utility==='shield')this.shield=1;this.event('stage',{name:STAGES[stage].name});}
  chooseUpgrade(id){if(this.phase!=='upgrade')return false;const options=UPGRADES[this.stage];if(!options?.some(o=>o.id===id))return false;if(this.stage===0)this.weapon=id;else this.utility=id;this.event('upgrade',{id});this.phase='playing';this.enterStage(this.stage+1);return true;}
  setTarget(x){this.target=clamp(x,22,W-22);}
  end(win,reason=''){if(this.phase==='ended')return;this.phase='ended';this.win=win;this.reason=reason;if(win)this.score+=this.lives*1200+this.perfects*100;this.event('end',{win,reason});}
  damage(reason='被弾'){if(this.phase!=='playing'||this.invincible>0)return;this.invincible=1.65;if(this.shield){this.shield=0;this.event('shield');return;}this.lives--;this.hits++;this.stageHits++;this.combo=Math.floor(this.combo*.5);this.comboT=3;this.event('damage',{reason});if(this.lives<=0)this.end(false,reason);}
  escape(e){if(e.dead)return;e.dead=true;this.escaped++;this.backlog++;this.combo=0;this.event('escape',{x:e.x,y:H-31,backlog:this.backlog});const form=this.forms.get(e.form);if(form)form.failed=true;if(this.backlog>=3){this.backlog=0;this.damage('未処理が3件たまりました');}}
  formationWave(){
    const f=this.formation++;const group=this.nextId++;const stage=this.stage;
    const patterns=stage===0?['line','chevron','rush','line','cross']:stage===1?['relay','cross','rush','relay','chevron']:['cross','relay','rush','chevron','cross'];
    const pattern=stage===0&&f<2?['line','chevron'][f]:patterns[(f+this.patternOffset)%patterns.length];const n=pattern==='rush'?3:pattern==='relay'?4:5;
    this.forms.set(group,{total:n,killed:0,failed:false});
    for(let i=0;i<n;i++){
      let type='normal';if(pattern==='rush')type='urgent';else if(stage>=1&&i%3===0)type='return';if(pattern==='relay'&&i===1)type='relay';if(stage===2&&i===3)type='relay';
      let base=pattern==='rush'?105+i*135:65+i*(350/(n-1));if(this.mirror)base=480-base;
      this.enemies.push({id:this.nextId++,form:group,type,x:base,y:-35-(pattern==='chevron'?Math.abs(i-2)*38:i%2*27),base,age:0,hp:type==='relay'?4:type==='return'?2:2,w:42,h:44,pattern,speed:pattern==='rush'?39:38+stage*3,returned:false,shot:false,telegraphed:false,dead:false,hit:0});
    }
    this.event('formation',{pattern});
  }
  addHazard(x,y,vx,vy,kind='dot',r=6){if(this.hazards.length>=110)return;this.hazards.push({id:this.nextId++,x,y,vx,vy,kind,r,graze:false});}
  aim(x,y,speed=155){const dx=this.x-x,dy=this.y-y,len=Math.hypot(dx,dy);this.addHazard(x,y,dx/len*speed,dy/len*speed,'diamond',7);}
  warning(kind,x,width,delay,extra={}){this.warnings.push({kind,x,width,left:delay,total:delay,...extra});}
  spawnBoss(){this.segment='boss';this.bossTime=0;this.enemies=[];this.hazards=[];this.warnings=[];this.bullets=[];this.forms.clear();this.comboT=4;const stage=this.stage;this.boss={x:240,y:166,w:stage===2?176:146,h:76,hp:[34,42,64][stage],maxHp:[34,42,64][stage],age:0,cycle:0,attack:1.8,open:stage!==0,hit:0,nodes:stage===0?[{side:-1,hp:10},{side:1,hp:10}]:[],weakX:240,gate:0};this.event('boss',{name:STAGES[stage].boss,hint:STAGES[stage].hint});}
  defeatBoss(){if(!this.boss)return;this.score+=2500*(this.stage+1)+Math.max(0,Math.round((48-this.bossTime)*30));this.event('bossKill',{x:this.boss.x,y:this.boss.y});this.boss=null;this.enemies=[];this.hazards=[];this.warnings=[];this.items=[];this.bullets=[];this.segment='clear';this.transition=2.4;this.stageScores.push({stage:this.stage+1,score:this.score-this.stageStartScore,hits:this.stageHits,seconds:+this.stageT.toFixed(1)});this.event('stageClear',{perfect:this.stageHits===0});}
  bossUpdate(dt){
    const b=this.boss;if(!b)return;b.age+=dt;this.bossTime+=dt;b.hit=Math.max(0,b.hit-dt);b.x=240+Math.sin(b.age*.7)*100;b.y=166+Math.sin(b.age)*9;b.weakX=b.x;
    if(this.stage===0){b.open=b.nodes.every(n=>n.hp<=0);}
    if(this.stage===1){b.open=(b.age%6)>2.1;b.weakX=b.x+Math.sin(b.age*1.1)*38;}
    if(this.stage===2){b.open=(b.age%7)>3.2;b.weakX=b.x+Math.sin(b.age*.85)*48;}
    b.attack-=dt;
    if(b.attack<=0){
      const cycle=b.cycle++;const fast=this.mode==='hard'?.82:1;
      if(this.stage===0){
        if(cycle%2===0){for(const n of b.nodes.filter(n=>n.hp>0))this.warning('aim',b.x+n.side*72,26,.85,{y:b.y+24,speed:175});if(b.open)this.warning('fan',b.x,40,.8,{y:b.y+40,count:5});}
        else{const gap=clamp(b.x,100,380);this.warning('curtain',gap,128,1.05,{y:b.y+45,speed:165});}
        b.attack=2.5*fast;
      }else if(this.stage===1){
        if(cycle%3===0){const side=cycle%2===0?1:-1;this.warning('lanes',240+side*110,105,1.15,{lanes:[130,350]});}
        else if(cycle%3===1)this.warning('aim',b.x,26,.9,{y:b.y+38,speed:205,spread:1});
        else this.warning('curtain',cycle%2?135:345,120,1.1,{y:b.y+40,speed:175});
        b.attack=2.6*fast;
      }else{
        if(cycle%3===0)this.warning('curtain',[105,240,375][Math.floor(cycle/3)%3],this.mode==='hard'?98:116,.95,{y:b.y+50,speed:180});
        else if(cycle%3===1)this.warning('beam',this.x,82,1.2,{duration:.8});
        else this.warning('fan',b.x,30,.95,{y:b.y+45,count:b.hp<b.maxHp*.5?7:5});
        b.attack=(b.hp<b.maxHp*.5?2.05:2.45)*fast;if(this.mode==='hard'&&cycle%3===0)this.warning('aim',b.x,28,1.35,{y:b.y+45,speed:175});
      }
    }
    // An explicit, visible deadline bounds a run; no hidden rage damage.
    if(this.bossTime>55)this.end(false,'ボスの締切に間に合いませんでした');
  }
  resolveWarning(w){
    if(w.kind==='aim'){const dx=w.targetX-w.x,dy=this.y-w.y,len=Math.hypot(dx,dy);this.addHazard(w.x,w.y,dx/len*w.speed,dy/len*w.speed,'diamond',7);if(w.spread)for(const k of [-1,1])this.addHazard(w.x,w.y,dx/len*w.speed+k*43,dy/len*w.speed,'diamond',6);}
    if(w.kind==='fan'){for(let i=0;i<w.count;i++){const a=(i-(w.count-1)/2)*.23;this.addHazard(w.x,w.y,Math.sin(a)*190,Math.cos(a)*190,'diamond',7);}}
    if(w.kind==='curtain'){for(let x=18;x<480;x+=30)if(Math.abs(x-w.x)>w.width/2)this.addHazard(x,w.y,0,w.speed,'bar',7);}
    if(w.kind==='beam'){this.hazards.push({id:this.nextId++,kind:'beam',x:w.x,y:0,r:w.width/2,left:w.duration,graze:true});this.event('beam');}
    if(w.kind==='lanes'){for(const x of w.lanes)for(let i=0;i<3;i++)this.addHazard(x+(i-1)*26,100,0,190,'diamond',7);}
  }
  kill(e,denial=false){
    if(e.dead)return;e.dead=true;this.kills++;
    const base={normal:100,urgent:180,return:240,relay:320}[e.type];
    if(!denial){this.combo++;this.comboT=3.5;this.maxCombo=Math.max(this.maxCombo,this.combo);this.score+=base*this.multiplier;this.energy=clamp(this.energy+(this.utility==='charge'?7:4.5),0,100);}else this.score+=Math.round(base*.5);
    const f=this.forms.get(e.form);if(f){f.killed++;if(denial)f.failed=true;if(f.killed===f.total&&!f.failed){this.perfects++;this.score+=600*this.multiplier;this.event('perfect',{x:e.x,y:e.y});}}
    this.event('kill',{x:e.x,y:e.y,kind:e.type,denial});
    if(this.kills%12===0)this.items.push({x:e.x,y:e.y,type:this.kills%24===0?'energy':'coffee'});
  }
  get multiplier(){return Math.min(5,1+Math.floor(this.combo/10));}
  hitEnemy(e,damage=1,denial=false){if(e.dead)return;e.hit=.09;e.hp-=damage;if(e.type==='return'&&!e.returned&&!denial){e.returned=true;e.hp=2;e.y=Math.max(55,e.y-95);e.base=480-e.x;e.x=e.base;e.speed=65;this.event('return',{x:e.x,y:e.y});return;}if(e.hp<=0)this.kill(e,denial);}
  hitBoss(x,damage=1){const b=this.boss;if(!b)return false;
    if(this.stage===0&&!b.open){for(const n of b.nodes){if(n.hp>0&&Math.abs(x-(b.x+n.side*72))<25){n.hp=Math.max(0,n.hp-damage);b.hit=.08;if(!n.hp)this.event('node',{x:b.x+n.side*72,y:b.y});return true;}}return false;}
    if(!b.open)return false;const width=this.stage===0?53:this.stage===1?39:42;if(Math.abs(x-b.weakX)>width)return false;b.hp-=damage;b.hit=.06;if(b.hp<=0)this.defeatBoss();return true;
  }
  burst(){
    if(this.phase!=='playing'||this.segment==='intro'||this.segment==='clear'||this.energy<100)return false;
    this.energy=0;this.denials++;this.invincible=Math.max(this.invincible,.7);const cleared=this.hazards.length;this.score+=cleared*35;this.hazards=[];this.warnings=[];
    for(const e of this.enemies)if(e.y>0)this.hitEnemy(e,8,true);
    if(this.boss){const b=this.boss;if(this.stage===0&&!b.open){for(const n of b.nodes)n.hp=Math.max(0,n.hp-4);}else if(b.open){b.hp-=8;if(b.hp<=0)this.defeatBoss();}}
    this.event('burst',{cleared});return true;
  }
  update(dt){
    if(this.phase!=='playing')return;dt=Math.min(.05,Math.max(0,dt));this.t+=dt;this.stageT+=dt;this.invincible=Math.max(0,this.invincible-dt);this.coffee=Math.max(0,this.coffee-dt);this.comboT=Math.max(0,this.comboT-dt);if(!this.comboT)this.combo=0;
    const delta=this.target-this.x;this.x+=clamp(delta,-490*dt,490*dt);
    if(this.segment==='intro'||this.segment==='clear'){
      this.transition-=dt;if(this.transition<=0){if(this.segment==='intro'){this.segment='waves';this.stageT=0;}else if(this.stage===2)this.end(true);else{this.lives=Math.min(this.maxLives,this.lives+1);this.energy=Math.min(100,this.energy+25);this.phase='upgrade';}}return;
    }
    if(this.segment==='waves'){
      const schedule=[.3,4.5,8.7,13,17.4,21.8];if(this.formation<schedule.length&&this.stageT>=schedule[this.formation])this.formationWave();
      if(this.stageT>27.5){this.spawnBoss();}
    }
    this.shot-=dt;if(this.shot<=0){this.shot=this.coffee>0?.105:.16;const wide=this.weapon==='wide'||this.coffee>0;for(const vx of wide?[-125,0,125]:[0])this.bullets.push({x:this.x,y:this.y-27,vx,vy:-680,damage:this.weapon==='pierce'?1.55:1,pierce:this.weapon==='pierce'?3:1,hitIds:[]});this.event('shot');}
    for(const e of this.enemies){
      if(e.dead)continue;e.age+=dt;e.hit=Math.max(0,e.hit-dt);e.y+=e.speed*dt;
      if(e.pattern==='cross')e.x=clamp(e.base+Math.sin(e.age*1.05)*85,26,454);
      else if(e.type==='relay'){e.x=e.base+Math.sin(e.age*.8)*35;if(e.y>155&&e.age<7)e.y=155;if(!e.shot&&e.age>2){e.shot=true;this.warning('fan',e.x,30,1.05,{y:e.y+23,count:this.mode==='hard'?5:3});this.event('notice',{text:'回覧は、先に処理。',short:true});}}
      else e.x=e.base+Math.sin(e.age*1.2)*18;
      if(e.type==='urgent'&&!e.telegraphed&&e.age>2){e.telegraphed=true;this.warning('aim',e.x,28,1.15,{y:e.y+20,speed:160+this.stage*15});}
      if(e.y>H-40)this.escape(e);
    }
    this.bossUpdate(dt);
    for(const w of this.warnings){if(w.targetX===undefined)w.targetX=this.x;w.left-=dt;if(w.left<=0){this.resolveWarning(w);w.done=true;}}
    this.warnings=this.warnings.filter(w=>!w.done);
    for(const b of this.bullets){
      b.y+=b.vy*dt;b.x+=b.vx*dt;
      for(const e of this.enemies){if(!e.dead&&!b.hitIds.includes(e.id)&&Math.abs(b.x-e.x)<e.w/2+3&&Math.abs(b.y-e.y)<e.h/2+13){this.hitEnemy(e,b.damage);b.hitIds.push(e.id);b.pierce--;if(b.pierce<=0){b.y=-100;break;}}}
      const boss=this.boss;if(boss&&Math.abs(b.y-boss.y)<boss.h/2+13&&Math.abs(b.x-boss.x)<boss.w/2+25){this.hitBoss(b.x,b.damage);b.y=-100;}
    }
    for(const b of this.hazards){
      if(b.kind==='beam'){b.left-=dt;if(Math.abs(this.x-b.x)<b.r+5)this.damage('締切レーザー');continue;}
      b.x+=b.vx*dt;b.y+=b.vy*dt;const distance=Math.hypot(b.x-this.x,b.y-this.y);
      if(distance<b.r+6){this.damage('申請弾に被弾');b.y=H+100;}
      else if(!b.graze&&distance<b.r+25){b.graze=true;this.grazes++;this.energy=clamp(this.energy+(this.utility==='charge'?5:3),0,100);this.event('graze',{x:this.x,y:this.y});}
    }
    for(const i of this.items){i.y+=102*dt;if(Math.hypot(i.x-this.x,i.y-this.y)<31){if(i.type==='coffee')this.coffee=7;else this.energy=clamp(this.energy+35,0,100);i.y=H+90;this.event('item',{kind:i.type});}}
    this.enemies=this.enemies.filter(e=>!e.dead);this.bullets=this.bullets.filter(b=>b.y>-30&&b.x>-20&&b.x<500);this.hazards=this.hazards.filter(b=>b.kind==='beam'?b.left>0:b.y<H+30&&b.x>-40&&b.x<W+40);this.items=this.items.filter(i=>i.y<H+30);this.maxHazards=Math.max(this.maxHazards,this.hazards.length);
  }
  snapshot(){return {version:VERSION,phase:this.phase,segment:this.segment,stage:this.stage,t:this.t,stageT:this.stageT,bossTime:this.bossTime,x:this.x,target:this.target,y:this.y,score:this.score,lives:this.lives,energy:this.energy,combo:this.combo,kills:this.kills,perfects:this.perfects,shield:this.shield,weapon:this.weapon,utility:this.utility,backlog:this.backlog,win:this.win,reason:this.reason,seed:this.seed,mode:this.mode,hits:this.hits,denials:this.denials,log:this.log.map(x=>({...x})),enemies:this.enemies.map(e=>({...e})),hazards:this.hazards.map(b=>({...b})),warnings:this.warnings.map(w=>({...w})),items:this.items.map(i=>({...i})),boss:this.boss?{...this.boss,nodes:this.boss.nodes.map(n=>({...n}))}:null};}
}
