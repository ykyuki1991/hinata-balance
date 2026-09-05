export type Grade='PERFECT'|'GOOD'|'DANGER';
/** Judge the final stable window, not time spent thinking or a single lucky frame. */
export function placementAward(meanTilt:number,peakTilt:number,overhang=0):{grade:Grade;points:number}{
 const grade:Grade=peakTilt<=3&&overhang<=8?'PERFECT':peakTilt<=9&&overhang<=30?'GOOD':'DANGER';
 return {grade,points:100+Math.round(60*Math.max(0,1-meanTilt/12))+(grade==='PERFECT'?20:0)-Math.round(Math.min(40,overhang*.6))};
}
export const clearBonus=(seconds:number)=>300+Math.max(0,120-Math.floor(seconds));
