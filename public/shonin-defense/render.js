import {H,STAGES} from './engine.js?v=6.0.0';
const INK='#14272e',PAPER='#f6ead4',TEAL='#9de2cc',RED='#f47d68';
export class Renderer{
 constructor(canvas,reduced=false){this.canvas=canvas;this.c=canvas.getContext('2d',{alpha:false});this.reduced=reduced;this.particles=[];this.rings=[];this.stamps=[];this.shake=0;this.joystick=null;this.resize();}
 resize(){const r=this.canvas.getBoundingClientRect();this.dpr=Math.min(2,window.devicePixelRatio||1);this.canvas.width=Math.round(r.width*this.dpr);this.canvas.height=Math.round(r.height*this.dpr);}
 path(points,fill,stroke,width=1){const c=this.c;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke();}}
 line(points,color,width=1){const c=this.c;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.lineJoin='round';c.stroke();}
 rect(x,y,w,h,r,fill,stroke){const c=this.c;c.beginPath();c.roundRect(x,y,w,h,r);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=1.5;c.stroke();}}
 circle(x,y,r,fill,stroke,width=1){const c=this.c;c.beginPath();c.arc(x,y,r,0,Math.PI*2);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke();}}
 text(s,x,y,size=14,color=PAPER,align='center',font='sans-serif'){const c=this.c;c.fillStyle=color;c.font=`700 ${size}px ${font}`;c.textAlign=align;c.fillText(s,x,y);}
 check(x,y,r=12,color=TEAL){this.circle(x,y,r,null,color,1.5);this.line([[x-r*.48,y],[x-r*.1,y+r*.4],[x+r*.5,y-r*.38]],color,2);}
 effect(e){const c=e.type==='return'?RED:e.type==='damage'?RED:e.type==='join'?'#bbcaf5':TEAL;if(['stamp','receipt','join','return','damage','hit','reapply'].includes(e.type)){for(let i=0;i<(this.reduced?2:e.type==='hit'?2:12)&&this.particles.length<140;i++){const a=Math.random()*6.28;this.particles.push({x:e.x,y:e.y,vx:Math.cos(a)*(20+Math.random()*75),vy:Math.sin(a)*70,life:.25+Math.random()*.4,color:c});}if(e.type!=='hit')this.rings.push({x:e.x,y:e.y,life:.5,r:10,color:c});if(['return','reapply','join'].includes(e.type))this.stamps.push({x:e.x,y:e.y,life:1.4,label:e.type==='return'?'差戻し':e.type==='reapply'?'再申請':'合流',color:c});if(e.type==='damage')this.shake=this.reduced?0:4;}if(e.type==='stageClear'){this.shake=this.reduced?0:2;}}
 arrow(x,y,a,color,size=5){const c=this.c;c.save();c.translate(x,y);c.rotate(a);this.path([[-size,-size],[size,0],[-size,size]],color);c.restore();}
 background(g,t){const c=this.c,w=g.width,s=g.stage;const grad=c.createLinearGradient(0,0,w,600);grad.addColorStop(0,['#17353c','#202e43','#302f35'][s]);grad.addColorStop(1,'#0b1f28');c.fillStyle=grad;c.fillRect(0,0,w,600);
 // Background is intentionally quieter than actionable rails and documents.
 c.globalAlpha=.25;
 if(s===0){for(const x of [14,w-66])for(let i=0;i<5;i++){const y=113+i*58;this.rect(x,y,52,46,4,'#32494c','#738080');this.rect(x+5,y+6,42,28,3,'#172d34','#566765');this.rect(x+20,y+18,13,4,1,'#a1a69a');}}
 if(s===1){for(const x of [w*.25,w*.75]){this.circle(x,250,Math.min(85,w*.21),null,'#627888',14);this.circle(x,250,Math.min(68,w*.17),null,'#486273',2);for(let k=0;k<8;k++){const a=k*Math.PI/4+t*.05;this.circle(x+Math.cos(a)*Math.min(85,w*.21),250+Math.sin(a)*Math.min(85,w*.21),5,'#9aabb4');}}}
 if(s===2){for(let x=12;x<w;x+=92){this.rect(x,125,75,300,4,'#41454b','#6d7071');for(let i=0;i<6;i++){this.line([[x+5,160+i*45],[x+70,160+i*45]],'#92918a',2);for(let k=0;k<4;k++)this.rect(x+8+k*15,132+i*45,10,27,1,k%2?'#8a8677':'#62757a');}}}
 c.globalAlpha=1;
 // Intake lanes converge on the player's pending-work belt. Approved traffic travels back up.
 for(const lane of [.25,.5,.75]){const x=w*lane;this.line([[x,90],[x,340],[w/2+(x-w/2)*.85,375]],'#244650',9);this.line([[x,90],[x,340],[w/2+(x-w/2)*.85,375]],'#507077',1);for(let i=0;i<4;i++){const y=110+(i*65+t*14)%250;this.arrow(x,y,Math.PI/2,'#4a6a70',3);}}
 this.rect(w*.11,364,w*.78,20,8,'#172c34','#496365');this.text('未処理',w/2,378,9,'#8aa7a6');
 c.setLineDash([4,6]);this.line([[w*.055,360],[w*.055,76],[w*.32,76]],'#895d60',1.5);c.setLineDash([]);this.arrow(w*.055,100,-Math.PI/2,'#bc817c',4);
 this.rect(w*.03,63,30,23,4,'#29454c','#6c8585');this.path([[w*.03+7,80],[w*.03+7,68],[w*.03+20,68],[w*.03+24,72],[w*.03+24,80]],'#819a96');
 const fade=c.createLinearGradient(0,459,0,600);fade.addColorStop(0,'#10263000');fade.addColorStop(.3,'#102630dd');fade.addColorStop(1,'#102630');c.fillStyle=fade;c.fillRect(0,455,w,145);this.line([[24,486],[w-24,486]],'#31505a',1);
 if(g.t<9&&g.phase==='playing'){c.globalAlpha=Math.max(0,(9-g.t)/6);this.line([[w*.27,536],[w*.60,536]],'#719895',1);this.arrow(w*.27,536,Math.PI,'#719895');this.arrow(w*.60,536,0,'#719895');this.text('ここで、動かす',w*.43,566,11,'#a7c4ba');c.globalAlpha=1;}
 }
 document(e,g,t){const c=this.c,revision=e.kind==='revision'&&!e.revised,review=e.kind==='review',color=revision?RED:review?'#bdc8f1':e.kind==='urgent'?'#f3bd7e':TEAL;c.save();c.translate(e.x,e.y);if(e.state==='forward'){c.scale(.86,.86);c.rotate(Math.sin(e.travel*3)*.12);}if(e.state==='correcting')c.globalAlpha=.5;
 this.rect(-19,-24,38,49,4,'#061b2460');this.path([[-16,-22],[7,-22],[17,-12],[17,22],[-16,22]],e.hit>0?'#fffef3':PAPER,INK,2);this.path([[7,-22],[7,-12],[17,-12]],'#c7bca6',INK,1);for(let i=0;i<3;i++)this.line([[-9,-8+i*7],[9-(i%2)*6,-8+i*7]],'#a89b83',2);this.rect(-20,-9,5,22,2,color);
 if(revision){c.setLineDash([2,2]);this.rect(4,10,16,13,2,null,RED);c.setLineDash([]);this.rect(-8,-34,30,16,5,'#6c4244',RED);this.text('↶',7,-22,17,PAPER);}
 if(e.revised){this.rect(6,8,14,16,2,'#c4dfd0',INK);this.line([[10,11],[10,20],[15,20],[15,13]],'#5a8078',1.5);}
 if(e.kind==='urgent'){this.path([[0,-36],[9,-23],[-9,-23]],'#f5bb7e');this.text('!',0,-25,11,INK);}
 if(review){this.circle(0,-30,7,'#394b6a','#c0d2f4');this.text(e.lane<.5?'1':'2',0,-27,9);}
 if(e.kind==='parallel'){this.line([[-9,30],[-9,37],[9,37],[9,30]],'#c1ccf5',2);this.circle(-9,30,3,'#b8c8f3');this.circle(9,30,3,'#b8c8f3');}
 if(e.state==='forward')this.check(0,1,18,TEAL);
 if(e.state==='pending'){this.rect(-15,27,30,3,1,'#3e5157');this.rect(-15,27,30*Math.max(0,e.hp/e.maxHp),3,1,color);if(e.left<7){this.circle(0,0,29,null,RED,1.7);this.text(String(Math.ceil(e.left)),0,46,11,RED);}if(e.attack<.6){c.globalAlpha=.5;this.circle(0,0,34+Math.sin(t*18)*2,null,RED,1);c.globalAlpha=1;}}
 c.restore();}
 machine(g,t){const w=g.width,c=this.c,color=STAGES[g.stage].color;
 if(g.stage!==2){const x=w/2;this.rect(x-43,65,86,46,8,'#30464c','#80938e');this.rect(x-33,73,66,26,4,'#152d36','#617976');this.line([[x-20,105],[x+20,105]],color,3);if(g.stage===0){this.path([[x-17,83],[x,77],[x+17,83],[x,89]],color);this.line([[x,89],[x-20,96]],color,1);this.line([[x,89],[x+20,96]],color,1);}else{this.circle(x-16,86,8,null,color,2);this.circle(x+16,86,8,null,color,2);this.line([[x-7,86],[x+7,86]],color,2);}}
 for(const job of g.jobs.filter(j=>!j.done)){const branches=[...g.enemies,...(g.held?[g.held]:[])].filter(e=>e.job===job.id);for(const lane of [.25,.75]){const e=branches.find(a=>a.lane===lane);const y=e?.y||175;this.line([[w*lane,y],[w*lane,125],[w/2,105]],e&&['pending','held'].includes(e.state)?'#7883a0':TEAL,2);if(!e||e.state==='forward')this.check(w*lane,130,9);}this.circle(w/2,113,7,'#1e3642',color);}
 for(const p of g.ports){const open=p.open>0;this.line([[w/2,89],[p.x,89],[p.x,p.y]],open?TEAL:'#78818e',2);this.rect(p.x-27,p.y-26,54,48,7,open?'#2b554f':'#34434d',open?TEAL:'#91a29d');if(p.index===0){for(const y of [-9,0,9]){c.beginPath();c.ellipse(p.x,p.y+y,13,5,0,0,Math.PI*2);c.strokeStyle=open?TEAL:PAPER;c.lineWidth=1.5;c.stroke();}this.line([[p.x-13,p.y-9],[p.x-13,p.y+9]],PAPER);this.line([[p.x+13,p.y-9],[p.x+13,p.y+9]],PAPER);}if(p.index===1){this.path([[p.x-15,p.y-11],[p.x-4,p.y-11],[p.x,p.y-6],[p.x+15,p.y-6],[p.x+15,p.y+12],[p.x-15,p.y+12]],null,PAPER,1.5);}if(p.index===2){this.rect(p.x-15,p.y-12,30,24,2,null,PAPER);for(let i=0;i<3;i++)this.line([[p.x-10,p.y-6+i*6],[p.x+8,p.y-6+i*6]],PAPER);}
 this.text(['WebDB','ファイル','掲示板'][p.index],p.x,p.y+38,9,'#b7c5bf');for(let i=0;i<Math.min(5,p.queue.length);i++)this.rect(p.x-10+i*3,p.y+47+i*3,19,13,2,PAPER,INK);if(p.queue.length){this.circle(p.x+23,p.y-23,8,'#efb57f');this.text(p.queue.length,p.x+23,p.y-20,9,INK);}if(!open&&p.queue.length){this.rect(p.x-20,p.y+27,40,3,1,'#485f65');this.rect(p.x-20,p.y+27,40*p.hp/p.maxHp,3,1,TEAL);}}
 if(g.segment==='boss'){const total=g.boss.total,done=g.boss.done;for(let i=0;i<total;i++)this.circle(w/2+(i-(total-1)/2)*12,53,3,i<done?color:'#4e6169');if(g.bossAge<2.7)this.text(STAGES[g.stage].boss,w/2,200,23,PAPER);if(g.bossAge>50)this.text(Math.ceil(62-g.bossAge),w/2,52,12,RED);}
 }
 ship(g,t){const c=this.c;c.save();c.translate(g.x,g.y);if(g.invincible>0&&Math.floor(t*14)%2)c.globalAlpha=.4;
 this.circle(0,0,26,'#10343b99');this.path([[-13,10],[-8,24+Math.sin(t*35)*3],[0,18],[8,24+Math.cos(t*32)*3],[13,10]],'#92d9c3');this.path([[-25,11],[-19,-9],[-10,-17],[10,-17],[19,-9],[25,11],[12,7],[-12,7]],'#42696a',INK,2);this.rect(-14,-18,28,34,7,'#c8e5d2',INK);this.rect(-20,-5,40,13,4,'#e8d4ae',INK);this.rect(-9,-23,18,8,3,'#b18d69',INK);this.circle(0,0,8,'#214a50','#98dcc5',2);this.circle(0,0,3,PAPER);this.line([[0,-18],[Math.cos(g.angle)*22,Math.sin(g.angle)*22]],PAPER,3);c.restore();
 }
 draw(g,t,dt){const c=this.c,w=g.width;c.setTransform(this.canvas.width/w,0,0,this.canvas.height/H,0,0);this.background(g,t);c.save();if(this.shake>0)c.translate(Math.sin(t*77)*this.shake,Math.cos(t*93)*this.shake*.5);this.shake=Math.max(0,this.shake-dt*16);this.machine(g,t);
 for(const n of g.notifications){c.globalAlpha=.38;this.rect(n.x-8,n.y-6,16,12,2,null,'#98b9c2');this.line([[n.x-8,n.y-6],[n.x,n.y],[n.x+8,n.y-6]],'#98b9c2');this.arrow(n.x,n.y+15,Math.PI/2,'#98b9c2',3);c.globalAlpha=1;}
 for(const p of g.packets){this.rect(p.x-8,p.y-6,16,12,2,TEAL);this.check(p.x,p.y,5,INK);}
 const target=g.targets().find(e=>e.id===g.targetId);if(target){c.globalAlpha=.18;this.line([[g.x,g.y-22],[target.x,target.y+23]],PAPER,1);c.globalAlpha=1;for(const a of [-1,1])for(const b of [-1,1])this.line([[target.x+a*23,target.y+b*33],[target.x+a*30,target.y+b*33],[target.x+a*30,target.y+b*26]],'#fff6d9',2);}
 for(const e of g.enemies)this.document(e,g,t);
 if(g.held){this.line([[w-37,288],[w-15,288],[w-15,354],[w-37,354]],'#a1bbc5',1);this.rect(w-65,303,57,40,7,'#29424f','#8ea8b1');this.document({...g.held,x:w-36,y:322,state:'held'},g,t);this.text('Ⅱ',w-35,362,12,'#bbd6d6');}
 for(const b of g.bullets){this.line([[b.x,b.y+10],[b.x,b.y-4]],TEAL,3);this.circle(b.x,b.y-4,2,PAPER);}
 for(const h of g.hazards){if(h.warn>0){c.globalAlpha=.4;const n=Math.hypot(h.vx,h.vy);this.line([[h.x,h.y],[h.x+h.vx/n*70,h.y+h.vy/n*70]],RED,1);this.circle(h.x,h.y,10*(1-h.warn/.55),null,RED,2);c.globalAlpha=1;}else{this.circle(h.x,h.y,7,'#553439',RED,2);this.circle(h.x,h.y,2,'#ffd6a1');}}
 if(g.choice){for(const [i,x]of [w*.25,w*.75].entries()){const active=i===0?g.x<w*.34:g.x>w*.66;this.rect(x-36,450,72,25,8,active?'#496c63':'#18343dcc',active?PAPER:'#8bafa3');this.text(i===0?'単線':'並行',x,467,12,PAPER);if(i){this.line([[x-10,445],[x-10,438],[x+10,438],[x+10,445]],'#c1ccf5',2);}else this.line([[x,437],[x,445]],TEAL,2);}}
 this.ship(g,t);
 for(const p of this.particles){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;c.globalAlpha=Math.max(0,p.life/.65);this.rect(p.x,p.y,3,3,1,p.color);}this.particles=this.particles.filter(p=>p.life>0);c.globalAlpha=1;
 for(const r of this.rings){r.life-=dt;r.r+=dt*70;c.globalAlpha=Math.max(0,r.life*1.6);this.circle(r.x,r.y,r.r,null,r.color,1.5);}this.rings=this.rings.filter(r=>r.life>0);c.globalAlpha=1;
 for(const s of this.stamps){s.life-=dt;s.y-=dt*10;c.globalAlpha=Math.min(1,Math.max(0,s.life));this.rect(s.x-26,s.y-10,52,20,3,'#19303b');this.text(s.label,s.x,s.y+4,11,s.color);}this.stamps=this.stamps.filter(s=>s.life>0);c.globalAlpha=1;c.restore();
 if(g.combo>=6&&g.phase==='playing')this.text('×'+g.multiplier,g.x+30,g.y-25,12,TEAL);
 if(g.phase==='playing'&&g.segment==='intro'){c.fillStyle='#0e2634bb';c.fillRect(0,185,w,145);this.text(STAGES[g.stage].en,w/2,226,12,STAGES[g.stage].color,'center','monospace');this.text(STAGES[g.stage].name,w/2,266,Math.min(26,w/13));this.line([[w/2-25,287],[w/2+25,287]],STAGES[g.stage].color,2);}
 if(g.phase==='playing'&&g.segment==='clear'){c.fillStyle='#0e2634bb';c.fillRect(0,185,w,145);this.check(w/2,235,26);this.text(g.stage===2?'次の仕事へ、届きました。':'承認。次の工程へ。',w/2,292,Math.min(20,w/17));}
 }
}
