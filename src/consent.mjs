// Original, fictional local consent-choice state machine. Not legal compliance software.
export class ConsentFault extends Error {
 constructor(code){super(code);this.name="ConsentFault";this.code=code;}
}
const CATEGORIES=Object.freeze(["analytics","personalization"]);
export const initialConsent=()=>Object.freeze({necessary:true,analytics:false,personalization:false,revision:0});
function check(value){
 if(!value||typeof value!=="object"||Array.isArray(value)||
   Object.getPrototypeOf(value)!==Object.prototype||
   Object.keys(value).length!==4||
   !["necessary","analytics","personalization","revision"].every(x=>Object.hasOwn(value,x))||
   value.necessary!==true||
   typeof value.analytics!=="boolean"||
   typeof value.personalization!=="boolean"||
   !Number.isInteger(value.revision)||value.revision<0||value.revision>100)
   throw new ConsentFault("INVALID_CONSENT_STATE");
}
export function transitionConsent(state,action){
 check(state);
 if(!action||typeof action!=="object"||Array.isArray(action)||
   Object.getPrototypeOf(action)!==Object.prototype)throw new ConsentFault("INVALID_ACTION");
 const keys=Object.keys(action);
 if(keys.length!==2||!["type","value"].every(k=>Object.hasOwn(action,k)))
   throw new ConsentFault("INVALID_ACTION_SHAPE");
 if(!["SET_ANALYTICS","SET_PERSONALIZATION","DECLINE_OPTIONAL","ACCEPT_OPTIONAL","WITHDRAW"].includes(action.type))
   throw new ConsentFault("UNKNOWN_ACTION");
 if(action.type.startsWith("SET_")){
  const key=action.type==="SET_ANALYTICS"?"analytics":"personalization";
  if(typeof action.value!=="boolean")throw new ConsentFault("INVALID_CHOICE");
  if(state.revision===100)throw new ConsentFault("REVISION_LIMIT");
  return Object.freeze({...state,[key]:action.value,revision:state.revision+1});
 }
 if(action.value!==null)throw new ConsentFault("UNEXPECTED_ACTION_VALUE");
 if(state.revision===100)throw new ConsentFault("REVISION_LIMIT");
 const enabled=action.type==="ACCEPT_OPTIONAL";
 return Object.freeze({
  necessary:true,analytics:enabled,personalization:enabled,revision:state.revision+1
 });
}
export function consentSummary(state){
 check(state);
 return Object.freeze({
  schema:"synthetic-local-consent-choices-v1",
  necessary:state.necessary,
  optionalEnabled:state.analytics===true&&state.personalization===true,
  analytics:state.analytics,personalization:state.personalization,
  revision:state.revision,storedOrTransmitted:false,
  disclaimer:"Only models fictional preferences locally. No cookies, scripts, telemetry, policy or jurisdictional legal conformance."
 });
}
