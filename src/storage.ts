import type {Mode,Result,Settings} from './types';
export type RecordEntry={plays:number;clears:number;max:number;best:number|null;bestScore?:number};
export const emptyRecord=():RecordEntry=>({plays:0,clears:0,max:0,best:null,bestScore:0});
export function read<T>(key:string,fallback:T):T{try{return JSON.parse(localStorage.getItem(key)||'null')??fallback;}catch{return fallback;}}
export function write(key:string,value:unknown){try{localStorage.setItem(key,JSON.stringify(value));return true;}catch{return false;}}
export const defaults:Settings={bgm:false,se:true,vibration:true,names:true,guide:true};
export function recordResult(old:RecordEntry,r:Result):RecordEntry{return {bestScore:Math.max(old.bestScore??0,r.score??0),plays:old.plays+1,clears:old.clears+Number(r.clear),max:Math.max(old.max,r.count),best:r.clear?Math.min(old.best??Infinity,r.seconds):old.best};}
export function saveResult(r:Result){const all=read<Partial<Record<Mode,RecordEntry>>>('hinata-records',{});all[r.mode]=recordResult(all[r.mode]??emptyRecord(),r);return write('hinata-records',all);}
export const time=(n:number)=>`${Math.floor(n/60).toString().padStart(2,'0')}:${Math.floor(n%60).toString().padStart(2,'0')}`;
