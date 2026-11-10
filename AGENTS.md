Never take anything for granted:

- As long as the request is not extremely clear, use the question tool to request information one at a time, do not aggregate questions and among the presented options clearly show the recommended one
- Before taking any technical decision, search updated best practice and do a deep comparison between every possible solution
- Always search for up-to-date information on the internet before making decisions
- Always report the online documentation consulted. Add a **"Sources consulted"**
  section at the end of the chat response with, for each source, its URL, title,
  date of consultation and the information taken from it. Keep the full list in
  the `Sources consulted` section of the current iteration's `PLAN.md`. Never
  list sources that were not actually read.
- Check the available MCP servers and use them to the fullest

Use subtasks as much as possible to optimize context size.

Always verify that the information is correct and up to date.

Before making any changes or run any commands create a plan, show it and ask me to confirm! NEVER skip this step!

Always keep an up-to-date .gitignore containing only the strict essentials (no generic .gitignore).

## Development workflow: iterations

Work proceeds in **iterations**. Each iteration is versioned with **semantic
versioning by scope** and lives in its own directory:

```
iterations/vX.Y.Z/PLAN.md
```

- **major** for breaking changes, **minor** for new functionality, **patch** for
  scoped fixes/refactors.
- The **current iteration** is the highest existing version directory under
  `iterations/`.
- The **current iteration** cannot be replaced by a new one until the previous
  iteration has been explicitly confirmed `complete` (see Rules).
- Each iteration contains exactly one file, `PLAN.md`, which is the single source
  of truth for that iteration **including the live status of every phase**.
- Always start from the template `iterations/PLAN.template.md`.

### Rules

1. **A PLAN starts from the current state of the codebase.** Never plan against
   assumed or remembered state: inspect the repository (files, tests, commands,
   recent commits) and fill in "Starting state" with what actually exists.
2. **The PLAN is split into phases.** Each phase has its own status, changes,
   tasks, verification and acceptance criteria.
3. **Implement one phase at a time.** Never implement before the plan is approved
   and never start a phase before the previous one is confirmed complete.
4. **After each phase:** update that phase's status (and the iteration status) in
   `PLAN.md`, run the phase verification, report the observed evidence, then
   **stop and wait for explicit confirmation** before the next phase.
5. **`PLAN.md` is the single source of truth.** If scope changes, update `PLAN.md`
   in the same step instead of silently rewriting approved scope.
6. **Verification is evidenced, not assumed.** Report the exact commands actually
   run and their observed result.
7. **Update `.gitignore`** whenever new artifacts make it necessary, keeping only
   strict essentials.
8. **An iteration may be marked `complete` only after explicit human
   confirmation.** When the last planned phase is finished, set the iteration
   status to `testing`. Only the user can end testing and close the iteration:
   never set `complete` yourself. Do not start a new `vX.Y.Z` iteration (do not
   advance the "current iteration") while the current one is not `complete`.
9. **Testing: one bug-fix phase per reported bug.** During `testing` the user
   reports bugs one at a time. For each reported bug, append a dedicated
   `Bugfix` phase to the current `PLAN.md` and show the update for confirmation
   before implementing it. The iteration status stays `testing` throughout.

### Pre-closure testing and bug-fix phases

Pre-closure testing is the manual verification the user runs while the iteration
is in `testing`. It is an incremental loop:

1. The user tests and reports a bug (free text).
2. The agent appends a dedicated **Bugfix** phase to the current `PLAN.md`,
   numbered after the last phase (existing phases are never rewritten):

   ```markdown
   ### Phase N — Bugfix: <short summary>

   - **Status:** not-started
   - **Reported:** YYYY-MM-DD (manual testing)
   - **Report:** <description + how to reproduce>
   - **Changes:** <files/components touched>
   - **Tasks:**
     - [ ] Reproduce the bug
     - [ ] Apply the fix
     - [ ] Add a regression test
   - **Verification:** <exact commands + expected evidence>
   - **Acceptance criteria:** the bug is reproduced, fixed and covered by a
     regression test
   - **Fixed by:** <commit> (filled once fixed)
   ```

3. The agent shows the updated PLAN and waits for explicit confirmation before
   implementing the phase.
4. The agent implements the Bugfix phase following the normal rules (one phase at
   a time, report evidence, stop for confirmation). The iteration status stays
   `testing`.
5. The user resumes testing and reports the next bug, repeating the loop.
6. The user ends testing by explicitly asking to close the iteration; only then
   does the agent set the status to `complete`.

<!-- BEGIN:turborepo-agent-rules -->

# This is NOT the Turborepo you know

Turborepo configuration, task behavior, and CLI commands can vary between installed versions and may differ from your training data. Resolve the `turbo` package from this file's directory or relevant workspace; in monorepos, it may not be visible from the repository root. For example, run `node -p "require.resolve('turbo/package.json')"` from a workspace that depends on `turbo`.

Read `docs/README.md` inside that installed package first, then read the relevant pages from its `docs/` directory before changing Turborepo configuration or commands. Heed deprecation notices. These bundled docs match the installed package version and are available without network access.

This block is written and re-added by `turbo` before repository-scoped commands when an AI agent is detected. In the Turborepo source repository, its template is defined in `crates/turborepo-cli/src/cli/agent_guidance.rs`. Removing the managed block while updates are enabled means a later qualifying invocation will add it again. Set `"agentGuidance": false` in the root `turbo.json` or `turbo.jsonc` to opt out; this does not remove an existing block. Keep the block committed with your work to avoid an uncommitted change on the next agent invocation.
<!-- END:turborepo-agent-rules -->
