// Pure simulation: input, fixed steps and seeded formations; no DOM or rendering.
export const VERSION='4.0.0',H=600,W=800;
export const STAGES=[{name:'集まる、未処理。',en:'01 / INCOMING',boss:'受付集積機',color:'#9de2cc'},{name:'その承認、両方へ。',en:'02 / PARALLEL',boss:'並行審議機関',color:'#b5c9ef'},{name:'決裁の、その先へ。',en:'03 / HANDOFF',boss:'月末締め',color:'#ebc58c'}];
export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
export function rng(seed){let n=seed>>>0;return()=>{n=(n*1664525+1013904223)>>>0;return n/4294967296;};}
export function lineDistance(p,a,b){const x=b.x-a.x,y=b.y-a.y,t=clamp(((p.x-a.x)*x+(p.y-a.y)*y)/(x*x+y*y||1),0,1);return Math.hypot(p.x-a.x-t*x,p.y-a.y-t*y);}
export const TYPES={paper:{hp:2,r:16},clip:{hp:5,r:22},source:{hp:9,r:27},return:{hp:3,r:18},urgent:{hp:3,r:18},node:{hp:10,r:24}};
export class Game {
 constructor(seed=1,mode='normal',width=W){this.seed=seed;this.mode=mode;this.width=clamp(width,280,1200);this.reset();}
 reset(){Object.assign(this,{phase:'ready',segment:'intro',stage:0,t:0,stageT:0,transition:1.8,x:this.width*.2,y:300,mx:0,my:0,vx:0,vy:0,lives:4,hits:0,invincible:0,score:0,combo:0,maxCombo:0,comboT:0,kills:0,energy:65,boost:0,level:0,stamps:0,shot:0,enemies:[],bullets:[],hazards:[],items:[],events:[],log:[],boss:null,nextId:1,formation:0,waveAge:0,win:false,reason:'',fastKills:0,cancelled:0,bursts:0,stageScores:[],route:0,maxHazards:0});this.random=rng(this.seed);}
 event(type,data={}){this.events.push({type,...data});if(['stage','boss','stageClear','damage','end','route','burst'].includes(type))this.log.push({t:+this.t.toFixed(2),stage:this.stage+1,type,...data});}
 start(){this.reset();this.phase='playing';this.enterStage(0);}
 resize(w){const old=this.width;this.width=clamp(w,280,1200);const k=this.width/old;for(const a of [this,...this.enemies,...this.bullets,...this.hazards,...this.items,...(this.boss?[this.boss]:[])]){a.x*=k;if(a.tx!==undefined)a.tx*=k;}this.move(0,0);}
 move(x,y){const n=Math.max(1,Math.hypot(x,y));this.mx=x/n;this.my=y/n;}
 get multiplier(){return Math.min(5,1+Math.floor(this.combo/10));}
 enterStage(s){this.stage=s;this.stageT=0;this.segment='intro';this.transition=1.7;this.formation=0;this.waveAge=0;this.stageHits=this.hits;this.stageScore=this.score;this.enemies=[];this.hazards=[];this.bullets=[];this.items=[];this.boss=null;this.x=this.width*.2;this.y=300;this.event('stage');}
 spawn(type,x,y,extra={}){if(this.enemies.length>=20)return;const e={id:this.nextId++,type,x,y,baseY:y,...TYPES[type],age:0,hit:0,attack:2.4,spawn:.55,speed:this.width*.075,returned:false,...extra};this.enemies.push(e);return e;}
 wave(){const f=this.formation++,w=this.width,s=this.stage;this.waveAge=0;const ys=[180,300,420],j=this.random()>.5?1:-1;const add=(t,x,y,extra)=>this.spawn(t,w*x,y,extra);
 if(s===0){
 if(f===0)for(let i=0;i<5;i++)add('paper',.82+i*.13,300); // Safe first line, naturally aligned with the cannon.
 if(f===1)for(let i=0;i<6;i++)add('paper',.9+i*.1,300+Math.sin(i*.9)*100);
 if(f===2){add('clip',.86,300,{weak:45*j});add('paper',1.1,180);add('paper',1.18,420);}
 if(f===3){add('source',.87,300);add('paper',1,180);add('paper',1,420);}
 if(f===4){add('source',.96,300+110*j);for(let i=0;i<5;i++)add(i%2?'urgent':'paper',1.05+i*.13,ys[i%3]);}
 }else if(s===1){
 if(f===0){add('node',.78,190,{gate:'or',speed:0});add('node',.78,410,{gate:'or',speed:0});}
 if(f===1){for(let i=0;i<5;i++)add('return',.9+i*.14,ys[i%3]);}
 if(f===2){add('node',.8,185,{gate:'and',speed:0});add('node',.8,415,{gate:'and',speed:0});}
 if(f===3){add('source',.9,420);add('clip',.8,200,{weak:42});for(let i=0;i<3;i++)add('return',1.1+i*.13,300);}
 if(f===4){for(let i=0;i<6;i++)add(i%3===0?'urgent':'paper',.85+i*.14,ys[(i+this.route)%3]);add('source',1.25,this.route===1?185:415);}
 }else{
 if(f===0){add('source',.86,180);add('source',1.07,420);for(let i=0;i<3;i++)add('paper',1+i*.13,300);}
 if(f===1){add('clip',.82,190,{weak:40});add('clip',1.1,410,{weak:-40});add('return',1.25,300);}
 if(f===2){add('node',.8,180,{gate:'and',speed:0});add('node',.8,420,{gate:'and',speed:0});add('urgent',1.1,300);}
 if(f===3){add('source',.9,300);for(let i=0;i<5;i++)add('return',1.03+i*.13,ys[i%3]);}
 if(f===4){for(let i=0;i<8;i++)add(i%3===0?'urgent':'paper',.88+i*.1,300+Math.sin(i)*145);}
 }
 if(this.mode==='hard'&&f>0)add('urgent',1.45,ys[Math.floor(this.random()*3)]);this.event('formation',{number:f+1});}
 burst(){if(this.phase!=='playing'||this.segment==='intro'||this.segment==='clear'||this.energy<100)return false;this.energy=0;this.boost=2.5;this.shot=0;this.bursts++;this.event('burst',{x:this.x,y:this.y});return true;}
 damage(reason){if(this.invincible>0||this.phase!=='playing')return;this.lives--;this.hits++;this.invincible=1.6;this.combo=Math.floor(this.combo/2);this.event('damage',{x:this.x,y:this.y});if(this.lives<=0)this.end(false,reason);}
 hit(e,n=1){if(e.dead)return;if(e===this.boss&&this.stage<2&&e.parts>0)return;e.hp-=n;if(e===this.boss&&this.stage===2)e.hp=Math.max(e.hp,e.maxHp*e.parts/3);e.hit=.09;this.event('hit',{x:e.x,y:e.y});if(e.hp>0)return;e.dead=true;
 if(e===this.boss){this.clearStage();return;}
 this.kills++;this.combo++;this.comboT=5;this.maxCombo=Math.max(this.maxCombo,this.combo);const fast=e.age<5;this.fastKills+=Number(fast);this.score+=Math.round((e.type==='node'?600:e.type==='source'?400:180)*(fast?1.5:1)*this.multiplier);this.energy=clamp(this.energy+7,0,100);this.stamps++;this.level=Math.min(3,Math.floor(this.stamps/14));this.event('kill',{x:e.x,y:e.y,kind:e.type,fast});
 if(e.gate==='or'){this.route=e.y<300?1:2;for(const other of this.enemies)if(other.gate==='or')other.dead=true;this.energy=100;this.event('route',{choice:this.route});}
 if(e.gate==='and'&&!this.enemies.some(a=>a!==e&&a.gate==='and'&&!a.dead)){this.score+=1200;this.event('route',{choice:3});}
 if(e.part&&this.boss){this.boss.parts--;this.event('node',{x:e.x,y:e.y});}
 if(this.kills%12===0)this.items.push({x:e.x,y:e.y,type:'coffee',life:8});
 if(e.type==='source'){this.hazards=this.hazards.filter(h=>h.owner!==e.id);for(const a of this.enemies)if(a.owner===e.id&&!a.dead)this.hit(a,99);}
 }
 spawnBoss(){this.segment='boss';this.bossAge=0;this.hazards=[];this.enemies=[];this.bullets=[];const w=this.width;this.boss={id:this.nextId++,x:w*.8,y:300,r:22,hp:[90,110,135][this.stage],maxHp:[90,110,135][this.stage],age:0,attack:1.7,hit:0,parts:this.stage+1,dead:false};for(let i=0;i<this.boss.parts;i++){const y=this.boss.parts===1?300:155+i*(290/(this.boss.parts-1));this.spawn('node',w*.73,y,{part:true,hp:8+this.stage*2,speed:0,baseY:y});}this.event('boss',{name:STAGES[this.stage].boss});}
 clearStage(){this.score+=4000*(this.stage+1);this.event('bossKill',{x:this.boss.x,y:this.boss.y});this.boss=null;this.enemies=[];this.hazards=[];this.bullets=[];this.segment='clear';this.transition=2.6;this.stageScores.push({stage:this.stage+1,score:this.score-this.stageScore,hits:this.hits-this.stageHits,seconds:+this.stageT.toFixed(1)});this.event('stageClear');if(this.hits===this.stageHits)this.score+=1500;}
 end(win,reason=''){if(this.phase==='ended')return;this.win=win;this.reason=reason;this.phase='ended';if(win)this.score+=this.lives*2000+Math.round(Math.max(0,200-this.t)*80);this.event('end',{win,reason});}
 fireEnemy(e,count=1){if(this.hazards.length>=18)return;const a=Math.atan2(this.y-e.y,this.x-e.x),speed=this.width*.21;for(let i=0;i<count;i++){const angle=a+(i-(count-1)/2)*.22;this.hazards.push({x:e.x-15,y:e.y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,r:7,life:6,owner:e.id});}this.event('attack',{x:e.x,y:e.y});}
 update(dt){if(this.phase!=='playing')return;dt=clamp(dt,0,.04);this.t+=dt;this.stageT+=dt;this.invincible=Math.max(0,this.invincible-dt);this.boost=Math.max(0,this.boost-dt);this.energy=clamp(this.energy+dt*2,0,100);this.comboT=Math.max(0,this.comboT-dt);if(!this.comboT)this.combo=0;
 const a=1-Math.exp(-26*dt);this.vx+=(this.mx*230-this.vx)*a;this.vy+=(this.my*230-this.vy)*a;this.x=clamp(this.x+this.vx*dt,25,this.width*.66);this.y=clamp(this.y+this.vy*dt,75,535);
 if(this.segment==='intro'||this.segment==='clear'){this.transition-=dt;if(this.transition<=0){if(this.segment==='intro'){this.segment='waves';this.wave();}else if(this.stage===2)this.end(true);else{this.lives=Math.min(4,this.lives+1);this.enterStage(this.stage+1);}}return;}
 this.waveAge+=dt;
 if(this.segment==='waves'){
 const gate=this.enemies.some(e=>e.gate&&!e.dead);
 if(this.formation<5&&(!this.enemies.length&&this.waveAge>1.2||this.waveAge>9&&!gate))this.wave();
 if(this.formation===5&&(!this.enemies.length&&this.waveAge>1||this.waveAge>11))this.spawnBoss();
 if(gate&&this.waveAge>12&&Math.floor((this.waveAge-dt)/4)<Math.floor(this.waveAge/4))this.spawn('paper',this.width,300);}
 for(const e of this.enemies){if(e.dead)continue;e.age+=dt;e.spawn-=dt;e.hit=Math.max(0,e.hit-dt);if(e.spawn>0)continue;e.attack-=dt;
 if(e.part){e.x=this.width*.73;e.y=e.baseY+Math.sin(this.t*1.2)*22;}
 else if(e.type==='node')e.y=e.baseY;
 else if(e.type==='source'){e.x-=e.x>this.width*.72?e.speed*dt:e.speed*.15*dt;if(e.attack<=0&&e.x<this.width){this.spawn('paper',e.x-30,e.y+Math.sin(e.age*3)*55,{owner:e.id,attack:1.8});e.attack=2.6;this.event('relay',{x:e.x,y:e.y});}}
 else if(e.type==='return'){e.x+=e.speed*(e.returned?1.8:-1)*dt;e.y=e.baseY+Math.sin(e.age*2)*24;if(e.x<this.width*.25&&!e.returned){e.returned=true;e.hp=2;this.event('return',{x:e.x,y:e.y});}if(e.returned&&e.x>this.width*.82){e.returned=false;e.speed*=1.15;}}
 else {e.x-=e.speed*(e.type==='urgent'&&e.age>2?1.8:1)*dt;if(e.type==='urgent')e.y=e.baseY+Math.sin(e.age)*18;}
 if(!['source','paper'].includes(e.type)&&e.attack<=0&&e.x<this.width&&e.x>this.x+20){this.fireEnemy(e,this.mode==='hard'?3:1);e.attack=e.part?2.5:3.8;}
 if(e.x<-30){e.dead=true;this.combo=0;this.damage('未処理があふれました。');}
 if(dist(this,e)<e.r+7)this.damage('書類に接触しました。');
 }
 const b=this.boss;if(b){b.age+=dt;this.bossAge+=dt;b.hit=Math.max(0,b.hit-dt);b.y=300+Math.sin(b.age*.8)*(this.stage===0?80:45);b.attack-=dt;if(b.attack<=0){this.fireEnemy(b,b.parts?1:3);b.attack=this.stage===2?1.6:2.3;if(this.stage===2&&b.age>5&&this.enemies.length<3)this.spawn('return',this.width*.98, b.y<300?440:160,{attack:3});}if(this.bossAge-dt<40&&this.bossAge>=40)this.event('warning');if(this.bossAge>50)this.end(false,'月末に、追い越されました。');}
 // Position aims the stream. Small vertical correction helps fingers without choosing targets behind the player.
 const targets=this.enemies.filter(e=>!e.dead&&e.spawn<=0&&e.x<this.width+30);if(b&&!b.dead&&(b.parts===0||this.stage===2&&b.parts<3))targets.push(b);
 this.shot-=dt;this.coffee=Math.max(0,(this.coffee||0)-dt);
 if(this.shot<=0){this.shot=this.boost>0?.065:this.coffee>0?.09:.135;const offsets=this.level>=2?[-14,14]:[0];for(const off of offsets){const near=targets.filter(e=>e.x>this.x+15&&Math.abs((e.y+(e.weak||0))-(this.y+off))<(this.mode==='hard'?18:38)).sort((e,f)=>e.x-f.x)[0];const vy=near?clamp(((near.y+(near.weak||0))-this.y-off)*3,-90,90):0;this.bullets.push({x:this.x+23,y:this.y+off,vx:this.width*1.7,vy,life:1,pierce:this.boost>0?15:1,damage:this.boost>0?2:1,ids:[],heavy:this.boost>0});}if(this.level>=1&&Math.floor(this.t*8)%2===0)this.bullets.push({x:this.x+4,y:this.y-27,vx:this.width*1.6,vy:0,life:1,pierce:1,damage:.6,ids:[]});this.event('shot',{x:this.x,y:this.y});}
 for(const shot of this.bullets){const prev={x:shot.x,y:shot.y};shot.x+=shot.vx*dt;shot.y+=shot.vy*dt;shot.life-=dt;
 for(const h of this.hazards){if(h.life>0&&lineDistance(h,prev,shot)<h.r+5){h.life=0;this.cancelled++;this.score+=20;this.energy=clamp(this.energy+1,0,100);this.event('cancel',{x:h.x,y:h.y});if(!shot.heavy){shot.life=0;break;}}}
 if(shot.life<=0)continue;
 for(const e of targets){if(e.dead||shot.ids.includes(e.id))continue;const center={x:e.x,y:e.y+(e.weak||0)};if(lineDistance(center,prev,shot)<(e.weak?15:e.r)+4){this.hit(e,shot.damage);shot.ids.push(e.id);shot.pierce--;if(shot.pierce<=0){shot.life=0;break;}}else if(e.weak&&lineDistance(e,prev,shot)<e.r+3){shot.life=0;this.event('armor',{x:shot.x,y:shot.y});break;}}
 }
 for(const h of this.hazards){h.life-=dt;h.x+=h.vx*dt;h.y+=h.vy*dt;if(h.life>0&&dist(h,this)<h.r+6){h.life=0;this.damage('催促弾に被弾しました。');}}
 for(const i of this.items){i.life-=dt;i.x-=this.width*.12*dt;if(dist(i,this)<45){i.life=0;this.coffee=6;this.energy=clamp(this.energy+25,0,100);this.event('item',{x:i.x,y:i.y});}}
 this.enemies=this.enemies.filter(e=>!e.dead);this.hazards=this.hazards.filter(h=>h.life>0&&h.x>-20&&h.y>40&&h.y<570);this.bullets=this.bullets.filter(b=>b.life>0&&b.x<this.width+40);this.items=this.items.filter(i=>i.life>0);this.maxHazards=Math.max(this.maxHazards,this.hazards.length);
 }
 snapshot(){const {events,random,...s}=this;return JSON.parse(JSON.stringify(s));}
}
