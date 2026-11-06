import {
  newChecklist, editChecklist, continueChecklist, serializeChecklist, restoreChecklist
} from "../src/checklist.mjs";
let state = newChecklist();
const blocked = continueChecklist(state);
state = editChecklist(state, "activity", "Fictional sunny afternoon");
state = continueChecklist(state);
state = editChecklist(state, "supply", "Paper kite");
state = editChecklist(state, "quantity", "2");
state = continueChecklist(state);
const recovered = restoreChecklist(serializeChecklist(state));
const completed = continueChecklist(recovered);
process.stdout.write(JSON.stringify({
  rejected_empty_activity: blocked.errors.length > 0,
  restored_step: recovered.step,
  completed: completed.complete,
  activity: completed.values.activity
}, null, 2) + "\n");
