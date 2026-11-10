import test from "node:test";
import assert from "node:assert/strict";
import {initialConsent,transitionConsent,consentSummary,ConsentFault} from "../src/consent.mjs";
test("defaults optional off; makes withdrawal explicit and non-destructive",()=>{
 const start=initialConsent();
 assert.deepEqual(start,{necessary:true,analytics:false,personalization:false,revision:0});
 const enabled=transitionConsent(start,{type:"ACCEPT_OPTIONAL",value:null});
 assert.equal(enabled.analytics,true);assert.equal(enabled.personalization,true);
 const withdrawn=transitionConsent(enabled,{type:"WITHDRAW",value:null});
 assert.equal(withdrawn.analytics,false);
 assert.equal(withdrawn.personalization,false);
 assert.equal(withdrawn.necessary,true);
 assert.equal(consentSummary(withdrawn).storedOrTransmitted,false);
 assert.deepEqual(start,initialConsent());
 assert(Object.isFrozen(enabled));
});
test("granular opt-in and decline remain deterministic",()=>{
 const start=initialConsent();
 const analytics=transitionConsent(start,{type:"SET_ANALYTICS",value:true});
 assert.equal(analytics.analytics,true);
 assert.equal(analytics.personalization,false);
 const decline=transitionConsent(analytics,{type:"DECLINE_OPTIONAL",value:null});
 assert.equal(decline.analytics,false);assert.equal(decline.necessary,true);
 assert.equal(decline.revision,2);
});
test("rejects forged essential toggle, strange actions and accidental string booleans",()=>{
 const state=initialConsent();
 for(const bad of [
  {...state,necessary:false},{...state,revision:NaN},{...state,extra:"private"},
  Object.assign(Object.create(Date.prototype),state)
 ])assert.throws(()=>transitionConsent(bad,{type:"WITHDRAW",value:null}),ConsentFault);
 for(const bad of [
  {type:"SET_ANALYTICS",value:"true"},
  {type:"SET_NECESSARY",value:false},
  {type:"WITHDRAW",value:false},
  {type:"ACCEPT_OPTIONAL"},
  {type:"WITHDRAW",value:null,secret:true},
  Object.assign(Object.create(null),{type:"WITHDRAW",value:null})
 ])assert.throws(()=>transitionConsent(state,bad),ConsentFault);
});
test("bounded revision prevents synthetic unbounded state replay",()=>{
 const state={...initialConsent(),revision:100};
 assert.throws(()=>transitionConsent(state,{type:"WITHDRAW",value:null}),/REVISION_LIMIT/);
});
