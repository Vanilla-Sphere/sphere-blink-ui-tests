# Continuous integration

The suite runs on GitHub Actions in two places, through one action
(`action.yml` at the root of this repository).

**Rule of the team (2026-11-16): the suite never runs against production or
any site hosted on Render.** Both places below start the service of
sphere-blink inside the GitHub job and make every name of the deployed sites
(`vanillasphere.com`, `www.` and `dev.vanillasphere.com`, the two
`onrender.com` names) resolve to that job's machine, so a test that names a
deployed site reaches that server or fails.

| Where | When | Service under test |
| --- | --- | --- |
| This repository, `.github/workflows/ui-tests.yml` | Every push to `main`, every pull request, or by hand | sphere-blink `develop` (or the branch chosen by hand), started in the job |
| `Vanilla-Sphere/sphere-blink`, `.github/workflows/ui-tests.yml` | Every pull request to `develop` or `main`, before the merge | The commit of the pull request, started in the job |

Nothing runs after a deploy. The result is a check on the pull request. The
tests, their configuration and the way they are run stay here, so a change
to a test needs no change in sphere-blink.

Running the suite on your own computer: start the service there
(`sh scripts/start_local_site.sh` in a sphere-blink checkout) and set
`BASE_URL=http://127.0.0.1:8000/`. Never run it with `BASE_URL` left out or
set to a deployed site.

## What a run does

1. Installs Node 22, the suite (`npm ci`) and Playwright's Chromium.
2. Runs `npx playwright test` with `BASE_URL` set to the site. Inputs
   `project` and `grep` narrow the run.
3. Writes a summary on the run page (counts per project, the failed tests and
   why) and one error annotation per failed test
   (`scripts/ci-summary.mjs`, from `test-results/results.json`).
4. Uploads the HTML report, the JSON results and the traces of failed tests
   as the artifact `ui-tests-report`, kept 14 days.

The job fails when a test fails.

## Rules

- `TEST_ALLOW_HEAVY_JOBS` and `TEST_ALLOW_MEASURE` are forced empty in CI.
  The dev site is the viewer of `develop` in front of the engine of
  production, so those cases would start jobs and write rows in production
  from either site.
- `package-lock.json` must be committed with every change to `package.json`:
  CI installs with `npm ci`.
- sphere-blink may use the action only while Settings > Actions > General >
  Access of this repository is "Accessible from repositories in the
  'Vanilla-Sphere' organization".
