import { useMemo } from 'react';
import { Button, ColumnDef, DataTable, RowContents, SortDirection } from 'platform-bible-react';
import type { WordListEntry } from 'paratext-bible-word-list';

type WordData = {
  word: string;
  count: number;
};

type WordTableProps = {
  wordList: WordListEntry[];
  fullWordCount: number;
  onWordClick: (word: string) => void;
};

const getSortingIcon = (sortDirection: false | SortDirection): string => {
  if (sortDirection === 'asc') {
    return '↑';
  }
  if (sortDirection === 'desc') {
    return '↓';
  }
  return '↕';
};

const columns = (wordColumnTitle: string): ColumnDef<WordData>[] => [
  {
    accessorKey: 'word',
    header: ({ column }) => {
      return (
        <Button onClick={() => column.toggleSorting(undefined)}>
          {`${wordColumnTitle} ${getSortingIcon(column.getIsSorted())}`}
        </Button>
      );
    },
  },
  {
    accessorKey: 'count',
    header: ({ column }) => {
      return (
        <Button onClick={() => column.toggleSorting(undefined)}>
          {`Count ${getSortingIcon(column.getIsSorted())}`}
        </Button>
      );
    },
  },
];

export default function WordTable({ wordList, fullWordCount, onWordClick }: WordTableProps) {
  const wordData = useMemo(() => {
    const newWordData: WordData[] = [];
    wordList.forEach((word) => {
      newWordData.push({ word: word.word, count: word.scrRefs.length });
    });
    return newWordData;
  }, [wordList]);

  const onCellClick = (row: RowContents<WordData>): void => {
    onWordClick(row.getValue('word'));
  };

  const wordColumnTitle = useMemo(() => {
    return wordList.length === fullWordCount
      ? `Words (${fullWordCount})`
      : `Words (${wordList.length} of ${fullWordCount})`;
  }, [fullWordCount, wordList.length]);

  return (
    <DataTable
      stickyHeader
      columns={columns(wordColumnTitle)}
      data={wordData}
      onRowClickHandler={onCellClick}
    />
  );
}
