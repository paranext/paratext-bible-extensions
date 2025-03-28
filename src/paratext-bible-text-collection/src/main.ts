import papi, { logger } from '@papi/backend';
import type {
  ExecutionActivationContext,
  GetWebViewOptions,
  IWebViewProvider,
  SavedWebViewDefinition,
  WebViewDefinition,
} from '@papi/core';
import textCollectionReact from './web-views/paratext-text-collection.web-view?inline';
import textCollectionReactStyles from './web-views/paratext-text-collection.web-view.scss?inline';
import {
  getTextCollectionTitle,
  getTextCollectionTooltip,
  REQUIRED_PROJECT_INTERFACES,
} from './util';

logger.info('Text collection extension is importing!');

const TEXT_COLLECTION_WEB_VIEW_TYPE = 'paratextBibleTextCollection.react';

/** Text collection web view provider - provides Text collection web view when papi asks for it */
const textCollectionWebViewProvider: IWebViewProvider = {
  async getWebView(
    savedWebView: SavedWebViewDefinition,
    options: GetWebViewOptions & { projectIds: string[] | undefined },
  ): Promise<WebViewDefinition | undefined> {
    if (savedWebView.webViewType !== TEXT_COLLECTION_WEB_VIEW_TYPE)
      throw new Error(
        `${TEXT_COLLECTION_WEB_VIEW_TYPE} provider received request to provide a ${savedWebView.webViewType} web view`,
      );

    let localizedTextCollection: string | undefined;
    try {
      localizedTextCollection = await papi.localization.getLocalizedString({
        localizeKey: '%textCollection_defaultTitle%',
      });
    } catch (e) {
      logger.error(`Localization for 'Text Collection' failed with error: ${e}`);
    }

    // Type assert the WebView state since TypeScript doesn't know what type it is
    // TODO: Fix after https://github.com/paranext/paranext-core/issues/585 is done
    // eslint-disable-next-line no-type-assertion/no-type-assertion
    const projectIds = options.projectIds || (savedWebView.state?.projectIds as string[]) || [];

    let projectNames: string[] | undefined;
    try {
      // Get project names
      projectNames = await Promise.all(
        projectIds.map(async (projectId) => {
          const pdp = await papi.projectDataProviders.get('platform.base', projectId);

          const name = await pdp.getSetting('platform.name');

          return name;
        }),
      );
    } catch (e) {
      logger.error(`Text collection web view provider error: Could not get project names: ${e}`);
    }

    return {
      title:
        getTextCollectionTitle(projectNames, { book: 'GEN', chapterNum: 1, verseNum: 1 }) ??
        '%textCollection_defaultTitle%',
      tooltip: getTextCollectionTooltip(localizedTextCollection, projectNames),
      shouldShowToolbar: true,
      ...savedWebView,
      iconUrl: 'papi-extension://paratext-bible-text-collection/assets/Group24.svg',
      content: textCollectionReact,
      styles: textCollectionReactStyles,
      state: {
        ...savedWebView.state,
        projectIds,
      },
      // In case projectIds changed, make sure projectId (the focused Scripture) is in projectIds
      projectId:
        savedWebView.projectId && projectIds.includes(savedWebView.projectId)
          ? savedWebView.projectId
          : undefined,
    };
  },
};

export async function activate(context: ExecutionActivationContext) {
  logger.info('Text collection extension is activating!');

  const textCollectionWebViewProviderPromise = papi.webViewProviders.register(
    TEXT_COLLECTION_WEB_VIEW_TYPE,
    textCollectionWebViewProvider,
  );

  context.registrations.add(
    await papi.commands.registerCommand('paratextBibleTextCollection.open', async (projectIds) => {
      let projectIdsForWebView = projectIds;

      // If projectIds weren't passed in, get from dialog
      if (!projectIdsForWebView) {
        const userProjectIds = await papi.dialogs.showDialog('platform.selectMultipleProjects', {
          title: '%textCollection_dialog_openTextCollection_title%',
          prompt: '%textCollection_dialog_selectProjectsToOpen_prompt%',
          // Wrap array of required `projectInterface`s in another array to make these required
          // `projectInterface`s AND together, not OR, so the only projects that show up are ones
          // that support all required `projectInterface`s
          includeProjectInterfaces: [REQUIRED_PROJECT_INTERFACES],
        });
        if (userProjectIds) projectIdsForWebView = userProjectIds;
      }

      // If the user didn't select a project, return undefined and don't show the text collection
      if (!projectIdsForWebView) return undefined;

      // Type assert because GetWebViewOptions is not yet typed to be generic and allow extra inputs
      // eslint-disable-next-line no-type-assertion/no-type-assertion
      return papi.webViews.getWebView(TEXT_COLLECTION_WEB_VIEW_TYPE, undefined, {
        projectIds: projectIdsForWebView,
      } as GetWebViewOptions);
    }),
  );

  // Await the web view provider promise at the end so we don't hold everything else up
  context.registrations.add(await textCollectionWebViewProviderPromise);

  logger.info('Text collection extension is finished activating!');
}

export async function deactivate() {
  logger.info('Text collection extension is deactivating!');
  return true;
}
