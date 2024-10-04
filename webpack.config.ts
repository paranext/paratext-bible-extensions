// #region shared with https://github.com/paranext/paranext-extension-template/blob/main/webpack.config.ts

import webpack from 'webpack';
import configWebView from './webpack/webpack.config.web-view';
import configMain from './webpack/webpack.config.main';
import { getExtensionFolderNamesSync } from './webpack/webpack.util';

// Note: Using a .ts file as the webpack config requires not having "type": "module" in package.json
// https://stackoverflow.com/a/76005614

const areExtensionsPresent = getExtensionFolderNamesSync().length > 0;

if (!areExtensionsPresent)
  // This is a command-line utility for which it is fine to print to the console
  // eslint-disable-next-line no-console
  console.log(
    'No extensions found! Please run `npm run create-extension -- <extension_name>` to create an extension. See README.md for more information.',
  );

// We want to build web views and then build main
const config: (webpack.Configuration | (() => Promise<webpack.Configuration>))[] =
  areExtensionsPresent ? [configWebView, configMain] : [];

export default config;

// #endregion
