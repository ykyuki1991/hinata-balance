import test from 'node:test';
import assert from 'node:assert/strict';
import {placementAward,clearBonus} from '../src/game/scoring';
test('balance earns more than dangerous placement; peak tilt prevents lucky-frame perfects',()=>{
 assert.equal(placementAward(0,0).grade,'PERFECT');assert.equal(placementAward(2,7).grade,'GOOD');assert.equal(placementAward(3,10).grade,'DANGER');
 assert.ok(placementAward(0,0).points>placementAward(6,7).points);assert.ok(placementAward(6,7).points>placementAward(15,17).points);assert.equal(placementAward(24,24).points,100);
 assert.ok(clearBonus(40)>clearBonus(60));assert.equal(clearBonus(1000),300);
});
