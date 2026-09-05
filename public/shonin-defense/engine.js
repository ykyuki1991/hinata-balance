export const W = 480;
export class Game {
  constructor(height = 620, random = Math.random) { this.h = height; this.random = random; this.reset(); }
  reset() { Object.assign(this,{phase:'ready',win:false,t:0,score:0,kills:0,combo:0,maxCombo:0,lastKill:-9,lives:3,x:240,target:240,shot:0,spawn:0,wave:0,enemies:[],bullets:[],hazards:[],items:[],events:[],power:0,invincible:0,charges:1,charge:0,bossSpawned:false,bossKilled:false,nextId:1}); }
  event(type,data={}) { this.events.push({type,...data}); }
  start() { this.reset(); this.phase='playing'; this.event('notice',{text:'業務開始。承認、どうぞ。'}); }
  setTarget(x) { this.target=Math.max(24,Math.min(W-24,x)); }
  end(win=false) { if(this.phase!=='playing')return; this.phase='ended'; this.win=win; this.event('end',{win}); }
  damage(x) { if(this.invincible>0)return; this.lives--;this.combo=0;this.invincible=1.5;this.event('damage',{x,y:this.h-60});if(this.lives<=0)this.end(false); }
  addWave() { const tier=Math.min(3,Math.floor(this.t/17));this.wave++;this.event('wave',{wave:this.wave,tier}); const count=5;const center=240+(this.random()-.5)*45;for(let row=0;row<(tier>0?2:1);row++)for(let col=0;col<count;col++){const r=this.random();const type=r<.18+tier*.035?'return':r<.38+tier*.025?'urgent':'normal';this.enemies.push({id:this.nextId++,type,x:center+(col-2)*75,y:-38-row*62,hp:type==='return'?2:1,w:48,h:48,seed:this.random()*6.28,speed:(type==='urgent'?35:22)+tier*6,age:0,returned:false});} }
  kill(e,burst=false) { if(e.dead)return; e.dead=true;this.kills++;this.combo++;this.maxCombo=Math.max(this.maxCombo,this.combo);this.lastKill=this.t;const points=e.type==='boss'?3500:e.type==='return'?250:e.type==='urgent'?150:100;this.score+=points*Math.min(5,1+Math.floor(this.combo/8));this.event('kill',{x:e.x,y:e.y,type:e.type,label:burst?'否認':'承認'});if(this.charges===0){this.charge++;if(this.charge>=15){this.charges=1;this.charge=0;this.event('notice',{text:'一括否認、もう一度。'});}}if(this.kills%10===0&&e.type!=='boss')this.items.push({x:e.x,y:e.y});if(e.type==='boss'){this.bossKilled=true;this.end(true);}else if(this.combo%8===0)this.event('combo',{count:this.combo}); }
  hit(e,burst=false) { if(e.dead)return;if(e.type==='return'&&!e.returned&&!burst){e.returned=true;e.hp=1;e.y=Math.max(50,e.y-105);e.speed*=1.5;this.event('return',{x:e.x,y:e.y});return;} e.hp-=burst?(e.type==='boss'?14:9):1;this.event('hit',{x:e.x,y:e.y});if(e.hp<=0)this.kill(e,burst); }
  burst() { if(this.phase!=='playing'||!this.charges)return false;this.charges=0;this.charge=0;for(const e of this.enemies)if(e.y>-10)this.hit(e,true);this.hazards=[];this.event('burst');return true; }
  update(dt) { if(this.phase!=='playing')return;dt=Math.min(.05,dt);this.t+=dt;this.invincible=Math.max(0,this.invincible-dt);this.power=Math.max(0,this.power-dt);if(this.t-this.lastKill>2.7)this.combo=0;this.x+=(this.target-this.x)*Math.min(1,dt*18);this.shot-=dt;this.spawn-=dt;
    if(this.shot<=0){this.shot=this.power>0?.15:.18;for(const vx of this.power>0?[-145,0,145]:[0])this.bullets.push({x:this.x,y:this.h-74,vx});this.event('shot');}
    if(this.t<52&&this.spawn<=0){this.addWave();this.spawn=Math.max(4.8,7.7-this.t*.045);}
    if(this.t>=52&&!this.bossSpawned){this.bossSpawned=true;this.enemies=this.enemies.filter(e=>!e.dead);this.enemies.push({id:this.nextId++,type:'boss',x:240,y:87,w:156,h:76,hp:65,maxHp:65,speed:0,age:0,attack:1.8,seed:0});this.event('notice',{text:'月末締め、到着。'});}
    for(const e of this.enemies){if(e.dead)continue;e.age+=dt;if(e.type==='boss'){e.x=240+Math.sin(e.age*1.25)*140;e.y=95+Math.sin(e.age*.7)*12;e.attack-=dt;if(e.attack<=0){e.attack=1.6;for(const vx of [-55,0,55])this.hazards.push({x:e.x,y:e.y+45,vx,speed:130});}}else{e.y+=e.speed*dt*(this.h-130)/490;e.x+=Math.cos(e.age*1.8+e.seed)*dt*21;e.x=Math.max(28,Math.min(452,e.x));if(e.y>this.h-82){e.dead=true;this.damage(e.x);}}
    }
    for(const b of this.bullets){b.y-=510*dt*this.h/620;b.x+=b.vx*dt;for(const e of this.enemies){if(!e.dead&&Math.abs(b.x-e.x)<e.w/2+3&&Math.abs(b.y-e.y)<e.h/2+9){this.hit(e);b.y=-100;break;}}}
    for(const b of this.hazards){b.y+=b.speed*dt*(this.h-130)/490;b.x+=b.vx*dt;if(Math.abs(b.x-this.x)<21&&Math.abs(b.y-(this.h-59))<24){b.y=this.h+50;this.damage(b.x);}}
    for(const i of this.items){i.y+=115*dt;if(Math.abs(i.x-this.x)<34&&Math.abs(i.y-(this.h-59))<33){i.y=this.h+60;this.power=7;this.event('notice',{text:'コーヒー補給。処理速度 UP！'});this.event('power');}}
    this.enemies=this.enemies.filter(e=>!e.dead);this.bullets=this.bullets.filter(b=>b.y>-20&&b.x>-20&&b.x<500);this.hazards=this.hazards.filter(b=>b.y<this.h+20);this.items=this.items.filter(i=>i.y<this.h+30);if(this.t>=75)this.end(false);
  }
}
