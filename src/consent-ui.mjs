import {initialConsent,transitionConsent,consentSummary} from "./consent.mjs";
const $=id=>document.getElementById(id);
let state=initialConsent();
function draw(){
 const summary=consentSummary(state);
 $("necessary").checked=true;
 $("analytics").checked=summary.analytics;
 $("personalization").checked=summary.personalization;
 $("status").textContent="Revision "+summary.revision+" · Optional analytics "+(summary.analytics?"on":"off")+
   " · Optional personalization "+(summary.personalization?"on":"off")+". All simulated locally.";
}
for(const id of ["analytics","personalization"]){
 $(id).addEventListener("change",()=>{
  state=transitionConsent(state,{type:"SET_"+id.toUpperCase(),value:$(id).checked});
  draw();$("status").focus();
 });
}
for(const [id,type] of [["accept","ACCEPT_OPTIONAL"],["decline","DECLINE_OPTIONAL"],["withdraw","WITHDRAW"]]){
 $(id).addEventListener("click",()=>{
  state=transitionConsent(state,{type,value:null});
  draw();$("status").focus();
 });
}
$("reset").addEventListener("click",()=>{state=initialConsent();draw();$("analytics").focus();});
draw();
