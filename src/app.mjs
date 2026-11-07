import {
  newChecklist, editChecklist, continueChecklist, backChecklist,
  serializeChecklist, restoreChecklist
} from "./checklist.mjs";

let state = newChecklist();
const form = document.querySelector("#picnic-form");
const steps = [...document.querySelectorAll("[data-stage]")];
const progress = document.querySelector("#progress");
const summary = document.querySelector("#errors");
const action = document.querySelector("#next");
const back = document.querySelector("#back");
const done = document.querySelector("#done");
const reviewData = document.querySelector("#review-data");
const draft = document.querySelector("#draft");
const save = document.querySelector("#save");
const restore = document.querySelector("#restore");
const download = document.querySelector("#download");
const fileDraft = document.querySelector("#file-draft");
const heading = document.querySelector("#form-title");
function draw({ focus = false } = {}) {
  steps.forEach(section => { section.hidden = state.complete ||
    Number(section.dataset.stage) !== state.step; });
  for (const [field, value] of Object.entries(state.values)) {
    const input = form.elements.namedItem(field);
    if (input && input.value !== value) input.value = value;
  }
  progress.textContent = state.complete ?
    "Completed fictional checklist" : `Step ${state.step + 1} of 3`;
  reviewData.replaceChildren();
  if (state.step === 2 && !state.complete) {
    for (const [label, key] of [
      ["Activity", "activity"], ["Supply", "supply"], ["Quantity", "quantity"]
    ]) {
      const term = document.createElement("dt");
      term.textContent = label;
      const description = document.createElement("dd");
      description.textContent = state.values[key];
      reviewData.append(term, description);
    }
  }
  summary.replaceChildren();
  if (state.errors.length) {
    const list = document.createElement("ul");
    state.errors.forEach(message => {
      const item = document.createElement("li");
      item.textContent = message;
      list.append(item);
    });
    summary.append(list);
  }
  back.disabled = state.step === 0 || state.complete;
  action.textContent = state.step === 2 ? "Finish" : "Continue";
  action.disabled = state.complete;
  form.hidden = state.complete;
  done.hidden = !state.complete;
  if (state.complete) {
    done.textContent = `Your fictional ${state.values.activity} checklist is complete.`;
  }
  if (focus) (state.errors.length ? summary : heading).focus();
}
form.addEventListener("input", event => {
  if (!["activity", "supply", "quantity"].includes(event.target.name)) return;
  state = editChecklist(state, event.target.name, event.target.value);
  draw();
});
form.addEventListener("submit", event => {
  event.preventDefault();
  state = continueChecklist(state);
  draw({ focus: true });
});
back.addEventListener("click", () => { state = backChecklist(state); draw({ focus: true }); });
save.addEventListener("click", () => {
  draft.value = serializeChecklist(state);
  draft.focus();
});
restore.addEventListener("click", () => {
  try {
    const nextState = restoreChecklist(draft.value);
    state = nextState;
    draw({ focus: true });
  } catch {
    summary.textContent = "The draft is invalid or from an unsupported version.";
    summary.focus();
  }
});
download.addEventListener("click", () => {
  const link = document.createElement("a");
  link.href = "data:application/json;charset=utf-8," + encodeURIComponent(serializeChecklist(state));
  link.download = "fictional-picnic-draft.json";
  document.body.append(link);
  link.click();
  link.remove();
});
fileDraft.addEventListener("change", async event => {
  const file = event.currentTarget.files?.[0];
  if (!file) return;
  try {
    if (file.size > 2048) throw new Error("File exceeds the draft size limit.");
    const text = await file.text();
    const nextState = restoreChecklist(text);
    state = nextState;
    draft.value = text;
    draw({ focus: true });
  } catch {
    summary.textContent = "The selected JSON file is invalid or from an unsupported version. The current draft is unchanged.";
    summary.focus();
  } finally {
    fileDraft.value = "";
  }
});
draw();
