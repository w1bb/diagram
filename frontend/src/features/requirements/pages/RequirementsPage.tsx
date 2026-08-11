import { useEffect, useMemo, useState } from 'react';

import { Spinner } from '../../../components/feedback/Spinner/Spinner';
import { toast } from '../../../components/feedback/Toast/toastStore';
import { FileDropzone } from '../../../components/forms/FileDropzone/FileDropzone';
import { SearchInput } from '../../../components/forms/SearchInput/SearchInput';
import { DownloadIcon, TrashIcon } from '../../../components/icons/Icons';
import { Modal } from '../../../components/overlay/Modal/Modal';
import { PageHeader } from '../../../components/page/PageHeader/PageHeader';
import { ProjectWorkflowNavigation } from '../../projects/components/ProjectWorkflowNavigation/ProjectWorkflowNavigation';
import type { ProjectSummary } from '../../projects/model/project';
import styles from '../../shared/ProjectWorkspacePage.module.css';
import { RequirementAccordion } from '../components/RequirementAccordion/RequirementAccordion';
import {
  useRequirementsWorkspace,
  type RequirementSourceDocument,
} from '../hooks/useRequirementsWorkspace';
import { requirementMatchesSearch } from '../model/requirement';
import pageStyles from './RequirementsPage.module.css';

const requirementSourceAccept = '.pdf,.doc,.docx,.xls,.xlsx,.md,.markdown,.txt,.json';

function formatFileSize(size: number): string {
  if (size < 1024) {
    return `${size} B`;
  }

  const units = ['KB', 'MB', 'GB'] as const;
  let value = size / 1024;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return `${new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 }).format(value)} ${units[unitIndex]}`;
}

interface RequirementsPageProps {
  readonly project: ProjectSummary;
}

export function RequirementsPage({ project }: RequirementsPageProps) {
  const [documentPendingDeletion, setDocumentPendingDeletion] = useState<RequirementSourceDocument | undefined>();
  const [expandedRequirementIds, setExpandedRequirementIds] = useState<ReadonlySet<string>>(() => new Set());
  const [requirementSearch, setRequirementSearch] = useState('');
  const [selectionError, setSelectionError] = useState<string | undefined>();
  const {
    addSourceDocuments,
    canStartProcessing,
    deleteSourceDocument,
    isProcessing,
    isRequirementSetStale,
    requirementSet,
    sourceDocuments,
    startProcessing,
  } = useRequirementsWorkspace(project.id);
  const isUploading = sourceDocuments.some((document) => document.status === 'uploading');

  useEffect(() => {
    setDocumentPendingDeletion(undefined);
    setSelectionError(undefined);
  }, [project.id]);

  useEffect(() => {
    setExpandedRequirementIds(new Set());
    setRequirementSearch('');
  }, [requirementSet?.version]);

  const filteredRequirements = useMemo(
    () => requirementSet?.requirements.filter((requirement) =>
      requirementMatchesSearch(requirement, requirementSearch)) ?? [],
    [requirementSearch, requirementSet],
  );

  function uploadFiles(files: readonly File[]) {
    addSourceDocuments(files);
    setSelectionError(undefined);
  }

  function reportRejectedFiles(files: readonly File[]) {
    const fileLabel = files.length === 1 ? 'file is' : 'files are';
    setSelectionError(
      `${files.length} ${fileLabel} not supported. Choose PDF, Word, spreadsheet, Markdown, text, or JSON files.`,
    );
  }

  function enqueueRequirementsProcessing() {
    if (!startProcessing()) {
      return;
    }

    toast.info('Requirements processing enqueued', {
      description: 'The current source documents have been enqueued for internal processing.',
    });
  }

  function confirmSourceDeletion() {
    if (!documentPendingDeletion || isProcessing) {
      return;
    }

    deleteSourceDocument(documentPendingDeletion);
    setDocumentPendingDeletion(undefined);
  }

  function toggleRequirement(requirementId: string) {
    setExpandedRequirementIds((currentIds) => {
      const nextIds = new Set(currentIds);

      if (nextIds.has(requirementId)) {
        nextIds.delete(requirementId);
      } else {
        nextIds.add(requirementId);
      }

      return nextIds;
    });
  }

  const workspaceStatus = isProcessing
    ? 'Processing requirements'
    : isRequirementSetStale
      ? 'Update required'
      : requirementSet
        ? 'Requirement set ready'
        : isUploading
          ? 'Uploading sources'
          : 'Ready for sources';

  return (
    <div className={styles.page}>
      <ProjectWorkflowNavigation currentSection="requirements" project={project} />

      <PageHeader
        aside={<span className={styles.statusBadge}>{workspaceStatus}</span>}
        description="Upload requirement documents, inspect atomized candidates, and publish a deduplicated requirement set."
        eyebrow={`${project.name} / Requirements`}
        title="Requirements workspace"
      />

      <div className={styles.grid}>
        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <p className={styles.kicker}>Step 1</p>
              <h2>Source documents</h2>
            </div>
            <span className={styles.count}>
              {sourceDocuments.length} {sourceDocuments.length === 1 ? 'file' : 'files'}
            </span>
          </div>
          <p className={styles.cardDescription}>
            Add PDF, Word, spreadsheet, Markdown, text, or JSON sources. Original files and extraction provenance will remain linked.
          </p>
          <div className={pageStyles.sourceControls}>
            <FileDropzone
              accept={requirementSourceAccept}
              buttonLabel="Browse files"
              description="PDF, Word, spreadsheet, Markdown, text, or JSON. Upload starts immediately and completes after two seconds in this simulation."
              heading="Drop requirement files here"
              multiple
              onFilesRejected={reportRejectedFiles}
              onFilesSelected={uploadFiles}
            />

            {selectionError ? (
              <p className={pageStyles.selectionError} role="alert">{selectionError}</p>
            ) : null}

            {sourceDocuments.length > 0 ? (
              <div aria-live="polite" className={pageStyles.fileList}>
                <div className={pageStyles.fileListHeader}>
                  <div>
                    <strong>Source documents</strong>
                    <span>Completed files can be downloaded or deleted.</span>
                  </div>
                </div>
                <ul className={pageStyles.selectedFiles}>
                  {sourceDocuments.map((document) => (
                    <li key={document.id}>
                      <div className={pageStyles.fileMetadata}>
                        <span className={pageStyles.fileName}>{document.file.name}</span>
                        <span className={pageStyles.fileSize}>{formatFileSize(document.file.size)}</span>
                      </div>
                      {document.status === 'uploading' ? (
                        <span className={pageStyles.uploadStatus} role="status">
                          <Spinner decorative size={18} strokeWidth={2.2} />
                          Uploading
                        </span>
                      ) : (
                        <div className={pageStyles.fileActions}>
                          <a
                            aria-label={`Download ${document.file.name}`}
                            className={pageStyles.downloadButton}
                            download={document.file.name}
                            href={document.downloadUrl}
                          >
                            <DownloadIcon />
                            Download
                          </a>
                          <button
                            aria-label={`Delete ${document.file.name}`}
                            className={pageStyles.deleteButton}
                            disabled={isProcessing}
                            onClick={() => setDocumentPendingDeletion(document)}
                            title={isProcessing ? 'Deletion is available after requirements processing completes.' : undefined}
                            type="button"
                          >
                            <TrashIcon />
                            Delete
                          </button>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {sourceDocuments.length > 0 ? (
              <div className={pageStyles.processingControls}>
                <button
                  className={pageStyles.processButton}
                  disabled={!canStartProcessing}
                  onClick={enqueueRequirementsProcessing}
                  type="button"
                >
                  {isUploading ? (
                    <>
                      Start requirements processing
                      <Spinner decorative size={18} strokeWidth={2.2} />
                    </>
                  ) : isProcessing ? (
                    <>
                      Processing requirements
                      <Spinner decorative size={18} strokeWidth={2.2} />
                    </>
                  ) : (
                    'Start requirements processing'
                  )}
                </button>
              </div>
            ) : null}
          </div>
        </section>

        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <p className={styles.kicker}>Step 2</p>
              <h2>Requirement set</h2>
            </div>
            <span className={styles.count}>
              {requirementSet ? `${requirementSet.requirements.length} detected` : isProcessing ? 'Processing' : 'Not generated'}
            </span>
          </div>
          <p className={styles.cardDescription}>
            Extraction, atomization, embedding, and deduplication runs converge into a versioned active set.
          </p>

          {isRequirementSetStale ? (
            <div className={pageStyles.staleNotice} role="status">
              <strong>Requirement set is out of date</strong>
              <span>Source documents changed after this set was generated. Start requirements processing again to refresh it.</span>
            </div>
          ) : null}

          {isProcessing && requirementSet ? (
            <div className={pageStyles.refreshNotice} role="status">
              <Spinner decorative size={18} strokeWidth={2.2} />
              Refreshing the requirement set from the current source documents.
            </div>
          ) : null}

          {requirementSet ? (
            <div className={pageStyles.requirementResults}>
              <div className={pageStyles.requirementToolbar}>
                <SearchInput
                  aria-label="Search detected requirements"
                  className={pageStyles.requirementSearch}
                  onChange={(event) => setRequirementSearch(event.target.value)}
                  onClear={() => setRequirementSearch('')}
                  placeholder="Search requirements"
                  value={requirementSearch}
                />
                <span aria-live="polite" className={pageStyles.searchResultCount}>
                  {filteredRequirements.length} of {requirementSet.requirements.length}
                </span>
              </div>

              {filteredRequirements.length > 0 ? (
                <ol aria-label={`Requirement set version ${requirementSet.version}`} className={pageStyles.requirementList}>
                  {filteredRequirements.map((requirement) => (
                    <RequirementAccordion
                      index={requirementSet.requirements.findIndex((candidate) => candidate.id === requirement.id)}
                      isExpanded={expandedRequirementIds.has(requirement.id)}
                      key={requirement.id}
                      onToggle={() => toggleRequirement(requirement.id)}
                      requirement={requirement}
                    />
                  ))}
                </ol>
              ) : (
                <div className={pageStyles.noSearchResults}>
                  <strong>No requirements found</strong>
                  <span>Try a label, type, priority, source, raw statement, or duplicate candidate.</span>
                </div>
              )}
            </div>
          ) : isProcessing ? (
            <div className={pageStyles.processingState} role="status">
              <Spinner decorative size={28} strokeWidth={3} />
              <strong>Processing source documents</strong>
              <span>Extracting, atomizing, and deduplicating detected requirements.</span>
            </div>
          ) : (
            <div className={styles.emptyState}>
              <strong>No requirement set yet</strong>
              <span>Upload source documents and start requirements processing to generate a detected set.</span>
            </div>
          )}
        </section>
      </div>

      <Modal
        className={pageStyles.deleteModal}
        description={
          documentPendingDeletion
            ? `Remove “${documentPendingDeletion.file.name}” from this project's source documents?`
            : undefined
        }
        footer={
          <>
            <button
              className={pageStyles.modalCancelButton}
              data-autofocus="true"
              onClick={() => setDocumentPendingDeletion(undefined)}
              type="button"
            >
              Cancel
            </button>
            <button
              className={pageStyles.modalDeleteButton}
              disabled={isProcessing}
              onClick={confirmSourceDeletion}
              type="button"
            >
              <TrashIcon />
              Delete file
            </button>
          </>
        }
        icon={<TrashIcon />}
        isOpen={documentPendingDeletion !== undefined}
        onClose={() => setDocumentPendingDeletion(undefined)}
        title="Delete source document?"
      >
        <p className={pageStyles.deleteModalMessage}>
          This action cannot be undone. Any existing requirement set will be marked out of date.
        </p>
      </Modal>
    </div>
  );
}
