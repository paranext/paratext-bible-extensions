import papi from '@papi/backend';
import {
  ExecutionActivationContext,
  GetWebViewOptions,
  IDataProviderEngine,
  IWebViewProvider,
  ProjectMetadata,
  SavedWebViewDefinition,
  UnsubscriberAsync,
  WebViewDefinition,
  WithNotifyUpdate,
} from '@papi/core';

import type {
  WordListDataTypes,
  WordListEntry,
  WordListSelector,
} from 'paranext-extension-word-list';
import { ScriptureReference } from 'papi-components';
import { VerseRef } from '@sillsdev/scripture';
import wordListReact from './word-list.web-view?inline';
import wordListReactStyles from './word-list.web-view.scss?inline';

const { logger } = papi;

// TODO Import from types file
enum Scope {
  Book = 'Book',
  Chapter = 'Chapter',
  Verse = 'Verse',
}

function compareRefs(a: ScriptureReference, b: ScriptureReference): boolean {
  return a.bookNum === b.bookNum && a.chapterNum === b.chapterNum && a.verseNum === b.verseNum;
}

function getDesiredOccurrence(verseText: string, word: string, occurrence: number): number {
  const regex = new RegExp(`\\b${word.toLowerCase()}\\b`, 'ig');

  let match = regex.exec(verseText.toLowerCase());
  let occurrenceIndex = 1;

  // Regex matches are null when there is no match
  // eslint-disable-next-line no-null/no-null
  while (match !== null) {
    if (occurrenceIndex === occurrence) {
      return match.index;
    }
    occurrenceIndex += 1;
    match = regex.exec(verseText.toLowerCase());
  }
  return -1;
}

function getScriptureSnippet(verseText: string, word: string, occurrence: number = 1): string {
  if (!verseText) throw new Error(`No verse text available.`);

  const index = getDesiredOccurrence(verseText, word, occurrence);

  let snippet = '';
  const surroundingCharacters = 40;

  if (index !== -1) {
    let startIndex = Math.max(0, index - surroundingCharacters);
    let endIndex = Math.min(verseText.length, index + word.length + surroundingCharacters);

    while (startIndex > 0 && !/\s/.test(verseText[startIndex - 1])) {
      startIndex -= 1;
    }

    while (endIndex < verseText.length - 1 && !/\s/.test(verseText[endIndex])) {
      endIndex += 1;
    }

    snippet = verseText.substring(startIndex, endIndex);

    const wordStartIndex = index - startIndex;
    const wordEndIndex = wordStartIndex + word.length;
    const beforeWord = snippet.slice(0, wordStartIndex);
    const afterWord = snippet.slice(wordEndIndex);
    const upperCaseWord = snippet.slice(wordStartIndex, wordEndIndex).toUpperCase();

    snippet = beforeWord + upperCaseWord + afterWord;
  }
  return snippet;
}

let prevProcessBookArgs: { bookText: string; scrRef: ScriptureReference; scope: Scope } = {
  bookText: '',
  scrRef: { bookNum: -1, chapterNum: -1, verseNum: -1 },
  scope: Scope.Book,
};

let prevWordList: WordListEntry[] = [];

function processBook(bookText: string, scrRef: ScriptureReference, scope: Scope) {
  if (
    bookText === prevProcessBookArgs.bookText &&
    scrRef.bookNum === prevProcessBookArgs.scrRef.bookNum &&
    scrRef.chapterNum === prevProcessBookArgs.scrRef.chapterNum &&
    scrRef.verseNum === prevProcessBookArgs.scrRef.verseNum &&
    scope === prevProcessBookArgs.scope
  )
    return prevWordList;

  const { bookNum } = scrRef;

  const chapterTexts: string[] = bookText.split(/\\c\s\d+\s/);
  // Delete the first array element, which contains non-scripture-related content
  chapterTexts.shift();

  const wordList: WordListEntry[] = [];
  chapterTexts.forEach((chapterText, chapterId) => {
    const chapterNum = chapterId + 1;
    if (scope !== Scope.Book && scrRef.chapterNum !== chapterNum) {
      return;
    }

    const verseTexts: string[] = chapterText.split(/\\v\s\d+\s/);
    // Delete the first array element, which contains non-scripture-related content
    verseTexts.shift();

    verseTexts.forEach((verseText, verseId) => {
      const verseNum = verseId + 1;
      if (scope === Scope.Verse && scrRef.verseNum !== verseNum) {
        return;
      }

      const wordMatches: RegExpMatchArray | null | undefined =
        verseText?.match(/(?<!\\)\b[a-zA-Z’]+\b/g);

      if (wordMatches) {
        wordMatches.forEach((word) => {
          const newRef: ScriptureReference = {
            bookNum,
            chapterNum,
            verseNum,
          };
          const existingEntry = wordList.find((entry) => entry.word === word.toLocaleLowerCase());
          if (existingEntry) {
            existingEntry.scrRefs.push(newRef);
            const occurrence = existingEntry.scrRefs.reduce(
              (matches, ref) => (compareRefs(ref, newRef) ? matches + 1 : matches),
              0,
            );
            existingEntry.scriptureSnippets.push(getScriptureSnippet(verseText, word, occurrence));
          } else {
            const newEntry: WordListEntry = {
              word: word.toLocaleLowerCase(),
              scrRefs: [newRef],
              scriptureSnippets: [getScriptureSnippet(verseText, word)],
            };
            wordList.push(newEntry);
          }
        });
      }
    });
  });
  prevProcessBookArgs = { bookText, scrRef, scope };
  prevWordList = wordList;
  return wordList;
}

const wordListDataProviderEngine: IDataProviderEngine<WordListDataTypes> &
  WithNotifyUpdate<WordListDataTypes> & {
    wordList: WordListEntry[];
    projectDataUnsubscriber?: UnsubscriberAsync;
  } = {
  wordList: [],

  async getWordList({
    projectId,
    scope,
    scrRef,
  }: WordListSelector): Promise<WordListEntry[] | undefined> {
    const projectDataProvider = await papi.projectDataProviders.get('ParatextStandard', projectId);
    if (this.projectDataUnsubscriber) await this.projectDataUnsubscriber();
    const verseRef = new VerseRef(scrRef.bookNum, scrRef.chapterNum, scrRef.verseNum);
    const bookText = await projectDataProvider.getBookUSFM(verseRef);
    this.projectDataUnsubscriber = await projectDataProvider.subscribeBookUSFM(
      verseRef,
      () => {
        this.notifyUpdate('WordList');
      },
      { retrieveDataImmediately: false },
    );
    if (!bookText) return undefined;
    this.wordList = processBook(bookText, scrRef, scope);
    return this.wordList;
  },

  async setWordList() {
    throw new Error('Word list is generated and cannot be set');
  },

  notifyUpdate() {},

  async dispose(): Promise<boolean> {
    if (this.projectDataUnsubscriber) await this.projectDataUnsubscriber();
    return true;
  },
};

const WORD_LIST_WEB_VIEW_TYPE = 'paratextWordList.react';

const wordListWebViewProvider: IWebViewProvider = {
  async getWebView(
    savedWebView: SavedWebViewDefinition,
    options: GetWebViewOptions & { projectId: string | undefined },
  ): Promise<WebViewDefinition | undefined> {
    if (savedWebView.webViewType !== WORD_LIST_WEB_VIEW_TYPE)
      throw new Error(
        `${WORD_LIST_WEB_VIEW_TYPE} provider received request to provide a ${savedWebView.webViewType} web view`,
      );

    // Type assert the WebView state since TypeScript doesn't know what type it is
    // TODO: Fix after https://github.com/paranext/paranext-core/issues/585 is done
    const projectId = options.projectId || (savedWebView.state?.projectId as string) || '';

    let projectMetadata: ProjectMetadata | undefined;
    try {
      if (projectId) {
        projectMetadata = await Promise.resolve<ProjectMetadata>(
          papi.projectLookup.getMetadataForProject(projectId),
        );
      }
    } catch (e) {
      logger.error(`Word list web view provider error: Could not get project metadata: ${e}`);
    }

    return {
      title: projectMetadata ? `Word List for project ${projectMetadata.name}` : 'Word List',
      ...savedWebView,
      content: wordListReact,
      styles: wordListReactStyles,
      state: {
        ...savedWebView.state,
        projectId,
      },
    };
  },
};

export async function activate(context: ExecutionActivationContext) {
  logger.info('Word List extension is activating!');

  const WordListDataProviderPromise = papi.dataProviders.registerEngine(
    'wordList',
    wordListDataProviderEngine,
  );

  const wordListWebViewProviderPromise = papi.webViewProviders.register(
    WORD_LIST_WEB_VIEW_TYPE,
    wordListWebViewProvider,
  );

  context.registrations.add(
    await papi.commands.registerCommand('paratextWordList.open', async (projectId) => {
      let projectIdForWebView = projectId;

      // If projectIds weren't passed in, get from dialog
      if (!projectIdForWebView) {
        const userProjectIds = await papi.dialogs.showDialog('platform.selectProject', {
          title: 'Open Word List',
          prompt: 'Please select project to open in the word list:',
        });
        if (userProjectIds) projectIdForWebView = userProjectIds;
      }

      // If the user didn't select a project, return undefined and don't show the word list
      if (!projectIdForWebView) return undefined;

      return papi.webViews.getWebView(
        WORD_LIST_WEB_VIEW_TYPE,
        { type: 'float', floatSize: { width: 775, height: 815 } },
        {
          projectId: projectIdForWebView,
          // Type assert because GetWebViewOptions is not yet typed to be generic and allow extra inputs
        } as GetWebViewOptions,
      );
    }),
  );

  context.registrations.add(
    await wordListWebViewProviderPromise,
    await WordListDataProviderPromise,
  );

  logger.info('Word List extension is finished activating!');
}

export async function deactivate() {
  logger.info('Word List extension is deactivating!');
  return true;
}
