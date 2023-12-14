import papi, { logger } from '@papi/backend';
import type {
  ExecutionActivationContext,
  GetWebViewOptions,
  IWebViewProvider,
  ProjectMetadata,
  SavedWebViewDefinition,
  WebViewDefinition,
} from '@papi/core';
import { VerseRef } from '@sillsdev/scripture';
import textCollectionReact from './web-views/paratext-text-collection.web-view?inline';
import textCollectionReactStyles from './web-views/paratext-text-collection.web-view.scss?inline';
import { getTextCollectionTitle } from './util';

logger.info('Text collection extension is importing!');

const TEXT_COLLECTION_WEB_VIEW_TYPE = 'paratextTextCollection.react';

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

    // Type assert the WebView state since TypeScript doesn't know what type it is
    // TODO: Fix after https://github.com/paranext/paranext-core/issues/585 is done
    const projectIds = options.projectIds || (savedWebView.state?.projectIds as string[]) || [];

    let projectsMetadata: ProjectMetadata[] | undefined;
    try {
      projectsMetadata = await Promise.all(
        projectIds.map((projectId) => papi.projectLookup.getMetadataForProject(projectId)),
      );
    } catch (e) {
      logger.error(`Text collection web view provider error: Could not get project metadata: ${e}`);
    }

    return {
      title: projectsMetadata
        ? getTextCollectionTitle(projectsMetadata, new VerseRef(1, 1, 1))
        : 'Text Collection',
      ...savedWebView,
      iconUrl: 'papi-extension://paratext-text-collection/assets/Group24.svg',
      content: textCollectionReact,
      styles: textCollectionReactStyles,
      state: {
        ...savedWebView.state,
        projectIds,
      },
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
    await papi.commands.registerCommand('paratextTextCollection.open', async (projectIds) => {
      let projectIdsForWebView = projectIds;

      // If projectIds weren't passed in, get from dialog
      if (!projectIdsForWebView) {
        const userProjectIds = await papi.dialogs.showDialog('platform.selectMultipleProjects', {
          title: 'Open Text Collection',
          prompt: 'Please select projects to open in the text collection:',
        });
        if (userProjectIds) projectIdsForWebView = userProjectIds;
      }

      // If the user didn't select a project, return undefined and don't show the text collection
      if (!projectIdsForWebView) return undefined;

      return papi.webViews.getWebView(TEXT_COLLECTION_WEB_VIEW_TYPE, undefined, {
        projectIds: projectIdsForWebView,
        // Type assert because GetWebViewOptions is not yet typed to be generic and allow extra inputs
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
