import { useCallback, useEffect, useMemo, useState } from 'react';
import { Table, TableCellClickArgs, TableSortColumn } from 'papi-components';
import type { WordListEntry } from 'paranext-extension-word-list';

type Row = {
  word: string;
  count: number;
};

const defaultSortColumns: TableSortColumn[] = [{ columnKey: 'word', direction: 'ASC' }];

type WordTableProps = {
  wordList: WordListEntry[];
  fullWordCount: number;
  onWordClick: (word: string) => void;
};

export default function WordTable({ wordList, fullWordCount, onWordClick }: WordTableProps) {
  const [sortColumns, setSortColumns] = useState<TableSortColumn[]>(defaultSortColumns);
  const onSortColumnsChange = useCallback((changedSortColumns: TableSortColumn[]) => {
    setSortColumns(changedSortColumns.slice(-1));
  }, []);

  const rows = useMemo(() => {
    const newRows: Row[] = [];
    wordList.forEach((word) => {
      newRows.push({ word: word.word, count: word.scrRefs.length });
    });
    return newRows;
  }, [wordList]);

  const sortedRows = useMemo((): readonly Row[] => {
    if (sortColumns.length === 0) return rows;
    const { columnKey, direction } = sortColumns[0];

    let sortedRowsLocal: Row[] = [...rows];

    switch (columnKey) {
      case 'word':
        sortedRowsLocal = sortedRowsLocal.sort((a, b) => a[columnKey].localeCompare(b[columnKey]));
        break;
      case 'count':
        sortedRowsLocal = sortedRowsLocal.sort((a, b) => a[columnKey] - b[columnKey]);
        break;
      default:
    }
    return direction === 'DESC' ? sortedRowsLocal.reverse() : sortedRowsLocal;
  }, [rows, sortColumns]);

  useEffect(() => {
    if (sortColumns.length === 0) {
      setSortColumns(defaultSortColumns);
    }
  }, [sortColumns]);

  const onCellClick = (args: TableCellClickArgs<Row>) => {
    onWordClick(args.row.word);
  };

  const wordColumnTitle = useMemo(() => {
    return wordList.length === fullWordCount
      ? `Words (${fullWordCount})`
      : `Words (${wordList.length} of ${fullWordCount})`;
  }, [fullWordCount, wordList.length]);

  return (
    <Table<Row>
      columns={[
        {
          key: 'word',
          name: wordColumnTitle,
        },
        {
          key: 'count',
          name: 'Count',
        },
      ]}
      rows={sortedRows}
      rowKeyGetter={(row: Row) => {
        return row.word;
      }}
      sortColumns={sortColumns}
      onSortColumnsChange={onSortColumnsChange}
      rowHeight={30}
      headerRowHeight={50}
      onCellClick={onCellClick}
    />
  );
}
