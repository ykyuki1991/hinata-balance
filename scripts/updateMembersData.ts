import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import {members as previous} from '../src/data/members';
import type {Member} from '../src/types';
// Sources are curated, solo full-body photographs from each member's public official blog.
// Run prepareBlogPhotos.py and visually review every output before regenerating sprites.
const sources=JSON.parse(await fs.readFile('scripts/photo-sources.json','utf8'));
function hull(points:{x:number;y:number}[]){const sorted=[...points].sort((a,b)=>a.x-b.x||a.y-b.y);const cross=(o:any,a:any,b:any)=>(a.x-o.x)*(b.y-o.y)-(a.y-o.y)*(b.x-o.x);const lo:typeof points=[],hi:typeof points=[];for(const p of sorted){while(lo.length>1&&cross(lo.at(-2),lo.at(-1),p)<=0)lo.pop();lo.push(p);}for(const p of sorted.reverse()){while(hi.length>1&&cross(hi.at(-2),hi.at(-1),p)<=0)hi.pop();hi.push(p);}return lo.slice(0,-1).concat(hi.slice(0,-1));}
const output:Member[]=[],report=[];
for(const m of previous){
 const s=sources.find((s:any)=>s.id===m.id);if(!s)throw Error(`Missing reviewed photograph: ${m.name}`);
 const {data,info}=await sharp(s.cutout).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 let left=info.width,top=info.height,right=0,bottom=0;
 for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++)if(data[(y*info.width+x)*4+3]>40){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
 left=Math.max(0,left-3);top=Math.max(0,top-3);right=Math.min(info.width-1,right+3);bottom=Math.min(info.height-1,bottom+3);
 const image=await sharp(s.cutout).extract({left,top,width:right-left+1,height:bottom-top+1}).resize({height:480}).webp({quality:92}).toBuffer();
 const imagePath=`/assets/members/${m.id}-${createHash('sha256').update(image).digest('hex').slice(0,12)}.webp`;
 await fs.writeFile(`public${imagePath}`,image);
 const pixels=await sharp(image).ensureAlpha().raw().toBuffer({resolveWithObject:true});const W=pixels.info.width,H=pixels.info.height;
 const height=W/H>.75?72:86,width=height*W/H,points:{x:number;y:number}[]=[];
 // Sample the actual photographed silhouette. Keep pose/asymmetry; flatten only the last 4% at the feet.
 for(let y=0;y<H;y+=6){let l=W,r=-1;for(let x=0;x<W;x++)if(pixels.data[(y*W+x)*4+3]>100){l=Math.min(l,x);r=Math.max(r,x);}if(r>=l){const yy=y>H*.96?height-1:y/H*height;points.push({x:l/W*width,y:yy},{x:r/W*width,y:yy});}}
 const collisionShape=hull(points);const mass=Number(Math.max(.65,Math.min(1.35,.65+width*.01)).toFixed(3));
 output.push({...m,image:imagePath,width,height,mass,collisionShape,centerOfMassOffsetX:0,centerOfMassOffsetY:height*.075});
 report.push({id:m.id,name:m.name,status:'ok',fullBody:true,url:s.url,sourcePage:s.page,title:s.title,processing:'original photo proportions, reviewed transparent silhouette',width,height,crop:{left,top,right,bottom},vertices:collisionShape.length});
 console.log(`${m.name}: ${width.toFixed(1)} × ${height}`);
}
await fs.writeFile('src/data/members.ts',`import type {Member} from '../types';\nexport const members:Member[]=${JSON.stringify(output,null,2)};\n`);
await fs.writeFile('scripts/member-report.json',JSON.stringify({updated:new Date().toISOString(),members:report},null,2));

// Retire only generated member sprites after all replacements have succeeded.
const live=new Set(output.map(m=>m.image.split('/').at(-1)));
for(const file of await fs.readdir('public/assets/members'))if(/^\d+(?:-[a-f0-9]{12})?\.webp$/.test(file)&&!live.has(file))await fs.unlink(`public/assets/members/${file}`);
