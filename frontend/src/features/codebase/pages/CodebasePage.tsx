import { useEffect, useRef, useState, type FormEvent } from 'react';

import { Spinner } from '../../../components/feedback/Spinner/Spinner';
import { toast } from '../../../components/feedback/Toast/toastStore';
import {
  CheckIcon,
  CodebaseIcon,
  PlusIcon,
  TrashIcon,
  WarningIcon,
} from '../../../components/icons/Icons';
import { Modal } from '../../../components/overlay/Modal/Modal';
import { PageHeader } from '../../../components/page/PageHeader/PageHeader';
import { ProjectWorkflowNavigation } from '../../projects/components/ProjectWorkflowNavigation/ProjectWorkflowNavigation';
import type { ProjectSummary } from '../../projects/model/project';
import workspaceStyles from '../../shared/ProjectWorkspacePage.module.css';
import { useCodebaseWorkspace } from '../hooks/useCodebaseWorkspace';
import type { CodebaseWorkspaceItem, MockCommit } from '../model/codebase';
import styles from './CodebasePage.module.css';

interface CodebasePageProps {
  readonly project: ProjectSummary;
}

function formatTimestamp(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function selectedCommit(codebase: CodebaseWorkspaceItem): MockCommit | undefined {
  return codebase.repository?.branches
    .find((branch) => branch.name === codebase.selectedBranch)
    ?.commits.find((commit) => commit.sha === codebase.selectedCommit);
}

export function CodebasePage({ project }: CodebasePageProps) {
  const [codebasePendingDeletion, setCodebasePendingDeletion] = useState<
    CodebaseWorkspaceItem | undefined
  >();
  const wasCreatingSnapshotRef = useRef(false);
  const wasValidatingRef = useRef(false);
  const {
    addCodebase,
    canCreateSnapshot,
    canStartValidation,
    codebases,
    deleteCodebase,
    hasDuplicateUrls,
    hasUnvalidatedCodebases,
    hasValidation,
    isBusy,
    isCreatingSnapshot,
    isSnapshotStale,
    isValidating,
    isValidationStale,
    selectBranch,
    selectCommit,
    snapshot,
    startSnapshotCreation,
    startValidation,
    updateDraftCodebase,
  } = useCodebaseWorkspace(project.id);

  useEffect(() => {
    setCodebasePendingDeletion(undefined);
  }, [project.id]);

  useEffect(() => {
    if (wasValidatingRef.current && !isValidating && hasValidation) {
      toast.success('Codebases validated', {
        description: 'Repository URLs are locked and mocked revision data is ready to select.',
      });
    }

    wasValidatingRef.current = isValidating;
  }, [hasValidation, isValidating]);

  useEffect(() => {
    if (wasCreatingSnapshotRef.current && !isCreatingSnapshot && snapshot) {
      toast.success('Snapshot created', {
        description: 'The selected repository revisions are pinned in the latest mock snapshot.',
      });
    }

    wasCreatingSnapshotRef.current = isCreatingSnapshot;
  }, [isCreatingSnapshot, snapshot]);

  const validatedCodebases = codebases.filter(
    (codebase) => codebase.status === 'validated' && codebase.repository !== undefined,
  );
  const workspaceStatus = isValidating
    ? 'Validating codebases'
    : isCreatingSnapshot
      ? 'Creating snapshot'
      : isValidationStale
        ? 'Configuration update required'
        : isSnapshotStale
          ? 'Snapshot out of date'
          : snapshot
            ? 'Snapshot ready'
            : hasValidation
              ? 'Ready to snapshot'
              : 'Ready to configure';

  function submitValidation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!startValidation()) {
      return;
    }

    toast.info('Codebase validation started', {
      description: `Checking ${codebases.length} ${codebases.length === 1 ? 'codebase' : 'codebases'}. This mock completes in two seconds.`,
    });
  }

  function createSnapshot() {
    if (!startSnapshotCreation()) {
      return;
    }

    toast.info('Snapshot creation started', {
      description: `Pinning the selected revisions for ${codebases.length} ${codebases.length === 1 ? 'codebase' : 'codebases'}. This mock completes in two seconds.`,
    });
  }

  function confirmCodebaseDeletion() {
    if (!codebasePendingDeletion || !deleteCodebase(codebasePendingDeletion.id)) {
      return;
    }

    setCodebasePendingDeletion(undefined);
  }

  const validationButtonLabel = isValidating
    ? 'Validating codebases'
    : hasValidation && isValidationStale
      ? 'Revalidate codebases'
      : hasValidation
        ? 'Codebases validated'
        : 'Validate codebases';
  const snapshotActionHint = !hasValidation
    ? 'Validate the codebase setup before creating a snapshot.'
    : isValidationStale
      ? 'Revalidate the changed codebase setup before creating a snapshot.'
      : 'A snapshot pins every selected branch and commit for later analysis.';

  return (
    <div className={workspaceStyles.page}>
      <ProjectWorkflowNavigation currentSection="codebase" project={project} />

      <PageHeader
        aside={<span aria-live="polite" className={workspaceStyles.statusBadge}>{workspaceStatus}</span>}
        description="Validate repository access, select exact revisions, and create a reproducible code snapshot."
        eyebrow={`${project.name} / Codebase`}
        title="Codebase workspace"
      />

      <div className={styles.workflow}>
        <section className={`${workspaceStyles.card} ${workspaceStyles.wideCard}`}>
          <div className={workspaceStyles.cardHeader}>
            <div>
              <p className={workspaceStyles.kicker}>Step 1</p>
              <h2>Set up codebases</h2>
            </div>
            <span className={workspaceStyles.count}>
              {codebases.length} {codebases.length === 1 ? 'codebase' : 'codebases'}
            </span>
          </div>
          <p className={workspaceStyles.cardDescription}>
            Add each Git repository over HTTPS with an access token, then validate the complete setup. Validated URLs and credentials are locked.
          </p>

          {isValidationStale ? (
            <div className={styles.staleNotice} role="status">
              <WarningIcon />
              <div>
                <strong>Codebase validation is out of date</strong>
                <span>The configured codebases changed. Revalidate them before creating another snapshot.</span>
              </div>
            </div>
          ) : null}

          <form className={styles.setupForm} onSubmit={submitValidation}>
            {codebases.length > 0 ? (
              <ol className={styles.codebaseList}>
                {codebases.map((codebase, index) => {
                  const urlInputId = `codebase-url-${codebase.id}`;
                  const tokenInputId = `codebase-token-${codebase.id}`;
                  const isValidated = codebase.status === 'validated';
                  const tokenLabelId = `codebase-token-label-${codebase.id}`;

                  return (
                    <li className={styles.codebaseCard} key={codebase.id}>
                      <div className={styles.codebaseHeader}>
                        <div className={styles.codebaseTitle}>
                          <CodebaseIcon />
                          <div>
                            <h3>{codebase.repository?.displayName ?? `Codebase ${index + 1}`}</h3>
                            <span>{isValidated ? 'Connection validated' : 'Needs validation'}</span>
                          </div>
                        </div>
                        <div className={styles.codebaseHeaderActions}>
                          <span className={isValidated ? styles.validatedBadge : styles.draftBadge}>
                            {isValidated ? <CheckIcon /> : null}
                            {isValidated ? 'Validated' : 'Draft'}
                          </span>
                          <button
                            aria-label={`Delete ${codebase.repository?.displayName ?? `codebase ${index + 1}`}`}
                            className={styles.deleteButton}
                            disabled={isBusy}
                            onClick={() => setCodebasePendingDeletion(codebase)}
                            title="Delete codebase"
                            type="button"
                          >
                            <TrashIcon />
                          </button>
                        </div>
                      </div>

                      <div className={styles.fields}>
                        <label className={styles.field} htmlFor={urlInputId}>
                          <span>Repository URL</span>
                          <input
                            autoComplete="url"
                            disabled={isBusy && !isValidated}
                            id={urlInputId}
                            inputMode="url"
                            onChange={(event) =>
                              updateDraftCodebase(codebase.id, 'url', event.target.value)
                            }
                            placeholder="https://github.com/example/project.git"
                            readOnly={isValidated}
                            required
                            spellCheck={false}
                            type="url"
                            value={codebase.url}
                          />
                          <small>{isValidated ? 'Locked after validation.' : 'HTTPS Git URL required.'}</small>
                        </label>

                        <div className={styles.field}>
                          <span id={tokenLabelId}>Access token</span>
                          {codebase.credentialConfigured ? (
                            <div
                              aria-label="Access token: credential configured"
                              className={styles.credentialValue}
                              id={tokenInputId}
                            >
                              <CheckIcon />
                              Credential configured
                            </div>
                          ) : (
                            <input
                              autoComplete="off"
                              aria-labelledby={tokenLabelId}
                              disabled={isBusy}
                              id={tokenInputId}
                              onChange={(event) =>
                                updateDraftCodebase(codebase.id, 'token', event.target.value)
                              }
                              placeholder="Enter access token"
                              required
                              spellCheck={false}
                              type="password"
                              value={codebase.token}
                            />
                          )}
                          <small>
                            {codebase.credentialConfigured
                              ? 'The raw token was cleared after validation.'
                              : 'Kept only in this draft until validation completes.'}
                          </small>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ol>
            ) : (
              <div className={workspaceStyles.emptyState}>
                <strong>No codebases configured</strong>
                <span>Add a codebase to enter its repository URL and access token.</span>
              </div>
            )}

            {hasDuplicateUrls ? (
              <p className={styles.formError} role="alert">
                Each codebase must use a unique repository URL.
              </p>
            ) : null}

            <div className={styles.setupActions}>
              <button
                className={styles.secondaryButton}
                disabled={isBusy}
                onClick={addCodebase}
                type="button"
              >
                <PlusIcon />
                Add codebase
              </button>
              <button
                className={styles.primaryButton}
                disabled={!canStartValidation}
                type="submit"
              >
                {validationButtonLabel}
                {isValidating ? <Spinner decorative size={18} strokeWidth={2.2} /> : null}
              </button>
            </div>
          </form>
        </section>

        <section className={`${workspaceStyles.card} ${workspaceStyles.wideCard}`}>
          <div className={workspaceStyles.cardHeader}>
            <div>
              <p className={workspaceStyles.kicker}>Step 2</p>
              <h2>Select revisions</h2>
            </div>
            <span className={workspaceStyles.count}>
              {validatedCodebases.length} available
            </span>
          </div>
          <p className={workspaceStyles.cardDescription}>
            Choose one branch and commit for every validated codebase. The latest commit on the default branch is selected initially.
          </p>

          {hasValidation && validatedCodebases.length > 0 ? (
            <div className={styles.selectionList}>
              {hasUnvalidatedCodebases ? (
                <div className={styles.staleNotice} role="status">
                  <WarningIcon />
                  <div>
                    <strong>New codebases are waiting for validation</strong>
                    <span>Existing selections remain visible, but the full setup must be revalidated before snapshot creation.</span>
                  </div>
                </div>
              ) : null}

              {validatedCodebases.map((codebase) => {
                const branch = codebase.repository?.branches.find(
                  (candidate) => candidate.name === codebase.selectedBranch,
                );
                const commit = selectedCommit(codebase);
                const branchSelectId = `codebase-branch-${codebase.id}`;
                const commitSelectId = `codebase-commit-${codebase.id}`;

                return (
                  <article className={styles.selectionCard} key={codebase.id}>
                    <div className={styles.selectionHeader}>
                      <div>
                        <h3>{codebase.repository?.displayName}</h3>
                        <span>{codebase.url}</span>
                      </div>
                      <span className={styles.defaultBranch}>
                        Default: {codebase.repository?.defaultBranch}
                      </span>
                    </div>
                    <div className={styles.selectionFields}>
                      <label className={styles.field} htmlFor={branchSelectId}>
                        <span>Branch</span>
                        <select
                          disabled={isBusy}
                          id={branchSelectId}
                          onChange={(event) => selectBranch(codebase.id, event.target.value)}
                          value={codebase.selectedBranch}
                        >
                          {codebase.repository?.branches.map((candidate) => (
                            <option key={candidate.name} value={candidate.name}>
                              {candidate.name}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className={styles.field} htmlFor={commitSelectId}>
                        <span>Commit</span>
                        <select
                          disabled={isBusy}
                          id={commitSelectId}
                          onChange={(event) => selectCommit(codebase.id, event.target.value)}
                          value={codebase.selectedCommit}
                        >
                          {branch?.commits.map((candidate) => (
                            <option key={candidate.sha} value={candidate.sha}>
                              {candidate.sha} · {candidate.message}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                    {commit ? (
                      <p className={styles.commitMetadata}>
                        <code>{commit.sha}</code>
                        <span>{commit.message}</span>
                        <time dateTime={commit.authoredAt}>{formatTimestamp(commit.authoredAt)}</time>
                      </p>
                    ) : null}
                  </article>
                );
              })}
            </div>
          ) : (
            <div className={workspaceStyles.emptyState}>
              <strong>No validated codebases</strong>
              <span>Complete and validate the setup to load mocked branches and commits.</span>
            </div>
          )}
        </section>

        <section className={`${workspaceStyles.card} ${workspaceStyles.wideCard}`}>
          <div className={workspaceStyles.cardHeader}>
            <div>
              <p className={workspaceStyles.kicker}>Step 3</p>
              <h2>Create snapshot</h2>
            </div>
            <span className={workspaceStyles.count}>{snapshot ? 'Created' : 'Not created'}</span>
          </div>
          <p className={workspaceStyles.cardDescription}>
            Pin the selected revisions as one reproducible input for indexing and later validation.
          </p>

          {isSnapshotStale ? (
            <div className={styles.staleNotice} role="status">
              <WarningIcon />
              <div>
                <strong>Snapshot is out of date</strong>
                <span>The codebase configuration or selected revisions changed after this snapshot was created.</span>
              </div>
            </div>
          ) : null}

          {snapshot ? (
            <div className={styles.snapshotResult}>
              <div className={styles.snapshotHeader}>
                <div>
                  <span>Latest mock snapshot</span>
                  <strong>{snapshot.id.slice(0, 8)}</strong>
                </div>
                <time dateTime={snapshot.createdAt}>{formatTimestamp(snapshot.createdAt)}</time>
              </div>
              <ul className={styles.snapshotSelections}>
                {snapshot.selections.map((selection) => (
                  <li key={selection.codebaseId}>
                    <div>
                      <strong>{selection.repositoryName}</strong>
                      <span>{selection.repositoryUrl}</span>
                    </div>
                    <span>{selection.branch}</span>
                    <code>{selection.commit}</code>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className={workspaceStyles.emptyState}>
              <strong>No snapshot yet</strong>
              <span>Validate the setup and confirm each branch and commit selection.</span>
            </div>
          )}

          <div className={styles.snapshotActions}>
            <p>{snapshotActionHint}</p>
            <button
              className={styles.primaryButton}
              disabled={!canCreateSnapshot}
              onClick={createSnapshot}
              type="button"
            >
              {isCreatingSnapshot ? 'Creating snapshot' : 'Create snapshot'}
              {isCreatingSnapshot ? <Spinner decorative size={18} strokeWidth={2.2} /> : null}
            </button>
          </div>
        </section>
      </div>

      <Modal
        className={styles.deleteModal}
        description={
          codebasePendingDeletion
            ? `Remove “${codebasePendingDeletion.repository?.displayName ?? (codebasePendingDeletion.url || 'this codebase')}” from the project?`
            : undefined
        }
        footer={
          <>
            <button
              className={styles.modalCancelButton}
              data-autofocus="true"
              onClick={() => setCodebasePendingDeletion(undefined)}
              type="button"
            >
              Cancel
            </button>
            <button
              className={styles.modalDeleteButton}
              disabled={isBusy}
              onClick={confirmCodebaseDeletion}
              type="button"
            >
              <TrashIcon />
              Delete codebase
            </button>
          </>
        }
        icon={<TrashIcon />}
        isOpen={codebasePendingDeletion !== undefined}
        onClose={() => setCodebasePendingDeletion(undefined)}
        title="Delete codebase?"
      >
        <p className={styles.deleteModalMessage}>
          Deleting a codebase makes the current validation and any existing snapshot out of date. This mock action cannot be undone.
        </p>
      </Modal>
    </div>
  );
}
