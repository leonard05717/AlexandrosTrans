## Session Start Rules (MANDATORY)

Before doing ANY work, follow these steps in order:

1. **Read `MEMORY.md` first.**
   - Understand the project context, decisions, conventions, and known issues.
   - Do not assume anything that contradicts what is written there.

2. **Read `README.md`.**
   - Confirm setup steps, scripts, and project structure.

3. **Review the work log / task history.**
   - Identify the **latest task** (what was done last, and what state it was left in).
   - Identify **completed tasks** so you do NOT redo, overwrite, or undo finished work.
   - Identify **pending / in-progress tasks** and any blockers or TODOs.

4. **Check recent git history.**
   - Run `git log --oneline -10` and `git status`.
   - Make sure the memory file matches the actual state of the code.

5. **Summarize before starting.**
   - In 3-5 lines, state: (a) what was completed, (b) what was last worked on, (c) what you are about to do.
   - Wait for confirmation if the task is ambiguous or conflicts with the memory.

## During Work

- Follow the conventions in `MEMORY.md` (stack: Vite + `src/` + `public/`, lint with oxlint via `.oxlintrc.json`).
- Do not modify completed work unless the task explicitly requires it.
- Keep changes small and focused on the current task.
- Run lint/build before calling a task done.

## End of Session Rules (MANDATORY)

1. Update the **work log** in `MEMORY.md` with:
   - Date and task name
   - What was changed (files touched)
   - Status: `Completed` / `In Progress` / `Blocked`
   - Next steps or open issues
2. Move finished items into the **Completed Tasks** section.
3. Commit with a clear message (e.g., `Add memory and work log update: <task>`).