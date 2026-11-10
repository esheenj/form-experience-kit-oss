import test from "node:test";
import assert from "node:assert/strict";
import {mkdtempSync,readFileSync,existsSync,rmSync,mkdirSync,writeFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {stagePages} from "../scripts/stage-pages.mjs";
function fixture(fn){
 const base=mkdtempSync(join(tmpdir(),"form-pages-"));
 try{return fn(base);}finally{rmSync(base,{recursive:true,force:true});}
}
test("stages the precise runnable synthetic ESM browser demo with no hidden files",async()=>{
 const base=mkdtempSync(join(tmpdir(),"form-pages-"));
 try{
  const output=join(base,"public-demo");
  const receipt=await stagePages(output);
  assert.equal(receipt.state,"STAGED_ONLY");
  assert.equal(receipt.publicUrlVerified,false);
  assert.deepEqual(receipt.files.map(x=>x.path),[
    ".nojekyll","index.html","onboarding.html","src/app.mjs","src/checklist.mjs","src/onboarding-ui.mjs","src/onboarding.mjs"
  ]);
  for(const entry of receipt.files){
    assert.match(entry.sha256,/^[a-f0-9]{64}$/);
    assert.equal(readFileSync(join(output,entry.path)).length,entry.size);
  }
  assert.equal(existsSync(join(output,"AGENTS.md")),false);
  assert.equal(existsSync(join(output,"tests")),false);
  assert.equal(existsSync(join(output,".git")),false);
  assert.equal(existsSync(join(output,".github")),false);
  assert.match(readFileSync(join(output,"index.html"),"utf8"),/src\/app\.mjs/);
  assert.match(readFileSync(join(output,"src/app.mjs"),"utf8"),/checklist\.mjs/);
  await assert.rejects(stagePages(output),/EEXIST/);
  assert.equal(readFileSync(join(output,"index.html"),"utf8").includes("Fictional Picnic"),true);
 }finally{rmSync(base,{recursive:true,force:true});}
});
test("denies staging over source files or arbitrary source directories",async()=>{
 await assert.rejects(stagePages("src/my-pages"),/SOURCE_TREE_DESTINATION/);
 await assert.rejects(stagePages("index.html"),/SOURCE_TREE_DESTINATION/);
});
test("refuses preexisting folder without modifying unrelated contents",async()=>{
 const base=mkdtempSync(join(tmpdir(),"form-pages-existing-"));
 try{
  const target=join(base,"keep");
  mkdirSync(target);writeFileSync(join(target,"safe.txt"),"unchanged");
  await assert.rejects(stagePages(target),/EEXIST/);
  assert.equal(readFileSync(join(target,"safe.txt"),"utf8"),"unchanged");
 }finally{rmSync(base,{recursive:true,force:true});}
});
