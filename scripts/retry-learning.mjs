import {chromium} from '@playwright/test';import assert from 'node:assert/strict';import fs from 'node:fs/promises';
const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
try{const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
await page.addInitScript(()=>{let seed=42;Math.random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};});
await page.goto('http://127.0.0.1:5173');await page.getByRole('button',{name:/NORMAL/}).click();
const order=await page.evaluate(()=>window.__hinataGame.queue.map(m=>m.id));const runs=[];const rotated=true;
for(const learned of [false,true]){const round=learned?'round4-retry':'round4-first',mode='NORMAL',seed=42;const run={placements:[]};
 for(let n=0;n<27;n++){
  const state=await page.evaluate(()=>{const g=window.__hinataGame;return {phase:g.phase,count:g.count,time:g.seconds,camera:g.camera,pos:g.pos,member:g.queue[g.count],bodies:g.pieces.map(p=>({bounds:p.body.bounds,position:p.body.position})),tilt:g.platform.angle,boardY:g.platform.position.y};});
  if(state.phase==='ended')break;
  const x=learned?[195,115,275,155,235][n%5]:(rotated?[195,105,285,150,240,195,110,280,150,240,195]:[195,135,255,85,305,165,225,110,280,195])[n% (rotated?11:10)];
  const angle=rotated?(learned&&x<195?-90:90):0;
  if(rotated){for(let k=0;k<6;k++)await page.getByRole('button',{name:angle<0?'左へ回転':'右へ回転'}).click();}
  const halfW=rotated?state.member.height/2:state.member.width/2;
  const halfH=rotated?state.member.width/2:state.member.height/2;
  const surface=Math.min(state.boardY-8+(x-195)*Math.tan(state.tilt),...state.bodies.filter(p=>p.bounds.max.x>x-halfW&&p.bounds.min.x<x+halfW).map(p=>p.bounds.min.y));
  const y=Math.max(35-state.camera,surface-halfH-8);
  const box=await page.locator('canvas').boundingBox();const coord=(x,y)=>({x:box.x+x/390*box.width,y:box.y+(y+state.camera)/650*box.height});const from=coord(state.pos.x,state.pos.y),to=coord(x,y);
  await page.mouse.move(from.x,from.y);await page.mouse.down();await page.mouse.move(to.x,to.y,{steps:14});await page.mouse.up();
  await page.waitForFunction(()=>window.__hinataGame.phase!=='settling',null,{timeout:23000});
  const after=await page.evaluate(()=>{const g=window.__hinataGame;return {phase:g.phase,count:g.count,time:g.seconds,tilt:g.platform.angle,score:g.score,reason:g.failureReason,pieces:g.pieces.map(p=>({id:p.member.id,x:p.body.position.x,y:p.body.position.y,angle:p.body.angle}))};});
  run.placements.push({id:state.member.id,x,y,angle,wait:after.time-state.time,...after});
  await page.screenshot({path:`.cache/playtests/${round}-${mode.replaceAll(' ','')}-${seed}-${n}.png`});
  if(after.phase==='ended')break;
 }

run.result=await page.locator('main').innerText();runs.push(run);console.log(JSON.stringify({learned,count:run.placements.at(-1).count,score:run.placements.at(-1).score,result:run.result.slice(0,200)}));
if(!learned){const started=Date.now();await page.getByRole('button',{name:/もう一度遊ぶ/}).click();await page.locator('canvas').waitFor();assert.ok(Date.now()-started<2000);assert.deepEqual(await page.evaluate(()=>window.__hinataGame.queue.map(m=>m.id)),order);assert.equal(await page.evaluate(()=>window.__hinataGame.score),0);}
}
assert.equal(runs[1].placements.at(-1).count,10);assert.ok(runs[1].placements.at(-1).score>runs[0].placements.at(-1).score);await fs.writeFile('.cache/playtests/round4.json',JSON.stringify(runs,null,2));
}finally{await browser.close();}
