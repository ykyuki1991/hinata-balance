import sharp from 'sharp';import fs from 'node:fs/promises';
const report=JSON.parse(await fs.readFile('scripts/member-report.json','utf8'));const layers=[];
for(let i=0;i<report.members.length;i++){const m=report.members[i],x=i%7*170,y=Math.floor(i/7)*390;layers.push({input:await sharp(`public/assets/members/${m.id}.webp`).resize(160,350,{fit:'contain',background:'#eaf7ff'}).png().toBuffer(),left:x+5,top:y});layers.push({input:Buffer.from(`<svg width="170" height="30"><text x="10" y="22" font-size="18">${i}: ID ${m.id}</text></svg>`),left:x,top:y+350});}
await sharp({create:{width:1190,height:1560,channels:3,background:'#eaf7ff'}}).composite(layers).png().toFile('/tmp/hinata-fullbody-pieces.png');
