declare module 'paranext-extension-word-list' {
  import { ScriptureReference } from 'papi-components';
  import { DataProviderDataType, IDataProvider } from '@papi/core';

  export type WordListEntry = {
    word: string;
    scrRefs: ScriptureReference[];
    scriptureSnippets: string[];
  };

  export enum Scope {
    Book = 'Book',
    Chapter = 'Chapter',
    Verse = 'Verse',
  }

  type WordListSelector = {
    projectId: string;
    scrRef: ScriptureReference;
    scope: Scope;
  };

  export type WordListDataTypes = {
    WordList: DataProviderDataType<WordListSelector, WordListEntry[] | undefined, never>;
  };

  export type WordListDataProvider = IDataProvider<WordListDataTypes>;
}

declare module 'papi-shared-types' {
  import type { WordListDataProvider } from 'paranext-extension-word-list';

  export interface CommandHandlers {
    /**
     * Opens a new word list WebView and returns the WebView id
     * @param projectId Project ID to open with the word list. Prompts the user to
     * select project if not provided
     * @returns WebView id for new word list WebView or `undefined` if the user canceled the dialog
     */
    'paratextWordList.open': (projectId?: string) => Promise<string | undefined>;
  }

  export interface DataProviders {
    wordList: WordListDataProvider;
  }
}
