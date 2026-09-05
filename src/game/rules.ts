import type {Mode} from '../types';
export const targetFor=(mode:Mode,count:number)=>mode==='NORMAL'?Math.min(10,count):mode==='HARD'?Math.min(15,count):count;
export const stable=(b:{velocity:{x:number;y:number};angularVelocity:number})=>Math.hypot(b.velocity.x,b.velocity.y)<.72&&Math.abs(b.angularVelocity)<.045;
export const outside=(bounds:{min:{x:number;y:number};max:{x:number;y:number}})=>bounds.min.y>650||bounds.max.x<0||bounds.min.x>390;
export function shuffled<T>(items:T[]){const a=[...items];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
