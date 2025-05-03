

import { writeFile, mkdir, rm } from 'fs/promises';
import { exec } from 'child_process';
import { v4 as uuid } from 'uuid';
import path from 'path';
import { fileURLToPath } from 'url';
import { createContext, runInContext } from 'vm';  // Node.js VM module for sandboxing

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Language configuration for different compilers
const languageConfig = {
    javascript: {
      extension: 'js',
      runCmd: (filename) => `node ${filename}`,
    },
    python: {
      extension: 'py',
      runCmd: (filename) => {
        const isWindows = process.platform === 'win32';
        const quotedFilename = `"${filename}"`;
        return isWindows ? `python ${quotedFilename}` : `python3 ${quotedFilename}`;
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
    }
  };
  
// Main function to execute code based on the selected language
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
    console.log(`Creating temporary directory: ${tempDir}`);
    // Create temp dir and write code and input files
    await mkdir(tempDir, { recursive: true });
    console.log(`Writing code to ${filePath}`);
    await writeFile(filePath, code);
    console.log(`Writing input to ${inputPath}`);
    await writeFile(inputPath, input);

    // If executing JavaScript code, run it in a sandboxed VM environment
    if (language === 'javascript') {
      const sandbox = createContext({
        console,  // make console available in the sandbox
        input,    // pass input to the sandbox environment
        require,  // allow npm modules in the sandbox
      });

      return await new Promise((resolve, reject) => {
        try {
          console.log(`Running JavaScript code in sandbox`);
          runInContext(code, sandbox);
          resolve("JavaScript code executed successfully.");
        } catch (err) {
          reject(`Error executing JavaScript code: ${err.message}`);
        }
      });
    } else {
      // For other languages (Python, C++, etc.)
      const command = languageConfig[language].runCmd(filePath);
      console.log(`Running command: ${command}`);

      return await new Promise((resolve, reject) => {
        exec(command, { cwd: tempDir, timeout: 10000 }, (err, stdout, stderr) => { // Increased timeout
          if (err) {
            console.error(`Execution error: ${err.message}`);
            console.error(`stderr: ${stderr}`);
            reject(`Execution error: ${err.message}\n${stderr}`);
          } else {
            console.log(`stdout: ${stdout}`);
            resolve(stdout || stderr); // return output or warnings
          }
        });
      });
    }
  } catch (error) {
    console.error(`Execution failed: ${error.message}`);
    return `Execution failed: ${error.message}`;
  } finally {
    console.log(`Cleaning up temporary directory: ${tempDir}`);
    // Clean up the temp directory after execution
    await rm(tempDir, { recursive: true, force: true });
  }
};
