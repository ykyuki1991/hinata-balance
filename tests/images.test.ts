import test from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import {members} from '../src/data/members';
import fs from 'node:fs/promises';
test('every sprite preserves its source crop aspect ratio and has a distinct official photograph',async()=>{
 const report=JSON.parse(await fs.readFile('scripts/member-report.json','utf8'));
 assert.equal(new Set(report.members.map((m:any)=>m.url)).size,members.length);
 for(const m of members){const image=await sharp(`public${m.image}`).metadata();const source=report.members.find((s:any)=>s.id===m.id);const crop=source.crop;
  assert.ok(Math.abs(m.width/m.height-image.width!/image.height!)<.0001,m.name);
  assert.ok(Math.abs(image.width!/image.height!-(crop.right-crop.left+1)/(crop.bottom-crop.top+1))<.003,m.name);
  assert.equal(source.fullBody,true);assert.match(source.sourcePage,/^https:\/\/www\.hinatazaka46\.com\//);
  assert.ok(m.collisionShape.length>4,m.name);
 }
});
