// Test player: reads only the public snapshot and sends movement/action inputs.
export function decision(s,strategy='tactical'){
 if(strategy==='idle')return {x:0,y:0,burst:false};
 if(strategy==='sweep')return {x:0,y:Math.sin(s.t*1.8)>.0?1:-1,burst:s.energy>=100};
 const targets=s.enemies.filter(e=>!e.dead&&e.x<s.width*1.05&&e.x>s.x+12);
 if(s.boss&&!s.boss.parts)targets.push(s.boss);
 const cost=e=>Math.abs(e.y+(e.weak||0)-s.y)*.35+e.x-(e.type==='source'?70:0)-(e.part?35:0);
 targets.sort((a,b)=>cost(a)-cost(b));const e=targets[0];let tx=s.width*.19,ty=e?e.y+(e.weak||0):300;
 if(e&&e.x<s.width*.25)tx=30;
 // Nearby hazards off our firing line can be evaded with a small forward step.
 for(const h of s.hazards)if(Math.hypot(h.x-s.x,h.y-s.y)<38&&Math.abs(h.y-s.y)>12){tx=Math.min(s.width*.45,s.x+70);}
 const dx=tx-s.x,dy=ty-s.y;
 return {x:Math.abs(dx)>10?Math.max(-1,Math.min(1,dx/40)):0,y:Math.abs(dy)>5?Math.max(-1,Math.min(1,dy/35)):0,burst:s.energy>=100&&!!e&&(e.part||e===s.boss||targets.length>3||e.type==='clip'||e.type==='source')};
}
