import Matter from 'matter-js';
import {difficulty} from './difficulty';
import type {Mode} from '../types';
const {Bodies,Body,Constraint}=Matter;
export const PIVOT={x:195,y:564};
export const MAX_TILT=24*Math.PI/180;
export function createSeesaw(mode:Mode){
 const width=difficulty[mode].width;
 const board=Bodies.rectangle(PIVOT.x,PIVOT.y,width,16,{label:'seesaw',friction:1,frictionStatic:1.4,restitution:0,frictionAir:.018});
 Body.setMass(board,7);Body.setInertia(board,66000);
 const pivot=Constraint.create({label:'central axle',pointA:{...PIVOT},bodyB:board,pointB:{x:0,y:0},length:0,stiffness:1,damping:.15});
 return {board,pivot,width};
}
/** Passive torsion spring and bearing friction; all driving torque comes from real contacts. */
export function applyBearing(board:Matter.Body,mode:Mode,_progress:number,dt:number,supportedMass=0){
 const config=difficulty[mode];
 // Smooth passive response. Difficulty does not change suddenly after counting a piece.
 board.torque-=board.angle*(config.spring+supportedMass*config.loadSpring);
 Body.setAngularVelocity(board,board.angularVelocity*Math.exp(-config.damping*dt));
}
/** Mechanical end stops, never an animation or an externally prescribed board angle. */
export function limitSeesaw(board:Matter.Body){
 if(Math.abs(board.angle)>MAX_TILT){const sign=Math.sign(board.angle);Body.setAngle(board,sign*MAX_TILT);if(Math.sign(board.angularVelocity)===sign)Body.setAngularVelocity(board,-board.angularVelocity*.08);}
}
