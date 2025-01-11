import { execSync } from 'child_process';
import readline from 'readline';

export const checkActInstallation = (): boolean => {
  try {
    execSync('act --version', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
};

export const promptInstallAct = async (): Promise<boolean> => {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question(
      '`act` is not installed. Do you want to install it? [Y/n]: ',
      (answer: string) => {
        rl.close();
        if (answer.toLowerCase() === 'y') {
          try {
            console.log('Installing `act`...');
            const installCommand = process.platform === 'win32' ? 'choco install act' : 'brew install act';
            execSync(installCommand);
            resolve(true);
          } catch (error) {
            console.error(`Failed to install act: ${error}`);
            resolve(false);
          }
        } else {
          resolve(false);
        }
      },
    );
  });
};
