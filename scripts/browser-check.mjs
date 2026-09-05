import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
try{
 const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true});
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.addInitScript(()=>{let seed=42;Math.random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};});
 await page.goto('http://127.0.0.1:5173');await page.locator('h1').waitFor();await page.screenshot({path:'/tmp/hinata-title.png'});
 assert.ok(await page.locator('.hero-person').evaluateAll(imgs=>imgs.every(i=>i.complete&&i.naturalWidth>0)));
 for(const viewport of [{width:390,height:844},{width:1440,height:900},{width:480,height:1100}]){await page.setViewportSize(viewport);await page.getByRole('button',{name:/NORMAL/}).click();await page.waitForTimeout(150);const r=await page.locator('canvas').boundingBox();assert.ok(Math.abs(r.width/r.height-390/650)<.002,JSON.stringify(r));await page.goto('http://127.0.0.1:5173');}await page.setViewportSize({width:390,height:844});
 const cdp=await page.context().newCDPSession(page);
 for(const mode of ['NORMAL','HARD','ALL MEMBERS']){
  await page.goto('http://127.0.0.1:5173');await page.getByRole('button',{name:new RegExp(mode)}).click();
  const box=await page.locator('canvas').boundingBox();const x=box.x+box.width/2;const y1=box.y+box.height*90/650,y2=box.y+box.height*490/650;
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y:y1}]});
  for(let i=1;i<=12;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:y1+(y2-y1)*i/12}]});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await page.waitForFunction(()=>document.querySelector('.score strong')?.textContent?.trim().startsWith('1'),{},{timeout:12000});
  assert.equal(await page.evaluate(()=>window.scrollY),0);
  assert.ok(await page.locator('canvas').evaluate(el=>getComputedStyle(el).touchAction==='none'));
  if(mode==='NORMAL')await page.screenshot({path:'/tmp/hinata-play.png'});
 }
 await page.goto('http://127.0.0.1:5173');await page.getByRole('button',{name:/NORMAL/}).click();
 const canvas=page.locator('canvas');
 await canvas.press('q');assert.ok(Math.abs(await page.evaluate(()=>window.__hinataGame.angle)*180/Math.PI+15)<.01);
 await canvas.press('e');assert.ok(Math.abs(await page.evaluate(()=>window.__hinataGame.angle))<.001);
 await page.getByRole('button',{name:'右へ回転'}).tap();assert.ok(Math.abs(await page.evaluate(()=>window.__hinataGame.angle)*180/Math.PI-15)<.01);
 await page.getByRole('button',{name:'左へ回転'}).tap();
 const box=await canvas.boundingBox();const xy=(x,y)=>({x:box.x+x/390*box.width,y:box.y+y/650*box.height});
 const start=xy(195,90),deep=xy(195,550),safe=xy(195,490);
 await page.mouse.move(start.x,start.y);await page.mouse.down();await page.mouse.move(deep.x,deep.y,{steps:8});await page.mouse.up();
 assert.equal(await page.evaluate(()=>window.__hinataGame.pieces.length),0);assert.match(await page.locator('.game-hint').innerText(),/重な/);
 const held=xy(195,530);await page.mouse.move(held.x,held.y);await page.mouse.down();await page.mouse.move(safe.x,safe.y,{steps:8});await page.mouse.up();
 await page.waitForFunction(()=>window.__hinataGame.count===1);
 assert.ok(await page.evaluate(()=>window.__hinataGame.score)>0);
 await page.getByRole('button',{name:'モード選択へ',exact:true}).click();const pausedAt=await page.evaluate(()=>window.__hinataGame.seconds);await page.waitForTimeout(500);assert.equal(await page.evaluate(()=>window.__hinataGame.seconds),pausedAt);await page.getByRole('button',{name:'プレイを続ける'}).click();
 const replayOrder=await page.evaluate(()=>window.__hinataGame.queue.map(m=>m.id));
 const next=xy(195,90),edge=xy(370,450);await page.mouse.move(next.x,next.y);await page.mouse.down();await page.mouse.move(edge.x,edge.y,{steps:8});await page.mouse.up();await page.getByRole('heading',{name:'GAME OVER'}).waitFor({timeout:18000});
 assert.match(await page.locator('.result').innerText(),/落下/);const retry=page.getByRole('button',{name:/もう一度遊ぶ/});const rb=await retry.boundingBox();assert.ok(rb.y+rb.height<844);const retryAt=Date.now();await retry.click();await canvas.waitFor();assert.ok(Date.now()-retryAt<2000);assert.equal(await page.evaluate(()=>window.__hinataGame.count),0);assert.equal(await page.evaluate(()=>window.__hinataGame.score),0);assert.deepEqual(await page.evaluate(()=>window.__hinataGame.queue.map(m=>m.id)),replayOrder);
 await page.goto('http://127.0.0.1:5173');
 const physics=await page.evaluate(async()=>{
  const {Game}=await import('/src/game/engine.ts');const {members}=await import('/src/data/members.ts');const {saveResult,read}=await import('/src/storage.ts');
  const settings={bgm:false,se:false,vibration:false,names:true,guide:true};const results=[];
  // Deterministic small pieces in a balanced single row isolate the real count/stability/end/result pipeline.
  // Real member shapes and asymmetric board loads are checked separately below and in seesaw.test.ts.
  for(const mode of ['NORMAL','HARD','ALL MEMBERS']){
   let result;const fixture=members.map(m=>({...m,width:8,height:16,mass:.2,collisionShape:[{x:0,y:0},{x:8,y:0},{x:8,y:16},{x:0,y:16}],centerOfMassOffsetY:0}));
   const game=new Game(document.createElement('canvas'),mode,fixture,settings,()=>{},r=>{result=r;saveResult(r);});cancelAnimationFrame(game.raf);
   while(!result){game.pos={x:195+(game.count===0?0:(game.count%2?-1:1)*Math.ceil(game.count/2)*11),y:535};game.drop();for(let i=0;i<1200&&!result&&game.phase!=='ready';i++)game.step(1/60);if(!result&&game.phase!=='ready')throw Error('settlement stalled');}
   results.push({mode,clear:result.clear,count:result.count,target:game.queue.length});game.dispose();
  }
  const actual=[];for(const m of members){const g=new Game(document.createElement('canvas'),'NORMAL',[m],settings,()=>{},()=>{});cancelAnimationFrame(g.raf);g.pos={x:195,y:490};g.drop();for(let i=0;i<1200&&g.phase!=='ended';i++)g.step(1/60);actual.push({id:m.id,placed:g.count===1});g.dispose();}
  const angles=[];for(const x of [120,195,270]){const g=new Game(document.createElement('canvas'),'NORMAL',members,settings,()=>{},()=>{});cancelAnimationFrame(g.raf);g.queue=[members.find(m=>m.id==='24'),...members.filter(m=>m.id!=='24')];g.pos={x,y:490};g.drop();for(let i=0;i<150&&g.phase!=='ended';i++)g.step(1/60);angles.push({x,angle:g.platform.angle,static:g.platform.isStatic});g.dispose();}
  const g=new Game(document.createElement('canvas'),'NORMAL',members,settings,()=>{},r=>{results.push({fall:!r.clear});saveResult(r);});cancelAnimationFrame(g.raf);g.pos={x:5,y:520};g.drop();for(let i=0;i<1200&&g.phase!=='ended';i++)g.step(1/60);g.dispose();
  return {results,actual,angles,records:read('hinata-records',{})};
 });
 assert.ok(physics.results.slice(0,3).every(r=>r.clear&&r.count===r.target),JSON.stringify(physics.results));assert.ok(physics.results.at(-1).fall);assert.ok(physics.actual.every(r=>r.placed),JSON.stringify(physics.actual));assert.ok(physics.angles[0].angle<-.025&&physics.angles[2].angle>.025,JSON.stringify(physics.angles));assert.ok(Math.abs(physics.angles[1].angle)<.03);
 await page.reload();await page.getByRole('button',{name:/RECORD/}).click();assert.equal(await page.locator('.record-card').count(),3);assert.match(await page.locator('.record-card').first().innerText(),/10/);assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('hinata-records'))),physics.records);
 await page.screenshot({path:'/tmp/hinata-record.png'});
 await page.goto('http://127.0.0.1:4173');await page.evaluate(async()=>{await navigator.serviceWorker.ready;});await page.reload();await page.waitForFunction(()=>!!navigator.serviceWorker.controller);
 const manifest=await page.evaluate(async()=>await(await fetch('/manifest.webmanifest')).json());assert.equal(manifest.display,'standalone');assert.equal(manifest.orientation,'portrait');assert.ok(!await page.evaluate(()=>('__hinataGame' in window)));
 await page.context().setOffline(true);await page.reload();await page.locator('h1').waitFor();await page.waitForFunction(()=>Array.from(document.querySelectorAll('.hero-person')).every(i=>i.complete&&i.naturalWidth>0));
 await page.getByRole('button',{name:/ALL MEMBERS/}).click();await page.locator('canvas').waitFor();
 console.log(JSON.stringify({touchRotation:true,keyboardRotation:true,overlapRejected:true,pausedPhysics:true,retryUnder2s:true,clears:physics.results,fullBodyPiecesPlaced:physics.actual.length,realPieceAngles:physics.angles,offlinePWA:true,browserErrors:errors},null,2));assert.deepEqual(errors,[]);
}finally{await browser.close();}
