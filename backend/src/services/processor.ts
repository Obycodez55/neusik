/**
 * Python script integration service for audio separation
 */

import { spawn } from 'child_process';
import path from 'path';
import { resolveProjectPath } from '../utils/storage';
import { ProcessingError } from '../utils/errors';

export interface ProcessingResult {
  status: 'success' | 'error';
  input?: {
    path: string;
    name: string;
    size: number;
    format: string;
  };
  output?: {
    path: string;
    size: number;
    format: string;
  };
  processing?: {
    time_seconds: number;
    model: string;
  };
  message?: string;
  error_type?: string;
  warnings?: string[];
}

/**
 * Process audio file using Python separation script
 */
export async function separateAudio(
  inputPath: string,
  outputDir: string
): Promise<ProcessingResult> {
  return new Promise((resolve, reject) => {
    // Resolve Python script path relative to project root
    const pythonScript = resolveProjectPath('python-worker/separate.py');
    const pythonExecutable = process.env.PYTHON_PATH || 'python3';

    // Spawn Python process
    const python = spawn(pythonExecutable, [pythonScript, inputPath, outputDir], {
      cwd: resolveProjectPath('.'),
    });

    let output = '';
    let errorOutput = '';

    python.stdout.on('data', (data) => {
      output += data.toString();
    });

    python.stderr.on('data', (data) => {
      errorOutput += data.toString();
      // Log Python stderr (may contain warnings or info)
      console.log('Python stderr:', data.toString());
    });

    python.on('close', async (code) => {
      if (code === 0) {
        try {
          // Parse JSON output from Python script
          const result: ProcessingResult = JSON.parse(output.trim());

          if (result.status === 'success') {
            resolve(result);
          } else {
            reject(
              new ProcessingError(
                result.message || 'Processing failed',
                {
                  error_type: result.error_type,
                  python_output: output,
                }
              )
            );
          }
        } catch (parseError) {
          reject(
            new ProcessingError('Failed to parse Python script output', {
              python_output: output,
              python_stderr: errorOutput,
              parse_error: parseError instanceof Error ? parseError.message : String(parseError),
            })
          );
        }
      } else {
        reject(
          new ProcessingError('Python script execution failed', {
            exit_code: code,
            python_stderr: errorOutput,
            python_stdout: output,
          })
        );
      }
    });

    python.on('error', (error) => {
      reject(
        new ProcessingError('Failed to spawn Python process', {
          error: error.message,
          python_executable: pythonExecutable,
          python_script: pythonScript,
        })
      );
    });
  });
}

