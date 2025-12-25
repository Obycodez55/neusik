#!/usr/bin/env python3
"""
Neusik Audio Separation Script
Uses Demucs AI to separate vocals from background music in audio files.
"""

import sys
import json
import os
from pathlib import Path
from demucs.separate import main as separate_main


def process_audio(input_path: str, output_dir: str):
    """
    Process audio file to separate vocals from background music.
    
    Args:
        input_path: Path to input audio file
        output_dir: Directory where output will be saved
    
    Returns:
        dict: Result with status, output_path, and size (if successful)
    """
    try:
        # Validate input file exists
        input_file = Path(input_path)
        if not input_file.exists():
            return {'status': 'error', 'message': f'Input file not found: {input_path}'}
        
        # Create output directory if it doesn't exist
        output_path = Path(output_dir)
        output_path.mkdir(parents=True, exist_ok=True)
        
        # Run Demucs separation
        # --two-stems vocals: Extract only vocals
        # --mp3: Output as MP3 format
        # --mp3-bitrate 256: Set bitrate to 256 kbps
        separate_main([
            str(input_file),
            '-o', str(output_path),
            '--two-stems', 'vocals',
            '--mp3',
            '--mp3-bitrate', '256'
        ])
        
        # Find output file
        # Demucs creates: output_dir/htdemucs/[filename]/vocals.mp3
        vocals_path = output_path / 'htdemucs' / input_file.stem / 'vocals.mp3'
        
        if vocals_path.exists():
            return {
                'status': 'success',
                'output_path': str(vocals_path),
                'size': vocals_path.stat().st_size
            }
        else:
            return {'status': 'error', 'message': 'Output file not found after processing'}
            
    except Exception as e:
        return {'status': 'error', 'message': str(e)}


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

