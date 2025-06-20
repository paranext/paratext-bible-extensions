import papi from '@papi/backend';
import {
  ExecutionActivationContext,
  GetWebViewOptions,
  IDataProviderEngine,
  IWebViewProvider,
  SavedWebViewDefinition,
  WebViewDefinition,
  WithNotifyUpdate,
} from '@papi/core';

import { SerializedVerseRef } from '@sillsdev/scripture';
import type { WordListDataTypes, WordListEntry, WordListSelector } from 'paratext-bible-word-list';
import { formatReplacementString, compareScrRefs, UnsubscriberAsync } from 'platform-bible-utils';
import wordListReactStyles from './word-list.web-view.scss?inline';
import wordListReact from './word-list.web-view?inline';

const { logger } = papi;

// TODO Import from types file
enum Scope {
  Book = 'Book',
  Chapter = 'Chapter',
  Verse = 'Verse',
}

/**
 * Convert the given string literal to a regular expression that matches exactly that string. To be
 * used until `RegExp.escape()` can be used instead.
 */
function stringToRegExpString(literal: string): string {
  // source: https://stackoverflow.com/a/6318729
  // This puts a backslash before every character that is special in a JavaScript regular
  // expression.
  return literal.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

function getDesiredOccurrence(verseText: string, word: string, occurrence: number): number {
  const regex = new RegExp(`\\b${stringToRegExpString(word.toLowerCase())}\\b`, 'ig');

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

let prevProcessBookArgs: { bookText: string; scrRef: SerializedVerseRef; scope: Scope } = {
  bookText: '',
  scrRef: { book: '', chapterNum: -1, verseNum: -1 },
  scope: Scope.Book,
};

let prevWordList: WordListEntry[] = [];

function processBook(bookText: string, scrRef: SerializedVerseRef, scope: Scope) {
  if (
    bookText === prevProcessBookArgs.bookText &&
    scrRef.book === prevProcessBookArgs.scrRef.book &&
    scrRef.chapterNum === prevProcessBookArgs.scrRef.chapterNum &&
    scrRef.verseNum === prevProcessBookArgs.scrRef.verseNum &&
    scope === prevProcessBookArgs.scope
  )
    return prevWordList;

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
      // Hopefully in the spirit of Paratext 9 (Paratext.Data.CharacterCategorizer),
      // we define a word as anything consisting of Unicode letter (L), number (N),
      // non-assigned (Cn), or private use (Cs) characters,
      // separated by 'medial' punctuation (P, except backslash `\`)
      // and spacing combining (Mc) characters.
      //
      // _Known issue._  For now this excludes words that start with punctuation
      // (like the first word, or perhaps word fragment? in the Dutch "'s ochtends", which uses U+0027)
      // so that we don't accidentally make, e.g., "end." into a word.
      // It feels like language dependent rules would be necessary do to this Right;
      // and perhaps the Unicode standard already has some tools for this.

      const wordCharacterRegExp = /[\p{L}\p{N}\p{Cn}\p{Co}]/; // matches a single character, is a single regexp entity
      const wordMedialRegExp = /(?:(?!\\)[\p{P}\p{Mc}])/; // matches a single character, never backslash (`\`), is a single regexp entity

      // The markers in a verse, which are all ignored:
      // - First 'auxiliary' text spans not containing the text itself
      //   (`\f...\f*`, and same for `\fe`, `\x`, `\va`, `\vp`, `\add`, `\addpn`);
      // - then any other marker
      //   (`\`, optional `+`s, letters, optional digits, optional `*`),
      //   like for example `\+wj*`.
      // So for spans like `\wj...\wj*`, the text inside the span is kept, as it must be.
      //
      // TODO: Check the USFM specification for more marker spans that should be completely skipped.
      // TODO: Handle USFM 3.0 attributes, like inside of `\w...\w*`.
      //
      // Every match of this regexp starts with a backslash (`\`).

      const markerRegExp =
        /(?:\\(?<open>\+*(?:f|fe|x|va|vp|add|addpn))\b.*?\\\k<open>\*|\\\+*[a-z]+\d*\*?)/;

      // combine all of the above regular expressions into a single one
      const wordRegExp = new RegExp(
        `${markerRegExp.source}|${wordCharacterRegExp.source}+(${wordMedialRegExp.source}+${wordCharacterRegExp.source}+)*`,
        'gsu', // 'g' for matchAll(), 's' because a verse can spend multiple lines, 'u' for Unicode (TODO: use `v` instead?)
      );
      for (const match of verseText?.matchAll(wordRegExp)) {
        const word = match[0];
        if (!word.startsWith('\\')) {

          const currentScrRef: SerializedVerseRef = {
            book: scrRef.book,
            chapterNum,
            verseNum,
          };
          const existingWordListEntry = wordList.find(
            (entry) => entry.word === word.toLocaleLowerCase(),
          );
          if (existingWordListEntry) {
            existingWordListEntry.scrRefs.push(currentScrRef);
            const occurrenceInVerse = existingWordListEntry.scrRefs.reduce(
              (matches, ref) => (compareScrRefs(ref, currentScrRef) === 0 ? matches + 1 : matches),
              0,
            );
            existingWordListEntry.scriptureSnippets.push(
              getScriptureSnippet(verseText, word, occurrenceInVerse),
            );
          } else {
            const newEntry: WordListEntry = {
              word: word.toLocaleLowerCase(),
              scrRefs: [currentScrRef],
              scriptureSnippets: [getScriptureSnippet(verseText, word)],
            };
            wordList.push(newEntry);
          }
        }
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
    const projectDataProvider = await papi.projectDataProviders.get(
      'platformScripture.USFM_Book',
      projectId,
    );
    if (this.projectDataUnsubscriber) await this.projectDataUnsubscriber();
    const bookText = await projectDataProvider.getBookUSFM(scrRef);
    this.projectDataUnsubscriber = await projectDataProvider.subscribeBookUSFM(
      scrRef,
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

const WORD_LIST_WEB_VIEW_TYPE = 'paratextBibleWordList.react';

const wordListWebViewProvider: IWebViewProvider = {
  async getWebView(
    savedWebView: SavedWebViewDefinition,
    options: GetWebViewOptions & { projectId: string | undefined },
  ): Promise<WebViewDefinition | undefined> {
    if (savedWebView.webViewType !== WORD_LIST_WEB_VIEW_TYPE)
      throw new Error(
        `${WORD_LIST_WEB_VIEW_TYPE} provider received request to provide a ${savedWebView.webViewType} web view`,
      );

    const projectId = options.projectId || savedWebView.projectId;
    let projectName: string | undefined;
    try {
      if (projectId) {
        projectName = await (
          await papi.projectDataProviders.get('platform.base', projectId)
        ).getSetting('platform.name');
      }
    } catch (e) {
      logger.error(`Word list web view provider error: Could not get project metadata: ${e}`);
    }

    const titleWithProjectFormatKey = '%wordList_titleWithProjectName_format%';
    const titleKey = '%wordList_title_format%';
    let localizedTitleWithProjectFormat: string;
    let localizedTitleWithProject: string;
    let localizedTitle: string;
    try {
      const localizedStrings = await papi.localization.getLocalizedStrings({
        localizeKeys: [titleWithProjectFormatKey, titleKey],
      });
      localizedTitleWithProjectFormat = localizedStrings[titleWithProjectFormatKey];
      localizedTitle = localizedStrings[titleKey];

      localizedTitleWithProject = formatReplacementString(localizedTitleWithProjectFormat, {
        projectName,
      });
    } catch (e) {
      logger.error(`'Getting localizations for titles failed with error: ${e}`);
      localizedTitleWithProject = projectName
        ? `Word List for project ${projectName}`
        : 'Word List';
      localizedTitle = 'Word List';
    }

    return {
      title: projectName ? localizedTitleWithProject : localizedTitle,
      shouldShowToolbar: true,
      ...savedWebView,
      content: wordListReact,
      styles: wordListReactStyles,
      projectId,
    };
  },
};

export async function activate(context: ExecutionActivationContext) {
  logger.info('Word List extension is activating!');

  const WordListDataProviderPromise = papi.dataProviders.registerEngine(
    'wordList',
    wordListDataProviderEngine,
  );

  const wordListWebViewProviderPromise = papi.webViewProviders.registerWebViewProvider(
    WORD_LIST_WEB_VIEW_TYPE,
    wordListWebViewProvider,
  );

  context.registrations.add(
    await papi.commands.registerCommand(
      'paratextBibleWordList.open',
      async (webViewId) => {
        let projectId: string | undefined;

        if (webViewId) {
          const webViewDefinition = await papi.webViews.getOpenWebViewDefinition(webViewId);
          projectId = webViewDefinition?.projectId;
        }

        return papi.webViews.openWebView(
          WORD_LIST_WEB_VIEW_TYPE,
          { type: 'float', floatSize: { width: 775, height: 815 } },
          // Type assert because GetWebViewOptions is not yet typed to be generic and allow extra inputs
          // eslint-disable-next-line no-type-assertion/no-type-assertion
          {
            projectId,
          } as GetWebViewOptions,
        );
      },
      {
        method: {
          description: 'Opens the word list for the specified project',
          params: [
            {
              name: 'webViewId',
              schema: { type: 'string' },
              description: 'ID of a web view associated with the project to examine',
              required: false,
            },
          ],
          result: {
            name: 'webViewId',
            schema: { type: 'string' },
            description: 'ID of the web view that was opened or null if no project was selected',
          },
        },
      },
    ),
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
