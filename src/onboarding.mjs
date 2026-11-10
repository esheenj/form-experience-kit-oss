// Original offline onboarding-friction heuristic. All inputs must be fictional.
// Not a usability study, experiment, accessibility audit or product metric.
export class OnboardingFault extends Error {
 constructor(code){super(code);this.name="OnboardingFault";this.code=code;}
}
const K=["id","title","seconds","required","skippable","accountGate"];
const ID=/^[a-z][a-z0-9-]{2,36}$/;
const plain=x=>x!==null&&typeof x==="object"&&!Array.isArray(x)&&[Object.prototype,null].includes(Object.getPrototypeOf(x));
export function inspectOnboarding(steps){
 if(!Array.isArray(steps)||steps.length===0||steps.length>8)throw new OnboardingFault("INVALID_STEP_COUNT");
 const seen=new Set();
 const flags=[];
 let totalSeconds=0;
 const normalized=steps.map((step,index)=>{
  if(!plain(step)||Object.keys(step).length!==K.length||!K.every(k=>Object.hasOwn(step,k)))throw new OnboardingFault("INVALID_STEP_SHAPE");
  if(typeof step.id!=="string"||!ID.test(step.id)||seen.has(step.id))throw new OnboardingFault("INVALID_OR_DUPLICATE_ID");
  seen.add(step.id);
  if(typeof step.title!=="string"||step.title.trim().length<2||step.title.length>80)throw new OnboardingFault("INVALID_TITLE");
  if(!Number.isInteger(step.seconds)||step.seconds<0||step.seconds>600)throw new OnboardingFault("INVALID_TIME");
  for(const key of ["required","skippable","accountGate"]){
   if(typeof step[key]!=="boolean")throw new OnboardingFault("INVALID_BOOLEAN");
  }
  if(step.required&&step.skippable)throw new OnboardingFault("CONFLICTING_POLICY");
  totalSeconds+=step.seconds;
  if(step.seconds>90)flags.push(Object.freeze({stepId:step.id,code:"LONG_STEP",why:"Estimated over 90 seconds"}));
  if(!step.required&&!step.skippable)flags.push(Object.freeze({stepId:step.id,code:"OPTIONAL_NOT_SKIPPABLE",why:"Optional step has no skip path"}));
  if(step.accountGate&&index<2)flags.push(Object.freeze({stepId:step.id,code:"EARLY_ACCOUNT_GATE",why:"Account gate before users explore value"}));
  return Object.freeze({...step});
 });
 if(steps.length>4)flags.push(Object.freeze({stepId:"journey",code:"MANY_STEPS",why:"More than four onboarding steps"}));
 if(totalSeconds>180)flags.push(Object.freeze({stepId:"journey",code:"LONG_JOURNEY",why:"Estimated journey exceeds three minutes"}));
 return Object.freeze({
  schema:"fictional-onboarding-review-v1",steps:Object.freeze(normalized),
  estimatedSeconds:totalSeconds,flagCount:flags.length,flags:Object.freeze(flags),
  nextTest:flags.length?"Run a real, consented usability task before deciding what to remove.":"Observe completion and comprehension with real participants before declaring success.",
  measuredConversion:false,actualUsabilityEvidence:false,
  disclaimer:"Heuristics on fictional estimates only. No users observed or conversion measured."
 });
}
