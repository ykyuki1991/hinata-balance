export const VERSION='5.0.0',H=600,W=800;
export const STAGES=[{name:'受付',en:'01',boss:'受付ゲート',color:'#9de2cc'},{name:'並行審議',en:'02',boss:'回覧機関',color:'#b5c9ef'},{name:'決裁・連携',en:'03',boss:'月末締め',color:'#ebc58c'}];
export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
export function rng(seed){let n=seed>>>0;return()=>{n=(n*1664525+1013904223)>>>0;return n/4294967296;};}
export function lineDistance(p,a,b){const x=b.x-a.x,y=b.y-a.y,t=clamp(((p.x-a.x)*x+(p.y-a.y)*y)/(x*x+y*y||1),0,1);return Math.hypot(p.x-a.x-t*x,p.y-a.y-t*y);}
export const TYPES={paper:{hp:2,r:16},clip:{hp:6,r:22},source:{hp:7,r:27},return:{hp:3,r:18},bomb:{hp:2,r:19},node:{hp:14,r:24}};
export function inside(p,o,pad=0){return Math.abs(p.x-o.x)<o.w/2+pad&&Math.abs(p.y-o.y)<o.h/2+pad;}
export class Game{
 constructor(seed=1,mode='normal',width=W){this.seed=seed;this.mode=mode;this.width=clamp(width,280,1200);this.reset();}
 reset(){Object.assign(this,{phase:'ready',segment:'intro',stage:0,t:0,stageT:0,transition:1.5,x:this.width*.2,y:300,mx:0,my:0,vx:0,vy:0,angle:0,firing:false,charge:0,shot:0,lives:5,hits:0,invincible:0,score:0,combo:0,maxCombo:0,comboT:0,kills:0,energy:75,boost:0,guard:0,weapon:'single',route:0,routeHistory:[],level:0,stamps:0,progress:0,scroll:0,formation:0,waveAge:0,enemies:[],bullets:[],hazards:[],items:[],blocks:[],blasts:[],events:[],log:[],boss:null,nextId:1,win:false,reason:'',bursts:0,guards:0,reflections:0,chargedShots:0,flanks:0,chains:0,stageScores:[],maxHazards:0,choice:null});this.random=rng(this.seed);}
 event(type,data={}){this.events.push({type,...data});if(['stage','boss','stageClear','damage','end','route','burst','guard','reflect','charged','flank','sync','chain'].includes(type))this.log.push({t:+this.t.toFixed(2),stage:this.stage+1,type,...data});}
 start(){this.reset();this.phase='playing';this.enterStage(0);}
 resize(w){const k=clamp(w,280,1200)/this.width;this.width*=k;for(const a of [this,...this.enemies,...this.bullets,...this.hazards,...this.items,...this.blocks,...this.blasts,...(this.boss?[this.boss]:[])]){a.x*=k;if(a.vx)a.vx*=k;}this.move(0,0);}
 move(x,y){const n=Math.max(1,Math.hypot(x,y));this.mx=x/n;this.my=y/n;}
 aim(x,y,fire=true){if(Math.hypot(x,y)>.01)this.angle=Math.atan2(y,x);this.firing=fire;}
 get multiplier(){return Math.min(5,1+Math.floor(this.combo/8));}
 enterStage(s){this.stage=s;this.stageT=0;this.progress=0;this.formation=0;this.waveAge=0;this.segment='intro';this.transition=1.6;this.stageHits=this.hits;this.stageScore=this.score;this.enemies=[];this.blocks=[];this.hazards=[];this.bullets=[];this.blasts=[];this.items=[];this.choice=null;this.boss=null;this.x=this.width*.2;this.y=300;this.event('stage');}
 spawn(type,x,y,extra={}){if(this.enemies.length>=18)return;const e={id:this.nextId++,type,x,y,baseY:y,...TYPES[type],age:0,hit:0,attack:2.8,spawn:.7,speed:this.width*.055,returned:false,...extra};e.maxHp=e.hp;this.enemies.push(e);return e;}
 block(x,y,h,kind='shelf'){this.blocks.push({id:this.nextId++,x:this.width*x,y,w:30,h,hp:kind==='shelf'?16:999,kind,age:0,active:true});}
 branch(type){this.choice={type,age:0};for(const [i,y] of [180,420].entries())this.items.push({x:this.width*.76,y,type:'choice',option:i===0?'upper':'lower',choice:type,life:20});this.block(.76,300,90,'divider');}
 choose(option){if(!this.choice)return false;const type=this.choice.type;if(type==='route'&&option==='upper'&&this.energy<60){this.event('denied');return false;}
 if(type==='weapon')this.weapon=option==='upper'?'pierce':'spread';else{this.route=option==='upper'?1:2;if(this.route===1){this.energy-=60;this.score+=3000;}else this.lives=Math.min(5,this.lives+1);}
 this.routeHistory.push({stage:this.stage,type,option});this.items=this.items.filter(i=>i.type!=='choice');this.choice=null;this.event('route',{choice:option,kind:type});return true;}
 encounter(){const s=this.stage,f=this.formation++,w=this.width,j=this.random()>.5?1:-1;this.waveAge=0;const add=(t,x,y,extra)=>this.spawn(t,w*x,y,extra);
 if(s===0){
 if(f===0){add('paper',.78,300,{speed:w*.025,attack:99});add('paper',1,300,{attack:99});}
 if(f===1){add('clip',.76,300,{speed:w*.025});this.block(1.08,140,140);}
 if(f===2)this.branch('weapon');
 if(f===3){const src=add('source',.86,300);for(const y of [220,380])add('paper',.72,y,{owner:src.id});this.block(.58,300,85);}
 if(f===4){add('bomb',.8,300);for(let i=0;i<4;i++)add('paper',.91+i*.08,300+(i%2?48:-48));}
 if(f===5){for(let i=0;i<7;i++)add('paper',.83+i*.09,300+Math.sin(i)*110);}
 }else if(s===1){
 if(f===0){add('return',.9,190);add('clip',.91,410);this.block(.55,300,130,'shutter');}
 if(f===1){this.branch('route');}
 if(f===2){if(this.route===1){add('bomb',.83,200);add('source',.98,220);add('clip',.92,390);}else{this.block(.6,175,140);add('source',.89,350);add('paper',.95,440);}}
 if(f===3){for(const y of [190,410])add('node',.77,y,{pair:true,speed:0,hp:5,attack:4});}
 if(f===4){add('bomb',.82,300);add('return',.92,300+120*j);this.block(.55,300,110);}
 if(f===5){const src=add('source',.87,300+100*j);add('clip',.69,300+100*j,{owner:src.id});add('paper',.92,300-100*j);}
 }else{
 if(f===0){add('bomb',.84,300);add('clip',.98,300);this.block(.56,160,155);}
 if(f===1){this.block(.72,300,170,'shutter');add('source',.9,180);add('return',.92,420);}
 if(f===2){const src=add('source',.88,this.route===1?200:400);for(let i=0;i<3;i++)add('paper',.75+i*.08,src.y-50+i*50,{owner:src.id});add('bomb',.72,300);}
 if(f===3){for(let i=0;i<7;i++)add(i===3?'bomb':'paper',.85+i*.09,300+Math.sin(i*.8)*120);}
 }
 if(this.mode==='hard'&&f>2)add('return',1.05,300-130*j);this.event('formation',{number:f+1});}
 burst(){if(this.phase!=='playing'||['intro','clear'].includes(this.segment)||this.energy<60)return false;this.energy-=60;this.boost=.65;this.shot=0;this.bursts++;this.event('burst',{x:this.x,y:this.y});return true;}
 hold(){if(this.phase!=='playing'||['intro','clear'].includes(this.segment)||this.energy<35||this.guard>0)return false;this.energy-=35;this.guard=1.25;this.guards++;this.event('guard',{x:this.x,y:this.y});return true;}
 damage(reason){if(this.invincible>0||this.guard>0||this.phase!=='playing')return;this.lives--;this.hits++;this.invincible=1.4;this.combo=Math.floor(this.combo/2);this.event('damage',{x:this.x,y:this.y,reason});if(!this.lives)this.end(false,reason);}
 hit(e,n=1,shot={}){if(e.dead||e.dormant)return false;const heavy=shot.heavy,back=(shot.ox??this.x)>e.x+5;
 const protectedBy=this.enemies.find(a=>a.type==='source'&&a.id===e.owner&&!a.dead);if(protectedBy&&!heavy){this.event('armor',{x:e.x,y:e.y});return false;}
 if(e.type==='clip'&&!back&&!heavy){this.event('armor',{x:e.x,y:e.y});return false;}
 if(e===this.boss){if(this.stage===0&&!back&&e.open<=0&&!heavy){this.event('armor',{x:e.x,y:e.y});return false;}if(this.stage===1&&e.parts>0)return false;if(this.stage===2&&e.open<=0&&!shot.reflected){this.event('armor',{x:e.x,y:e.y});return false;}if(this.stage===0&&heavy)e.open=1.2;}
 if(back&&e.type==='clip'){this.flanks++;this.event('flank');}
 e.hp-=n;e.hit=.1;this.event('hit',{x:e.x,y:e.y});if(e.hp>0)return true;
 if(e.pair){e.hp=0;e.dormant=true;e.reboot=e.part?3.2:7;this.event('node',{x:e.x,y:e.y});if(!this.enemies.some(a=>a.pair&&!a.dormant&&!a.dead)){for(const a of this.enemies.filter(a=>a.pair)){a.dead=true;this.reward(a,300);}if(this.boss)this.boss.parts=0;this.event('sync');this.score+=1800;}return true;}
 e.dead=true;if(e===this.boss){this.clearStage();return true;}this.reward(e,e.type==='source'?400:180);
 if(e.type==='bomb'){this.blasts.push({x:e.x,y:e.y,r:76,left:.65,done:false});this.event('warning');}
 if(e.type==='source'){for(const a of this.enemies)if(a.owner===e.id&&!a.dead){a.dead=true;this.event('kill',{x:a.x,y:a.y,kind:a.type});}this.items.push({x:e.x,y:e.y,type:'energy',life:8});}
 return true;}
 reward(e,value){this.kills++;this.stamps++;this.combo++;this.comboT=4;this.maxCombo=Math.max(this.combo,this.maxCombo);this.score+=value*this.multiplier*(this.route===1?1.3:1);this.energy=clamp(this.energy+4,0,100);this.event('kill',{x:e.x,y:e.y,kind:e.type});if(this.kills%11===0)this.items.push({x:e.x,y:e.y,type:'energy',life:7});}
 spawnBoss(){this.segment='boss';this.bossAge=0;this.enemies=[];this.hazards=[];this.blocks=[];this.items=[];this.choice=null;this.bullets=[];const w=this.width;this.boss={id:this.nextId++,x:w*.7,y:300,r:30,hp:[48,44,85][this.stage],maxHp:[48,44,85][this.stage],age:0,attack:2,hit:0,parts:this.stage===1?2:0,open:0};if(this.stage===1){for(const y of [175,425])this.spawn('node',w*.73,y,{part:true,pair:true,hp:18,speed:0,attack:3});}if(this.stage===2)this.block(.45,this.route===1?160:440,110,'shelf');this.event('boss',{name:STAGES[this.stage].boss});}
 clearStage(){this.score+=5000*(this.stage+1);this.event('bossKill',{x:this.boss.x,y:this.boss.y});this.boss=null;this.enemies=[];this.hazards=[];this.blocks=[];this.bullets=[];this.blasts=[];this.segment='clear';this.transition=2.5;this.stageScores.push({stage:this.stage+1,score:this.score-this.stageScore,hits:this.hits-this.stageHits,seconds:+this.stageT.toFixed(1)});if(this.hits===this.stageHits)this.score+=1500;this.event('stageClear');}
 end(win,reason=''){if(this.phase==='ended')return;this.win=win;this.reason=reason;this.phase='ended';if(win)this.score=Math.round(this.score+this.lives*2000+Math.max(0,220-this.t)*70);this.event('end',{win,reason});}
 enemyShot(e,seal=false){if(this.hazards.length>=12)return;const angle=Math.atan2(this.y-e.y,this.x-e.x),speed=seal?115:145;this.hazards.push({x:e.x,y:e.y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,r:seal?11:6,life:7,owner:e.id,seal});this.event('attack',{x:e.x,y:e.y});}
 update(dt){if(this.phase!=='playing')return;dt=clamp(dt,0,.04);this.t+=dt;this.stageT+=dt;for(const k of ['invincible','boost','guard'])this[k]=Math.max(0,this[k]-dt);this.energy=clamp(this.energy+dt*5,0,100);this.comboT=Math.max(0,this.comboT-dt);if(!this.comboT)this.combo=0;
 const a=1-Math.exp(-25*dt);this.vx+=(this.mx*220-this.vx)*a;this.vy+=(this.my*220-this.vy)*a;this.x=clamp(this.x+this.vx*dt,22,this.width-24);this.y=clamp(this.y+this.vy*dt,76,529);
 if(['intro','clear'].includes(this.segment)){this.transition-=dt;if(this.transition<=0){if(this.segment==='intro'){this.segment='course';this.encounter();}else if(this.stage===2)this.end(true);else{this.lives=Math.min(5,this.lives+1);this.enterStage(this.stage+1);}}return;}
 this.waveAge+=dt;const speed=(26+this.x/this.width*17)*(this.choice?.4:1)*(this.route===1?1.12:1);if(this.segment==='course'){this.progress+=speed*dt;this.scroll+=speed*dt;const thresholds=this.stage===0?[0,100,215,365,520,680]:this.stage===1?[0,100,300,440,590,735]:[0,160,340,540];if(this.formation<thresholds.length&&this.progress>=thresholds[this.formation])this.encounter();if(this.progress>[850,910,740][this.stage]&&!this.choice&&!this.enemies.some(e=>e.pair&&!e.dead))this.spawnBoss();}
 for(const o of this.blocks){o.age+=dt;o.active=o.kind!=='shutter'||o.age%4<2.5;if(this.segment==='course')o.x-=speed*this.width/600*dt;if(o.active&&inside(this,o,9)){const px=o.w/2+10-Math.abs(this.x-o.x),py=o.h/2+10-Math.abs(this.y-o.y);if(px<py)this.x=o.x+(this.x<o.x?-1:1)*(o.w/2+10);else this.y=o.y+(this.y<o.y?-1:1)*(o.h/2+10);if(this.x<22){if(!o.crushed){this.damage('経路が詰まりました。');o.crushed=true;}this.x=22;this.y=clamp(o.y+(this.y<o.y?-1:1)*(o.h/2+16),76,529);}}}

 this.blocks=this.blocks.filter(o=>o.x>-40&&o.hp>0);
 if(this.choice)this.choice.age+=dt;
 for(const e of this.enemies){if(e.dead)continue;e.age+=dt;e.spawn-=dt;e.hit=Math.max(0,e.hit-dt);if(e.dormant){e.reboot-=dt*(this.guard>0?.25:1);if(e.reboot<=0){e.dormant=false;e.hp=e.maxHp;this.event('return',{x:e.x,y:e.y});}continue;}if(e.spawn>0)continue;e.attack-=dt;
 if(e.pair){e.x=this.width*.73;e.y=e.baseY+(e.part?Math.sin(this.t*.5)*16:0);}
 else if(e.type==='source'){if(e.x>this.width*.65)e.x-=e.speed*dt;if(e.attack<=0){this.spawn('paper',e.x-30,e.y+Math.sin(e.age*2)*65,{owner:e.id});e.attack=3.6;}}
 else if(e.type==='return'){e.x+=e.speed*(e.returned?1.7:-1)*dt;e.y=e.baseY+Math.sin(e.age*2)*30;if(e.x<this.width*.15&&!e.returned){e.returned=true;this.event('return',{x:e.x,y:e.y});}if(e.returned&&e.x>this.width*.85)e.returned=false;}
 else e.x-=e.speed*dt;
 if(e.type!=='paper'&&e.type!=='source'&&e.type!=='bomb'&&e.attack<=0){this.enemyShot(e);e.attack=this.mode==='hard'?2.9:3.8;}
 if(e.x<-30){e.dead=true;this.combo=0;this.damage('未処理があふれました。');}if(dist(this,e)<e.r+7)this.damage('書類に接触しました。');}
 const boss=this.boss;if(boss){boss.age+=dt;this.bossAge+=dt;boss.open=Math.max(0,boss.open-dt);boss.hit=Math.max(0,boss.hit-dt);boss.attack-=dt;boss.y=300+Math.sin(boss.age*.65)*(this.stage===0?100:35);if(boss.attack<=0){this.enemyShot(boss,this.stage===2);boss.attack=this.stage===2?2.7:2.6;}if(dist(this,boss)<37)this.damage('決裁装置に接触しました。');if(this.bossAge>65)this.end(false,'締切までに、あと一歩。');}
 if(!this.firing||this.guard>0)this.charge=clamp(this.charge+dt,0,1.1);this.shot-=dt;
 if((this.firing||this.boost>0)&&this.guard<=0&&this.shot<=0){const charged=this.charge>=1.05,heavy=charged||this.boost>0;const angles=this.weapon==='spread'&&!heavy?[-.18,0,.18]:[0];for(const da of angles){const angle=this.angle+da;this.bullets.push({x:this.x+Math.cos(angle)*24,y:this.y+Math.sin(angle)*24,vx:Math.cos(angle)*630,vy:Math.sin(angle)*630,life:2,damage:this.boost>0?3:charged?6:this.weapon==='spread'?.7:1,pierce:heavy?8:this.weapon==='pierce'?3:1,heavy,burst:this.boost>0,ox:this.x,ids:[]});}this.shot=this.boost>0?.08:.15;if(charged){this.chargedShots++;this.event('charged',{x:this.x,y:this.y});}this.charge=0;this.event('shot',{x:this.x,y:this.y});}
 for(const shot of this.bullets){const prev={x:shot.x,y:shot.y};shot.x+=shot.vx*dt;shot.y+=shot.vy*dt;shot.life-=dt;for(const o of this.blocks){if(o.active&&lineDistance(o,prev,shot)<Math.hypot(o.w,o.h)/2&&inside(shot,o,3)){if(shot.heavy&&o.kind==='shelf')o.hp-=shot.damage;shot.life=0;this.event('armor',{x:shot.x,y:shot.y});break;}}if(shot.life<=0)continue;const targets=[...this.enemies,...(this.boss?[this.boss]:[])];for(const e of targets){if(e.dead||e.dormant||e.spawn>0||shot.ids.includes(e.id))continue;if(lineDistance(e,prev,shot)<e.r+4){this.hit(e,shot.damage,shot);shot.ids.push(e.id);if(--shot.pierce<=0){shot.life=0;break;}}}}
 for(const h of this.hazards){h.life-=dt;if(h.reflected&&this.boss){const angle=Math.atan2(this.boss.y-h.y,this.boss.x-h.x);h.vx=Math.cos(angle)*400;h.vy=Math.sin(angle)*400;}h.x+=h.vx*dt;h.y+=h.vy*dt;if(h.life<=0)continue;
 if(this.guard>0&&dist(h,this)<72&&!h.reflected){if(h.seal){h.reflected=true;h.life=4;this.reflections++;this.energy=clamp(this.energy+5,0,100);this.event('reflect',{x:h.x,y:h.y});}else{h.life=0;this.event('cancel',{x:h.x,y:h.y});}continue;}
 if(h.reflected&&this.boss&&dist(h,this.boss)<42){this.boss.open=2.5;this.hit(this.boss,17,{reflected:true,heavy:true});h.life=0;continue;}
 if(!h.reflected&&dist(h,this)<h.r+6){h.life=0;this.damage('催促弾に被弾しました。');}for(const o of this.blocks)if(o.active&&inside(h,o)){h.life=0;break;}}
 for(const blast of this.blasts){blast.left-=dt;if(blast.left<=0&&!blast.done){blast.done=true;let count=0;for(const e of this.enemies)if(!e.dead&&dist(e,blast)<blast.r){this.hit(e,9,{heavy:true});count++;}if(this.boss&&dist(this.boss,blast)<blast.r)this.hit(this.boss,10,{heavy:true});if(dist(this,blast)<blast.r)this.damage('添付が、弾けました。');this.chains+=count;this.score+=count*350*this.multiplier;this.event('chain',{x:blast.x,y:blast.y,count});}}
 for(const i of this.items){i.life-=dt;if(i.type==='choice'){i.x=Math.max(this.width*.45,i.x-dt*this.width*.018);if(dist(this,i)<34)this.choose(i.option);}else{i.x-=this.width*.04*dt;if(dist(this,i)<25){i.life=0;this.energy=clamp(this.energy+24,0,100);this.score+=200;this.event('item',{x:i.x,y:i.y});}}}if(this.choice?.age>16)this.choose('lower');
 this.enemies=this.enemies.filter(e=>!e.dead);this.bullets=this.bullets.filter(b=>b.life>0&&b.x>-20&&b.x<this.width+30&&b.y>30&&b.y<570);this.hazards=this.hazards.filter(h=>h.life>0&&h.x>-20&&h.x<this.width+30&&h.y>30&&h.y<570);this.items=this.items.filter(i=>i.life>0);this.blasts=this.blasts.filter(b=>!b.done);this.maxHazards=Math.max(this.maxHazards,this.hazards.length);this.score=Math.round(this.score);
 }
 snapshot(){const {events,random,...s}=this;return JSON.parse(JSON.stringify(s));}
}
