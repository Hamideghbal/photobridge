# PhotoBridge Codex Workflow

These instructions apply to Codex tasks in this repository.

## Default workflow
- Work on a dedicated branch; do not make direct code changes on `aaa-liara-release`.
- Keep changes narrowly scoped to the user's request.
- Run the relevant build and tests before publishing changes.
- If build/tests pass, commit and push the branch.
- Create a Pull Request targeting `aaa-liara-release`.
- For routine, low-risk changes (UI/CSS/JS text/layout/routing/cache/versioning and similarly bounded fixes), merge the PR automatically after successful tests.
- After merge, verify that the merged commit is present on `aaa-liara-release`.
- Liara Auto Deploy is connected to `aaa-liara-release`; do not run a manual production deploy unless explicitly requested.

## Liara deploy revision
- Any task that changes production-delivered files or runtime behavior must also update `DEPLOY_REVISION.txt` in the same branch before the final commit. This includes changes under `dist/`, `apps/web/public/`, production `scripts/`, `migrations/`, `Dockerfile`, or other files copied into the production image.
- Use a new unique readable token each time (for example `2026-10-08-r100f55-short-description`). Never reuse an older token.
- This file is an intentional Docker cache barrier: changing it must happen before PR creation so Liara reevaluates the application-source layers instead of reusing a stale `COPY dist ./dist` layer.
- Do not bump `DEPLOY_REVISION.txt` for documentation-only changes that cannot affect the deployed application.

## Merge conflicts
- If the branch is behind or conflicts with `aaa-liara-release`, update the branch from current `aaa-liara-release`, resolve conflicts while preserving current production behavior and the requested fix, then rerun build/tests before merging.
- Never drop newer `aaa-liara-release` changes just to make the branch mergeable.

## Stop conditions
Do not auto-merge. Stop and report clearly if any of these apply:
- database schema or migration changes;
- destructive data operations;
- authentication/authorization/security-sensitive changes;
- broad API contract changes;
- changes that can materially affect billing, subscriptions, payments, or data integrity;
- failing or inconclusive build/tests;
- unresolved merge conflicts or uncertain behavior.

## GitHub
- The repository connection is expected to support fetch, push, Pull Requests, and merge.
- A 403 when reading branch-protection metadata does not by itself mean PR/merge is unavailable; use the actual PR/merge workflow to determine capability.
- Do not ask the user to manually copy results to ChatGPT when the task can be completed through GitHub directly.

## Reporting
At the end of a successful task, report:
- branch name;
- build/test result;
- PR number;
- merge commit SHA;
- whether Auto Deploy should now have been triggered from `aaa-liara-release`.
