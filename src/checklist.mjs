// Independently authored educational form-state model.
// Scenario: a fictional picnic checklist. No network, accounts or personal data.
export class FormFault extends Error {
  constructor(message) { super(message); this.name = "FormFault"; }
}
const keys = ["activity", "supply", "quantity"];
const isPlain = x => x !== null && typeof x === "object" &&
  !Array.isArray(x) && [Object.prototype, null].includes(Object.getPrototypeOf(x));
const equalKeys = (a, expected) => Object.keys(a).sort().join("|") ===
  [...expected].sort().join("|");

export function newChecklist() {
  return { step: 0, values: { activity: "", supply: "", quantity: "1" },
    errors: [], complete: false };
}
export function verifyChecklist(state) {
  if (!isPlain(state) || !equalKeys(state, ["step", "values", "errors", "complete"]) ||
    !Number.isInteger(state.step) || state.step < 0 || state.step > 2 ||
    !isPlain(state.values) || !equalKeys(state.values, keys) ||
    !keys.every(k => typeof state.values[k] === "string" && state.values[k].length <= 100) ||
    !Array.isArray(state.errors) || !state.errors.every(x => typeof x === "string") ||
    typeof state.complete !== "boolean" || (state.complete && state.step !== 2))
    throw new FormFault("Invalid checklist state");
  return true;
}
export function editChecklist(state, field, value) {
  verifyChecklist(state);
  if (state.complete) throw new FormFault("Completed checklist cannot be edited");
  if (!keys.includes(field) || typeof value !== "string" || value.length > 100)
    throw new FormFault("Unsupported field input");
  return { ...state, values: { ...state.values, [field]: value }, errors: [] };
}
export function validateStep(state) {
  verifyChecklist(state);
  const errors = [];
  if (state.step === 0 && !/^.{3,80}$/.test(state.values.activity.trim()))
    errors.push("Add a fictional activity name between 3 and 80 characters.");
  if (state.step === 1) {
    if (!/^.{2,60}$/.test(state.values.supply.trim()))
      errors.push("Enter a fictional supply name between 2 and 60 characters.");
    if (!/^(?:[1-9]|1[0-9]|20)$/.test(state.values.quantity))
      errors.push("Quantity must be a whole number from 1 to 20.");
  }
  return errors;
}
export function continueChecklist(state) {
  verifyChecklist(state);
  if (state.complete) return state;
  const errors = validateStep(state);
  if (errors.length) return { ...state, errors };
  if (state.step === 2) return { ...state, complete: true, errors: [] };
  return { ...state, step: state.step + 1, errors: [] };
}
export function backChecklist(state) {
  verifyChecklist(state);
  if (state.complete || state.step === 0) return state;
  return { ...state, step: state.step - 1, errors: [] };
}
export function serializeChecklist(state) {
  verifyChecklist(state);
  // Only the intentional visible form fields are exported.
  return JSON.stringify({ format: "picnic-checklist-v1", step: state.step,
    values: state.values, complete: state.complete });
}
export function restoreChecklist(json) {
  if (typeof json !== "string" || json.length > 2048) throw new FormFault("Invalid draft");
  let value;
  try { value = JSON.parse(json); }
  catch { throw new FormFault("Draft is not valid JSON"); }
  if (!isPlain(value) || !equalKeys(value, ["format", "step", "values", "complete"]) ||
    value.format !== "picnic-checklist-v1") throw new FormFault("Unsupported draft format");
  const restored = { step: value.step, values: value.values, complete: value.complete, errors: [] };
  verifyChecklist(restored);
  if (restored.step >= 1 &&
      validateStep({ ...restored, step: 0, complete: false }).length)
    throw new FormFault("Draft cannot skip invalid first step");
  if (restored.step >= 2 &&
      validateStep({ ...restored, step: 1, complete: false }).length)
    throw new FormFault("Draft cannot skip invalid second step");
  return { ...restored, values: { ...restored.values } };
}
