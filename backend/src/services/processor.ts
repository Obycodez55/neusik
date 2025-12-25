/**
 * Python script integration service for audio separation
 */

import { spawn } from 'child_process';
import path from 'path';
import { resolveProjectPath, detectMediaType, getTempAudioPath, cleanupFile } from '../utils/storage';
import { ProcessingError } from '../utils/errors';
import { extractAudioFromVideo, isVideoFileByExtension } from './video-extractor';

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
  originalFileType?: 'audio' | 'video';
}

/**
 * Detect file type (audio or video)
 */
async function detectFileType(filePath: string): Promise<'audio' | 'video'> {
  // First check by extension (fast)
  if (isVideoFileByExtension(filePath)) {
    return 'video';
  }
  
  // Use storage utility for detection
  return detectMediaType(filePath);
}

/**
 * Process audio file using Python separation script
 * Handles both audio and video files (extracts audio from video first)
 */
export async function separateAudio(
  inputPath: string,
  outputDir: string,
  isVideo?: boolean
): Promise<ProcessingResult> {
  let actualInputPath = inputPath;
  let extractedAudioPath: string | undefined;
  let fileType: 'audio' | 'video' = 'audio';
  
  try {
    // Detect file type if not provided
    if (isVideo === undefined) {
      fileType = await detectFileType(inputPath);
    } else {
      fileType = isVideo ? 'video' : 'audio';
    }
    
    // If video, extract audio first
    if (fileType === 'video') {
      extractedAudioPath = getTempAudioPath(inputPath);
      
      try {
        const extractionResult = await extractAudioFromVideo(inputPath, extractedAudioPath);
        actualInputPath = extractionResult.audioPath;
      } catch (error) {
        // Clean up on extraction failure
        if (extractedAudioPath) {
          await cleanupFile(extractedAudioPath).catch(() => {});
        }
        throw error;
      }
    }
    
    // Process the audio file (either original or extracted)
    return await processAudioFile(actualInputPath, outputDir, fileType);
  } finally {
    // Clean up extracted audio file after processing
    if (extractedAudioPath) {
      await cleanupFile(extractedAudioPath).catch((err) => {
        console.error('Failed to cleanup extracted audio file:', err);
      });
    }
  }
}

/**
 * Process audio file using Python separation script
 */
async function processAudioFile(
  inputPath: string,
  outputDir: string,
  originalFileType: 'audio' | 'video'
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
          
          // Add original file type to result
          result.originalFileType = originalFileType;

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

