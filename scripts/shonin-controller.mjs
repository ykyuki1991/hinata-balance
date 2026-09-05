// QA strategies use read-only snapshots; all browser movement goes through input events.
export function decision(s,strategy='tactical'){
  if(strategy==='idle')return {x:240,burst:false};
  if(strategy==='sweep')return {x:240+Math.sin(s.t*1.6)*190,burst:s.energy>=100&&s.hazards.length>9};
  let target=null;
  const danger=s.enemies.filter(e=>e.y>390).sort((a,b)=>b.y-a.y)[0];
  if(danger)target={x:danger.x,weight:10};
  else if(s.boss){const b=s.boss,flight=(s.y-27-b.y)/680,x=240+Math.sin((b.age+flight)*.7)*100;if(s.stage===0&&!b.open){const n=b.nodes.filter(n=>n.hp>0).sort((a,b)=>Math.abs(x+a.side*72-s.x)-Math.abs(x+b.side*72-s.x))[0];if(n)target={x:x+n.side*72,weight:7};}else target={x:x+(s.stage===1?Math.sin((b.age+flight)*1.1)*38:s.stage===2?Math.sin((b.age+flight)*.85)*48:0),weight:b.open?7:2};}
  else {const list=s.enemies.filter(e=>e.y>5).sort((a,b)=>{const va=(a.type==='relay'&&!a.shot?220:0)+a.y-Math.abs(a.x-s.x)*.35,vb=(b.type==='relay'&&!b.shot?220:0)+b.y-Math.abs(b.x-s.x)*.35;return vb-va;});if(list[0])target={x:list[0].x,weight:7};}
  if(strategy==='aim')return {x:target?.x??240,burst:s.energy>=100&&s.hazards.length>15};
  let best=-Infinity,bestX=s.x,riskAtCurrent=0;
  for(let x=24;x<=456;x+=8){let score=target?target.weight*Math.exp(-Math.pow((x-target.x)/35,2)):0;score-=Math.abs(x-s.x)*.003;
    for(const b of s.hazards){if(b.kind==='beam'){if(Math.abs(x-b.x)<b.r+12)score-=100;if((s.x-b.x)*(x-b.x)<0&&Math.abs(s.x-b.x)>b.r+6)score-=120;continue;}if(b.vy<=0)continue;const hitTime=(s.y-b.y)/b.vy;if(hitTime<-.08||hitTime>2.1)continue;const hx=b.x+b.vx*hitTime;const reachable=s.x+Math.sign(x-s.x)*Math.min(Math.abs(x-s.x),490*Math.max(0,hitTime));const dist=Math.abs(hx-reachable);if(dist<44){const risk=42*Math.exp(-Math.pow(dist/(b.r+13),2))*(hitTime<.15?1.5:1);score-=risk;if(Math.abs(s.x-hx)<18&&hitTime<.45)riskAtCurrent++;}}
    for(const w of s.warnings){if(w.kind==='beam'&&Math.abs(x-w.x)<w.width/2+14)score-=70;}
    for(const item of s.items)if(item.y>s.y-150)score+=3*Math.exp(-Math.pow((x-item.x)/35,2));
    if(score>best){best=score;bestX=x;}
  }
  return {x:bestX,burst:s.energy>=100&&(best<-7||riskAtCurrent>2||s.hazards.length>=16||(s.boss?.open&&s.boss.hp<8))};
}
