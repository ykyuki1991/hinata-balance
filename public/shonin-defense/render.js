import {W,H,STAGES} from './engine.js?v=2.0.0';
const COLORS={normal:'#c6f68d',urgent:'#ffce7b',return:'#c4a6ff',relay:'#88dcf5'};
export class Renderer {
  constructor(canvas,reduced=false){this.canvas=canvas;this.ctx=canvas.getContext('2d',{alpha:false});this.reduced=reduced;this.particles=[];this.labels=[];this.rings=[];this.shake=0;this.flash=0;this.backgrounds=STAGES.map((_,i)=>{const img=new Image();img.src=new URL(`./art/stage-${i+1}.svg`,import.meta.url).href;return img;});this.resize();}
  resize(){const r=this.canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2);this.canvas.width=Math.round(r.width*dpr);this.canvas.height=Math.round(r.height*dpr);}
  rect(x,y,w,h,r,fill,stroke){const c=this.ctx;c.beginPath();c.roundRect(x,y,w,h,r);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.stroke();}}
  text(t,x,y,size,color,weight=600){const c=this.ctx;c.fillStyle=color;c.font=`${weight} ${size}px -apple-system, BlinkMacSystemFont, sans-serif`;c.textAlign='center';c.fillText(t,x,y);}
  effect(e){
    if(e.type==='kill'||e.type==='node'||e.type==='bossKill'){
      const boss=e.type==='bossKill',color=COLORS[e.kind]||'#ffbd99',count=this.reduced?5:boss?48:14;
      for(let i=0;i<count&&this.particles.length<180;i++){const a=Math.random()*Math.PI*2,s=60+Math.random()*(boss?260:130);this.particles.push({x:e.x,y:e.y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:boss?1.3:.55,max:boss?1.3:.55,color,size:boss?5:3});}
      this.rings.push({x:e.x,y:e.y,r:8,life:boss?1:.35,color});
      if(e.type==='kill')this.labels.push({x:e.x,y:e.y,text:e.denial?'否認':'承認',life:.55,color,stamp:true});
      if(boss){this.shake=this.reduced?0:9;this.flash=.13;}
    }
    if(e.type==='return')this.labels.push({x:e.x,y:e.y,text:'↩ 再申請',life:.85,color:'#c4a6ff'});
    if(e.type==='perfect')this.labels.push({x:240,y:310,text:'全件承認 + BONUS',life:1.3,color:'#d7fca4'});
    if(e.type==='damage'){this.shake=this.reduced?0:7;this.flash=.09;}
    if(e.type==='burst'){this.rings.push({x:240,y:H-80,r:5,life:1.25,color:'#c6f68d'});this.shake=this.reduced?0:5;this.flash=.12;}
    if(e.type==='graze')this.rings.push({x:e.x,y:e.y,r:16,life:.16,color:'#87dbf6'});
    if(e.type==='shield')this.rings.push({x:240,y:H-72,r:40,life:.65,color:'#9cecff'});
    if(e.type==='escape')this.labels.push({x:e.x,y:H-56,text:'未処理 +1',life:.85,color:'#ff998c'});
  }
  enemy(e,t){
    const c=this.ctx,color=COLORS[e.type];c.save();c.translate(e.x,e.y);c.rotate(Math.sin(e.age*2)*.06);
    if(e.type==='relay'){this.rect(-30,-25,60,48,7,'#143445',color);c.strokeStyle=color;c.beginPath();c.arc(0,0,33,t,t+Math.PI*1.5);c.stroke();this.text('回覧',0,4,13,color);c.fillStyle=color;c.fillRect(-21,30,8,5);c.fillRect(13,30,8,5);}
    else{
      this.rect(-19,-26,43,49,4,'#091521',color);this.rect(-24,-30,43,49,4,e.hit>0?'#fffbe4':color);
      c.fillStyle='#172638';c.beginPath();c.moveTo(6,-30);c.lineTo(19,-17);c.lineTo(6,-17);c.fill();this.text(e.returned?'再申請':{normal:'未処理',urgent:'至急',return:'差戻し'}[e.type],-3,-8,10,'#203244',800);
      c.fillStyle='#20324490';c.fillRect(-16,1,25,2);c.fillRect(-16,7,17,2);c.fillStyle=color;c.fillRect(-19,23,6,6);c.fillRect(10,23,6,6);
      if(e.type==='urgent'){c.beginPath();c.moveTo(-8,35);c.lineTo(0,42);c.lineTo(8,35);c.strokeStyle='#ffce7b';c.stroke();}
    }c.restore();
  }
  boss(b,g,t){
    const c=this.ctx,color=STAGES[g.stage].color;c.save();c.translate(b.x,b.y);
    if(g.stage===0){
      c.strokeStyle='#b8d99a66';c.lineWidth=3;c.beginPath();c.moveTo(-72,0);c.lineTo(72,0);c.stroke();
      for(const n of b.nodes){c.save();c.translate(n.side*72,0);this.rect(-26,-32,52,64,7,n.hp>0?'#354533':'#1a2d30',n.hp>0?color:'#4b6861');this.text(n.hp>0?'承認印':'✓',0,4,n.hp>0?12:25,n.hp>0?color:'#758d83',800);if(n.hp>0){this.rect(-20,22,40,3,1,'#15242c');this.rect(-20,22,n.hp/10*40,3,1,color);}c.restore();}
      this.rect(-40,-40,80,80,12,b.hit?'#eaffe0':'#263f38',color);this.text(b.open?'決裁':'回覧',0,-8,15,b.open?color:'#829985',900);this.text(b.open?'OPEN':'LOCK',0,17,10,b.open?color:'#829985');
    }else if(g.stage===1){
      c.strokeStyle='#b1a2ff';c.lineWidth=2;c.beginPath();c.arc(0,0,70,t*.8,t*.8+Math.PI*1.7);c.stroke();
      this.rect(-72,-39,144,78,14,b.hit?'#effbff':'#24384e','#8ccddd');this.text('差戻しループ',0,-14,15,'#bddcf1',800);
      const x=b.weakX-b.x;this.rect(x-36,-2,72,27,4,b.open?'#a8e8ec':'#354159',b.open?'#edffff':'#7c91af');this.text(b.open?'受付中':'確認中',x,17,12,b.open?'#19333f':'#a0adbf',800);
    }else{
      this.rect(-83,-48,176,88,8,'#473040','#b16d68');this.rect(-88,-39,176,88,8,b.hit?'#fff0da':'#563640','#eea18a');c.fillStyle='#2e2334';c.fillRect(-85,-18,170,12);this.text('月 末 締 め',0,-23,18,'#ffc6a9',900);
      const x=b.weakX-b.x;this.rect(x-39,2,78,33,5,b.open?'#ffb895':'#433743');this.text(b.open?'最終決裁':'集計中',x,24,13,b.open?'#4c3035':'#b3a0a6',900);for(const side of [-1,1]){this.rect(side*91-10,-5,20,37,4,'#323447','#ca8d86');c.fillStyle='#ffc29c';c.fillRect(side*91-4,33,8,12);}
    }c.restore();
    const barY=88;this.rect(92,barY,296,5,2,'#101d2ddd');this.rect(92,barY,296*Math.max(0,b.hp/b.maxHp),5,2,color);this.text(`${STAGES[g.stage].boss}  /  ${g.stage===0&&!b.open?'左右の印を狙え':!b.open?'射線を避けて待つ':'光る決裁窓を狙え'}`,240,barY-8,11,color);
  }
  warning(w,g){
    const c=this.ctx;const alpha=.15+.18*(1-w.left/w.total);c.save();c.setLineDash([6,8]);c.lineWidth=1.5;
    if(w.kind==='beam'){c.fillStyle=`rgba(255,126,119,${alpha})`;c.fillRect(w.x-w.width/2,0,w.width,H);c.strokeStyle='#ffb19b';c.strokeRect(w.x-w.width/2,0,w.width,H);this.text('締切予告',w.x,H-160,11,'#ffc6b6');}
    else if(w.kind==='curtain'){c.fillStyle='#8be4d410';c.fillRect(w.x-w.width/2,w.y,w.width,H-w.y);c.strokeStyle='#9df2d480';c.beginPath();c.moveTo(w.x-w.width/2,w.y);c.lineTo(w.x-w.width/2,H-80);c.moveTo(w.x+w.width/2,w.y);c.lineTo(w.x+w.width/2,H-80);c.stroke();this.text('↓ すき間',w.x,H-125,11,'#b7f3da');}
    else if(w.kind==='aim'){c.strokeStyle='#ffcb7b80';c.beginPath();c.moveTo(w.x,w.y);c.lineTo(w.targetX??g.x,g.y);c.stroke();c.setLineDash([]);c.beginPath();c.arc(w.x,w.y,12+12*w.left/w.total,0,Math.PI*2);c.stroke();}
    else if(w.kind==='lanes'){c.fillStyle='#c49bff18';for(const x of w.lanes)c.fillRect(x-43,100,86,H-180);this.text('再申請ルート',240,H-170,11,'#d4b8ff');}
    else {c.strokeStyle='#ffb68a99';c.beginPath();c.arc(w.x,w.y,20+18*w.left/w.total,0,Math.PI);c.stroke();}
    c.restore();
  }
  ship(g,t){
    const c=this.ctx;c.save();c.translate(g.x,g.y);if(g.invincible>0&&!this.reduced)c.globalAlpha=Math.floor(t*12)%2?.45:1;
    const color=g.coffee>0?'#ffdc8f':STAGES[g.stage].color;
    c.fillStyle='#84e5fd44';c.beginPath();c.moveTo(-8,18);c.lineTo(0,38+(this.reduced?0:Math.sin(t*30)*5));c.lineTo(8,18);c.fill();
    c.fillStyle='#edf9d8';c.beginPath();c.moveTo(0,-26);c.lineTo(10,-8);c.lineTo(27,10);c.lineTo(25,18);c.lineTo(7,10);c.lineTo(0,16);c.lineTo(-7,10);c.lineTo(-25,18);c.lineTo(-27,10);c.lineTo(-10,-8);c.closePath();c.fill();
    c.fillStyle=color;c.beginPath();c.moveTo(0,-20);c.lineTo(6,4);c.lineTo(-6,4);c.fill();c.fillStyle='#102a3e';c.fillRect(-21,9,12,4);c.fillRect(9,9,12,4);
    c.beginPath();c.arc(0,0,6,0,Math.PI*2);c.fillStyle='#132c39';c.fill();c.beginPath();c.arc(0,0,3.5,0,Math.PI*2);c.fillStyle='#fffce9';c.fill();
    if(g.shield){c.strokeStyle='#99e7ff99';c.beginPath();c.arc(0,0,34,0,Math.PI*2);c.stroke();}
    if(g.weapon==='wide'){for(const x of [-33,33])this.rect(x-3,1,6,13,3,color);}if(g.weapon==='pierce'){this.rect(-4,-37,8,12,2,color);}c.restore();
  }
  draw(g,time,dt){
    const c=this.ctx;c.setTransform(this.canvas.width/W,0,0,this.canvas.height/H,0,0);c.fillStyle='#0c1a29';c.fillRect(0,0,W,H);const bg=this.backgrounds[g.stage];if(bg.complete&&bg.naturalWidth)c.drawImage(bg,0,0,W,H);
    c.save();if(this.shake&&!this.reduced)c.translate((Math.random()-.5)*this.shake,(Math.random()-.5)*this.shake);
    const t=this.reduced?0:time;c.fillStyle=STAGES[g.stage].color+'25';for(let i=0;i<12;i++){const x=(i*137)%W,y=(i*73+t*(8+g.stage*7))%H;c.fillRect(x,y,2,g.stage===1?13:2);}
    c.strokeStyle=STAGES[g.stage].color+'55';c.setLineDash([4,8]);c.beginPath();c.moveTo(0,H-37);c.lineTo(W,H-37);c.stroke();c.setLineDash([]);
    for(const w of g.warnings)this.warning(w,g);
    for(const e of g.enemies)this.enemy(e,t);if(g.boss)this.boss(g.boss,g,t);
    for(const b of g.bullets){c.fillStyle='#c3f68b35';c.fillRect(b.x-5,b.y-15,10,26);this.rect(b.x-(g.weapon==='pierce'?3:2),b.y-14,g.weapon==='pierce'?6:4,18,2,g.weapon==='pierce'?'#a8eaff':'#e1ffb6');}
    for(const b of g.hazards){
      if(b.kind==='beam'){c.fillStyle='#ff8e7755';c.fillRect(b.x-b.r,0,b.r*2,H-36);c.fillStyle='#ffc7a4cc';c.fillRect(b.x-b.r*.38,0,b.r*.76,H-36);c.fillStyle='#fff3d4';c.fillRect(b.x-3,0,6,H-36);continue;}
      c.save();c.translate(b.x,b.y);c.fillStyle='#ff846955';c.beginPath();c.arc(0,0,b.r+4,0,Math.PI*2);c.fill();
      if(b.kind==='bar'){this.rect(-8,-5,16,10,3,'#ffb28b');c.fillStyle='#fff7cf';c.fillRect(-5,-1,10,2);}else{c.rotate(Math.PI/4);this.rect(-b.r*.8,-b.r*.8,b.r*1.6,b.r*1.6,2,'#ffac91');c.fillStyle='#fff5d3';c.fillRect(-2,-2,4,4);}c.restore();
    }
    for(const i of g.items){c.save();c.translate(i.x,i.y);c.rotate(Math.sin(t*3)*.12);this.rect(-18,-18,36,36,9,i.type==='coffee'?'#ffdda0':'#a5e5ff','#ffffffbb');this.text(i.type==='coffee'?'☕':'ϟ',0,8,23,'#23364a',800);c.restore();}
    this.ship(g,t);
    for(const p of this.particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=65*dt;p.life-=dt;c.globalAlpha=Math.max(0,p.life/p.max);c.fillStyle=p.color;c.fillRect(p.x,p.y,p.size,p.size);}this.particles=this.particles.filter(p=>p.life>0);c.globalAlpha=1;
    for(const r of this.rings){r.life-=dt;r.r+=dt*(r.life>.4?600:95);c.globalAlpha=Math.min(1,Math.max(0,r.life));c.strokeStyle=r.color;c.lineWidth=2;c.beginPath();c.arc(r.x,r.y,r.r,0,Math.PI*2);c.stroke();}this.rings=this.rings.filter(r=>r.life>0);c.globalAlpha=1;
    for(const l of this.labels){l.life-=dt;l.y-=dt*25;c.save();c.translate(l.x,l.y);c.globalAlpha=Math.min(1,Math.max(0,l.life*3));if(l.stamp){c.rotate(-.16);this.rect(-23,-16,46,25,2,'#142735cc',l.color);this.text(l.text,0,2,15,l.color,800);}else this.text(l.text,0,0,14,l.color);c.restore();}this.labels=this.labels.filter(l=>l.life>0);
    if(g.phase==='playing'&&g.segment==='intro'){c.fillStyle='#0b1b2bd0';c.fillRect(0,240,W,170);this.text(`STAGE 0${g.stage+1} / ${STAGES[g.stage].time}`,240,279,12,STAGES[g.stage].color);this.text(STAGES[g.stage].name,240,327,34,'#f0f5e9',900);this.text(['編隊を狙う。光った射線を避ける。','回覧を先に止める。再申請の行方を追う。','すき間を読む。切り札を使い切る。'][g.stage],240,365,13,'#c0d1d9');}
    if(g.segment==='clear'&&g.phase==='playing'){c.fillStyle='#0b1b2bce';c.fillRect(0,235,W,180);this.text('ALL APPROVED',240,280,12,STAGES[g.stage].color);this.text('この現場、処理完了。',240,328,27,'#f0f5e9',900);this.text(g.stage<2?'次の現場へ。ライフ +1':'おつかれさまでした。今日は定時です。',240,367,12,'#c8d7dc');}
    c.restore();if(this.flash>0){c.fillStyle=`rgba(237,249,214,${this.flash})`;c.fillRect(0,0,W,H);}this.flash=Math.max(0,this.flash-dt);this.shake=Math.max(0,this.shake-dt*30);
  }
}
