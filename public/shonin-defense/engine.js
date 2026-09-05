export const VERSION='6.0.0',H=600,W=420;
export const STAGES=[{name:'未処理、到着。',boss:'受付分岐',color:'#9de2cc',en:'01'},{name:'それぞれの審議へ。',boss:'並行審議',color:'#bbcaf5',en:'02'},{name:'決裁、その先へ。',boss:'決裁後連携',color:'#ebc58c',en:'03'}];
export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
export function rng(seed){let n=seed>>>0;return()=>{n=(n*1664525+1013904223)>>>0;return n/4294967296;};}
export function lineDistance(p,a,b){const x=b.x-a.x,y=b.y-a.y,t=clamp(((p.x-a.x)*x+(p.y-a.y)*y)/(x*x+y*y||1),0,1);return Math.hypot(p.x-a.x-t*x,p.y-a.y-t*y);}
export class Game{
 constructor(seed=1,mode='normal',width=W){this.seed=seed;this.mode=mode;this.width=clamp(width,280,1100);this.reset();}
 reset(){Object.assign(this,{phase:'ready',stage:0,segment:'intro',t:0,stageT:0,x:this.width/2,y:417,mx:0,my:0,goal:null,angle:-Math.PI/2,shot:0,lives:5,hits:0,invincible:0,score:0,combo:0,comboT:0,maxCombo:0,kills:0,delivered:0,returned:0,reapplied:0,joined:0,receipts:0,holds:0,holdCooldown:0,held:null,targetId:null,locked:null,enemies:[],bullets:[],hazards:[],packets:[],notifications:[],ports:[],jobs:[],events:[],log:[],stageScores:[],route:0,routeHistory:[],choice:null,boss:null,bossAge:0,nextId:1,win:false,reason:'',transition:1.3,spawnTimer:0,spawnIndex:0});this.random=rng(this.seed);}
 event(type,data={}){this.events.push({type,...data});if(!['shot','hit','armor'].includes(type))this.log.push({t:+this.t.toFixed(2),stage:this.stage+1,type,...data});}
 start(){this.reset();this.phase='playing';this.enterStage(0);}
 get multiplier(){return Math.min(5,1+Math.floor(this.combo/6));}
 move(x,y){const n=Math.max(1,Math.hypot(x,y));this.mx=x/n;this.my=y/n;if(x||y)this.goal=null;}
 drag(dx,dy){this.mx=this.my=0;const base=this.goal||this;this.goal={x:clamp(base.x+dx,24,this.width-24),y:clamp(base.y+dy,235,450)};}
 release(){this.goal=null;this.mx=this.my=0;}
 resize(w){const k=clamp(w,280,1100)/this.width;this.width*=k;for(const a of [this,...this.enemies,...this.packets,...this.hazards,...this.bullets,...this.ports,...this.notifications])a.x*=k;if(this.held)this.held.x*=k;this.release();}
 enterStage(stage){this.stage=stage;this.stageT=0;this.stageHits=this.hits;this.stageScore=this.score;this.segment='intro';this.transition=1.5;this.enemies=[];this.bullets=[];this.hazards=[];this.packets=[];this.jobs=[];this.ports=[];this.notifications=[];this.held=null;this.choice=null;this.boss=null;this.spawnIndex=0;this.spawnTimer=.2;this.x=this.width/2;this.y=417;this.targetId=null;this.event('stage');}
 spawn(kind,lane=.5,extra={}){const e={id:this.nextId++,job:0,kind,x:this.width*lane,y:this.stage===2?192:120,lane,hp:kind==='review'?5:kind==='urgent'?4:3,maxHp:kind==='review'?5:kind==='urgent'?4:3,state:'pending',age:0,left:kind==='urgent'?10:18,attack:kind==='urgent'?2.2:5.5,hit:0,revised:false,boss:false,...extra};this.enemies.push(e);this.event('arrival',{id:e.id,kind});return e;}
 select(x,y){const e=this.targets().filter(e=>dist(e,{x,y})<44).sort((a,b)=>dist(a,{x,y})-dist(b,{x,y}))[0];if(e)this.locked={id:e.id,left:4};}
 targets(){return [...this.enemies.filter(e=>e.state==='pending'),...this.ports.filter(p=>p.queue.length&&p.open<=0)];}
 target(){const available=this.targets().filter(e=>Math.abs(e.x-this.x)<this.width*.24&&e.y<this.y+20);const lock=available.find(e=>e.id===this.locked?.id);return lock||available.sort((a,b)=>Math.abs(a.x-this.x)-Math.abs(b.x-this.x)||(b.y-a.y))[0]||null;}
 hold(){if(this.phase!=='playing'||!['course','boss'].includes(this.segment))return false;if(this.held){const e=this.held;e.state='pending';e.x=this.width*e.lane;e.y=220;this.enemies.push(e);this.held=null;this.event('resumeCase',{id:e.id});return true;}const e=this.enemies.find(e=>e.id===this.targetId&&e.state==='pending');if(!e||this.holdCooldown>0)return false;this.held=e;this.enemies=this.enemies.filter(a=>a!==e);e.state='held';this.holdCooldown=8;this.holds++;this.event('hold',{id:e.id,x:e.x,y:e.y});return true;}
 choose(option){if(!this.choice)return;this.route=option==='left'?1:2;this.routeHistory.push({stage:this.stage,option});this.choice=null;this.event('route',{option});}
 reward(value,x,y){this.combo++;this.maxCombo=Math.max(this.combo,this.maxCombo);this.comboT=5;this.score+=value*this.multiplier;this.event('stamp',{x,y});}
 approve(e){if(e.kind==='port'){e.open=3.2;e.hp=e.maxHp;this.event('portOpen',{port:e.index,x:e.x,y:e.y});return;}
 if(e.kind==='revision'&&!e.revised){e.state='returning';e.travel=0;e.from={x:e.x,y:e.y};this.returned++;this.event('return',{id:e.id,x:e.x,y:e.y});return;}
 e.state='forward';e.travel=0;e.from={x:e.x,y:e.y};this.kills++;this.reward(e.revised?260:e.kind==='urgent'?220:130,e.x,e.y);this.event('approved',{id:e.id,job:e.job});}
 hit(e,n=1){if(e.kind!=='port'&&e.state!=='pending')return;e.hp-=n;e.hit=.09;this.event('hit',{x:e.x,y:e.y});if(e.hp<=0)this.approve(e);}
 finishCase(e){e.state='done';if(e.kind==='review'){const job=this.jobs.find(j=>j.id===e.job);if(job&&!job.done){job.approved++;this.event('branchApproved',{job:job.id,id:e.id});if(job.approved===2){job.done=true;this.joined++;this.event('join',{job:job.id,x:this.width/2,y:98});this.deliver(job.boss,350);}}return;}
 if(e.kind==='parallel'){const job={id:e.id,approved:0,done:false,boss:e.boss};this.jobs.push(job);for(const lane of [.25,.75])this.spawn('review',lane,{job:e.id,boss:e.boss,y:180,left:19,attack:4});this.event('split',{id:e.id});return;}
 if(this.stage===2){for(let i=0;i<3;i++)this.packets.push({id:this.nextId++,x:e.x,y:e.y,port:i,travel:0,from:{x:e.x,y:e.y},boss:e.boss});this.event('dispatch',{id:e.id});}else this.deliver(e.boss,180);}
 deliver(boss,value=180){this.delivered++;this.reward(value,this.width/2,80);this.event('delivered');if(boss&&this.boss)this.boss.done++;}
 damage(reason){if(this.invincible>0||this.phase!=='playing')return;this.lives--;this.hits++;this.invincible=1.5;this.combo=0;this.event('damage',{x:this.x,y:this.y,reason});if(this.lives<=0)this.end(false,reason);}
 shotFrom(e){if(this.hazards.length>=24)return;const a=Math.atan2(this.y-e.y,this.x-e.x),v=this.mode==='hard'?140:108;this.hazards.push({x:e.x,y:e.y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,life:5,r:5,warn:.55});this.event('warning',{x:e.x,y:e.y});}
 courseSpawn(){const i=this.spawnIndex++,stage=this.stage;const lanes=[.5,.23,.77,.23,.77,.5,.23,.77];let kind=stage===0?['request','revision','urgent','request','request','revision','urgent','request'][i%8]:stage===1?['parallel','urgent','revision','request','parallel','urgent'][i%6]:['request','urgent','revision','request','urgent'][i%5];this.spawn(kind,i<2?lanes[i%8]:this.random()>.5?lanes[i%8]:1-lanes[i%8],{attack:stage===0&&i<2?99:kind==='urgent'?2.2:5.5});if(i>=3&&i%3===0)this.spawn('urgent',lanes[i%8]<.5?.77:.23,{left:12});if(i%3===1)this.notifications.push({x:this.width*.08,y:60,age:0});}
 makePorts(){this.ports=[.19,.5,.81].map((lane,index)=>({id:this.nextId++,kind:'port',index,x:this.width*lane,y:117,hp:5,maxHp:5,open:0,queue:[],hit:0}));}
 spawnBoss(){this.segment='boss';this.bossAge=0;this.spawnIndex=0;this.spawnTimer=.5;this.boss={done:0,total:this.stage===0?4:this.stage===1?3:9};this.event('boss',{name:STAGES[this.stage].boss});if(this.stage===2)this.makePorts();}
 bossSpawn(){const i=this.spawnIndex++;if(this.stage===0){if(i<4)this.spawn(i===1?'revision':i===2?'urgent':this.route===2?'parallel':'request',i%2?.75:.25,{boss:true,left:23});}
 if(this.stage===1&&i<3)this.spawn('parallel',i%2?.73:.27,{boss:true,left:22});
 if(this.stage===2&&i<3)this.spawn(i===1?'revision':'request',[.5,.23,.77][i],{boss:true,left:24});}
 clearStage(){this.segment='clear';this.transition=2.2;this.hazards=[];this.bullets=[];this.held=null;this.enemies=[];this.packets=[];this.score+=3000*(this.stage+1);this.stageScores.push({stage:this.stage+1,score:this.score-this.stageScore,hits:this.hits-this.stageHits,seconds:+this.stageT.toFixed(1)});this.event('stageClear');}
 end(win,reason=''){if(this.phase==='ended')return;this.phase='ended';this.win=win;this.reason=reason;if(win)this.score+=this.lives*1500+Math.round(Math.max(0,190-this.t)*50);this.event('end',{win,reason});}
 update(dt){if(this.phase!=='playing')return;dt=clamp(dt,0,.04);this.t+=dt;this.stageT+=dt;this.invincible=Math.max(0,this.invincible-dt);this.holdCooldown=Math.max(0,this.holdCooldown-dt);this.comboT=Math.max(0,this.comboT-dt);if(!this.comboT)this.combo=0;
 if(this.goal){const d=dist(this,this.goal),step=Math.min(d,dt*350);if(d>.01){this.x+=(this.goal.x-this.x)/d*step;this.y+=(this.goal.y-this.y)/d*step;}}else{this.x+=this.mx*dt*260;this.y+=this.my*dt*240;}this.x=clamp(this.x,24,this.width-24);this.y=clamp(this.y,235,450);
 if(['intro','clear'].includes(this.segment)){this.transition-=dt;if(this.transition<=0){if(this.segment==='intro'){this.segment='course';if(this.stage===2)this.makePorts();}else if(this.stage<2){this.lives=Math.min(5,this.lives+1);this.enterStage(this.stage+1);}else this.end(true);}return;}
 if(this.locked){this.locked.left-=dt;if(this.locked.left<=0)this.locked=null;}
 if(this.segment==='course'){this.spawnTimer-=dt;if(this.spawnTimer<=0&&this.stageT<27){this.courseSpawn();this.spawnTimer=this.stage===0&&this.spawnIndex===2?1.8:this.mode==='hard'?2.8:3.4;}if(this.stage===0&&this.stageT>11&&!this.route&&!this.choice){this.choice={age:0};this.event('choice');}if(this.choice){this.choice.age+=dt;if(this.choice.age>2&&this.x<this.width*.34)this.choose('left');else if(this.choice.age>2&&this.x>this.width*.66)this.choose('right');else if(this.choice.age>9)this.choose('left');}
 if(this.stageT>29&&!this.enemies.some(e=>e.state!=='done')&&!this.packets.length&&!this.held&&!this.ports.some(p=>p.queue.length))this.spawnBoss();
 }else{this.bossAge+=dt;this.spawnTimer-=dt;if(this.spawnTimer<=0){this.bossSpawn();this.spawnTimer=this.stage===1?5:3.6;}if(this.boss.done>=this.boss.total){this.clearStage();return;}if(this.bossAge>62){this.end(false,'あと一件が、待っていました。');return;}}
 for(const p of this.ports){p.open=Math.max(0,p.open-dt);p.hit=Math.max(0,p.hit-dt);if(p.queue.length&&p.open<=0){p.wait=(p.wait||0)+dt;if(p.wait>7){this.shotFrom(p);p.wait=3.5;}}else p.wait=0;if(p.open>0&&p.queue.length){p.send=(p.send||0)-dt;if(p.send<=0){const a=p.queue.shift();this.receipts++;this.event('receipt',{port:p.index,x:p.x,y:p.y});this.deliver(a.boss,200);p.send=.45;}}}
 for(const e of this.enemies){e.age+=dt;e.hit=Math.max(0,e.hit-dt);if(e.state==='pending'){e.y=Math.min(e.kind==='review'?270:355,e.y+dt*(e.kind==='urgent'?26:17));e.left-=dt;e.attack-=dt;if(e.attack<=0){this.shotFrom(e);e.attack=this.mode==='hard'?2.5:3.6;}if(e.left<=0){this.damage('未処理が、あふれました。');e.left=9;this.shotFrom(e);}if(dist(e,this)<22)this.damage('案件が、詰まっています。');}
 if(e.state==='returning'){e.travel+=dt/1.25;e.x=e.from.x+(this.width*.055-e.from.x)*Math.min(1,e.travel);e.y=e.from.y+(70-e.from.y)*Math.min(1,e.travel);if(e.travel>=1){e.state='correcting';e.wait=1.2;}}
 else if(e.state==='correcting'){e.wait-=dt;if(e.wait<=0){e.state='pending';e.revised=true;e.hp=e.maxHp=3;e.x=this.width*e.lane;e.y=this.stage===2?192:120;e.left=18;e.attack=4;this.reapplied++;this.event('reapply',{id:e.id,x:e.x,y:e.y});}}
 else if(e.state==='forward'){e.travel+=dt/1.05;e.x=e.from.x+(this.width/2-e.from.x)*Math.min(1,e.travel);e.y=e.from.y+(90-e.from.y)*Math.min(1,e.travel);if(e.travel>=1)this.finishCase(e);}}
 for(const p of this.packets){p.travel+=dt;const to=this.ports[p.port];p.x=p.from.x+(to.x-p.from.x)*Math.min(1,p.travel);p.y=p.from.y+(to.y-p.from.y)*Math.min(1,p.travel);if(p.travel>=1){to.queue.push({boss:p.boss});p.dead=true;}}
 const target=this.target();this.targetId=target?.id??null;this.shot-=dt;if(target)this.angle=Math.atan2(target.y-this.y,target.x-this.x);else this.angle=-Math.PI/2;
 if(this.shot<=0){if(target){this.bullets.push({x:this.x,y:this.y-18,id:target.id,life:1.8});this.event('shot',{x:this.x,y:this.y});}this.shot=.19;}
 for(const b of this.bullets){b.life-=dt;const target=this.targets().find(e=>e.id===b.id);if(!target){b.life=0;continue;}const d=dist(b,target),step=dt*650;if(d<step+15){this.hit(target);b.life=0;}else{b.x+=(target.x-b.x)/d*step;b.y+=(target.y-b.y)/d*step;}}
 for(const h of this.hazards){h.warn-=dt;if(h.warn>0)continue;h.x+=h.vx*dt;h.y+=h.vy*dt;h.life-=dt;if(dist(h,this)<10){h.life=0;this.damage('催促が、届きました。');}}
 for(const n of this.notifications){n.age+=dt;n.y+=dt*72;}
 this.enemies=this.enemies.filter(e=>e.state!=='done');this.packets=this.packets.filter(p=>!p.dead);this.bullets=this.bullets.filter(b=>b.life>0);this.hazards=this.hazards.filter(h=>h.life>0&&h.y<480&&h.x>-20&&h.x<this.width+20);this.notifications=this.notifications.filter(n=>n.y<450);this.score=Math.round(this.score);
 }
 snapshot(){const {events,random,...state}=this;return JSON.parse(JSON.stringify(state));}
}
