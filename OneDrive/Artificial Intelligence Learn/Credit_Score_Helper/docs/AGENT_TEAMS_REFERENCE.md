# Agent Teams — Master Reference Guide

> Coordinate multiple Claude Code instances working together as a team, with shared tasks,
> inter-agent messaging, and centralized management.

**Status**: Experimental (disabled by default)
**Minimum Version**: Claude Code v2.1.32+
**Enable**: `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` in settings or environment

---

## Table of Contents

1. [When to Use Agent Teams](#1-when-to-use-agent-teams)
2. [Agent Teams vs Subagents](#2-agent-teams-vs-subagents)
3. [Architecture](#3-architecture)
4. [Enabling Agent Teams](#4-enabling-agent-teams)
5. [Starting a Team](#5-starting-a-team)
6. [Display Modes](#6-display-modes)
7. [Controlling Teams](#7-controlling-teams)
8. [Task System](#8-task-system)
9. [Communication Model](#9-communication-model)
10. [Permissions](#10-permissions)
11. [Quality Gates with Hooks](#11-quality-gates-with-hooks)
12. [Subagent Configuration (for Teammates)](#12-subagent-configuration-for-teammates)
13. [Best Practices](#13-best-practices)
14. [Use Case Patterns](#14-use-case-patterns)
15. [Troubleshooting](#15-troubleshooting)
16. [Known Limitations](#16-known-limitations)
17. [Token Cost Considerations](#17-token-cost-considerations)

---

## 1. When to Use Agent Teams

Agent teams are most effective when **parallel exploration adds real value** and teammates
need to **communicate with each other**. Best use cases:

| Use Case | Why Teams Work |
|---|---|
| **Research and review** | Multiple teammates investigate different aspects simultaneously, share and challenge findings |
| **New modules/features** | Each teammate owns a separate piece without stepping on each other |
| **Debugging with competing hypotheses** | Teammates test different theories in parallel, converge faster |
| **Cross-layer coordination** | Changes spanning frontend, backend, tests — each owned by a different teammate |

**Do NOT use agent teams when**:
- Tasks are sequential
- Work involves same-file edits
- Work has many dependencies between steps
- Routine/simple tasks (use a single session or subagents instead)

---

## 2. Agent Teams vs Subagents

| | Subagents | Agent Teams |
|---|---|---|
| **Context** | Own context window; results return to caller | Own context window; fully independent |
| **Communication** | Report results back to main agent only | Teammates message each other directly |
| **Coordination** | Main agent manages all work | Shared task list with self-coordination |
| **Best for** | Focused tasks where only the result matters | Complex work requiring discussion and collaboration |
| **Token cost** | Lower: results summarized back to main context | Higher: each teammate is a separate Claude instance |
| **Nesting** | Cannot spawn other subagents | Cannot spawn nested teams |

**Rule of thumb**: Use subagents when workers just need to report back. Use agent teams when
workers need to share findings, challenge each other, and coordinate on their own.

---

## 3. Architecture

An agent team consists of four components:

| Component | Role |
|---|---|
| **Team Lead** | The main Claude Code session that creates the team, spawns teammates, and coordinates work |
| **Teammates** | Separate Claude Code instances that each work on assigned tasks |
| **Task List** | Shared list of work items that teammates claim and complete |
| **Mailbox** | Messaging system for communication between agents |

### Storage Locations

```
~/.claude/teams/{team-name}/config.json    # Team configuration
~/.claude/tasks/{team-name}/               # Task list storage
```

The team config contains a `members` array with each teammate's name, agent ID, and agent type.
Teammates can read this file to discover other team members.

### Lifecycle

```
User prompt --> Lead creates team --> Lead spawns teammates -->
Teammates claim tasks --> Teammates work independently -->
Teammates communicate via mailbox --> Lead synthesizes results -->
Lead cleans up team
```

---

## 4. Enabling Agent Teams

Add to `.claude/settings.local.json` (project-local, not committed):

```json
{
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
  }
}
```

Or in `~/.claude/settings.json` (global, all projects):

```json
{
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
  }
}
```

Or set the environment variable directly in your shell.

---

## 5. Starting a Team

Tell Claude to create an agent team and describe the task and team structure in natural language.
Claude creates the team, spawns teammates, and coordinates work.

### Example Prompt

```
I'm designing a CLI tool that helps developers track TODO comments across
their codebase. Create an agent team to explore this from different angles:
one teammate on UX, one on technical architecture, one playing devil's advocate.
```

### What Claude Does

1. Creates a team with a shared task list
2. Spawns teammates for each role
3. Has them explore the problem
4. Synthesizes findings
5. Cleans up the team when finished

### Specifying Teammates and Models

```
Create a team with 4 teammates to refactor these modules in parallel.
Use Sonnet for each teammate.
```

---

## 6. Display Modes

| Mode | Description | Requirements |
|---|---|---|
| **in-process** | All teammates run inside main terminal. Use `Shift+Down` to cycle. | Any terminal |
| **split panes** | Each teammate gets its own pane. Click to interact. | tmux or iTerm2 |
| **auto** (default) | Split panes if inside tmux, in-process otherwise | - |

### Configuration

In `settings.json`:

```json
{
  "teammateMode": "in-process"
}
```

Or per-session via CLI flag:

```bash
claude --teammate-mode in-process
```

### In-Process Mode Navigation

| Key | Action |
|---|---|
| `Shift+Down` | Cycle through teammates (wraps back to lead after last) |
| `Enter` | View a teammate's session |
| `Escape` | Interrupt a teammate's current turn |
| `Ctrl+T` | Toggle the task list |

### Split Pane Requirements

- **tmux**: Install via system package manager. `tmux -CC` in iTerm2 is the suggested entrypoint.
- **iTerm2**: Install `it2` CLI, enable Python API in Settings > General > Magic.
- **Not supported**: VS Code integrated terminal, Windows Terminal, Ghostty.

---

## 7. Controlling Teams

All control is through natural language to the lead.

### Require Plan Approval

Force teammates to plan before implementing. The teammate works in read-only plan mode
until the lead approves:

```
Spawn an architect teammate to refactor the authentication module.
Require plan approval before they make any changes.
```

**Flow**: Teammate plans --> Sends plan to lead --> Lead approves/rejects -->
If rejected: teammate revises and resubmits --> If approved: teammate implements.

Influence the lead's judgment:
```
Only approve plans that include test coverage.
Reject plans that modify the database schema.
```

### Talk to Teammates Directly

Each teammate is a full, independent Claude Code session. You can message any teammate
directly for additional instructions, questions, or to redirect their approach.

### Shut Down a Teammate

```
Ask the researcher teammate to shut down
```

The teammate can approve (exits gracefully) or reject with an explanation.

### Clean Up the Team

```
Clean up the team
```

**Important rules**:
- Always use the lead to clean up (not teammates)
- Shut down all teammates before cleanup
- Cleanup fails if active teammates remain

---

## 8. Task System

### Task States

```
pending --> in progress --> completed
```

Tasks can have **dependencies**: a pending task with unresolved dependencies cannot be
claimed until those dependencies are completed. Dependencies unblock automatically when
prerequisite tasks complete.

### Task Assignment

| Method | Description |
|---|---|
| **Lead assigns** | Tell the lead which task to give to which teammate |
| **Self-claim** | After finishing, a teammate picks the next unassigned, unblocked task |

Task claiming uses **file locking** to prevent race conditions when multiple teammates
try to claim the same task simultaneously.

### Sizing Tasks

| Size | Problem |
|---|---|
| Too small | Coordination overhead exceeds benefit |
| Too large | Teammates work too long without check-ins, risk wasted effort |
| Just right | Self-contained units with clear deliverable (function, test file, review) |

**Target**: 5-6 tasks per teammate keeps everyone productive without excessive context switching.

---

## 9. Communication Model

### Message Types

| Type | Behavior |
|---|---|
| **message** | Send to one specific teammate |
| **broadcast** | Send to all teammates simultaneously (use sparingly — costs scale with team size) |

### Delivery Mechanisms

- **Automatic message delivery**: Messages are delivered automatically to recipients.
  The lead doesn't need to poll.
- **Idle notifications**: When a teammate finishes and stops, they automatically notify the lead.
- **Shared task list**: All agents can see task status and claim available work.

### Context Per Teammate

Each teammate has its own context window. When spawned, a teammate loads:
- Same project context as a regular session (CLAUDE.md, MCP servers, skills)
- The spawn prompt from the lead
- **NOT** the lead's conversation history

---

## 10. Permissions

- Teammates start with the lead's permission settings
- If the lead runs with `--dangerously-skip-permissions`, all teammates do too
- After spawning, you can change individual teammate modes
- You cannot set per-teammate modes at spawn time

### Reducing Permission Prompts

Pre-approve common operations in your permission settings before spawning teammates:

```json
{
  "permissions": {
    "allow": [
      "Bash(npm:*)",
      "Bash(git:*)",
      "Read",
      "Edit",
      "Write"
    ]
  }
}
```

---

## 11. Quality Gates with Hooks

Two hook events are specific to agent teams:

### TeammateIdle

Runs when a teammate is about to go idle.

- **Exit code 0**: Teammate goes idle normally
- **Exit code 2**: Sends feedback to the teammate and keeps it working

```json
{
  "hooks": {
    "TeammateIdle": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "./scripts/check-teammate-done.sh"
          }
        ]
      }
    ]
  }
}
```

### TaskCompleted

Runs when a task is being marked complete.

- **Exit code 0**: Task is marked complete
- **Exit code 2**: Prevents completion and sends feedback

```json
{
  "hooks": {
    "TaskCompleted": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "./scripts/validate-task-completion.sh"
          }
        ]
      }
    ]
  }
}
```

---

## 12. Subagent Configuration (for Teammates)

Teammates are built on the subagent system. Understanding subagent configuration helps
you build better teammates.

### Subagent File Format

Markdown files with YAML frontmatter, stored in:

| Location | Scope | Priority |
|---|---|---|
| `--agents` CLI flag | Current session | 1 (highest) |
| `.claude/agents/` | Current project | 2 |
| `~/.claude/agents/` | All your projects | 3 |
| Plugin `agents/` directory | Where plugin is enabled | 4 (lowest) |

### Full Frontmatter Schema

```yaml
---
name: my-agent                    # Required: unique identifier (lowercase, hyphens)
description: When to use this     # Required: triggers automatic delegation
tools: Read, Grep, Glob, Bash    # Optional: allowlist (inherits all if omitted)
disallowedTools: Write, Edit      # Optional: denylist (removed from inherited)
model: sonnet                     # Optional: sonnet|opus|haiku|inherit|full-model-id
permissionMode: default           # Optional: default|acceptEdits|dontAsk|bypassPermissions|plan
maxTurns: 50                      # Optional: max agentic turns before stop
skills:                           # Optional: skills to preload into context
  - api-conventions
mcpServers:                       # Optional: MCP servers for this agent
  - playwright:
      type: stdio
      command: npx
      args: ["-y", "@playwright/mcp@latest"]
  - github                        # Reference existing server by name
hooks:                            # Optional: lifecycle hooks scoped to this agent
  PreToolUse:
    - matcher: "Bash"
      hooks:
        - type: command
          command: "./scripts/validate.sh"
memory: user                      # Optional: user|project|local (persistent memory)
background: false                 # Optional: always run as background task
effort: high                      # Optional: low|medium|high|max (Opus 4.6 only)
isolation: worktree               # Optional: run in git worktree for isolation
initialPrompt: "Start by..."     # Optional: auto-submitted first user turn (--agent mode)
---

System prompt goes here in the markdown body.
This replaces the default Claude Code system prompt.
```

### CLI-Defined Agents (Ephemeral)

```bash
claude --agents '{
  "code-reviewer": {
    "description": "Expert code reviewer. Use proactively after code changes.",
    "prompt": "You are a senior code reviewer...",
    "tools": ["Read", "Grep", "Glob", "Bash"],
    "model": "sonnet"
  },
  "debugger": {
    "description": "Debugging specialist for errors and test failures.",
    "prompt": "You are an expert debugger..."
  }
}'
```

### Memory Scopes

| Scope | Location | Use When |
|---|---|---|
| `user` | `~/.claude/agent-memory/<name>/` | Knowledge applies across all projects |
| `project` | `.claude/agent-memory/<name>/` | Project-specific, shareable via VCS |
| `local` | `.claude/agent-memory-local/<name>/` | Project-specific, not committed |

### Restricting Which Subagents Can Be Spawned

In the `tools` field:

```yaml
tools: Agent(worker, researcher), Read, Bash
```

Only `worker` and `researcher` can be spawned. Use `Agent` without parentheses to allow any.
Omit `Agent` entirely to prevent all subagent spawning.

### Disabling Specific Subagents

```json
{
  "permissions": {
    "deny": ["Agent(Explore)", "Agent(my-custom-agent)"]
  }
}
```

---

## 13. Best Practices

### Give Teammates Enough Context

Teammates don't inherit the lead's conversation history. Include task-specific details
in the spawn prompt:

```
Spawn a security reviewer teammate with the prompt: "Review the authentication
module at src/auth/ for security vulnerabilities. Focus on token handling, session
management, and input validation. The app uses JWT tokens stored in httpOnly cookies.
Report any issues with severity ratings."
```

### Choose Appropriate Team Size

- **Start with 3-5 teammates** for most workflows
- Token costs scale linearly per teammate
- Coordination overhead increases with size
- Diminishing returns beyond a certain point
- **Target 5-6 tasks per teammate**
- Three focused teammates often outperform five scattered ones

### Avoid File Conflicts

Two teammates editing the same file leads to overwrites. Break work so each teammate
owns a different set of files.

### Wait for Teammates to Finish

If the lead starts implementing instead of waiting:

```
Wait for your teammates to complete their tasks before proceeding
```

### Monitor and Steer

Check in on progress, redirect approaches that aren't working, synthesize findings
as they come in. Unattended teams risk wasted effort.

### Start with Research and Review

If new to agent teams, begin with non-code tasks: reviewing a PR, researching a library,
investigating a bug. These show the value without coordination challenges of parallel
implementation.

---

## 14. Use Case Patterns

### Parallel Code Review

```
Create an agent team to review PR #142. Spawn three reviewers:
- One focused on security implications
- One checking performance impact
- One validating test coverage
Have them each review and report findings.
```

**Why it works**: Each reviewer applies a different filter to the same PR. No file conflicts.
Lead synthesizes findings across all three.

### Competing Hypotheses Debugging

```
Users report the app exits after one message instead of staying connected.
Spawn 5 agent teammates to investigate different hypotheses. Have them talk to
each other to try to disprove each other's theories, like a scientific debate.
Update the findings doc with whatever consensus emerges.
```

**Why it works**: Adversarial structure prevents anchoring bias. The theory that survives
debate is more likely to be the actual root cause.

### Cross-Layer Feature Build

```
Create a team to implement the user notification feature:
- Backend teammate: build the notification service and API endpoints
- Frontend teammate: build the notification UI components
- Test teammate: write integration tests as the others build
Have them coordinate on the API contract first.
```

### Research Sprint

```
Create a team to evaluate three database options for our new service:
- One teammate researches PostgreSQL with pgvector
- One researches MongoDB Atlas with vector search
- One researches Pinecone as dedicated vector DB
Have them share findings and challenge each other's conclusions.
```

---

## 15. Troubleshooting

### Teammates Not Appearing

- **In-process mode**: Press `Shift+Down` — they may be running but not visible
- Task may not be complex enough for Claude to warrant a team
- For split panes: verify tmux is installed (`which tmux`)
- For iTerm2: verify `it2` CLI installed and Python API enabled

### Too Many Permission Prompts

Pre-approve common operations in permission settings before spawning teammates.

### Teammates Stopping on Errors

Check output via `Shift+Down` (in-process) or click pane (split mode), then either:
- Give additional instructions directly
- Spawn a replacement teammate

### Lead Shuts Down Prematurely

Tell the lead to keep going or to wait for teammates before proceeding.

### Orphaned tmux Sessions

```bash
tmux ls
tmux kill-session -t <session-name>
```

---

## 16. Known Limitations

| Limitation | Detail |
|---|---|
| **No session resumption** | `/resume` and `/rewind` do not restore in-process teammates |
| **Task status lag** | Teammates sometimes fail to mark tasks complete, blocking dependents |
| **Slow shutdown** | Teammates finish current request/tool call before shutting down |
| **One team per session** | Clean up current team before starting a new one |
| **No nested teams** | Teammates cannot spawn their own teams |
| **Lead is fixed** | Cannot promote a teammate to lead or transfer leadership |
| **Permissions set at spawn** | All teammates start with lead's mode; change individually after |
| **Split panes limited** | Not supported in VS Code terminal, Windows Terminal, or Ghostty |

**CLAUDE.md works normally**: Teammates read CLAUDE.md from their working directory.

---

## 17. Token Cost Considerations

- Each teammate has its own context window
- Token usage scales linearly with active teammates
- Broadcast messages multiply cost by team size
- For research/review/new features: extra tokens usually worthwhile
- For routine tasks: single session is more cost-effective

### Cost Optimization

1. Keep team size small (3-5)
2. Use `model: sonnet` or `model: haiku` for simpler teammate roles
3. Use `message` (targeted) instead of `broadcast` when possible
4. Size tasks appropriately — too many small tasks = overhead
5. Monitor and shut down idle teammates promptly

---

## Quick Reference: Prompt Templates

### Start a Team
```
Create an agent team with [N] teammates to [task description].
- Teammate 1: [role and focus]
- Teammate 2: [role and focus]
- Teammate 3: [role and focus]
[Optional: Use Sonnet/Haiku for each teammate.]
[Optional: Require plan approval before implementation.]
```

### Steer the Team
```
Wait for your teammates to complete their tasks before proceeding.
Ask the [role] teammate to also check [additional concern].
Have [teammate A] share their findings with [teammate B].
```

### Wind Down
```
Ask all teammates to shut down.
Clean up the team.
```
