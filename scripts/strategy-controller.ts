import Matter from 'matter-js';
import {Game} from '../src/game/engine';
import {createPiece} from '../src/game/piece';
import {members} from '../src/data/members';
import {targetFor} from '../src/game/rules';
import type {Mode} from '../src/types';
const muted={bgm:false,se:false,vibration:false,names:false,guide:false};
export type Strategy='A'|'B'|'C0'|'C';
export function orderFor(seed:number,mode:Mode){const items=[...members];for(let i=items.length-1;i>0;i--){seed=(seed*1664525+1013904223)>>>0;const j=Math.floor(seed/4294967296*(i+1));[items[i],items[j]]=[items[j],items[i]];}return items.slice(0,targetFor(mode,items.length)).map(m=>m.id);}
export function newGame(mode:Mode,order:string[]){return new Game(document.createElement('canvas'),mode,members,muted,()=>{},()=>{},order,true);}
function copyBody(a:Matter.Body,b:Matter.Body){Matter.Body.setPosition(a,b.position);Matter.Body.setAngle(a,b.angle);Matter.Body.setVelocity(a,b.velocity);Matter.Body.setAngularVelocity(a,b.angularVelocity);}
export function fork(g:Game){const c=newGame(g.mode,g.queue.map(m=>m.id));copyBody(c.platform,g.platform);c.count=g.count;c.seconds=g.seconds;c.score=g.score;c.perfects=g.perfects;c.tiltTotal=g.tiltTotal;c.tiltSamples=g.tiltSamples;c.maxTilt=g.maxTilt;c.bearingLoad=g.bearingLoad;c.camera=g.camera;
 for(const p of g.pieces){const q=createPiece(p.member,{x:0,y:0},p.body.angle);copyBody(q.body,p.body);q.body.friction=p.body.friction;q.body.frictionAir=p.body.frictionAir;Matter.Composite.add(c.engine.world,q.body);c.pieces.push(q);}return c;}
function angles(strategy:Strategy){return strategy==='A'?[0]:strategy==='B'?[90,-90]:[0,90,-90];}
export function choices(g:Game,strategy:Strategy){const m=g.queue[g.count];if(!m)return [];const out:{x:number;y:number;angle:number}[]=[];
 const left=195-g.seesaw.width/2+28,right=195+g.seesaw.width/2-28;
 for(const degree of angles(strategy))for(let i=0;i<7;i++){
 const angle=degree*Math.PI/180,x=left+(right-left)*i/6;
 const ghost=createPiece(m,{x,y:0},angle);const halfW=(ghost.body.bounds.max.x-ghost.body.bounds.min.x)/2;
 const surface=Math.min(556+(x-195)*Math.tan(g.platform.angle),...g.pieces.filter(p=>p.body.bounds.max.x>x-halfW&&p.body.bounds.min.x<x+halfW).map(p=>p.body.bounds.min.y));
 const y=surface-ghost.body.bounds.max.y-8;out.push({x,y,angle});
 }return out;}
export function settle(g:Game,choice:{x:number;y:number;angle:number}){g.pos={x:choice.x,y:choice.y};g.angle=choice.angle;g.drop();if(g.phase==='ready')return false;for(let i=0;i<780&&g.phase==='settling';i++)g.step(1/60);for(let i=0;i<36&&g.phase==='ready';i++)g.step(1/60);return g.count>0&&(g.phase==='ready'||(g.phase==='ended'&&g.count===g.queue.length));}
function value(g:Game){if(g.phase==='ended'&&g.count<g.queue.length)return -10000;const maxHeight=564-Math.min(556,...g.pieces.map(p=>p.body.bounds.min.y));const angle=Math.abs(g.platform.angle)*180/Math.PI;const mass=g.pieces.reduce((s,p)=>s+p.body.mass,0);const com=Math.abs(g.pieces.reduce((s,p)=>s+(p.body.position.x-195)*p.body.mass,0)/(mass||1));const overhang=g.pieces.reduce((s,p)=>s+Math.max(0,195-g.seesaw.width/2-p.body.bounds.min.x,p.body.bounds.max.x-(195+g.seesaw.width/2)),0);return 200-angle*3-com*.3-maxHeight*.08-overhang*.7;}
export function choose(g:Game,strategy:Strategy){const ranked=choices(g,strategy).map(choice=>{const sim=fork(g),before=g.count;settle(sim,choice);const quality=sim.count===before+1?value(sim):-10000;return {choice,sim,quality};}).sort((a,b)=>b.quality-a.quality);
 const frontier=strategy==='C'?angles('C').map(angle=>ranked.find(r=>Math.abs(r.choice.angle-angle*Math.PI/180)<.01)!).filter(Boolean):ranked;
 if(strategy==='C'&&g.count+1<g.queue.length)for(const r of frontier){if(r.quality<-1000)continue;let next=-10000;for(const choice of choices(r.sim,'C0')){const sim=fork(r.sim);settle(sim,choice);next=Math.max(next,sim.count===g.count+2?value(sim):-10000);sim.dispose();}r.quality=r.quality*.3+next*.7;}
 const selected=frontier.sort((a,b)=>b.quality-a.quality)[0];const choice=selected.choice;ranked.forEach(r=>r.sim.dispose());return choice;
}
export function trial(mode:Mode,seed:number,strategy:Strategy){const order=orderFor(seed,mode),g=newGame(mode,order);const placements=[];while(g.phase==='ready'){const m=g.queue[g.count],choice=choose(g,strategy),before=g.count,time=g.seconds;settle(g,choice);placements.push({member:m.name,id:m.id,index:before+1,x:choice.x,angle:choice.angle*180/Math.PI,y:choice.y,wait:g.seconds-time,tilt:g.platform.angle*180/Math.PI,grade:g.feedback?.grade,score:g.score,count:g.count,reason:g.failureReason});if(g.count===before)break;}const result={mode,seed,strategy,order,count:g.count,clear:g.count===g.queue.length,score:g.score,perfectRate:g.count?g.perfects/g.count:0,averageTilt:g.tiltSamples?g.tiltTotal/g.tiltSamples:0,time:g.seconds,reason:g.failureReason,placements};g.dispose();return result;}
