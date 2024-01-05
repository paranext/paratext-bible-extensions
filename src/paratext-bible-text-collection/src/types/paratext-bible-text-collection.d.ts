declare module 'paratext-bible-text-collection' {
  // Add extension types exposed on the papi for other extensions to use here
  // More instructions can be found in the README
}

declare module 'papi-shared-types' {
  export interface CommandHandlers {
    /**
     * Opens a new text collection WebView and returns the WebView id
     *
     * @param projectIds Array of project IDs to open with the text collection. Prompts the user to
     *   select projects if not provided
     * @returns WebView id for new text collection WebView or `undefined` if the user canceled the
     *   dialog
     */
    'paratextBibleTextCollection.open': (projectIds?: string[]) => Promise<string | undefined>;
  }
}
