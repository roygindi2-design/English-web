LOOP ARCHITECTURE - RAW INFORMATION FILE
Generated 2026-09-09 by an operations session. Plain text on purpose: no tables, no
decorative emoji, no visual emphasis. This file exists to be handed to Claude in chat so
it can build an accurate architecture map from current facts instead of partial or old
ones. It is a one-off snapshot, not a living document. The living document for the
runtime layer is claude/LOOP-ARCHITECTURE.md.

Every number here was measured on the branch ops/loop-round-2 at commit 3bb812d on
2026-09-09. Where something could not be measured it says so rather than guessing.


SECTION 1 - THE FIVE AGENTS

There are five agents. Each runs as a scheduled Routine on Claude Code Remote. Each run
is a fresh session with no memory of any other run. Continuity exists only in repository
files.

DEV
  Instruction file: docs/agents/DEV.md (71,084 bytes)
  Model actually configured on the task: claude-opus-5
  Model the prompt and roster declare: claude-opus-5 (aligned 2026-09-09; before that the
    roster said claude-fable-5-1 while the task ran claude-opus-5, a gap that existed from
    the moment the task was created at 2026-09-07T20:31:30Z. The task's own opening line
    still says "fable 5" and lives on the server, so only Roy can change that line.)
  Schedule: 30 */2 * * * UTC, twelve times a day
  Git identity it sets: dev-agent
  Reads: docs/plan-open.md (its own slice), plan/50-tasks.md rows by grep,
    plan/00-control.md, plan/RULES.md sections listed for its role, docs/design renders,
    plan/05-departments.md
  Writes and pushes: work/current only
  May: write product code anywhere except where a row says otherwise, write migrations
    and run supabase db push, open its own task row for the next obvious step of an
    existing goal, use up to three subagents on independent items
  May not: push to dev or main, move ACTIVE_WORKSTREAM, write its own [SKILL: X] tag,
    mark a task done (it marks 🟣, QA marks ✅), run gc:memory, resolve a rebase conflict

PM
  Instruction file: docs/agents/PM.md (71,895 bytes)
  Model actually configured: claude-opus-5
  Model declared: claude-opus-5 (matches)
  Schedule: 0 1,9,17 * * * UTC, three times a day
  Git identity: pm-agent
  Reads: everything - it is the only agent that needs the whole index
  Writes and pushes: work/current only
  Owns these files: plan/10-pedagogy.md, plan/15-syllabus-digest.md, plan/20-alerts.md,
    plan/25-content-commissions.md, plan/40-decisions.md, plan/70-engines.md,
    layer B of plan/35-design-constitution.md, appends to plan/50-tasks.md,
    plan/05-departments.md, and the status cell only of plan/60-findings.md
  May: define departments and goals, write task rows without a ceiling when they are
    derived from an anchor document, write UI polish code under five conjunctive
    conditions (RULES section 0.6ה), use up to four subagents for research
  May not: write code outside those five conditions, touch lib/core, supabase or
    app/api, move ACTIVE_WORKSTREAM to a feature workstream, mark a row ✅, invent
    learning content, open more than three invented task rows per tick

QA
  Instruction file: docs/agents/QA.md (64,679 bytes). A one-line bridge file
    docs/agents/CRITIC.md (1,506 bytes) also exists and points at QA.md, because the
    routine's opening message on the server still says to read CRITIC.md and no agent
    can edit that message.
  Model actually configured: claude-sonnet-5 on the full lane, claude-haiku-4-5 on the
    gate lane
  Schedule: full lane 15 5,11,15,21 * * * UTC (four times a day); gate lane
    55 1,4,7,10,13,16,19,22 * * * UTC (eight times a day)
  Git identity: critic-agent
  Reads: findings, the review queue, the balance, plan/00-control.md
  Writes and pushes: work/current, and it is the only agent that merges into dev, with
    merge --ff-only
  May: run the gate, walk the product, write findings, seal a workstream, move
    ACTIVE_WORKSTREAM, set RELEASE_READY, write Roy's three taps
  May not: write product code, route a finding to itself, push to main, hand DEV more
    than four findings in one tick (🔴 CRITICAL is outside that cap)

CONTENT
  Instruction file: docs/agents/CONTENT.md (43,146 bytes)
  Model actually configured: claude-sonnet-5
  Schedule: 15 3,7,13,19 * * * UTC, four times a day
  Git identity: content-agent
  Reads: plan/25-content-commissions.md, data/amirnet-vocab.csv, plan/80-content-lessons.md
  Writes and pushes: work/current. Its output is data/generated/*.jsonl plus the
    regenerated seeds supabase/seed/0001, 0002, 0003 and docs/gate-recheck.md
  Must, every run without exception: read skills/hebrew-content-writer/SKILL.md
  May not: write code, edit lib/core, fix its own ingest scripts (that is DEV's), copy
    from מאל"ו or AnkiWeb or any non-commercial dictionary

PROMOTER
  Instruction file: docs/agents/PROMOTER.md (31,228 bytes)
  Model actually configured: claude-sonnet-5
  Schedule: 5 0,12 * * * UTC, twice a day
  Git identity: promoter-agent
  Reads: plan/00-control.md, plan/03-for-roy.md
  Writes and pushes: main (the only agent that may), and a journal line to work/current
  May: promote dev to main with merge --ff-only, unblock stuck decisions within a
    defined list, run one browser walk after a promotion
  May not: write product code, open tasks, write findings, touch the registers, promote
    more than once in 24 hours or more than 30 times a month


SECTION 2 - BRANCHES

Four branches matter.

  work/current   every agent pushes here. It is the single channel for agent-facing text.
  dev            QA merges work/current into it with merge --ff-only. Nobody else pushes.
  main           PROMOTER promotes dev into it. Netlify builds only this branch.
  claude/<slug>  one per Routine, written by the PLATFORM at the end of every session,
                 not by the agent. Nothing reads these. loop:health check 18 counts work
                 stranded on them.

The pre-push hook enforces this mechanically, before the SKIP_VERIFY escape hatch:
  refs/heads/main is refused unless git config user.name is promoter-agent or ops-agent
  refs/heads/dev is refused unless it is critic-agent, qa-agent, promoter-agent or
    ops-agent. ops-agent was added on 09/09: main had admitted it since the previous
    round while dev had not, so an operations session could push to the production
    branch but not to the one before it in the chain, and therefore could not promote
    the chain in order at all.
  any branch is refused for a code-touching diff while LOCK_HELD_BY names another
    agent, UNLESS the lock is orphaned. Orphaned means two conditions together, never
    the clock alone: LOCK_AT is older than the pushing agent's RULES 0.4 window (90
    minutes for DEV, 30 for everyone else), AND the holder has pushed no work commit
    since LOCK_AT. A commit touching only plan/00-control.md does not count as a work
    commit, because the lock commit itself carries the same timestamp as LOCK_AT and
    would otherwise make every orphaned lock report as alive the moment it aged past
    the window. This exemption was added on 09/09 after a live QA tick died holding
    the lock; before it, the hook never read LOCK_AT and so enforced every lock
    forever, silently voiding the window RULES 0.4 had already granted.

State as of 2026-09-09 20:05Z, after the alignment:
  main             dd9e100
  dev              dd9e100
  work/current     dd9e100
  All three are identical. The desync described below is closed. main previously sat
  130 commits behind dev; the promotion was fast-forward in both steps.
  main now carries plan/RULES.md at 100,740 bytes (it was 75,145), docs/agents/QA.md
  at 66,065 (it was absent), .claude/settings.json at 434 (it was absent), and
  scripts/loop-health.mjs with 21 checks (it had 17).

This gap is the most important structural fact in this file. PROMOTER clones with no -b,
so it gets the repository default branch, which is main. On main, measured: plan/RULES.md
is 75,145 bytes against 98,792 on work/current; loop-health has 17 checks against 20;
docs/agents/QA.md does not exist; .claude/settings.json does not exist. That last one is
the file whose only purpose is to permit PROMOTER's push to main, so it can only reach
main through a push to main. That is why F-203 could not resolve itself.


SECTION 3 - COORDINATION FILES

plan/00-control.md (11,767 bytes, ceiling 12,288 enforced by loop:health check 9)
  The state register. Every agent reads it every tick; the agent holding the lock writes
  it. Fields: NEXT_AGENT, STATE, ACTIVE_MILESTONE, ACTIVE_TASK_ID, CRITIC_ROUNDS_ON_TASK,
  LAST_HANDOFF_AT, HUMAN_DECISION_REQUIRED, LOCK_HELD_BY, LOCK_AT, WORKSTREAM_TICKS,
  MILESTONE_TICKS, RELEASE_READY, PAUSED_BY_HUMAN, LAST_REVIEWED_COMMIT, WORKING_BRANCH,
  MERGE_TARGET, ACTIVE_WORKSTREAM, PREV_WORKSTREAM, WORKSTREAM_ENDING, IMPROVE_TARGET,
  MERGE_BLOCKERS, PROMOTION_BLOCKERS, DEPLOY_BRANCH, LAST_PROMOTED_AT,
  PROMOTIONS_THIS_MONTH.
  MERGE_BLOCKERS is written by QA and read by DEV. PROMOTION_BLOCKERS is PROMOTER's alone
  and DEV never reads it. WORKSTREAM_ENDING is written by PM and read by QA.

plan/05-departments.md (2,782 bytes, ceiling 4,096 enforced by check 19)
  New on 2026-09-09. PM writes, everyone reads. Holds which department is in work, one
  summary line per department, and the goals still OPEN in each. It is net: an achieved
  goal is deleted, not marked done.

plan/50-tasks.md (235,286 bytes, 283 rows, 39 open)
  The task register. PM appends rows, DEV marks 🟣, QA marks ✅. Eight columns. Status is
  cell index 4. Parsed by lib/core/planTable.ts splitRow, which honours escaped pipes and
  code spans; a naive split on the pipe character is a known defect class (F-078).

plan/60-findings.md (219,774 bytes, 208 rows, 47 open)
  The findings register. QA writes findings; PM may edit only the status cell of a finding
  a decision already closed. Status is cell index 6.

plan/03-for-roy.md (207,255 bytes, 18 genuinely open items)
  The only desk for Roy. Items carry a stamp. loop:health check 3 measures whether the
  row MOVED in the last 30 days using git log -G, not whether the stamp is fresh. Check
  3.5 fails if a closed row is still sitting in the open table.

plan/20-alerts.md (47,961 bytes, 28 rows: 27 R-xxx and one P-001)
  Source-reliability alerts. PM writes, QA appends, DEV reads only. Several of these
  constrain UI and product decisions, not only content.

plan/25-content-commissions.md (45,998 bytes)
  The channel from PM to CONTENT. K-001 through K-007.

docs/plan-open.md (53,850 bytes, generated by scripts/measure-plan-tables.mjs)
  The derived index. Never hand-edited. Carries a per-role reading map at the top, the
  open rows by state, the last 15 tasks closed, findings, the balance, the work tree and
  the plans index.

docs/agents/roster.json (3,486 bytes)
  Declares which agents are on, their commit prefix, their model and their cron.
  loop:health check 17 measures agent silence against it. QA carries two commit prefixes,
  loop(QA and loop(CRITIC, because both exist in history.

docs/skills-registry.md (13,352, ceiling 14,000) and
docs/skills-registry-superpowers.md (4,013)
  The skills index, split on 2026-09-09 because the main file had 465 bytes of headroom.

claude/LOOP-ARCHITECTURE.md (15,098 bytes)
  The living document for the runtime layer: the six Routines, the migration window, the
  two kinds of pace, the platform rows only Roy can execute, and a change log.

skills/ in the repository: superpowers (12 skills), taste-skill,
  imagegen-frontend-mobile, hebrew-content-writer. These are FILES, not plugins.
  Measured: enabled_plugins, account_plugins and account_skills are all empty on all six
  scheduled tasks, and the Routines UI has no section to enable a plugin, so a skill that
  is not a file in the repository is not available to any agent.


SECTION 4 - WHAT THE AGENTS CAN AND CANNOT DO IN THE RUNTIME

allowed_tools on all six Routines, measured identical:
  preset:default, Task, Bash, Glob, Grep, Read, Edit, MultiEdit, Write, NotebookEdit,
  WebFetch, TodoWrite, WebSearch, BashOutput, KillBash, Skill, Tmux, Monitor,
  SendUserFile, REPL

Consequences that matter and were measured, not assumed:
  Artifact is NOT in that list. PM cannot publish or update an Artifact. Artifacts are
    available to Roy's account (five are published) but not to the loop.
  project_read and project_write are NOT in that list. Both were Cowork tools. Two whole
    steps in PM.md were built on them and could never run; they were removed 2026-09-09.
  auto_mode_allow, auto_mode_environment and auto_mode_soft_deny are empty on all six.
  Outbound network to the live site is blocked by the environment's network policy:
    CONNECT tunnel failed, 403, connect_rejected, measured sixteen times. This is F-203's
    sibling and only Roy can lift it.


SECTION 5 - GATES THAT ACTUALLY RUN

npm run verify - nine commands: typecheck, check:core, check:motion, check:text-floor,
  check:rules, check:titles, test, build, check:mobile. Roughly 3 to 5 minutes.
npm run verify:fast - seven of those nine, without build and without check:mobile.
  Measured 40 seconds. It is a strict subset and may never be reported as green.
scripts/hooks/pre-push - branch ownership, then the lock gate, then either the full
  verify or a diff-based fast lane for register-only diffs, then a git note recording
  which of the two ran.
npm run loop:health - 21 numbered checks plus two reported measurements at the top
  (infrastructure share of the open queue, and infrastructure rows opened this week).
npm run measure:plan - regenerates the derived index and reports malformed rows and
  stale blockers.


SECTION 6 - CURRENT STATE, MEASURED

  HEAD                      dd9e100 on ops/loop-round-2, identical to work/current
  main                      dd9e100, aligned
  dev                       dd9e100, aligned
  tasks                     283 rows, 0 malformed, 39 open
  findings                  208 rows, 0 malformed, 47 open
  plans                     74 files, 5 orphaned
  loop:health               20 of 21 pass, exit 0. Check 10 is green again now that dev
                            has caught up. The one non-pass is check 17, a warning
                            inside its soft window until 2026-09-13.
  check 21                  New on 09/09: reads LOCK_HELD_BY and LOCK_AT and reports an
                            orphaned lock. Before it, nothing in scripts/ read the lock
                            at all, so a dead lock wedged the whole loop invisibly: DEV,
                            PM and CONTENT could not push code, and QA could not merge
                            to dev because of its own lock. Check 17 would have caught
                            the silence eventually, but only after 24 hours and on the
                            symptom rather than the cause.
                            Check 17 is a warning because the Routines are switched off.
  infrastructure share      23 percent of the open queue (9 infra, 30 product, 39 total)
  infra rows opened in 7d   22
  tests in scripts/         743 it() blocks, counted as
                            ls scripts/*.test.ts | xargs grep -c '^\s*it(' | awk -F: '{s+=$2} END {print s}'
                            An earlier draft of this file said 759 using a different
                            counting method. Re-measure rather than trust either number.
  RULES citations           628, 0 broken, 72 anchors
  RULES.md                  100,740 bytes, 31 sections


SECTION 7 - ASSERTIONS THAT PIN EXACT STRINGS IN THE CONSTITUTION AND PROMPTS

This is the list Roy asked for: every place a test depends on an exact string in
plan/RULES.md, docs/agents/*.md, docs/skills-registry*.md, docs/agents/roster.json,
plan/00-control.md, docs/plan-open.md or package.json.

TOTAL PINNED ASSERTIONS: 294, measured 2026-09-09 before this round's additions.
This round added 15 assertions that are NOT in the tally below: 4 on loop:health check 21
and 11 on the pre-push branch-ownership and stale-lock gates. None of them pins a prose
string in a prompt; they all pin mechanical behaviour, so they belong to KEEP-GATE.

HOW MANY OF EACH, AND WHAT THE MARKING MEANS
  NOT-REVIEWED    233   short literal; not individually judged in this round. NEEDS REVIEW
  DERIVED          30   value comes from package.json, not hand-written; cannot go stale
  KEEP-GATE        10   pins a mechanical gate that exists in code
  KEEP-PATH        10   pins a file path another file or script depends on
  KEEP-CITATION     7   pins a RULES section number; dies with that section
  KEEP-STRUCTURE    2   pins the existence of a step heading
  BRITTLE           2   long exact sentence: any rewording breaks it even when the rule is unchanged. CANDIDATE: replace with a shorter invariant

IMPORTANT HONESTY NOTE ABOUT THIS LIST
  The NOT-REVIEWED rows were not individually judged. Marking 294 assertions one by one
  is a review of its own and was not done in this round. They are listed in full so the
  judgement can be made, but do not read the absence of a mark as approval.
  BRITTLE is the category most likely to be worth acting on: those assertions pin an exact
  long sentence, so an editor who improves the wording without changing the rule gets a red
  build and learns that editing prompts is dangerous. That is the opposite of the intent.

FULL LIST  (test file:line | file it asserts against | assertion kind | marking | literal)
  scripts/agent-prompts.test.ts:1058 | docs/agents/QA.md            | toContain | BRITTLE        | 01:55Z · 04:55Z · 07:55Z · 10:55Z · 13:55Z · 16:55Z · 19:55Z · 22:55Z
  scripts/agent-prompts.test.ts:1059 | docs/agents/QA.md            | toContain | NOT-REVIEWED   | 01:45Z · 07:45Z · 13:45Z · 19:45Z
  scripts/agent-prompts.test.ts:1060 | docs/agents/QA.md            | toContain | NOT-REVIEWED   | 05:15Z · 11:15Z · 15:15Z · 21:15Z
  scripts/agent-prompts.test.ts:1061 | docs/agents/QA.md            | toContain | NOT-REVIEWED   | 05:00Z and 23:00Z
  scripts/agent-prompts.test.ts:1074 | docs/agents/QA.md            | toContain | NOT-REVIEWED   | RELEASE_BLOCKERS
  scripts/agent-prompts.test.ts:1077 | docs/agents/DEV.md           | toContain | NOT-REVIEWED   | MERGE_BLOCKERS
  scripts/agent-prompts.test.ts:1079 | docs/agents/DEV.md           | toMatch  | NOT-REVIEWED   | `PROMOTION_BLOCKERS` is ⛔ NOT yours
  scripts/agent-prompts.test.ts:1080 | docs/agents/QA.md            | toContain | NOT-REVIEWED   | MERGE_BLOCKERS
  scripts/agent-prompts.test.ts:1081 | docs/agents/PROMOTER.md      | toContain | NOT-REVIEWED   | PROMOTION_BLOCKERS
  scripts/agent-prompts.test.ts:1101 | docs/agents/PROMOTER.md      | toMatch  | NOT-REVIEWED   | `D-203`ⓑ
  scripts/agent-prompts.test.ts:1102 | docs/agents/PROMOTER.md      | toContain | NOT-REVIEWED   | ⛔ לא נמדד
  scripts/agent-prompts.test.ts:1108 | docs/agents/PROMOTER.md      | toMatch  | NOT-REVIEWED   | promotion is Roy's manual action
  scripts/agent-prompts.test.ts:1135 | docs/agents/PROMOTER.md      | toMatch  | KEEP-GATE      | npm run verify
  scripts/agent-prompts.test.ts:1190 | docs/agents/QA.md            | toMatch  | NOT-REVIEWED   | ⬜ פתוח → \*\*DEV\*\*
  scripts/agent-prompts.test.ts:1191 | docs/agents/QA.md            | toMatch  | NOT-REVIEWED   | ⬜ פתוח → \*\*PM\*\*
  scripts/agent-prompts.test.ts:1192 | docs/agents/QA.md            | toMatch  | NOT-REVIEWED   | ⬜ פתוח → \*\*רוי\*\*
  scripts/agent-prompts.test.ts:1193 | docs/agents/QA.md            | toMatch  | NOT-REVIEWED   | touches CODE
  scripts/agent-prompts.test.ts:1195 | docs/agents/QA.md            | toMatch  | NOT-REVIEWED   | ⛔ do not route a finding to yourself
  scripts/agent-prompts.test.ts:1217 | docs/agents/QA.md            | toMatch  | NOT-REVIEWED   | npx next start -p 3000
  scripts/agent-prompts.test.ts:1218 | docs/agents/QA.md            | toMatch  | NOT-REVIEWED   | npm run build && \(npx next start
  scripts/agent-prompts.test.ts:1229 | docs/agents/PROMOTER.md      | toMatch  | NOT-REVIEWED   | get-deploy-for-site
  scripts/agent-prompts.test.ts:1230 | docs/agents/PROMOTER.md      | toMatch  | NOT-REVIEWED   | commit_ref
  scripts/agent-prompts.test.ts:1231 | docs/agents/PROMOTER.md      | toMatch  | NOT-REVIEWED   | api\
  scripts/agent-prompts.test.ts:1232 | docs/agents/PROMOTER.md      | toMatch  | NOT-REVIEWED   | ⛔ does ⛔ NOT say the product answers
  scripts/agent-prompts.test.ts:1233 | docs/agents/PROMOTER.md      | toMatch  | NOT-REVIEWED   | connect_rejected
  scripts/agent-prompts.test.ts:1246 | docs/agents/PROMOTER.md      | toMatch  | NOT-REVIEWED   | STANDING AUTHORISATION
  scripts/agent-prompts.test.ts:1250 | docs/agents/PROMOTER.md      | toMatch  | NOT-REVIEWED   | refusal is FINAL for this run
  scripts/agent-prompts.test.ts:1251 | docs/agents/PROMOTER.md      | toMatch  | NOT-REVIEWED   | not\s+rephrase it
  scripts/agent-prompts.test.ts:1252 | docs/agents/PROMOTER.md      | toMatch  | NOT-REVIEWED   | PROMOTION_BLOCKERS
  scripts/agent-prompts.test.ts:1255 | docs/agents/PROMOTER.md      | toMatch  | NOT-REVIEWED   | STANDING AUTHORISATION
  scripts/agent-prompts.test.ts:1262 | docs/agents/PROMOTER.md      | toContain | NOT-REVIEWED   | plan/archive/control-log.md
  scripts/agent-prompts.test.ts:1263 | docs/agents/PROMOTER.md      | toMatch  | NOT-REVIEWED   | idle — <the reason
  scripts/agent-prompts.test.ts:1264 | docs/agents/PROMOTER.md      | toMatch  | KEEP-GATE      | ⛔ never `SKIP_VERIFY=1` for it
  scripts/agent-prompts.test.ts:1307 | docs/agents/PROMOTER.md      | toContain | KEEP-GATE      | npm run verify
  scripts/agent-prompts.test.ts:1308 | docs/agents/PROMOTER.md      | toContain | KEEP-GATE      | --ff-only
  scripts/agent-prompts.test.ts:1309 | docs/agents/PROMOTER.md      | toContain | NOT-REVIEWED   | /api/health
  scripts/agent-prompts.test.ts:1310 | docs/agents/PROMOTER.md      | toContain | NOT-REVIEWED   | "ok": true
  scripts/agent-prompts.test.ts:1311 | docs/agents/PROMOTER.md      | toContain | NOT-REVIEWED   | NEXT_AGENT: HUMAN
  scripts/agent-prompts.test.ts:1314 | docs/agents/PROMOTER.md      | toMatch  | KEEP-GATE      | `SKIP_VERIFY=1` is ⛔ NEVER yours
  scripts/agent-prompts.test.ts:1318 | docs/agents/PROMOTER.md      | toContain | NOT-REVIEWED   | PROMOTIONS_THIS_MONTH
  scripts/agent-prompts.test.ts:1319 | docs/agents/PROMOTER.md      | toMatch  | NOT-REVIEWED   | one in 24 hours|24 hours
  scripts/agent-prompts.test.ts:1320 | docs/agents/PROMOTER.md      | toContain | NOT-REVIEWED   | 12,288
  scripts/agent-prompts.test.ts:1321 | docs/agents/PROMOTER.md      | toMatch  | NOT-REVIEWED   | THREE decisions per run
  scripts/agent-prompts.test.ts:1325 | docs/agents/PROMOTER.md      | toContain | NOT-REVIEWED   | loop(PROMOTER)
  scripts/agent-prompts.test.ts:1326 | docs/agents/PROMOTER.md      | toContain | NOT-REVIEWED   | plan/archive/control-log.md
  scripts/agent-prompts.test.ts:1327 | docs/agents/PROMOTER.md      | toMatch  | NOT-REVIEWED   | EVERY RUN, INCLUDING THE QUIET ONES
  scripts/agent-prompts.test.ts:1331 | docs/agents/PROMOTER.md      | toMatch  | NOT-REVIEWED   | ⛔ NOT A BUILDING AGENT
  scripts/agent-prompts.test.ts:1332 | docs/agents/PROMOTER.md      | toContain | KEEP-PATH      | plan/50-tasks.md
  scripts/agent-prompts.test.ts:1394 | docs/agents/CONTENT.md       | toContain | NOT-REVIEWED   | data/amirnet-vocab.csv
  scripts/agent-prompts.test.ts:1395 | docs/agents/CONTENT.md       | toContain | NOT-REVIEWED   | headword,pos,cefr,tier,tier_name
  scripts/agent-prompts.test.ts:1399 | docs/agents/CONTENT.md       | toContain | NOT-REVIEWED   | npm run measure:amirnet-coverage
  scripts/agent-prompts.test.ts:1407 | docs/agents/CONTENT.md       | toMatch  | NOT-REVIEWED   | fall back to \*\*NGSL
  scripts/agent-prompts.test.ts:1411 | docs/agents/CONTENT.md       | toMatch  | NOT-REVIEWED   | ⛔ NO PER-BATCH CEILING
  scripts/agent-prompts.test.ts:1415 | docs/agents/CONTENT.md       | toContain | NOT-REVIEWED   | R-027
  scripts/agent-prompts.test.ts:1416 | docs/agents/CONTENT.md       | toContain | NOT-REVIEWED   | plan/20-alerts.md
  scripts/agent-prompts.test.ts:1429 | docs/agents/PM.md            | toContain | KEEP-STRUCTURE | STEP 1.9
  scripts/agent-prompts.test.ts:1433 | docs/agents/PM.md            | toContain | NOT-REVIEWED   | loop(DEV)
  scripts/agent-prompts.test.ts:1435 | docs/agents/PM.md            | toMatch  | NOT-REVIEWED   | ⛔ not a review|⛔ do ⛔ not approve
  scripts/agent-prompts.test.ts:1439 | docs/agents/PM.md            | toMatch  | NOT-REVIEWED   | A DEPARTMENT WITH GOALS
  scripts/agent-prompts.test.ts:1440 | docs/agents/PM.md            | toMatch  | NOT-REVIEWED   | ⛔ no ceiling on how many rows you write
  scripts/agent-prompts.test.ts:1442 | docs/agents/PM.md            | toContain | KEEP-CITATION  | § 0.17
  scripts/agent-prompts.test.ts:1446 | docs/agents/PM.md            | toMatch  | NOT-REVIEWED   | A FLOOR TO CLEAR, ⛔ NOT A PICTURE TO COPY
  scripts/agent-prompts.test.ts:1447 | docs/agents/PM.md            | toContain | NOT-REVIEWED   | 🟡 meets it
  scripts/agent-prompts.test.ts:1448 | docs/agents/PM.md            | toMatch  | NOT-REVIEWED   | `36` wins
  scripts/agent-prompts.test.ts:1453 | docs/agents/PM.md            | toContain | KEEP-PATH      | skills/taste-skill/SKILL.md
  scripts/agent-prompts.test.ts:1454 | docs/agents/PM.md            | toContain | KEEP-PATH      | skills/imagegen-frontend-mobile/SKILL.md
  scripts/agent-prompts.test.ts:1455 | docs/agents/PM.md            | toContain | NOT-REVIEWED   | ui-ux-pro-max:ui-styling
  scripts/agent-prompts.test.ts:1456 | docs/agents/PM.md            | toMatch  | NOT-REVIEWED   | «⛔ none» is\s*\n?⛔ \*\*not\*\* an available answer
  scripts/agent-prompts.test.ts:1460 | docs/agents/PM.md            | toContain | NOT-REVIEWED   | npm run archive && npm run measure:plan
  scripts/agent-prompts.test.ts:1461 | docs/agents/PM.md            | toMatch  | NOT-REVIEWED   | ⛔ AND IT DOES ⛔ NOT DELETE
  scripts/agent-prompts.test.ts:1462 | docs/agents/PM.md            | toContain | NOT-REVIEWED   | scripts/archive-registers.mjs
  scripts/agent-prompts.test.ts:1468 | docs/agents/PM.md            | toContain | NOT-REVIEWED   | WORKSTREAM_ENDING:
  scripts/agent-prompts.test.ts:1469 | docs/agents/QA.md            | toContain | NOT-REVIEWED   | WORKSTREAM_ENDING
  scripts/agent-prompts.test.ts:1477 | plan/00-control.md           | toMatch  | NOT-REVIEWED   | § 0\.23 ז׳
  scripts/agent-prompts.test.ts:1479 | docs/agents/QA.md            | toMatch  | NOT-REVIEWED   | ⛔ NOT permission to move
  scripts/agent-prompts.test.ts:1490 | docs/agents/QA.md            | toMatch  | NOT-REVIEWED   | ⛔ Nothing here says «build»
  scripts/agent-prompts.test.ts:1494 | docs/agents/QA.md            | toMatch  | NOT-REVIEWED   | At most FOUR findings routed to `→ DEV` per tick
  scripts/agent-prompts.test.ts:1495 | docs/agents/QA.md            | toMatch  | NOT-REVIEWED   | routed to PM or to Roy are ⛔ uncapped
  scripts/agent-prompts.test.ts:1496 | docs/agents/QA.md            | toMatch  | NOT-REVIEWED   | CRITICAL is ⛔ outside the cap
  scripts/agent-prompts.test.ts:1498 | docs/agents/QA.md            | toMatch  | NOT-REVIEWED   | ⛔ Nothing is thrown away
  scripts/agent-prompts.test.ts:1506 | docs/agents/DEV.md           | toMatch  | NOT-REVIEWED   | YOU BUILD TOWARD A GOAL, ⛔ NOT DOWN A LIST
  scripts/agent-prompts.test.ts:1507 | docs/agents/DEV.md           | toContain | NOT-REVIEWED   | C-0366
  scripts/agent-prompts.test.ts:1508 | docs/agents/DEV.md           | toMatch  | NOT-REVIEWED   | ⛔ never write your\s*\n?own `\[SKILL: X\]` tag
  scripts/agent-prompts.test.ts:1512 | docs/agents/DEV.md           | toMatch  | NOT-REVIEWED   | YOU WAIT FOR ⛔ NOBODY
  scripts/agent-prompts.test.ts:1513 | docs/agents/DEV.md           | toContain | KEEP-CITATION  | RULES § 0.20
  scripts/agent-prompts.test.ts:1517 | docs/agents/DEV.md           | toMatch  | NOT-REVIEWED   | ⛔ NOT MAINTENANCE INSTEAD OF PRODUCT CODE
  scripts/agent-prompts.test.ts:1518 | docs/agents/DEV.md           | toContain | NOT-REVIEWED   | 161 of 516
  scripts/agent-prompts.test.ts:1519 | docs/agents/DEV.md           | toMatch  | NOT-REVIEWED   | This does ⛔ not ban the overhead
  scripts/agent-prompts.test.ts:1523 | docs/agents/DEV.md           | toMatch  | NOT-REVIEWED   | PRE-APPROVED
  scripts/agent-prompts.test.ts:1524 | docs/agents/DEV.md           | toMatch  | NOT-REVIEWED   | ⛔ DO ⛔ NOT COME BACK TO ASK
  scripts/agent-prompts.test.ts:1525 | docs/agents/DEV.md           | toContain | NOT-REVIEWED   | שכבה א׳
  scripts/agent-prompts.test.ts:1526 | docs/agents/DEV.md           | toContain | NOT-REVIEWED   | R-016
  scripts/agent-prompts.test.ts:1527 | docs/agents/DEV.md           | toContain | KEEP-CITATION  | RULES § 0.22
  scripts/agent-prompts.test.ts:1541 | docs/agents/DEV.md           | toMatch  | NOT-REVIEWED   | THE ONE QUIET EXIT
  scripts/agent-prompts.test.ts:1545 | docs/agents/DEV.md           | toContain | NOT-REVIEWED   | 36 § 13
  scripts/agent-prompts.test.ts:1546 | docs/agents/DEV.md           | toMatch  | NOT-REVIEWED   | ⛔ ⛔ NOT {10}"I am waiting for Roy"
  scripts/agent-prompts.test.ts:1552 | docs/agents/DEV.md           | toContain | NOT-REVIEWED   | plan/archive/control-log.md
  scripts/agent-prompts.test.ts:1553 | docs/agents/DEV.md           | toContain | NOT-REVIEWED   | idle — <the reason, one line
  scripts/agent-prompts.test.ts:1554 | docs/agents/DEV.md           | toMatch  | NOT-REVIEWED   | by the DIFF, ⛔ not by the wording
  scripts/agent-prompts.test.ts:1578 | docs/agents/DEV.md           | toContain | NOT-REVIEWED   | next start
  scripts/agent-prompts.test.ts:1579 | docs/agents/DEV.md           | toMatch  | NOT-REVIEWED   | 375
  scripts/agent-prompts.test.ts:1585 | docs/agents/DEV.md           | toContain | KEEP-CITATION  | RULES § 0.27
  scripts/agent-prompts.test.ts:1586 | docs/agents/DEV.md           | toMatch  | NOT-REVIEWED   | ⛔ NOT a reason to skip|⛔ NOT a reason to skip
  scripts/agent-prompts.test.ts:1591 | docs/agents/CONTENT.md       | toMatch  | NOT-REVIEWED   | ⛔ And this is ⛔ not a gate
  scripts/agent-prompts.test.ts:1592 | docs/agents/PROMOTER.md      | toMatch  | NOT-REVIEWED   | ⛔ NOTHING HERE BLOCKS ANYTHING
  scripts/agent-prompts.test.ts:1597 | docs/agents/PROMOTER.md      | toContain | NOT-REVIEWED   | ## 📐 מדד המקצועיות
  scripts/agent-prompts.test.ts:1598 | docs/agents/PROMOTER.md      | toMatch  | NOT-REVIEWED   | IT BLOCKS ⛔ NOTHING
  scripts/agent-prompts.test.ts:1599 | docs/agents/PROMOTER.md      | toMatch  | NOT-REVIEWED   | ⛔ לא נמדד`, ⛔ never `0`
  scripts/agent-prompts.test.ts:1659 | docs/agents/PM.md            | toContain | NOT-REVIEWED   | superpowers:dispatching-parallel-agents
  scripts/agent-prompts.test.ts:1660 | docs/agents/PM.md            | toContain | KEEP-CITATION  | RULES § 0.5
  scripts/agent-prompts.test.ts:1663 | docs/agents/PM.md            | toMatch  | NOT-REVIEWED   | ⛔ does ⛔ not raise the invention ceiling
  scripts/agent-prompts.test.ts:1664 | docs/agents/PM.md            | toContain | KEEP-CITATION  | § 0.17
  scripts/agent-prompts.test.ts:1669 | docs/agents/DEV.md           | toContain | NOT-REVIEWED   | superpowers:subagent-driven-development
  scripts/agent-prompts.test.ts:1670 | docs/agents/DEV.md           | toMatch  | NOT-REVIEWED   | ⛔ never on a 🔴
  scripts/agent-prompts.test.ts:1671 | docs/agents/DEV.md           | toMatch  | NOT-REVIEWED   | One commit per task still holds
  scripts/agent-prompts.test.ts:1680 | docs/agents/DEV.md           | toMatch  | NOT-REVIEWED   | ⛔ does ⛔ NOT push|⛔ does ⛔ not push
  scripts/agent-prompts.test.ts:1683 | docs/agents/DEV.md           | toContain | NOT-REVIEWED   | F-191
  scripts/agent-prompts.test.ts:1714 | docs/agents/CONTENT.md       | toMatch  | NOT-REVIEWED   | ⛔ בכל ריצה, ⛔ בלי יוצא מן הכלל
  scripts/agent-prompts.test.ts:1716 | docs/agents/CONTENT.md       | toMatch  | NOT-REVIEWED   | ⛔ ולא «כשרלוונטי»
  scripts/agent-prompts.test.ts:1717 | docs/agents/CONTENT.md       | toMatch  | NOT-REVIEWED   | בשורת הסקילים: `hebrew-content-writer`
  scripts/agent-prompts.test.ts:1722 | docs/skills-registry.md      | toContain | NOT-REVIEWED   | hebrew-content-writer
  scripts/agent-prompts.test.ts:1724 | docs/skills-registry.md      | toMatch  | NOT-REVIEWED   | חובה ל-CONTENT בכל ריצה
  scripts/agent-prompts.test.ts:1774 | docs/agents/PM.md            | toMatch  | NOT-REVIEWED   | שולחן העבודה של רוי הוא `plan\
  scripts/agent-prompts.test.ts:1788 | docs/agents/PM.md            | toContain | NOT-REVIEWED   | 30–60 minutes
  scripts/agent-prompts.test.ts:1789 | docs/agents/PM.md            | toMatch  | NOT-REVIEWED   | ⛔ under 30 min
  scripts/agent-prompts.test.ts:1790 | docs/agents/PM.md            | toMatch  | NOT-REVIEWED   | ⛔ over 60 min
  scripts/agent-prompts.test.ts:1792 | docs/agents/PM.md            | toContain | NOT-REVIEWED   | ⛔ אינה ניתנת לפיצול
  scripts/agent-prompts.test.ts:1797 | docs/agents/DEV.md           | toContain | NOT-REVIEWED   | 30–60 minutes
  scripts/agent-prompts.test.ts:1798 | docs/agents/DEV.md           | toContain | NOT-REVIEWED   | STEP 2 ③
  scripts/agent-prompts.test.ts:1820 | docs/agents/DEV.md           | toMatch  | NOT-REVIEWED   | מה כאן רצף, ומה כאן עיון
  scripts/agent-prompts.test.ts:1821 | docs/agents/DEV.md           | toContain | BRITTLE        | STEP 0 · 0.5 · 1 · 2 · 2.5 · 3 · 4 · 4.5 · 5 · 6 · 6.5 · 7 · 8
  scripts/agent-prompts.test.ts:1822 | docs/agents/DEV.md           | toMatch  | NOT-REVIEWED   | ⛔ ואין «מסלולים» להכריע ביניהם
  scripts/agent-prompts.test.ts:1826 | docs/agents/DEV.md           | toMatch  | NOT-REVIEWED   | ^## STEP C —
  scripts/agent-prompts.test.ts:1835 | docs/agents/DEV.md           | toMatch  | NOT-REVIEWED   | \| you touch code \| ⛔ \*\*never\*\* \|
  scripts/agent-prompts.test.ts:1836 | docs/agents/DEV.md           | toMatch  | NOT-REVIEWED   | task 1 of the plan
  scripts/agent-prompts.test.ts:1837 | docs/agents/DEV.md           | toMatch  | NOT-REVIEWED   | LAND TASK 1 OF THE PLAN IN THE SAME TICK
  scripts/agent-prompts.test.ts:1847 | docs/agents/DEV.md           | toMatch  | NOT-REVIEWED   | N tasks, ⛔ not one
  scripts/agent-prompts.test.ts:185  | docs/agents/QA.md            | toContain | KEEP-GATE      | merge --ff-only work/current
  scripts/agent-prompts.test.ts:1859 | docs/plan-open.md            | toContain | NOT-REVIEWED   | מה לקרוא, לפי תפקיד
  scripts/agent-prompts.test.ts:1864 | docs/plan-open.md            | toMatch  | NOT-REVIEWED   | ⛔ זו ⛔ אינה רשות לדלג
  scripts/agent-prompts.test.ts:1868 | docs/agents/DEV.md           | toContain | NOT-REVIEWED   | מה לקרוא, לפי תפקיד
  scripts/agent-prompts.test.ts:1869 | docs/agents/DEV.md           | toMatch  | NOT-REVIEWED   | ⛔ בספק: קרא
  scripts/agent-prompts.test.ts:189  | docs/agents/QA.md            | toContain | KEEP-GATE      | merge --ff-only work/current
  scripts/agent-prompts.test.ts:193  | docs/agents/QA.md            | toContain | KEEP-GATE      | merge --ff-only work/current
  scripts/agent-prompts.test.ts:199  | docs/agents/DEV.md           | toContain | KEEP-PATH      | rebase origin/dev
  scripts/agent-prompts.test.ts:200  | docs/agents/DEV.md           | toContain | NOT-REVIEWED   | rebase --abort
  scripts/agent-prompts.test.ts:205  | docs/agents/DEV.md           | toContain | NOT-REVIEWED   | ACTIVE_WORKSTREAM
  scripts/agent-prompts.test.ts:234  | docs/agents/QA.md            | toContain | NOT-REVIEWED   | ⟨נבדק: YYYY-MM-DD⟩
  scripts/agent-prompts.test.ts:235  | docs/agents/QA.md            | toMatch  | NOT-REVIEWED   | STAMPS ARE NOW YOURS
  scripts/agent-prompts.test.ts:236  | docs/agents/QA.md            | toMatch  | KEEP-PATH      | 03-for-roy
  scripts/agent-prompts.test.ts:241  | docs/agents/DEV.md           | toContain | NOT-REVIEWED   | הזרימה הפעילה
  scripts/agent-prompts.test.ts:242  | docs/agents/DEV.md           | toContain | NOT-REVIEWED   | ACTIVE_WORKSTREAM
  scripts/agent-prompts.test.ts:273  | docs/agents/QA.md            | toMatch  | NOT-REVIEWED   | DELTA THRESHOLD
  scripts/agent-prompts.test.ts:274  | docs/agents/QA.md            | toMatch  | NOT-REVIEWED   | does the learner get hurt
  scripts/agent-prompts.test.ts:276  | docs/agents/PM.md            | toMatch  | NOT-REVIEWED   | What does this buy the learner
  scripts/agent-prompts.test.ts:277  | docs/agents/PM.md            | toMatch  | NOT-REVIEWED   | ⛔ NOT an answer
  scripts/agent-prompts.test.ts:279  | docs/agents/DEV.md           | toMatch  | NOT-REVIEWED   | BINDING TOO
  scripts/agent-prompts.test.ts:285  | docs/agents/DEV.md           | toMatch  | NOT-REVIEWED   | ⛔ NOT ✅
  scripts/agent-prompts.test.ts:287  | docs/agents/QA.md            | toMatch  | NOT-REVIEWED   | FLIP 🟣 TO ✅
  scripts/agent-prompts.test.ts:288  | docs/agents/QA.md            | toContain | KEEP-PATH      | origin/dev
  scripts/agent-prompts.test.ts:300  | docs/agents/DEV.md           | toMatch  | NOT-REVIEWED   | BINDING TOO
  scripts/agent-prompts.test.ts:301  | docs/agents/DEV.md           | toMatch  | NOT-REVIEWED   | Layer A (OVERRIDES|is the only carve-out)
  scripts/agent-prompts.test.ts:306  | docs/agents/QA.md            | toContain | KEEP-GATE      | LOCK_HELD_BY
  scripts/agent-prompts.test.ts:307  | docs/agents/QA.md            | toMatch  | NOT-REVIEWED   | ANY agent's lock
  scripts/agent-prompts.test.ts:308  | docs/agents/QA.md            | toMatch  | KEEP-GATE      | `LOCK_HELD_BY: DEV` in
  scripts/agent-prompts.test.ts:321  | docs/agents/QA.md            | toContain | NOT-REVIEWED   | סקילים:
  scripts/agent-prompts.test.ts:324  | docs/agents/QA.md            | toContain | NOT-REVIEWED   | ⛔ אף אחד
  scripts/agent-prompts.test.ts:325  | docs/agents/QA.md            | toContain | NOT-REVIEWED   | superpowers:using-superpowers
  scripts/agent-prompts.test.ts:336  | docs/agents/QA.md            | toContain | NOT-REVIEWED   | superpowers:using-git-worktrees
  scripts/agent-prompts.test.ts:339  | docs/agents/QA.md            | toMatch  | NOT-REVIEWED   | finishing-a-development-branch` is QA
  scripts/agent-prompts.test.ts:341  | docs/agents/QA.md            | toContain | NOT-REVIEWED   | superpowers:finishing-a-development-branch
  scripts/agent-prompts.test.ts:350  | docs/agents/PM.md            | toContain | NOT-REVIEWED   | D-144
  scripts/agent-prompts.test.ts:351  | docs/agents/PM.md            | toContain | NOT-REVIEWED   | מ-X ל-Y
  scripts/agent-prompts.test.ts:353  | docs/agents/PM.md            | toMatch  | NOT-REVIEWED   | schema-only
  scripts/agent-prompts.test.ts:354  | docs/agents/PM.md            | toContain | NOT-REVIEWED   | 61-deferred
  scripts/agent-prompts.test.ts:365  | docs/agents/PM.md            | toContain | NOT-REVIEWED   | IMPROVE_TARGET
  scripts/agent-prompts.test.ts:366  | docs/agents/PM.md            | toMatch  | NOT-REVIEWED   | IMPROVE MODE
  scripts/agent-prompts.test.ts:368  | docs/agents/DEV.md           | toContain | NOT-REVIEWED   | IMPROVE_TARGET
  scripts/agent-prompts.test.ts:370  | docs/agents/DEV.md           | toMatch  | NOT-REVIEWED   | LAST STEP OF THE PICK ORDER
  scripts/agent-prompts.test.ts:388  | docs/agents/PM.md            | toContain | NOT-REVIEWED   | בו-זמנית
  scripts/agent-prompts.test.ts:389  | docs/agents/PM.md            | toMatch  | NOT-REVIEWED   | OUTRANKS 🩺 IMPROVE
  scripts/agent-prompts.test.ts:395  | docs/agents/QA.md            | toContain | NOT-REVIEWED   | plan/61-deferred.md
  scripts/agent-prompts.test.ts:396  | docs/agents/QA.md            | toContain | NOT-REVIEWED   | ACTIVE_WORKSTREAM
  scripts/agent-prompts.test.ts:398  | docs/agents/QA.md            | toMatch  | NOT-REVIEWED   | 36 § 13\.1` is UNCHANGED
  scripts/agent-prompts.test.ts:404  | docs/agents/PM.md            | toContain | NOT-REVIEWED   | D-147
  scripts/agent-prompts.test.ts:405  | docs/agents/PM.md            | toMatch  | NOT-REVIEWED   | SUCCESSFUL tick
  scripts/agent-prompts.test.ts:418  | docs/agents/QA.md            | toMatch  | NOT-REVIEWED   | STEP 0\.1 — WHICH LANE ARE YOU
  scripts/agent-prompts.test.ts:419  | docs/agents/QA.md            | toContain | NOT-REVIEWED   | מסלול: שער
  scripts/agent-prompts.test.ts:420  | docs/agents/QA.md            | toContain | NOT-REVIEWED   | מסלול: מלא
  scripts/agent-prompts.test.ts:423  | docs/agents/QA.md            | toMatch  | NOT-REVIEWED   | STOP HERE\. ⛔ Do not read the rest of this file
  scripts/agent-prompts.test.ts:425  | docs/agents/QA.md            | toMatch  | NOT-REVIEWED   | ⛔ No line at all ⇒ treat it as `מלא`
  scripts/agent-prompts.test.ts:436  | docs/agents/QA.md            | toContain | NOT-REVIEWED   | STOP HERE
  scripts/agent-prompts.test.ts:457  | docs/agents/QA.md            | toMatch  | NOT-REVIEWED   | lane separation ⛔ did not work
  scripts/agent-prompts.test.ts:472  | docs/agents/DEV.md           | toContain | NOT-REVIEWED   | D-148
  scripts/agent-prompts.test.ts:473  | docs/agents/DEV.md           | toContain | NOT-REVIEWED   | שכבה ב׳
  scripts/agent-prompts.test.ts:474  | docs/agents/DEV.md           | toMatch  | NOT-REVIEWED   | `arena`\*\* ⛔ \*\*AND\*\*
  scripts/agent-prompts.test.ts:475  | docs/agents/DEV.md           | toContain | NOT-REVIEWED   | `animate`
  scripts/agent-prompts.test.ts:477  | docs/agents/DEV.md           | toMatch  | NOT-REVIEWED   | only if `animate` itself sends you
  scripts/agent-prompts.test.ts:479  | docs/agents/DEV.md           | toMatch  | NOT-REVIEWED   | Any other row these three are BLOCKED
  scripts/agent-prompts.test.ts:480  | docs/agents/DEV.md           | toMatch  | NOT-REVIEWED   | study` \
  scripts/agent-prompts.test.ts:482  | docs/agents/DEV.md           | toMatch  | NOT-REVIEWED   | NEVER write `שכבה ב׳` onto a row
  scripts/agent-prompts.test.ts:484  | docs/agents/DEV.md           | toMatch  | NOT-REVIEWED   | beats a design skill
  scripts/agent-prompts.test.ts:485  | docs/agents/DEV.md           | toMatch  | NOT-REVIEWED   | max two per screen
  scripts/agent-prompts.test.ts:486  | docs/agents/DEV.md           | toContain | NOT-REVIEWED   | prefers-reduced-motion
  scripts/agent-prompts.test.ts:491  | docs/agents/QA.md            | toContain | NOT-REVIEWED   | D-148
  scripts/agent-prompts.test.ts:492  | docs/agents/QA.md            | toContain | NOT-REVIEWED   | `review-animations`
  scripts/agent-prompts.test.ts:494  | docs/agents/QA.md            | toMatch  | NOT-REVIEWED   | animate\|transition\|motion\|glow\(
  scripts/agent-prompts.test.ts:496  | docs/agents/QA.md            | toMatch  | NOT-REVIEWED   | ⛔ does not block the merge
  scripts/agent-prompts.test.ts:497  | docs/agents/QA.md            | toContain | NOT-REVIEWED   | prefers-reduced-motion
  scripts/agent-prompts.test.ts:499  | docs/agents/QA.md            | toMatch  | NOT-REVIEWED   | ⛔ NOT yours
  scripts/agent-prompts.test.ts:529  | docs/agents/PM.md            | toMatch  | NOT-REVIEWED   | run `write-swift`
  scripts/agent-prompts.test.ts:580  | docs/skills-registry.md      | toContain | NOT-REVIEWED   | [SKILL:
  scripts/agent-prompts.test.ts:592  | docs/skills-registry.md      | toContain | KEEP-PATH      | skills/taste-skill/SKILL.md
  scripts/agent-prompts.test.ts:593  | docs/skills-registry.md      | toContain | KEEP-PATH      | skills/imagegen-frontend-mobile/SKILL.md
  scripts/agent-prompts.test.ts:638  | docs/skills-registry.md      | toContain | NOT-REVIEWED   | תוסף `superpowers`
  scripts/agent-prompts.test.ts:647  | docs/agents/PM.md            | toContain | NOT-REVIEWED   | docs/skills-registry.md
  scripts/agent-prompts.test.ts:648  | docs/agents/PM.md            | toContain | NOT-REVIEWED   | STATE: PLANNING
  scripts/agent-prompts.test.ts:649  | docs/agents/PM.md            | toContain | NOT-REVIEWED   | [SKILL:
  scripts/agent-prompts.test.ts:650  | docs/agents/PM.md            | toContain | KEEP-PATH      | 50-tasks.md
  scripts/agent-prompts.test.ts:656  | docs/agents/PM.md            | toContain | NOT-REVIEWED   | [SKILL:
  scripts/agent-prompts.test.ts:657  | docs/agents/PM.md            | toContain | NOT-REVIEWED   | docs/skills-registry.md
  scripts/agent-prompts.test.ts:658  | docs/agents/PM.md            | toContain | KEEP-PATH      | skills/taste-skill/SKILL.md
  scripts/agent-prompts.test.ts:701  | docs/agents/QA.md            | toContain | NOT-REVIEWED   | קרא את docs/skills-registry.md מול המשימה שנבחרה
  scripts/agent-prompts.test.ts:702  | docs/agents/QA.md            | toContain | NOT-REVIEWED   | "[SKILL: <שם>] — כי <משפט אחד>"
  scripts/agent-prompts.test.ts:709  | docs/agents/QA.md            | toContain | NOT-REVIEWED   | דיווח בדיעבד ("הייתי צריך להפעיל X") אינו סוגר את השלב
  scripts/agent-prompts.test.ts:725  | docs/agents/QA.md            | toMatch  | NOT-REVIEWED   | STEP \d+\.\d+ —\s*$
  scripts/agent-prompts.test.ts:746  | docs/agents/DEV.md           | toContain | NOT-REVIEWED   | ACTIVE_WORKSTREAM: general
  scripts/agent-prompts.test.ts:747  | docs/agents/DEV.md           | toMatch  | NOT-REVIEWED   | general · loop · base
  scripts/agent-prompts.test.ts:749  | docs/agents/DEV.md           | toMatch  | NOT-REVIEWED   | \*\*זרימה\*\* \|[^\n]*`general`
  scripts/agent-prompts.test.ts:751  | docs/agents/DEV.md           | toMatch  | NOT-REVIEWED   | \*\*זרימה\*\* \|[^\n]*`cards`
  scripts/agent-prompts.test.ts:756  | docs/agents/PM.md            | toContain | NOT-REVIEWED   | ACTIVE_WORKSTREAM: general
  scripts/agent-prompts.test.ts:757  | docs/agents/PM.md            | toContain | NOT-REVIEWED   | PREV_WORKSTREAM
  scripts/agent-prompts.test.ts:758  | docs/agents/PM.md            | toContain | NOT-REVIEWED   | D-174
  scripts/agent-prompts.test.ts:763  | docs/agents/PM.md            | toMatch  | NOT-REVIEWED   | ⛔ NEVER\. That is QA's alone
  scripts/agent-prompts.test.ts:764  | docs/agents/PM.md            | toMatch  | NOT-REVIEWED   | ⛔ \*\*⛔ You ⛔ do not seal a workstream\*\*
  scripts/agent-prompts.test.ts:769  | docs/agents/QA.md            | toContain | NOT-REVIEWED   | general
  scripts/agent-prompts.test.ts:770  | docs/agents/QA.md            | toMatch  | NOT-REVIEWED   | still YOURS ALONE
  scripts/agent-prompts.test.ts:771  | docs/agents/QA.md            | toMatch  | NOT-REVIEWED   | is ⛔ \*\*not\*\* a seal
  scripts/agent-prompts.test.ts:784  | docs/agents/DEV.md           | toMatch  | NOT-REVIEWED   | ACTIVE_TASK_ID: \[T-xxx, T-yyy\]
  scripts/agent-prompts.test.ts:799  | docs/agents/DEV.md           | toContain | KEEP-CITATION  | RULES § 0.28
  scripts/agent-prompts.test.ts:801  | plan/RULES.md                | toMatch  | NOT-REVIEWED   | ### 0\.28 ·
  scripts/agent-prompts.test.ts:830  | docs/agents/PM.md            | toContain | KEEP-STRUCTURE | STEP 5.5
  scripts/agent-prompts.test.ts:832  | docs/agents/PM.md            | toMatch  | NOT-REVIEWED   | `סוג עבודה` is `נוחות`
  scripts/agent-prompts.test.ts:834  | docs/agents/PM.md            | toMatch  | NOT-REVIEWED   | EARLIER tick, ⛔ never this one
  scripts/agent-prompts.test.ts:835  | docs/agents/PM.md            | toContain | NOT-REVIEWED   | ⛔ you may not build a row you opened in the same tick
  scripts/agent-prompts.test.ts:836  | docs/agents/PM.md            | toContain | NOT-REVIEWED   | C-0366
  scripts/agent-prompts.test.ts:842  | docs/agents/PM.md            | toMatch  | NOT-REVIEWED   | QA's gate exactly like DEV's code
  scripts/agent-prompts.test.ts:843  | docs/agents/PM.md            | toMatch  | NOT-REVIEWED   | do ⛔ NOT mark it ✅
  scripts/agent-prompts.test.ts:845  | docs/agents/PM.md            | toContain | NOT-REVIEWED   | D-164
  scripts/agent-prompts.test.ts:847  | docs/agents/PM.md            | toContain | NOT-REVIEWED   | You never write code
  scripts/agent-prompts.test.ts:897  | docs/agents/DEV.md           | toContain | NOT-REVIEWED   | grep -q \
  scripts/agent-prompts.test.ts:915  | docs/agents/QA.md            | toContain | NOT-REVIEWED   | ## POST-PROMOTION CHECK
  scripts/loop-health.test.ts:1136   | docs/agents/roster.json      | toMatch  | NOT-REVIEWED   | ^loop\(
  scripts/loop-health.test.ts:1163   | docs/agents/roster.json      | toContain | NOT-REVIEWED   | loop(QA
  scripts/loop-health.test.ts:1164   | docs/agents/roster.json      | toContain | NOT-REVIEWED   | loop(CRITIC
  scripts/measure-level-headroom.test.ts:39 | package.json                 | toContain | DERIVED        | new Date().toISOString()
  scripts/measure-sense-accuracy.test.ts:38 | package.json                 | toContain | DERIVED        | measureAccuracy({ items: [], inv, gold, levels })
  scripts/measure-sense-accuracy.test.ts:39 | package.json                 | toMatch  | DERIVED        | items:\s*\[\s*\{
  scripts/measure-sense-accuracy.test.ts:48 | package.json                 | toMatch  | DERIVED        | if \(!existsSync\(H1\)\) \{[\s\S]*?process\.exit\(1\)
  scripts/measure-sense-accuracy.test.ts:54 | package.json                 | toContain | DERIVED        | gold.droppedGap
  scripts/measure-sense-accuracy.test.ts:55 | package.json                 | toContain | DERIVED        | gold.droppedPseudoGap
  scripts/measure-sense-accuracy.test.ts:72 | package.json                 | toContain | DERIVED        | console.log(${name})
  scripts/measure-sense-accuracy.test.ts:78 | package.json                 | toContain | DERIVED        | h3-kaikki-en.jsonl
  scripts/measure-sense-accuracy.test.ts:79 | package.json                 | toContain | DERIVED        | h4-word2word-en-he.tsv
  scripts/measure-sense-accuracy.test.ts:83 | package.json                 | toMatch  | DERIVED        | secondEntries\.length === 0 \? null :
  scripts/measure-sense-accuracy.test.ts:88 | package.json                 | toContain | DERIVED        | renderCrossValidationMarkdown
  scripts/measure-sense-accuracy.test.ts:92 | package.json                 | toMatch  | DERIVED        | \bllm\b|\bgpt\b|openai|anthropic
  scripts/rules-citations.test.ts:102 | package.json                 | toContain | DERIVED        | check:rules
  scripts/rules-citations.test.ts:109 | plan/RULES.md                | toContain | NOT-REVIEWED   | ${word} פקודות
  scripts/rules-citations.test.ts:135 | package.json                 | toContain | DERIVED        | build
  scripts/rules-citations.test.ts:136 | package.json                 | toContain | DERIVED        | check:mobile
  scripts/rules-citations.test.ts:145 | package.json                 | toContain | DERIVED        | npm run verify:fast
  scripts/rules-citations.test.ts:146 | package.json                 | toContain | DERIVED        | ${words[fast.length]} commands
  scripts/rules-citations.test.ts:147 | package.json                 | toContain | DERIVED        | ${words[commands.length]} commands
  scripts/rules-citations.test.ts:149 | package.json                 | toMatch  | DERIVED        | ⛔ NOT a substitute
  scripts/rules-citations.test.ts:197 | docs/agents/QA.md            | toContain | NOT-REVIEWED   | loop health: N/${total}
  scripts/rules-citations.test.ts:198 | docs/agents/QA.md            | toContain | NOT-REVIEWED   | ⇐ ${total} checks
  scripts/rules-citations.test.ts:211 | docs/agents/roster.json      | toMatch  | NOT-REVIEWED   | claude-[a-z0-9.-]+
  scripts/skills-reachable.test.ts:117 | docs/skills-registry.md      | toContain | NOT-REVIEWED   | ⛔ לא מובטח
  scripts/skills-reachable.test.ts:122 | docs/skills-registry.md      | toMatch  | NOT-REVIEWED   | משליך אותו בשקט
  scripts/skills-reachable.test.ts:123 | docs/skills-registry.md      | toMatch  | NOT-REVIEWED   | ⛔ אין פעולה שרוי יכול לעשות
  scripts/skills-reachable.test.ts:125 | docs/skills-registry.md      | toMatch  | NOT-REVIEWED   | הטריגר ⛔ לא בוטל, הכלי בוטל
  scripts/skills-reachable.test.ts:126 | docs/skills-registry.md      | toContain | NOT-REVIEWED   | npm run check:palette
  scripts/verify-mobile.test.ts:1176 | package.json                 | toContain | DERIVED        | const FLOW_ARRIVAL = {
  scripts/verify-mobile.test.ts:1177 | package.json                 | toContain | DERIVED        | const JOURNEYS = {
  scripts/verify-mobile.test.ts:1178 | package.json                 | toMatch  | DERIVED        | join:\s*\{
  scripts/verify-mobile.test.ts:1179 | package.json                 | toMatch  | DERIVED        | learn:\s*\{
  scripts/verify-mobile.test.ts:1180 | package.json                 | toMatch  | DERIVED        | play:\s*\{
  scripts/verify-mobile.test.ts:1210 | package.json                 | toContain | DERIVED        | BACK_CONTROL_RE
  scripts/verify-mobile.test.ts:1211 | package.json                 | toMatch  | DERIVED        | BACK_CONTROL_RE\s*=\s*\
  scripts/verify-mobile.test.ts:1216 | package.json                 | toContain | DERIVED        | report(
  scripts/verify-mobile.test.ts:1217 | package.json                 | toMatch  | DERIVED        | check\(\s*\n?\s*result\.
  scripts/verify-mobile.test.ts:1225 | package.json                 | toContain | DERIVED        | chromium.launch
  scripts/verify-mobile.test.ts:23   | package.json                 | toContain | DERIVED        | check:mobile
