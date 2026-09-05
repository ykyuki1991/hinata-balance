import {chromium} from '@playwright/test';
import fs from 'node:fs/promises';
const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
const results=[];await fs.mkdir('.cache/live',{recursive:true});
try{for(const [mode,seed,strategy] of [['NORMAL',42,'B'],['NORMAL',42,'C'],['NORMAL',11,'C'],['HARD',11,'C'],['HARD',42,'C'],['ALL MEMBERS',11,'C']]){
 const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});await page.addInitScript(seed=>{Math.random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};},seed);await page.goto('http://127.0.0.1:5173');await page.getByRole('button',{name:new RegExp(mode)}).click();const placements=[];
 for(let n=0;n<27;n++){
  const plan=await page.evaluate(async(strategy)=>{const g=window.__hinataGame;if(g.phase==='ended')return null;const {choose}=await import('/scripts/strategy-controller.ts');return {choice:choose(g,strategy),pos:g.pos,camera:g.camera,member:g.queue[g.count].name};},strategy);if(!plan)break;
  const degrees=Math.round(plan.choice.angle*180/Math.PI);for(let k=0;k<Math.abs(degrees)/15;k++)await page.getByRole('button',{name:degrees<0?'左へ回転':'右へ回転'}).click();
  const live=await page.evaluate(()=>({pos:window.__hinataGame.pos,camera:window.__hinataGame.camera}));const b=await page.locator('canvas').boundingBox();const xy=(x,y)=>({x:b.x+x/390*b.width,y:b.y+(y+live.camera)/650*b.height});const from=xy(live.pos.x,live.pos.y),to=xy(plan.choice.x,plan.choice.y);
  await page.mouse.move(from.x,from.y);await page.mouse.down();await page.mouse.move(to.x,to.y,{steps:8});await page.mouse.up();await page.waitForFunction(()=>window.__hinataGame.phase!=='settling',null,{timeout:18000});await page.waitForTimeout(600);
  const state=await page.evaluate(()=>{const g=window.__hinataGame;return {count:g.count,phase:g.phase,score:g.score,tilt:g.platform.angle*180/Math.PI,reason:g.failureReason,order:g.queue.map(m=>m.id),seconds:g.seconds,hint:g.hint};});placements.push({...plan.choice,member:plan.member,...state});await page.screenshot({path:`.cache/live/${mode.replaceAll(' ','')}-${seed}-${strategy}-${n}.png`});if(state.phase==='ended'||state.hint)break;
 }
 const result={mode,seed,strategy,placements};results.push(result);console.log(JSON.stringify({mode,seed,strategy,...placements.at(-1)}));await fs.writeFile('.cache/live/results.json',JSON.stringify(results,null,2));await page.close();
}}finally{await browser.close();}
