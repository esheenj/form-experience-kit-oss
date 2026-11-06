# Form Experience Kit

An original, **offline educational three-step form** showing validation, back navigation, progress, a final review and versioned JSON draft export/restore. Built around a wholly fictional picnic checklist, not a real application or client form.

## Use it

Requires Node.js 20+ and a local Python 3 web server (or any static-file server) to open ES modules in a browser:

```sh
npm test
npm run demo
python3 -m http.server 8000 --bind 127.0.0.1
```

Visit `http://127.0.0.1:8000` and try proceeding with an empty activity, correcting it, entering a fictional supply and quantity, returning to edit, reviewing and finishing. **Export draft** returns a versioned JSON string in the page, and **Restore draft** loads it back locally. No data leaves the browser.

## Modules

- `src/checklist.mjs`: deterministic model functions `newChecklist`, `editChecklist`, `continueChecklist`, `backChecklist`, `serializeChecklist` and `restoreChecklist`.
- `src/app.mjs`: event handlers and safe text rendering; no raw user-supplied HTML insertion.
- `index.html`: responsive form, labelled inputs, keyboard navigation, error summary, live progress and buttons.
- `tests/checklist.test.mjs`: empty fields, malformed inputs, invalid quantities, forged draft formats, immutability and restore paths.

## Limitations

This is a teaching example, **not** production submission, accessibility certification or a persistent form service. Browser/screen-reader and physical device QA remain separate from the deterministic Node tests. The JSON draft is not encrypted and must not contain personal or confidential information. No telemetry, third-party packages, account APIs, payment flow or employer/customer material is included.

MIT-licensed educational source. The package is `private: true` to prevent accidental npm publication. Contributions should be original and synthetic.
