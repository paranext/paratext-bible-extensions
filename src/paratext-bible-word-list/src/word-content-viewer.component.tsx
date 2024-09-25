import { useState, useEffect } from 'react';
import { Canon } from '@sillsdev/scripture';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from 'platform-bible-react';
import type { WordListEntry } from 'paratext-bible-word-list';

type WordData = {
  reference: string;
  text: string;
};

function generateTableData(selectedWord: WordListEntry) {
  const bookName: string = Canon.bookIdToEnglishName(
    Canon.bookNumberToId(selectedWord.scrRefs[0].bookNum),
  );

  const newWordData: WordData[] = [];
  for (let id = 0; id < selectedWord.scrRefs.length; id++) {
    const { chapterNum } = selectedWord.scrRefs[id];
    const { verseNum } = selectedWord.scrRefs[id];
    const fullReference: string = `${bookName} ${chapterNum}:${verseNum}`;
    newWordData.push({ reference: fullReference, text: selectedWord.scriptureSnippets[id] });
  }

  return newWordData;
}

export default function WordContentViewer({ selectedWord }: { selectedWord: WordListEntry }) {
  const [wordData, setWordData] = useState<WordData[]>([]);

  useEffect(() => {
    setWordData([]);

    setWordData(generateTableData(selectedWord));
  }, [selectedWord]);

  return (
    <Table stickyHeader>
      <TableHeader stickyHeader>
        <TableRow>
          <TableHead>Reference</TableHead>
          <TableHead>Text</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {wordData.map((result) => (
          <TableRow>
            <TableCell>{result.reference}</TableCell>
            <TableCell>{result.text}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
