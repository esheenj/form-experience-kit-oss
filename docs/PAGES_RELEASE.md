# GitHub Pages — fictional form demo

The original static form can be staged and tested without a subscription or runtime backend. **A public GitHub source repository does not itself prove a hosted Pages URL exists.**

## Local verification (no deployment)

```sh
npm test
node scripts/stage-pages.mjs dist/pages
FORM_DEMO_ROOT=dist/pages python3 tests/browser_form.py
```

The browser test requires the pinned test-only Playwright package and Chrome/Chromium as described in the main README. The workflow already performs these checks against the exact staged HTML and JavaScript. The staging script copies *only* `index.html`, `src/app.mjs`, `src/checklist.mjs`, and `.nojekyll`; it refuses an existing output and never includes Git history, tests, policies or private data.

## One-time enablement

GitHub requires an administrator to configure **Settings → Pages → Build and deployment → Source → GitHub Actions** for `esheenj/form-experience-kit-oss`. GitHub's normal `GITHUB_TOKEN` cannot turn Pages on using `actions/configure-pages` without an additional administrative credential; this repository deliberately stores no such token.

After Pages is enabled, the trusted [Publish CI-verified fictional form demo](../.github/workflows/publish-demo.yml) workflow deploys only after `Verify fictional form journey` has **successfully completed on a `main` push**. It checks out that exact verified source SHA, confirms Pages uses Actions, recreates the minimal source bundle and deploys via the first-party GitHub Pages actions. Pull requests never deploy. The deployment job has repository-scoped `pages:write` and `id-token:write` only.

If Pages was not enabled before the latest main push, the deployment workflow will fail with a settings instruction. Enable Pages and make a subsequent checked main commit to trigger a new verified publish. Do not blindly rerun an old workflow and claim it validates a newer HEAD.

## Live acceptance

A maintainer must verify the actual successful deployment job, inspect its `page_url`, request the HTTPS address in a real browser, and test one invalid activity, one valid step transition, a draft save-and-restore, a rejected malformed draft and narrow viewport behavior. Only then add that exact live URL to the README.

This demo makes no real user submissions, calls no backend and has no server-side persistence. Browser automation does not certify WCAG conformance, screen-reader behavior or physical-device compatibility.

## Rollback

Revert the public source change, verify the reverted main source through CI and let the next successful checked source deploy. GitHub repository administrators can disable Pages in Settings for an urgent stop. No paid hosting or new infrastructure service is required.
