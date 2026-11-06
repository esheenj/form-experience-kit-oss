import test from "node:test";
import assert from "node:assert/strict";
import {
  newChecklist, editChecklist, validateStep, continueChecklist, backChecklist,
  serializeChecklist, restoreChecklist, verifyChecklist, FormFault
} from "../src/checklist.mjs";

function prepare() {
  let state = newChecklist();
  state = editChecklist(state, "activity", "Imaginary park lunch");
  state = continueChecklist(state);
  state = editChecklist(state, "supply", "Reusable napkin");
  state = editChecklist(state, "quantity", "2");
  return state;
}

test("fictional three-step form validates, reviews and completes", () => {
  let start = newChecklist();
  let denied = continueChecklist(start);
  assert.equal(denied.step, 0);
  assert.equal(denied.errors.length, 1);
  assert.equal(start.errors.length, 0);
  let state = prepare();
  assert.equal(state.step, 1);
  state = continueChecklist(state);
  assert.equal(state.step, 2);
  assert.equal(continueChecklist(state).complete, true);
  assert.equal(state.complete, false);
});

test("back and forward retain draft state without mutating previous snapshots", () => {
  const state = prepare();
  const back = backChecklist(state);
  assert.equal(back.step, 0);
  assert.equal(back.values.activity, "Imaginary park lunch");
  assert.equal(state.step, 1);
  assert.equal(backChecklist(newChecklist()).step, 0);
  const forward = continueChecklist(back);
  assert.equal(forward.step, 1);
});

test("step-specific validation rejects invalid quantities and short labels", () => {
  let state = editChecklist(newChecklist(), "activity", "ab");
  assert.equal(validateStep(state).length, 1);
  state = prepare();
  for (const quantity of ["0", "-1", "1.5", "01", "21", "Infinity", ""]) {
    const rejected = continueChecklist(editChecklist(state, "quantity", quantity));
    assert.equal(rejected.step, 1);
    assert.ok(rejected.errors.some(x => x.includes("Quantity")));
  }
  assert.throws(() => editChecklist(state, "unknown", "abc"), FormFault);
  assert.throws(() => editChecklist(state, "activity", "x".repeat(101)), FormFault);
  assert.throws(() => editChecklist(state, "activity", null), FormFault);
});

test("versioned export and strict restore recover fictional progress", () => {
  const state = prepare();
  const encoded = serializeChecklist(state);
  const restored = restoreChecklist(encoded);
  assert.deepEqual(restored, state);
  assert.notStrictEqual(restored.values, state.values);
  assert.equal(continueChecklist(restored).step, 2);
  assert.throws(() => restoreChecklist("{bad"), FormFault);
  assert.throws(() => restoreChecklist(JSON.stringify({ ...JSON.parse(encoded), format: "old-v0" })), FormFault);
  assert.throws(() => restoreChecklist(JSON.stringify({ ...JSON.parse(encoded), step: 9 })), FormFault);
  assert.throws(() => restoreChecklist(JSON.stringify({ ...JSON.parse(encoded), values: { activity: "X" } })), FormFault);
  assert.throws(() => restoreChecklist("x".repeat(2050)), FormFault);
});

test("forged completed state and unknown fields cannot bypass checks", () => {
  let state = newChecklist();
  assert.throws(() => verifyChecklist({ ...state, complete: true }), FormFault);
  assert.throws(() => verifyChecklist({ ...state, injected: "x" }), FormFault);
  state = continueChecklist(continueChecklist(editChecklist(state, "activity", "Synthetic lunch")));
  assert.equal(state.step, 1);
  const complete = continueChecklist(continueChecklist(prepare()));
  assert.equal(complete.complete, true);
  assert.throws(() => editChecklist(complete, "supply", "other"), FormFault);
  assert.strictEqual(backChecklist(complete), complete);
});
