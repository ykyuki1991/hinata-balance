import test from 'node:test';
import assert from 'node:assert/strict';
import Matter from 'matter-js';
import {members} from '../src/data/members';
import {createPiece} from '../src/game/piece';
test('every real silhouette and rendered pose use the same rotation centre',()=>{
 for(const m of members)for(const angle of [-Math.PI/2,-.26,0,.26,Math.PI/2]){
  const piece=createPiece(m,{x:170,y:300},angle);
  for(const v of piece.body.vertices){const local=Matter.Vector.rotate(Matter.Vector.sub(v,piece.body.position),-angle);const x=local.x+piece.dx,y=local.y+piece.dy;
   assert.ok(m.collisionShape.some(p=>Math.hypot(p.x-x,p.y-y)<.01),`${m.name}, ${angle}`);
  }
  const visualCentre=Matter.Vector.add(piece.body.position,Matter.Vector.rotate({x:m.width/2-piece.dx,y:m.height/2-piece.dy},angle));
  assert.ok(Math.hypot(visualCentre.x-170,visualCentre.y-300)<.001);
 }
});
