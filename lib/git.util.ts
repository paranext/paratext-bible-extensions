import { exec, ExecOptions } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import replaceInFile from 'replace-in-file';

/** The branch to use in pulling changes from `paranext-multi-extension-template` */
export const MULTI_TEMPLATE_BRANCH = '486-multi-extension-template';
/** The branch to use in pulling changes from `paranext-extension-template` */
export const SINGLE_TEMPLATE_BRANCH = '486-multi-extension-template';

const execAsync = promisify(exec);

/**
 * Executes a git command from the repo root directory, logging both the command and the results.
 *
 * For some reason, git likes to use stderr to return things that are not errors, so we only throw
 * if the command throws
 *
 * @param command
 * @param options The options for the exec command. Add quiet to not log anything
 */
export async function execGitCommand(
  command: string,
  options: ExecOptions & { quiet?: boolean } = {},
): Promise<{ stdout: string; stderr: string }> {
  const { quiet, ...execOptions } = options;
  if (!quiet) console.log(`\n> ${command}`);
  try {
    const result = await execAsync(command, {
      cwd: path.resolve(path.join(__dirname, '..')),
      ...execOptions,
    });
    if (!quiet && result.stdout) console.log(result.stdout);
    if (!quiet && result.stderr) console.log(result.stderr);
    return result;
  } catch (e) {
    throw new Error(
      `code ${e.code}!${e.stderr ? `\n${e.stderr}` : ''}${e.stdout ? `\n${e.stdout}` : ''}`,
    );
  }
}

/**
 * Check the repo for working changes
 *
 * @param quiet Whether to log an error if there are working changes
 * @returns 1 if there were working changes, 0 otherwise
 */
export async function checkForWorkingChanges(quiet = false) {
  // Check the git status to make sure there are no working changes
  const status = await execGitCommand('git status --porcelain=v2', {
    quiet: true,
  });

  if (status.stderr || status.stdout) {
    if (!quiet)
      console.error(
        `Working changes detected! Please stash or commit your changes. git status output: ${JSON.stringify(
          status,
        )}`,
      );
    return 1;
  }
  return 0;
}

/**
 * Fetch latest from paranext-extension-template
 *
 * @returns 1 if there was an error, 0 otherwise
 */
export async function fetchFromSingleTemplate() {
  // Fetch latest paranext-extension-template branch
  try {
    await execGitCommand(`git fetch paranext-extension-template ${SINGLE_TEMPLATE_BRANCH}`);
  } catch (e) {
    console.error(`Error on git fetch on paranext-extension-template: ${e}`);
    return 1;
  }
  return 0;
}

/**
 * Format an extension folder to make the extension template folder work as a subfolder of this repo
 *
 * This function may be called many times for one extension folder, so make sure all operations work
 * properly no matter how many times this function is called
 *
 * @param extensionFolderPath Path to the extension to format relative to root
 */
export async function formatExtensionFolder(extensionFolderPath: string) {
  // Replace ../paranext-core with ../../../paranext-core to fix ts-config and package.json and such
  const results = await replaceInFile({
    files: `${extensionFolderPath}/**/*`,
    ignore: [
      '**/node_modules/**/*',
      '**/temp-build/**/*',
      '**/logs/**/*',
      '**/*.log',
      '**/.eslintcache',
    ],
    from: /([^/])\.\.\/paranext-core/g,
    to: '$1../../../paranext-core',
    countMatches: true,
    allowEmptyPaths: true,
  });
  const replaceStats = results.reduce(
    (replacements, replaceResult) => ({
      totalReplacements: replacements.totalReplacements + (replaceResult.numReplacements ?? 0),
      filesChanged: replaceResult.hasChanged
        ? [...replacements.filesChanged, replaceResult.file]
        : [...replacements.filesChanged],
    }),
    // filesChanged starts as an empty array, so it can't tell it should contain strings without
    // type assertion
    // eslint-disable-next-line no-type-assertion/no-type-assertion
    { totalReplacements: 0, filesChanged: [] as string[] },
  );
  if (replaceStats.totalReplacements > 0)
    console.log(
      `Formatting ${extensionFolderPath}: Updated relative path to paranext-core ${
        replaceStats.totalReplacements
      } times in ${replaceStats.filesChanged.length} files:\n\t${replaceStats.filesChanged.join(
        '\n\t',
      )}\n`,
    );
}
