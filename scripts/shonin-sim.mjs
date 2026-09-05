import {Game} from '../public/shonin-defense/engine.js';
import {decision} from './shonin-controller.mjs';
import fs from 'node:fs/promises';
const results=[];
for(const mode of ['normal','hard'])for(const strategy of ['idle','sweep','aim','tactical'])for(const seed of [1,997,8712,44677,998111,51234]){
 const g=new Game(seed,mode);g.start();let tick=0;
 while(g.t<260&&g.phase!=='ended'){
  if(g.phase==='upgrade')g.chooseUpgrade(g.stage===0?'pierce':'shield');
  if(tick++%12===0){const d=decision(g.snapshot(),strategy);g.setTarget(d.x);if(d.burst)g.burst();}
  g.update(1/120);g.events=[];
 }
 results.push({mode,strategy,seed,win:g.win,stage:g.stage+1,t:+g.t.toFixed(1),score:g.score,hits:g.hits,kills:g.kills,perfects:g.perfects,maxCombo:g.maxCombo,reason:g.reason,maxHazards:g.maxHazards,log:g.log});
}
await fs.mkdir('.cache/shonin-v2',{recursive:true});await fs.writeFile('.cache/shonin-v2/balance-detail.json',JSON.stringify(results,null,2));await fs.writeFile('docs/shonin-v2-balance.json',JSON.stringify(results.map(({log,...summary})=>summary),null,2));
for(const mode of ['normal','hard'])for(const strategy of ['idle','sweep','aim','tactical']){const rs=results.filter(r=>r.mode===mode&&r.strategy===strategy);console.log({mode,strategy,wins:rs.filter(x=>x.win).length,score:rs.map(x=>x.score),stage:rs.map(x=>x.stage),time:rs.map(x=>x.t),reason:rs.map(x=>x.reason)});}
