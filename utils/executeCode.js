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
    runCmd: (filename) => `node ${filename}`,
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
    runCmd: () => null, // handled separately for Java
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
      // JavaScript sandbox using vm
      const sandbox = {
        console,
        input,
      };

      return await new Promise((resolve, reject) => {
        try {
          const context = createContext(sandbox);
          const result = runInContext(code, context);
          resolve(result ?? 'JavaScript code executed.');
        } catch (err) {
          reject(`JavaScript error: ${err.message}`);
        }
      });
    }

    if (language === 'java') {
      // Java: compile and execute separately
      const compileCmd = `javac ${filename}`;
      const className = path.basename(filename, '.java');
      const runCmd = `java ${className}`;

      return await new Promise((resolve, reject) => {
        exec(compileCmd, { cwd: tempDir }, (compileErr, _, compileStderr) => {
          if (compileErr) {
            console.error(`Compilation error: ${compileErr}`);
            console.error(`Compilation stderr: ${compileStderr}`);
            return reject(`Java compilation error:\n${compileStderr}`);
          }

          exec(runCmd, { cwd: tempDir }, (runErr, stdout, stderr) => {
            if (runErr) {
              console.error(`Execution error: ${runErr}`);
              console.error(`Execution stderr: ${stderr}`);
              return reject(`Java execution error:\n${stderr}`);
            }
            resolve(stdout || stderr || 'No output');
          });
        });
      });
    }

    // Other languages
    const command = languageConfig[language].runCmd(filePath);

    return await new Promise((resolve, reject) => {
      exec(command, { cwd: tempDir, timeout: 10000 }, (err, stdout, stderr) => {
        if (err) {
          return reject(`Execution error: ${err.message}\n${stderr}`);
        }
        resolve(stdout || stderr || 'No output');
      });
    });
  } catch (error) {
    console.error('Execution failed:', error);
    return `Execution failed: ${error.message}`;
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
};
