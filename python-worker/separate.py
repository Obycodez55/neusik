#!/usr/bin/env python3
"""
Neusik Audio Separation Script
Uses Demucs AI to separate vocals from background music in audio files.
"""

import sys
import json
import os
import time
import logging
import shutil
import contextlib
from pathlib import Path
from typing import Dict, Optional, Tuple
from io import StringIO
from demucs.separate import main as separate_main

# Configuration constants
MAX_FILE_SIZE_MB = 500
MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024
SUPPORTED_FORMATS = {
    # Audio formats
    '.mp3', '.wav', '.m4a', '.flac', '.ogg', '.aac',
    # Video formats (audio will be extracted before processing)
    '.mp4', '.mpeg', '.mpg', '.mov', '.avi', '.webm', '.mkv', '.flv', '.wmv'
}
DEMUCS_MODEL = 'htdemucs'
OUTPUT_BITRATE = '256'

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class SeparationError(Exception):
    """Base exception for audio separation errors."""
    pass


class FileNotFoundError(SeparationError):
    """Raised when input file is not found."""
    pass


class InvalidFormatError(SeparationError):
    """Raised when file format is not supported."""
    pass


class FileSizeError(SeparationError):
    """Raised when file size exceeds limits."""
    pass


class PermissionError(SeparationError):
    """Raised when file permissions are insufficient."""
    pass


class ProcessingError(SeparationError):
    """Raised when Demucs processing fails."""
    pass


def get_file_format(file_path: Path) -> Optional[str]:
    """
    Detect file format from extension.
    
    Args:
        file_path: Path to the file
        
    Returns:
        Format string (e.g., 'mp3') or None if unknown
    """
    ext = file_path.suffix.lower()
    if ext in SUPPORTED_FORMATS:
        return ext.lstrip('.')
    return None


def is_video_file(file_path: Path) -> bool:
    """
    Check if file is a video file based on extension.
    
    Note: Video files should have audio extracted before reaching this script.
    This function is mainly for validation purposes.
    
    Args:
        file_path: Path to the file
        
    Returns:
        True if file appears to be a video file
    """
    video_extensions = {'.mp4', '.mpeg', '.mpg', '.mov', '.avi', '.webm', '.mkv', '.flv', '.wmv'}
    return file_path.suffix.lower() in video_extensions


def validate_input_file(input_path: str) -> Tuple[Path, Dict]:
    """
    Validate input file exists, is readable, and has valid format.
    
    Args:
        input_path: Path to input audio file
        
    Returns:
        Tuple of (Path object, file info dict)
        
    Raises:
        FileNotFoundError: If file doesn't exist
        InvalidFormatError: If format is not supported
        FileSizeError: If file is too large
        PermissionError: If file is not readable
    """
    input_file = Path(input_path)
    
    # Check if file exists
    if not input_file.exists():
        raise FileNotFoundError(f'Input file not found: {input_path}')
    
    # Check if it's a file (not directory)
    if not input_file.is_file():
        raise ValueError(f'Path is not a file: {input_path}')
    
    # Check read permissions
    if not os.access(input_file, os.R_OK):
        raise PermissionError(f'Cannot read file (permission denied): {input_path}')
    
    # Check file format
    file_format = get_file_format(input_file)
    if not file_format:
        supported = ', '.join(sorted(SUPPORTED_FORMATS))
        raise InvalidFormatError(
            f'Unsupported file format: {input_file.suffix}. '
            f'Supported formats: {supported}'
        )
    
    # Check file size
    file_size = input_file.stat().st_size
    if file_size > MAX_FILE_SIZE_BYTES:
        size_mb = file_size / (1024 * 1024)
        max_mb = MAX_FILE_SIZE_MB
        raise FileSizeError(
            f'File too large: {size_mb:.2f}MB. Maximum size: {max_mb}MB'
        )
    
    # Get file info
    file_info = {
        'path': str(input_file),
        'name': input_file.name,
        'size': file_size,
        'format': file_format
    }
    
    logger.info(f'Validated input file: {input_file.name} ({file_size / (1024*1024):.2f}MB, {file_format})')
    
    return input_file, file_info


def validate_output_dir(output_dir: str) -> Path:
    """
    Validate and create output directory if needed.
    
    Args:
        output_dir: Path to output directory
        
    Returns:
        Path object to output directory
        
    Raises:
        PermissionError: If directory cannot be created or written to
    """
    output_path = Path(output_dir)
    
    # Try to create directory if it doesn't exist
    try:
        output_path.mkdir(parents=True, exist_ok=True)
    except OSError as e:
        raise PermissionError(f'Cannot create output directory: {output_dir}. Error: {e}')
    
    # Check write permissions
    if not os.access(output_path, os.W_OK):
        raise PermissionError(f'Cannot write to output directory (permission denied): {output_dir}')
    
    # Check available disk space (rough estimate)
    stat = shutil.disk_usage(output_path)
    free_space = stat.free
    if free_space < 100 * 1024 * 1024:  # Less than 100MB free
        logger.warning(f'Low disk space: {free_space / (1024*1024):.2f}MB available')
    
    logger.info(f'Validated output directory: {output_dir}')
    
    return output_path


def process_audio(input_path: str, output_dir: str) -> Dict:
    """
    Process audio file to separate vocals from background music.
    
    Args:
        input_path: Path to input audio file
        output_dir: Directory where output will be saved
    
    Returns:
        dict: Result with status, input/output info, and processing metadata
    """
    start_time = time.time()
    warnings = []
    
    try:
        # Validate input file
        input_file, input_info = validate_input_file(input_path)
        
        # Validate output directory
        output_path = validate_output_dir(output_dir)
        
        logger.info(f'Starting audio separation for: {input_info["name"]}')
        
        # Run Demucs separation
        # --two-stems vocals: Extract only vocals
        # --mp3: Output as MP3 format
        # --mp3-bitrate 256: Set bitrate to 256 kbps
        # Redirect stdout to stderr to prevent mixing with JSON output
        try:
            # Capture stdout and redirect to stderr so JSON output stays clean
            original_stdout = sys.stdout
            sys.stdout = sys.stderr
            try:
                separate_main([
                    str(input_file),
                    '-o', str(output_path),
                    '--two-stems', 'vocals',
                    '--mp3',
                    '--mp3-bitrate', OUTPUT_BITRATE
                ])
            finally:
                sys.stdout = original_stdout
        except Exception as e:
            raise ProcessingError(f'Demucs processing failed: {str(e)}')
        
        # Find output file
        # Demucs creates: output_dir/htdemucs/[filename]/vocals.mp3
        vocals_path = output_path / DEMUCS_MODEL / input_file.stem / 'vocals.mp3'
        
        if not vocals_path.exists():
            raise ProcessingError('Output file not found after processing. Processing may have failed.')
        
        # Get output file info
        output_size = vocals_path.stat().st_size
        processing_time = time.time() - start_time
        
        output_info = {
            'path': str(vocals_path),
            'size': output_size,
            'format': 'mp3'
        }
        
        processing_info = {
            'time_seconds': round(processing_time, 2),
            'model': DEMUCS_MODEL
        }
        
        logger.info(f'Successfully processed: {input_info["name"]} in {processing_time:.2f}s')
        
        return {
            'status': 'success',
            'input': input_info,
            'output': output_info,
            'processing': processing_info,
            'warnings': warnings
        }
        
    except SeparationError as e:
        processing_time = time.time() - start_time
        logger.error(f'Processing failed: {str(e)}')
        return {
            'status': 'error',
            'message': str(e),
            'error_type': type(e).__name__,
            'processing': {
                'time_seconds': round(processing_time, 2)
            }
        }
    except Exception as e:
        processing_time = time.time() - start_time
        logger.error(f'Unexpected error: {str(e)}', exc_info=True)
        return {
            'status': 'error',
            'message': f'Unexpected error: {str(e)}',
            'error_type': type(e).__name__,
            'processing': {
                'time_seconds': round(processing_time, 2)
            }
        }


if __name__ == '__main__':
    # Check command-line arguments
    if len(sys.argv) != 3:
        print('Usage: python separate.py <input_file> <output_dir>', file=sys.stderr)
        print('Example: python separate.py song.mp3 ./output', file=sys.stderr)
        sys.exit(1)
    
    input_file = sys.argv[1]
    output_dir = sys.argv[2]
    
    # Process audio
    result = process_audio(input_file, output_dir)
    
    # Output result as JSON
    print(json.dumps(result, indent=2))
    
    # Exit with appropriate code
    sys.exit(0 if result['status'] == 'success' else 1)
