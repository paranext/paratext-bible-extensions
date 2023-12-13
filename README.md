# paratext-dot-bible-extensions

Official Paratext.Bible extensions for Platform.Bible

## Summary

This is a webpack project configured to build Platform.Bible extensions. The general file structure is as follows:

- `src/` contains the source code for all extensions
  - Each sub-folder in `src/` with a `manifest.json` in it is an extension
    - `package.json` contains information about this extension npm package. It is required for Platform.Bible to use the extension properly. It is copied into the build folder
    - `manifest.json` is the manifest file that defines the extension and important properties for Platform.Bible. It is copied into the build folder
    - `<extension_name>.d.ts` is this extension's types file that defines how other extensions can use this extension through the `papi`
    - `src/` contains the source code for the extension
      - `src/main.ts` is the main entry file for the extension
      - `*.web-view.tsx` files will be treated as React WebViews
      - `*.web-view.html` files are a conventional way to provide HTML WebViews (no special functionality)
    - `assets/` contains asset files the extension and its WebViews can retrieve using the `papi-extension:` protocol. It is copied into the build folder
    - `public/` contains other static files that are copied into the build folder
- `dist/` is a generated folder containing the built extension files
- `release/` is a generated folder containing zips of the built extension files

## To install

### Install dependencies:

1. Follow the instructions to install [`paranext-core`](https://github.com/paranext/paranext-core#developer-install).
2. In this repo, run `npm install` to install local and published dependencies

Note: running `npm install` automatically adds remotes that help with [updating from the templates](#to-update-this-repo-and-extensions-from-the-templates).

<details>
    <summary>[Optional] Adding remotes manually</summary>

#### Adding remotes manually

To add these remotes manually, run the following commands:

```bash
git remote add paranext-multi-extension-template https://github.com/paranext/paranext-multi-extension-template

git remote add paranext-extension-template https://github.com/paranext/paranext-extension-template
```

</details>

### Configure paths to `paranext-core` repo

In order to interact with `paranext-core`, you must point `package.json` to your installed `paranext-core` repository:

1. Follow the instructions to install [`paranext-core`](https://github.com/paranext/paranext-core#developer-install). We recommend you clone `paranext-core` in the same parent directory in which you cloned this repository so you do not have to reconfigure paths to `paranext-core`.
2. If you cloned `paranext-core` anywhere other than in the same parent directory in which you cloned this repository, update the paths to `paranext-core` in this repository's `package.json` to point to the correct `paranext-core` directory.

## To run

### Running Platform.Bible with these extensions

To run Platform.Bible with these extensions:

`npm start`

Note: The built extensions will be the `dist` folder. In order for Platform.Bible to run these extensions, you must provide the directory to these built extensions to Platform.Bible via a command-line argument. This command-line argument is already provided in this `package.json`'s `start` script. If you want to start Platform.Bible and use these extensions any other way, you must provide this command-line argument or put the `dist` folder into Platform.Bible's `extensions` folder.

### Building these extensions independently

To watch extension files (in `src`) for changes:

`npm run watch`

To build the extensions once:

`npm run build`

## To package for distribution

To package this extension into a zip file for distribution:

`npm run package`

## To create a new extension in this repo

To create a new extension in this repo, make sure your repo has no working changes, then run the following command (replace `<extension_name>` with the preferred extension name. This will also be the extension's folder name in the `src` folder):

```bash
npm run create-extension -- <extension_name>
```

Then follow [the instructions for customizing the new extension](https://github.com/paranext/paranext-extension-template#customize-extension-details).

<details>
    <summary>[Optional] Creating a new extension manually</summary>

#### Manually create a new extension

Alternatively, you can create a new extension manually:

```bash
git fetch paranext-extension-template main

git subtree add --prefix src/<extension_name> paranext-extension-template main --squash
```

</details>

[click me](#manually-create-a-new-extension)

## To update this repo and extensions from the templates

This project is forked from [`paranext-multi-extension-template`](https://github.com/paranext/paranext-multi-extension-template), and its extensions are derived from [`paranext-extension-template`](https://github.com/paranext/paranext-extension-template). Both are updated periodically and will sometimes receive updates that help with breaking changes on [`paranext-core`](https://github.com/paranext/paranext-core). We recommend you periodically update your repo and extensions by merging the latest template updates into them.

To update this repo including all extensions to have the latest updates and upgrades from the templates, make sure your repo has no working changes, then run the following `npm` script:

```bash
npm run update-from-templates
```

If you encounter errors from merge conflicts, please resolve the merge conflicts, finish the commit, and run the script above again.

<details>
    <summary>[Optional] Update from the templates manually</summary>

### Update from the templates manually

Alternatively, you can update from the templates manually.

#### Manually update this repo from `paranext-multi-extension-template`

```bash
git fetch paranext-multi-extension-template main

git merge paranext-multi-extension-template/main --allow-unrelated-histories
```

#### Manually update extensions from `paranext-extension-template`

```bash
git fetch paranext-extension-template main
```

For each extension, run the following (replace `<extension_name>` with each extension's folder name):

```bash
git subtree pull --prefix src/<extension_name> paranext-extension-template main --squash
```

</details>

## Special features in this project

This project has special features and specific configuration to make building extensions for Platform.Bible easier. See [Special features of `paranext-extension-template`](https://github.com/paranext/paranext-extension-template#special-features-of-the-template) for information on these special features.
