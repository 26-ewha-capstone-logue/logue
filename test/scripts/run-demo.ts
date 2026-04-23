import { spawn } from 'node:child_process';

for (const stream of [process.stdout, process.stderr]) {
  stream.on('error', (error) => {
    if ((error as NodeJS.ErrnoException).code !== 'EPIPE') {
      throw error;
    }
  });
}

function runCommand(command: string, allowFailure = false) {
  return new Promise<number>((resolve, reject) => {
    const child = spawn(command, {
      stdio: 'inherit',
      shell: true,
    });

    child.on('error', reject);
    child.on('close', (code) => {
      const exitCode = code ?? 0;
      if (exitCode !== 0 && !allowFailure) {
        reject(new Error(`Command failed: ${command} (${exitCode})`));
        return;
      }

      resolve(exitCode);
    });
  });
}

async function main() {
  console.log('[demo] Running OpenAI analysis test...');
  await runCommand('npm run ai:test', true);

  console.log('[demo] Starting FE demo server...');
  await runCommand('npm run dev:open');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
