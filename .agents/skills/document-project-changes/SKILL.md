---
name: document-project-changes
description: Document every requested or implemented change to this repository and keep architecture, database, API, security, operations, and user-facing documentation synchronized with reality. Use for any task that creates, edits, moves, or deletes project files; changes SQLite DDL, migrations, data semantics, REST contracts, frontend behavior or dependencies, configuration, storage, security, or deployment; or approves an architecture decision. Do not use for read-only explanations or investigations that leave the repository unchanged.
---

# Document Project Changes

Keep the repository's narrative design, executable artifacts, and request history consistent. Treat documentation as part of the implementation, not as a later summary.

## Workflow

### 1. Inspect before editing

1. Read `docs/README.md`, `docs/changes/README.md`, and the canonical documents relevant to the request.
2. Inspect `git status` and the existing diff. Preserve unrelated user changes.
3. Separate the user's requested outcome from implementation assumptions and already-existing behavior.

### 2. Open a change record

Create `docs/changes/YYYY-MM-DD-short-slug.md` from the template in `docs/changes/README.md` for every mutating request. Mark it `In progress` while work is underway.

Record:

- the original intent and motivation;
- included and excluded scope;
- assumptions and decisions with rationale;
- planned affected areas;
- architecture, database, API, frontend, security/privacy, and operational impact;
- compatibility, rollout, data migration, and rollback concerns;
- actual verification and unresolved follow-ups.

Use `None` plus a short reason for unaffected impact areas. Do not omit headings. Do not claim planned behavior was implemented.

### 3. Update canonical documentation with the implementation

Update documentation in the same change whenever an existing statement becomes false or an important behavior is introduced.

- Update `docs/architecture.md` for boundaries, component ownership, workflows, dependencies, external systems, security, deployment, or cross-cutting behavior.
- Update `docs/database.md` for the current logical and physical data model.
- Add or update API documentation when routes, payloads, status codes, pagination, errors, or compatibility change.
- Add a decision record when choosing among meaningful alternatives with lasting consequences.
- Update user or operational guidance when setup, configuration, recovery, or visible behavior changes.

Keep historical baselines and completed change records intact. Link superseding records instead of silently rewriting history.

### 4. Apply database-specific controls

For every database request:

1. Compare the request with `docs/database/schema-v1.sql` and `docs/database.md`.
2. Preserve `schema-v1.sql` as the original baseline. Represent later changes through ordered migration artifacts and an explicitly identified current schema artifact when those structures exist.
3. Document exact tables, columns, types, nullability, defaults, checks, keys, foreign-key actions, and indexes affected.
4. Explain data backfill, transaction boundaries, compatibility window, rollout order, failure recovery, and rollback. State when SQLite makes rollback destructive or requires a table rebuild.
5. Verify `PRAGMA foreign_keys = ON`, JSON1 assumptions, schema load, foreign-key integrity, and relevant query plans or indexes.
6. Identify application invariants not enforced by DDL. Do not describe them as database guarantees.

Never put repository tokens or other secret values in schemas, migrations, examples, logs, or change records. Store only opaque credential references.

### 5. Reconcile before handoff

1. Review the full diff, not only files edited most recently.
2. Replace the record's planned list with the actual files and outcomes.
3. Run proportionate verification and write exact commands and results in the record.
4. Set status to `Completed`, `Partially completed`, or `Blocked` truthfully.
5. Confirm canonical docs describe current behavior and the change record explains how and why it changed.

If implementation and documentation disagree, either fix the disagreement or report the work as incomplete. Never resolve it by documenting behavior the code does not provide.
