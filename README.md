# paranext-extension-template

Basic extension template for Platform.Bible

## Template Info

This is a webpack project template pre-configured to build a Platform.Bible extension. It contains the bare minimum of what an extension needs. Note that the `*.web-view.*` files and the `public/assets` folder mentioned in [Summary](#summary) are not present in this template. For inspiration on what these could look like, refer to any extension that is built using this template. An example would be the [Text Collection extension](https://github.com/paranext/paranext-extension-text-collection).

There is also [a template pre-configured to build an arbitrary number of Platform.Bible extensions in one repo](https://github.com/paranext/paranext-multi-extension-template).

### Customize extension details

Follow these instructions to customize the template to be your own Platform.Bible extension. This section is a more compact version of the [`Your first extension` guide](https://github.com/paranext/paranext-extension-template/wiki/Your-First-Extension).

#### Install and hook up to the template

Note: please skip this section and continue with [Replace placeholders](#replace-placeholders) if you are following these instructions as part of [creating an extension within `paranext-multi-extension-template`](https://github.com/paranext/paranext-multi-extension-template#to-create-a-new-extension-in-this-repo).

To make the process of customizing from the template as smooth as possible, we recommend you do the following before anything else:

- [Install and set up this repo](#to-install)
- [Update this extension from the template](#to-update-this-extension-from-the-template)

#### Replace placeholders

- At the top of this `README.md`:

  - Replace the first line `# paranext-extension-template` with `# your-extension-name`
  - Below the first line, replace the extension description with your own description
  - In the [Summary](#summary) section, replace `src/types/paranext-extension-template.d.ts` with `src/types/<your_extension_name>.d.ts`

- In `manifest.json`:

  - Replace `paranext-extension-template` with `your-extension-name` (2 occurrences)
  - Replace the description with your own description
  - Update ownership information and other relevant fields as desired

- In `package.json`:

  - Replace `paranext-extension-template` with `your-extension-name` (2 occurrences)
  - Replace the description with your own description
  - Update ownership information and other relevant fields as desired

- In `LICENSE`:

  - Adjust as desired (feel free to choose a different license)
  - If you choose to stay with the current license, update the copyright statement

- Rename `src/types/paranext-extension-template.d.ts` to `src/types/<your_extension_name>.d.ts`

  - In this renamed file, replace `paranext-extension-template` with `your-extension-name`

- In `src/main.ts`, replace `Extension template` with `Your Extension Name` (2 occurrences)

#### Customize the extension manifest and package information

The `manifest.json` and `package.json` files contain information specific to your extension. Add your extension's details in these two files as needed. See more information on the `manifest.json` and `package.json` files in [Extension Anatomy](https://github.com/paranext/paranext-extension-template/wiki/Extension-Anatomy#extension-manifest).

#### Remove Template Info

Once finished customizing this template to be your own, you can remove the [Template Info](#template-info) section and sub-sections of this readme.

## Summary

The general file structure is as follows:

- `package.json` contains information about this extension's npm package. It is required for Platform.Bible to use the extension properly. It is copied into the build folder
- `manifest.json` is the manifest file that defines the extension and important properties for Platform.Bible. It is copied into the build folder
- `src/` contains the source code for the extension
  - `src/main.ts` is the main entry file for the extension
  - `src/types/paranext-extension-template.d.ts` is this extension's types file that defines how other extensions can use this extension through the `papi`. It is copied into the build folder
  - `*.web-view.tsx` files will be treated as React WebViews
  - `*.web-view.html` files are a conventional way to provide HTML WebViews (no special functionality)
- `assets/` contains asset files the extension and its WebViews can retrieve using the `papi-extension:` protocol. It is copied into the build folder
- `public/` contains other static files that are copied into the build folder
- `dist/` is a generated folder containing the built extension files
- `release/` is a generated folder containing a zip of the built extension files

## To install

### Install dependencies:

1. Follow the instructions to install [`paranext-core`](https://github.com/paranext/paranext-core#developer-install).
2. In this repo, run `npm install` to install local and published dependencies

### Configure paths to `paranext-core` repo

In order to interact with `paranext-core`, you must point `package.json` to your installed `paranext-core` repository:

1. Follow the instructions to install [`paranext-core`](https://github.com/paranext/paranext-core#developer-install). We recommend you clone `paranext-core` in the same parent directory in which you cloned this repository so you do not have to reconfigure paths to `paranext-core`.
2. If you cloned `paranext-core` anywhere other than in the same parent directory in which you cloned this repository, update the paths to `paranext-core` in this repository's `package.json` to point to the correct `paranext-core` directory.

## To run

### Running Platform.Bible with this extension

To run Platform.Bible with this extension:

`npm start`

Note: The built extension will be in the `dist` folder. In order for Platform.Bible to run this extension, you must provide the directory to this built extension to Platform.Bible via a command-line argument. This command-line argument is already provided in this `package.json`'s `start` script. If you want to start Platform.Bible and use this extension any other way, you must provide this command-line argument or put the `dist` folder into Platform.Bible's `extensions` folder.

### Building this extension independently

To watch extension files (in `src`) for changes:

`npm run watch`

To build the extension once:

`npm run build`

## To package for distribution

To package this extension into a zip file for distribution:

`npm run package`

## To update this extension from the template

This extension project is forked from [`paranext-extension-template`](https://github.com/paranext/paranext-extension-template), which is updated periodically and will sometimes receive updates that help with breaking changes on [`paranext-core`](https://github.com/paranext/paranext-core). We recommend you periodically update your extension by merging the latest template updates into your extension.

To set up this extension to be updated from the template, run the following command once after cloning this repo:

```bash
git remote add template https://github.com/paranext/paranext-extension-template
```

To update this extension from the template, make sure your repo has no working changes. Then run the following commands:

```bash
git fetch template
git merge template/main --allow-unrelated-histories
```

For more information, read [the instructions on the wiki](https://github.com/paranext/paranext-extension-template/wiki/Merging-Template-Changes-into-Your-Extension).

**Note:** The merge/squash commits created when updating this repo from the template are important; Git uses them to compare the files for future updates. If you edit this repo's Git history, please preserve these commits (do not squash them, for example) to avoid duplicated merge conflicts in the future.

## Special features in this project

This project has special features and specific configuration to make building an extension for Platform.Bible easier. See [Special features of `paranext-multi-extension-template`](https://github.com/paranext/paranext-multi-extension-template#special-features-of-the-template) for information on these special features.
