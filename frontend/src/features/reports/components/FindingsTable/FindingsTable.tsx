import { useEffect, useState } from 'react';

import { AppLink } from '../../../../app/routing/RouterProvider';
import { projectPath } from '../../../../app/routing/routes';
import { Table, type TableColumn } from '../../../../components/data/Table/Table';
import { SearchInput } from '../../../../components/forms/SearchInput/SearchInput';
import {
  requirementAnchorId,
  requirementTypeLabels,
} from '../../../requirements/model/requirement';
import type {
  FindingSeverity,
  FindingStatus,
  FindingType,
  ReportFinding,
  VerificationReport,
} from '../../model/report';
import {
  formatEvidenceLocation,
  githubEvidenceUrl,
} from '../../utils/evidenceLinks';
import styles from './FindingsTable.module.css';

interface FindingsTableProps {
  readonly disabled: boolean;
  readonly onDiscard: (finding: ReportFinding) => void;
  readonly onEdit: (finding: ReportFinding) => void;
  readonly onSelectionChange: (findingId: string, selected: boolean) => void;
  readonly report: VerificationReport;
  readonly selectedFindingIds: ReadonlySet<string>;
}

const severityLabels: Readonly<Record<FindingSeverity, string>> = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
  info: 'Info',
};

const statusLabels: Readonly<Record<FindingStatus, string>> = {
  open: 'Open',
  accepted: 'Accepted',
  dismissed: 'Dismissed',
  resolved: 'Resolved',
};

const typeLabels: Readonly<Record<FindingType, string>> = {
  requirements_implementation: 'Requirement ↔ implementation',
  requirements_tests: 'Requirement ↔ tests',
  implementation_tests: 'Implementation ↔ tests',
};

const severityClassNames: Readonly<Record<FindingSeverity, string | undefined>> = {
  critical: styles.severityCritical,
  high: styles.severityHigh,
  medium: styles.severityMedium,
  low: styles.severityLow,
  info: styles.severityInfo,
};

const statusClassNames: Readonly<Record<FindingStatus, string | undefined>> = {
  open: styles.statusOpen,
  accepted: styles.statusAccepted,
  dismissed: styles.statusDismissed,
  resolved: styles.statusResolved,
};

const severitySortOrder: Readonly<Record<FindingSeverity, number>> = {
  info: 0,
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

const statusSortOrder: Readonly<Record<FindingStatus, number>> = {
  open: 0,
  accepted: 1,
  resolved: 2,
  dismissed: 3,
};

type FindingColumnId =
  | 'selection'
  | 'severity'
  | 'finding'
  | 'type'
  | 'status'
  | 'requirement'
  | 'requirementTypes'
  | 'evidence'
  | 'actions';

function searchableFindingText(finding: ReportFinding): string {
  return [
    finding.severity,
    severityLabels[finding.severity],
    finding.label,
    finding.description,
    finding.solutionProposal,
    finding.type,
    typeLabels[finding.type],
    finding.status,
    statusLabels[finding.status],
    finding.requirementReference,
    ...finding.requirementTypes.flatMap((type) => [
      type,
      requirementTypeLabels[type],
    ]),
    ...finding.evidenceLocations.flatMap((evidence) => [
      evidence.repositoryUrl,
      evidence.revision,
      evidence.path,
      String(evidence.line),
      String(evidence.column),
      formatEvidenceLocation(evidence),
    ]),
  ].join(' ').toLocaleLowerCase();
}

export function FindingsTable({
  disabled,
  onDiscard,
  onEdit,
  onSelectionChange,
  report,
  selectedFindingIds,
}: FindingsTableProps) {
  const [findingSearch, setFindingSearch] = useState('');
  const normalizedFindingSearch = findingSearch.trim().toLocaleLowerCase();
  const filteredFindings = normalizedFindingSearch
    ? report.findings.filter((finding) =>
        searchableFindingText(finding).includes(normalizedFindingSearch))
    : report.findings;
  const openFindings = report.findings.filter((finding) => finding.status === 'open').length;

  useEffect(() => {
    setFindingSearch('');
  }, [report.id]);

  const columns: readonly TableColumn<ReportFinding, FindingColumnId>[] = [
    {
      align: 'center',
      header: 'Select',
      id: 'selection',
      renderCell: (finding) => {
        const isSelected = selectedFindingIds.has(finding.id);

        return (
          <input
            aria-label={`Select ${finding.requirementReference}: ${finding.label}`}
            checked={isSelected}
            className={styles.checkbox}
            disabled={disabled}
            onChange={(event) =>
              onSelectionChange(finding.id, event.currentTarget.checked)}
            type="checkbox"
          />
        );
      },
      width: 60,
    },
    {
      header: 'Severity',
      id: 'severity',
      renderCell: (finding) => (
        <span className={`${styles.badge} ${severityClassNames[finding.severity] ?? ''}`}>
          <span aria-hidden="true" />
          {severityLabels[finding.severity]}
        </span>
      ),
      sortValue: (finding) => severitySortOrder[finding.severity],
      width: 112,
    },
    {
      cellClassName: styles.findingCell,
      header: 'Finding',
      id: 'finding',
      renderCell: (finding) => (
        <>
          <strong>{finding.label}</strong>
          <span>{finding.description}</span>
          <small><b>Proposed:</b> {finding.solutionProposal}</small>
        </>
      ),
      sortValue: (finding) => finding.label,
      width: 330,
    },
    {
      cellClassName: styles.typeCell,
      header: 'Verification check',
      id: 'type',
      renderCell: (finding) => typeLabels[finding.type],
      sortValue: (finding) => typeLabels[finding.type],
      width: 160,
    },
    {
      header: 'Status',
      id: 'status',
      renderCell: (finding) => (
        <span className={`${styles.badge} ${statusClassNames[finding.status] ?? ''}`}>
          <span aria-hidden="true" />
          {statusLabels[finding.status]}
        </span>
      ),
      sortValue: (finding) => statusSortOrder[finding.status],
      width: 112,
    },
    {
      header: 'Requirement',
      id: 'requirement',
      renderCell: (finding) => (
        <AppLink
          className={styles.requirementLink}
          to={`${projectPath(report.projectId, 'requirements')}#${requirementAnchorId(finding.requirementReference)}`}
        >
          <code>{finding.requirementReference}</code>
        </AppLink>
      ),
      sortValue: (finding) => finding.requirementReference,
      width: 150,
    },
    {
      cellClassName: styles.requirementTypesCell,
      header: 'Types',
      id: 'requirementTypes',
      renderCell: (finding) => (
        <ul aria-label={`Requirement types for ${finding.requirementReference}`}>
          {finding.requirementTypes.map((type) => (
            <li key={type}>{requirementTypeLabels[type]}</li>
          ))}
        </ul>
      ),
      width: 190,
    },
    {
      cellClassName: styles.evidenceCell,
      header: 'Evidence',
      id: 'evidence',
      renderCell: (finding) => (
        <ul aria-label={`Evidence for ${finding.requirementReference}`}>
          {finding.evidenceLocations.map((evidence) => {
            const href = githubEvidenceUrl(evidence);
            const location = formatEvidenceLocation(evidence);

            return (
              <li key={`${evidence.repositoryUrl}:${evidence.revision}:${location}`}>
                {href ? (
                  <a
                    aria-label={`Open ${evidence.path}, line ${evidence.line}, column ${evidence.column} on GitHub in a new tab`}
                    className={styles.evidenceLink}
                    href={href}
                    rel="noopener noreferrer"
                    target="_blank"
                    title={`${location} · ${evidence.revision}`}
                  >
                    <code>{location}</code>
                  </a>
                ) : <code>{location}</code>}
              </li>
            );
          })}
        </ul>
      ),
      width: 260,
    },
    {
      header: 'Actions',
      id: 'actions',
      renderCell: (finding) => (
        <div className={styles.actions}>
          <button
            className={styles.editAction}
            disabled={disabled}
            onClick={() => onEdit(finding)}
            type="button"
          >
            Edit
          </button>
          <button
            className={styles.discardAction}
            disabled={disabled || finding.status === 'dismissed'}
            onClick={() => onDiscard(finding)}
            title={finding.status === 'dismissed' ? 'Finding is already discarded' : undefined}
            type="button"
          >
            Discard
          </button>
        </div>
      ),
      width: 150,
    },
  ];

  return (
    <section className={styles.section}>
      <div className={styles.heading}>
        <div>
          <p>Detailed results</p>
          <h2>Findings</h2>
          <span>Evidence, traceability, and current disposition for this report.</span>
        </div>
        <div className={styles.headingCounts}>
          <span>{report.findings.length} total</span>
          <span>{openFindings} open</span>
        </div>
      </div>

      <div className={styles.searchToolbar}>
        <SearchInput
          aria-label={`Search findings in ${report.title}`}
          autoComplete="off"
          className={styles.searchInput}
          onChange={(event) => setFindingSearch(event.target.value)}
          onClear={() => setFindingSearch('')}
          placeholder="Search findings"
          value={findingSearch}
        />
        <span aria-live="polite" className={styles.searchResultCount}>
          {filteredFindings.length} of {report.findings.length} findings
        </span>
      </div>

      <Table
        caption={`Findings in ${report.title}`}
        columns={columns}
        emptyContent={normalizedFindingSearch ? (
          <div className={styles.emptyResults}>
            <strong>No findings found</strong>
            <span>Try any finding detail, severity, status, requirement type, reference, or evidence location.</span>
          </div>
        ) : 'No findings are available for this report.'}
        getRowKey={(finding) => finding.id}
        isRowSelected={(finding) => selectedFindingIds.has(finding.id)}
        maxHeight="none"
        minWidth={1_520}
        rows={filteredFindings}
      />
    </section>
  );
}
