// Allowlisted public browser-demo artifact. No unreviewed repository files,
// private history, runtime dependencies, network operations or deployment.
import {lstat,mkdir,copyFile,writeFile,readdir,readFile,realpath} from "node:fs/promises";
import {resolve,dirname,join,sep} from "node:path";
import {fileURLToPath} from "node:url";
import {createHash} from "node:crypto";

const ROOT=fileURLToPath(new URL("../",import.meta.url));
const SOURCES=Object.freeze([
  "index.html","onboarding.html","src/app.mjs","src/checklist.mjs","src/onboarding.mjs","src/onboarding-ui.mjs"
]);
function fail(reason){throw new Error("FORM_PAGES_STAGE_"+reason);}
async function checkRegular(root,relative){
  let current=root;
  for(const part of relative.split("/")){
    current=join(current,part);
    const stat=await lstat(current);
    if(stat.isSymbolicLink())fail("SOURCE_SYMLINK");
  }
  if(!(await lstat(current)).isFile())fail("SOURCE_NOT_FILE");
}
async function list(folder,prefix=""){
  const result=[];
  for(const entry of await readdir(folder,{withFileTypes:true})){
    if(entry.isSymbolicLink())fail("OUTPUT_SYMLINK");
    if(entry.isDirectory())result.push(...await list(join(folder,entry.name),prefix+entry.name+"/"));
    else if(entry.isFile())result.push(prefix+entry.name);
    else fail("OUTPUT_NONREGULAR");
  }
  return result;
}
export async function stagePages(outputPath){
  if(typeof outputPath!=="string" || !outputPath.trim())fail("INVALID_OUTPUT");
  const root=await realpath(ROOT), out=resolve(outputPath);
  const expected=join(root,"dist","pages");
  if((out===root || out.startsWith(root+sep))&&out!==expected)
    fail("SOURCE_TREE_DESTINATION");
  for(const path of SOURCES)await checkRegular(root,path);
  await mkdir(dirname(out),{recursive:true});
  // Refuse pre-existing directories (and dangling symlinks): creation is exclusive.
  await mkdir(out);
  try{
    for(const path of SOURCES){
      await mkdir(dirname(join(out,path)),{recursive:true});
      await copyFile(join(root,path),join(out,path));
    }
    await writeFile(join(out,".nojekyll"),"",{flag:"wx",mode:0o600});
    const actual=(await list(out)).sort();
    const allowed=[".nojekyll",...SOURCES].sort();
    if(JSON.stringify(actual)!==JSON.stringify(allowed))fail("UNEXPECTED_OUTPUT");
    const index=await readFile(join(out,"index.html"),"utf8");
    const adapter=await readFile(join(out,"src/app.mjs"),"utf8");
    if(!index.includes('src="./src/app.mjs"') ||
       !adapter.includes('from "./checklist.mjs"'))fail("MODULE_REFERENCE");
    const addOn=await readFile(join(out,"onboarding.html"),"utf8");
    const addOnUI=await readFile(join(out,"src/onboarding-ui.mjs"),"utf8");
    if(!index.includes("onboarding.html")||!addOn.includes("./src/onboarding-ui.mjs")||
       !addOnUI.includes("./onboarding.mjs")||!addOn.includes("connect-src 'none'"))
      fail("ONBOARDING_OFFLINE_LINK");
    const files=[];
    for(const path of actual){
      const bytes=await readFile(join(out,path));
      files.push({path,size:bytes.length,sha256:createHash("sha256").update(bytes).digest("hex")});
    }
    return {schema:"public-form-demo-stage-v1",state:"STAGED_ONLY",publicSyntheticOnly:true,
      files,sourceOfTruth:"checked-out-exact-public-commit",publicUrlVerified:false};
  }catch(error){
    const {rm}=await import("node:fs/promises");
    await rm(out,{recursive:true,force:true});
    throw error;
  }
}
if(process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{console.log(JSON.stringify(await stagePages(process.argv[2]||"dist/pages"),null,2));}
 catch(error){console.error(JSON.stringify({state:"REJECTED",reason:String(error.message).slice(0,100)}));process.exitCode=2;}
}
