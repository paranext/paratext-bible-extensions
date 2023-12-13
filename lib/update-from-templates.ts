import {
  MULTI_TEMPLATE_BRANCH,
  SINGLE_TEMPLATE_BRANCH,
  checkForWorkingChanges,
  execGitCommand,
  fetchFromSingleTemplate,
  formatExtensionFolder,
} from './git.util';
import { ExtensionInfo, getExtensions } from '../webpack/webpack.util';

(async () => {
  // Make sure there are not working changes as this will not work with working changes
  if ((await checkForWorkingChanges()) === 1) return 1;

  // Fetch latest paranext-multi-extension-template branch
  try {
    await execGitCommand(`git fetch paranext-multi-extension-template ${MULTI_TEMPLATE_BRANCH}`);
  } catch (e) {
    console.error(`Error on git fetch on paranext-multi-extension-template: ${e}`);
    return 1;
  }

  // Merge changes from paranext-multi-extension-template into this repo
  try {
    await execGitCommand(
      `git merge paranext-multi-extension-template/${MULTI_TEMPLATE_BRANCH} --allow-unrelated-histories`,
    );
  } catch (e) {
    console.error(`Error merging from paranext-multi-extension-template: ${e}`);
    return 1;
  }

  // Fetch latest on paranext-extension-template to make sure we're up to date
  if ((await fetchFromSingleTemplate()) === 1) return 1;

  // Get list of extensions to update
  /** All extension folders in this repo */
  const extensions = await getExtensions();
  /**
   * Extensions in this repo that are git subtrees of paranext-extension-template
   *
   * We will perform various updates on these extensions but not on ones that are not based on the
   * template.
   */
  const extensionsBasedOnTemplate: ExtensionInfo[] = [];

  // Merge changes from paranext-extension-template into each extension one at a time
  // We intend to run these one at a time, so for/of works well here
  // eslint-disable-next-line no-restricted-syntax
  for (const ext of extensions) {
    try {
      // We intend to run these one at a time, so awaiting inside the loop works well here
      // eslint-disable-next-line no-await-in-loop
      await execGitCommand(
        `git subtree pull --prefix ${ext.dirPathOSIndependent} paranext-extension-template ${SINGLE_TEMPLATE_BRANCH} --squash`,
      );

      // We successfully pulled this subtree, so it is based on the template
      extensionsBasedOnTemplate.push(ext);
    } catch (e) {
      if (
        e
          .toString()
          .endsWith(`fatal: can't squash-merge: '${ext.dirPathOSIndependent}' was never added.\n`)
      )
        // If this folder isn't a subtree, it may be intentionally not based on the template. Continue
        console.warn(
          `${ext.dirName} was never added as a subtree of paranext-extension-template. Feel free to ignore this if this folder is not supposed to be based on paranext-extension-template.\nIf this folder is supposed to be based on paranext-extension-template, run \`npm run create-extension -- ${ext.dirName}\`\n`,
        );
      else {
        console.error(`Error pulling from paranext-extension-template to ${ext.dirName}: ${e}`);
        // You can only fix merge conflicts on one subtree at a time, so stop
        // if we hit an error like merge conflicts
        return 1;
      }
    }
  }

  // Now that pulling all subtrees is finished and we can have working changes, format all the
  // paranext-extension-template-based extension folders to make sure they work properly as subfolders of this
  // repo
  await Promise.all(
    extensionsBasedOnTemplate.map((ext) => formatExtensionFolder(ext.dirPathOSIndependent)),
  );

  // Check for working changes to see if formatting the extensions changed anything
  // Don't commit for them so they know what is going on
  if ((await checkForWorkingChanges(true)) === 1)
    console.log(
      'After updating extensions from paranext-extension-template and formatting them, there are working changes.\nThis is likely expected. Please commit the result.',
    );

  return 0;
})();
