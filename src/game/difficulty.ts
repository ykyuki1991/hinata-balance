import type {Mode} from '../types';
/** All modes share predictable contact physics; difficulty comes from room and bearing response. */
export const difficulty:Record<Mode,{width:number;spring:number;loadSpring:number;damping:number;air:number;friction:number;stableTime:number;speed:number;spin:number}>={
 NORMAL:{width:328,spring:.60,loadSpring:.115,damping:2.6,air:.025,friction:1,stableTime:.65,speed:.36,spin:.006},
 HARD:{width:292,spring:.34,loadSpring:.11,damping:2.3,air:.022,friction:.94,stableTime:.85,speed:.32,spin:.0055},
 'ALL MEMBERS':{width:328,spring:.54,loadSpring:.115,damping:2.6,air:.025,friction:1,stableTime:.8,speed:.34,spin:.006}
};
