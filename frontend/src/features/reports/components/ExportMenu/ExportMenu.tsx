import { Dropdown } from '../../../../components/forms/Dropdown/Dropdown';
import { DownloadIcon } from '../../../../components/icons/Icons';
import type { ReportExportFormat } from '../../model/report';
import styles from './ExportMenu.module.css';

interface ExportMenuProps {
  readonly disabled?: boolean;
  readonly onSelect: (format: ReportExportFormat) => void;
}

const exportOptions: readonly {
  readonly description: string;
  readonly extension: string;
  readonly label: string;
  readonly value: ReportExportFormat;
}[] = [
  {
    value: 'pdf',
    label: 'PDF document',
    extension: '.pdf',
    description: 'Print-ready layout',
  },
  {
    value: 'html',
    label: 'HTML page',
    extension: '.html',
    description: 'Standalone web document',
  },
  {
    value: 'markdown',
    label: 'Markdown',
    extension: '.md',
    description: 'Portable plain text',
  },
];

export function ExportMenu({ disabled = false, onSelect }: ExportMenuProps) {
  return (
    <Dropdown
      align="end"
      aria-label="Export formats"
      className={styles.container}
      disabled={disabled}
      mode="menu"
      onAction={onSelect}
      options={exportOptions.map((option) => ({
        description: option.description,
        endContent: <span className={styles.extension}>{option.extension}</span>,
        label: option.label,
        value: option.value,
      }))}
      trigger={(
        <>
          <DownloadIcon />
          <span>Export</span>
        </>
      )}
      variant="accent"
    />
  );
}
