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
    run: (filePath) => `node "${filePath}"`
  },
  python: {
    extension: 'py',
    run: (filePath) => `python3 "${filePath}"`
  },
  c: {
    extension: 'c',
    run: (filePath) => `gcc "${filePath}" -o out && ./out`
  },
  cpp: {
    extension: 'cpp',
    run: (filePath) => `g++ "${filePath}" -o out && ./out`
  },
  java: {
    extension: 'java',
    run: (filePath) => {
      const className = path.basename(filePath, '.java');
      return `javac "${filePath}" && java ${className}`;
    }
  }
};

export const executeCode = async (language, code, input = '') => {
  if (!languageConfig[language]) {
    throw new Error('Unsupported language');
  }

  const jobId = uuid();
  const tempDir = path.join(__dirname, 'temp', jobId);
  const ext = languageConfig[language].extension;
  const filename = language === 'java' ? 'Main.java' : `main.${ext}`;
  const filePath = path.join(tempDir, filename);

  try {
    await mkdir(tempDir, { recursive: true });
    await writeFile(filePath, code);

    if (language === 'javascript') {
      // JavaScript sandbox with proper output capture
      let output = '';
      const sandbox = {
        console: {
          log: (...args) => output += args.join(' ') + '\n'
        },
        setTimeout: () => {}
      };
      
      runInContext(code, createContext(sandbox));
      return output.trim();
    }

    const command = languageConfig[language].run(filePath);
    return await new Promise((resolve, reject) => {
      exec(command, {
        cwd: tempDir,
        timeout: 5000,
        killSignal: 'SIGKILL'
      }, (error, stdout, stderr) => {
        if (error) {
          // Handle specific Java package errors
          if (language === 'java' && stderr.includes('Could not find or load main')) {
            reject('Java error: Main class not found. Class name must match filename (Main.java)');
          } else {
            reject(stderr || error.message);
          }
        } else {
          resolve(stdout.trim() || 'No output');
        }
      });
    });

  } catch (error) {
    // Handle both Error objects and string sages
    const message = error instanceof Error ? error.message : error;
    throw new Error(`Execution failed: ${message}`);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
};