import {chromium,webkit,devices} from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const base=process.env.GAME_URL||'http://127.0.0.1:5174/shonin-defense/index.html';
const outputs=[];
await fs.mkdir('.cache/shonin',{recursive:true});
for(const engine of (process.env.ENGINES||'chromium,webkit').split(',')){
 const browser=await (engine==='chromium'?chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true}):webkit.launch());
 try{
  for(const [name,options] of [['desktop',{viewport:{width:1440,height:1000}}],['iphone',devices['iPhone 13']],['small-phone',{...devices['iPhone SE'],viewport:{width:375,height:667}}],['landscape',{...devices['iPhone 13 landscape']}]] ){
   const context=await browser.newContext(options);const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(String(e)));const response=await page.goto(base+'?qa=1');assert.equal(response.status(),200);await page.locator('#start').waitFor();await page.screenshot({path:`.cache/shonin/${engine}-${name}-start.png`});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   await page.clock.install();await page.getByRole('button',{name:/業務開始/}).click();await page.clock.runFor(150);let state=await page.evaluate(()=>gameSnapshot());assert.equal(state.phase,'playing');const box=await page.locator('canvas').boundingBox();
   if(options.hasTouch){
    if(engine==='chromium'){const cdp=await context.newCDPSession(page);await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:box.x+box.width*.8,y:box.y+box.height*.8}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:box.x+box.width*.2,y:box.y+box.height*.8}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await cdp.detach();}else{await page.touchscreen.tap(box.x+box.width*.2,box.y+box.height*.8);}
    await page.clock.runFor(350);state=await page.evaluate(()=>gameSnapshot());assert.ok(state.target<110);assert.ok(state.x<115);
   }else{await page.keyboard.down('ArrowRight');await page.clock.runFor(400);await page.keyboard.up('ArrowRight');state=await page.evaluate(()=>gameSnapshot());assert.ok(state.x>330);}

   await page.getByRole('button',{name:'一時停止'}).click();const t=(await page.evaluate(()=>gameSnapshot())).t;await page.clock.runFor(1000);assert.equal((await page.evaluate(()=>gameSnapshot())).t,t);await page.getByRole('button',{name:/業務再開/}).click();
   if(options.hasTouch)await page.locator('#burst').tap();else await page.keyboard.press('Space');await page.clock.runFor(100);assert.equal((await page.evaluate(()=>gameSnapshot())).charges,0);
   await page.screenshot({path:`.cache/shonin/${engine}-${name}-playing.png`});
   // Natural loss: leave the ship at the edge. Advance animation frames without modifying game state.
   await page.mouse.move(box.x+box.width*.04,box.y+box.height*.8);for(let n=0;n<16&&(await page.evaluate(()=>gameSnapshot())).phase==='playing';n++)await page.clock.runFor(5000);assert.equal((await page.evaluate(()=>gameSnapshot())).phase,'ended');await page.getByRole('heading',{name:'未処理、持ち越し。'}).waitFor();await page.screenshot({path:`.cache/shonin/${engine}-${name}-result.png`});await page.getByRole('button',{name:/もう一度出勤/}).click();await page.clock.runFor(100);state=await page.evaluate(()=>gameSnapshot());assert.equal(state.phase,'playing');assert.equal(state.lives,3);assert.equal(state.charges,1);assert.equal(state.score,0);assert.ok(state.t<1);assert.deepEqual(errors,[]);
   if(name==='iphone'){await page.setViewportSize({width:844,height:390});await page.clock.runFor(100);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.setViewportSize({width:390,height:844});await page.clock.runFor(100);assert.equal((await page.evaluate(()=>gameSnapshot())).phase,'playing');}
   outputs.push({engine,name,url:base,http:response.status(),start:true,movement:true,burst:true,pause:true,naturalGameOver:true,retry:true,noHorizontalOverflow:true,errors});await context.close();console.log(`${engine} ${name}: passed`);
  }
 }finally{await browser.close();}
}
await fs.writeFile('docs/shonin-browser-check.json',JSON.stringify({checkedAt:new Date().toISOString(),physicalIPhone:false,results:outputs},null,2));
