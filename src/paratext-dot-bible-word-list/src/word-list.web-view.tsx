import { useSetting, useData } from '@papi/frontend/react';
import { WebViewProps } from '@papi/core';
import { ChangeEvent, useEffect, useMemo, useState } from 'react';
import { ComboBox, RefSelector, ScriptureReference, Switch, TextField } from 'papi-components';
import type { WordListEntry } from 'paranext-extension-word-list';
import WordContentViewer from './word-content-viewer.component';
import WordTable from './word-table.component';
import WordCloud from './word-cloud.component';

const defaultScrRef: ScriptureReference = {
  bookNum: 1,
  chapterNum: 1,
  verseNum: 1,
};

// TODO Import from types file
enum Scope {
  Book = 'Book',
  Chapter = 'Chapter',
  Verse = 'Verse',
}

type DataSelectorType = {
  projectId: string;
  scope: Scope;
  scrRef: ScriptureReference;
};

const defaultDataSelector: DataSelectorType = {
  projectId: '',
  scope: Scope.Book,
  scrRef: defaultScrRef,
};

function newDataNeeded(
  dataSelector: DataSelectorType,
  projectId: string,
  scope: Scope,
  scrRef: ScriptureReference,
): boolean {
  if (dataSelector.projectId !== projectId) return true;
  if (dataSelector.scope !== scope) return true;
  if (
    (scope === Scope.Book && scrRef.bookNum !== dataSelector.scrRef.bookNum) ||
    (scope === Scope.Chapter &&
      (scrRef.bookNum !== dataSelector.scrRef.bookNum ||
        scrRef.chapterNum !== dataSelector.scrRef.chapterNum)) ||
    (scope === Scope.Verse &&
      (scrRef.bookNum !== dataSelector.scrRef.bookNum ||
        scrRef.chapterNum !== dataSelector.scrRef.chapterNum ||
        scrRef.verseNum !== dataSelector.scrRef.verseNum))
  ) {
    return true;
  }
  return false;
}

globalThis.webViewComponent = function WordListWebView({ useWebViewState }: WebViewProps) {
  const [scrRef, setScrRef] = useSetting('platform.verseRef', defaultScrRef);
  const [scope, setScope] = useWebViewState<Scope>('scope', Scope.Book);
  const [wordFilter, setWordFilter] = useState<string>('');
  const [projectId] = useWebViewState<string>('projectId', '');
  const [selectedWord, setSelectedWord] = useState<WordListEntry>();
  const [showWordCloud, setShowWordCloud] = useWebViewState<boolean>('wordcloud', false);
  const [loading, setLoading] = useState<boolean>(false);
  const [dataSelector, setDataSelector] = useState<DataSelectorType>(defaultDataSelector);

  const [wordList] = useData('wordList').WordList(
    useMemo(() => {
      return {
        projectId: dataSelector.projectId,
        scope: dataSelector.scope,
        scrRef: dataSelector.scrRef,
      };
    }, [dataSelector]),
    [],
  );

  useEffect(() => {
    if (newDataNeeded(dataSelector, projectId, scope, scrRef)) {
      setLoading(true);
      setSelectedWord(undefined);
      setDataSelector({
        projectId,
        scope,
        scrRef,
      });
    }
  }, [dataSelector, projectId, scope, scrRef]);

  useEffect(() => {
    if (wordList && wordList.length > 0) {
      setLoading(false);
    }
  }, [wordList]);

  const shownWordList: WordListEntry[] = useMemo((): WordListEntry[] => {
    setSelectedWord(undefined);
    if (!wordList) return [];
    if (wordFilter === '') {
      return wordList;
    }
    return wordList.filter((entry) => entry.word.toLowerCase().includes(wordFilter.toLowerCase()));
  }, [wordList, wordFilter]);

  function findSelectedWordEntry(word: string) {
    const clickedEntry = shownWordList.find((entry) => entry.word === word);
    if (clickedEntry) setSelectedWord(clickedEntry);
  }

  function onChangeWordFilter(event: ChangeEvent<HTMLInputElement>) {
    setWordFilter(event.target.value);
  }

  return (
    <div className="word-list">
      <RefSelector
        scrRef={scrRef}
        handleSubmit={(newScrRef) => {
          setScrRef(newScrRef);
        }}
      />
      <div className="filters">
        <ComboBox
          title="Scope"
          value={scope}
          onChange={(_event, value) => setScope(value as Scope)}
          options={Object.values(Scope)}
          isClearable={false}
          width={150}
        />
        <TextField
          label="Word filter"
          value={wordFilter}
          onChange={(event) => onChangeWordFilter(event)}
          isFullWidth
        />
        <Switch
          isChecked={showWordCloud}
          onChange={() => {
            setShowWordCloud(!showWordCloud);
            setSelectedWord(undefined);
          }}
        />
        <p>{showWordCloud ? 'Cloud' : 'Table'} view</p>
      </div>
      {loading && <p>Generating word list</p>}
      {!loading &&
        wordList &&
        (showWordCloud ? (
          <WordCloud wordList={shownWordList} />
        ) : (
          <WordTable
            wordList={shownWordList}
            fullWordCount={wordList.length}
            onWordClick={(word: string) => findSelectedWordEntry(word)}
          />
        ))}
      {selectedWord && <WordContentViewer selectedWord={selectedWord} />}
    </div>
  );
};
