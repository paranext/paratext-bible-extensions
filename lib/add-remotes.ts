import { execGitCommand } from './git.util';

(async () => {
  let exitCode = 0;
  // Try adding paranext-multi-extension-template
  try {
    await execGitCommand(
      'git remote add paranext-multi-extension-template https://github.com/paranext/paranext-multi-extension-template',
    );
  } catch (e) {
    if (e.toString().includes('remote paranext-multi-extension-template already exists'))
      console.log(
        'Remote paranext-multi-extension-template already exists. This is likely not a problem.',
      );
    else {
      console.error(`Error on adding remote paranext-multi-extension-template: ${e}`);
      exitCode = 1;
    }
  }

  // Try adding paranext-extension-template
  try {
    await execGitCommand(
      'git remote add paranext-extension-template https://github.com/paranext/paranext-extension-template',
    );
  } catch (e) {
    if (e.toString().includes('remote paranext-extension-template already exists'))
      console.log(
        'Remote paranext-extension-template already exists. This is likely not a problem.',
      );
    else {
      console.error(`Error on adding remote paranext-extension-template: ${e}`);
      exitCode = 1;
    }
  }

  return exitCode;
})();
