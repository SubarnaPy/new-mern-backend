import { writeFile, mkdir, rm } from 'fs/promises';
import { exec } from 'child_process';
import { v4 as uuid } from 'uuid';
import path from 'path';
import { fileURLToPath } from 'url';
import { createContext, runInContext } from 'vm';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Language configuration
const languageConfig = {
  javascript: {
    extension: 'js',
    runCmd: () => null  // Handled with VM, so no shell command needed
  },
  python: {
    extension: 'py',
    runCmd: (filename) => {
      const isWindows = process.platform === 'win32';
      return isWindows ? `python "${filename}"` : `python3 "${filename}"`;
    },
  },
  cpp: {
    extension: 'cpp',
    runCmd: (filename) => {
      const isWindows = process.platform === 'win32';
      const outputFile = isWindows ? 'out.exe' : 'out';
      const runFile = isWindows ? 'out.exe' : './out';
      return `g++ "${filename}" -o ${outputFile} && ${runFile}`;
    },
  },
  c: {
    extension: 'c',
    runCmd: (filename) => {
      const isWindows = process.platform === 'win32';
      const outputFile = isWindows ? 'out.exe' : 'out';
      const runFile = isWindows ? 'out.exe' : './out';
      return `gcc "${filename}" -o ${outputFile} && ${runFile}`;
    },
  },
  java: {
    extension: 'java',
    runCmd: (filename) => {
      const className = path.basename(filename, '.java');
      return `javac "${filename}" && java ${className}`;
    },
  },
};

export const executeCode = async (language, code, input = '') => {
  if (!languageConfig[language]) {
    throw new Error('Unsupported language');
  }

  const jobId = uuid();
  const tempDir = path.join(__dirname, 'temp', jobId);
  const ext = languageConfig[language].extension;
  const filename = `Main.${ext}`;
  const filePath = path.join(tempDir, filename);
  const inputPath = path.join(tempDir, 'input.txt');

  try {
    await mkdir(tempDir, { recursive: true });
    await writeFile(filePath, code);
    await writeFile(inputPath, input);

    if (language === 'javascript') {
      return await new Promise((resolve, reject) => {
        const output = [];
        const sandbox = {
          console: {
            log: (...args) => output.push(args.join(' ')),
            error: (...args) => output.push(args.join(' ')),
          },
          input,
          require,
        };
        try {
          runInContext(code, createContext(sandbox));
          resolve(output.join('\n') || 'JavaScript executed with no output.');
        } catch (err) {
          reject(`Error executing JavaScript code: ${err.message}`);
        }
      });
    } else {
      const command = languageConfig[language].runCmd(filePath);
      return await new Promise((resolve, reject) => {
        exec(command, { cwd: tempDir, timeout: 10000 }, (err, stdout, stderr) => {
          if (err) {
            reject(`Execution error: ${err.message}\n${stderr}`);
          } else {
            resolve(stdout || stderr);
          }
        });
      });
    }
  } catch (error) {
    return `Execution failed: ${error.message}`;
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
};
