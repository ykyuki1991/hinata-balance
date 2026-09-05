export function decision(s,strategy='adaptive',path='left'){
 let tx=s.width/2,ty=425;
 const targets=[...s.enemies.filter(e=>e.state==='pending'),...s.ports.filter(p=>p.queue.length&&p.open<=0)];
 if(strategy==='adaptive'){
 targets.sort((a,b)=>{const value=e=>e.kind==='port'?(e.queue.length>=2?-8:6):e.kind==='revision'&&!e.revised?e.left-5:e.kind==='urgent'?e.left-7:e.kind==='review'?e.left-3:e.left;return value(a)-value(b);});
 if(targets[0])tx=targets[0].x;
 if(s.choice)tx=s.width*(path==='left'?.25:.75);
 for(const h of s.hazards){if(h.lane){if(h.warn<.4&&Math.abs(s.x-h.x)<35){tx=s.x+(s.x<s.width/2?55:-55);}continue;}if(h.warn>0)continue;const future={x:h.x+h.vx*.45,y:h.y+h.vy*.45};if(Math.hypot(future.x-s.x,future.y-s.y)<40){const side=s.x>s.width-85?-1:s.x<85?1:h.x<s.x?1:-1;tx=s.x+side*65;ty=440;}}
 }else if(strategy==='sweep')tx=s.width*(.5+Math.sin(s.t*.75)*.32);
 return {x:Math.max(-1,Math.min(1,(tx-s.x)/18)),y:Math.max(-1,Math.min(1,(ty-s.y)/18)),tx,ty};
}
