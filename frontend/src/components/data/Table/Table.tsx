import {
  useMemo,
  useState,
  type CSSProperties,
  type Key,
  type ReactNode,
} from 'react';

import { CaretIcon } from '../../icons/Icons';
import styles from './Table.module.css';

export type TableSortDirection = 'ascending' | 'descending';
export type TableSortValue = number | string | null | undefined;

export interface TableSortDescriptor<ColumnId extends string = string> {
  readonly columnId: ColumnId;
  readonly direction: TableSortDirection;
}

export interface TableColumn<Row, ColumnId extends string = string> {
  readonly align?: 'center' | 'end' | 'start';
  readonly cellClassName?: string | ((row: Row) => string | undefined) | undefined;
  readonly header: ReactNode;
  readonly id: ColumnId;
  readonly renderCell: (row: Row) => ReactNode;
  readonly sortLabel?: string;
  readonly sortValue?: (row: Row) => TableSortValue;
  readonly width?: CSSProperties['width'];
}

export interface TableProps<Row, ColumnId extends string = string> {
  readonly caption: ReactNode;
  readonly columns: readonly TableColumn<Row, ColumnId>[];
  readonly defaultSort?: TableSortDescriptor<ColumnId>;
  readonly emptyContent?: ReactNode;
  readonly getRowKey: (row: Row) => Key;
  readonly isRowSelected?: (row: Row) => boolean;
  readonly maxHeight?: CSSProperties['maxHeight'];
  readonly minWidth?: CSSProperties['minWidth'];
  readonly rows: readonly Row[];
}

function compareSortValues(left: TableSortValue, right: TableSortValue): number {
  if (left === right) {
    return 0;
  }

  if (left === null || left === undefined) {
    return 1;
  }

  if (right === null || right === undefined) {
    return -1;
  }

  if (typeof left === 'number' && typeof right === 'number') {
    return left - right;
  }

  return String(left).localeCompare(String(right), undefined, {
    numeric: true,
    sensitivity: 'base',
  });
}

function resolveCellClassName<Row>(
  className: TableColumn<Row>['cellClassName'],
  row: Row,
): string | undefined {
  return typeof className === 'function' ? className(row) : className;
}

function getColumnSortLabel<Row, ColumnId extends string>(
  column: TableColumn<Row, ColumnId>,
): string {
  if (column.sortLabel) {
    return column.sortLabel;
  }

  return typeof column.header === 'string' ? column.header : 'column';
}

export function Table<Row, ColumnId extends string = string>({
  caption,
  columns,
  defaultSort,
  emptyContent = 'No rows available.',
  getRowKey,
  isRowSelected,
  maxHeight = 'min(680px, calc(100vh - 120px))',
  minWidth = 1_250,
  rows,
}: TableProps<Row, ColumnId>) {
  const [sortDescriptor, setSortDescriptor] = useState<
    TableSortDescriptor<ColumnId> | undefined
  >(defaultSort);

  const sortedRows = useMemo(() => {
    if (!sortDescriptor) {
      return rows;
    }

    const column = columns.find(
      (candidate) => candidate.id === sortDescriptor.columnId,
    );

    if (!column?.sortValue) {
      return rows;
    }

    const directionMultiplier = sortDescriptor.direction === 'ascending' ? 1 : -1;

    return rows
      .map((row, sourceIndex) => ({ row, sourceIndex }))
      .sort((left, right) => {
        const result = compareSortValues(
          column.sortValue?.(left.row),
          column.sortValue?.(right.row),
        );

        return result === 0
          ? left.sourceIndex - right.sourceIndex
          : result * directionMultiplier;
      })
      .map(({ row }) => row);
  }, [columns, rows, sortDescriptor]);

  function sortBy(column: TableColumn<Row, ColumnId>) {
    if (!column.sortValue) {
      return;
    }

    setSortDescriptor((currentSort) => ({
      columnId: column.id,
      direction:
        currentSort?.columnId === column.id && currentSort.direction === 'ascending'
          ? 'descending'
          : 'ascending',
    }));
  }

  return (
    <div className={styles.scroller} style={{ maxHeight }}>
      <table className={styles.table} style={{ minWidth }}>
        <caption>{caption}</caption>
        <colgroup>
          {columns.map((column) => (
            <col key={column.id} style={{ width: column.width }} />
          ))}
        </colgroup>
        <thead>
          <tr>
            {columns.map((column) => {
              const isActiveSort = sortDescriptor?.columnId === column.id;
              const direction = isActiveSort ? sortDescriptor.direction : undefined;
              const nextDirection = direction === 'ascending' ? 'descending' : 'ascending';
              const alignmentClass = styles[column.align ?? 'start'];

              return (
                <th
                  aria-sort={column.sortValue ? direction ?? 'none' : undefined}
                  className={alignmentClass}
                  key={column.id}
                  scope="col"
                >
                  {column.sortValue ? (
                    <button
                      aria-label={`Sort by ${getColumnSortLabel(column)}, ${nextDirection}`}
                      className={`${styles.sortButton} ${alignmentClass ?? ''}`}
                      onClick={() => sortBy(column)}
                      type="button"
                    >
                      <span>{column.header}</span>
                      <CaretIcon
                        className={`${styles.sortIcon} ${
                          direction === 'ascending'
                            ? styles.sortAscending
                            : direction === 'descending'
                              ? styles.sortDescending
                              : ''
                        }`}
                      />
                    </button>
                  ) : column.header}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {sortedRows.length > 0 ? sortedRows.map((row) => (
            <tr data-selected={isRowSelected?.(row) || undefined} key={getRowKey(row)}>
              {columns.map((column) => (
                <td
                  className={`${styles[column.align ?? 'start'] ?? ''} ${
                    resolveCellClassName(column.cellClassName, row) ?? ''
                  }`}
                  key={column.id}
                >
                  {column.renderCell(row)}
                </td>
              ))}
            </tr>
          )) : (
            <tr>
              <td className={styles.emptyCell} colSpan={columns.length}>
                {emptyContent}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
