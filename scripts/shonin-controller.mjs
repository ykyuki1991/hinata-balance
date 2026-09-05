// QA controller reads the same visible positions/telegraphs a player can see.
import {lineDistance,dist,blocksLine} from '../public/shonin-defense/engine.js';
export function decision(s,strategy='tactical'){
 if(strategy==='idle')return {x:0,y:0,burst:false};
 if(strategy==='circle'){const a=s.t*.9;return {x:Math.cos(a),y:Math.sin(a),burst:s.energy>=100};}
 if(strategy==='sweep')return {x:Math.sin(s.t*1.2)>0?1:-1,y:0,burst:false};
 let goal=null,goalValue=-Infinity;
 for(const e of s.enemies){if(e.spawn>0)continue;const value=(e.node?480:e.type==='relay'?370:180)-dist(s,e);if(value>goalValue){goalValue=value;goal=e;}}
 if(s.boss?.open){goal=s.boss;goalValue=200;}
 for(const i of s.items){const v=210-dist(s,i);if(v>goalValue){goal=i;goalValue=v;}}
 if(!goal)goal={x:240,y:350};
 let best=-Infinity,chosen={x:0,y:0};const candidates=[{x:0,y:0},...Array.from({length:24},(_,i)=>({x:Math.cos(i*Math.PI/12),y:Math.sin(i*Math.PI/12)}))];
 for(const v of candidates){let score=0;
  for(const dt of [.18,.4,.7]){const p={x:s.x+v.x*205*dt,y:s.y+v.y*205*dt};
   if(p.x<30||p.x>450||p.y<75||p.y>550)score-=800;
   for(const b of s.blocks){const d=dist(p,b);if(d<b.r+18)score-=600;}
   for(const e of s.enemies){if(e.spawn>dt)continue;const a=e.state==='rush'?e.angle:Math.atan2(s.y-e.y,s.x-e.x),speed=e.state==='rush'?310:['chaser','return'].includes(e.type)?70:0;const predicted={x:e.x+Math.cos(a)*speed*dt,y:e.y+Math.sin(a)*speed*dt};const d=dist(p,predicted);score-=Math.max(0,55-d)*9;}
   if(s.boss){const b=s.boss;const pred=b.state==='rush'?{x:b.x+Math.cos(b.angle)*b.speed*dt,y:b.y+Math.sin(b.angle)*b.speed*dt}:b;score-=Math.max(0,70-dist(p,pred))*10;}
   for(const h of s.hazards){if(h.life<dt)continue;const d=h.kind==='beam'?lineDistance(p,h,{x:h.tx,y:h.ty})-h.r:dist(p,{x:h.x+h.vx*dt,y:h.y+h.vy*dt});score-=Math.max(0,27-d)*16;}
   for(const w of s.warnings){if(w.left>dt+.3)continue;if(w.kind==='beam'||w.kind==='rush'){const d=lineDistance(p,w,{x:w.tx,y:w.ty});score-=Math.max(0,(w.kind==='beam'?(w.width||15)+22:40)-d)*9;}if(w.kind==='shot'){const a=Math.atan2(w.ty-w.y,w.tx-w.x);const bullet={x:w.x+Math.cos(a)*165*Math.max(0,dt-w.left),y:w.y+Math.sin(a)*165*Math.max(0,dt-w.left)};score-=Math.max(0,36-dist(p,bullet))*8;}}
  }
  const end={x:s.x+v.x*55,y:s.y+v.y*55};score-=dist(end,goal)*.5;
  if(blocksLine(end,goal,s.blocks))score-=70;
  // Avoid endless tangential orbiting: use inner routes to collect rewards.
  if(end.x<60||end.x>420||end.y<95||end.y>525)score-=25;
  if(score>best){best=score;chosen=v;}
 }
 const danger=s.hazards.some(h=>h.kind==='beam'?lineDistance(s,h,{x:h.tx,y:h.ty})<h.r+35:dist(s,h)<65)||s.enemies.some(e=>e.spawn<=0&&dist(s,e)<55);
 return {...chosen,burst:s.energy>=100&&(danger||s.enemies.filter(e=>e.spawn<=0&&dist(s,e)<110).length>=2)};
}
