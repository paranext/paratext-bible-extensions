import { WebViewProps } from '@papi/core';
import { useData, useLocalizedStrings } from '@papi/frontend/react';
import { SerializedVerseRef } from '@sillsdev/scripture';
import type { WordListEntry } from 'paratext-bible-word-list';
import { ComboBox, Input, Label, Spinner, Switch } from 'platform-bible-react';
import { isPlatformError } from 'platform-bible-utils';
import { ChangeEvent, useEffect, useMemo, useState } from 'react';
import WordCloud from './word-cloud.component';
import WordContentViewer from './word-content-viewer.component';
import WordTable from './word-table.component';

const defaultScrRef: SerializedVerseRef = {
  book: 'GEN',
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
  scrRef: SerializedVerseRef;
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
  scrRef: SerializedVerseRef,
): boolean {
  if (dataSelector.projectId !== projectId) return true;
  if (dataSelector.scope !== scope) return true;
  if (
    (scope === Scope.Book && scrRef.book !== dataSelector.scrRef.book) ||
    (scope === Scope.Chapter &&
      (scrRef.book !== dataSelector.scrRef.book ||
        scrRef.chapterNum !== dataSelector.scrRef.chapterNum)) ||
    (scope === Scope.Verse &&
      (scrRef.book !== dataSelector.scrRef.book ||
        scrRef.chapterNum !== dataSelector.scrRef.chapterNum ||
        scrRef.verseNum !== dataSelector.scrRef.verseNum))
  ) {
    return true;
  }
  return false;
}

globalThis.webViewComponent = function WordListWebView({
  projectId,
  useWebViewState,
  useWebViewScrollGroupScrRef,
}: WebViewProps) {
  const [scrRef] = useWebViewScrollGroupScrRef();
  const [scope, setScope] = useWebViewState<Scope>('scope', Scope.Book);
  const [wordFilter, setWordFilter] = useState<string>('');
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
    if (newDataNeeded(dataSelector, projectId || '', scope, scrRef)) {
      setLoading(true);
      setSelectedWord(undefined);
      setDataSelector({
        projectId: projectId || '',
        scope,
        scrRef,
      });
    }
  }, [dataSelector, projectId, scope, scrRef]);

  useEffect(() => {
    if (isPlatformError(wordList) || (wordList && Array.isArray(wordList))) {
      setLoading(false);
    }
  }, [wordList]);

  const shownWordList: WordListEntry[] = useMemo((): WordListEntry[] => {
    setSelectedWord(undefined);
    if (!wordList || isPlatformError(wordList)) return [];
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

  const filterDefaultKey = '%wordList_filter_defaultText%';
  const cloudViewKey = '%wordList_cloudView_label%';
  const tableViewKey = '%wordList_tableView_label%';
  const viewKey = '%wordList_view_label%';

  const [localizedStrings] = useLocalizedStrings(
    useMemo(() => [filterDefaultKey, cloudViewKey, tableViewKey, viewKey], []),
  );

  const localizedFilterDefault = localizedStrings[filterDefaultKey];
  const localizedCloudView = localizedStrings[cloudViewKey];
  const localizedTableView = localizedStrings[tableViewKey];
  const localizedView = localizedStrings[viewKey];

  return (
    <div className="word-list">
      <div className="filters">
        <ComboBox
          value={scope}
          onChange={(value) => setScope(value)}
          options={Object.values(Scope)}
        />
        <Input
          className="input"
          placeholder={localizedFilterDefault}
          value={wordFilter}
          onChange={(event) => onChangeWordFilter(event)}
        />
        <Switch
          id="view-mode"
          checked={showWordCloud}
          onCheckedChange={() => {
            setShowWordCloud(!showWordCloud);
            setSelectedWord(undefined);
          }}
        />

        <Label htmlFor="view-mode">{`${showWordCloud ? localizedCloudView : localizedTableView} ${localizedView}`}</Label>
      </div>
      {loading && (
        <div className="loader">
          <Spinner />
          <Label>Generating word list</Label>
        </div>
      )}
      {!loading &&
        wordList &&
        (showWordCloud ? (
          <div className="word-component">
            <WordCloud wordList={shownWordList} />
          </div>
        ) : (
          <div className="word-component">
            <WordTable
              wordList={shownWordList}
              fullWordCount={isPlatformError(wordList) ? 0 : wordList.length}
              onWordClick={(word: string) => findSelectedWordEntry(word)}
            />
          </div>
        ))}
      {selectedWord && (
        <div className="word-component">
          <WordContentViewer selectedWord={selectedWord} />
        </div>
      )}
    </div>
  );
};
