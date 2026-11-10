import {inspectOnboarding} from "./onboarding.mjs";
const $=id=>document.getElementById(id);
const demo=[
 {id:"value-preview",title:"Preview the invented benefit",seconds:40,required:true,skippable:false,accountGate:false},
 {id:"create-account",title:"Create a fictional account",seconds:110,required:true,skippable:false,accountGate:true},
 {id:"preferences",title:"Pick invented preferences",seconds:60,required:false,skippable:false,accountGate:false}
];
$("input").value=JSON.stringify(demo,null,2);
function render(){
 $("flags").replaceChildren();
 $("output").hidden=true;
 const raw=$("input").value;
 if(new TextEncoder().encode(raw).length>12288){
  $("status").textContent="Rejected: limit inputs to 12 KiB of fictional metadata.";return;
 }
 let report;
 try{report=inspectOnboarding(JSON.parse(raw));}
 catch(_){$("status").textContent="Rejected: check the array of steps, durations, unique IDs and required/skip policy.";return;}
 $("status").textContent=report.flagCount+" heuristic flags for "+report.steps.length+" fictional steps.";
 $("duration").textContent=report.estimatedSeconds+" estimated seconds";
 if(report.flagCount===0){
  const item=document.createElement("li");item.textContent="No modeled flags. This is not observed user success.";
  $("flags").append(item);
 }
 for(const finding of report.flags){
  const li=document.createElement("li");
  const strong=document.createElement("strong");
  strong.textContent=finding.code+" — "+finding.stepId;
  const p=document.createElement("p");p.textContent=finding.why;
  li.append(strong,p);$("flags").append(li);
 }
 $("next").textContent=report.nextTest;
 $("output").hidden=false;
}
$("review").addEventListener("click",render);
$("reset").addEventListener("click",()=>{$("input").value=JSON.stringify(demo,null,2);render();$("input").focus();});
render();
