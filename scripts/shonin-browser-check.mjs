import {chromium,webkit,devices} from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {decision} from './shonin-controller.mjs';
const base=process.env.GAME_URL||'http://127.0.0.1:5175/shonin-defense/index.html';
const isPublic=base.startsWith('https:');
const outputs=[];await fs.mkdir('.cache/shonin-v2',{recursive:true});
const scenarios=[['desktop',{viewport:{width:1440,height:1100}},'normal','pierce','shield'],['iphone',{...devices['iPhone 13'],viewport:{width:390,height:844}},'normal','wide','charge'],['small-phone',{...devices['iPhone SE'],viewport:{width:320,height:568}},'hard','pierce','shield'],['landscape',{...devices['iPhone 13 landscape'],viewport:{width:750,height:342}},'normal','wide','shield']];
for(const engine of (process.env.ENGINES||'chromium,webkit').split(',')){
 const browser=await(engine==='chromium'?chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true}):webkit.launch());
 try{for(const [name,options,mode,weapon,utility] of scenarios.filter(x=>!process.env.SCENARIO||x[0]===process.env.SCENARIO)){
  const ctx=await browser.newContext(options),page=await ctx.newPage(),errors=[],network=[];page.on('pageerror',e=>errors.push(String(e)));page.on('response',r=>{if(r.status()>=400)network.push({url:r.url(),status:r.status()});});await page.goto(base+'?qa=1');await page.clock.install();await page.locator('#start').waitFor();assert.equal(await page.locator('#game').count(),1);await page.screenshot({path:`.cache/shonin-v2/${isPublic?'public':'local'}-${engine}-${name}-title.png`});
  const layout=await page.evaluate(()=>({w:innerWidth,h:innerHeight,scrollWidth:document.documentElement.scrollWidth,button:document.getElementById('burst').getBoundingClientRect().bottom}));assert.ok(layout.scrollWidth<=layout.w);assert.ok(layout.button<=layout.h,JSON.stringify(layout));
  await page.locator('#'+mode).click();await page.locator('#sound').click();await page.locator('#start').click();await page.clock.runFor(2300);
  await page.locator('#pause').click();const before=(await page.evaluate(()=>gameSnapshot())).t;await page.clock.runFor(600);assert.equal((await page.evaluate(()=>gameSnapshot())).t,before);await page.getByRole('button',{name:/業務再開/}).click();
  let cdp=null;if(options.hasTouch&&engine==='chromium')cdp=await ctx.newCDPSession(page);const covered=new Set(),screens=new Set();let touchDown=false;
  for(let frame=0;frame<1400;frame++){
    const s=await page.evaluate(()=>gameSnapshot());covered.add(`${s.stage+1}:${s.segment}`);
    if(s.phase==='ended')break;
    if(s.phase==='upgrade'){if(cdp&&touchDown){await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});touchDown=false;}const id=s.stage===0?weapon:utility;await page.getByRole('button',{name:new RegExp(({wide:'並列承認',pierce:'直列決裁',shield:'代理承認',charge:'即時決裁'})[id])}).click();await page.clock.runFor(2200);continue;}
    const label=`${s.stage+1}-${s.segment}`;
    if((s.segment==='boss'&&s.bossTime>5||s.segment==='waves'&&s.stageT>14||s.segment==='clear')&&!screens.has(label)){screens.add(label);await page.screenshot({path:`.cache/shonin-v2/${isPublic?'public':'local'}-${engine}-${name}-${label}.png`});}
    const d=decision(s,'tactical'),box=await page.locator('#game').boundingBox();const point={x:box.x+d.x/480*box.width,y:box.y+box.height*.89};
    if(cdp){await cdp.send('Input.dispatchTouchEvent',{type:touchDown?'touchMove':'touchStart',touchPoints:[point]});touchDown=true;}else if(options.hasTouch)await page.touchscreen.tap(point.x,point.y);else await page.mouse.move(point.x,point.y);
    if(d.burst&&await page.locator('#burst').isEnabled()){if(cdp&&touchDown){await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});touchDown=false;}if(options.hasTouch){const bb=await page.locator('#burst').boundingBox();await page.touchscreen.tap(bb.x+bb.width/2,bb.y+bb.height/2);}else await page.keyboard.press('Space');}
    await page.clock.runFor(180);
  }
  if(cdp&&touchDown)await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  const final=await page.evaluate(()=>gameSnapshot());console.log(JSON.stringify({engine,name,mode,win:final.win,reason:final.reason,t:final.t,score:final.score,hits:final.hits,performance:final.performance}));await page.screenshot({path:`.cache/shonin-v2/${isPublic?'public':'local'}-${engine}-${name}-end.png`});assert.equal(final.win,true,JSON.stringify(final.log));assert.equal(final.stage,2);for(const i of [1,2,3]){assert.ok(covered.has(`${i}:waves`));assert.ok(covered.has(`${i}:boss`));assert.ok(covered.has(`${i}:clear`));}
  await page.getByRole('button',{name:/もう一度出勤/}).click();await page.clock.runFor(100);const retry=await page.evaluate(()=>gameSnapshot());assert.equal(retry.seed,final.seed);assert.equal(retry.stage,0);assert.equal(retry.lives,4);assert.equal(retry.weapon,'single');assert.equal(retry.score,0);
  // Lose through ordinary game rules, then retry again. No writable test hook.
  if(name==='desktop'||name==='iphone'){
    const box=await page.locator('#game').boundingBox();if(options.hasTouch)await page.touchscreen.tap(box.x+box.width/2,box.y+box.height*.9);else await page.mouse.move(box.x+box.width/2,box.y+box.height*.9);
    for(let i=0;i<20&&(await page.evaluate(()=>gameSnapshot())).phase==='playing';i++)await page.clock.runFor(5000);
    assert.equal((await page.evaluate(()=>gameSnapshot())).win,false);await page.getByRole('heading',{name:'未処理、持ち越し。'}).waitFor();await page.screenshot({path:`.cache/shonin-v2/${isPublic?'public':'local'}-${engine}-${name}-gameover.png`});await page.locator('#start').click();await page.clock.runFor(100);assert.equal((await page.evaluate(()=>gameSnapshot())).lives,4);
  }
  await page.reload();assert.equal(Number((await page.locator('#best').innerText()).replaceAll(',','')),final.records.normal);assert.deepEqual(errors,[]);assert.deepEqual(network,[]);
  outputs.push({engine,name,mode,weapon,utility,version:final.version,base,layout,covered:[...covered],win:final.win,score:final.score,hits:final.hits,seconds:final.t,perfects:final.perfects,performance:final.performance,log:final.log,retry:true,gameOverTested:['desktop','iphone'].includes(name),errors,network});await fs.writeFile(`docs/shonin-v2-${isPublic?'public':'local'}-${engine}-${name}.json`,JSON.stringify(outputs.at(-1),null,2));await ctx.close();
 }}finally{await browser.close();}
}
console.log(JSON.stringify({completed:outputs.length,base,physicalIPhone:false}));
