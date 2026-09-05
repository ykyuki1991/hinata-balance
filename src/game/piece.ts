import Matter from 'matter-js';
import type {Member} from '../types';
const {Bodies,Body,Vertices}=Matter;
/** Sprite and collision polygon share one rotation around the same centre of mass. */
export function createPiece(m:Member,pos:{x:number;y:number},angle=0,frictionScale=1){
 const centroid=Vertices.centre(m.collisionShape as Matter.Vector[]);
 const dx=centroid.x+m.centerOfMassOffsetX,dy=centroid.y+m.centerOfMassOffsetY;
 const body=Bodies.fromVertices(0,0,[m.collisionShape],{label:m.name,friction:m.friction*frictionScale,frictionStatic:1,restitution:m.restitution,frictionAir:.022});
 Body.setMass(body,m.mass);Body.setCentre(body,{x:m.centerOfMassOffsetX,y:m.centerOfMassOffsetY},true);Body.setAngle(body,angle);
 const x=dx-m.width/2,y=dy-m.height/2;
 Body.setPosition(body,{x:pos.x+x*Math.cos(angle)-y*Math.sin(angle),y:pos.y+x*Math.sin(angle)+y*Math.cos(angle)});
 return {body,member:m,dx,dy};
}
