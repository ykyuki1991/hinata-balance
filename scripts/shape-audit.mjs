import {chromium} from '@playwright/test';import fs from 'node:fs/promises';
const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
try{const page=await browser.newPage();await page.goto('http://127.0.0.1:5173');const result=await page.evaluate(async()=>{
 const {Game}=await import('/src/game/engine.ts');const {members}=await import('/src/data/members.ts');const results=[];
 for(const m of members){const trials=[];for(const degrees of [-90,-45,0,45,90]){let result;const g=new Game(document.createElement('canvas'),'NORMAL',[m],{bgm:false,se:false,vibration:false,names:false,guide:false},()=>{},r=>result=r);cancelAnimationFrame(g.raf);g.pos={x:195,y:490};g.angle=degrees*Math.PI/180;g.drop();for(let i=0;i<1000&&g.phase==='settling';i++)g.step(1/60);trials.push({angle:degrees,placed:g.count===1,time:g.seconds,reason:g.failureReason});g.dispose();await new Promise(r=>setTimeout(r,0));}results.push({id:m.id,name:m.name,mass:m.mass,width:m.width,height:m.height,trials});}
 return results;
});await fs.writeFile('.cache/playtests/shape-audit.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result.map(r=>({id:r.id,success:r.trials.filter(t=>t.placed).map(t=>t.angle),maxWait:Math.max(...r.trials.map(t=>t.time))})),null,2));}finally{await browser.close();}
