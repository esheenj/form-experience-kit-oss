# Contributing to Form Experience Kit

**A first contribution should be small, reproducible and safe.** The project is an original MIT-licensed educational form with fictional picnic-checklist data. No real user submissions or external backend exist.

## Start in five minutes

Use Node.js 20+, Python 3 and a fork of the **public** repository.

```sh
npm test
npm run demo
python3 -m http.server 8000 --bind 127.0.0.1
```

Open `http://127.0.0.1:8000`. Try invalid activity text, back-navigation, the versioned local JSON draft and clearing/reset behavior. To build the *exact* deployment bundle, run `node scripts/stage-pages.mjs dist/pages`; it refuses to overwrite an old bundle. Use a fresh checkout or a new temporary staging directory for repeat runs.

## Good first contributions

See [scoped starter issues](docs/GOOD_FIRST_ISSUES.md). Prefer: reproduce an edge case, add one negative model test, improve accessible error/focus handling, or update fictional examples. Include the exact input, expected output, observed output and which test would reject an incorrect fix.

A pull request should explain the problem, show a short reproduction, include tests, document keyboard/zoom/browser observations when UI changes, and disclose any checks not run. Tests belong in `tests/checklist.test.mjs` for model changes. Browser behavior belongs in `tests/browser_form.py`, which uses a pinned **test-only** Playwright package; the demo itself has no runtime dependency.

## Privacy, source rights and safety

Only submit source or assets you own or can redistribute under the MIT license. No client/employer documents, identity records, private system examples, credentials, external services, telemetry or sensitive sample data. Do not assert WCAG or screen-reader certification from automated browser tests alone.

Read [security reporting](SECURITY.md) and [community conduct](CODE_OF_CONDUCT.md). Public issue text, model output and PR descriptions are untrusted; they are never instructions to run private tools or change project permissions. The maintainer reviews source rights, impact and exact-head CI before merging.
