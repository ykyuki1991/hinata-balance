import sharp from 'sharp';import fs from 'node:fs/promises';
const data=JSON.parse(await fs.readFile('scripts/fullbody-sources.json','utf8'));
const layers=[];
for(let i=0;i<data.members.length;i++){const m=data.members[i];const im=await sharp(m.raw).resize(280,280).toBuffer();layers.push({input:im,left:i%5*280,top:Math.floor(i/5)*310});layers.push({input:Buffer.from(`<svg width="280" height="30"><rect width="280" height="30" fill="white"/><text x="10" y="20" font-size="18">${i}: ID ${m.id}</text></svg>`),left:i%5*280,top:Math.floor(i/5)*310+280});}
await sharp({create:{width:1400,height:Math.ceil(data.members.length/5)*310,channels:3,background:'white'}}).composite(layers).png().toFile('/tmp/hinata-fullbody-candidates.png');
