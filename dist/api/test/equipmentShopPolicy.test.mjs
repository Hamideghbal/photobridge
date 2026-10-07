import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeReach,reachAllows,discountedAmount} from '../equipmentShopPolicy.js';

test('sale and rental have independent city, province and activation rules',()=>{
  const shop={active:true,province:'تهران',city:'تهران',sale_enabled:true,rental_enabled:true,
    sale_reach:{mode:'all'},rental_reach:{mode:'selected',provinces:['البرز'],cities:['تهران/تهران']}};
  assert.equal(reachAllows(shop,'sale',{province:'فارس',city:'شیراز'}),true);
  assert.equal(reachAllows(shop,'rental',{province:'فارس',city:'شیراز'}),false);
  assert.equal(reachAllows(shop,'rental',{province:'البرز',city:'کرج'}),true);
  assert.equal(reachAllows(shop,'rental',{province:'تهران',city:'تهران'}),true);
  shop.rental_enabled=false;
  assert.equal(reachAllows(shop,'rental',{province:'تهران',city:'تهران'}),false);
  assert.equal(reachAllows(shop,'sale',{province:'تهران',city:'تهران'}),true);
});

test('local store reach requires an exact city and unknown location is not accepted',()=>{
  const shop={province:'تهران',city:'تهران',rental_reach:normalizeReach({mode:'local'})};
  assert.equal(reachAllows(shop,'rental',{province:'تهران',city:'کرج'}),false);
  assert.equal(reachAllows(shop,'rental',{}),false);
  assert.equal(reachAllows(shop,'rental',{province:'تهران',city:'تهران'}),true);
});

test('birthday and permanent discounts do not stack or exceed a sale',()=>{
  assert.deepEqual(discountedAmount(10000,10,20),{grossAmount:10000,discountPercent:20,discountAmount:2000,totalAmount:8000,discountReason:'birthday'});
  assert.equal(discountedAmount(500,200,0).totalAmount,0);
});
