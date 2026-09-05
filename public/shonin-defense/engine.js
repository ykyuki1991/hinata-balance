// Deterministic, input-driven arena simulation. Rendering never changes combat.
export const W=480,H=600,VERSION='3.0.1';
export const STAGES=[
 {name:'受付ホール',sub:'THE INBOX',time:'09:00',color:'#b5f78c',boss:'受付一斉配信',hint:'突進を横にかわす。止まった瞬間が、承認の機会。',note:'未処理は、四方から。'},
 {name:'回覧機関室',sub:'THE ROUTING ENGINE',time:'14:00',color:'#80def2',boss:'差戻しループ',hint:'光る中継器を処理して、回覧の輪をほどく。',note:'回覧元から、止めましょう。'},
 {name:'月末決裁室',sub:'THE FINAL STAMP',time:'17:55',color:'#ffb589',boss:'月末締め',hint:'締切線の外へ。開いた承認口に近づく。',note:'本日中、とは聞いています。'}
];
export const UPGRADES=[[{id:'pierce',name:'直列決裁',desc:'貫通弾で、重なった申請をまとめて承認。',icon:'↗'},{id:'wide',name:'並列承認',desc:'扇状の3連射。近づくほど火力が集まる。',icon:'⋔'}],[{id:'charge',name:'即時差戻し',desc:'差戻しが早く戻る。反撃の機会を増やす。',icon:'↻'},{id:'shield',name:'代理承認',desc:'被弾1回を肩代わり。印の回収範囲も拡大。',icon:'◇'}]];
export const TYPES={chaser:{name:'未処理',hp:2,r:14,color:'#d5e6d3'},urgent:{name:'至急',hp:3,r:16,color:'#ff977e'},sniper:{name:'催促',hp:3,r:17,color:'#ffd274'},relay:{name:'回覧元',hp:6,r:21,color:'#b39cfa'},return:{name:'再申請',hp:2,r:13,color:'#85dcf7'},warden:{name:'保留',hp:5,r:21,color:'#e4a0d3'}};
export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
export function rng(seed){let n=seed>>>0;return()=>{n=(n*1664525+1013904223)>>>0;return n/4294967296;};}
export function lineDistance(p,a,b){const x=b.x-a.x,y=b.y-a.y,t=clamp(((p.x-a.x)*x+(p.y-a.y)*y)/(x*x+y*y||1),0,1);return Math.hypot(p.x-a.x-t*x,p.y-a.y-t*y);}
export function blocksLine(a,b,blocks){return blocks.some(o=>lineDistance(o,a,b)<o.r+2);}
export class Game{
 constructor(seed=1,mode='normal'){this.seed=seed;this.mode=mode;this.reset();}
 reset(){Object.assign(this,{phase:'ready',segment:'intro',stage:0,t:0,stageT:0,combatT:0,transition:1.5,x:240,y:420,vx:0,vy:0,mx:0,my:0,aim:0,targetId:null,lives:4,maxLives:4,invincible:0,score:0,kills:0,hits:0,combo:0,maxCombo:0,comboT:0,stamps:0,level:0,energy:100,dash:0,dx:0,dy:-1,denials:0,reflected:0,closeKills:0,grazes:0,weapon:'single',utility:'none',shield:0,shot:0,enemies:[],bullets:[],hazards:[],warnings:[],items:[],blocks:[],events:[],log:[],boss:null,bossTime:0,formation:0,waveAge:0,nextId:1,stageScores:[],win:false,reason:'',maxHazards:0,perfects:0});this.random=rng(this.seed);this.random();this.random();this.mirror=this.random()>.5;}
 event(type,data={}){this.events.push({type,...data});if(['stage','boss','stageClear','damage','end','upgrade','burst'].includes(type))this.log.push({t:+this.t.toFixed(2),stage:this.stage+1,type,score:this.score,lives:this.lives,...data});}
 start(){this.reset();this.phase='playing';this.enterStage(0);}
 enterStage(n){this.stage=n;this.segment='intro';this.stageT=0;this.combatT=0;this.transition=1.65;this.formation=0;this.waveAge=0;this.x=240;this.y=440;this.vx=this.vy=0;this.boss=null;this.bossTime=0;this.enemies=[];this.hazards=[];this.warnings=[];this.bullets=[];this.items=[];this.comboT=6;this.stageHits=this.hits;this.stageScore=this.score;this.blocks=n===0?[]:n===1?[{x:150,y:260,r:30},{x:330,y:340,r:30}]:[{x:120,y:300,r:25},{x:360,y:300,r:25}];if(this.utility==='shield')this.shield=1;this.event('stage',{name:STAGES[n].name});}
 move(x,y){const l=Math.max(1,Math.hypot(x,y));this.mx=x/l;this.my=y/l;}
 chooseUpgrade(id){if(this.phase!=='upgrade'||!UPGRADES[this.stage]?.some(x=>x.id===id))return false;if(this.stage===0)this.weapon=id;else this.utility=id;this.phase='playing';this.event('upgrade',{id});this.enterStage(this.stage+1);return true;}
 end(win,reason=''){if(this.phase==='ended')return;this.win=win;this.reason=reason;this.phase='ended';if(win)this.score+=this.lives*1500+Math.round(Math.max(0,210-this.t)*60);this.event('end',{win,reason});}
 damage(reason){if(this.invincible>0||this.phase!=='playing')return;this.invincible=1.4;if(this.shield){this.shield=0;this.event('shield',{x:this.x,y:this.y});return;}this.lives--;this.hits++;this.combo=Math.floor(this.combo/2);this.event('damage',{x:this.x,y:this.y,reason});if(this.lives<=0)this.end(false,reason);}
 get multiplier(){return Math.min(5,1+Math.floor(this.combo/8));}
 spawn(type,x,y,extra={}){if(this.enemies.length>=24)return;const spec=TYPES[type];this.enemies.push({id:this.nextId++,type,x:clamp(x,30,450),y:clamp(y,70,550),hp:spec.hp,r:spec.r,age:0,spawn:1.05,attack:1.6,hit:0,angle:0,state:'move',timer:0,...extra});}
 wave(){const f=this.formation++,s=this.stage;this.waveAge=0;const flip=this.mirror?-1:1;const side=(v)=>240+(v-240)*flip;const group=(type,pts)=>pts.forEach(([x,y])=>this.spawn(type,side(x),y));
 if(s===0){
  if(f===0)group('chaser',[[80,100],[240,78],[400,100],[50,280]]);
  if(f===1){group('urgent',[[70,100],[410,100]]);group('chaser',[[65,490],[410,480],[240,80]]);this.event('notice',{text:'至急は直進。予告の横へ。'});}
  if(f===2){group('sniper',[[75,125],[410,450]]);group('chaser',[[60,390],[410,150],[240,80]]);}
  if(f===3){group('urgent',[[75,500],[405,100]]);group('sniper',[[400,510]]);group('chaser',[[70,210],[240,80],[410,320]]);}
 }else if(s===1){
  if(f===0){group('relay',[[240,110]]);group('chaser',[[70,470],[400,450]]);this.event('notice',{text:'回覧元を先に。増える前に。'});}
  if(f===1){group('sniper',[[70,100],[410,510]]);group('return',[[410,100],[70,500],[240,80]]);}
  if(f===2){group('relay',[[390,170]]);group('urgent',[[70,490],[80,110]]);group('chaser',[[400,480],[240,90]]);}
  if(f===3){group('warden',[[240,280]]);group('sniper',[[60,90]]);group('return',[[60,510],[420,510],[420,90]]);}
 }else{
  if(f===0){group('warden',[[240,170]]);group('urgent',[[65,500],[410,500]]);group('chaser',[[60,150],[420,150]]);this.event('notice',{text:'保留の輪は、外へ。締切線にも注意。'});}
  if(f===1){group('relay',[[75,120]]);group('sniper',[[400,120]]);group('return',[[400,510],[70,510]]);}
  if(f===2){group('urgent',[[70,100],[410,100]]);group('warden',[[240,480]]);group('return',[[70,480],[410,480]]);}
  if(f===3){group('relay',[[410,480]]);group('sniper',[[70,100]]);group('urgent',[[70,500],[410,90]]);group('chaser',[[240,90],[240,510]]);}
 }
 if(this.mode==='hard'&&f>0)this.spawn(s===0?'chaser':'urgent',side(240),520);this.event('formation',{number:f+1});}
 warn(kind,a,b,delay=.9,extra={}){if(this.warnings.filter(w=>w.kind!=='spawn').length>=3)return false;this.warnings.push({id:this.nextId++,kind,x:a.x,y:a.y,tx:b.x,ty:b.y,left:delay,total:delay,...extra});this.event('warning',{kind});return true;}
 projectile(x,y,a,s=145,extra={}){if(this.hazards.length>=70)return;this.hazards.push({id:this.nextId++,x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,r:5,life:6,...extra});}
 resolve(w){const a=Math.atan2(w.ty-w.y,w.tx-w.x);
 if(w.kind==='shot'){for(let i=0;i<(w.count||1);i++)this.projectile(w.x,w.y,a+(i-((w.count||1)-1)/2)*.19,w.speed||165);}
 if(w.kind==='rush'){const e=this.enemies.find(e=>e.id===w.owner)||((this.boss?.id===w.owner)?this.boss:null);if(e){e.state='rush';e.angle=a;e.timer=w.duration||.6;e.speed=w.speed||340;}}
 if(w.kind==='ring'){for(let i=0;i<14;i++){const angle=i*Math.PI*2/14;if(Math.abs(Math.atan2(Math.sin(angle-a-Math.PI/2),Math.cos(angle-a-Math.PI/2)))<.48)continue;this.projectile(w.x,w.y,angle,115);}}
 if(w.kind==='beam')this.hazards.push({id:this.nextId++,kind:'beam',x:w.x,y:w.y,tx:w.tx,ty:w.ty,r:w.width||15,life:.6});
 this.event(w.kind==='beam'?'beam':'attack',{x:w.x,y:w.y});}
 burst(){if(this.phase!=='playing'||this.energy<100||['intro','clear'].includes(this.segment))return false;this.energy=0;this.denials++;this.dash=.23;this.invincible=Math.max(this.invincible,.48);const l=Math.hypot(this.mx,this.my);if(l>.1){this.dx=this.mx/l;this.dy=this.my/l;}else{this.dx=Math.cos(this.aim);this.dy=Math.sin(this.aim);}let cleared=0;
 for(const h of this.hazards){if(h.kind!=='beam'&&dist(this,h)<140){h.life=0;cleared++;}}
 for(const e of this.enemies)if(e.spawn<=0&&dist(this,e)<115){this.hit(e,3,true);e.x=clamp(e.x+(e.x-this.x)*.22,28,452);e.y=clamp(e.y+(e.y-this.y)*.22,65,555);}
 if(this.boss&&dist(this,this.boss)<140&&this.boss.open)this.hit(this.boss,5,true);
 this.reflected+=cleared;this.score+=cleared*100*this.multiplier;this.event('burst',{x:this.x,y:this.y,cleared});return true;}
 hit(e,n=1,special=false){if(e.dead||e===this.boss&&!e.open)return;e.hp-=n;e.hit=.09;if(e===this.boss&&this.stage===2&&e.seal<2&&e.hp<=e.maxHp*(2-e.seal)/3){e.hp=e.maxHp*(2-e.seal)/3;e.seal++;e.sealTimer=2.2;e.open=false;this.warnings=[];this.hazards=[];const vertical=e.seal===2;this.warn('beam',vertical?{x:this.x,y:55}:{x:20,y:this.y},vertical?{x:this.x,y:560}:{x:460,y:this.y},1.1,{width:22});this.event('notice',{text:`第${e.seal+1}決裁へ / 締切線の外へ。`});this.event('node',{x:e.x,y:e.y});return;}if(e.hp>0)return;e.dead=true;
 if(e===this.boss){this.defeatBoss();return;}
 this.kills++;this.combo++;this.comboT=5;this.maxCombo=Math.max(this.maxCombo,this.combo);const close=dist(this,e)<150;if(close)this.closeKills++;this.score+=Math.round((e.type==='relay'?350:150)*(close?1.5:1)*this.multiplier);this.event('kill',{x:e.x,y:e.y,kind:e.type,close,special});
 this.items.push({x:e.x,y:e.y,type:'stamp',life:7});if(this.kills%14===0)this.items.push({x:e.x,y:e.y,type:'coffee',life:10});
 if(e.type==='return'&&!e.returned){this.spawn('chaser',e.x+30,e.y-20,{returned:true,spawn:1.3});this.event('return',{x:e.x,y:e.y});}
 }
 spawnBoss(){this.segment='boss';this.bossTime=0;this.enemies=[];this.warnings=[];this.hazards=[];this.bullets=[];this.boss={id:this.nextId++,x:240,y:200,r:35,hp:[48,44,60][this.stage],maxHp:[48,44,60][this.stage],open:true,age:0,attack:1.2,state:'move',timer:0,angle:Math.PI/2,hit:0,cycle:0,seal:0,sealTimer:0};if(this.stage===1){this.boss.open=false;this.spawn('relay',80,180,{node:true,hp:5});this.spawn('relay',400,420,{node:true,hp:5});}this.event('boss',{name:STAGES[this.stage].boss,hint:STAGES[this.stage].hint});}
 defeatBoss(){this.score+=3500*(this.stage+1);this.event('bossKill',{x:this.boss.x,y:this.boss.y});this.boss=null;this.enemies=[];this.hazards=[];this.warnings=[];this.bullets=[];this.items=[];this.segment='clear';this.transition=1.8;const clean=this.hits===this.stageHits;if(clean){this.perfects++;this.score+=1500;}this.stageScores.push({stage:this.stage+1,score:this.score-this.stageScore,hits:this.hits-this.stageHits,seconds:+this.stageT.toFixed(1)});this.event('stageClear',{perfect:clean});}
 bossUpdate(dt){const b=this.boss;if(!b)return;b.age+=dt;b.hit=Math.max(0,b.hit-dt);this.bossTime+=dt;b.attack-=dt;b.timer-=dt;
 if(this.stage===0){b.open=b.state==='recover';if(b.state==='rush'){b.x+=Math.cos(b.angle)*b.speed*dt;b.y+=Math.sin(b.angle)*b.speed*dt;if(b.timer<=0||b.x<50||b.x>430||b.y<95||b.y>515){b.state='recover';b.timer=2.5;b.attack=2.6;}}else if(b.state==='recover'&&b.timer<=0)b.state='move';}
 if(this.stage===1){b.open=!this.enemies.some(e=>e.node&&!e.dead);b.x=240+Math.cos(b.age*.48)*65;b.y=280+Math.sin(b.age*.48)*95;}
 if(this.stage===2){b.sealTimer=Math.max(0,b.sealTimer-dt);b.open=b.age%7>2.2&&b.sealTimer<=0;b.x=240+Math.sin(b.age*.5)*65;b.y=225+Math.cos(b.age*.5)*45;}
 b.x=clamp(b.x,45,435);b.y=clamp(b.y,85,530);
 if(b.attack<=0){let done=false;const c=b.cycle;
 if(this.stage===0){if(c%2===0){done=this.warn('rush',b,this,1.05,{owner:b.id,speed:350,duration:.85});if(done)b.state='windup';}else done=this.warn('shot',b,this,.9,{count:5,speed:150});}
 if(this.stage===1){done=this.warn(c%2?'shot':'ring',b,this,1.05,{count:3,speed:165});}
 if(this.stage===2){if(c%3===0){const vertical=Math.floor(c/3)%2===0;done=this.warn('beam',vertical?{x:this.x,y:55}:{x:20,y:this.y},vertical?{x:this.x,y:560}:{x:460,y:this.y},1.15,{width:22});}else done=this.warn(c%3===1?'ring':'shot',b,this,1,{count:b.hp<b.maxHp/2?5:3,speed:175});}
 if(done){b.cycle++;b.attack=2.4;}}
 if(dist(this,b)<b.r+7)this.damage('決裁装置に接触');
 if(this.bossTime>65)this.end(false,'締切に間に合わず。近づいて承認口を狙おう。');}
 collision(p,r){p.x=clamp(p.x,22,458);p.y=clamp(p.y,66,558);for(const b of this.blocks){const d=dist(p,b),min=b.r+r;if(d<min){const a=Math.atan2(p.y-b.y,p.x-b.x);p.x=b.x+Math.cos(a)*min;p.y=b.y+Math.sin(a)*min;}}}
 update(dt){if(this.phase!=='playing')return;dt=clamp(dt,0,.04);this.t+=dt;this.stageT+=dt;this.invincible=Math.max(0,this.invincible-dt);this.dash=Math.max(0,this.dash-dt);this.energy=clamp(this.energy+dt*(this.utility==='charge'?21:15),0,100);this.comboT=Math.max(0,this.comboT-dt);if(!this.comboT)this.combo=0;
 const accel=1-Math.exp(-24*dt);this.vx+=(this.mx*205-this.vx)*accel;this.vy+=(this.my*205-this.vy)*accel;this.x+=(this.dash>0?this.dx*580:this.vx)*dt;this.y+=(this.dash>0?this.dy*580:this.vy)*dt;this.collision(this,10);
 if(this.segment==='intro'||this.segment==='clear'){this.transition-=dt;if(this.transition<=0){if(this.segment==='intro'){this.segment='waves';this.wave();}else if(this.stage===2)this.end(true);else{this.lives=Math.min(4,this.lives+1);this.phase='upgrade';}}return;}
 this.combatT+=dt;this.waveAge+=dt;
 if(this.segment==='waves'){
 if(this.formation<4&&(this.waveAge>7.5||this.waveAge>2&&!this.enemies.length))this.wave();
 if(this.formation===4&&(!this.enemies.length&&this.waveAge>1||this.waveAge>11))this.spawnBoss();
 // The deadline sweeps an outer lane, announced before becoming solid danger.
 if(this.stage===2&&Math.floor((this.combatT-dt)/6)<Math.floor(this.combatT/6)){const left=Math.floor(this.combatT/6)%2;const x=left?55:425;this.warn('beam',{x,y:60},{x,y:560},1.3,{width:28});}
 }
 for(const e of this.enemies){if(e.dead)continue;e.age+=dt;e.spawn-=dt;e.hit=Math.max(0,e.hit-dt);if(e.spawn>0)continue;e.attack-=dt;e.timer-=dt;
 const d=dist(e,this),a=Math.atan2(this.y-e.y,this.x-e.x);let speed=0,angle=a;
 if(e.type==='chaser'||e.type==='return')speed=e.type==='return'?91:67;
 if(e.type==='urgent'){if(e.state==='rush'){speed=310;angle=e.angle;if(e.timer<=0){e.state='recover';e.timer=.9;}}else if(e.state==='recover'){if(e.timer<=0)e.state='move';}else if(e.state==='move'){speed=38;if(e.attack<=0&&d<390&&this.warn('rush',e,{x:clamp(this.x+this.vx*.45,30,450),y:clamp(this.y+this.vy*.45,75,550)},.85,{owner:e.id,duration:.65})){e.state='windup';e.attack=3;}}}
 if(e.type==='sniper'){speed=d<180?-45:d>280?24:0;if(e.attack<=0&&this.warn('shot',e,{x:clamp(this.x+this.vx*.65,30,450),y:clamp(this.y+this.vy*.65,75,550)},.95)){e.attack=3;}}
 if(e.type==='relay'){if(e.attack<=0){if(e.node){if(this.warn('shot',e,this,1,{count:3}))e.attack=3.2;}else{const ang=e.age*2;this.spawn('chaser',e.x+Math.cos(ang)*35,e.y+Math.sin(ang)*35);e.attack=3.7;this.event('relay',{x:e.x,y:e.y});}}}
 if(e.type==='warden'){speed=d>210?32:0;if(e.attack<=0&&this.warn('ring',e,this,1.1)){e.attack=4.2;}}
 e.x+=Math.cos(angle)*speed*dt;e.y+=Math.sin(angle)*speed*dt;this.collision(e,e.r);
 // Separation keeps enemies legible instead of an overlapping single target.
 for(const other of this.enemies){if(other.id>=e.id||other.spawn>0||other.dead)continue;const len=dist(e,other);if(len<e.r+other.r&&len>0){e.x+=(e.x-other.x)/len*25*dt;e.y+=(e.y-other.y)/len*25*dt;}}
 if(dist(this,e)<e.r+6)this.damage(`${TYPES[e.type].name}に接触`);
 }
 this.bossUpdate(dt);
 for(const w of this.warnings){w.left-=dt;if(w.owner&&!this.enemies.some(e=>e.id===w.owner&&!e.dead)&&this.boss?.id!==w.owner)w.left=-99;if(w.left<=0&&!w.done){w.done=true;if(w.left>-90)this.resolve(w);}}
 this.warnings=this.warnings.filter(w=>!w.done);
 // Nearest visible target: positioning is the aiming control on every device.
 const targets=this.enemies.filter(e=>!e.dead&&e.spawn<=0);if(this.boss?.open)targets.push(this.boss);let target=null,best=340;
 for(const e of targets){const d=dist(this,e);if(d<best&&!blocksLine(this,e,this.blocks)){best=d;target=e;}}
 this.targetId=target?.id??null;if(target)this.aim=Math.atan2(target.y-this.y,target.x-this.x);
 this.shot-=dt;this.coffee=Math.max(0,(this.coffee||0)-dt);
 if(target&&this.shot<=0){this.shot=(this.coffee>0?.115:.18)/(1+this.level*.1);const spread=this.weapon==='wide'?[-.16,0,.16]:[0];for(const offset of spread){const a=this.aim+offset;this.bullets.push({x:this.x+Math.cos(a)*14,y:this.y+Math.sin(a)*14,vx:Math.cos(a)*600,vy:Math.sin(a)*600,life:.7,pierce:this.weapon==='pierce'?3:1,damage:this.weapon==='wide'?.65:this.weapon==='pierce'?1.2:1,ids:[]});}this.event('shot',{x:this.x,y:this.y});}
 for(const b of this.bullets){const prev={x:b.x,y:b.y};b.x+=b.vx*dt;b.y+=b.vy*dt;b.life-=dt;if(blocksLine(prev,b,this.blocks)){b.life=0;continue;}for(const e of targets){if(!e.dead&&!b.ids.includes(e.id)&&lineDistance(e,prev,b)<e.r+3){this.hit(e,b.damage);b.ids.push(e.id);b.pierce--;if(b.pierce<=0){b.life=0;break;}}}}
 for(const h of this.hazards){h.life-=dt;if(h.life<=0)continue;if(h.kind==='beam'){if(lineDistance(this,h,{x:h.tx,y:h.ty})<h.r+6)this.damage('締切線に接触');continue;}const prev={x:h.x,y:h.y};h.x+=h.vx*dt;h.y+=h.vy*dt;if(blocksLine(prev,h,this.blocks)){h.life=0;continue;}const d=dist(h,this);if(d<h.r+6){this.damage('催促弾に被弾');h.life=0;}else if(d<24&&!h.grazed){h.grazed=true;this.grazes++;this.energy=clamp(this.energy+4,0,100);this.score+=25;}}
 for(const item of this.items){item.life-=dt;const d=dist(this,item);if(d<(this.utility==='shield'?75:52)){const a=Math.atan2(this.y-item.y,this.x-item.x);item.x+=Math.cos(a)*300*dt;item.y+=Math.sin(a)*300*dt;}if(d<20){item.life=0;if(item.type==='stamp'){this.stamps++;this.score+=180*this.multiplier;this.energy=clamp(this.energy+10,0,100);this.comboT=5;const level=Math.min(3,Math.floor(this.stamps/9));if(level>this.level){this.level=level;this.event('upgrade',{id:'level',text:`処理速度 UP / Lv.${level+1}`});}}else{this.coffee=6;this.event('item',{kind:'coffee'});}this.event('collect',{x:item.x,y:item.y});}}
 this.enemies=this.enemies.filter(e=>!e.dead);this.bullets=this.bullets.filter(b=>b.life>0);this.hazards=this.hazards.filter(b=>b.life>0&&b.x>-20&&b.x<500&&b.y>20&&b.y<620);this.items=this.items.filter(i=>i.life>0);this.maxHazards=Math.max(this.maxHazards,this.hazards.length);
 }
 snapshot(){const {events,random,...s}=this;return JSON.parse(JSON.stringify(s));}
}
