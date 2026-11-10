import test from "node:test";
import assert from "node:assert/strict";
import {inspectOnboarding,OnboardingFault} from "../src/onboarding.mjs";
const sample=()=>[
 {id:"value-preview",title:"Preview fictional value",seconds:40,required:true,skippable:false,accountGate:false},
 {id:"create-account",title:"Create fictional account",seconds:110,required:true,skippable:false,accountGate:true},
 {id:"preferences",title:"Set fictional preferences",seconds:60,required:false,skippable:false,accountGate:false}
];
test("returns explainable offline warnings, never fake observed conversion",()=>{
 const x=sample(),r=inspectOnboarding(x);
 assert.equal(r.estimatedSeconds,210);
 assert.equal(r.flagCount,3);
 assert.deepEqual(r.flags.map(f=>f.code),["LONG_STEP","OPTIONAL_NOT_SKIPPABLE","LONG_JOURNEY"]);
 assert.equal(r.measuredConversion,false);
 assert.equal(r.actualUsabilityEvidence,false);
 assert.deepEqual(x,sample());
 assert(Object.isFrozen(r));
 assert(Object.isFrozen(r.flags));
});
test("supports no-flag example, early gate and a many-step journey",()=>{
 const x=sample().slice(0,1);
 assert.equal(inspectOnboarding(x).flagCount,0);
 x[0].accountGate=true;
 assert.equal(inspectOnboarding(x).flags[0].code,"EARLY_ACCOUNT_GATE");
 const long=Array.from({length:5},(_,i)=>({...sample()[0],id:"s"+String(i+100)}));
 assert.equal(inspectOnboarding(long).flags.at(-1).code,"LONG_JOURNEY");
 assert(inspectOnboarding(long).flags.some(f=>f.code==="MANY_STEPS"));
});
test("rejects fabricated impossible stages, unsafe shapes and policy conflicts",()=>{
 const fixtures=[
  [],Array(9).fill(sample()[0]),
  [{...sample()[0],id:"<img>" }],[{...sample()[0],seconds:Infinity}],
  [{...sample()[0],seconds:1.1}],[{...sample()[0],required:"true"}],
  [{...sample()[0],required:true,skippable:true}],
  [{...sample()[0],extra:"private"}],
  [Object.assign(Object.create(Date.prototype),sample()[0])],
  [sample()[0],sample()[0]]
 ];
 for(const bad of fixtures)assert.throws(()=>inspectOnboarding(bad),OnboardingFault);
});
test("markup-looking title remains literal data only",()=>{
 const x=sample();x[0].title='<img src=x onerror=alert(1)>';
 assert.equal(inspectOnboarding(x).steps[0].title,x[0].title);
});
