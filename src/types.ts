export type Member={id:string;name:string;generation:string;image:string;width:number;height:number;mass:number;friction:number;restitution:number;collisionShape:{x:number;y:number}[];centerOfMassOffsetX:number;centerOfMassOffsetY:number};
export type Mode='NORMAL'|'HARD'|'ALL MEMBERS';
export type Settings={bgm:boolean;se:boolean;vibration:boolean;names:boolean;guide:boolean};
export type Result={mode:Mode;count:number;target:number;seconds:number;clear:boolean;used:Member[];score?:number;perfects?:number;averageTilt?:number;maxTilt?:number;failureReason?:string;order?:string[]};
