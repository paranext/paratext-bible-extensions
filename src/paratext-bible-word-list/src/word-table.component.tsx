import { useMemo } from 'react';
import { Button, ColumnDef, DataTable, RowContents, SortDirection } from 'platform-bible-react';
import type { WordListEntry } from 'paratext-bible-word-list';
import { useLocalizedStrings } from '@papi/frontend/react';
import { formatReplacementString } from 'platform-bible-utils';

type WordData = {
  word: string;
  count: number;
};

type WordTableProps = {
  wordList: WordListEntry[];
  fullWordCount: number;
  onWordClick: (word: string) => void;
};

const countFormatKey = '%wordList_wordCount_format%';
const fullCountFormatKey = '%wordList_totalCount_titleFormat%';
const partialCountFormatKey = '%wordList_partialWordCount_titleFormat%';

const getSortingIcon = (sortDirection: false | SortDirection): string => {
  if (sortDirection === 'asc') {
    return '↑';
  }
  if (sortDirection === 'desc') {
    return '↓';
  }
  return '↕';
};

const columns = (
  wordColumnTitleFormat: string,
  localizedCountFormat: string,
): ColumnDef<WordData>[] => [
  {
    accessorKey: 'word',
    header: ({ column }) => {
      return (
        <Button variant="ghost" onClick={() => column.toggleSorting(undefined)}>
          {`${formatReplacementString(wordColumnTitleFormat, { sortingDirectionIcon: getSortingIcon(column.getIsSorted()) })}`}
        </Button>
      );
    },
  },
  {
    accessorKey: 'count',
    header: ({ column }) => {
      return (
        <Button variant="ghost" onClick={() => column.toggleSorting(undefined)}>
          {`${formatReplacementString(localizedCountFormat, { sortingDirectionIcon: getSortingIcon(column.getIsSorted()) })}`}
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

  const [localizedStrings] = useLocalizedStrings(
    useMemo(() => [countFormatKey, fullCountFormatKey], []),
  );

  const localizedCountFormat = localizedStrings[countFormatKey];
  const localizedFullCountFormat = localizedStrings[fullCountFormatKey];
  const localizedPartialCountFormat = localizedStrings[partialCountFormatKey];

  const wordColumnTitleFormat = useMemo(() => {
    return wordList.length === fullWordCount
      ? formatReplacementString(localizedFullCountFormat, { fullWordCount })
      : formatReplacementString(localizedPartialCountFormat, {
          wordListLength: wordList.length,
          fullWordCount,
          sortingDirectionIcon: '{sortingDirectionIcon}',
        });
  }, [fullWordCount, localizedFullCountFormat, localizedPartialCountFormat, wordList.length]);

  return (
    <DataTable
      stickyHeader
      columns={columns(wordColumnTitleFormat, localizedCountFormat)}
      data={wordData}
      onRowClickHandler={onCellClick}
    />
  );
}
