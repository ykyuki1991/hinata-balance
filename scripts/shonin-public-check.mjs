import {chromium,devices} from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const root='https://ykyuki1991.github.io/hinata-balance/';const base=root+'shonin-defense/';
const files=['index.html','style.css','engine.js','game.js','render.js','audio.js','icon.svg','art/stage-1.svg','art/stage-2.svg','art/stage-3.svg'];
for(const file of files){const response=await fetch(base+file+'?v=2.0.0');assert.equal(response.status,200);assert.equal(await response.text(),await fs.readFile('public/shonin-defense/'+file,'utf8'));}
const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
try{const ctx=await browser.newContext(devices['iPhone 13']);const page=await ctx.newPage();await page.goto(root);await page.waitForFunction(async()=>!!(await navigator.serviceWorker.getRegistration())?.active);await page.goto(base);await page.locator('#start').waitFor();assert.match(await page.title(),/承認防衛線/);assert.equal(await page.evaluate(()=>typeof window.gameSnapshot),'undefined');const assets=await page.evaluate(()=>[...document.images].every(i=>i.complete&&i.naturalWidth>0));assert.ok(assets);const result={url:base,version:'2.0.0',checkedAt:new Date().toISOString(),publicFilesMatch:files,serviceWorkerCoexistence:true,diagnosticsHidden:true,imagesLoaded:true,physicalIPhone:false};console.log(JSON.stringify(result));await fs.writeFile('docs/shonin-v2-public-integrity.json',JSON.stringify(result,null,2));}finally{await browser.close();}
