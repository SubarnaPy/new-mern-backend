import { writeFile, mkdir, rm } from 'fs/promises';
import { exec } from 'child_process';
import { v4 as uuid } from 'uuid';
import path from 'path';
import { fileURLToPath } from 'url';
import { createContext, runInContext } from 'vm';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const languageConfig = {
  javascript: {
    extension: 'js',
    runCmd: (filename) => `node ${filename}`, // fallback if needed
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

    // === JavaScript execution in a VM sandbox ===
    if (language === 'javascript') {
      let output = [];

      const sandbox = {
        console: {
          log: (...args) => output.push(args.join(' ')),
          error: (...args) => output.push(args.join(' ')),
        },
        input, // optionally pass input to JS
      };

      try {
        runInContext(code, createContext(sandbox));
        return output.join('\n') || 'JavaScript code executed.';
      } catch (err) {
        return `Error executing JavaScript code: ${err.message}`;
      }
    }

    // === Other languages ===
    const command = languageConfig[language].runCmd(filePath);

    return await new Promise((resolve, reject) => {
      exec(command, { cwd: tempDir, timeout: 10000 }, (err, stdout, stderr) => {
        if (err) {
          reject(`Execution error: ${err.message}\n${stderr}`);
        } else {
          resolve(stdout || stderr || 'No output');
        }
      });
    });
  } catch (error) {
    return `Execution failed: ${error.message}`;
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
};
