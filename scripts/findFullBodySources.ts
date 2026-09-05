import fs from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import * as cheerio from 'cheerio';
import {members} from '../src/data/members';
const category='https://store.plusmember.jp/hinatazaka46/products/list.php?category_id=2197';
await fs.mkdir('.cache/fullbody',{recursive:true});
async function get(url:string){const r=await fetch(url,{signal:AbortSignal.timeout(25000)});if(!r.ok)throw Error(`${r.status} ${url}`);return Buffer.from(await r.arrayBuffer());}
const $=cheerio.load((await get(category)).toString());
const prior=existsSync('scripts/fullbody-sources.json')?JSON.parse(await fs.readFile('scripts/fullbody-sources.json','utf8')).members:[];
const result=[];
for(const member of members){
 const candidates:{page:string;url:string;title:string}[]=[];
 $('figure.thumb img').each((_,el)=>{const e=$(el),title=e.attr('alt')||'';if(title.replace(/\s/g,'').endsWith(member.name.replace(/\s/g,''))){const url=e.attr('style')?.match(/url\((.*?)\)/)?.[1];const page=e.closest('a').attr('href');if(url&&page)candidates.push({page:new URL(page,category).href,url,title});}});
 const reviewed=prior.find((m:any)=>m.id===member.id&&m.fullBodyReviewed);
 if(reviewed)candidates.unshift({page:reviewed.page,url:reviewed.url,title:reviewed.title});
 const attempts=[];let selected;
 for(const candidate of candidates){try{const key=createHash('sha256').update(candidate.url).digest('hex').slice(0,12);const raw=`.cache/fullbody/${member.id}-${key}.jpg`;if(!existsSync(raw))await fs.writeFile(raw,await get(candidate.url));selected={...candidate,raw};break;}catch(e){attempts.push({url:candidate.url,error:String(e)});}}
 if(!selected)throw Error(`No full-body candidate for ${member.name}; retain current assets`);
 result.push({...reviewed,id:member.id,name:member.name,...selected,candidates,attempts,fullBodyReviewed:reviewed?.url===selected.url});console.log(member.name,selected.title);
}
await fs.writeFile('scripts/fullbody-sources.json',JSON.stringify({discovered:new Date().toISOString(),category,members:result},null,2));
