# INITIAL INSTRUCTIONS — Commander Project Bootstrap
# Verzija 1.0 — Juli 2026
# UPOTREBA: Copy/paste cijeli ovaj dokument kao PRVU poruku u Claude Code
# (ili drugi ACA) kada Direktor želi početi novi projekat. To je sve.

---

## YOUR ROLE

You are initializing a new web application project governed by the
COMMANDER system. The Director (Davor Mulalić) is a non-coder. He will
answer a few questions — everything else is YOUR job, executed
automatically, without asking for permission at each step.

**Communicate with the Director in Bosnian. All code, documents, and
commits in English (except where Commander specifies BCS).**

---

## STEP 1 — READ THE GOVERNANCE (silently, before anything else)

Fetch and read completely:

```
https://raw.githubusercontent.com/IDSS123a/commander/main/CONSTITUTION.md
https://raw.githubusercontent.com/IDSS123a/commander/main/ENGINEERING_RULES.md
https://raw.githubusercontent.com/IDSS123a/commander/main/ARCHITECTURE_PATTERNS.md
https://raw.githubusercontent.com/IDSS123a/commander/main/ACA_COMMUNICATION_PROTOCOL.md
https://raw.githubusercontent.com/IDSS123a/commander/main/FEATURE_LIFECYCLE.md
https://raw.githubusercontent.com/IDSS123a/commander/main/DONE_CHECKLIST.md
https://raw.githubusercontent.com/IDSS123a/commander/main/DECISION_LOG.md
```

Do not summarize them to the Director. Just obey them.

---

## STEP 2 — ASK THE DIRECTOR (the ONLY manual part)

Ask exactly these questions, in Bosnian, all at once, numbered:

1. **Naziv projekta?** (postaje ime foldera i GitHub repo-a: web-app-[naziv])
2. **Projektna ideja?** (2-3 rečenice: šta app radi i za koga)
3. **Režim?** FULL (produkcija, sprintovi) ili QUICK (prototip, jedan prolaz — Commander M-20)
4. **Ključna poslovna pravila?** (sve što ACA ne smije izmisliti po M-4:
   uloge korisnika, jezici, institucionalna ograničenja — ili "standardno")

Wait for answers. Then execute Steps 3–5 in one continuous run,
narrating only with brief ✅ status lines.

---

## STEP 3 — SCAFFOLD EVERYTHING (automatic, no permission requests)

Adapt to your environment:
- **Claude Code / filesystem + git available:** execute directly.
- **No filesystem (e.g. web chat):** generate all files as downloadable
  package + ONE setup command for the Director. Do not skip anything.

Execute:

1. Create project folder and `git init` (or use current folder if empty).
2. Create GitHub repo `IDSS123a/web-app-[naziv]` via `gh repo create`
   if gh CLI is authenticated; if not, give the Director ONE line:
   "Kreiraj repo web-app-[naziv] na github.com/IDSS123a i reci mi kad je gotovo."
3. Install Commander Automation — fetch these files from the Commander
   repo into the project:
   ```
   https://raw.githubusercontent.com/IDSS123a/commander/main/automation/.claude/settings.json
     → .claude/settings.json
   https://raw.githubusercontent.com/IDSS123a/commander/main/automation/.claude/hooks/log-change.js
     → .claude/hooks/log-change.js
   https://raw.githubusercontent.com/IDSS123a/commander/main/automation/.claude/hooks/lessons-guard.js
     → .claude/hooks/lessons-guard.js
   ```
4. Create `corrections/` folder with empty `ACTIVITY_LOG.md`.
5. Generate `CLAUDE.md` from
   `https://raw.githubusercontent.com/IDSS123a/commander/main/automation/PROJECT_CLAUDE_MD_TEMPLATE.md`
   with [PROJECT NAME] and [project-repo] filled in, template
   instruction lines removed.
6. Generate project `CONSTITUTION.md`: project name, idea, business
   rules from the Director's answers, stack per Commander defaults
   (or M-16 documented deviation if the Director specified otherwise),
   inheritance note pointing to Commander.
7. Generate `sprints/SPRINT_01.md`: first sprint scoped to project
   skeleton + core data model + auth (FULL mode). In QUICK mode: skip
   sprints entirely.
8. Initialize the stack per ARCHITECTURE_PATTERNS.md defaults.
9. First commit: `chore: project initialization under Commander v1.1`
   and push.
10. Report: "✅ Projekat [naziv] inicijalizovan. Commander upravlja.
    Počinjemo Sprint 1?" (QUICK mode: "Počinjemo gradnju?")

---

## STEP 4 — STANDING ORDERS FOR THE ENTIRE PROJECT

These run automatically for every session until the project ends.
Never ask the Director whether to do them.

1. **Every session start:** re-read CLAUDE.md and the current sprint doc.
2. **Lesson capture:** the moment a correction, gotcha, course
   correction, or Commander improvement candidate occurs — append it
   to `corrections/SPRINT_XX_LESSONS.md` immediately, same turn
   (format per PROJECT_CLAUDE_MD_TEMPLATE). The hooks enforce this;
   cooperate with the lessons-guard when it blocks you.
3. **When the Director says a sprint is done** (any phrasing):
   automatically run the full DONE_CHECKLIST, fix FAILs, fill
   COMMANDER COMPLIANCE score, consolidate the lessons file, write
   the handoff note, commit and push, and propose SPRINT_XX+1 scope.
4. **All Commander rules apply at all times** — especially M-4
   (never invent business rules), C-8 (complete output always),
   and the communication protocol (C-1 to C-11).

---

## STEP 5 — MAGIC WORD: "KRAJ"

When the Director writes exactly **KRAJ** (alone or in a sentence
clearly ending the project), execute the End-of-Project Protocol
automatically:

1. Run the final DONE_CHECKLIST + pre-deploy stress test
   (PROMPT_LIBRARY/pre-deploy-stress-test.md).
2. Read ALL files in `corrections/` (every sprint's lessons +
   ACTIVITY_LOG).
3. Classify every lesson: (a) new Commander rule, (b) modification
   of an existing rule, (c) deprecation per M-17, (d) project-specific
   only → stays out of Commander.
4. Clone `https://github.com/IDSS123a/commander`, apply categories
   a/b/c to the correct documents (respecting severity tags, status
   tags, and version history format), append an AUDIT_LOG.md entry,
   update the Active Projects table in README.md (this project →
   Complete).
5. Commit: `feat: Commander learning from [project-name]` and push.
   If push fails due to auth, output the exact files + one git command
   block for the Director.
6. Report to the Director, in Bosnian, max 10 lines: what Commander
   learned (counts per category) and confirmation that the loop is
   closed.

---

## FAILURE RULES

- If any URL fetch fails: retry once, then tell the Director which
  URL failed and continue with everything else.
- If the environment cannot execute something (no git, no filesystem):
  produce the artifact + ONE command for the Director instead. Never
  silently skip a step.
- Never ask the Director technical questions the codebase, Commander
  docs, or your own judgment can answer (C-6).

---

*Commander v1.1 — IDSS123a Organisation — Davor Mulalić*
