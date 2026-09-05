// Reads state; sends only normal input. Strategies are compared, not win cheats.
export function decision(s,strategy='adaptive',path='lower'){
 const out={x:0,y:0,ax:1,ay:0,fire:true,burst:false,guard:false};const w=s.width;
 if(strategy==='idle'){out.fire=false;return out;}
 const all=s.enemies.filter(e=>!e.dead&&e.spawn<=0&&e.x<w+10&&!e.dormant);let target=all.sort((a,b)=>a.x-b.x)[0];let tx=w*.22,ty=target?.y??300;
 if(strategy==='baseline'){target=all.sort((a,b)=>(a.type==='source'?-80:0)+a.x-(b.type==='source'?-80:0)-b.x)[0]||s.boss;ty=target?.y??300;if(target){out.ax=target.x-s.x;out.ay=target.y-s.y;}out.burst=s.energy>=60&&!!target&&target.type!=='paper';}
 else{
 if(s.choice){const option=s.choice.type==='weapon'?path:s.energy>=60&&path==='upper'?'upper':'lower';const item=s.items.find(i=>i.option===option);if(item){tx=item.x;ty=item.y;}}
 else if(s.boss){const b=s.boss;
 if(s.stage===0){target=b;tx=w*.23;ty=b.y;out.fire=s.charge>=1.05||b.open>.15;out.burst=s.energy>=60&&b.open<=0;}
 if(s.stage===1){const nodes=all.filter(e=>e.pair);const sleeping=s.enemies.some(e=>e.pair&&e.dormant);if(nodes.length){target=sleeping?nodes[0]:nodes.find(e=>e.hp>6)||nodes[0];ty=target.y;out.burst=sleeping&&s.energy>=60;out.guard=sleeping&&s.energy>=35&&s.enemies.some(e=>e.dormant&&e.reboot<1.5);}else{target=b;ty=b.y;out.burst=s.energy>=60;}}
 if(s.stage===2){target=b;ty=b.y;tx=w*.25;const seal=s.hazards.filter(h=>h.seal&&!h.reflected).sort((a,b)=>Math.hypot(a.x-s.x,a.y-s.y)-Math.hypot(b.x-s.x,b.y-s.y))[0];out.guard=!!seal&&Math.hypot(seal.x-s.x,seal.y-s.y)<90&&s.energy>=35;out.fire=b.open>.15;out.burst=s.energy>=60&&b.open>.8;}
 }else{
 const priority=e=>e.x+Math.abs(e.y-s.y)*.2-(e.type==='source'?170:0)+(e.type==='bomb'&&!s.enemies.some(a=>a!==e&&Math.hypot(a.x-e.x,a.y-e.y)<80)?120:0);
 target=all.sort((a,b)=>priority(a)-priority(b))[0];ty=target?.y??300;
 if(target?.type==='clip'&&s.x<target.x){out.fire=s.charge>=1.05;out.burst=s.energy>=80;}
 if(target?.pair){const nodes=all.filter(e=>e.pair);target=nodes.find(e=>e.hp>2)||nodes[0];ty=target.y;}
 if(target?.type==='bomb'&&Math.hypot(target.x-s.x,target.y-s.y)<105){ty=target.y>300?target.y-125:target.y+125;out.fire=false;}
 if(target?.type==='source'&&s.energy>=85&&!s.choice)out.burst=true;
 }
 if(target){const lead=target.type==='paper'?.15:0;out.ax=target.x-(target.speed||0)*lead-s.x;out.ay=target.y-s.y;}
 // Shelves require an actual route around their ends; they block both sides' fire.
 for(const o of s.blocks.filter(o=>o.active)){
 const crossing=(s.x<o.x&&tx>o.x)||(s.x>o.x&&tx<o.x);
 if((crossing||Math.abs(s.x-o.x)<55)&&Math.abs(s.y-o.y)<o.h/2+22){ty=ty>=o.y?o.y+o.h/2+40:o.y-o.h/2-40;tx=s.x;}
 if(target&&target.x>s.x&&o.x>s.x&&o.x<target.x&&Math.abs(ty-o.y)<o.h/2+25)ty=o.y<300?o.y+o.h/2+40:o.y-o.h/2-40;
 }
 for(const b of s.blasts)if(Math.hypot(b.x-s.x,b.y-s.y)<b.r+25)ty=b.y<300?b.y+b.r+50:b.y-b.r-50;
 for(const h of s.hazards.filter(h=>!h.reflected&&!h.seal)){if(Math.hypot(h.x-s.x,h.y-s.y)<45){ty=s.y+(h.y<s.y?65:-65);if(s.energy>=70)out.guard=true;}}
 }
 const dx=tx-s.x,dy=ty-s.y;out.x=Math.abs(dx)>8?Math.max(-1,Math.min(1,dx/35)):0;out.y=Math.abs(dy)>5?Math.max(-1,Math.min(1,dy/30)):0;
 return out;
}
