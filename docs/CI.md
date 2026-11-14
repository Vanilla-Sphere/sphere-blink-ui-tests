# Continuous integration

The suite runs on GitHub Actions in two places, through one action
(`action.yml` at the root of this repository).

| Where | When | Site under test |
| --- | --- | --- |
| This repository, `.github/workflows/ui-tests.yml` | Every push to `main`, every pull request, or by hand (Actions > ui-tests > Run workflow) | Production, or the one chosen by hand |
| `Vanilla-Sphere/sphere-blink`, `.github/workflows/ui-tests.yml` | After every merge to `develop` | <https://dev.vanillasphere.com> |
| | After every merge to `main` | <https://vanillasphere.com> |

In sphere-blink the run waits until the site serves the merged commit, then
calls this repository:

```yaml
- uses: Vanilla-Sphere/sphere-blink-ui-tests@main
  with:
    base-url: https://dev.vanillasphere.com/
```

The result is a check on the sphere-blink commit. The tests, their
configuration and the way they are run stay here, so a change to a test needs
no change in sphere-blink: the next merge there runs whatever is on `main`
here.

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
